import mongoose from "mongoose";

const MaterialRequestSubSchema = new mongoose.Schema(
  {
    // each request has its own _id (default)
    requestedBy: { type: String, default: "Production Manager" },
    status: {
      type: String,
      enum: [
        "Pending Availability Check",
        "Pending to Store",
        "Issued",
        "Partially Issued",
      ],
      default: "Pending to Store",
    },
    materials: { type: Array, default: [] },
    components: { type: Array, default: [] },
    // optional history / notes
    notes: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// main ProductionCard schema with embedded materialRequests
const ProductionCardSchema = new mongoose.Schema(
  {
    cardNumber: { type: String, required: true, index: true, unique: true },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    productName: String,
    cardQuantity: { type: Number, default: 0 },
    startDate: Date,
    assignPlant: { type: mongoose.Schema.Types.ObjectId, ref: "AssignPlant" },
    description: String,
    specialInstructions: String,
    status: { type: String, default: "Draft" },
    materialRequestStatus: {
      type: String,
      default: "Pending Availability Check",
    }, // overall MR status if you want
    materials: { type: Array, default: [] }, // planned materials (for card)
    components: { type: Array, default: [] }, // planned components (for card)
    materialRequests: { type: [MaterialRequestSubSchema], default: [] }, // embedded requests
    createdBy: String,
  },
  { timestamps: true }
);

// update materialRequests.updatedAt when subdoc modified (helper)
ProductionCardSchema.pre("save", function (next) {
  if (this.isModified("materialRequests")) {
    // update timestamps for each subdoc that lacks updatedAt or was modified
    for (const mr of this.materialRequests) {
      if (!mr.updatedAt) mr.updatedAt = new Date();
    }
  }
  next();
});

export const PCProductionCard = mongoose.model(
  "PCProductionCard",
  ProductionCardSchema
);
