// pc_productionCard.routes.js
import express from "express";
import * as ctrl from "../controllers/pc_productionCard.controller.js";

const router = express.Router({ mergeParams: true });

// specific routes first
router.post("/skeleton", ctrl.createSkeleton);
router.get("/", ctrl.getProductionCards);
router.get("/preview-next-number", ctrl.previewNextCardNumber);
router.get("/tracking-overview", ctrl.getProjectTrackingOverviewController);
router.get("/tracking-materials", ctrl.getTrackingMaterialsController);
// GET /tracking-by-department/:department
router.get("/tracking-by-department/:department", ctrl.getTrackingByDepartmentController);
router.get("/tracking-by-department", ctrl.getTrackingByDepartmentAcrossProjectsFlattenedController);


// then param-based routes
router.get("/:cardId", ctrl.getCard);
router.put("/:cardId", ctrl.updateCard);
router.delete("/:cardId", ctrl.deleteCard);
router.put("/:cardId/stage", ctrl.changeStageController);

export default router;
