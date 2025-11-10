// models/Company.model.js
import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);
schema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
export default mongoose.model("Company", schema);
