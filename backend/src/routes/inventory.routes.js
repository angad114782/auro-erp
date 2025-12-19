import { Router } from "express";
import { upload } from "../utils/upload.js";
import {
  createItem,
  updateItem,
  updateStock,
  listItems,
  getHistory,
  getAllHistory,
  softDeleteItem,
  reserveCode,
  getTransactionsByVendor,
} from "../controllers/inventory.controller.js";

const router = Router({ mergeParams: true });

// RESERVE CODE (Get next available code without incrementing)
router.get("/reserve-code", reserveCode);

// CREATE ITEM
router.post("/", upload.single("billAttachment"), createItem);

// UPDATE ITEM
router.put("/:id", upload.single("billAttachment"), updateItem);

// GET ALL ITEMS
router.get("/", listItems);

// UPDATE STOCK
router.post("/stock/:itemId", upload.single("billAttachment"), updateStock);

// GET ITEM HISTORY
router.get("/history/:itemId", getHistory);

// GET ALL HISTORY
router.get("/history-all", getAllHistory);

// SOFT DELETE ITEM
router.patch("/:id/soft-delete", softDeleteItem);

router.get("/vendor/:vendorId", getTransactionsByVendor);

export default router;
