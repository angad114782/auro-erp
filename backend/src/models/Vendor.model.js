import mongoose from "mongoose";

const VendorSchema = new mongoose.Schema(
  {
    vendorName: { type: String, required: true },
    vendorId: { type: String },
    status: { type: String, default: "Active" },

    contactPerson: { type: String },
    phone: { type: String },
    email: { type: String },

    // itemName: { type: String },
    // itemCode: { type: String },
    // brand: { type: String },

    countryId: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Vendor = mongoose.model("Vendor", VendorSchema);
