import express from "express";
import * as ctrl from "../controllers/microTracking.controller.js";

const router = express.Router();

// Get project micro tracking
router.get("/micro-tracking/project/:projectId", ctrl.getMicroTracking);

// Update one row
router.get("/micro-tracking/department/:projectId", ctrl.getDepartmentWiseTracking);

router.get(
  "/micro-tracking/department/:projectId/:department",
  ctrl.getDepartmentRows
);

router.put(
  "/micro-tracking/progress-today/:id",
  ctrl.updateProgressToday
);

router.get("/tracking/dashboard", ctrl.trackingDashboardController);
router.get("/tracking/dashboard/department", ctrl.trackingDashboardDepartmentController);



router.get(
  "/projects/:projectId/cards",
  ctrl.getProjectTrackingCards
);

// 🔥 Already exists (card select hone ke baad)
router.get(
  "/projects/:projectId/card/:cardId",
  ctrl.getProjectCardTracking
);



export default router;
