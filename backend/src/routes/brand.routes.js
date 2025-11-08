import { Router } from "express";
import {
  create,
  list,
  get,
  update,
  remove,
} from "../controllers/brand.controller.js";

const router = Router({ mergeParams: true });

router.post("/", create); // POST /api/brands
router.get("/", list); // GET  /api/brands?company=...
router.get("/:id", get); // GET  /api/brands/:id
router.put("/:id", update); // PUT  /api/brands/:id
router.delete("/:id", remove); // DELETE /api/brands/:id

export default router;
