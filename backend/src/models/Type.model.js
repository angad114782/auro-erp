import mongoose from "mongoose";

const typeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Case-insensitive unique on name
typeSchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

export default mongoose.model("Type", typeSchema);
