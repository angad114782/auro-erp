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

// --- create calendar entry (fixed session/lean usage) ---
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

  // fetch project — attach session to the query when provided
  let projectQuery = Project.findById(projectId)
    .populate("brand", "name")
    .populate("category", "name")
    .populate("company", "name");
  if (session) projectQuery = projectQuery.session(session);
  const project = await projectQuery.lean();

  if (!project || project.isActive === false) {
    const err = new Error("Project not found or not active");
    err.status = 404;
    throw err;
  }

  // fetch PO details if present (session-aware)
  let poQuery = PoDetails.findOne({ project: project._id });
  if (session) poQuery = poQuery.session(session);
  const po = await poQuery.lean();

  // build snapshot storing both id and readable names
  const snapshot = {
    autoCode: project.autoCode,
    artName: project.artName,
    productDesc: project.productDesc,
    color: project.color,
    size: project.size,
    // store ids if present
    brand: project.brand?._id ?? project.brand ?? null,
    brandName: project.brand?.name ?? (typeof project.brand === "string" ? project.brand : null),
    category: project.category?._id ?? project.category ?? null,
    categoryName: project.category?.name ?? (typeof project.category === "string" ? project.category : null),
    company: project.company?._id ?? project.company ?? null,
    companyName: project.company?.name ?? (typeof project.company === "string" ? project.company : null),
    countryName: project.countryName ?? project.country ?? null,
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

  const createdArr = await ProductionCalendar.create([doc], { session });
  return createdArr[0];
};

// --- list (only active) with pagination ---
// added optional projectId filter support by passing options if needed
export const listCalendarEntriesService = async ({ page = 1, limit = 20, projectId = null } = {}) => {
  const skip = (page - 1) * limit;
  const filter = { isActive: true };
  if (projectId && mongoose.Types.ObjectId.isValid(projectId)) filter.project = projectId;

  const docs = await ProductionCalendar.find(filter)
    .sort({ "scheduling.scheduleDate": 1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: "project",
      select: "autoCode artName color size brand category company country gender",
      populate: [
        { path: "brand", select: "name" },
        { path: "category", select: "name" },
        { path: "company", select: "name" },
      ],
    })
    // populate snapshot nested refs only if they are ObjectId refs (safe to call)
    .populate("projectSnapshot.brand", "name")
    .populate("projectSnapshot.category", "name")
    .lean();

  const total = await ProductionCalendar.countDocuments(filter);
  return { items: docs, total, page, limit };
};

// --- get single (only active) ---
export const getCalendarEntryService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const doc = await ProductionCalendar.findOne({ _id: id, isActive: true })
    .populate({
      path: "project",
      select: "autoCode artName color size brand category company country gender",
      populate: [
        { path: "brand", select: "name" },
        { path: "category", select: "name" },
        { path: "company", select: "name" },
      ],
    })
    .populate("projectSnapshot.brand", "name")
    .populate("projectSnapshot.category", "name")
    .lean();
  return doc;
};

// --- update (partial replace) ---
// simpler approach: build $set only for provided values
export const updateCalendarEntryService = async (id, payload, { session, by = null } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const setObj = {};

  if (payload.scheduling) {
    if (payload.scheduling.scheduleDate !== undefined)
      setObj["scheduling.scheduleDate"] = payload.scheduling.scheduleDate ? new Date(payload.scheduling.scheduleDate) : null;
    if (payload.scheduling.assignedPlant !== undefined)
      setObj["scheduling.assignedPlant"] = payload.scheduling.assignedPlant;
    if (payload.scheduling.soleFrom !== undefined)
      setObj["scheduling.soleFrom"] = payload.scheduling.soleFrom;
    if (payload.scheduling.soleColor !== undefined)
      setObj["scheduling.soleColor"] = payload.scheduling.soleColor;
    if (payload.scheduling.soleExpectedDate !== undefined)
      setObj["scheduling.soleExpectedDate"] = payload.scheduling.soleExpectedDate ? new Date(payload.scheduling.soleExpectedDate) : null;
  }

  if (payload.productionDetails) {
    if (payload.productionDetails.quantity !== undefined)
      setObj["productionDetails.quantity"] = Number(payload.productionDetails.quantity);
  }

  if (payload.additional) {
    if (payload.additional.remarks !== undefined)
      setObj["additional.remarks"] = payload.additional.remarks;
  }

  if (Object.keys(setObj).length === 0 && payload.isActive === undefined) {
    const err = new Error("nothing to update");
    err.status = 400;
    throw err;
  }

  setObj.updatedBy = by;
  setObj.updatedAt = new Date();

  const query = ProductionCalendar.findOneAndUpdate(
    { _id: id, isActive: true },
    { $set: setObj },
    { new: true, session }
  );

  const doc = await query.lean();
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

// --- NEW: get schedules for a given projectId (useful for frontend) ---
export const getScheduleByProjectService = async (projectId, { page = 1, limit = 50 } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) return { items: [], total: 0, page: Number(page), limit: Number(limit) };
  const skip = (page - 1) * limit;
  const docs = await ProductionCalendar.find({ isActive: true, project: projectId })
    .sort({ "scheduling.scheduleDate": 1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const total = await ProductionCalendar.countDocuments({ isActive: true, project: projectId });
  return { items: docs, total, page, limit };
};
