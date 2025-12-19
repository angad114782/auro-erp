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

// In services/inventoryService.js
export const updateItem = async (id, data) => {
  // Add the update timestamp
  const updateData = {
    ...data,
    updatedAt: new Date(),
  };

  // If converting from draft to non-draft, update additional fields
  if (data.isDraft === false) {
    updateData.isDraft = false;
    updateData.lastUpdate = new Date().toLocaleDateString();
    updateData.lastUpdateTime = new Date().toLocaleTimeString();
  }

  return await InventoryItem.findByIdAndUpdate(id, updateData, {
    new: true,
  }).populate("vendorId");
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
