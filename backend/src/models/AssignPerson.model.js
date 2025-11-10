import mongoose from "mongoose";

const assignPersonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// case-insensitive unique name
assignPersonSchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

export default mongoose.model("AssignPerson", assignPersonSchema);
