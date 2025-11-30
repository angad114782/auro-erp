import express from "express";
import * as ctrl from "../controllers/pc_productionCard.controller.js";

const router = express.Router({ mergeParams: true });

// POST /api/projects/:projectId/production-cards
router.post("/", ctrl.createProductionCard);

// GET list
router.get("/", ctrl.getProductionCards);

// GET single
router.get("/:cardId", ctrl.getProductionCardById);

// PUT update
router.put("/:cardId", ctrl.updateProductionCard);

// DELETE
router.delete("/:cardId", ctrl.deleteProductionCard);

// Preview next card number
router.get("/preview-next-number", ctrl.previewNextCardNumber);

export default router;
