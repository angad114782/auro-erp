import mongoose from "mongoose";

const sequenceSchema = new mongoose.Schema(
  {
    key:   { type: String, unique: true, index: true }, // e.g. "RND-25-26-11"
    value: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Sequence = mongoose.model("Sequence", sequenceSchema);
