import mongoose from "mongoose";

const inventoryTransactionSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["Stock In", "Stock Out"],
      required: true,
    },

    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },

    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    billDate: {
      type: String,
      default: "",
    },
    billNumber: { type: String },
    billAttachmentUrl: { type: String },

    reason: { type: String },
    remarks: { type: String },

    transactionDate: { type: String },
    createdBy: { type: String },
  },
  { timestamps: true }
);

// ── Performance indexes ──
inventoryTransactionSchema.index({ itemId: 1, createdAt: -1 });
inventoryTransactionSchema.index({ vendorId: 1, createdAt: -1 });
inventoryTransactionSchema.index({ createdAt: -1 });
inventoryTransactionSchema.index({ transactionType: 1, createdAt: -1 });

export const InventoryTransaction = mongoose.model(
  "InventoryTransaction",
  inventoryTransactionSchema
);
