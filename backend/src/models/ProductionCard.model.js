import mongoose from "mongoose";

const { Schema } = mongoose;

const MaterialSchema = new Schema(
  {
    name: String,
    specification: String,
    requirement: Schema.Types.Mixed,
    unit: String,
  },
  { _id: false }
);

const ComponentSchema = new Schema(
  {
    name: String,
    specification: String,
    requirement: Schema.Types.Mixed,
    unit: String,
  },
  { _id: false }
);

const ProductionCardSchema = new Schema(
  {
    cardNumber: { type: String, required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    productName: { type: String },
    cardQuantity: { type: Number, default: 0 },
    startDate: { type: Date },
    assignedPlant: { type: String },
    description: { type: String },
    specialInstructions: { type: String },
    status: {
      type: String,
      enum: ["Draft", "Active", "In Progress", "Completed", "On Hold"],
      default: "Draft",
    },
    materialRequestStatus: {
      type: String,
      enum: [
        "Pending Availability Check",
        "Pending to Store",
        "Issued",
        "Partially Issued",
      ],
      default: "Pending Availability Check",
    },
    createdBy: { type: Schema.Types.Mixed },
    materials: [MaterialSchema],
    components: [ComponentSchema],
    serverProduction: { type: Schema.Types.ObjectId, ref: "ProductionProject" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ProductionCard = mongoose.model("ProductionCard", ProductionCardSchema);

export default ProductionCard;
