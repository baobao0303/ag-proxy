import { createModel, Model, SchemaDef } from "../dynamo-model";

/** DynamoDB-backed replacement for the Mongoose Proxy model. */

const ProxySchema: SchemaDef = {
  name: { type: "string", required: true },
  host: { type: "string", required: true },
  port: { type: "number", required: true },
  protocol: { type: "string", default: "http" }, // enum: http | https | socks5
  username: { type: "string", default: "" },
  password: { type: "string", default: "" },
  enabled: { type: "boolean", default: true },
  createdAt: { type: "date", default: () => new Date() },
};

export const Proxy: Model = createModel("Proxy", "agproxy_proxies", ProxySchema, {});
