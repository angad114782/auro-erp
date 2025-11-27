import { Project } from "../models/Project.model.js";
import { PoDetails } from "../models/PoDetails.model.js";
import ProductionCalendar from "../models/ProductionCalendar.model.js";
import Fuse from "fuse.js";

/**
 * searchProjectsForCalendarService
 * - if q is short or empty: return recent projects (limit)
 * - else: fetch candidate projects (by name/code) and run Fuse fuzzy search server-side
 */
export const searchProjectsForCalendarService = async (q, { limit = 10 } = {}) => {
  const cleanQ = (q || "").trim();
  if (!cleanQ) {
    // return most recent active projects limited
    const recent = await Project.find({ isActive: true })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select("autoCode artName color brand category")
      .populate("brand", "name")
      .populate("category", "name")
      .lean();
    return recent.map(mapProjectForAutocomplete);
  }

  // 1) quick DB filters: regex on autoCode / artName / color
  const regex = new RegExp(escapeRegExp(cleanQ), "i");
  // fetch a reasonable candidate set (limit 200) to run Fuse on
  const candidates = await Project.find({
    isActive: true,
    $or: [
      { autoCode: { $regex: regex } },
      { artName: { $regex: regex } },
      { color: { $regex: regex } },
      // you can add other fields
    ],
  })
    .limit(200)
    .select("autoCode artName color size brand category")
    .populate("brand", "name")
    .populate("category", "name")
    .lean();

  // If results are small, return simple mapping
  if (candidates.length <= limit) {
    return candidates.map(mapProjectForAutocomplete);
  }

  // 2) use Fuse.js for fuzzy ranking
  const fuse = new Fuse(candidates, {
    keys: [
      { name: "autoCode", weight: 0.6 },
      { name: "artName", weight: 0.9 },
      { name: "color", weight: 0.4 },
    ],
    threshold: 0.35, // tweak for fuzziness
    distance: 100,
    minMatchCharLength: 2,
  });

  const fuseResults = fuse.search(cleanQ, { limit });
  const mapped = fuseResults.map((r) => mapProjectForAutocomplete(r.item));
  return mapped;
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

/**
 * createCalendarEntryService
 * payload expected shape:
 * {
 *   projectId,               // required - selected project _id from search
 *   scheduling: { scheduleDate, assignedPlant, soleFrom, soleColor, soleExpectedDate },
 *   productionDetails: { quantity },
 *   additional: { remarks }
 * }
 */
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

  // fetch project & PO summary
  const project = await Project.findById(projectId).lean().session(session);
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
  };

  const created = await ProductionCalendar.create([doc], { session });
  return created[0];
};
