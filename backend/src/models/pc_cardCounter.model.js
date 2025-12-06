import mongoose from "mongoose";

const PCCardCounterSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, unique: true },
  seq: { type: Number, default: 0 },
}, { timestamps: true });

export const PCCardCounter = mongoose.model("PCCardCounter", PCCardCounterSchema);
