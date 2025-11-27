import mongoose from "mongoose";
import {
  searchProjectsForCalendarService,
  createCalendarEntryService,
  listCalendarEntriesService,
  getCalendarEntryService,
  updateCalendarEntryService,
  deleteCalendarEntryService,
} from "../services/productionCalendar.service.js";

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
      const created = await createCalendarEntryService(payload, {
        session,
        by: req.user?._id || null,
      });
      return res.status(201).json({ message: "calendar entry created", data: created });
    });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

export const listCalendarEntries = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const list = await listCalendarEntriesService({ page: Number(page), limit: Number(limit) });
    return res.json({ message: "calendar list", data: list });
  } catch (err) {
    next(err);
  }
};

export const getCalendarEntry = async (req, res, next) => {
  try {
    const id = req.params.id;
    const doc = await getCalendarEntryService(id);
    if (!doc) return res.status(404).json({ message: "calendar entry not found" });
    return res.json({ message: "calendar entry", data: doc });
  } catch (err) {
    next(err);
  }
};

export const updateCalendarEntry = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const id = req.params.id;
      const payload = req.body;
      const updated = await updateCalendarEntryService(id, payload, { session, by: req.user?._id || null });
      if (!updated) return res.status(404).json({ message: "calendar entry not found" });
      return res.json({ message: "calendar entry updated", data: updated });
    });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

export const deleteCalendarEntry = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const id = req.params.id;
      const deleted = await deleteCalendarEntryService(id, { session, by: req.user?._id || null });
      if (!deleted) return res.status(404).json({ message: "calendar entry not found" });
      return res.json({ message: "calendar entry deleted", data: deleted });
    });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};
