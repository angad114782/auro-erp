import express, { Router } from "express";
import {
  createProductionCard,
  listProductionCards,
  getProductionCard,
} from "../controllers/productionCard.controller.js";

const router = express.Router({ mergeParams: true });

router.post("/", createProductionCard);
router.get("/", listProductionCards);
router.get("/:id", getProductionCard);

export default router;
