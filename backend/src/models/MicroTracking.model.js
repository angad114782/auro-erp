import mongoose from "mongoose";
const { Schema } = mongoose;

const FLOW = ["cutting", "printing", "upper", "upper_rej", "assembly", "packing", "rfd"];
const DEPARTMENTS = new Set(FLOW);

const TRACK_CATEGORIES = new Set(["upper", "components"]); // only tracked

/* ---------------- Helpers ---------------- */
function normDeptOrNull(v) {
  const d = String(v || "").trim().toLowerCase();
  if (!d) return null;
  if (d === "upperrej" || d === "upper-rej" || d === "upper_rej") return "upper_rej";
  return DEPARTMENTS.has(d) ? d : null;
}
function normDept(v) {
  return normDeptOrNull(v) || "cutting";
}
function normStr(v) {
  return String(v ?? "").trim();
}
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function isTrackedCategory(cat) {
  const c = String(cat || "").trim().toLowerCase();
  return TRACK_CATEGORIES.has(c) || c === ""; // ✅ allow legacy missing
}
function isValidRow(r) {
  if (!r) return false;
  const name = normStr(r.name);
  const dept = normStr(r.department);
  const iid = r.itemId != null ? normStr(r.itemId) : "";
  return !!(name && dept && iid);
}

/* ---------------- History ---------------- */
const RowHistorySchema = new Schema(
  {
    ts: { type: Date, default: Date.now },
    type: { type: String, enum: ["WORK_ADDED", "TRANSFER", "RECEIVE", "ISSUE", "EDIT"], required: true },
    qty: { type: Number, default: 0 },
    fromDept: { type: String, default: "" },
    toDept: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
    updatedBy: { type: String, default: "system" },
  },
  { _id: false }
);

/* ---------------- Row ---------------- */
const TrackingRowSchema = new Schema(
  {
    // ✅ optional for legacy, but if present must be valid
    category: {
      type: String,
      default: undefined,
      index: true,
      validate: {
        validator: function (v) {
          if (v == null || String(v).trim() === "") return true;
          return TRACK_CATEGORIES.has(String(v).trim().toLowerCase());
        },
        message: "Invalid category",
      },
    },

    itemId: { type: Schema.Types.Mixed, default: null },
    itemKey: { type: String, default: "" },

    name: { type: String, required: true },
    specification: { type: String, default: "" },
    unit: { type: String, default: "unit" },

    department: { type: String, required: true, index: true },

    receivedQty: { type: Number, default: 0 },
    completedQty: { type: Number, default: 0 },
    transferredQty: { type: Number, default: 0 },

    issuedMaterialQty: { type: Number, default: 0 },
    issuedQty: { type: Number, default: 0 }, // legacy keep
    consumptionPerPair: { type: Number, default: 0 },
    issuedPairsPossible: { type: Number, default: 0 },

    history: { type: [RowHistorySchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { _id: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/* ---------------- Main ---------------- */
const MicroTrackingSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    cardId: { type: Schema.Types.ObjectId, ref: "PCProductionCard", required: true, index: true },

    cardNumber: { type: String, default: "" },
    cardQuantity: { type: Number, default: 0 },

    firstDept: { type: String, default: "cutting", index: true },

    rows: { type: [TrackingRowSchema], default: [] },

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

/* ---------------- Virtuals (today) ---------------- */
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
TrackingRowSchema.virtual("todayQty").get(function () {
  const now = new Date();
  let sum = 0;
  for (const h of this.history || []) {
    const ts = new Date(h.ts || Date.now());
    if (!isSameDay(ts, now)) continue;
    if (h.type === "WORK_ADDED") sum += toNum(h.qty);
  }
  return sum;
});
TrackingRowSchema.virtual("transferredTodayQty").get(function () {
  const now = new Date();
  let sum = 0;
  for (const h of this.history || []) {
    const ts = new Date(h.ts || Date.now());
    if (!isSameDay(ts, now)) continue;
    if (h.type === "TRANSFER") sum += toNum(h.qty);
  }
  return sum;
});

/* ---------------- Pre-validate normalize + CLEAN ---------------- */
MicroTrackingSchema.pre("validate", function (next) {
  try {
    this.firstDept = normDept(this.firstDept);
    this.cardNumber = normStr(this.cardNumber);
    this.cardQuantity = toNum(this.cardQuantity);

    const rows = Array.isArray(this.rows) ? this.rows : [];

    // ✅ 1) drop broken rows (avoid "name required" crash)
    const cleaned = rows.filter(isValidRow);

    // ✅ 2) normalize cleaned rows
    this.rows = cleaned.map((r) => {
      const dept = normDept(r.department);

      const catRaw = normStr(r.category).toLowerCase();
      // ✅ keep only valid category, otherwise keep undefined (legacy)
      const cat = TRACK_CATEGORIES.has(catRaw) ? catRaw : undefined;

      const issuedMaterial = toNum(r.issuedMaterialQty ?? r.issuedQty);

      return {
        ...r,
        category: cat,

        itemId: r.itemId ?? null,
        itemKey: normStr(r.itemKey),

        name: normStr(r.name),
        specification: normStr(r.specification),
        unit: normStr(r.unit || "unit"),

        department: dept,

        receivedQty: toNum(r.receivedQty),
        completedQty: toNum(r.completedQty),
        transferredQty: toNum(r.transferredQty),

        issuedMaterialQty: issuedMaterial,
        issuedQty: issuedMaterial, // ✅ legacy sync

        consumptionPerPair: toNum(r.consumptionPerPair),
        issuedPairsPossible: toNum(r.issuedPairsPossible),

        history: Array.isArray(r.history) ? r.history : [],
        isActive: r.isActive !== false,
      };
    });

    next();
  } catch (e) {
    next(e);
  }
});

/* ---------------- Indexes ---------------- */
MicroTrackingSchema.index({ projectId: 1, cardId: 1 }, { unique: true });
MicroTrackingSchema.index({ isActive: 1, "rows.department": 1 });

export default mongoose.model("MicroTracking", MicroTrackingSchema);
