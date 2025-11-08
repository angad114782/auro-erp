import { Router } from "express";
import {
  create,
  list,
  get,
  update,
  remove,
} from "../controllers/project.controller.js";
import { upload } from "../utils/upload.js";

const router = Router({ mergeParams: true });

const uploadFields = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "sampleImages", maxCount: 5 },
]);

router.post("/", uploadFields, create); // POST /api/projects
router.get("/", list); // GET  /api/projects?company=..&brand=..&category=..
router.get("/:id", get); // GET  /api/projects/:id
router.put("/:id", uploadFields, update); // PUT  /api/projects/:id
router.delete("/:id", remove); // DELETE /api/projects/:id

export default router;
