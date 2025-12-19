import express, { Router } from "express";
import * as ctrl from "../controllers/delivery.controller.js";

// const router = express.Router();
const router = Router({ mergeParams: true });
// ACTION ROUTES
router.put(
  "/projects/:projectId/send-to-delivery",
  ctrl.sendToDeliveryController
);
router.put("/delivery/parcel/:id", ctrl.markParcelDeliveredController);
router.put("/delivery/final/:id", ctrl.markDeliveredController);

// Update delivery information (bill number, delivery date, LR number)
router.put("/delivery/update/:id", ctrl.updatedDelivery);

// GET LIST ROUTES
router.get("/delivery/pending", ctrl.getPendingDeliveriesController);
router.get("/delivery/parcel-delivered", ctrl.getParcelDeliveredController);
router.get("/delivery/delivered", ctrl.getDeliveredController);

export default router;
