import { PoDetails } from "../models/PoDetails.model.js";
import { Project } from "../models/Project.model.js";
import {
  normalizeProjectStatus,
  requireValidProjectStatus,
  requireValidClientApproval,
  normalizeClientApproval,
} from "../utils/status.util.js";

/** ---------- CREATE ---------- **/
export const createProject = async (payload, { session } = {}) => {
  const doc = {
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
    redSealTargetDate: payload.redSealTargetDate
      ? new Date(payload.redSealTargetDate)
      : null,

    coverImage: payload.coverImage || "",
    sampleImages: payload.sampleImages || [],
  };

  // Optional business fields on create
  if (payload.clientFinalCost != null) {
    const amt = Number(payload.clientFinalCost);
    if (Number.isFinite(amt) && amt >= 0) doc.clientFinalCost = amt;
  }
  if (payload.clientApproval) {
    const appr = normalizeClientApproval(payload.clientApproval);
    if (appr) doc.clientApproval = appr;
  }
  if (payload.nextUpdate?.date) {
    const d = new Date(payload.nextUpdate.date);
    if (!Number.isNaN(d.getTime())) {
      doc.nextUpdate = {
        date: d,
        note: payload.nextUpdate.note || "",
        by: payload.nextUpdate.by || null,
        at: new Date(),
      };
    }
  }

  const [project] = await Project.create([doc], { session });
  return project;
};

/** ---------- LIST WITH PO INCLUDED ---------- **/
export const getProjects = async (query = {}) => {
  const filter = { isActive: true };

  if (query.company) filter.company = query.company;
  if (query.brand) filter.brand = query.brand;
  if (query.category) filter.category = query.category;

  if (query.status) {
    const norm = normalizeProjectStatus(query.status);
    filter.status = norm || "__no_match__";
  }

  if (query.clientApproval) {
    const appr = normalizeClientApproval(query.clientApproval);
    if (appr) filter.clientApproval = appr;
    else filter.clientApproval = "__no_match__";
  }

  if (query.minCost)
    filter.clientFinalCost = {
      ...(filter.clientFinalCost || {}),
      $gte: Number(query.minCost),
    };

  if (query.maxCost)
    filter.clientFinalCost = {
      ...(filter.clientFinalCost || {}),
      $lte: Number(query.maxCost),
    };

  // 1️⃣ fetch all projects
  const projects = await Project.find(filter)
    .populate("company", "name")
    .populate("brand", "name")
    .populate("category", "name")
    .populate("type", "name")
    .populate("country", "name")
    .populate("assignPerson", "name")
    .sort({ createdAt: -1 })
    .lean();

  // 2️⃣ fetch all PO records for these projects
  const projectIds = projects.map((p) => p._id);
  const poList = await PoDetails.find({ project: { $in: projectIds } }).lean();

  // 3️⃣ create a map for fast matching
  const poMap = {};
  poList.forEach((po) => {
    poMap[po.project.toString()] = po;
  });

  // 4️⃣ attach PO to each project
  projects.forEach((p) => {
    p.po = poMap[p._id.toString()] || null;
  });

  return projects;
};

/** ---------- GET BY ID WITH PO ---------- **/
export const getProjectById = async (id) => {
  const project = await Project.findOne({ _id: id, isActive: true })
    .populate("company", "name")
    .populate("brand", "name")
    .populate("category", "name")
    .populate("type", "name")
    .populate("country", "name")
    .populate("assignPerson", "name")
    .lean();

  if (!project) return null;

  const po = await PoDetails.findOne({ project: project._id }).lean();
  project.po = po || null;

  return project;
};

/** ---------- UPDATE (PUT) ---------- **/
export const updateProjectById = async (id, payload) => {
  const set = {
    company: payload.company,
    brand: payload.brand,
    category: payload.category,
    type: payload.type || null,
    country: payload.country || null,
    assignPerson: payload.assignPerson || null,
    artName: payload.artName,
    size: payload.size,
    gender: payload.gender,
    priority: payload.priority,
    productDesc: payload.productDesc,
    redSealTargetDate: payload.redSealTargetDate
      ? new Date(payload.redSealTargetDate)
      : null,
    color: payload.color,
  };

  // Only update cover if new one given
  if (payload.coverImage !== undefined) {
    if (payload.keepExistingCover !== true) {
      set.coverImage = payload.coverImage;
    }
  }

  // Only update samples if explicitly passed
  if (payload.sampleImages !== undefined) {
    set.sampleImages = payload.sampleImages;
  }

  if (payload.status) {
    const norm = requireValidProjectStatus(payload.status);
    set.status = norm;
  }

  if (payload.clientFinalCost != null) {
    const amt = Number(payload.clientFinalCost);
    if (!Number.isFinite(amt) || amt < 0) {
      const err = new Error("clientFinalCost must be a non-negative number");
      err.status = 400;
      throw err;
    }
    set.clientFinalCost = amt;
  }

  if (payload.clientApproval) {
    const appr = requireValidClientApproval(payload.clientApproval);
    set.clientApproval = appr;
  }

  if (payload.nextUpdate?.date) {
    const d = new Date(payload.nextUpdate.date);
    if (Number.isNaN(d.getTime())) {
      const err = new Error("invalid nextUpdate.date");
      err.status = 400;
      throw err;
    }
    set.nextUpdate = {
      date: d,
      note: payload.nextUpdate.note || "",
      by: payload.nextUpdate.by || null,
      at: new Date(),
    };
  }

  return Project.findByIdAndUpdate(id, { $set: set }, { new: true });
};

/** ---------- SOFT DELETE ---------- **/
export const deleteProjectById = async (id) => {
  return Project.findByIdAndUpdate(
    id,
    { $set: { isActive: false } },
    { new: true }
  );
};

/** ---------- STATUS UPDATE ---------- **/
export const updateProjectStatus = async (id, statusInput, by = null) => {
  const to = requireValidProjectStatus(statusInput);
  const project = await Project.findById(id);
  if (!project || !project.isActive) return null;

  const from = project.status || null;
  project.status = to;
  project.statusHistory.push({ from, to, by, at: new Date() });
  await project.save();

  return await Project.findById(id)
    .populate("company", "name")
    .populate("brand", "name")
    .populate("category", "name")
    .populate("type", "name")
    .populate("country", "name")
    .populate("assignPerson", "name");
};

/** ---------- NEXT UPDATE ---------- **/
export const setProjectNextUpdate = async (id, date, note = "", by = null) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    const err = new Error("invalid date");
    err.status = 400;
    throw err;
  }

  const project = await Project.findById(id);
  if (!project || !project.isActive) return null;

  project.nextUpdate = { date: d, note: note || "", by, at: new Date() };
  await project.save();

  return project;
};

/** ---------- CLIENT COST ---------- **/
export const setProjectClientCost = async (id, { amount, by = null }) => {
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt < 0) {
    const err = new Error("amount must be a non-negative number");
    err.status = 400;
    throw err;
  }
  const project = await Project.findById(id);
  if (!project || !project.isActive) return null;

  project.clientFinalCost = amt;
  project.clientCostHistory.push({ amount: amt, by, at: new Date() });
  await project.save();

  return project;
};

/** ---------- CLIENT APPROVAL ---------- **/
export const setClientApproval = async (id, { status, by = null }) => {
  const appr = requireValidClientApproval(status);
  const project = await Project.findById(id);
  if (!project || !project.isActive) return null;

  project.clientApproval = appr;
  await project.save();
  return project;
};

/** ---------- PO SET/UPDATE ---------- **/
export const setProjectPO = async (id, payload = {}, by = null) => {
  const project = await Project.findById(id);
  if (!project || !project.isActive) return null;

  const now = new Date();
  const qty =
    payload.orderQuantity != null ? Number(payload.orderQuantity) : null;
  const price = payload.unitPrice != null ? Number(payload.unitPrice) : null;

  if (qty != null && (!Number.isFinite(qty) || qty < 0)) {
    const err = new Error("orderQuantity must be a non-negative number");
    err.status = 400;
    throw err;
  }
  if (price != null && (!Number.isFinite(price) || price < 0)) {
    const err = new Error("unitPrice must be a non-negative number");
    err.status = 400;
    throw err;
  }

  const hasPoNumber = (payload.poNumber || "").trim().length > 0;
  const nextStatus = hasPoNumber ? "po_approved" : "po_pending";

  let poDetails = await PoDetails.findOne({ project: id });

  if (poDetails) {
    const prev = poDetails.toObject();

    const effectiveQty = qty != null ? qty : prev.orderQuantity ?? null;
    const effectivePrice = price != null ? price : prev.unitPrice ?? null;

    const totalAmount =
      effectiveQty != null && effectivePrice != null
        ? effectiveQty * effectivePrice
        : prev.totalAmount ?? null;

    poDetails.orderQuantity = effectiveQty;
    poDetails.unitPrice = effectivePrice;
    poDetails.totalAmount = totalAmount;
    poDetails.poNumber = payload.poNumber ?? prev.poNumber ?? "";
    poDetails.status = nextStatus;
    poDetails.deliveryDate = payload.deliveryDate
      ? new Date(payload.deliveryDate)
      : prev.deliveryDate ?? null;

    poDetails.paymentTerms = payload.paymentTerms ?? prev.paymentTerms ?? "";
    poDetails.urgencyLevel =
      payload.urgencyLevel ?? prev.urgencyLevel ?? "Normal";
    poDetails.qualityRequirements =
      payload.qualityRequirements ?? prev.qualityRequirements ?? "";
    poDetails.clientFeedback =
      payload.clientFeedback ?? prev.clientFeedback ?? "";
    poDetails.specialInstructions =
      payload.specialInstructions ?? prev.specialInstructions ?? "";

    poDetails.targetAt = prev.targetAt ?? now;
    poDetails.issuedAt = hasPoNumber
      ? prev.issuedAt ?? now
      : prev.issuedAt ?? null;

    poDetails.updatedBy = by;
    poDetails.updatedAt = now;

    await poDetails.save();
  } else {
    const totalAmount = qty != null && price != null ? qty * price : null;

    poDetails = await PoDetails.create({
      project: id,
      orderQuantity: qty,
      unitPrice: price,
      totalAmount: totalAmount,
      poNumber: payload.poNumber ?? "",
      status: nextStatus,
      deliveryDate: payload.deliveryDate
        ? new Date(payload.deliveryDate)
        : null,
      paymentTerms: payload.paymentTerms ?? "",
      urgencyLevel: payload.urgencyLevel ?? "Normal",
      qualityRequirements: payload.qualityRequirements ?? "",
      clientFeedback: payload.clientFeedback ?? "",
      specialInstructions: payload.specialInstructions ?? "",
      targetAt: now,
      issuedAt: hasPoNumber ? now : null,
      updatedAt: now,
      updatedBy: by,
    });
  }

  const from = project.status || null;
  project.status = nextStatus;
  project.statusHistory.push({ from, to: nextStatus, by, at: now });
  await project.save();

  const populatedProject = await Project.findById(project._id)
    .populate("company brand category type country assignPerson")
    .lean();

  populatedProject.po = poDetails;

  return populatedProject;
};
