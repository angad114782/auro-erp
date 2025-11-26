import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    vendorName: { type: String, required: true },
    contactPerson: String,
    phone: String,
    email: String,
  },
  { timestamps: true }
);

export const Vendor = mongoose.model("Vendor", vendorSchema);
