import * as inventoryService from "../services/inventory.service.js";
import * as transactionService from "../services/transaction.service.js";
import { InventoryItem } from "../models/InventoryItem.model.js";
import {
  generateItemCode,
  getReservedCode,
} from "../services/sequenceServices.js";
import mongoose from "mongoose";
import { InventoryTransaction } from "../models/InventoryTransaction.js";

// RESERVE CODE
export const reserveCode = async (req, res) => {
  try {
    const reservedCode = await getReservedCode();
    res.json({ code: reservedCode });
  } catch (error) {
    console.error("Error reserving code:", error);
    res.status(500).json({ message: "Failed to reserve code" });
  }
};

// CREATE ITEM
export const createItem = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const {
      itemName,
      category,
      color,
      vendorId,
      expiryDate,
      quantity,
      quantityUnit,
      description,
      billNumber,
      billDate,
      isDraft,
      // Code is NOT in body - will be generated
    } = req.body;

    if (!itemName || !category) {
      return res.status(400).json({ message: "itemName & category required" });
    }

    const fileUrl = req.file?.path || null;

    // Generate code on backend
    const code = await generateItemCode();

    const itemPayload = {
      itemName,
      category,
      // brand: brand || "N/A",
      color: color || "N/A",
      vendorId: vendorId || null,
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

    // Create initial transaction when item is created and has quantity
    if (isDraft !== "true" && Number(quantity) > 0) {
      await transactionService.createTransaction({
        itemId: created._id,
        transactionType: "Stock In",
        quantity: Number(quantity) || 0,
        previousStock: 0,
        newStock: Number(quantity) || 0,
        billNumber: billNumber || "",
        vendorId: vendorId || null,
        reason: "Initial stock",
        remarks: "Item created with initial stock",
        transactionDate: new Date().toISOString(),
        billAttachmentUrl: fileUrl,
        createdBy: "Admin",
      });
    }

    return res.status(201).json(created);
  } catch (err) {
    console.error("CREATE ITEM ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

// LIST ITEMS
export const listItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category = "",
      isDraft = false,
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = { isDeleted: { $ne: true } };

    // Handle isDraft filter
    if (isDraft === "true" || isDraft === true) {
      filter.isDraft = true;
    } else if (isDraft === "false" || isDraft === false) {
      filter.isDraft = false;
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    // Build search query
    if (search) {
      filter.$or = [
        { itemName: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { subCategory: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { color: { $regex: search, $options: "i" } },
        { "vendorId.vendorName": { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await InventoryItem.countDocuments(filter);

    // Get items with pagination
    const items = await InventoryItem.find(filter)
      .populate("vendorId")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(limitNum);

    // Get category counts for current filters (excluding category filter)
    const categoryFilter = { ...filter };
    delete categoryFilter.category;

    const categoryCounts = await InventoryItem.aggregate([
      { $match: categoryFilter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Convert to object format
    const categories = categoryCounts.reduce((acc, curr) => {
      acc[curr._id || "Uncategorized"] = curr.count;
      return acc;
    }, {});

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      items,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        categoryCounts: categories,
        totalAll: await InventoryItem.countDocuments({
          ...filter,
          category: { $exists: true },
        }),
      },
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Server error" });
  }
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
    const { type, quantity, vendorId, billNumber, notes, billDate } = req.body;

    // Get file if uploaded

    const fileUrl = req.file?.path || null;

    const item = await InventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const currentStock = item.quantity;
    let newStock;

    if (type === "add") {
      if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
        item.vendorId = vendorId;
      }
    }

    if (type === "add") {
      newStock = currentStock + Number(quantity);
    } else if (type === "reduce") {
      newStock = currentStock - Number(quantity);
      if (newStock < 0) {
        return res.status(400).json({ message: "Insufficient stock" });
      }
    } else {
      return res.status(400).json({ message: "Invalid type" });
    }

    // Update item stock
    item.quantity = newStock;
    if (vendorId && vendorId !== "undefined") item.vendorId = vendorId;
    item.lastUpdate = new Date().toLocaleDateString();
    item.lastUpdateTime = new Date().toLocaleTimeString();
    await item.save();

    const transactionData = {
      itemId,
      transactionType: type === "add" ? "Stock In" : "Stock Out",
      quantity: Number(quantity),
      previousStock: currentStock,
      newStock,
      billDate,
      vendorId: type === "add" ? vendorId : undefined,
      billNumber: type === "add" ? billNumber || "" : "",
      billAttachmentUrl: type === "add" ? fileUrl : null,
      reason: type === "add" ? "Stock Added" : notes || "Stock Reduced",
      remarks: notes || "",
      transactionDate: new Date().toISOString(),
      createdBy: "Admin",
    };

    await transactionService.createTransaction(transactionData);

    res.json({
      success: true,
      item,
      transaction: transactionData,
    });
  } catch (err) {
    console.error("UPDATE STOCK ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// HISTORY
export const getHistory = async (req, res) => {
  try {
    const { itemId } = req.params;
    const history = await transactionService.getTransactionsByItem(itemId);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllHistory = async (req, res) => {
  try {
    const list = await transactionService.getAllTransactions();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Soft delete an item
export const softDeleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await inventoryService.softDeleteItem(id);
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("SOFT DELETE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export async function getTransactionsByVendor(req, res) {
  try {
    const { vendorId } = req.params;
    const { itemId, transactionType, fromDate, toDate } = req.query;

    if (!vendorId) {
      return res.status(400).json({
        message: "Vendor ID is required",
      });
    }

    const query = {
      vendorId,
    };

    // Optional filters
    if (itemId) query.itemId = itemId;
    if (transactionType) query.transactionType = transactionType;

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const transactions = await InventoryTransaction.find(query)
      .populate("itemId", "itemName code category quantityUnit")
      .populate("vendorId", "vendorName vendorId phone email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      count: transactions.length,
      items: transactions,
    });
  } catch (error) {
    console.error("Get vendor transactions error:", error);
    res.status(500).json({
      message: "Failed to fetch vendor transactions",
    });
  }
}
