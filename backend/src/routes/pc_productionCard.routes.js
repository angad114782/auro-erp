import express from "express";
import * as ctrl from "../controllers/pc_productionCard.controller.js";

const router = express.Router({ mergeParams: true });

// POST /projects/:projectId/production-cards/skeleton
router.post("/skeleton", ctrl.createSkeleton);

router.get("/", ctrl.getProductionCards);
// preview next number
router.get("/preview-next-number", ctrl.previewNextCardNumber);

// GET /projects/:projectId/production-cards/  (list) - if you need list, you can expose root POST/GET in another controller
// Note: main list endpoints may already exist in your project routes.

router.get("/:cardId", ctrl.getCard);
router.put("/:cardId", ctrl.updateCard);
router.delete("/:cardId", ctrl.deleteCard);
export default router;
