import * as inventoryService from "../services/inventory.service.js";
import * as transactionService from "../services/transaction.service.js";
import { InventoryItem } from "../models/InventoryItem.model.js";

// CREATE ITEM
export const createItem = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const {
      itemName,
      category,
      brand,
      color,
      vendorId,
      expiryDate,
      quantity,
      quantityUnit,
      description,
      billNumber,
      billDate,
      isDraft,
      code,
    } = req.body;

    if (!itemName || !category) {
      return res.status(400).json({ message: "itemName & category required" });
    }

    const fileUrl = req.file.path ? req.file.path : null;

    const itemPayload = {
      itemName,
      category,
      brand: brand || "N/A",
      color: color || "N/A",
      vendorId: vendorId || "N/A",
      expiryDate: expiryDate || "",
      quantity: Number(quantity) || 0,
      quantityUnit: quantityUnit || "piece",
      description: description || "",
      billNumber: billNumber || "",
      billDate: billDate || "",
      billAttachmentUrl: fileUrl,
      isDraft: isDraft === "true",
      code,
    };

    const created = await inventoryService.createItem(itemPayload);

    return res.status(201).json(created);
  } catch (err) {
    console.error("CREATE ITEM ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const listItems = async (req, res) => {
  const items = await inventoryService.getItems();
  res.json(items);
};

// UPDATE ITEM
export const updateItem = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.file) {
      data.billAttachmentUrl = `/uploads/${req.file.filename}`;
    }

    const updated = await inventoryService.updateItem(req.params.id, data);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE STOCK
export const updateStock = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { type, quantity, vendorId, billNumber, billDate, notes } = req.body;

    const item = await InventoryItem.findById(itemId);
    const currentStock = item.quantity;

    let newStock =
      type === "add"
        ? currentStock + Number(quantity)
        : currentStock - Number(quantity);

    // Update item stock
    item.quantity = newStock;
    item.vendorId = vendorId || item.vendorId;
    item.lastUpdate = new Date().toLocaleDateString();
    item.lastUpdateTime = new Date().toLocaleTimeString();
    await item.save();

    // Store transaction
    await transactionService.createTransaction({
      itemId,
      transactionType: type === "add" ? "Stock In" : "Stock Out",
      quantity,
      previousStock: currentStock,
      newStock,
      billNumber,
      vendorId,
      reason: type === "add" ? "Stock Added" : notes,
      remarks: notes,
      transactionDate: new Date().toISOString(),
      createdBy: "Admin",
    });

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HISTORY
export const getHistory = async (req, res) => {
  const { itemId } = req.params;
  const history = await transactionService.getTransactionsByItem(itemId);
  res.json(history);
};
