import mongoose from "mongoose";
const { Schema } = mongoose;

const DEPARTMENTS = [
  "cutting",
  "printing",
  "upper",
  "upper_rej",
  "assembly",
  "packing",
  "rfd",
];

/* ---------------- Helpers ---------------- */
function normDept(v) {
  const d = String(v || "").trim().toLowerCase();
  return DEPARTMENTS.includes(d) ? d : "cutting";
}
function normStr(v) {
  return String(v ?? "").trim();
}

/* ---------------- Activity Log (Full History) ---------------- */
const RowHistorySchema = new Schema(
  {
    ts: { type: Date, default: Date.now },

    // ✅ what happened
    type: {
      type: String,
      enum: ["WORK_ADDED", "TRANSFER", "RECEIVE", "ISSUE", "EDIT"],
      required: true,
    },

    qty: { type: Number, default: 0 },

    fromDept: { type: String, default: "" },
    toDept: { type: String, default: "" },

    // any extra info (mrId, note, etc.)
    meta: { type: Schema.Types.Mixed, default: {} },

    updatedBy: { type: String, default: "system" },
  },
  { _id: false }
);

/* ---------------- Row (Item) ---------------- */
const TrackingRowSchema = new Schema(
  {
    // 🔹 identity
    itemId: { type: Schema.Types.Mixed, default: null },
    name: { type: String, required: true },
    specification: { type: String, default: "" },
    unit: { type: String, default: "unit" },

    // 🔹 first working department for this item
    department: { type: String, required: true },

    // ✅ totals only (DB me today fields store nahi honge)
    receivedQty: { type: Number, default: 0 },
    issuedQty: { type: Number, default: 0 },
    completedQty: { type: Number, default: 0 },
    transferredQty: { type: Number, default: 0 },

    // ✅ full activity log for this row
    history: { type: [RowHistorySchema], default: [] },

    // ✅ optional: row active (soft delete items)
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

/* ---------------- Main ---------------- */
const MicroTrackingSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    cardId: {
      type: Schema.Types.ObjectId,
      ref: "PCProductionCard",
      required: true,
      index: true,
    },

    cardNumber: { type: String, default: "" },
    cardQuantity: { type: Number, default: 0 },

    // 🔹 IMPORTANT: first dept of the CARD flow (not stage)
    firstDept: { type: String, required: true, index: true },

    // 🔹 ALL ITEMS HERE
    rows: { type: [TrackingRowSchema], default: [] },

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

/* ---------------- Virtuals (Today computed) ----------------
   NOTE: DB me todayQty store nahi hoga.
   API response me virtual values chahiye to use lean(false) or toObject({virtuals:true})
----------------------------------------------------------- */
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// todayAdded (WORK_ADDED)
TrackingRowSchema.virtual("todayQty").get(function () {
  const now = new Date();
  let sum = 0;
  for (const h of this.history || []) {
    const ts = new Date(h.ts || Date.now());
    if (!isSameDay(ts, now)) continue;
    if (h.type === "WORK_ADDED") sum += Number(h.qty || 0);
  }
  return sum;
});

// todayTransferred (TRANSFER)
TrackingRowSchema.virtual("transferredTodayQty").get(function () {
  const now = new Date();
  let sum = 0;
  for (const h of this.history || []) {
    const ts = new Date(h.ts || Date.now());
    if (!isSameDay(ts, now)) continue;
    if (h.type === "TRANSFER") sum += Number(h.qty || 0);
  }
  return sum;
});

/* ---------------- Pre-validate normalize ---------------- */
MicroTrackingSchema.pre("validate", function (next) {
  try {
    this.firstDept = normDept(this.firstDept);

    this.cardNumber = normStr(this.cardNumber);
    this.cardQuantity = Number(this.cardQuantity || 0);

    // normalize rows
    this.rows = (this.rows || []).map((r) => ({
      ...r,
      name: normStr(r.name),
      specification: normStr(r.specification),
      unit: normStr(r.unit || "unit"),
      department: normDept(r.department),
      receivedQty: Number(r.receivedQty || 0),
      issuedQty: Number(r.issuedQty || 0),
      completedQty: Number(r.completedQty || 0),
      transferredQty: Number(r.transferredQty || 0),
      history: Array.isArray(r.history) ? r.history : [],
      isActive: r.isActive !== false,
    }));

    next();
  } catch (e) {
    next(e);
  }
});

/* ---------------- Indexes ---------------- */
// ✅ ONE document per card
MicroTrackingSchema.index({ projectId: 1, cardId: 1 }, { unique: true });

export default mongoose.model("MicroTracking", MicroTrackingSchema);
