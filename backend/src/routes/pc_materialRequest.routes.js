import express from "express";
import * as mrController from "../controllers/pc_materialRequest.controller.js";

const router = express.Router({ mergeParams: true });

// create MR for a card (mounted at root in app -> POST /production-cards/:cardId/material-requests)
router.post(
  "/production-cards/:cardId/material-requests",
  mrController.createMR
);

// list MRs (global) -> GET /material-requests
router.get("/material-requests", mrController.listMRs);

router.get("/material-requests/:mrId", mrController.getMR);

// update MR -> PUT /material-requests/:mrId
router.put("/material-requests/:mrId", mrController.updateMR);

// soft-delete MR -> DELETE /material-requests/:mrId
router.delete("/material-requests/:mrId", mrController.softDeleteMR);

export default router;
