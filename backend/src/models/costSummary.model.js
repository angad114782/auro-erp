import mongoose, { Schema } from "mongoose";

const CostSummarySchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true, unique: true, required: true },

    // Inputs
    additionalCosts: { type: Number, min: 0, default: 0 },
    profitMargin: { type: Number, min: 0, max: 100, default: 25 },
    remarks: { type: String, default: "" },

    // Computed totals (server-calculated)
    upperTotal: { type: Number, min: 0, default: 0 },
    componentTotal: { type: Number, min: 0, default: 0 },
    materialTotal: { type: Number, min: 0, default: 0 },
    packagingTotal: { type: Number, min: 0, default: 0 },
    miscTotal: { type: Number, min: 0, default: 0 },
    labourTotal: { type: Number, min: 0, default: 0 },

    totalAllCosts: { type: Number, min: 0, default: 0 },
    profitAmount: { type: Number, min: 0, default: 0 },
    tentativeCost: { type: Number, min: 0, default: 0 },

    status: { type: String, enum: ["draft", "ready_for_red_seal"], default: "draft" },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const CostSummary = mongoose.model("CostSummary", CostSummarySchema);
