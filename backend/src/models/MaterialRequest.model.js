import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
  id: String,
  name: String,
  specification: String,
  requirement: Number,
  unit: String,
  available: Number,
  issued: Number,
  balance: Number,
});

const materialRequestSchema = new mongoose.Schema({
  productionCardId: String,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  requestedBy: String,
  status: { type: String, enum: ["Pending Availability Check","Pending to Store","Issued","Partially Issued"], default: "Pending Availability Check" },
  materials: [materialSchema],
  components: [materialSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

export const MaterialRequest = mongoose.model("MaterialRequest", materialRequestSchema);
