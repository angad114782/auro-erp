import ProductionCalendar from "../models/ProductionCalendar.model.js";
import { Project } from "../models/Project.model.js";
import { PoDetails } from "../models/PoDetails.model.js";
import Fuse from "fuse.js";
import mongoose from "mongoose";

// --- existing search service (unchanged) ---
export const searchProjectsForCalendarService = async (
  q,
  { limit = 10 } = {}
) => {
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

  if (candidates.length <= limit)
    return candidates.map(mapProjectForAutocomplete);

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

export const createCalendarEntryService = async (
  payload,
  { session, by = null } = {}
) => {
  const {
    projectId,
    scheduling,
    productionDetails = {},
    additional,
  } = payload || {};

  if (!projectId) throw error400("projectId is required");
  if (!scheduling?.scheduleDate)
    throw error400("scheduling.scheduleDate is required");

  // 🔹 FETCH PROJECT FIRST
  let projectQuery = Project.findById(projectId)
    .populate("brand", "name")
    .populate("category", "name")
    .populate("company", "name");

  if (session) projectQuery = projectQuery.session(session);

  const project = await projectQuery.lean();
  if (!project) throw error404("Project not found");

  // 🔹 FETCH PO
  let poQuery = PoDetails.findOne({ project: project._id });
  if (session) poQuery = poQuery.session(session);
  const po = await poQuery.lean();

  // 🔥 AUTO-FILL quantity (NOW SAFE)
  if (!productionDetails.quantity) {
    if (po?.quantity) {
      productionDetails.quantity = po.quantity;
    } else if (project.quantitySnapshot) {
      productionDetails.quantity = project.quantitySnapshot;
    } else if (project.quantity) {
      productionDetails.quantity = project.quantity;
    }
  }

  if (!productionDetails.quantity) {
    throw error400("productionDetails.quantity is required");
  }

  // 🔹 SNAPSHOT
  const snapshot = {
    autoCode: project.autoCode,
    artName: project.artName,
    productDesc: project.productDesc,
    color: project.color,
    size: project.size,
    brand: project.brand?._id ?? null,
    brandName: project.brand?.name ?? null,
    category: project.category?._id ?? null,
    categoryName: project.category?.name ?? null,
    company: project.company?._id ?? null,
    companyName: project.company?.name ?? null,
    countryName: project.countryName ?? project.country ?? null,
    poNumber: po?.poNumber || "",
    poRef: po?._id || null,
  };

  // 🔹 FINAL DOC
  const doc = {
    project: project._id,
    projectSnapshot: snapshot,
    scheduling: {
  scheduleDate: new Date(scheduling.scheduleDate),

  // ✅ NEW: main Received Date
  receivedDate: scheduling.receivedDate ? new Date(scheduling.receivedDate) : null,

  assignedPlant: scheduling.assignedPlant
    ? new mongoose.Types.ObjectId(scheduling.assignedPlant)
    : null,

  soleFrom: scheduling.soleFrom || "",
  soleColor: scheduling.soleColor || "",

  // existing (aapka old field)
  soleExpectedDate: scheduling.soleExpectedDate
    ? new Date(scheduling.soleExpectedDate)
    : null,

  // ✅ OPTIONAL (if UI has "Sole Received Date" key)
  soleReceivedDate: scheduling.soleReceivedDate
    ? new Date(scheduling.soleReceivedDate)
    : null,

  footbed: scheduling.footbed || "",
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

function error400(msg) {
  return Object.assign(new Error(msg), { status: 400 });
}
function error404(msg) {
  return Object.assign(new Error(msg), { status: 404 });
}

export const listCalendarEntriesService = async ({
  page = 1,
  limit = 20,
  projectId = null,
} = {}) => {
  const skip = (page - 1) * limit;
  const filter = { isActive: true };
  if (projectId && mongoose.Types.ObjectId.isValid(projectId))
    filter.project = projectId;

  const docs = await ProductionCalendar.find(filter)
    .sort({ "scheduling.scheduleDate": 1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: "project",
      select:
        "autoCode artName color size brand category company country gender",
      populate: [
        { path: "brand", select: "name" },
        { path: "category", select: "name" },
        { path: "company", select: "name" },
      ],
    })
    .populate("projectSnapshot.brand", "name")
    .populate("projectSnapshot.category", "name")
    .populate("scheduling.assignedPlant", "name")
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
      select:
        "autoCode artName color size brand category company country gender",
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

export const updateCalendarEntryService = async (
  id,
  payload,
  { session, by = null } = {}
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const setObj = {};

 if (payload.scheduling) {
  if (payload.scheduling.scheduleDate !== undefined)
    setObj["scheduling.scheduleDate"] = payload.scheduling.scheduleDate
      ? new Date(payload.scheduling.scheduleDate)
      : null;

  // ✅ NEW: main Received Date
  if (payload.scheduling.receivedDate !== undefined)
    setObj["scheduling.receivedDate"] = payload.scheduling.receivedDate
      ? new Date(payload.scheduling.receivedDate)
      : null;

  // (your assignedPlant logic stays same)

  if (payload.scheduling.soleFrom !== undefined)
    setObj["scheduling.soleFrom"] = payload.scheduling.soleFrom;

  if (payload.scheduling.soleColor !== undefined)
    setObj["scheduling.soleColor"] = payload.scheduling.soleColor;

  if (payload.scheduling.soleExpectedDate !== undefined)
    setObj["scheduling.soleExpectedDate"] = payload.scheduling.soleExpectedDate
      ? new Date(payload.scheduling.soleExpectedDate)
      : null;

  // ✅ OPTIONAL: Sole Received Date
  if (payload.scheduling.soleReceivedDate !== undefined)
    setObj["scheduling.soleReceivedDate"] = payload.scheduling.soleReceivedDate
      ? new Date(payload.scheduling.soleReceivedDate)
      : null;

  if (payload.scheduling.footbed !== undefined)
    setObj["scheduling.footbed"] = payload.scheduling.footbed;
}


  if (payload.productionDetails?.quantity !== undefined)
    setObj["productionDetails.quantity"] = Number(
      payload.productionDetails.quantity
    );

  if (payload.additional?.remarks !== undefined)
    setObj["additional.remarks"] = payload.additional.remarks;

  if (Object.keys(setObj).length === 0 && payload.isActive === undefined)
    throw error400("nothing to update");

  setObj.updatedBy = by;
  setObj.updatedAt = new Date();

  const doc = await ProductionCalendar.findOneAndUpdate(
    { _id: id, isActive: true },
    { $set: setObj },
    { new: true, session }
  )
    .populate("scheduling.assignedPlant", "name")
    .lean();

  return doc;
};

// --- soft delete ---
export const deleteCalendarEntryService = async (
  id,
  { session, by = null } = {}
) => {
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
export const getScheduleByProjectService = async (
  projectId,
  { page = 1, limit = 50 } = {}
) => {
  if (!mongoose.Types.ObjectId.isValid(projectId))
    return { items: [], total: 0, page: Number(page), limit: Number(limit) };
  const skip = (page - 1) * limit;
  const docs = await ProductionCalendar.find({
    isActive: true,
    project: projectId,
  })
    .sort({ "scheduling.scheduleDate": 1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const total = await ProductionCalendar.countDocuments({
    isActive: true,
    project: projectId,
  });
  return { items: docs, total, page, limit };
};
