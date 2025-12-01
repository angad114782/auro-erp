import express from "express";
import * as ctrl from "../controllers/pc_materialRequest.controller.js";

const router = express.Router({ mergeParams: true });

// GET /api/projects/:projectId/material-requests
router.get("/", ctrl.getMaterialRequests);

// GET single
router.get("/:requestId", ctrl.getMaterialRequestById);

// PUT update
router.put("/:requestId", ctrl.updateMaterialRequest);

// DELETE
router.delete("/:requestId", ctrl.deleteMaterialRequest);

// router.get("/all/requests", ctrl.fetchmateriallist);
export default router;
