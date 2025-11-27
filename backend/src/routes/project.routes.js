import { Router } from "express";
import {
  create,
  list,
  get,
  update,
  remove,
  updateStatus,
  updateNextUpdate,
  updateClientCost,
  updateClientApproval,
  updatePO,
  searchProjects,
} from "../controllers/project.controller.js";

import { moveToProduction } from "../controllers/project.controller.js";

import {
  cloneDefault as cloneDefaultVariants,
  getOne as getColorVariant,
  upsertOne as upsertColorVariant,
  removeOne as deleteColorVariant,
} from "../controllers/colorVariant.controller.js";

import {
  listProductionProjects,
  getProductionProject,
  updateProductionProject,
  deleteProductionProject,
} from "../controllers/productionProject.controller.js";


import { upload } from "../utils/upload.js";

const router = Router({ mergeParams: true });

const uploadFields = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "sampleImages", maxCount: 5 },
]);
router.get("/search", searchProjects);

/** CRUD */
router.post("/", uploadFields, create);
router.get("/", list);
router.get("/:id", get);
router.put("/:id", uploadFields, update);
router.delete("/:id", remove);

/** Atomic project actions */
router.patch("/:id/status", updateStatus);
router.patch("/:id/next-update", updateNextUpdate); // { date, note }
router.patch("/:id/client-cost", updateClientCost); // { amount }
router.patch("/:id/client-approval", updateClientApproval); // { status }
router.patch("/:id/po", updatePO);

/** Color Variant APIs (colorId is an ID like 'c_black') */
router.post("/:id/color-variants/clone-default", cloneDefaultVariants);
router.get("/:id/color-variants/:colorId", getColorVariant);
router.put("/:id/color-variants/:colorId", upsertColorVariant);
router.delete("/:id/color-variants/:colorId", deleteColorVariant);


router.post("/:id/move-to-production", moveToProduction);
// ProductionProject endpoints (collection-level)
router.get("/:id/production", listProductionProjects);    // list (by project or global)
router.get("/:id/production/:prodId", getProductionProject); // get single production (prodId)
router.put("/:id/production/:prodId", updateProductionProject); // full update / patch-like
router.delete("/:id/production/:prodId", deleteProductionProject); // soft-delete


export default router;
