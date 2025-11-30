import { Router } from "express";
import { createMaterialRequest, listMaterialRequests, updateMaterialRequest } from "../controllers/materialRequest.controller.js";
const router = Router();
router.post("/", createMaterialRequest);
router.get("/", listMaterialRequests);
router.patch("/:id", updateMaterialRequest);
export default router;
