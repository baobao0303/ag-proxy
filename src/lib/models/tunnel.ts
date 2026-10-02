import { createModel, Model, SchemaDef } from "../dynamo-model";
import crypto from "crypto";

/** DynamoDB-backed replacement for the Mongoose Tunnel model. */

const TunnelSchema: SchemaDef = {
  name: { type: "string", required: true },
  model: { type: "string", required: true },
  apiKey: {
    type: "string",
    required: true,
    default: () => "sk-" + crypto.randomBytes(24).toString("hex"),
  },
  tokenLimit: { type: "number", default: 0 },
  tokensUsed: { type: "number", default: 0 },
  accountMode: { type: "string", default: "pool" }, // enum: pool | tied
  tiedAccountId: { type: "objectid", ref: "Account" },
  enabled: { type: "boolean", default: true },
  createdAt: { type: "date", default: () => new Date() },
};

export const Tunnel: Model = createModel("Tunnel", "agproxy_tunnels", TunnelSchema, {});
