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

    billNumber: { type: String },
    billAttachmentUrl: { type: String },

    reason: { type: String },
    remarks: { type: String },

    transactionDate: { type: String },
    createdBy: { type: String },
  },
  { timestamps: true }
);

export const InventoryTransaction = mongoose.model(
  "InventoryTransaction",
  inventoryTransactionSchema
);
