import mongoose from "mongoose";

const phaseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    note: { type: String, default: "" },
    status: { type: String, default: "not-started" },
  },
  { _id: false }
);

const materialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    qtyNeeded: { type: Number, default: 0 },
    supplier: { type: String, default: "" },
    receivedQty: { type: Number, default: 0 },
    status: { type: String, default: "pending" },
  },
  { _id: false }
);

const productionSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
      unique: true,
    },

    autoCodeSnapshot: { type: String },
    artNameSnapshot: { type: String },
    colorSnapshot: { type: String },
    sizeSnapshot: { type: String },
    coverImageSnapshot: { type: String },
    specSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },

    po: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PoDetails",
        default: null,
      },
      poNumber: { type: String, default: "" },
      orderQuantity: { type: Number, default: null },
      unitPrice: { type: Number, default: null },
      totalAmount: { type: Number, default: null },
      status: { type: String, default: "" },
    },

    status: {
      type: String,
      enum: [
        "Planning",
        "Capacity Allocated",
        "Manufacturing Assigned",
        "Process Defined",
        "Ready for Production",
        "In Production",
        "QC",
        "Completed",
        "On Hold",
      ],
      default: "Planning",
      index: true,
    },

    phases: { type: [phaseSchema], default: [] },
    materials: { type: [materialSchema], default: [] },
    assignedTeam: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },

    startDate: { type: Date, default: null },
    targetCompletionDate: { type: Date, default: null },
    actualCompletionDate: { type: Date, default: null },

    productionHistory: {
      type: [
        {
          from: { type: String, default: null },
          to: { type: String, required: true },
          by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
          at: { type: Date, default: Date.now },
          note: { type: String, default: "" },
        },
      ],
      default: [],
    },

    documents: { type: [String], default: [] },

    notes: { type: String, default: "" },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedAt: { type: Date, default: Date.now },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ensure model created only once (safe for hot reloads)
const ProductionProject =
  mongoose.models?.ProductionProject ||
  mongoose.model("ProductionProject", productionSchema);

export default ProductionProject;
