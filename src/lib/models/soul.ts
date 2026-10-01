import mongoose, { Schema, Document } from "mongoose";

export interface ISoul extends Document {
  name: string; // VD: "Trí — Senior Angular Architect"
  slug: string;
  memberRole: string; // VD: "Senior Frontend & Angular Architect"
  department: string; // VD: "Frontend Core Engineering"
  avatar: string; // Icon or emoji
  tagline: string;
  content: string; // Tệp markdown SOUL.md định hình tính cách
  personaPreset: "default" | "professional" | "tutor" | "terse" | "custom";
  modelPreference: string;
  status: "running" | "paused" | "idle";
  monthlyTokenBudget: number; // Lương token hàng tháng (VD: 5,000,000)
  tokensUsedThisMonth: number; // Số token đã dùng trong tháng
  tasksCompleted: number; // Số tác vụ đã hoàn thành
  jevConfig: {
    readPolicy: "allow" | "jev_check";
    writePolicy: "allow" | "jev_check" | "confirm";
    dangerousPolicy: "confirm" | "block";
    riskThresholdConfirm: number;
    riskThresholdBlock: number;
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SoulSchema = new Schema<ISoul>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    memberRole: { type: String, default: "AI Engineer" },
    department: { type: String, default: "Engineering" },
    avatar: { type: String, default: "🤖" },
    tagline: { type: String, default: "" },
    content: { type: String, required: true },
    personaPreset: {
      type: String,
      enum: ["default", "professional", "tutor", "terse", "custom"],
      default: "default",
    },
    modelPreference: { type: String, default: "gemini-3-flash" },
    status: {
      type: String,
      enum: ["running", "paused", "idle"],
      default: "running",
    },
    monthlyTokenBudget: { type: Number, default: 5000000 },
    tokensUsedThisMonth: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    jevConfig: {
      readPolicy: { type: String, enum: ["allow", "jev_check"], default: "allow" },
      writePolicy: { type: String, enum: ["allow", "jev_check", "confirm"], default: "jev_check" },
      dangerousPolicy: { type: String, enum: ["confirm", "block"], default: "confirm" },
      riskThresholdConfirm: { type: Number, default: 0.35 },
      riskThresholdBlock: { type: Number, default: 0.75 },
    },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Soul = mongoose.models.Soul || mongoose.model<ISoul>("Soul", SoulSchema);
