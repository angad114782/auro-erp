import mongoose from "mongoose";
import { PCProjectCounter } from "../models/pc_projectCounter.model.js";
import { PCCardCounter } from "../models/pc_cardCounter.model.js";
import { PCProductionCard } from "../models/pc_productionCard.model.js";
import { PCMaterialRequest } from "../models/pc_materialRequest.model.js";
import { Project } from "../models/Project.model.js";
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
  const projectObjectId = projectId instanceof mongoose.Types.ObjectId ? projectId : new mongoose.Types.ObjectId(String(projectId));
  const query = { projectId: projectObjectId };
  const update = { $inc: { seq: 1 } };
  const opts = { new: true, upsert: true, setDefaultsOnInsert: true };
  if (session) opts.session = session;
  const updated = await Model.findOneAndUpdate(query, update, opts);
  if (!updated || typeof updated.seq === "undefined") throw new Error("incrementNamedCounter: failed");
  return updated.seq;
}

export async function generateNextCardNumber(projectOrId, session = null) {
  const projectId = (typeof projectOrId === "object" && projectOrId?._id) ? projectOrId._id : projectOrId;
  if (!projectId) throw new Error("projectId required for card number");

  const project = await Project.findById(projectId).lean().catch(()=>null);

  let projectSeq;
  try { projectSeq = await incrementNamedCounter(PCProjectCounter, projectId, session); } catch (e) { return `PC-FALLBACK-${Date.now()}`; }
  if (!PCCardCounter) return `PC-FALLBACK-${Date.now()}`;
  let cardSeq;
  try { cardSeq = await incrementNamedCounter(PCCardCounter, projectId, session); } catch (e) { return `PC-FALLBACK-${Date.now()}`; }

  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const projectCodeRaw = (project && project.autoCode) ? String(project.autoCode).trim() : "PRJ";
  const projectSeqPadded = String(projectSeq).padStart(4, "0");
  const cardSeqPadded = String(cardSeq).padStart(3, "0");
  const prefix = projectCodeRaw.includes('/') && projectCodeRaw.toUpperCase().includes('PC') ? projectCodeRaw : `${projectCodeRaw}/PC/${projectSeqPadded}`;
  return `${prefix}/${yy}${mm}/${cardSeqPadded}`;
}

/* numeric extractor */
function extractNumeric(v) {
  if (typeof v === "number") return v;
  if (!v) return 0;
  const m = String(v).match(/\d+\.?\d*/);
  return m ? parseFloat(m[0]) : 0;
}

/* computeMaterialsFromProject accepts project object or id */
export async function computeMaterialsFromProject(projectOrId, allocationQty, provided = { materials: [], components: [] }) {
  const projectId = (typeof projectOrId === "object" && projectOrId?._id) ? String(projectOrId._id) : String(projectOrId);
  if (Array.isArray(provided.materials) && provided.materials.length > 0) {
    return { materials: provided.materials, components: provided.components || [] };
  }

  const [upperRows, componentRows, materialRows, packagingRows, miscRows] = await Promise.all([
    UpperCostRow.find({ projectId }).lean().catch(()=>[]),
    ComponentCostRow.find({ projectId }).lean().catch(()=>[]),
    MaterialCostRow.find({ projectId }).lean().catch(()=>[]),
    PackagingCostRow.find({ projectId }).lean().catch(()=>[]),
    MiscCostRow.find({ projectId }).lean().catch(()=>[]),
  ]);

  const materials = [];
  const components = [];

  const pushItem = (row, targetArray) => {
    const consumption = extractNumeric(row.consumption);
    const requirement = +(consumption * (allocationQty || 0)).toFixed(4);
    targetArray.push({
      itemId: row._id,
      name: row.item || row.name || "Unknown",
      specification: row.description || "",
      requirement,
      unit: row.unit || "unit",
      available: 0,
      issued: 0,
      balance: requirement,
    });
  };

  upperRows.forEach(r => pushItem(r, materials));
  materialRows.forEach(r => pushItem(r, materials));
  componentRows.forEach(r => pushItem(r, components));
  packagingRows.forEach(r => pushItem(r, components));
  miscRows.forEach(r => pushItem(r, components));

  return { materials, components };
}

/* Create skeleton card (single click) - transactional if desired */
export async function createProductionCardSkeleton(projectId, createdBy = "Production Manager", useTransaction = true) {
  if (!projectId) throw new Error("projectId required");
  if (useTransaction) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const project = await Project.findById(projectId).session(session).lean();
      if (!project) throw new Error("Project not found");

      const cardNumber = await generateNextCardNumber(projectId, session);
      const [productionCard] = await PCProductionCard.create([{
        cardNumber,
        projectId,
        status: "Draft",
        createdBy,
        materialRequestStatus: "Not Requested",
        assignedPlant: null
      }], { session });

      await session.commitTransaction();
      session.endSession();
      return productionCard;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  // fallback without transaction
  const project = await Project.findById(projectId).lean();
  if (!project) throw new Error("Project not found");
  const cardNumber = await generateNextCardNumber(projectId);
  const productionCard = await PCProductionCard.create({
    cardNumber,
    projectId,
    status: "Draft",
    createdBy,
    materialRequestStatus: "Not Requested",
    assignedPlant: null
  });
  return productionCard;
}

/* get card by id (populated) */
export async function getCardById(cardId) {
  if (!isObjectIdLike(cardId)) throw new Error("Invalid cardId");
  const card = await PCProductionCard.findById(cardId)
    .populate({ path: "projectId", select: "autoCode productName brand allocationQty defaultPlant" })
    .populate({ path: "assignedPlant", select: "name" })
    .populate({ path: "materialRequests" });
  if (!card) throw new Error("Card not found");
  return card;
}

/* update production card (PUT) */
export async function updateProductionCard(cardId, updates = {}, options = { computeMaterialsIfMissing: false }) {
  if (!isObjectIdLike(cardId)) throw new Error("Invalid cardId");
  const allowed = ["productName","cardQuantity","startDate","assignedPlant","description","specialInstructions","status","materials","components","materialRequestStatus","stage"];
  const payload = {};
  for (const k of allowed) if (typeof updates[k] !== "undefined") payload[k] = updates[k];

  if (options.computeMaterialsIfMissing && (!Array.isArray(payload.materials) || payload.materials.length === 0)) {
    const card = await PCProductionCard.findById(cardId).lean();
    if (!card) throw new Error("Production card not found");
    const allocationQty = updates.allocationQty ?? card.cardQuantity ?? 0;
    const computed = await computeMaterialsFromProject(card.projectId, allocationQty);
    payload.materials = computed.materials;
    payload.components = computed.components;
  }

  if (payload.assignedPlant && !isObjectIdLike(payload.assignedPlant)) throw new Error("assignedPlant must be a valid ObjectId");

  const updated = await PCProductionCard.findByIdAndUpdate(cardId, { $set: payload }, { new: true, runValidators: true })
    .populate({ path: "assignedPlant", select: "name" })
    .populate({ path: "materialRequests" });

  if (!updated) throw new Error("Update failed: card not found");
  return updated;
}

/* Create top-level MR and link to card transactionally */
export async function createMaterialRequestForCard(cardId, mrPayload = {}, requestedBy = "Production Manager") {
  if (!isObjectIdLike(cardId)) throw new Error("cardId required");
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const card = await PCProductionCard.findById(cardId).session(session);
    if (!card) throw new Error("Card not found");

    // if client didn't provide materials, use card snapshot or compute
    let materials = Array.isArray(mrPayload.materials) && mrPayload.materials.length ? mrPayload.materials : (card.materials || []);
    let components = Array.isArray(mrPayload.components) && mrPayload.components.length ? mrPayload.components : (card.components || []);

    // create MR doc
    const [mr] = await PCMaterialRequest.create([{
      productionCardId: card._id,
      projectId: card.projectId,
      cardNumber: card.cardNumber || "",
      requestedBy: requestedBy,
      status: mrPayload.status || "Pending to Store",
      materials,
      components,
      notes: mrPayload.notes || ""
    }], { session });

    // push MR id into card materialRequests and update snapshot/status
    card.materialRequests.push(mr._id);
    if (materials && materials.length) card.materials = materials;
    if (components && components.length) card.components = components;
    card.materialRequestStatus = mr.status || card.materialRequestStatus;
    await card.save({ session });

    await session.commitTransaction();
    session.endSession();
    return { mr, card };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

/* list material requests (filters) */
export async function listMaterialRequests(filter = {}, options = { page:1, limit:50 }) {
  const q = { isDeleted: false };
  if (filter.projectId) q.projectId = filter.projectId;
  if (filter.status) q.status = filter.status;
  const skip = (options.page - 1) * options.limit;
  const docs = await PCMaterialRequest.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(options.limit)).lean();
  const total = await PCMaterialRequest.countDocuments(q);
  return { items: docs, total };
}

/* Update MR and sync card snapshot inside transaction */
export async function updateMaterialRequest(mrId, mrUpdates = {}, options = { syncCard: true }) {
  if (!isObjectIdLike(mrId)) throw new Error("Invalid mrId");
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const mr = await PCMaterialRequest.findByIdAndUpdate(mrId, { $set: mrUpdates }, { new: true, session });
    if (!mr) throw new Error("MR not found");

    let card = null;
    if (options.syncCard && mr.productionCardId) {
      card = await PCProductionCard.findById(mr.productionCardId).session(session);
      if (card) {
        card.materialRequestStatus = mr.status || card.materialRequestStatus;
        if (Array.isArray(mr.materials) && mr.materials.length) card.materials = mr.materials;
        if (Array.isArray(mr.components) && mr.components.length) card.components = mr.components;
        await card.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();
    return { mr, card };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

/* Soft-delete MR and unlink from card */
export async function softDeleteMaterialRequest(mrId, options = { removeFromCard: true }) {
  if (!isObjectIdLike(mrId)) throw new Error("Invalid mrId");
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const mr = await PCMaterialRequest.findById(mrId).session(session);
    if (!mr) throw new Error("MR not found");
    mr.isDeleted = true;
    mr.status = "Cancelled";
    await mr.save({ session });

    let card = null;
    if (options.removeFromCard && mr.productionCardId) {
      card = await PCProductionCard.findById(mr.productionCardId).session(session);
      if (card) {
        card.materialRequests = (card.materialRequests || []).filter(id => String(id) !== String(mr._id));
        // adjust materialRequestStatus using last MR if any
        const lastMrId = card.materialRequests.slice(-1)[0];
        if (lastMrId) {
          const lastMr = await PCMaterialRequest.findById(lastMrId).session(session);
          card.materialRequestStatus = lastMr ? lastMr.status : "Not Requested";
        } else {
          card.materialRequestStatus = "Not Requested";
        }
        await card.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();
    return { mr, card };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}


// add near other exports in pc_productionCard.service.js
export async function getMaterialRequestById(mrId) {
  if (!isObjectIdLike(mrId)) throw new Error("Invalid mrId");

  // populate production card basic info and project for convenience
  const mr = await PCMaterialRequest.findById(mrId)
    .populate({
      path: "productionCardId",
      select: "_id cardNumber projectId productName cardQuantity assignedPlant materials components",
      populate: { path: "assignedPlant", select: "name" }
    })
    .populate({ path: "projectId", select: "autoCode productName" })
    .lean();

  if (!mr || mr.isDeleted) throw new Error("Material request not found");
  return mr;
}
