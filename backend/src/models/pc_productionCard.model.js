import mongoose from "mongoose";

const ProductionCardSchema = new mongoose.Schema({
  cardNumber: { type: String, required: true, index: true, unique: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  productName: String,
  cardQuantity: { type: Number, default: 0 },
  startDate: Date,
  assignedPlant: String,
  description: String,
  specialInstructions: String,
  status: { type: String, default: "Draft" },
  materialRequestStatus: { type: String, default: "Pending Availability Check" },
  materials: { type: Array, default: [] },
  components: { type: Array, default: [] },
  createdBy: String,
}, { timestamps: true });

export const PCProductionCard = mongoose.model("PCProductionCard", ProductionCardSchema);
