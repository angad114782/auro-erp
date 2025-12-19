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

// // CREATE ITEM
// export const createItem = async (req, res) => {
//   try {
//     console.log("BODY:", req.body);
//     console.log("FILE:", req.file);

//     const {
//       itemName,
//       category,
//       color,
//       vendorId,
//       expiryDate,
//       quantity,
//       quantityUnit,
//       description,
//       billNumber,
//       billDate,
//       isDraft,
//       // Code is NOT in body - will be generated
//     } = req.body;

//     if (!itemName || !category) {
//       return res.status(400).json({ message: "itemName & category required" });
//     }

//     const fileUrl = req.file?.path || null;

//     // Generate code on backend
//     const code = await generateItemCode();

//     const itemPayload = {
//       itemName,
//       category,
//       // brand: brand || "N/A",
//       color: color || "N/A",
//       vendorId: vendorId || null,
//       expiryDate: expiryDate || "",
//       quantity: Number(quantity) || 0,
//       quantityUnit: quantityUnit || "piece",
//       description: description || "",
//       billNumber: billNumber || "",
//       billDate: billDate || "",
//       billAttachmentUrl: fileUrl,
//       isDraft: isDraft === "true",
//       code,
//     };

//     const created = await inventoryService.createItem(itemPayload);

//     // Create initial transaction when item is created and has quantity
//     if (isDraft !== "true" && Number(quantity) > 0) {
//       await transactionService.createTransaction({
//         itemId: created._id,
//         transactionType: "Stock In",
//         quantity: Number(quantity) || 0,
//         previousStock: 0,
//         newStock: Number(quantity) || 0,
//         billNumber: billNumber || "",
//         vendorId: vendorId || null,
//         reason: "Initial stock",
//         remarks: "Item created with initial stock",
//         transactionDate: new Date().toISOString(),
//         billAttachmentUrl: fileUrl,
//         createdBy: "Admin",
//       });
//     }

//     return res.status(201).json(created);
//   } catch (err) {
//     console.error("CREATE ITEM ERROR:", err);
//     return res.status(500).json({ message: err.message });
//   }
// };
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
    } = req.body;

    if (!itemName || !category) {
      return res.status(400).json({ message: "itemName & category required" });
    }

    const fileUrl = req.file?.path || null;
    const code = await generateItemCode();

    const itemPayload = {
      itemName,
      category,
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

    // Create transaction only if NOT a draft AND has quantity
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
    const { id } = req.params;

    console.log("UPDATE ITEM DATA:", data); // Debug log
    console.log("Item ID:", id); // Debug log

    if (req.file) {
      data.billAttachmentUrl = `/uploads/${req.file.filename}`;
    }

    // Get the current item before update
    const currentItem = await InventoryItem.findById(id);
    console.log("Current Item (before update):", {
      _id: currentItem?._id,
      isDraft: currentItem?.isDraft,
      quantity: currentItem?.quantity,
    });

    if (!currentItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Update the item
    const updated = await inventoryService.updateItem(id, data);

    console.log("Updated Item:", {
      _id: updated?._id,
      isDraft: updated?.isDraft,
      quantity: updated?.quantity,
    });

    // Check if item WAS a draft and is NOW converted to non-draft
    if (
      currentItem.isDraft === true &&
      updated.isDraft === false && // Now it's not a draft
      updated.quantity > 0
    ) {
      console.log("Creating transaction for draft conversion...");

      // Create initial transaction for draft conversion
      await transactionService.createTransaction({
        itemId: id,
        transactionType: "Stock In",
        quantity: Number(updated.quantity),
        previousStock: 0, // Since it was a draft, previous stock was effectively 0
        newStock: Number(updated.quantity),
        billNumber: updated.billNumber || "",
        vendorId: updated.vendorId?._id || updated.vendorId || null,
        reason: "Initial stock from draft conversion",
        remarks: "Draft item converted to active with initial stock",
        transactionDate: new Date().toISOString(),
        billAttachmentUrl: updated.billAttachmentUrl || null,
        createdBy: "Admin",
      });

      console.log("Transaction created successfully");
    }

    res.json(updated);
  } catch (err) {
    console.error("UPDATE ITEM ERROR:", err);
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
    const {
      page = 1,
      limit = 10,
      search = "",
      from,
      to,
      reportType = "daily",
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    /* ----------------------------------------------------
       DATE FILTER (COMMON)
    ---------------------------------------------------- */
    const dateMatch = {};

    if (from && to) {
      dateMatch.createdAt = {
        $gte: new Date(from),
        $lte: new Date(new Date(to).setHours(23, 59, 59, 999)),
      };
    } else if (reportType !== "daily") {
      const now = new Date();
      let start = new Date();

      if (reportType === "weekly") start.setDate(now.getDate() - 7);
      if (reportType === "monthly") start.setMonth(now.getMonth() - 1);
      if (reportType === "yearly") start.setFullYear(now.getFullYear() - 1);

      dateMatch.createdAt = { $gte: start, $lte: now };
    }

    /* ----------------------------------------------------
       AGGREGATION PIPELINE
    ---------------------------------------------------- */
    const pipeline = [
      { $match: dateMatch },

      // JOIN ITEMS
      {
        $lookup: {
          from: "inventoryitems",
          localField: "itemId",
          foreignField: "_id",
          as: "item",
        },
      },
      { $unwind: { path: "$item", preserveNullAndEmptyArrays: true } },

      // JOIN VENDORS
      {
        $lookup: {
          from: "vendors",
          localField: "vendorId",
          foreignField: "_id",
          as: "vendor",
        },
      },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
    ];

    /* ----------------------------------------------------
       SEARCH (NOW WORKS PROPERLY)
    ---------------------------------------------------- */
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { billNumber: { $regex: search, $options: "i" } },
            { "item.itemName": { $regex: search, $options: "i" } },
            { "item.code": { $regex: search, $options: "i" } },
            { "vendor.vendorName": { $regex: search, $options: "i" } },
            { "vendor.contactPerson": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    /* ----------------------------------------------------
       FACET: DATA + STATS + COUNT
    ---------------------------------------------------- */
    pipeline.push({
      $facet: {
        // PAGINATED DATA
        transactions: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limitNum },
          {
            $project: {
              itemId: "$item",
              vendorId: "$vendor",
              transactionType: 1,
              quantity: 1,
              previousStock: 1,
              newStock: 1,
              billNumber: 1,
              billDate: 1,
              transactionDate: 1,
              orderValue: 1,
              reason: 1,
              remarks: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],

        // TOTAL COUNT
        totalCount: [{ $count: "count" }],

        // GLOBAL STATS (FILTERED BUT NOT PAGINATED)
        stats: [
          {
            $group: {
              _id: "$transactionType",
              totalQuantity: { $sum: "$quantity" },
              totalValue: { $sum: "$orderValue" },
              count: { $sum: 1 },
            },
          },
        ],
      },
    });

    /* ----------------------------------------------------
       EXECUTE
    ---------------------------------------------------- */
    const [result] = await InventoryTransaction.aggregate(pipeline);

    const transactions = result.transactions || [];
    const totalItems = result.totalCount[0]?.count || 0;

    let stats = {
      totalStockIn: 0,
      totalStockOut: 0,
      totalOrderValue: 0,
      stockInCount: 0,
      stockOutCount: 0,
    };

    result.stats.forEach((s) => {
      if (s._id === "Stock In") {
        stats.totalStockIn = s.totalQuantity;
        stats.totalOrderValue = s.totalValue;
        stats.stockInCount = s.count;
      }
      if (s._id === "Stock Out") {
        stats.totalStockOut = s.totalQuantity;
        stats.stockOutCount = s.count;
      }
    });

    /* ----------------------------------------------------
       RESPONSE
    ---------------------------------------------------- */
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalItems / limitNum),
          totalItems,
          pageSize: limitNum,
        },
        stats,
      },
    });
  } catch (err) {
    console.error("getAllHistory error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
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
