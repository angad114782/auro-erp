// backend/src/services/pc_productionCard.service.js
import mongoose from "mongoose";
import { PCProjectCounter } from "../models/pc_projectCounter.model.js";
import { PCProductionCard } from "../models/pc_productionCard.model.js";
import { Project } from "../models/Project.model.js";
import { PCCardCounter } from "../models/pc_cardCounter.model.js";
// <<< new: import the cost row models from the wrapper file you just created >>>
import {
  UpperCostRow,
  ComponentCostRow,
  MaterialCostRow,
  PackagingCostRow,
  MiscCostRow,
} from "../models/projectCost.model.js";

/* helpers */
function isObjectIdLike(id) {
  return id && mongoose.Types.ObjectId.isValid(String(id));
}

async function incrementNamedCounter(Model, projectId, session = null) {
  if (!isObjectIdLike(projectId)) throw new Error("incrementNamedCounter: invalid projectId");

  // If already an ObjectId instance, use it; otherwise create a new one with `new`
  const projectObjectId =
    projectId instanceof mongoose.Types.ObjectId
      ? projectId
      : new mongoose.Types.ObjectId(String(projectId));

  const query = { projectId: projectObjectId };
  const update = { $inc: { seq: 1 } };
  const opts = { new: true, upsert: true, setDefaultsOnInsert: true };
  if (session) opts.session = session;

  const updated = await Model.findOneAndUpdate(query, update, opts);
  // guard in case something weird happened
  if (!updated || typeof updated.seq === "undefined") {
    throw new Error("incrementNamedCounter: failed to update counter");
  }
  return updated.seq;
}


export async function generateNextCardNumber(projectOrId, session = null) {
  const projectId = (typeof projectOrId === "object" && projectOrId?._id) ? projectOrId._id : projectOrId;
  if (!projectId) throw new Error("projectId required for card number");

  // debug:
  console.log("[PC] generateNextCardNumber projectId:", projectId);
  console.log("[PC] PCProjectCounter:", typeof PCProjectCounter);
  console.log("[PC] PCCardCounter:", typeof PCCardCounter);
  console.log("[PC] isObjectIdLike:", isObjectIdLike(projectId));

  let project = null;
  try { project = await Project.findById(projectId).lean().catch(() => null); } catch (e) { project = null; }

  let projectSeq;
  try {
    projectSeq = await incrementNamedCounter(PCProjectCounter, projectId, session);
  } catch (err) {
    console.error("[PC] incrementNamedCounter(PCProjectCounter) failed:", err && err.message ? err.message : err);
    return `PC-FALLBACK-${Date.now()}`;
  }

  // Make sure PCCardCounter exists before calling
  if (typeof PCCardCounter === "undefined" || PCCardCounter === null) {
    console.error("[PC] PCCardCounter is not defined — import missing?");
    return `PC-FALLBACK-${Date.now()}`;
  }

  let cardSeq;
  try {
    cardSeq = await incrementNamedCounter(PCCardCounter, projectId, session);
  } catch (err) {
    console.error("[PC] incrementNamedCounter(PCCardCounter) failed:", err && err.message ? err.message : err);
    return `PC-FALLBACK-${Date.now()}`;
  }

  // ... rest of code unchanged
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const projectCodeRaw = (project && project.autoCode) ? String(project.autoCode).trim() : "PRJ";
  const projectSeqPadded = String(projectSeq).padStart(4, "0");
  const cardSeqPadded = String(cardSeq).padStart(3, "0");

  const prefix = projectCodeRaw.includes('/') && projectCodeRaw.toUpperCase().includes('PC')
    ? projectCodeRaw
    : `${projectCodeRaw}/PC/${projectSeqPadded}`;

  return `${prefix}`;
}


/* numeric extractor (from consumption strings) */
function extractNumeric(v) {
  if (typeof v === "number") return v;
  if (!v) return 0;
  const m = String(v).match(/\d+\.?\d*/);
  return m ? parseFloat(m[0]) : 0;
}

/**
 * computeMaterialsFromProject:
 * - reads all cost-row collections for a project,
 * - multiplies consumption * allocationQty,
 * - returns { materials, components } arrays.
 */
export async function computeMaterialsFromProject(
  projectId,
  allocationQty,
  provided = { materials: [], components: [] }
) {
  // use provided arrays if client passed them (trusting client)
  if (Array.isArray(provided.materials) && provided.materials.length > 0) {
    return {
      materials: provided.materials,
      components: provided.components || [],
    };
  }

  // fetch rows from all cost collections in parallel
  const [upperRows, componentRows, materialRows, packagingRows, miscRows] =
    await Promise.all([
      UpperCostRow.find({ projectId })
        .lean()
        .catch(() => []),
      ComponentCostRow.find({ projectId })
        .lean()
        .catch(() => []),
      MaterialCostRow.find({ projectId })
        .lean()
        .catch(() => []),
      PackagingCostRow.find({ projectId })
        .lean()
        .catch(() => []),
      MiscCostRow.find({ projectId })
        .lean()
        .catch(() => []),
    ]);

  const materials = [];
  const components = [];

  const pushItem = (row, targetArray) => {
    const consumption = extractNumeric(row.consumption);
    const requirement = +(consumption * (allocationQty || 0)).toFixed(4);
    targetArray.push({
      id: row._id,
      name: row.item || row.name || "Unknown",
      specification: row.description || "",
      requirement,
      unit: row.unit || "unit",
      available: 0,
      issued: 0,
      balance: 0,
    });
  };

  // upper & material => materials
  upperRows.forEach((r) => pushItem(r, materials));
  materialRows.forEach((r) => pushItem(r, materials));

  // component, packaging, misc => components
  componentRows.forEach((r) => pushItem(r, components));
  packagingRows.forEach((r) => pushItem(r, components));
  miscRows.forEach((r) => pushItem(r, components));

  return { materials, components };
}


// ... keep generateNextCardNumber, computeMaterialsFromProject etc. unchanged

export async function createProductionCardWithRequest(payload, userName = "Production Manager", useTransaction = false) {
  const { projectId, cardQuantity = 0 } = payload;
  if (!projectId) throw new Error("projectId required");
  if (!cardQuantity || cardQuantity <= 0) throw new Error("cardQuantity must be > 0");

  if (useTransaction) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const project = await Project.findById(projectId).session(session).lean();
      if (!project) throw new Error("Project not found");

      const cardNumber = await generateNextCardNumber(projectId, session);
      const allocationQty = payload.allocationQty ?? project.allocationQty ?? cardQuantity;
      const computed = await computeMaterialsFromProject(project, allocationQty, { materials: payload.materials || [], components: payload.components || [] });

      // create production card with embedded initial material request
      const [productionCard] = await PCProductionCard.create([{
        cardNumber,
        projectId,
        productName: payload.productName || project.productName || "",
        cardQuantity,
        startDate: payload.startDate ? new Date(payload.startDate) : undefined,
        assignedPlant: payload.assignedPlant || project.defaultPlant,
        description: payload.description || "",
        specialInstructions: payload.specialInstructions || "",
        status: payload.status || "Draft",
        materialRequestStatus: "Pending to Store",
        materials: computed.materials,
        components: computed.components,
        materialRequests: [{
          requestedBy: userName,
          status: "Pending to Store",
          materials: computed.materials,
          components: computed.components,
          notes: payload.requestNotes || ""
        }],
        createdBy: userName,
      }], { session });

      // populate project in returned doc
      await productionCard.populate({ path: "projectId", select: "autoCode brand category color productDesc allocationQty defaultPlant clientFinalCost" });

      await session.commitTransaction();
      session.endSession();
      return { productionCard, project };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("createProductionCardWithRequest transaction failed", err);
      throw err;
    }
  }

  // non-transactional fallback
  const project = await Project.findById(projectId).lean();
  if (!project) throw new Error("Project not found");

  const cardNumber = await generateNextCardNumber(projectId);
  const allocationQty = payload.allocationQty ?? project.allocationQty ?? cardQuantity;
  const computed = await computeMaterialsFromProject(project, allocationQty, { materials: payload.materials || [], components: payload.components || [] });

  let productionCard = await PCProductionCard.create({
    cardNumber,
    projectId,
    productName: payload.productName || project.productName || "",
    cardQuantity,
    startDate: payload.startDate ? new Date(payload.startDate) : undefined,
    assignedPlant: payload.assignedPlant || project.defaultPlant,
    description: payload.description || "",
    specialInstructions: payload.specialInstructions || "",
    status: payload.status || "Draft",
    materialRequestStatus: "Pending to Store",
    materials: computed.materials,
    components: computed.components,
    materialRequests: [{
      requestedBy: userName,
      status: "Pending to Store",
      materials: computed.materials,
      components: computed.components,
      notes: payload.requestNotes || ""
    }],
    createdBy: userName,
  });

  productionCard = await productionCard.populate({ path: "projectId", select: "autoCode brand category color productDesc allocationQty defaultPlant clientFinalCost" });

  return { productionCard, project };
}
