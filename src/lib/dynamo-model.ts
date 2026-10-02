/**
 * DynamoDB-backed replacement for the Mongoose models.
 *
 * Why: the app's data layer previously required a MongoDB server. The home
 * server instead runs floci (an AWS emulator) whose DynamoDB service is the
 * only persistent document store available, so `db.ts` / the `models/*`
 * schemas are replaced by this adapter.
 *
 * Design contract — the call sites in `src/app/**` are unchanged. This module
 * reimplements the subset of the Mongoose API they use, with the same names
 * and return shapes:
 *
 *   create(doc)                       -> Promise<Doc>
 *   find(filter?, options?)           -> Promise<Doc[]>
 *   findOne(filter)                   -> Promise<Doc | null>
 *   findById(id)                      -> Promise<Doc | null>
 *   findByIdAndUpdate(id, patch)      -> Promise<Doc | null>
 *   findByIdAndDelete(id)             -> Promise<Doc | null>
 *   countDocuments(filter?)           -> Promise<number>
 *
 * Chaining: find()/findOne() return a Query that is awaitable and supports
 * .sort(), .select(), .populate() and .lean() to mirror the original code.
 * A Doc supports .toObject(), .save() and .id / ._id.
 *
 * Differences from real MongoDB worth knowing:
 *  - Filters are equality/AND only. No $or, regex or range operators; the
 *    call sites do not use them.
 *  - `sort` is applied client-side after a Scan. Fine at this data volume.
 *  - `populate` resolves refs client-side by loading the referenced table.
 */

import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Schema definition (mirrors the Mongoose schemas it replaces)
// ---------------------------------------------------------------------------

export interface FieldDef {
  type: "string" | "number" | "boolean" | "date" | "objectid" | "object";
  required?: boolean;
  default?: unknown;
  ref?: string; // model name for ObjectId refs (populate)
}

export interface SchemaDef {
  [field: string]: FieldDef;
}

const objectId = (): string => crypto.randomBytes(12).toString("hex");

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export class Doc {
  /**
   * Schema fields are reached as plain properties (doc.email, user.password).
   * The Proxy in the constructor resolves them at runtime; this signature
   * tells TypeScript the same thing so call sites keep compiling unchanged.
   */
  [key: string]: any;

  // Declared so a Doc satisfies the structural AccountLike type used by the
  // token-refresh helpers. Values come from the Proxy above, not these fields.
  declare email: string;
  declare accessToken: string;
  declare refreshToken: string;
  declare projectId: string;
  declare tokenExpiresAt: Date;

  /** Plain-object fields of this document (no _id, no __v). */
  private plain: Record<string, unknown>;
  /** Table this doc lives in — needed for save(). */
  readonly table: string;
  /** Model name. Public: a Tunnel document has its own `model` field, and
   *  call sites read `tunnel.model`, so this must not shadow it. */
  readonly modelName: string;
  /** Proxy target so `doc.field` reads/writes the underlying plain object. */
  private proxy: Doc;

  constructor(table: string, modelName: string, plain: Record<string, unknown>) {
    this.table = table;
    this.modelName = modelName;
    this.plain = plain;
    // Mongoose documents expose schema fields as plain properties, and call
    // sites read them directly (user.password, account.email, ...). A Proxy
    // keeps that working without copying the schema onto every instance.
    this.proxy = new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in target) return Reflect.get(target, prop, receiver);
        if (typeof prop === "string" && prop in target.plain) return target.plain[prop];
        return undefined;
      },
      set(target, prop, value, receiver) {
        if (typeof prop === "string" && prop in target.plain) {
          target.plain[prop] = value;
          return true;
        }
        if (typeof prop === "string" && !(prop in target)) {
          target.plain[prop] = value;
          return true;
        }
        return Reflect.set(target, prop, value, receiver);
      },
      has(target, prop) {
        if (prop in target) return true;
        return typeof prop === "string" && prop in target.plain;
      },
    });
    return this.proxy;
  }

  get _id(): string {
    return this.plain._id as string;
  }

  get id(): string {
    return this.plain._id as string;
  }

  get __v(): number {
    return (this.plain.__v as number) ?? 0;
  }

  toObject(): Record<string, unknown> {
    return { ...this.plain };
  }

  toJSON(): Record<string, unknown> {
    return this.toObject();
  }

  /** Persist this document's current field values. */
  async save(): Promise<this> {
    const item = { ...this.plain };
    // Strip undefined so a field being unset does not overwrite with null.
    for (const k of Object.keys(item)) if (item[k] === undefined) delete item[k];
    await getClient().send(new PutCommand({ TableName: this.table, Item: toDynamoValue(item) as Record<string, unknown> }));
    return this;
  }
}

// ---------------------------------------------------------------------------
// Query (awaitable, chainable)
// ---------------------------------------------------------------------------

type SortSpec = Record<string, 1 | -1>;
type Filter = Record<string, unknown>;

/** Mongoose accepts both a projection string and an inclusion map. */
type Projection = string | Record<string, 0 | 1>;

function projectionToSelect(projection: Projection | undefined): string | null {
  if (!projection) return null;
  if (typeof projection === "string") return projection;
  const keys = Object.keys(projection);
  // { _id: 0, a: 1, b: 1 } mixes inclusion with an exclusion: build an
  // inclusion list, dropping any field explicitly set to 0.
  const incl = keys.filter((k) => projection[k] === 1 && k !== "_id");
  const excl = keys.filter((k) => projection[k] === 0);
  if (!incl.length) return excl.length ? excl.map((f) => `-${f}`).join(" ") : null;
  const parts = incl.slice();
  for (const f of excl) parts.push(`-${f}`);
  return parts.join(" ");
}

class Query {
  private filter: Filter;
  private sortSpec: SortSpec | null = null;
  private selectSpec: string | null = null; // "-password"
  private populateSpec: { field: string; select?: string } | null = null;
  private leanFlag = false;

  constructor(
    private model: Model,
    filter: Filter,
    private opts?: { projection?: Projection; sort?: SortSpec }
  ) {
    this.filter = filter;
    const sel = projectionToSelect(opts?.projection);
    if (sel) this.selectSpec = sel;
    if (opts?.sort) this.sortSpec = opts.sort;
  }

  sort(spec: SortSpec): this {
    this.sortSpec = spec;
    return this;
  }

  select(spec: string): this {
    this.selectSpec = spec;
    return this;
  }

  populate(field: string, select?: string): this {
    this.populateSpec = { field, select };
    return this;
  }

  lean(): this {
    this.leanFlag = true;
    return this;
  }

  private async runAll(): Promise<Doc[]> {
    const items = await this.model.scanItems(this.filter);
    let docs = items.map((it) => this.model.toDoc(it));

    if (this.populateSpec) {
      const { field, select } = this.populateSpec;
      const refModel = this.model.refModelFor(field);
      if (refModel) {
        const wanted = [...new Set(docs.map((d) => (d.toObject()[field] as string) || "").filter(Boolean))];
        const refs = await refModel.fetchByIds(wanted);
        const byId = new Map(refs.map((r) => [r._id, r.toObject()]));
        docs = docs.map((d) => {
          const ref = byId.get(d.toObject()[field] as string);
          if (!ref) return d;
          const projected = select
            ? pickFields(ref, select.split(/\s+/).filter(Boolean))
            : ref;
          // Non-const: we must hand back an object whose .id/._id still work.
          const merged = new Doc(this.model.table, this.model.name, {
            ...d.toObject(),
            [field]: projected,
          });
          return merged;
        });
      }
    }

    if (this.sortSpec) {
      const spec = this.sortSpec;
      docs = [...docs].sort((a, b) => {
        const A = a.toObject();
        const B = b.toObject();
        for (const [k, dir] of Object.entries(spec)) {
          const av = A[k];
          const bv = B[k];
          if (av === bv) continue;
          if (av === undefined || av === null) return 1;
          if (bv === undefined || bv === null) return -1;
          const cmp = av instanceof Date && bv instanceof Date
            ? av.getTime() - bv.getTime()
            : av === bv ? 0
            : av < bv ? -1 : 1;
          return dir === -1 ? -cmp : cmp;
        }
        return 0;
      });
    }

    if (this.selectSpec) docs = docs.map((d) => this.model.projDoc(d, this.selectSpec!));
    return docs;
  }

  async exec(): Promise<Doc[]> {
    return this.runAll();
  }

  then<TResult1 = Doc[], TResult2 = never>(
    onfulfilled?: ((value: Doc[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.runAll().then(onfulfilled, onrejected);
  }
}

/** Helper for populate field selection. */
function pickFields(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) if (f in obj) out[f] = obj[f];
  if ("_id" in obj) out._id = obj._id;
  return out;
}

/**
 * A findOne/findById query: same chaining as Query, but resolves to one
 * document. Mongoose's `.then()` on a findOne yields the single result, which
 * the call sites rely on when they `await` it directly.
 */
class QueryOne {
  private inner: Query;
  /** Set by .select(); applied after exec() so it also works on writes. */
  pendingSelect: string | null = null;
  /** Overridden by write queries (findByIdAndUpdate) to run their own action. */
  private execOverride: (() => Promise<Doc | null>) | null = null;

  constructor(model: Model, filter: Filter) {
    this.inner = new Query(model, filter);
  }

  sort(spec: SortSpec): this {
    this.inner.sort(spec);
    return this;
  }

  select(spec: string): this {
    this.pendingSelect = spec;
    this.inner.select(spec);
    return this;
  }

  populate(field: string, select?: string): this {
    this.inner.populate(field, select);
    return this;
  }

  lean(): this {
    this.inner.lean();
    return this;
  }

  /** Replace the resolution action (used by write queries). */
  overrideExec(fn: () => Promise<Doc | null>): this {
    this.execOverride = fn;
    return this;
  }

  async exec(): Promise<Doc | null> {
    if (this.execOverride) return this.execOverride();
    const docs = await this.inner.exec();
    return docs[0] ?? null;
  }

  then<TResult1 = Doc | null, TResult2 = never>(
    onfulfilled?: ((value: Doc | null) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ): Promise<Doc | null | TResult> {
    return this.exec().catch(onrejected);
  }
}

/**
 * Expand a patch object with Mongoose dot-notation keys.
 *
 * `{ quotas: {a:1}, "quotas.b": 2 }` -> `[["quotas.a",1],["quotas.b",2]]`
 *
 * Without this, a DynamoDB SET on "quotas" would replace the entire map and
 * silently drop sibling quota entries, so quota tracking would lose data.
 */
function flattenPatch(patch: Record<string, unknown>, prefix = ""): [string, unknown][] {
  const out: [string, unknown][] = [];
  for (const [k, v] of Object.entries(patch)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
      const nested = flattenPatch(v as Record<string, unknown>, path);
      // An empty object is a legitimate value (clear the map), not a no-op.
      if (nested.length) out.push(...nested);
      else out.push([path, v]);
    } else {
      out.push([path, v]);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Marshalling: plain JS <-> DynamoDB attribute-value form
// ---------------------------------------------------------------------------

export function toAttr(v: unknown): unknown {
  if (v === null || v === undefined) return { NULL: true };
  if (typeof v === "string") return { S: v };
  if (typeof v === "boolean") return { BOOL: v };
  if (typeof v === "number") {
    if (Number.isNaN(v)) return { S: "NaN" };
    return { N: String(v) };
  }
  if (v instanceof Date) return { N: String(v.getTime()) };
  if (Array.isArray(v)) return { L: v.map(toAttr) };
  if (typeof v === "object") return { M: objToAttr(v as Record<string, unknown>) };
  return { S: String(v) };
}

function objToAttr(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = toAttr(v);
  return out;
}

/**
 * Rehydrate a DynamoDB item into plain JS, using the schema for types.
 *
 * Note: DynamoDBDocumentClient already unmarshals attribute values, so items
 * arrive as plain JS (numbers as `number`, not `{N:"..."}`). The schema still
 * has to be applied for `date` fields, which come back as epoch millis and must
 * be rehydrated into Date objects — several call sites do date comparisons and
 * `.toISOString()` on them.
 */
function fromItem(item: Record<string, unknown>, schema: SchemaDef, models: Record<string, Model>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, raw] of Object.entries(item)) {
    if (k === "__v") {
      out.__v = Number(raw);
      continue;
    }
    const field = schema[k];
    if (field?.type === "date" && raw !== null && raw !== undefined) {
      // Writes go through the document client, which stores a Date as an ISO
      // string (Date has no numeric value, so marshalling picks S). Accept
      // either form on the way back.
      out[k] = raw instanceof Date ? raw : new Date(typeof raw === "number" ? raw : String(raw));
      continue;
    }
    if (field?.type === "objectid" && raw !== null && raw !== undefined) {
      out[k] = String(raw);
      continue;
    }
    out[k] = fromAttr(raw, field, models);
  }
  return out;
}

function fromAttr(raw: unknown, field: FieldDef | undefined, models: Record<string, Model>): unknown {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw !== "object") return raw;
  const a = raw as Record<string, unknown>;

  // __id attribute: a 24-hex ObjectId string stored as a DynamoDB string.
  if ("__id" in a) {
    return field?.type === "objectid" ? String(a.__id) : fromAttr(a.__id, field, models);
  }
  if ("S" in a) return a.S;
  if ("BOOL" in a) return a.BOOL;
  if ("N" in a) {
    const n = Number(a.N);
    if (field?.type === "date") return new Date(n);
    return n;
  }
  if ("NULL" in a) return null;
  if ("L" in a) return (a.L as unknown[]).map((x) => fromAttr(x, field, models));
  if ("M" in a) {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(a.M as Record<string, unknown>)) o[k] = fromAttr(v, field, models);
    return o;
  }
  if ("SS" in a) return a.SS;
  if ("NS" in a) return (a.NS as string[]).map(Number);
  return raw;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

let docClient: DynamoDBDocumentClient | null = null;
let clientConfigKey = "";

/**
 * Build the DynamoDB client from env. Default endpoint is the floci core
 * (host port 14566), so a single client works both in Docker (service name
 * `floci`) and on the host (tailscale IP).
 */
function getClient(): DynamoDBDocumentClient {
  const endpoint = process.env.FLOCI_ENDPOINT || "http://floci:4566";
  const region = process.env.AWS_REGION || "us-east-1";
  const key = `${endpoint}|${region}`;
  const existingClient = docClient;
  if (existingClient !== null && clientConfigKey === key) return existingClient;

  const cfg: DynamoDBClientConfig = {
    region,
    endpoint,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
    },
  };
  // convertClassInstanceToMap would turn a Date into an empty map, which
  // round-trips as `createdAt: null`. Dates are serialised explicitly instead
  // (see toDynamoValue), so the class-instance conversion is not needed here.
  const created = DynamoDBDocumentClient.from(new DynamoDBClient(cfg), {
    marshallOptions: { removeUndefinedValues: true, convertClassInstanceToMap: false },
  });
  docClient = created;
  clientConfigKey = key;
  return created;
}

/** Convert a value for DynamoDB: Date -> ISO string, drop undefined. */
function toDynamoValue(v: unknown): unknown {
  if (v instanceof Date) return v.toISOString();
  if (v === undefined) return undefined;
  if (v !== null && typeof v === "object" && !Array.isArray(v)) {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      const c = toDynamoValue(val);
      if (c !== undefined) out[k] = c;
    }
    return out;
  }
  return v;
}

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

export class Model {
  private ready: Promise<void> | null = null;
  /** Schema cache: model name -> schema, so ref fields can be resolved. */
  constructor(
    readonly name: string,
    readonly table: string,
    private schema: SchemaDef,
    private models: Record<string, Model> = {}
  ) {}

  registerModels(models: Record<string, Model>): void {
    this.models = models;
  }

  /** Create the table on first use; also backfills defaults for new items. */
  private ensure(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        const c = getClient();
        try {
          await c.send(new ScanCommand({ TableName: this.table, Limit: 1 }));
        } catch {
          try {
            const { CreateTableCommand } = await import("@aws-sdk/client-dynamodb");
            await c.send(
              new CreateTableCommand({
                TableName: this.table,
                KeySchema: [{ AttributeName: "_id", KeyType: "HASH" }],
                AttributeDefinitions: [{ AttributeName: "_id", AttributeType: "S" }],
                BillingMode: "PAY_PER_REQUEST",
              })
            );
          } catch (e) {
            // A concurrent process may have created it; re-probe once.
            await c.send(new ScanCommand({ TableName: this.table, Limit: 1 }));
          }
        }
      })().catch((e) => {
        this.ready = null; // allow a later retry
        throw e;
      });
    }
    return this.ready;
  }

  private applyDefaults(doc: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, f] of Object.entries(this.schema)) {
      if (k in doc && doc[k] !== undefined) {
        out[k] = f.type === "objectid" && doc[k] ? String(doc[k]) : doc[k];
        continue;
      }
      if (f.default !== undefined) {
        out[k] = typeof f.default === "function" ? (f.default as () => unknown)() : f.default;
      } else if (f.type === "date") {
        out[k] = new Date(0);
      } else if (f.type === "number") {
        out[k] = 0;
      } else if (f.type === "boolean") {
        out[k] = false;
      } else if (f.type === "object") {
        out[k] = {};
      }
    }
    // Preserve unknown fields the caller set that the schema does not list.
    for (const [k, v] of Object.entries(doc)) if (!(k in out)) out[k] = v;
    return out;
  }

  toDoc(item: Record<string, unknown>): Doc {
    return new Doc(this.table, this.name, fromItem(item, this.schema, this.models));
  }

  projDoc(d: Doc, select: string): Doc {
    const o = d.toObject();
    if (select.startsWith("-")) {
      const drop = select.slice(1).split(/\s+/).filter(Boolean);
      for (const f of drop) delete o[f];
    } else {
      const keep = select.split(/\s+/).filter(Boolean);
      const out: Record<string, unknown> = {};
      for (const f of keep) if (f in o) out[f] = o[f];
      out._id = o._id;
      return new Doc(this.table, this.name, out);
    }
    return new Doc(this.table, this.name, o);
  }

  /** Resolve a field's ref model name (e.g. proxyId -> Proxy). */
  refModelFor(field: string): Model | null {
    const f = this.schema[field];
    if (!f?.ref) return null;
    return this.models[f.ref] ?? null;
  }

  matchesFilter(item: Record<string, unknown>, filter: Filter): boolean {
    for (const [k, want] of Object.entries(filter)) {
      if (k === "_id") {
        if (String(item._id) !== String(want)) return false;
        continue;
      }
      const got = item[k];
      if (got instanceof Date && want instanceof Date) {
        if (got.getTime() !== want.getTime()) return false;
        continue;
      }
      if (got !== want) return false;
    }
    return true;
  }

  async scanItems(filter: Filter = {}): Promise<Record<string, unknown>[]> {
    await this.ensure();
    const c = getClient();
    const out: Record<string, unknown>[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;
    do {
      const page = await c.send(
        new ScanCommand({ TableName: this.table, ExclusiveStartKey })
      );
      for (const it of page.Items ?? []) {
        const plain = fromItem(it, this.schema, this.models);
        if (this.matchesFilter(plain, filter)) out.push(it);
      }
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return out;
  }

  async fetchByIds(ids: string[]): Promise<Doc[]> {
    if (!ids.length) return [];
    await this.ensure();
    const c = getClient();
    const docs: Doc[] = [];
    // BatchGetItem accepts max 100 keys.
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const res = await c.send(
        new BatchGetCommand({ RequestItems: { [this.table]: { Keys: batch.map((id) => ({ _id: id })) } } })
      );
      for (const it of res.Responses?.[this.table] ?? []) docs.push(this.toDoc(it));
    }
    return docs;
  }

  // --- Mongoose-compatible surface -----------------------------------------

  find(filter: Filter = {}, opts?: { projection?: Projection; sort?: SortSpec }): Query {
    return new Query(this, filter, opts);
  }

  /**
   * Awaitable, chainable, and resolves to a single Doc | null. The call sites
   * use `findById(id).populate(...)` and `findById(id).select(...)`, so the
   * result must stay a Query rather than a plain Promise.
   */
  findById(id: unknown): QueryOne {
    return new QueryOne(this, { _id: String(id) });
  }

  findOne(filter: Filter = {}): QueryOne {
    return new QueryOne(this, filter);
  }

  /** Await-only variant for internal use. */
  async fetchById(id: unknown): Promise<Doc | null> {
    const [d] = await this.find({ _id: String(id) }).exec();
    return d ?? null;
  }

  async create(doc: Record<string, unknown>): Promise<Doc> {
    await this.ensure();
    const plain = this.applyDefaults(doc);
    const _id = (plain._id as string) || objectId();
    const full = toDynamoValue({ ...plain, _id, __v: 0 }) as Record<string, unknown>;
    const c = getClient();
    await c.send(new PutCommand({ TableName: this.table, Item: full }));
    // Return the in-memory form so the caller sees real Date objects.
    return this.toDoc({ ...plain, _id, __v: 0 });
  }

  async countDocuments(filter: Filter = {}): Promise<number> {
    const items = await this.scanItems(filter);
    return items.length;
  }

  /**
   * Insert several documents at once. Mongoose returns the created documents
   * with generated ids; DynamoDB has no multi-write, so this issues a batch of
   * Puts. Fine at this volume; a production path would use BatchWriteItem.
   */
  async insertMany(docs: Record<string, unknown>[]): Promise<Doc[]> {
    const out: Doc[] = [];
    for (const d of docs) out.push(await this.create(d));
    return out;
  }

  /** Remove every document matching the filter. Returns the rows deleted. */
  async deleteMany(filter: Filter = {}): Promise<number> {
    const items = await this.scanItems(filter);
    if (!items.length) return 0;
    const c = getClient();
    for (const it of items) {
      const id = it._id;
      if (typeof id === "string") {
        await c.send(new DeleteCommand({ TableName: this.table, Key: { _id: id } }));
      }
    }
    return items.length;
  }

  /**
   * Mongoose-compatible update. Chainable like a Query (call sites do
   * `findByIdAndUpdate(...).exec()` and `.select(...)`), so this is a QueryOne
   * subclass that performs the write on exec/await.
   */
  findByIdAndUpdate(
    id: unknown,
    patch: Record<string, unknown>,
    opts?: { new?: boolean }
  ): QueryOne {
    const key = String(id);
    const model = this;
    const q = new QueryOne(this, { _id: key });
    const run = async (): Promise<Doc | null> => {
      await model.ensure();

      // A missing key means the item does not exist. Mongoose's
      // findByIdAndUpdate returns null there; a bare DynamoDB UpdateExpression
      // would silently create the item instead.
      const existing = await model.fetchById(key);
      if (!existing) return null;

      // Flatten dotted keys ("quotas.gemini") so nested maps update properly.
      // A plain {"quotas": {...}} patch replaces the whole map, which would
      // discard sibling quota keys.
      const ops = flattenPatch(patch);
      const names: Record<string, string> = {};
      const values: Record<string, unknown> = { ":zero": 0, ":one": 1 };
      const sets: string[] = [];

      for (const [path, val] of ops) {
        if (val === undefined) continue;
        const segs = path.split(".");
        const parent = segs.slice(0, -1);
        const leaf = segs[segs.length - 1];

        let target = "";
        if (parent.length) {
          // Build #p0.#p1 = :pv (the parent object) when it does not exist.
          const nameToks = parent.map((p, i) => {
            names[`#pn${i}`] = p;
            return `#pn${i}`;
          });
          const valTok = `:pv${sets.length}`;
          values[valTok] = {};
          target = `if_not_exists(${nameToks.join(".")}, ${valTok}).`;
        }
        names[`#fn${sets.length}`] = leaf;
        values[`:v${sets.length}`] = toDynamoValue(val);
        sets.push(`${target}#fn${sets.length} = :v${sets.length}`);
      }

      if (!sets.length) return existing;

      const c = getClient();
      const res = await c.send(
        new UpdateCommand({
          TableName: this.table,
          Key: { _id: key },
          UpdateExpression: `SET ${sets.join(", ")}, __v = if_not_exists(__v, :zero) + :one`,
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
          ReturnValues: "ALL_NEW",
        })
      );
      return res.Attributes ? this.toDoc(res.Attributes) : null;
    };

    return q.overrideExec(run);
  }

  async findByIdAndDelete(id: unknown): Promise<Doc | null> {
    await this.ensure();
    const key = String(id);
    const existing = await this.fetchById(key);
    if (!existing) return null;
    const c = getClient();
    await c.send(new DeleteCommand({ TableName: this.table, Key: { _id: key } }));
    return existing;
  }
}

import { BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { CreateTableCommand } from "@aws-sdk/client-dynamodb";

export function createModel(name: string, table: string, schema: SchemaDef, all: Record<string, Model>): Model {
  return new Model(name, table, schema, all);
}

/**
 * Validate a document id.
 *
 * Replaces `mongoose.Types.ObjectId.isValid(id)`, which call sites still use to
 * tell a real id apart from a mock/slug before querying. Ids generated here are
 * 24 hex characters, the same shape as a Mongo ObjectId, so the same rule
 * applies.
 */
export function isValidId(id: unknown): boolean {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}
