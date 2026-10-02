import { createModel, Model, SchemaDef } from "../dynamo-model";

/**
 * DynamoDB-backed replacement for the Mongoose AgentTask model.
 *
 * `state` is the HITL board column (New -> Awaiting Human -> Active ->
 * Resolved/Blocked), `riskScore` with the soul's jevConfig thresholds drives the
 * reflex decision, and `humanReview` records the approval.
 */

const AgentTaskSchema: SchemaDef = {
  title: { type: "string", required: true },
  description: { type: "string", default: "" },
  type: { type: "string", default: "Task" }, // enum: Task|User Story|Bug|Technical Story
  actionType: { type: "string", default: "WRITE" }, // enum: READ|WRITE|DANGEROUS
  priority: { type: "string", default: "P2" }, // enum: P0|P1|P2|P3
  state: { type: "string", default: "New" }, // enum: New|Awaiting Human|Active|Resolved|Blocked
  soulId: { type: "objectid", ref: "Soul" },
  agentName: { type: "string", default: "Autonomous Agent" },
  assignedTo: { type: "string", default: "agent_runner" },
  riskScore: { type: "number", default: 0.1 }, // 0.0 - 1.0
  // JEV reflex result. `type` inside the Mongoose schema is the policy kind,
  // which in a document is just a field named "type".
  jevEvaluation: {
    type: "object",
    default: () => ({
      type: "score",
      result: "allow",
      reason: "Action within safe parameters",
      evaluatedAt: new Date(),
    }),
  },
  humanReview: {
    type: "object",
    default: () => ({}),
  },
  metadata: { type: "object", default: () => ({}) },
  createdAt: { type: "date", default: () => new Date() },
  updatedAt: { type: "date", default: () => new Date() },
};

export const AgentTask: Model = createModel("AgentTask", "agproxy_agent_tasks", AgentTaskSchema, {});
