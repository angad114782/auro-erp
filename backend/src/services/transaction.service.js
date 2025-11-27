import { InventoryTransaction } from "../models/InventoryTransaction.js";

export const createTransaction = async (data) => {
  return await InventoryTransaction.create(data);
};

export const getTransactionsByItem = async (itemId) => {
  return await InventoryTransaction.find({ itemId })
    .populate("vendorId")
    .sort({ createdAt: -1 });
};
