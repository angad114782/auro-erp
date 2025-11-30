// backend/src/models/projectCost.model.js
import mongoose, { Schema } from "mongoose";

export const DEPARTMENTS = [
  "cutting",
  "printing",
  "stitching",
  "lasting",
  "packing",
  "quality",
];

function mkRowSchema({ withDepartment = false } = {}) {
  return new Schema(
    {
      projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true, required: true },
      item: { type: String, required: true, trim: true },
      description: { type: String, default: "", trim: true },
      consumption: { type: String, default: "", trim: true },
      cost: { type: Number, min: 0, default: 0 },
      ...(withDepartment && {
        department: { type: String, enum: DEPARTMENTS, default: undefined },
      }),
      section: { type: String, default: null }, // optional: allow explicit section if you store it
    },
    { timestamps: true }
  );
}

export const UpperCostRow = mongoose.models.UpperCostRow || mongoose.model(
  "UpperCostRow",
  mkRowSchema({ withDepartment: true })
);
export const ComponentCostRow = mongoose.models.ComponentCostRow || mongoose.model(
  "ComponentCostRow",
  mkRowSchema({ withDepartment: true })
);
export const MaterialCostRow = mongoose.models.MaterialCostRow || mongoose.model(
  "MaterialCostRow",
  mkRowSchema()
);
export const PackagingCostRow = mongoose.models.PackagingCostRow || mongoose.model(
  "PackagingCostRow",
  mkRowSchema()
);
export const MiscCostRow = mongoose.models.MiscCostRow || mongoose.model(
  "MiscCostRow",
  mkRowSchema()
);
