import ProductionCalendar from "../models/ProductionCalendar.model.js";
import { Project } from "../models/Project.model.js";
import { PoDetails } from "../models/PoDetails.model.js";
import Fuse from "fuse.js";
import mongoose from "mongoose";

// --- existing search service (unchanged) ---
export const searchProjectsForCalendarService = async (q, { limit = 10 } = {}) => {
  const cleanQ = (q || "").trim();
  if (!cleanQ) {
    const recent = await Project.find({ isActive: true })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select("autoCode artName color size brand category")
      .populate("brand", "name")
      .populate("category", "name")
      .lean();
    return recent.map(mapProjectForAutocomplete);
  }

  const regex = new RegExp(escapeRegExp(cleanQ), "i");
  const candidates = await Project.find({
    isActive: true,
    $or: [
      { autoCode: { $regex: regex } },
      { artName: { $regex: regex } },
      { color: { $regex: regex } },
    ],
  })
    .limit(200)
    .select("autoCode artName color size brand category")
    .populate("brand", "name")
    .populate("category", "name")
    .lean();

  if (candidates.length <= limit) return candidates.map(mapProjectForAutocomplete);

  const fuse = new Fuse(candidates, {
    keys: [
      { name: "autoCode", weight: 0.6 },
      { name: "artName", weight: 0.9 },
      { name: "color", weight: 0.4 },
    ],
    threshold: 0.35,
  });

  const fuseResults = fuse.search(cleanQ, { limit });
  return fuseResults.map((r) => mapProjectForAutocomplete(r.item));
};

function mapProjectForAutocomplete(p) {
  return {
    _id: p._id,
    autoCode: p.autoCode,
    artName: p.artName,
    display: `${p.autoCode} — ${p.artName} ${p.color ? `(${p.color})` : ""}`,
    color: p.color,
    size: p.size,
    brand: p.brand?.name || null,
    category: p.category?.name || null,
  };
}
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --- create calendar entry (as before) ---
export const createCalendarEntryService = async (payload, { session, by = null } = {}) => {
  const { projectId, scheduling, productionDetails, additional } = payload || {};
  if (!projectId) {
    const err = new Error("projectId is required");
    err.status = 400;
    throw err;
  }
  if (!scheduling || !scheduling.scheduleDate) {
    const err = new Error("scheduling.scheduleDate is required");
    err.status = 400;
    throw err;
  }
  if (!productionDetails || productionDetails.quantity == null) {
    const err = new Error("productionDetails.quantity is required");
    err.status = 400;
    throw err;
  }

  const project = await Project.findById(projectId).session(session);
  if (!project || !project.isActive) {
    const err = new Error("Project not found or not active");
    err.status = 404;
    throw err;
  }

  const po = await PoDetails.findOne({ project: project._id }).lean().session(session);

  const snapshot = {
    autoCode: project.autoCode,
    artName: project.artName,
    productDesc: project.productDesc,
    color: project.color,
    size: project.size,
    brand: project.brand || null,
    category: project.category || null,
    poNumber: po?.poNumber || "",
    poRef: po?._id || null,
  };

  const doc = {
    project: project._id,
    projectSnapshot: snapshot,
    scheduling: {
      scheduleDate: new Date(scheduling.scheduleDate),
      assignedPlant: scheduling.assignedPlant || "",
      soleFrom: scheduling.soleFrom || "",
      soleColor: scheduling.soleColor || "",
      soleExpectedDate: scheduling.soleExpectedDate ? new Date(scheduling.soleExpectedDate) : null,
    },
    productionDetails: {
      quantity: Number(productionDetails.quantity),
    },
    additional: {
      remarks: additional?.remarks || "",
    },
    createdBy: by,
    updatedBy: by,
    isActive: true,
  };

  const created = await ProductionCalendar.create([doc], { session });
  return created[0];
};

// --- list (only active) with pagination ---
export const listCalendarEntriesService = async ({ page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const docs = await ProductionCalendar.find({ isActive: true })
    .sort({ scheduling: 1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("project", "autoCode artName color")
    .lean();

  const total = await ProductionCalendar.countDocuments({ isActive: true });
  return { items: docs, total, page, limit };
};

// --- get single (only active) ---
export const getCalendarEntryService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const doc = await ProductionCalendar.findOne({ _id: id, isActive: true })
    .populate("project projectSnapshot.brand projectSnapshot.category")
    .lean();
  return doc;
};

// --- update (partial replace) ---
export const updateCalendarEntryService = async (id, payload, { session, by = null } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const update = {};

  if (payload.scheduling) {
    update["scheduling"] = {
      scheduleDate: payload.scheduling.scheduleDate ? new Date(payload.scheduling.scheduleDate) : undefined,
      assignedPlant: payload.scheduling.assignedPlant,
      soleFrom: payload.scheduling.soleFrom,
      soleColor: payload.scheduling.soleColor,
      soleExpectedDate: payload.scheduling.soleExpectedDate ? new Date(payload.scheduling.soleExpectedDate) : null,
    };
  }

  if (payload.productionDetails) {
    update["productionDetails"] = {
      quantity: payload.productionDetails.quantity != null ? Number(payload.productionDetails.quantity) : undefined,
    };
  }

  if (payload.additional) {
    update["additional"] = {
      remarks: payload.additional.remarks != null ? payload.additional.remarks : undefined,
    };
  }

  // cleaned update: remove undefined keys
  const setObj = {};
  Object.keys(update).forEach((k) => {
    if (update[k] !== undefined) setObj[k] = update[k];
  });
  if (Object.keys(setObj).length === 0 && payload.isActive === undefined) {
    const err = new Error("nothing to update");
    err.status = 400;
    throw err;
  }

  // track who updated
  setObj.updatedBy = by;
  setObj.updatedAt = new Date();

  const doc = await ProductionCalendar.findOneAndUpdate(
    { _id: id, isActive: true },
    { $set: setObj },
    { new: true, session }
  );
  return doc;
};

// --- soft delete ---
export const deleteCalendarEntryService = async (id, { session, by = null } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const doc = await ProductionCalendar.findOneAndUpdate(
    { _id: id, isActive: true },
    {
      $set: {
        isActive: false,
        updatedBy: by,
        updatedAt: new Date(),
      },
    },
    { new: true, session }
  );

  return doc;
};
