import mongoose from "mongoose";

const deliveryHistorySchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },

    changes: [
      {
        field: String,
        from: mongoose.Schema.Types.Mixed,
        to: mongoose.Schema.Types.Mixed,
      }
    ],

    updatedBy: { type: String, default: "system" }
  },
  { _id: false }
);

const deliverySchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },

    poDetails: { type: mongoose.Schema.Types.ObjectId, ref: "PoDetails", default: null },

    projectCode: String,
    productName: String,
    category: String,
    brand: String,
    gender: String,

    poNumber: String,
    poReceivedDate: Date,
    deliveryDateExpected: Date,

    orderQuantity: Number,

    status: {
      type: String,
      enum: ["pending", "parcel_delivered", "delivered"],
      default: "pending"
    },

    agingDays: Number,

    // ⭐ FULL HISTORY TRACKING
    history: [deliveryHistorySchema]
  },
  { timestamps: true }
);

export const Delivery = mongoose.model("Delivery", deliverySchema);
