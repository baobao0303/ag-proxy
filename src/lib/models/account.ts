import { createModel, Model, SchemaDef } from "../dynamo-model";

/**
 * DynamoDB-backed replacement for the Mongoose Account model.
 * The exported name and method surface are unchanged, so no call site changes.
 */

const AccountSchema: SchemaDef = {
  email: { type: "string", required: true },
  name: { type: "string", default: "" },
  avatar: { type: "string", default: "" },
  tier: { type: "string", default: "free" }, // enum: free | pro | ultra
  type: { type: "string", default: "google" }, // enum: google | anthropic
  accessToken: { type: "string", default: "" },
  refreshToken: { type: "string", default: "" },
  tokenExpiresAt: { type: "date", default: () => new Date(0) },
  projectId: { type: "string", default: "" },
  quotas: { type: "object", default: () => ({}) },
  quotaResets: { type: "object", default: () => ({}) },
  tokensUsed: { type: "number", default: 0 },
  rotationPriority: { type: "number", default: 0 },
  rotationEnabled: { type: "boolean", default: true },
  proxyId: { type: "objectid", ref: "Proxy" },
  status: { type: "string", default: "active" }, // enum: active | suspended | expired
  lastSyncAt: { type: "date", default: () => new Date() },
  createdAt: { type: "date", default: () => new Date() },
};

export const Account: Model = createModel("Account", "agproxy_accounts", AccountSchema, {});
