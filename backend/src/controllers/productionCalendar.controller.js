import mongoose from "mongoose";
import { searchProjectsForCalendarService, createCalendarEntryService } from "../services/productionCalendar.service.js";

export const searchProjectsForCalendar = async (req, res, next) => {
  try {
    const q = req.query.q || "";
    const limit = Number(req.query.limit) || 10;
    const results = await searchProjectsForCalendarService(q, { limit });
    return res.json({ message: "search results", data: results });
  } catch (err) {
    next(err);
  }
};

export const createCalendarEntry = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const payload = req.body;
      // optionally validate payload here or in service
      const result = await createCalendarEntryService(payload, { session, by: req.user?._id || null });
      return res.status(201).json({ message: "calendar entry created", data: result });
    });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};
