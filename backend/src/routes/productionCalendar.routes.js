import { Router } from "express";
import { searchProjectsForCalendar, createCalendarEntry } from "../controllers/productionCalendar.controller.js";

const router = Router();

router.get("/calendar/search", searchProjectsForCalendar);
router.post("/calendar", createCalendarEntry);

export default router;
