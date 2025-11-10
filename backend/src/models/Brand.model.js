// models/Brand.model.js
import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// unique per (company, name) — case-insensitive
brandSchema.index(
  { company: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

export default mongoose.model("Brand", brandSchema);
