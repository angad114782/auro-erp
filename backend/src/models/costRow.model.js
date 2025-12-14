import mongoose, { Schema } from "mongoose";

export const DEPARTMENTS = [
  "cutting",
  "printing",
  "upper",
  "upperREJ",
  "assembly",
  "packing",
  "rfd",
];

function mkRowSchema({ withDepartment = false } = {}) {
  return new Schema(
    {
      projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        index: true,
        required: true,
      },
      item: { type: String, required: true, trim: true },
      description: { type: String, default: "", trim: true },
      consumption: { type: Number, default: 0, min: 0 },
      cost: { type: Number, min: 0, default: 0 },
      ...(withDepartment && {
        department: { type: String, enum: DEPARTMENTS, default: undefined },
      }),
    },
    { timestamps: true }
  );
}

export const UpperCostRow = mongoose.model(
  "UpperCostRow",
  mkRowSchema({ withDepartment: true })
);
export const ComponentCostRow = mongoose.model(
  "ComponentCostRow",
  mkRowSchema({ withDepartment: true })
);
export const MaterialCostRow = mongoose.model("MaterialCostRow", mkRowSchema());
export const PackagingCostRow = mongoose.model(
  "PackagingCostRow",
  mkRowSchema()
);
export const MiscCostRow = mongoose.model("MiscCostRow", mkRowSchema());
