import mongoose, { Schema } from "mongoose";

const LabourItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    cost: { type: Number, min: 0, default: 0 },
  },
  { _id: true }
);

const LabourCostSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true, unique: true, required: true },
    directTotal: { type: Number, min: 0, default: 0 }, // yellow box value
    items: { type: [LabourItemSchema], default: [] }, // optional breakdown
  },
  { timestamps: true }
);

export const LabourCost = mongoose.model("LabourCost", LabourCostSchema);
