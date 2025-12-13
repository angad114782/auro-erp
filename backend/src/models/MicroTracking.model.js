import mongoose from "mongoose";

const MicroTrackingSchema = new mongoose.Schema(
  {
    projectId: mongoose.Schema.Types.ObjectId,
    cardId: mongoose.Schema.Types.ObjectId,
    cardNumber: String,
    cardQuantity: Number,

    category: String,
    itemId: mongoose.Schema.Types.Mixed,
    name: String,
    specification: String,
    unit: String,
    requirement: Number,
    issued: Number,
    balance: Number,

    department: String,

    progressDone: { type: Number, default: 0 },
    progressToday: { type: Number, default: 0 },

    // ⭐ NEW FIELD
    history: [
      {
        date: { type: Date, default: Date.now },
        addedToday: Number,
        previousDone: Number,
        newDone: Number,
        updatedBy: { type: String, default: "system" }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("MicroTracking", MicroTrackingSchema);
