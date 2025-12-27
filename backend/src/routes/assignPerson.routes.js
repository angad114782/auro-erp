import { Router } from "express";
import {
  create,
  list,
  get,
  update,
  remove,
} from "../controllers/assignPerson.controller.js";
const router = Router();
router.post("/", create);
router.get("/", list);
router.get("/:id", get);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
