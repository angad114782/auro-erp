import mongoose from "mongoose";

const poDetailsSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true,
      index: true,
    },
    orderQuantity: { type: Number, default: null, min: 0 },
    unitPrice: { type: Number, default: null, min: 0 },
    totalAmount: { type: Number, default: null, min: 0 },

    poNumber: { type: String, default: "" },
    status: { type: String, default: "po_pending", index: true }, // "po_pending" | "po_approved"

    deliveryDate: { type: Date, default: null },

    paymentTerms: { type: String, default: "" }, // e.g. "30-days", "advance-50"
    urgencyLevel: { type: String, default: "Normal" },
    qualityRequirements: { type: String, default: "" },
    clientFeedback: { type: String, default: "" },
    specialInstructions: { type: String, default: "" },

    targetAt: { type: Date, default: null }, // when moved to PO target
    issuedAt: { type: Date, default: null }, // when PO issued/approved
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PoDetails = mongoose.model("PoDetails", poDetailsSchema);
