import express from "express";
import * as ctrl from "../controllers/microTracking.controller.js";

const router = express.Router();

// Get project micro tracking
router.get("/micro-tracking/project/:projectId", ctrl.getMicroTracking);

// Update one row
router.put("/micro-tracking/:id", ctrl.updateMicroTracking);
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



export default router;
