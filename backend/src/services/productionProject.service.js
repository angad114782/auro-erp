// services/productionProject.service.js
import mongoose from "mongoose";
import ProductionProject from "../models/ProductionProject.model.js";
import { Project } from "../models/Project.model.js";
import { PoDetails } from "../models/PoDetails.model.js";

/**
 * createProductionFromProject
 */
export const createProductionFromProject = async (
  projectId,
  options = {},
  { session } = {}
) => {
  const { initialPlan = {}, force = false, by = null } = options;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    const err = new Error("invalid projectId");
    err.status = 400;
    throw err;
  }

  const project = await Project.findById(projectId).session(session);
  if (!project || !project.isActive) return null;

  // idempotent: return existing production if present
  const existing = await ProductionProject.findOne({
    project: project._id,
  }).session(session);
  if (existing) {
    const populatedProject = await Project.findById(project._id)
      .populate("company brand category type country assignPerson")
      .lean()
      .session(session);
    // normalize priority on existing production (if missing)
    if (!existing.priority && populatedProject?.priority) {
      existing.priority = populatedProject.priority;
      await existing.save({ session });
    }
    return { project: populatedProject, production: existing };
  }

  // check PO unless forced
  const po = await PoDetails.findOne({ project: project._id }).session(session);
  if (!force) {
    const hasPoApproved = po && (po.poNumber || "").trim().length > 0;
    if (!hasPoApproved) {
      const err = new Error(
        "PO not approved — cannot move to production without PO"
      );
      err.status = 400;
      throw err;
    }
  }

  // build production snapshot — include priority from project (snapshot)
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
    // copy PO summary if present
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
    // important: snapshot priority copied from project
    priority: project.priority ?? "Medium",
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

  const arr = await ProductionProject.create([snapshot], { session });
  const production = arr[0];

  // update project status & link ref
  const now = new Date();
  const from = project.status || null;
  project.status = "production_planning";
  project.statusHistory.push({ from, to: project.status, by, at: now });
  project.productionRef = production._id;
  await project.save({ session });

  const populatedProject = await Project.findById(project._id)
    .populate("company brand category type country assignPerson")
    .lean()
    .session(session);

  return { project: populatedProject, production };
};

/**
 * listProductionProjectsService
 */
export const listProductionProjectsService = async ({
  projectId = null,
  page = 1,
  limit = 20,
} = {}) => {
  const skip = (page - 1) * limit;
  const filter = { isActive: true };
  if (projectId && mongoose.Types.ObjectId.isValid(projectId))
    filter.project = projectId;

  // fetch with project populated (include priority)
  let items = await ProductionProject.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("project", "priority autoCode artName brand category")
    .lean();

  // Normalize: ensure every item has a top-level priority
  items = items.map((doc) => {
    const normalizedPriority =
      doc.priority ?? doc.project?.priority ?? "Medium";

    // Keep other fields intact, but ensure priority exists
    return {
      ...doc,
      priority: normalizedPriority,
      // keep project populated object as-is (useful for front-end)
      project: doc.project ?? null,
    };
  });

  const total = await ProductionProject.countDocuments(filter);
  return { items, total, page, limit };
};

/**
 * getProductionProjectService
 */
export const getProductionProjectService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const doc = await ProductionProject.findOne({ _id: id, isActive: true })
    .populate("project")
    .lean();

  if (!doc) return null;

  // ensure priority normalized in returned doc
  const normalized = {
    ...doc,
    priority: doc.priority ?? doc.project?.priority ?? "Medium",
  };

  return normalized;
};

/**
 * updateProductionProjectService
 */
export const updateProductionProjectService = async (
  id,
  payload = {},
  { session, by = null } = {}
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const existing = await ProductionProject.findOne({
    _id: id,
    isActive: true,
  }).session(session);
  if (!existing) return null;

  const updateObj = {};
  // handle simple date/text fields
  if (payload.startDate !== undefined)
    updateObj.startDate = payload.startDate
      ? new Date(payload.startDate)
      : null;
  if (payload.targetCompletionDate !== undefined)
    updateObj.targetCompletionDate = payload.targetCompletionDate
      ? new Date(payload.targetCompletionDate)
      : null;
  if (payload.actualCompletionDate !== undefined)
    updateObj.actualCompletionDate = payload.actualCompletionDate
      ? new Date(payload.actualCompletionDate)
      : null;
  if (payload.notes !== undefined) updateObj.notes = payload.notes;
  if (payload.phases !== undefined) updateObj.phases = payload.phases;
  if (payload.materials !== undefined) updateObj.materials = payload.materials;
  if (payload.assignedTeam !== undefined)
    updateObj.assignedTeam = payload.assignedTeam;
  if (payload.documents !== undefined) updateObj.documents = payload.documents;

  // allow updating priority explicitly (optional)
  if (payload.priority !== undefined) updateObj.priority = payload.priority;

  // status change -> push history
  const updateCommand = {
    $set: {
      ...updateObj,
      updatedBy: by || existing.updatedBy,
      updatedAt: new Date(),
    },
  };
  if (payload.status && payload.status !== existing.status) {
    const from = existing.status || null;
    const to = payload.status;
    updateCommand.$set.status = to;
    updateCommand.$push = {
      productionHistory: {
        from,
        to,
        by: by || null,
        at: new Date(),
        note: payload.statusNote || "",
      },
    };
  }

  const updated = await ProductionProject.findOneAndUpdate(
    { _id: id, isActive: true },
    updateCommand,
    { new: true, session }
  );

  // Normalize priority before returning
  if (updated) {
    const populated = await ProductionProject.findById(updated._id)
      .populate("project", "priority")
      .lean();
    populated.priority = populated.priority ?? populated.project?.priority ?? "Medium";
    return populated;
  }

  return updated;
};

/**
 * deleteProductionProjectService (soft delete)
 */
export const deleteProductionProjectService = async (
  id,
  { session, by = null } = {}
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const doc = await ProductionProject.findOneAndUpdate(
    { _id: id, isActive: true },
    { $set: { isActive: false, updatedBy: by || null, updatedAt: new Date() } },
    { new: true, session }
  );
  return doc;
};
