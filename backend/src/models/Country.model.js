import mongoose from "mongoose";

const countrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Case-insensitive unique on name
countrySchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

export default mongoose.model("Country", countrySchema);
