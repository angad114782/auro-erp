// models/pc_productionCard.model.js
import mongoose from "mongoose";

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
    department: { type: String, default: null }, // optional department
  },
  { _id: false }
);

const PCProductionCardSchema = new mongoose.Schema(
  {
    cardNumber: { type: String, required: true, index: true, unique: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    productName: { type: String, default: "" },
    cardQuantity: { type: Number, default: 0 },
    startDate: { type: Date },
    assignedPlant: { type: mongoose.Schema.Types.ObjectId, ref: "AssignPlant", default: null },
    description: { type: String, default: "" },
    specialInstructions: { type: String, default: "" },
    status: { type: String, default: "Draft" },
    stage: { type: String, default: "Planning" },
    stageHistory: [{ from: String, to: String, by: String, at: Date }],
    materialRequestStatus: { type: String, default: "Not Requested" },

    // separated arrays (NEW) - keep these to avoid mixing category rows
    upper: { type: [MaterialLineSchema], default: [] },      // UpperCostRow items (dept likely present)
    materials: { type: [MaterialLineSchema], default: [] },  // MaterialCostRow items
    components: { type: [MaterialLineSchema], default: [] }, // ComponentCostRow items (dept likely present)
    packaging: { type: [MaterialLineSchema], default: [] },  // PackagingCostRow items
    misc: { type: [MaterialLineSchema], default: [] },       // MiscCostRow items

    // legacy convenience snapshots (for backward compatibility)
    materialsSnapshot: { type: [MaterialLineSchema], default: [] },
    componentsSnapshot: { type: [MaterialLineSchema], default: [] },

    materialRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "PCMaterialRequest" }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, default: "Production Manager" },
  },
  { timestamps: true }
);

export const PCProductionCard = mongoose.model("PCProductionCard", PCProductionCardSchema);
