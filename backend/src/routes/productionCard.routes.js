import { Router } from "express";
import {
  createProductionCard,
  listProductionCards,
  getProductionCard,
} from "../controllers/productionCard.controller.js";

const router = Router();

router.post("/", createProductionCard);
router.get("/", listProductionCards);
router.get("/:id", getProductionCard);

export default router;
