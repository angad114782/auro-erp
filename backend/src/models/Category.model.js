import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    brand:   { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    isActive:{ type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// (company, brand, name) unique — case-insensitive
categorySchema.index(
  { company: 1, brand: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

export default mongoose.model("Category", categorySchema);
