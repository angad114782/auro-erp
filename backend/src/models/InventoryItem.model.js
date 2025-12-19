import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },

    itemName: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, default: "General" },
    color: { type: String, default: "N/A" },

    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },

    // vendorId: { type: String, default: "" },

    expiryDate: { type: String },

    quantity: { type: Number, default: 0 },
    quantityUnit: { type: String, default: "piece" },

    description: { type: String },

    billNumber: { type: String },
    billDate: { type: String },
    billAttachmentUrl: { type: String },

    isDraft: { type: Boolean, default: true },

    // Soft delete flag
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },

    lastUpdate: { type: String },
    lastUpdateTime: { type: String },
  },
  { timestamps: true }
);

export const InventoryItem = mongoose.model(
  "InventoryItem",
  inventoryItemSchema
);
