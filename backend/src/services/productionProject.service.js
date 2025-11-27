import ProductionProject from "../models/ProductionProject.model.js";
import mongoose from "mongoose";
import { Project } from "../models/Project.model.js";



// --- add this named export to productionProject.service.js ---
import { PoDetails } from "../models/PoDetails.model.js";

/**
 * createProductionFromProject
 * - ensures project exists & active
 * - checks PO (unless options.force)
 * - idempotent: returns existing production doc if exists
 * - creates ProductionProject, snapshots minimal fields, updates Project.status
 */
export const createProductionFromProject = async (projectId, options = {}, { session } = {}) => {
  const { initialPlan = {}, force = false, by = null } = options;

  // load project
  const project = await Project.findById(projectId).session(session);
  if (!project || !project.isActive) return null;

  // idempotency: check if production already exists for this project
  const existing = await ProductionProject.findOne({ project: project._id }).session(session);
  if (existing) {
    // optionally update with provided initialPlan (but keep it simple)
    const populatedProject = await Project.findById(project._id)
      .populate("company brand category type country assignPerson")
      .lean()
      .session(session);
    return {
      project: populatedProject,
      production: existing,
    };
  }

  // check PO
  const po = await PoDetails.findOne({ project: project._id }).session(session);
  if (!force) {
    const hasPoApproved = po && (po.poNumber || "").trim().length > 0;
    if (!hasPoApproved) {
      const err = new Error("PO not approved — cannot move to production without PO");
      err.status = 400;
      throw err;
    }
  }

  // build snapshot
  const snapshot = {
    project: project._id,
    autoCodeSnapshot: project.autoCode,
    artNameSnapshot: project.artName,
    colorSnapshot: project.color,
    sizeSnapshot: project.size,
    coverImageSnapshot: project.coverImage,
    specSnapshot: {
      productDesc: project.productDesc,
      redSealTargetDate: project.redSealTargetDate,
    },
    po: po
      ? {
          _id: po._id,
          poNumber: po.poNumber,
          orderQuantity: po.orderQuantity,
          unitPrice: po.unitPrice,
          totalAmount: po.totalAmount,
          status: po.status,
        }
      : null,
    status: "Planning",
    phases: [],
    materials: [],
    assignedTeam: [],
    startDate: initialPlan.startDate ? new Date(initialPlan.startDate) : null,
    targetCompletionDate: initialPlan.targetCompletionDate
      ? new Date(initialPlan.targetCompletionDate)
      : null,
    createdBy: by,
    notes: initialPlan.notes || "",
  };

  // create production doc
  const productionArr = await ProductionProject.create([snapshot], { session });
  const production = productionArr[0];

  // update project status and link if you want
  const now = new Date();
  const from = project.status || null;
  project.status = "production_planning";
  project.statusHistory.push({ from, to: project.status, by, at: now });
  // optionally store production ref on project
  project.productionRef = production._id;
  await project.save({ session });

  // return populated project + production
  const populatedProject = await Project.findById(project._id)
    .populate("company brand category type country assignPerson")
    .lean()
    .session(session);

  return { project: populatedProject, production };
};

/**
 * listProductionProjectsService
 * - if projectId provided, returns production doc for that project (or list containing it)
 * - else returns paginated list of active production docs
 */
export const listProductionProjectsService = async ({ projectId = null, page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const filter = { isActive: true };
  if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
    filter.project = projectId;
  }

  const items = await ProductionProject.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("project", "autoCode artName color")
    .lean();

  const total = await ProductionProject.countDocuments(filter);
  return { items, total, page, limit };
};

/**
 * getProductionProjectService
 * - returns single production doc only if isActive true
 */
export const getProductionProjectService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const doc = await ProductionProject.findOne({ _id: id, isActive: true })
    .populate("project")
    .lean();
  return doc;
};

/**
 * updateProductionProjectService
 * - allowed updates: status, phases, materials, assignedTeam, startDate, targetCompletionDate, actualCompletionDate, notes, documents
 * - if status changes, push into productionHistory
 */
export const updateProductionProjectService = async (id, payload = {}, { session, by = null } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  // Only allow updates on active docs
  const existing = await ProductionProject.findOne({ _id: id, isActive: true }).session(session);
  if (!existing) return null;

  const set = {};
  // simple scalar fields
  const scalarFields = ["startDate", "targetCompletionDate", "actualCompletionDate", "notes", "updatedAt"];
  scalarFields.forEach((f) => {
    if (payload[f] !== undefined) {
      set[f] = payload[f] === null ? null : payload[f];
    }
  });

  // status handling with history
  if (payload.status && payload.status !== existing.status) {
    const from = existing.status || null;
    const to = payload.status;
    // push to productionHistory (preserve existing)
    set.$push = {
      productionHistory: { from, to, by: by || null, at: new Date(), note: payload.statusNote || "" },
    };
    // also update current status
    set.status = to;
  }

  // arrays / nested updates
  if (payload.phases) {
    // Expect full replace of phases array or partial. Here we replace
    set.phases = payload.phases;
  }
  if (payload.materials) set.materials = payload.materials;
  if (payload.assignedTeam) set.assignedTeam = payload.assignedTeam;
  if (payload.documents) set.documents = payload.documents;

  // updatedBy / updatedAt
  set.updatedBy = by || existing.updatedBy;
  set.updatedAt = new Date();

  // Build final update object (handle $push separately)
  const updateObj = {};
  if (set.status !== undefined) updateObj.status = set.status;
  if (set.phases !== undefined) updateObj.phases = set.phases;
  if (set.materials !== undefined) updateObj.materials = set.materials;
  if (set.assignedTeam !== undefined) updateObj.assignedTeam = set.assignedTeam;
  if (set.documents !== undefined) updateObj.documents = set.documents;
  if (set.startDate !== undefined) updateObj.startDate = set.startDate ? new Date(set.startDate) : null;
  if (set.targetCompletionDate !== undefined)
    updateObj.targetCompletionDate = set.targetCompletionDate ? new Date(set.targetCompletionDate) : null;
  if (set.actualCompletionDate !== undefined)
    updateObj.actualCompletionDate = set.actualCompletionDate ? new Date(set.actualCompletionDate) : null;
  if (set.notes !== undefined) updateObj.notes = set.notes;
  updateObj.updatedBy = set.updatedBy;
  updateObj.updatedAt = set.updatedAt;

  // Use findOneAndUpdate; if $push is needed, include it
  const updateCommand = { $set: updateObj };
  if (set.$push) updateCommand.$push = set.$push;

  const updated = await ProductionProject.findOneAndUpdate(
    { _id: id, isActive: true },
    updateCommand,
    { new: true, session }
  );

  return updated;
};

/**
 * deleteProductionProjectService (soft delete)
 */
export const deleteProductionProjectService = async (id, { session, by = null } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const doc = await ProductionProject.findOneAndUpdate(
    { _id: id, isActive: true },
    { $set: { isActive: false, updatedBy: by || null, updatedAt: new Date() } },
    { new: true, session }
  );

  return doc;
};
