import mongoose from "mongoose";

/** ---------- Sub-schemas ---------- **/

const statusHistorySchema = new mongoose.Schema(
  {
    from: { type: String, default: null },
    to:   { type: String, required: true },
    by:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    at:   { type: Date, default: Date.now },
  },
  { _id: false }
);

const nextUpdateSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    note: { type: String, default: "" }, // NOTE: only next-update carries note
    by:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    at:   { type: Date, default: Date.now },
  },
  { _id: false }
);

const clientCostHistorySchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    by:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    at:     { type: Date, default: Date.now },
  },
  { _id: false }
);

const colorVariantItemSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    desc:        { type: String, default: "" },
    consumption: { type: String, default: "" },
  },
  { _id: false }
);

const colorVariantSchema = new mongoose.Schema(
  {
    materials:  { type: [colorVariantItemSchema], default: [] },
    components: { type: [colorVariantItemSchema], default: [] },
    images:     { type: [String], default: [] }, // file paths or URLs
    updatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedAt:  { type: Date, default: Date.now },
  },
  { _id: false }
);

const poDetailsSchema = new mongoose.Schema(
  {
    orderQuantity: { type: Number, default: null, min: 0 },
    unitPrice:     { type: Number, default: null, min: 0 },
    totalAmount:   { type: Number, default: null, min: 0 },

    poNumber:      { type: String, default: "" },
    status:        { type: String, default: "po_pending", index: true }, // "po_pending" | "po_approved"

    deliveryDate:  { type: Date, default: null },

    paymentTerms:       { type: String, default: "" },   // e.g. "30-days", "advance-50"
    urgencyLevel:       { type: String, default: "Normal" },
    qualityRequirements:{ type: String, default: "" },
    clientFeedback:     { type: String, default: "" },
    specialInstructions:{ type: String, default: "" },

    targetAt:     { type: Date, default: null }, // when moved to PO target
    issuedAt:     { type: Date, default: null }, // when PO issued/approved
    updatedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedAt:    { type: Date, default: Date.now },
  },
  { _id: false }
);

/** ---------- Main Project schema ---------- **/

const projectSchema = new mongoose.Schema(
  {
    autoCode: { type: String, required: true, unique: true, index: true },

    company:  { type: mongoose.Schema.Types.ObjectId, ref: "Company",  required: true },
    brand:    { type: mongoose.Schema.Types.ObjectId, ref: "Brand",    required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },

    type:         { type: mongoose.Schema.Types.ObjectId, ref: "Type",         default: null },
    country:      { type: mongoose.Schema.Types.ObjectId, ref: "Country",      default: null },
    assignPerson: { type: mongoose.Schema.Types.ObjectId, ref: "AssignPerson", default: null },

    color:   { type: String, required: true, trim: true }, // default/base color name
    artName: { type: String, default: "" },
    size:    { type: String, default: "" },
    gender:  { type: String, default: "" },
    priority:{ type: String, default: "normal" },

    // canonical status string (validated in service)
    status: { type: String, default: "prototype", index: true },

    productDesc:       { type: String, default: "" },
    redSealTargetDate: { type: Date, default: null },

    coverImage:   { type: String, default: "" },
    sampleImages: { type: [String], default: [] },

    // business fields
    clientFinalCost: { type: Number, default: null, min: 0 },
    clientApproval:  { type: String, default: "pending" }, // normalized in service

    // only next-update holds a note
    nextUpdate:      { type: nextUpdateSchema, default: null },

    // histories
    statusHistory:     { type: [statusHistorySchema], default: [] },
    clientCostHistory: { type: [clientCostHistorySchema], default: [] },

    // Color variants map: key = colorId (e.g., "c_black"), value = sub doc
    colorVariants: {
      type: Map,
      of: colorVariantSchema,
      default: () => new Map(),
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);
