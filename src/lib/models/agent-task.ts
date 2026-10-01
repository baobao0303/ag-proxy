import mongoose, { Schema, Document } from "mongoose";

export interface IAgentTask extends Document {
  title: string;
  description: string;
  type: "Task" | "User Story" | "Bug" | "Technical Story";
  actionType: "READ" | "WRITE" | "DANGEROUS";
  priority: "P0" | "P1" | "P2" | "P3";
  state: "New" | "Awaiting Human" | "Active" | "Resolved" | "Blocked";
  soulId?: mongoose.Types.ObjectId;
  agentName: string;
  assignedTo?: string;
  riskScore: number; // 0.0 to 1.0
  jevEvaluation: {
    type: "boolean" | "choice" | "score";
    result: string;
    reason: string;
    evaluatedAt: Date;
  };
  humanReview?: {
    reviewedBy?: string;
    reviewedAt?: Date;
    decision?: "approved" | "rejected";
    notes?: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AgentTaskSchema = new Schema<IAgentTask>(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: ["Task", "User Story", "Bug", "Technical Story"],
      default: "Task",
    },
    actionType: {
      type: String,
      enum: ["READ", "WRITE", "DANGEROUS"],
      default: "WRITE",
    },
    priority: {
      type: String,
      enum: ["P0", "P1", "P2", "P3"],
      default: "P2",
    },
    state: {
      type: String,
      enum: ["New", "Awaiting Human", "Active", "Resolved", "Blocked"],
      default: "New",
    },
    soulId: { type: Schema.Types.ObjectId, ref: "Soul", default: null },
    agentName: { type: String, default: "Autonomous Agent" },
    assignedTo: { type: String, default: "agent_runner" },
    riskScore: { type: Number, default: 0.1 },
    jevEvaluation: {
      type: {
        type: String,
        enum: ["boolean", "choice", "score"],
        default: "score",
      },
      result: { type: String, default: "allow" },
      reason: { type: String, default: "Action within safe parameters" },
      evaluatedAt: { type: Date, default: Date.now },
    },
    humanReview: {
      reviewedBy: { type: String },
      reviewedAt: { type: Date },
      decision: { type: String, enum: ["approved", "rejected"] },
      notes: { type: String },
    },
    metadata: { type: Schema.Types.Mixed, default: () => ({}) },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const AgentTask =
  mongoose.models.AgentTask || mongoose.model<IAgentTask>("AgentTask", AgentTaskSchema);
