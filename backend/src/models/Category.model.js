import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 1 company ke 1 brand me 1 naam ek hi bar
categorySchema.index({ company: 1, brand: 1, name: 1 }, { unique: true });

export const Category = mongoose.model("Category", categorySchema);
