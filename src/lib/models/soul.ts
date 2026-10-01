import mongoose, { Schema, Document } from "mongoose";

export interface ISoul extends Document {
  name: string;
  slug: string;
  tagline: string;
  content: string; // Markdown SOUL.md content
  personaPreset: "default" | "professional" | "tutor" | "terse" | "custom";
  modelPreference: string;
  jevConfig: {
    readPolicy: "allow" | "jev_check";
    writePolicy: "allow" | "jev_check" | "confirm";
    dangerousPolicy: "confirm" | "block";
    riskThresholdConfirm: number; // 0.3
    riskThresholdBlock: number;   // 0.7
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SoulSchema = new Schema<ISoul>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    tagline: { type: String, default: "" },
    content: { type: String, required: true },
    personaPreset: {
      type: String,
      enum: ["default", "professional", "tutor", "terse", "custom"],
      default: "default",
    },
    modelPreference: { type: String, default: "gemini-3-flash" },
    jevConfig: {
      readPolicy: { type: String, enum: ["allow", "jev_check"], default: "allow" },
      writePolicy: { type: String, enum: ["allow", "jev_check", "confirm"], default: "jev_check" },
      dangerousPolicy: { type: String, enum: ["confirm", "block"], default: "confirm" },
      riskThresholdConfirm: { type: Number, default: 0.3 },
      riskThresholdBlock: { type: Number, default: 0.7 },
    },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Soul = mongoose.models.Soul || mongoose.model<ISoul>("Soul", SoulSchema);
