import express from "express";
import * as ctrl from "../controllers/microTracking.controller.js";

const router = express.Router();

// Get project micro tracking
router.get("/micro-tracking/project/:projectId", ctrl.getMicroTracking);

router.get(
  "/micro-tracking/department/:projectId",
  ctrl.getDepartmentWiseTracking
);

router.get(
  "/project/:projectId/card/:cardId/department/:department",
  ctrl.getDepartmentRows
);

router.put("/micro-tracking/progress-today", ctrl.updateProgressToday);
router.post("/micro-tracking/bulk/today", ctrl.bulkTodayProcess);

router.get("/tracking/dashboard", ctrl.trackingDashboardController);
router.get(
  "/tracking/dashboard/department",
  ctrl.trackingDashboardDepartmentController
);

router.get("/projects/:projectId/cards", ctrl.getProjectTrackingCards); // traking cards list for dropdown

router.get("/projects/:projectId/cards/:cardId", ctrl.getProjectCardTracking); // cards complete info

router.post("/micro-tracking/transfer", ctrl.transferToNextDepartment);
router.post("/micro-tracking/transfer-today", ctrl.transferTodayWork);
// ✅ Tracking history for a project (optional stage filter)
router.get("/projects/:projectId/tracking-history", ctrl.getTrackingHistory);
router.get(
  "/summary",
  ctrl.getDeptCardSummaryController
);
export default router;
