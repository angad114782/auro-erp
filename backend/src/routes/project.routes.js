// src/routes/project.routes.js
import { Router } from "express";
import {
  create, list, get, update, remove,
  updateStatus, updateNextUpdate, updateClientCost, updateClientApproval,
} from "../controllers/project.controller.js";
import { upload } from "../utils/upload.js";

const router = Router({ mergeParams: true });

const uploadFields = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "sampleImages", maxCount: 5 },
]);

// CRUD
router.post("/", uploadFields, create);
router.get("/", list);
router.get("/:id", get);
router.put("/:id", uploadFields, update);
router.delete("/:id", remove);

// Atomic PATCH actions
router.patch("/:id/status", updateStatus);
router.patch("/:id/next-update", updateNextUpdate);
router.patch("/:id/client-cost", updateClientCost);
router.patch("/:id/client-approval", updateClientApproval);

export default router;
