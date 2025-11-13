import { Router } from "express";
import {
  create, list, get, update, remove, updateStatus,
} from "../controllers/project.controller.js";
import { upload } from "../utils/upload.js";

const router = Router({ mergeParams: true });

const uploadFields = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "sampleImages", maxCount: 5 },
]);

// CRUD
router.post("/", uploadFields, create);     // POST   /api/projects
router.get("/", list);                      // GET    /api/projects?status=Prototype&company=...
router.get("/:id", get);                    // GET    /api/projects/:id
router.put("/:id", uploadFields, update);   // PUT    /api/projects/:id
router.delete("/:id", remove);              // DELETE /api/projects/:id

// ✅ Status-only update with history
router.patch("/:id/status", updateStatus);  // PATCH  /api/projects/:id/status

export default router;
