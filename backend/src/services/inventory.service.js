import { InventoryItem } from "../models/InventoryItem.model.js";

export const createItem = async (data) => {
  try {
    const item = await InventoryItem.create(data);
    return item;
  } catch (err) {
    console.error("MONGO ERROR:", err);
    throw err;
  }
};

export const updateItem = async (id, data) => {
  return await InventoryItem.findByIdAndUpdate(id, data, { new: true });
};

export const getItems = async () => {
  // return only non-deleted items by default
  return await InventoryItem.find({ isDeleted: { $ne: true } }).populate(
    "vendorId"
  );
};

export const getItemById = async (id) => {
  return await InventoryItem.findById(id).populate("vendorId");
};

export const deleteItem = async (id) => {
  return await InventoryItem.findByIdAndDelete(id);
};

export const softDeleteItem = async (id) => {
  return await InventoryItem.findByIdAndUpdate(
    id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
};
