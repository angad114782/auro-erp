import mongoose from "mongoose";

const MaterialLineSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.Mixed, default: null },
  name: { type: String, default: "" },
  specification: { type: String, default: "" },
  requirement: { type: Number, default: 0 },
  unit: { type: String, default: "unit" },
  available: { type: Number, default: 0 },
  issued: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
}, { _id: false });

const PCMaterialRequestSchema = new mongoose.Schema({
  productionCardId: { type: mongoose.Schema.Types.ObjectId, ref: "PCProductionCard", required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  cardNumber: { type: String, default: "" }, // denormalized for quick listing
  requestedBy: { type: String, default: "Production Manager" },
  status: {
    type: String,
    enum: ["Pending Availability Check", "Pending to Store", "Issued", "Partially Issued", "Cancelled"],
    default: "Pending to Store",
  },
  materials: { type: [MaterialLineSchema], default: [] },
  components: { type: [MaterialLineSchema], default: [] },
  notes: { type: String, default: "" },

  // soft delete + issue metadata
  isDeleted: { type: Boolean, default: false, index: true },
  issuedBy: { type: String, default: null },
  issueNotes: { type: String, default: "" },

}, { timestamps: true });

PCMaterialRequestSchema.index({ projectId: 1, status: 1, isDeleted: 1 });

export const PCMaterialRequest = mongoose.model("PCMaterialRequest", PCMaterialRequestSchema);
