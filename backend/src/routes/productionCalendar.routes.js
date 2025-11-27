import { Router } from "express";
import {
  searchProjectsForCalendar,
  createCalendarEntry,
  listCalendarEntries,
  getCalendarEntry,
  updateCalendarEntry,
  deleteCalendarEntry,
} from "../controllers/productionCalendar.controller.js";

const router = Router();

// Search projects for autocomplete (existing)
router.get("/calendar/search", searchProjectsForCalendar);

// Calendar CRUD
router.post("/calendar", createCalendarEntry);        // create
router.get("/calendar", listCalendarEntries);         // list (only active)
router.get("/calendar/:id", getCalendarEntry);        // get single (only active)
router.put("/calendar/:id", updateCalendarEntry);     // update (partial/put)
router.delete("/calendar/:id", deleteCalendarEntry);  // soft-delete -> isActive = false

export default router;
