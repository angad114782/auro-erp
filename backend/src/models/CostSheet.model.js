import mongoose from "mongoose";

const Dept = ["Cutting","Printing","Stitching","Lasting","Packing","Quality Check"];

const ItemSchema = new mongoose.Schema(
  {
    item:        { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    consumption: { type: String, default: "" },   // free text e.g., "26 pairs", "2 pcs"
    cost:        { type: Number, required: true, min: 0 }, // line total (already multiplied)
    department:  { type: String, enum: Dept, default: undefined },
  },
  { _id: true, timestamps: true }
);

const LabourSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    cost: { type: Number, required: true, min: 0 },
  },
  { _id: true, timestamps: true }
);

const CostSheetSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, unique: true },

    // sections
    upper:      [ItemSchema],
    component:  [ItemSchema],
    material:   [ItemSchema],
    packaging:  [ItemSchema],
    misc:       [ItemSchema],

    // labour + OH
    labourComponents: [LabourSchema],
    overhead: {
      type:   { type: String, enum: ["absolute", "percent"], default: "absolute" },
      value:  { type: Number, default: 0, min: 0 },
    },

    // summary inputs
    additional: {
      type:   { type: String, enum: ["absolute", "percent"], default: "absolute" },
      value:  { type: Number, default: 0, min: 0 },
    },
    marginPct: { type: Number, default: 0, min: 0, max: 100 },

    notes:     { type: String, default: "" },

    status: { type: String, enum: ["draft","submitted","approved","rejected"], default: "draft", index: true },

    // computed (server-side) snapshot
    totals: {
      upper:        { type: Number, default: 0 },
      component:    { type: Number, default: 0 },
      material:     { type: Number, default: 0 },
      packaging:    { type: Number, default: 0 },
      misc:         { type: Number, default: 0 },
      labourSubtotal: { type: Number, default: 0 },
      overheadValue:  { type: Number, default: 0 },
      labourOhTotal:  { type: Number, default: 0 },
      baseCost:       { type: Number, default: 0 },
      additionalValue:{ type: Number, default: 0 },
      beforeMargin:   { type: Number, default: 0 },
      profitValue:    { type: Number, default: 0 },
      targetPrice:    { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

CostSheetSchema.index({ project: 1 }, { unique: true });

export default mongoose.model("CostSheet", CostSheetSchema);
