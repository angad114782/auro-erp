import mongoose from "mongoose";

/** ---------- Sub-schemas ---------- **/

// one row in any cost table
const costRowSchema = new mongoose.Schema(
  {
    item: { type: String, required: true },
    description: { type: String, default: "" },
    consumption: { type: String, default: "" },
    cost: { type: Number, default: 0 },
  },
  { _id: false }
);

// labour row
const labourRowSchema = new mongoose.Schema(
  {
    name: String,
    cost: Number,
  },
  { _id: false }
);

// summary schema
const summarySchema = new mongoose.Schema(
  {
    upperTotal: Number,
    materialTotal: Number,
    componentTotal: Number,
    packagingTotal: Number,
    miscTotal: Number,
    labourTotal: Number,
    additionalCosts: Number,
    profitMargin: Number,
    profitAmount: Number,
    tentativeCost: Number,
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    from: { type: String, default: null },
    to: { type: String, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const nextUpdateSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    note: { type: String, default: "" },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const clientCostHistorySchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const colorVariantItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    desc: { type: String, default: "" },
    consumption: { type: String, default: "" },
    cost: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const colorVariantSchema = new mongoose.Schema(
  {
    materials: [colorVariantItemSchema],
    components: [colorVariantItemSchema],
    images: [String],

    costing: {
      upper: [costRowSchema],
      material: [costRowSchema],
      component: [costRowSchema],
      packaging: [costRowSchema],
      misc: [costRowSchema],
      labour: {
        items: [labourRowSchema],
        directTotal: { type: Number, default: 0 },
      },
      summary: summarySchema,
    },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/** ---------- Main Project Schema ---------- **/

const projectSchema = new mongoose.Schema(
  {
    autoCode: { type: String, required: true, unique: true, index: true },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    type: { type: mongoose.Schema.Types.ObjectId, ref: "Type", default: null },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      default: null,
    },
    assignPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssignPerson",
      default: null,
    },

    color: { type: String, required: true, trim: true },
    artName: { type: String, default: "" },
    size: { type: String, default: "" },
    gender: { type: String, default: "" },
    priority: { type: String, default: "normal" },

    status: { type: String, default: "prototype", index: true },

    productDesc: { type: String, default: "" },
    redSealTargetDate: { type: Date, default: null },

    coverImage: { type: String, default: "" },
    sampleImages: { type: [String], default: [] },

    clientFinalCost: { type: Number, default: null, min: 0 },
    clientApproval: { type: String, default: "pending" },

    nextUpdate: { type: nextUpdateSchema, default: null },

    statusHistory: { type: [statusHistorySchema], default: [] },
    clientCostHistory: { type: [clientCostHistorySchema], default: [] },

    colorVariants: {
      type: Map,
      of: colorVariantSchema,
      default: () => new Map(),
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/** ---------- FIXED INDEXES ---------- **/
projectSchema.index({ autoCode: "text", artName: "text" });
projectSchema.index({ company: 1, brand: 1, category: 1, status: 1 });

/** ---------- Export Model ---------- **/
export const Project = mongoose.model("Project", projectSchema);
