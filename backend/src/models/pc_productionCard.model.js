import mongoose from "mongoose";
import { type } from "os";

const MaterialLineSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.Mixed, default: null },
    name: { type: String, default: "" },
    specification: { type: String, default: "" },
    requirement: { type: Number, default: 0 },
    unit: { type: String, default: "unit" },
    available: { type: Number, default: 0 },
    issued: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
  },
  { _id: false }
);

const PCProductionCardSchema = new mongoose.Schema(
  {
    cardNumber: { type: String, required: true, index: true, unique: true },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    productName: { type: String, default: "" },
    cardQuantity: { type: Number, default: 0 },
    startDate: { type: Date },
    assignedPlant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssignPlant",
      default: null,
    },
    description: { type: String, default: "" },
    specialInstructions: { type: String, default: "" },
    status: { type: String, default: "Draft" },
    stage: { type: String, default: "Planning" }, // Planning | In Production | Quality | Completed
    materialRequestStatus: { type: String, default: "Not Requested" },
    // snapshot arrays for quick UI render
    materials: { type: [MaterialLineSchema], default: [] },
    components: { type: [MaterialLineSchema], default: [] },
    // store refs to top-level MR documents:
    materialRequests: [
      { type: mongoose.Schema.Types.ObjectId, ref: "PCMaterialRequest" },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: { type: String, default: "Production Manager" },
  },
  { timestamps: true }
);

export const PCProductionCard = mongoose.model(
  "PCProductionCard",
  PCProductionCardSchema
);
