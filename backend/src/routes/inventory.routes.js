import { Router } from "express";
// import {
//   createItem,
//   updateItem,
//   updateStock,
//   listItems,
//   getHistory,
// } from "../controllers/inventory.controller.js";
import { upload } from "../utils/upload.js";
import {
  createItem,
  updateItem,
  updateStock,
  listItems,
  getHistory,
  getAllHistory,
} from "../controllers/inventory.controller.js";

const router = Router({ mergeParams: true });

// CREATE ITEM
router.post("/", upload.single("billAttachment"), createItem);

// UPDATE ITEM
router.put("/:id", upload.single("billAttachment"), updateItem);

// GET ALL ITEMS
router.get("/", listItems);

// UPDATE STOCK
router.post("/stock/:itemId", updateStock);

// GET ITEM HISTORY
router.get("/history/:itemId", getHistory);

// GET ALL HISTORY
router.get("/history-all", getAllHistory);

export default router;
