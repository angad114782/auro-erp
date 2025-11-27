import { Vendor } from "../models/Vendor.model.js";

export const createVendor = async (data) => {
  return await Vendor.create(data);
};

export const getVendors = async () => {
  return await Vendor.find({ isActive: true }).sort({ createdAt: -1 });
};

export const getVendorById = async (id) => {
  return await Vendor.findById(id);
};

export const updateVendor = async (id, updates) => {
  return await Vendor.findByIdAndUpdate(id, updates, { new: true });
};

export const deleteVendor = async (id) => {
  return await Vendor.findByIdAndUpdate(id, { isActive: false }, { new: true });
};
