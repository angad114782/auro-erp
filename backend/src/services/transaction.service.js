import { InventoryTransaction } from "../models/InventoryTransaction.js";

export const createTransaction = async (data) => {
  try {
    return await InventoryTransaction.create(data);
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

export const getTransactionsByItem = async (itemId) => {
  try {
    return await InventoryTransaction.find({ itemId })
      .populate("vendorId")
      .populate("itemId")
      .sort({ createdAt: -1 });
  } catch (error) {
    console.error("Error getting transactions by item:", error);
    throw error;
  }
};

export const getAllTransactions = async () => {
  try {
    return await InventoryTransaction.find()
      .populate("vendorId")
      .populate("itemId")
      .sort({ createdAt: -1 });
  } catch (error) {
    console.error("Error getting all transactions:", error);
    throw error;
  }
};
