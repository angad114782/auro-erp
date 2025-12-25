import mongoose from "mongoose";

const MicroTrackingSchema = new mongoose.Schema(
  {
    projectId: mongoose.Schema.Types.ObjectId,

    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PCProductionCard",
      required: true,
    },

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

    // UI helper (today input total)
    progressToday: { type: Number, default: 0 },

    // ✅ Transfer tracking (overall)
    transferred: { type: Number, default: 0 },

    // ✅ Received from previous department
    received: { type: Number, default: 0 },

    // ✅ NEW: Today's transferred qty (sirf aaj ka work next dept me bhejna ho)
    transferredToday: { type: Number, default: 0 },

    history: [
      {
        date: { type: Date, default: Date.now },

        // "Aaj kitna add hua" (dashboard ke liye)
        addedToday: Number,
        previousDone: Number,
        newDone: Number,

        changes: [
          {
            field: String,
            from: mongoose.Schema.Types.Mixed,
            to: mongoose.Schema.Types.Mixed,
          },
        ],

        updatedBy: { type: String, default: "system" },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("MicroTracking", MicroTrackingSchema);
