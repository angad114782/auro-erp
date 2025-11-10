import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true }, // e.g., "PRJ"
    pattern: { type: String, required: true, default: "PRJ/{YY}-{MM}/{seq:4}" },
    next: { type: Number, default: 1 },       // next counter to use
  },
  { timestamps: true }
);

export default mongoose.model("SequenceConfig", schema);
