import { Router } from "express";
import {
  create,
  list,
  get,
  update,
  remove,
} from "../controllers/country.controller.js";
import { countryDashboardController } from "../controllers/country.dashboard.controller.js";
const router = Router({ mergeParams: true });
router.get("/dashboard", countryDashboardController);
router.post("/", create);
router.get("/", list);
router.get("/:id", get);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
