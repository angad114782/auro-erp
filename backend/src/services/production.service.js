import { Project } from "../models/Project.model.js";
import { PoDetails } from "../models/PoDetails.model.js";
import ProductionProject from "../models/ProductionProject.model.js"; // new model
import mongoose from "mongoose";

/**
 * createProductionFromProject
 * - ensures project exists & active
 * - checks PO (unless options.force)
 * - idempotent: returns existing production doc if exists
 * - creates ProductionProject, snapshots minimal fields, updates Project.status
 */
export const createProductionFromProject = async (
  projectId,
  options = {},
  { session } = {}
) => {
  const { initialPlan = {}, force = false, by = null } = options;

  // load project
  const project = await Project.findById(projectId).session(session);
  if (!project || !project.isActive) return null;

  // idempotency: check if production already exists for this project
  const existing = await ProductionProject.findOne({
    project: project._id,
  }).session(session);
  if (existing) {
    // optionally update with provided initialPlan (but keep it simple)
    return {
      project: await Project.findById(project._id)
        .populate("company brand category type country assignPerson")
        .lean()
        .session(session),
      production: existing,
    };
  }

  // check PO
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
  const production = await ProductionProject.create([snapshot], { session });
  // update project status and link if you want
  const now = new Date();
  const from = project.status || null;
  // project.status = "production_planning";
  project.statusHistory.push({ from, to: project.status, by, at: now });
  // optionally store production ref on project
  project.productionRef = production[0]._id;
  await project.save({ session });

  // return populated project + production
  const populatedProject = await Project.findById(project._id)
    .populate("company brand category type country assignPerson")
    .lean()
    .session(session);

  return { project: populatedProject, production: production[0] };
};
