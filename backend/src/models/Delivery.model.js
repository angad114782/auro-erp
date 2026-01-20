import mongoose from "mongoose";

const deliveryHistorySchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },

    changes: [
      {
        field: String,
        from: mongoose.Schema.Types.Mixed,
        to: mongoose.Schema.Types.Mixed,
      },
    ],

    updatedBy: { type: String, default: "system" },
  },
  { _id: false }
);

const deliverySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    poDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PoDetails",
      default: null,
    },

    projectCode: String,
    productName: String,
    category: String,
    brand: String,
    company: String,
    gender: String,
    sendQuantity: Number,

    poNumber: String,
    poReceivedDate: Date,
    deliveryDateExpected: Date,
    billNumber: { type: String, default: "" },
    deliveryDate: {
      type: Date,
      default: "",
    },
    lrNumber: {
      type: String,
      default: "",
    },

    orderQuantity: Number,

    status: {
      type: String,
      enum: ["pending", "parcel_delivered", "delivered"],
      default: "pending",
    },
    remarks: {
      type: String,
      default: "",
    },

    agingDays: Number,

    // ⭐ FULL HISTORY TRACKING
    history: [deliveryHistorySchema],
  },
  { timestamps: true }
);

deliverySchema.index(
  { project: 1, poDetails: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "parcel_delivered"] } },
  }
);

export const Delivery = mongoose.model("Delivery", deliverySchema);
