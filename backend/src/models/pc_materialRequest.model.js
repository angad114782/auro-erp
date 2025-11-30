import mongoose from "mongoose";

const MaterialRequestSchema = new mongoose.Schema({
  productionCardId: { type: mongoose.Schema.Types.ObjectId, ref: "PCProductionCard", required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  requestedBy: { type: String, default: "Production Manager" },
  status: {
    type: String,
    enum: ["Pending Availability Check", "Pending to Store", "Issued", "Partially Issued"],
    default: "Pending to Store",
  },
  materials: { type: Array, default: [] },
  components: { type: Array, default: [] },
}, { timestamps: true });

export const PCMaterialRequest = mongoose.model("PCMaterialRequest", MaterialRequestSchema);
