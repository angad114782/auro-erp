import { Project } from "../models/Project.model.js";
import { normalizeProjectStatus, requireValidProjectStatus } from "../utils/status.util.js";

// CREATE
export const createProject = async (payload, { session } = {}) => {
  const [project] = await Project.create([{
    company: payload.company,
    brand: payload.brand,
    category: payload.category,
    autoCode: payload.autoCode || null,

    type: payload.type || null,
    country: payload.country || null,
    assignPerson: payload.assignPerson || null,

    color: payload.color,
    artName: payload.artName,
    size: payload.size,
    gender: payload.gender,
    priority: payload.priority,
    status: normalizeProjectStatus(payload.status) || undefined,

    productDesc: payload.productDesc,
    redSealTargetDate: payload.redSealTargetDate ? new Date(payload.redSealTargetDate) : null,

    coverImage: payload.coverImage || "",
    sampleImages: payload.sampleImages || [],

    clientFinalCost: Number(payload.clientFinalCost ?? 0) || 0,
    nextUpdate: payload.nextUpdate || null,
    clientApproval: payload.clientApproval || undefined,
  }], { session });

  return project;
};

// LIST
export const getProjects = async (query = {}) => {
  const filter = { isActive: true };
  if (query.company)  filter.company  = query.company;
  if (query.brand)    filter.brand    = query.brand;
  if (query.category) filter.category = query.category;

  if (query.status) {
    const norm = normalizeProjectStatus(query.status);
    filter.status = norm || "__no_match__";
  }

  if (query.minCost) filter.clientFinalCost = { ...(filter.clientFinalCost || {}), $gte: Number(query.minCost) };
  if (query.maxCost) filter.clientFinalCost = { ...(filter.clientFinalCost || {}), $lte: Number(query.maxCost) };

  if (query.dueBefore) {
    const d = new Date(query.dueBefore);
    if (!Number.isNaN(d.getTime())) filter["nextUpdate.date"] = { $lte: d };
  }

  return Project.find(filter)
    .populate("company", "name")
    .populate("brand", "name")
    .populate("category", "name")
    .populate("type", "name")
    .populate("country", "name")
    .populate("assignPerson", "name")
    .sort({ createdAt: -1 });
};

// GET BY ID
export const getProjectById = async (id) => {
  return Project.findOne({ _id: id, isActive: true })
    .populate("company", "name")
    .populate("brand", "name")
    .populate("category", "name")
    .populate("type", "name")
    .populate("country", "name")
    .populate("assignPerson", "name");
};

// UPDATE
export const updateProjectById = async (id, payload) => {
  const set = {
    company: payload.company,
    brand: payload.brand,
    category: payload.category,
    type: payload.type || null,
    country: payload.country || null,
    assignPerson: payload.assignPerson || null,
    projectName: payload.projectName,
    artName: payload.artName,
    size: payload.size,
    gender: payload.gender,
    priority: payload.priority,
    productDesc: payload.productDesc,
    redSealTargetDate: payload.redSealTargetDate ? new Date(payload.redSealTargetDate) : null,
  };

  if (payload.coverImage) set.coverImage = payload.coverImage;
  if (payload.sampleImages) set.sampleImages = payload.sampleImages;

  if (payload.status) {
    const norm = requireValidProjectStatus(payload.status);
    set.status = norm;
  }

  if (payload.clientFinalCost != null) {
    set.clientFinalCost = Number(payload.clientFinalCost);
  }
  if (payload.nextUpdate) {
    set.nextUpdate = {
      date: payload.nextUpdate.date ? new Date(payload.nextUpdate.date) : new Date(),
      note: payload.nextUpdate.note || "",
      setBy: payload.nextUpdate.setBy || null,
      setAt: new Date(),
    };
  }
  if (payload.clientApproval) {
    set.clientApproval = {
      status: payload.clientApproval.status || "pending",
      by: payload.clientApproval.by || null,
      at: new Date(),
    };
  }

  return Project.findByIdAndUpdate(id, { $set: set }, { new: true });
};

// SOFT DELETE
export const deleteProjectById = async (id) =>
  Project.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });

// STATUS (no note)
export const updateProjectStatus = async (id, statusInput, by = null) => {
  const to = requireValidProjectStatus(statusInput);
  const project = await Project.findById(id);
  if (!project || !project.isActive) return null;

  const from = project.status || null;
  project.status = to;
  project.statusHistory.push({ from, to, by, at: new Date() });

  await project.save();
  return project;
};

// NEXT UPDATE (date + note)
export const setProjectNextUpdate = async (id, date, note = "", by = null) => {
  const d = date ? new Date(date) : null;
  if (!d || Number.isNaN(d.getTime())) {
    const err = new Error("valid next update date is required");
    err.status = 400;
    throw err;
  }
  const project = await Project.findById(id);
  if (!project || !project.isActive) return null;

  project.nextUpdate = { date: d, note, setBy: by, setAt: new Date() };
  await project.save();
  return project;
};

// CLIENT FINAL COST (no note)
export const setProjectClientCost = async (id, { amount, by = null }) => {
  if (amount === undefined || amount === null) {
    const err = new Error("amount is required");
    err.status = 400;
    throw err;
  }
  const n = Number(amount);
  if (Number.isNaN(n) || n < 0) {
    const err = new Error("amount must be a non-negative number");
    err.status = 400;
    throw err;
  }

  const project = await Project.findById(id);
  if (!project || !project.isActive) return null;

  project.clientFinalCost = n;
  project.clientCostHistory.push({ amount: n, by, setAt: new Date() });

  await project.save();
  return project;
};

// CLIENT APPROVAL (no note)
export const setClientApproval = async (id, { status, by = null }) => {
  const allowed = new Set(["pending", "approved", "rejected"]);
  if (!allowed.has(String(status))) {
    const err = new Error('clientApproval.status must be "pending", "approved", or "rejected"');
    err.status = 400;
    throw err;
  }

  const project = await Project.findById(id);
  if (!project || !project.isActive) return null;

  project.clientApproval = { status, by, at: new Date() };
  await project.save();
  return project;
};
