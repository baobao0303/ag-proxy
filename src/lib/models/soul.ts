import { createModel, Model, SchemaDef } from "../dynamo-model";

/**
 * DynamoDB-backed replacement for the Mongoose Soul model.
 *
 * `content` holds the SOUL.md markdown that defines the agent's personality,
 * and `jevConfig` carries the reflex-middleware policy thresholds. Field names
 * and defaults are kept identical to the previous Mongoose schema so no call
 * site and no stored document changes shape.
 */

const SoulSchema: SchemaDef = {
  name: { type: "string", required: true },
  slug: { type: "string", required: true },
  memberRole: { type: "string", default: "AI Engineer" },
  department: { type: "string", default: "Engineering" },
  avatar: { type: "string", default: "🤖" },
  tagline: { type: "string", default: "" },
  content: { type: "string", required: true }, // markdown SOUL.md
  personaPreset: { type: "string", default: "default" }, // enum: default|professional|tutor|terse|custom
  modelPreference: { type: "string", default: "gemini-3-flash" },
  status: { type: "string", default: "running" }, // enum: running|paused|idle
  monthlyTokenBudget: { type: "number", default: 5000000 },
  tokensUsedThisMonth: { type: "number", default: 0 },
  tasksCompleted: { type: "number", default: 0 },
  // Nested policy object. Defaults mirror the Mongoose sub-schema exactly.
  jevConfig: {
    type: "object",
    default: () => ({
      readPolicy: "allow",
      writePolicy: "jev_check",
      dangerousPolicy: "confirm",
      riskThresholdConfirm: 0.35,
      riskThresholdBlock: 0.75,
    }),
  },
  isDefault: { type: "boolean", default: false },
  createdAt: { type: "date", default: () => new Date() },
  updatedAt: { type: "date", default: () => new Date() },
};

export const Soul: Model = createModel("Soul", "agproxy_souls", SoulSchema, {});
