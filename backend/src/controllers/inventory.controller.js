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

// inventoryController.js
// inventoryController.js - Updated listItems function
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
    // If isDraft is not specified, don't filter by it (show all)

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
    delete categoryFilter.category; // Remove category filter to get all categories

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

export const getAllHistory = async (req, res) => {
  try {
    const list = await transactionService.getAllTransactions();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Soft delete an item (mark isDeleted = true)
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
