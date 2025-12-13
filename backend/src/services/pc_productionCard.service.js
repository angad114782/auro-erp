// services/pc_productionCard.service.js
import mongoose from "mongoose";
import { PCProjectCounter } from "../models/pc_projectCounter.model.js";
import { PCCardCounter } from "../models/pc_cardCounter.model.js";
import { PCProductionCard } from "../models/pc_productionCard.model.js";
import { PCMaterialRequest } from "../models/pc_materialRequest.model.js";
import { Project } from "../models/Project.model.js";
import { PoDetails } from "../models/PoDetails.model.js";
import {
  UpperCostRow,
  ComponentCostRow,
  MaterialCostRow,
  PackagingCostRow,
  MiscCostRow,
} from "../models/projectCost.model.js";

/* ---------- helpers ---------- */
export function isObjectIdLike(id) {
  return id && mongoose.Types.ObjectId.isValid(String(id));
}

async function incrementNamedCounter(Model, projectId, session = null) {
  if (!isObjectIdLike(projectId)) throw new Error("incrementNamedCounter: invalid projectId");
  const projectObjectId =
    projectId instanceof mongoose.Types.ObjectId ? projectId : new mongoose.Types.ObjectId(String(projectId));
  const opts = { new: true, upsert: true, setDefaultsOnInsert: true };
  if (session) opts.session = session;
  const updated = await Model.findOneAndUpdate({ projectId: projectObjectId }, { $inc: { seq: 1 } }, opts);
  if (!updated || typeof updated.seq === "undefined") throw new Error("incrementNamedCounter: failed");
  return updated.seq;
}

export async function generateNextCardNumber(projectOrId, session = null) {
  const projectId = typeof projectOrId === "object" && projectOrId?._id ? projectOrId._id : projectOrId;
  if (!projectId) throw new Error("projectId required for card number");
  const project = await Project.findById(projectId).lean().catch(() => null);

  let projectSeq;
  try {
    projectSeq = await incrementNamedCounter(PCProjectCounter, projectId, session);
  } catch (e) {
    return `PC-FALLBACK-${Date.now()}`;
  }

  let cardSeq;
  try {
    cardSeq = await incrementNamedCounter(PCCardCounter, projectId, session);
  } catch (e) {
    return `PC-FALLBACK-${Date.now()}`;
  }

  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const projectCodeRaw = project && project.autoCode ? String(project.autoCode).trim() : "PRJ";
  const projectSeqPadded = String(projectSeq).padStart(4, "0");
  const cardSeqPadded = String(cardSeq).padStart(3, "0");
  const prefix =
    projectCodeRaw.includes("/") && projectCodeRaw.toUpperCase().includes("PC")
      ? projectCodeRaw
      : `${projectCodeRaw}/PC/${projectSeqPadded}`;
  return `${prefix}/${yy}${mm}/${cardSeqPadded}`;
}

function extractNumeric(v) {
  if (typeof v === "number") return v;
  if (!v) return 0;
  const m = String(v).match(/\d+\.?\d*/);
  return m ? parseFloat(m[0]) : 0;
}

/* ---------- computeMaterialsFromProject (returns 5 arrays) ---------- */
/*
 returns:
 {
   upper: [..],
   materials: [..],
   components: [..],
   packaging: [..],
   misc: [..]
 }
 Each item includes department if present in the cost-row (for upper & component rows).
*/
export async function computeMaterialsFromProject(projectOrId, allocationQty = 0, provided = {}) {
  const projectId = typeof projectOrId === "object" && projectOrId?._id ? String(projectOrId._id) : String(projectOrId);

  // If caller provided prepared structure, honor it (useful for client override)
  if (provided && Object.keys(provided).length > 0) {
    return {
      upper: provided.upper || [],
      materials: provided.materials || [],
      components: provided.components || [],
      packaging: provided.packaging || [],
      misc: provided.misc || [],
    };
  }

  const [upperRows, componentRows, materialRows, packagingRows, miscRows] = await Promise.all([
    UpperCostRow.find({ projectId }).lean().catch(() => []),
    ComponentCostRow.find({ projectId }).lean().catch(() => []),
    MaterialCostRow.find({ projectId }).lean().catch(() => []),
    PackagingCostRow.find({ projectId }).lean().catch(() => []),
    MiscCostRow.find({ projectId }).lean().catch(() => []),
  ]);

  const upper = [];
  const materials = [];
  const components = [];
  const packaging = [];
  const misc = [];

  const pushItem = (row, targetArray, includeDept = false) => {
    const consumption = extractNumeric(row.consumption);
    const requirement = +(consumption * (allocationQty || 0)).toFixed(4);

    const base = {
      itemId: row._id || null,
      name: row.item || row.name || "",
      specification: row.description || row.specification || "",
      unit: row.unit || "unit",
      requirement,
      available: Number(row.available || 0),
      issued: Number(row.issued || 0),
      balance: Number(row.balance ?? requirement),
    };
    if (includeDept) base.department = row.department || null;
    targetArray.push(base);
  };

  // upper and component rows often have department; material/packaging/misc may not
  upperRows.forEach((r) => pushItem(r, upper, true));
  materialRows.forEach((r) => pushItem(r, materials, false));
  componentRows.forEach((r) => pushItem(r, components, true));
  packagingRows.forEach((r) => pushItem(r, packaging, false));
  miscRows.forEach((r) => pushItem(r, misc, false));

  return { upper, materials, components, packaging, misc };
}

/* ---------- Create skeleton card ---------- */
export async function createProductionCardSkeleton(projectId, createdBy = "Production Manager", useTransaction = true) {
  if (!projectId) throw new Error("projectId required");
  if (useTransaction) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const project = await Project.findById(projectId).session(session).lean();
      if (!project) throw new Error("Project not found");

      const cardNumber = await generateNextCardNumber(projectId, session);
      const [productionCard] = await PCProductionCard.create(
        [
          {
            cardNumber,
            projectId,
            status: "Draft",
            createdBy,
            materialRequestStatus: "Not Requested",
            assignedPlant: null,
            // ensure snapshot arrays exist (empty)
            upper: [],
            materials: [],
            components: [],
            packaging: [],
            misc: [],
          },
        ],
        { session }
      );

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
    assignedPlant: null,
    upper: [],
    materials: [],
    components: [],
    packaging: [],
    misc: [],
  });
  return productionCard;
}

/* ---------- getCardById (populate helpful fields) ---------- */
export async function getCardById(cardId) {
  if (!isObjectIdLike(cardId)) throw new Error("Invalid cardId");

  const card = await PCProductionCard.findById(cardId)
    .populate({
      path: "projectId",
      select: "autoCode productName artName brand allocationQty defaultPlant",
    })
    .populate({ path: "assignedPlant", select: "name" })
    .populate({ path: "materialRequests" })
    .lean();

  if (!card) throw new Error("Card not found");

  // resolve productName fallback
  const project = card.projectId || {};
  const defaultProductName =
    (project.productName && String(project.productName).trim()) ||
    (project.artName && String(project.artName).trim()) ||
    (project.autoCode && String(project.autoCode).trim()) ||
    "";

  const isMeaningfulName = (s) => {
    if (!s) return false;
    const v = String(s).trim();
    if (!v) return false;
    if (/^[-\s]+$/.test(v)) return false;
    return true;
  };

  const rawName = card.productName;
  const resolvedName = isMeaningfulName(rawName) ? String(rawName).trim() : defaultProductName;
  card.originalProductName = rawName;
  card.productName = resolvedName;

  return card;
}

/* ---------- updateProductionCard ---------- */
/*
 Accepts updates; supports computeMaterialsIfMissing option.
 When computing, we compute 5 arrays and store:
  - upper, materials, components, packaging, misc
  - also produce combined materialsSnapshot and componentsSnapshot for backward compatibility:
    materialsSnapshot = upper + materials
    componentsSnapshot = components + packaging + misc
*/
export async function updateProductionCard(cardId, updates = {}, options = { computeMaterialsIfMissing: false }) {
  if (!isObjectIdLike(cardId)) throw new Error("Invalid cardId");

  const allowed = [
    "productName",
    "cardQuantity",
    "startDate",
    "assignedPlant",
    "description",
    "specialInstructions",
    "status",
    "materials",
    "components",
    "upper",
    "packaging",
    "misc",
    "materialRequestStatus",
    "stage",
  ];

  const payload = {};
  for (const k of allowed) if (typeof updates[k] !== "undefined") payload[k] = updates[k];

  // If computeMaterialsIfMissing requested OR no snapshot provided, compute from project
  if (options.computeMaterialsIfMissing) {
    const card = await PCProductionCard.findById(cardId).lean();
    if (!card) throw new Error("Production card not found");
    const allocationQty = updates.allocationQty ?? card.cardQuantity ?? 0;
    const computed = await computeMaterialsFromProject(card.projectId, allocationQty);
    // store computed five arrays (explicit)
    payload.upper = computed.upper || [];
    payload.materials = computed.materials || [];
    payload.components = computed.components || [];
    payload.packaging = computed.packaging || [];
    payload.misc = computed.misc || [];
  }

  // If payload includes the five arrays but we also want to maintain legacy snapshots:
  const finalizeCombined = (p) => {
    const upperA = Array.isArray(p.upper) ? p.upper : [];
    const matA = Array.isArray(p.materials) ? p.materials : [];
    const compA = Array.isArray(p.components) ? p.components : [];
    const packA = Array.isArray(p.packaging) ? p.packaging : [];
    const miscA = Array.isArray(p.misc) ? p.misc : [];

    // combined legacy snapshots
    p.materialsSnapshot = [...upperA, ...matA]; // old 'materials' view for UI that expects combined
    p.componentsSnapshot = [...compA, ...packA, ...miscA]; // old 'components' view
  };

  // If user provided arrays directly, ensure we set combined fields too
  if (payload.upper || payload.materials || payload.components || payload.packaging || payload.misc) {
    finalizeCombined(payload);
    // also copy materialsSnapshot -> keep key 'materials' used originally by many parts?
    // But avoid overwriting the explicit 'materials' field used for separated arrays:
    // We'll set legacy fields in a separate key names to avoid confusion: 'materialsSnapshot' and 'componentsSnapshot'
    // If you prefer to overwrite 'materials' and 'components' (legacy), we can do that too.
  }

  if (payload.assignedPlant && !isObjectIdLike(payload.assignedPlant))
    throw new Error("assignedPlant must be a valid ObjectId");

  const updated = await PCProductionCard.findOneAndUpdate({ _id: cardId, isActive: true }, { $set: payload }, { new: true, runValidators: true })
    .populate({ path: "assignedPlant", select: "name" })
    .populate({ path: "materialRequests" });

  if (!updated) throw new Error("Update failed: card not found");
  return updated;
}

/* ---------- createMaterialRequestForCard (transactional) ---------- */
/*
 Behavior:
 - If client supplies MR with explicit arrays (upper,materials,components,packaging,misc) use them.
 - Otherwise take snapshot from card (the five arrays if present).
 - For backwards compatibility also compute combined materials/components fields inside MR:
     mr.materialsSnapshot = upper + materials
     mr.componentsSnapshot = components + packaging + misc
 - Push MR id to card.materialRequests and update card snapshot/status inside same transaction.
*/
// export async function createMaterialRequestForCard(cardId, mrPayload = {}, requestedBy = "Production Manager") {
//   if (!isObjectIdLike(cardId)) throw new Error("cardId required");
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const card = await PCProductionCard.findById(cardId).session(session);
//     if (!card) throw new Error("Card not found");

//     // determine snapshot source (client provided or card)
//     const upper = Array.isArray(mrPayload.upper) && mrPayload.upper.length ? mrPayload.upper : (Array.isArray(card.upper) ? card.upper : []);
//     const materials = Array.isArray(mrPayload.materials) && mrPayload.materials.length ? mrPayload.materials : (Array.isArray(card.materials) ? card.materials : []);
//     const components = Array.isArray(mrPayload.components) && mrPayload.components.length ? mrPayload.components : (Array.isArray(card.components) ? card.components : []);
//     const packaging = Array.isArray(mrPayload.packaging) && mrPayload.packaging.length ? mrPayload.packaging : (Array.isArray(card.packaging) ? card.packaging : []);
//     const misc = Array.isArray(mrPayload.misc) && mrPayload.misc.length ? mrPayload.misc : (Array.isArray(card.misc) ? card.misc : []);

//     // legacy combined snapshots for older UI/backends
//     const materialsSnapshot = [...(upper || []), ...(materials || [])];
//     const componentsSnapshot = [...(components || []), ...(packaging || []), ...(misc || [])];

//     // create MR doc (we store five arrays + legacy snapshots)
//     const [mr] = await PCMaterialRequest.create(
//       [
//         {
//           productionCardId: card._id,
//           projectId: card.projectId,
//           cardNumber: card.cardNumber || "",
//           requestedBy: requestedBy,
//           status: mrPayload.status || "Pending to Store",
//           upper: upper,
//           materials: materials,
//           components: components,
//           packaging: packaging,
//           misc: misc,
//           // legacy convenience fields
//           materialsSnapshot,
//           componentsSnapshot,
//           notes: mrPayload.notes || "Material request created from production card",
//         },
//       ],
//       { session }
//     );

//     // push MR into card and update card snapshot & status (keep both separate arrays and legacy snapshots)
//     card.materialRequests = card.materialRequests || [];
//     card.materialRequests.push(mr._id);

//     // persist the snapshot back to card (explicit five arrays)
//     if (upper && upper.length) card.upper = upper;
//     if (materials && materials.length) card.materials = materials;
//     if (components && components.length) card.components = components;
//     if (packaging && packaging.length) card.packaging = packaging;
//     if (misc && misc.length) card.misc = misc;

//     // also set legacy combined snapshots for backward compatibility
//     card.materialsSnapshot = materialsSnapshot;
//     card.componentsSnapshot = componentsSnapshot;

//     card.materialRequestStatus = mr.status || card.materialRequestStatus;
//     await card.save({ session });

//     await session.commitTransaction();
//     session.endSession();
//     return { mr, card };
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();
//     throw err;
//   }
// }

// add near top of file with other imports
// (no extra npm packages required)
async function buildItemDeptMap(projectId) {
  // fetch all cost-rows that may contain department
  const [upperCostRows, componentCostRows, materialCostRows, packagingCostRows, miscCostRows] = await Promise.all([
    UpperCostRow.find({ projectId }).select("_id department").lean().catch(() => []),
    ComponentCostRow.find({ projectId }).select("_id department").lean().catch(() => []),
    MaterialCostRow.find({ projectId }).select("_id department").lean().catch(() => []),
    PackagingCostRow.find({ projectId }).select("_id department").lean().catch(() => []),
    MiscCostRow.find({ projectId }).select("_id department").lean().catch(() => []),
  ]);

  const map = {};
  (upperCostRows || []).forEach(r => { if (r._id) map[String(r._id)] = r.department || null; });
  (componentCostRows || []).forEach(r => { if (r._id) map[String(r._id)] = r.department || null; });
  (materialCostRows || []).forEach(r => { if (r._id) map[String(r._id)] = r.department || null; });
  (packagingCostRows || []).forEach(r => { if (r._id) map[String(r._id)] = r.department || null; });
  (miscCostRows || []).forEach(r => { if (r._id) map[String(r._id)] = r.department || null; });

  return map; // key: itemId string -> department or null
}

// ensure each row has department if possible
function ensureDepartments(rows = [], itemDeptMap = {}) {
  return (rows || []).map(r => {
    // keep original department if present
    if (r.department) return r;
    // if itemId provided and found in map, assign
    if (r.itemId) {
      const dep = itemDeptMap[String(r.itemId)];
      if (dep) return { ...r, department: dep };
    }
    // fallback to unknown (optional) — you may prefer null
    return { ...r, department: r.department ?? "unknown" };
  });
}

// Replace existing createMaterialRequestForCard with this updated transactional version
export async function createMaterialRequestForCard(cardId, mrPayload = {}, requestedBy = "Production Manager") {
  if (!isObjectIdLike(cardId)) throw new Error("cardId required");
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const card = await PCProductionCard.findById(cardId).session(session);
    if (!card) throw new Error("Card not found");

    // determine snapshots - prefer client-provided arrays if present
    const upperSrc = Array.isArray(mrPayload.upper) && mrPayload.upper.length ? mrPayload.upper : (Array.isArray(card.upper) ? card.upper : []);
    const materialsSrc = Array.isArray(mrPayload.materials) && mrPayload.materials.length ? mrPayload.materials : (Array.isArray(card.materials) ? card.materials : []);
    const componentsSrc = Array.isArray(mrPayload.components) && mrPayload.components.length ? mrPayload.components : (Array.isArray(card.components) ? card.components : []);
    const packagingSrc = Array.isArray(mrPayload.packaging) && mrPayload.packaging.length ? mrPayload.packaging : (Array.isArray(card.packaging) ? card.packaging : []);
    const miscSrc = Array.isArray(mrPayload.misc) && mrPayload.misc.length ? mrPayload.misc : (Array.isArray(card.misc) ? card.misc : []);

    // Build itemId->department map once (helps fill missing department values)
    const itemDeptMap = await buildItemDeptMap(card.projectId);

    // Ensure department present where possible
    const upper = ensureDepartments(upperSrc, itemDeptMap);
    const materials = ensureDepartments(materialsSrc, itemDeptMap);
    const components = ensureDepartments(componentsSrc, itemDeptMap);
    const packaging = ensureDepartments(packagingSrc, itemDeptMap);
    const misc = ensureDepartments(miscSrc, itemDeptMap);

    // legacy combined snapshots for older UI/backends
    const materialsSnapshot = [...(upper || []), ...(materials || [])];
    const componentsSnapshot = [...(components || []), ...(packaging || []), ...(misc || [])];

    // create MR doc (store five arrays + legacy snapshots)
    const [mr] = await PCMaterialRequest.create(
      [
        {
          productionCardId: card._id,
          projectId: card.projectId,
          cardNumber: card.cardNumber || "",
          requestedBy: requestedBy,
          status: mrPayload.status || "Pending to Store",
          upper,
          materials,
          components,
          packaging,
          misc,
          materialsSnapshot,
          componentsSnapshot,
          notes: mrPayload.notes || "Material request created from production card",
        },
      ],
      { session }
    );

    // push MR into card and update card snapshot & status (keep both separate arrays and legacy snapshots)
    card.materialRequests = card.materialRequests || [];
    card.materialRequests.push(mr._id);

    // persist the snapshot back to card (explicit five arrays)
    if (upper && upper.length) card.upper = upper;
    if (materials && materials.length) card.materials = materials;
    if (components && components.length) card.components = components;
    if (packaging && packaging.length) card.packaging = packaging;
    if (misc && misc.length) card.misc = misc;

    // also set legacy combined snapshots for backward compatibility
    card.materialsSnapshot = materialsSnapshot;
    card.componentsSnapshot = componentsSnapshot;

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


/* ---------- listMaterialRequests ---------- */
export async function listMaterialRequests(filter = {}, options = { page: 1, limit: 50 }) {
  const q = { isDeleted: false };
  if (filter.projectId) q.projectId = filter.projectId;
  if (filter.status) q.status = filter.status;
  const skip = (options.page - 1) * options.limit;
  const docs = await PCMaterialRequest.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(options.limit)).lean();
  const total = await PCMaterialRequest.countDocuments(q);
  return { items: docs, total };
}

/* ---------- updateMaterialRequest (and sync card) ---------- */
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

        // If MR now contains five arrays, replace card snapshot
        if (Array.isArray(mr.upper) && mr.upper.length) card.upper = mr.upper;
        if (Array.isArray(mr.materials) && mr.materials.length) card.materials = mr.materials;
        if (Array.isArray(mr.components) && mr.components.length) card.components = mr.components;
        if (Array.isArray(mr.packaging) && mr.packaging.length) card.packaging = mr.packaging;
        if (Array.isArray(mr.misc) && mr.misc.length) card.misc = mr.misc;

        // keep legacy snapshots (if provided)
        if (Array.isArray(mr.materialsSnapshot) && mr.materialsSnapshot.length) card.materialsSnapshot = mr.materialsSnapshot;
        if (Array.isArray(mr.componentsSnapshot) && mr.componentsSnapshot.length) card.componentsSnapshot = mr.componentsSnapshot;

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

/* ---------- softDeleteMaterialRequest ---------- */
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
        card.materialRequests = (card.materialRequests || []).filter((id) => String(id) !== String(mr._id));
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

/* ---------- getMaterialRequestById ---------- */
export async function getMaterialRequestById(mrId) {
  if (!isObjectIdLike(mrId)) throw new Error("Invalid mrId");

  const mr = await PCMaterialRequest.findById(mrId)
    .populate({
      path: "productionCardId",
      select: "_id cardNumber projectId productName cardQuantity assignedPlant upper materials components packaging misc materialsSnapshot componentsSnapshot",
      populate: { path: "assignedPlant", select: "name" },
    })
    .populate({ path: "projectId", select: "autoCode productName" })
    .lean();

  if (!mr || mr.isDeleted) throw new Error("Material request not found");
  return mr;
}

/* ---------- fetchProductionCardsForProject ---------- */
export async function fetchProductionCardsForProject(projectId, opts = {}) {
  if (!projectId) throw new Error("projectId required");
  if (!mongoose.Types.ObjectId.isValid(String(projectId))) throw new Error("Invalid projectId");

  const page = Math.max(Number(opts.page || 1), 1);
  const limit = Math.min(Math.max(Number(opts.limit || 25), 1), 500);
  const status = opts.status;
  const search = (opts.search || "").trim();
  const sortQuery = opts.sort || "createdAt:desc";

  const q = {
    projectId: new mongoose.Types.ObjectId(String(projectId)),
    isActive: true,
  };

  if (status) q.status = status;
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    q.$or = [{ cardNumber: { $regex: safe, $options: "i" } }, { productName: { $regex: safe, $options: "i" } }];
  }

  const [sortField, sortDir] = String(sortQuery).split(":");
  const sort = {};
  sort[sortField || "createdAt"] = sortDir === "asc" ? 1 : -1;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    PCProductionCard.find(q)
      .populate({ path: "assignedPlant", select: "name" })
      .populate({ path: "materialRequests", select: "_id status createdAt" })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    PCProductionCard.countDocuments(q),
  ]);

  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

/* ---------- softDeleteProductionCard ---------- */
export async function softDeleteProductionCard(cardId, deletedBy = "System") {
  if (!isObjectIdLike(cardId)) throw new Error("Invalid cardId");
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const card = await PCProductionCard.findOne({ _id: cardId, isActive: true }).session(session);
    if (!card) throw new Error("Card not found or already deleted");

    card.isActive = false;
    await card.save({ session });

    await PCMaterialRequest.updateMany(
      { productionCardId: card._id, isDeleted: false },
      { $set: { isDeleted: true, status: "Cancelled", cancelledAt: new Date() } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    return card;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

/* ---------- Allowed stages and updateCardStage ---------- */
const ALLOWED_STAGES = ["Planning", "Tracking", "In Production", "Quality", "Completed", "Cancelled"];

export async function updateCardStage(cardId, projectId = null, newStage = "Tracking", updatedBy = "System") {
  if (!cardId || !isObjectIdLike(cardId)) throw new Error("Invalid cardId");
  if (!newStage || typeof newStage !== "string") throw new Error("newStage required");
  const normalized = String(newStage).trim();
  if (!ALLOWED_STAGES.includes(normalized)) throw new Error(`Invalid stage. Allowed: ${ALLOWED_STAGES.join(", ")}`);

  const query = { _id: cardId, isActive: true };
  if (projectId) {
    if (!isObjectIdLike(projectId)) throw new Error("Invalid projectId");
    query.projectId = projectId;
  }

  const existing = await PCProductionCard.findOne(query).select("stage").lean();
  if (!existing) throw new Error("Production card not found");

  const historyEntry = { from: existing.stage || null, to: normalized, by: updatedBy, at: new Date() };

  const updated = await PCProductionCard.findOneAndUpdate(query, { $set: { stage: normalized }, $push: { stageHistory: historyEntry } }, { new: true, runValidators: true })
    .populate({ path: "assignedPlant", select: "name" })
    .populate({ path: "materialRequests", select: "_id status createdAt" });

  if (!updated) throw new Error("Failed to update stage");
  return updated;
}

/* ---------- getProjectTrackingOverview ---------- */
/* ---------- getProjectTrackingOverview ---------- */
export async function getProjectTrackingOverview(projectId, opts = { page: 1, limit: 25, sort: "createdAt:desc" }) {
  if (!projectId) throw new Error("projectId required");
  if (!mongoose.Types.ObjectId.isValid(String(projectId))) throw new Error("Invalid projectId");

  const page = Math.max(Number(opts.page || 1), 1);
  const limit = Math.min(Math.max(Number(opts.limit || 25), 1), 500);
  const skip = (page - 1) * limit;
  const [sortField, sortDir] = String(opts.sort || "createdAt:desc").split(":");
  const sort = {}; sort[sortField || "createdAt"] = sortDir === "asc" ? 1 : -1;

  const project = await Project.findById(projectId)
    .populate({ path: "company", select: "name" })
    .populate({ path: "brand", select: "name" })
    .populate({ path: "category", select: "name" })
    .populate({ path: "type", select: "name" })
    .populate({ path: "country", select: "name" })
    .populate({ path: "assignPerson", select: "name email" })
    .lean();
  if (!project) throw new Error("Project not found");

  const projectObjId = new mongoose.Types.ObjectId(String(projectId));
  const poDetails = await PoDetails.findOne({ project: projectObjId }).lean().catch(() => null);

  const [trackingCount, totalCards, countsByStage] = await Promise.all([
    PCProductionCard.countDocuments({ projectId: projectObjId, stage: "Tracking", isActive: true }),
    PCProductionCard.countDocuments({ projectId: projectObjId, isActive: true }),
    PCProductionCard.aggregate([{ $match: { projectId: projectObjId, isActive: true } }, { $group: { _id: "$stage", count: { $sum: 1 } } }]),
  ]);

  const stageCounts = {};
  (countsByStage || []).forEach((c) => { stageCounts[c._id || "Unknown"] = c.count; });

  const [cards, cardsTotal] = await Promise.all([
    PCProductionCard.find({ projectId: projectObjId, stage: "Tracking", isActive: true })
      .populate({ path: "assignedPlant", select: "name" })
      .populate({ path: "materialRequests", select: "_id status createdAt" })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    PCProductionCard.countDocuments({ projectId: projectObjId, stage: "Tracking", isActive: true }),
  ]);

  // helper: map itemId -> department from cost rows (so we can fill missing department values)
  async function buildItemDeptMapOnce() {
    const [upperCostRows, componentCostRows] = await Promise.all([
      UpperCostRow.find({ projectId: projectObjId }).select("_id department").lean().catch(() => []),
      ComponentCostRow.find({ projectId: projectObjId }).select("_id department").lean().catch(() => []),
    ]);
    const map = {};
    (upperCostRows || []).forEach(r => { if (r._id) map[String(r._id)] = r.department || null; });
    (componentCostRows || []).forEach(r => { if (r._id) map[String(r._id)] = r.department || null; });
    return map;
  }

  const itemDeptMap = await buildItemDeptMapOnce();

  const isMeaningfulName = (s) => {
    if (!s) return false;
    const v = String(s).trim();
    if (!v) return false;
    if (/^[-\s]+$/.test(v)) return false;
    return true;
  };

  const defaultProductName = project.productName?.trim() || project.artName?.trim() || project.autoCode || "";

  // Build trackingCards enriched list and gather per-department aggregation
  const deptAgg = {}; // dept -> { materials: Map, components: Map }
  const pushToDept = (dept, kind, key, row) => {
    if (!deptAgg[dept]) deptAgg[dept] = { materials: {}, components: {} };
    const target = deptAgg[dept][kind];
    if (!target[key]) {
      target[key] = {
        itemId: row.itemId || null,
        name: row.name || "Unknown",
        specification: row.specification || row.description || "",
        unit: row.unit || "unit",
        requirement: Number(row.requirement || 0),
        available: Number(row.available || 0),
        issued: Number(row.issued || 0),
        balance: Number(row.balance || 0),
        occurrences: 1,
        department: dept
      };
    } else {
      target[key].requirement += Number(row.requirement || 0);
      target[key].available += Number(row.available || 0);
      target[key].issued += Number(row.issued || 0);
      target[key].balance += Number(row.balance || 0);
      target[key].occurrences += 1;
    }
  };

  const trackingItems = (cards || []).map((c) => {
    // Ensure snapshots arrays exist
    const upper = Array.isArray(c.upper) ? c.upper : [];
    const materials = Array.isArray(c.materials) ? c.materials : [];
    const components = Array.isArray(c.components) ? c.components : [];
    const packaging = Array.isArray(c.packaging) ? c.packaging : [];
    const misc = Array.isArray(c.misc) ? c.misc : [];

    // ensure dept present where possible
    const ensureDept = (row) => {
      if (!row) return row;
      if (row.department) return row;
      if (row.itemId && itemDeptMap[String(row.itemId)]) return { ...row, department: itemDeptMap[String(row.itemId)] };
      return { ...row, department: row.department ?? "unknown" };
    };

    const upperNorm = upper.map(ensureDept);
    const materialsNorm = materials.map(ensureDept);
    const componentsNorm = components.map(ensureDept);
    const packagingNorm = packaging.map(ensureDept);
    const miscNorm = misc.map(ensureDept);

    // accumulate dept-wise data (legacy combined logic: materials=upper+materials, components=components+packaging+misc)
    const matCombined = [...upperNorm, ...materialsNorm];
    const compCombined = [...componentsNorm, ...packagingNorm, ...miscNorm];

    for (const r of matCombined) {
      const dept = r.department || "unknown";
      const key = r.itemId ? String(r.itemId) : `__noid__:${r.name || ""}`;
      pushToDept(dept, "materials", key, r);
    }
    for (const r of compCombined) {
      const dept = r.department || "unknown";
      const key = r.itemId ? String(r.itemId) : `__noid__:${r.name || ""}`;
      pushToDept(dept, "components", key, r);
    }

    const rawName = c.productName;
    const finalProductName = isMeaningfulName(rawName) ? String(rawName).trim() : defaultProductName;

    return {
      _id: c._id,
      cardNumber: c.cardNumber,
      productName: finalProductName,
      originalProductName: rawName,
      cardQuantity: c.cardQuantity,
      startDate: c.startDate,
      assignedPlant: c.assignedPlant || null,
      materialRequestCount: Array.isArray(c.materialRequests) ? c.materialRequests.length : 0,
      materialRequestStatus: c.materialRequestStatus,
      stage: c.stage,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  });

  // convert deptAgg maps to sorted arrays
  const mapToSortedList = (mapObj) => Object.values(mapObj || {}).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const byDepartment = {};
  for (const deptKey of Object.keys(deptAgg)) {
    byDepartment[deptKey] = {
      materials: mapToSortedList(deptAgg[deptKey].materials),
      components: mapToSortedList(deptAgg[deptKey].components)
    };
  }

  return {
    project: { ...project, po: poDetails || null },
    summary: { trackingCount, totalCards, stageCounts, byDepartment }, // <-- department-wise summary added
    trackingCards: { items: trackingItems, page, limit, total: cardsTotal, pages: Math.max(1, Math.ceil(cardsTotal / limit)) },
  };
}

/* ---------- getTrackingMaterialsForProject (aggregates across five categories & by department) ---------- */
/*
 opts: { page, limit }
 returns:
  {
    page, limit, totalCards,
    cards: [ per-card snapshots ],
    aggregated: {
      overall: { materials: [], components: [] },    // combined (legacy) lists
      byDepartment: { "<dept>": { materials: [], components: [] }, ... },
      separated: { upper: [], materials: [], components: [], packaging: [], misc: [] } // aggregated per-category
    }
  }
*/
export async function getTrackingMaterialsForProject(projectId, opts = { page: 1, limit: 200, department: null }) {
  if (!projectId) throw new Error("projectId required");
  if (!mongoose.Types.ObjectId.isValid(String(projectId))) throw new Error("Invalid projectId");

  const page = Math.max(Number(opts.page || 1), 1);
  const limit = Math.min(Math.max(Number(opts.limit || 200), 1), 2000);
  const skip = (page - 1) * limit;
  const deptFilter = opts.department ? String(opts.department).trim() : null;

  const projectObjId = new mongoose.Types.ObjectId(String(projectId));

  // Build itemId -> department lookup from cost rows (for items that may not have dept in card snapshot)
  const [upperCostRows, componentCostRows] = await Promise.all([
    UpperCostRow.find({ projectId: projectObjId }).select("_id item department").lean().catch(() => []),
    ComponentCostRow.find({ projectId: projectObjId }).select("_id item department").lean().catch(() => []),
  ]);
  const itemDept = {};
  (upperCostRows || []).forEach((r) => { if (r._id) itemDept[String(r._id)] = r.department || null; });
  (componentCostRows || []).forEach((r) => { if (r._id) itemDept[String(r._id)] = r.department || null; });

  // Fetch tracking cards
  const [cards, totalCards] = await Promise.all([
    PCProductionCard.find({ projectId: projectObjId, stage: "Tracking", isActive: true }).select("cardNumber productName cardQuantity assignedPlant upper materials components packaging misc materialRequestStatus materialsSnapshot componentsSnapshot").populate({ path: "assignedPlant", select: "name" }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    PCProductionCard.countDocuments({ projectId: projectObjId, stage: "Tracking", isActive: true }),
  ]);

  // aggregator helpers
  const pushToMap = (map, key, row) => {
    if (!map[key]) {
      map[key] = { itemId: row.itemId || null, name: row.name || "Unknown", specification: row.specification || row.description || "", unit: row.unit || "unit", requirement: Number(row.requirement || 0), available: Number(row.available || 0), issued: Number(row.issued || 0), balance: Number(row.balance || 0), occurrences: 1, department: row.department || null };
    } else {
      map[key].requirement += Number(row.requirement || 0);
      map[key].available += Number(row.available || 0);
      map[key].issued += Number(row.issued || 0);
      map[key].balance += Number(row.balance || 0);
      map[key].occurrences += 1;
    }
  };

  const aggregated = {
    separated: { upper: {}, materials: {}, components: {}, packaging: {}, misc: {} }, // maps
    overallMaterials: {}, // legacy combined materials (upper+materials)
    overallComponents: {}, // legacy combined components (components+packaging+misc)
    byDepartment: {}, // dept -> { materials: {}, components: {} }
  };

  // Normalize per-card snapshots and aggregate
  const cardsWithSnapshots = (cards || []).map((c) => {
    const upper = Array.isArray(c.upper) ? c.upper : [];
    const materials = Array.isArray(c.materials) ? c.materials : [];
    const components = Array.isArray(c.components) ? c.components : [];
    const packaging = Array.isArray(c.packaging) ? c.packaging : [];
    const misc = Array.isArray(c.misc) ? c.misc : [];

    // ensure department present where possible (from itemDept lookup)
    const ensureDept = (row) => {
      if (row.department) return row;
      if (row.itemId && itemDept[String(row.itemId)]) return { ...row, department: itemDept[String(row.itemId)] };
      return { ...row, department: row.department || "unknown" };
    };

    const upperNorm = upper.map(ensureDept);
    const materialsNorm = materials.map(ensureDept);
    const componentsNorm = components.map(ensureDept);
    const packagingNorm = packaging.map(ensureDept);
    const miscNorm = misc.map(ensureDept);

    // aggregate separated category maps
    for (const r of upperNorm) {
      const key = r.itemId ? String(r.itemId) : `__noid__:${r.name || ""}`;
      pushToMap(aggregated.separated.upper, key, r);
    }
    for (const r of materialsNorm) {
      const key = r.itemId ? String(r.itemId) : `__noid__:${r.name || ""}`;
      pushToMap(aggregated.separated.materials, key, r);
    }
    for (const r of componentsNorm) {
      const key = r.itemId ? String(r.itemId) : `__noid__:${r.name || ""}`;
      pushToMap(aggregated.separated.components, key, r);
    }
    for (const r of packagingNorm) {
      const key = r.itemId ? String(r.itemId) : `__noid__:${r.name || ""}`;
      pushToMap(aggregated.separated.packaging, key, r);
    }
    for (const r of miscNorm) {
      const key = r.itemId ? String(r.itemId) : `__noid__:${r.name || ""}`;
      pushToMap(aggregated.separated.misc, key, r);
    }

    // legacy combined lists and per-department aggregation
    const matCombined = [...upperNorm, ...materialsNorm];
    const compCombined = [...componentsNorm, ...packagingNorm, ...miscNorm];

    for (const r of matCombined) {
      const key = r.itemId ? String(r.itemId) : `__noid__:${r.name || ""}`;
      pushToMap(aggregated.overallMaterials, key, r);
      const dept = r.department || "unknown";
      if (!aggregated.byDepartment[dept]) aggregated.byDepartment[dept] = { materials: {}, components: {} };
      pushToMap(aggregated.byDepartment[dept].materials, key, r);
    }
    for (const r of compCombined) {
      const key = r.itemId ? String(r.itemId) : `__noid__:${r.name || ""}`;
      pushToMap(aggregated.overallComponents, key, r);
      const dept = r.department || "unknown";
      if (!aggregated.byDepartment[dept]) aggregated.byDepartment[dept] = { materials: {}, components: {} };
      pushToMap(aggregated.byDepartment[dept].components, key, r);
    }

    return {
      _id: c._id,
      cardNumber: c.cardNumber,
      productName: c.productName,
      cardQuantity: c.cardQuantity,
      assignedPlant: c.assignedPlant || null,
      materialRequestStatus: c.materialRequestStatus,
      upper: upperNorm,
      materials: materialsNorm,
      components: componentsNorm,
      packaging: packagingNorm,
      misc: miscNorm,
      materialsSnapshot: Array.isArray(c.materialsSnapshot) ? c.materialsSnapshot : [...upperNorm, ...materialsNorm],
      componentsSnapshot: Array.isArray(c.componentsSnapshot) ? c.componentsSnapshot : [...componentsNorm, ...packagingNorm, ...miscNorm],
    };
  });

  // convert maps to sorted arrays
  const mapToSortedList = (map) => Object.values(map || {}).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const separated = {
    upper: mapToSortedList(aggregated.separated.upper),
    materials: mapToSortedList(aggregated.separated.materials),
    components: mapToSortedList(aggregated.separated.components),
    packaging: mapToSortedList(aggregated.separated.packaging),
    misc: mapToSortedList(aggregated.separated.misc),
  };

  const overallMaterialsList = mapToSortedList(aggregated.overallMaterials);
  const overallComponentsList = mapToSortedList(aggregated.overallComponents);

  const byDept = {};
  for (const dept of Object.keys(aggregated.byDepartment)) {
    byDept[dept] = {
      materials: mapToSortedList(aggregated.byDepartment[dept].materials),
      components: mapToSortedList(aggregated.byDepartment[dept].components),
    };
  }

  return {
    page,
    limit,
    totalCards,
    cards: cardsWithSnapshots,
    aggregated: {
      separated,
      overall: { materials: overallMaterialsList, components: overallComponentsList },
      byDepartment: byDept,
    },
  };
}


/**
 * Aggregate tracking materials/components across all projects for a given department.
 * Returns: {
 *   department: "cutting",
 *   page, limit, totalCardsScanned,
 *   projects: {
 *     "<projectId>": {
 *        project: { _id, autoCode, productName, ... },
 *        cards: [ { _id, cardNumber, productName, cardQuantity, materials:[], components:[] } ],
 *        aggregated: { materials: [...], components: [...] }
 *     }, ...
 *   },
 *   aggregatedOverall: { materials: [...], components: [...] } // across all projects
 * }
 */
export async function getTrackingByDepartmentAcrossProjects(department, opts = { page: 1, limit: 200 }) {
  if (!department) throw new Error("department required");

  const page = Math.max(Number(opts.page || 1), 1);
  const limit = Math.min(Math.max(Number(opts.limit || 200), 1), 2000);
  const skip = (page - 1) * limit;

  // 1) fetch tracking cards across all projects (paged)
  const [cards, totalCards] = await Promise.all([
    PCProductionCard.find({ stage: "Tracking", isActive: true })
      .select("cardNumber productName cardQuantity projectId upper materials components packaging misc materialRequestStatus")
      .populate({ path: "projectId", select: "autoCode productName artName" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PCProductionCard.countDocuments({ stage: "Tracking", isActive: true })
  ]);

  // 2) build per-project item->department map (to fill missing department)
  // collect unique projectIds from cards
  const projIds = Array.from(new Set((cards || []).map(c => String(c.projectId?._id || c.projectId)).filter(Boolean)));

  // helper to build map per project
  async function buildItemDeptMapForProjects(projectIds) {
    const mapByProject = {};
    if (!projectIds.length) return mapByProject;

    // fetch cost rows for all projects in one go
    const [upperRows, componentRows, materialRows, packagingRows, miscRows] = await Promise.all([
      UpperCostRow.find({ projectId: { $in: projectIds } }).select("_id projectId department").lean().catch(() => []),
      ComponentCostRow.find({ projectId: { $in: projectIds } }).select("_id projectId department").lean().catch(() => []),
      MaterialCostRow.find({ projectId: { $in: projectIds } }).select("_id projectId department").lean().catch(() => []),
      PackagingCostRow.find({ projectId: { $in: projectIds } }).select("_id projectId department").lean().catch(() => []),
      MiscCostRow.find({ projectId: { $in: projectIds } }).select("_id projectId department").lean().catch(() => []),
    ]);

    const addRows = (rows) => {
      for (const r of rows || []) {
        const pid = String(r.projectId || "");
        mapByProject[pid] = mapByProject[pid] || {};
        if (r._id) mapByProject[pid][String(r._id)] = r.department || null;
      }
    };

    addRows(upperRows); addRows(componentRows); addRows(materialRows); addRows(packagingRows); addRows(miscRows);
    return mapByProject;
  }

  const itemDeptMapByProject = await buildItemDeptMapForProjects(projIds);

  // 3) helper to ensure department on a row using project's map
  const ensureDept = (row, projectId) => {
    if (!row) return row;
    if (row.department) return row;
    if (row.itemId && itemDeptMapByProject[String(projectId)] && itemDeptMapByProject[String(projectId)][String(row.itemId)]) {
      return { ...row, department: itemDeptMapByProject[String(projectId)][String(row.itemId)] };
    }
    return { ...row, department: row.department ?? "unknown" };
  };

  // 4) iterate cards, pick rows that match requested department and group by project
  const projects = {}; // projectId -> { project, cards: [], aggregated: { materials: {}, components: {} } }
  const overallAgg = { materials: {}, components: {} };

  const pushAgg = (aggMap, key, row) => {
    if (!aggMap[key]) {
      aggMap[key] = {
        itemId: row.itemId || null,
        name: row.name || "Unknown",
        specification: row.specification || row.description || "",
        unit: row.unit || "unit",
        requirement: Number(row.requirement || 0),
        available: Number(row.available || 0),
        issued: Number(row.issued || 0),
        balance: Number(row.balance || 0),
        occurrences: 1,
        department: row.department || department
      };
    } else {
      aggMap[key].requirement += Number(row.requirement || 0);
      aggMap[key].available += Number(row.available || 0);
      aggMap[key].issued += Number(row.issued || 0);
      aggMap[key].balance += Number(row.balance || 0);
      aggMap[key].occurrences += 1;
    }
  };

  for (const c of (cards || [])) {
    const projId = String(c.projectId?._id || c.projectId);
    const projectObj = c.projectId || null;
    projects[projId] = projects[projId] || { project: projectObj, cards: [], aggregated: { materials: {}, components: {} } };

    // normalize rows and attach dept where possible
    const up = (Array.isArray(c.upper) ? c.upper : []).map(r => ensureDept(r, projId));
    const mats = (Array.isArray(c.materials) ? c.materials : []).map(r => ensureDept(r, projId));
    const comps = (Array.isArray(c.components) ? c.components : []).map(r => ensureDept(r, projId));
    const packs = (Array.isArray(c.packaging) ? c.packaging : []).map(r => ensureDept(r, projId));
    const misc = (Array.isArray(c.misc) ? c.misc : []).map(r => ensureDept(r, projId));

    // legacy combined groups
    const matCombined = [...up, ...mats];
    const compCombined = [...comps, ...packs, ...misc];

    // filter for requested department and aggregate
    const cardMaterialsForDept = matCombined.filter(r => (r.department || "unknown") === department);
    const cardComponentsForDept = compCombined.filter(r => (r.department || "unknown") === department);

    // skip if neither materials nor components for this department
    if (cardMaterialsForDept.length === 0 && cardComponentsForDept.length === 0) {
      // still include card in project cards? typically no — skip it
      continue;
    }

    // add card-level object (only rows for this department)
    projects[projId].cards.push({
      _id: c._id,
      cardNumber: c.cardNumber,
      productName: c.productName,
      cardQuantity: c.cardQuantity,
      materials: cardMaterialsForDept,
      components: cardComponentsForDept,
      materialRequestStatus: c.materialRequestStatus
    });

    // update project aggregated and overall aggregated
    for (const r of cardMaterialsForDept) {
      const key = r.itemId ? String(r.itemId) : `__noid__:${r.name || ""}`;
      pushAgg(projects[projId].aggregated.materials, key, r);
      pushAgg(overallAgg.materials, key, r);
    }
    for (const r of cardComponentsForDept) {
      const key = r.itemId ? String(r.itemId) : `__noid__:${r.name || ""}`;
      pushAgg(projects[projId].aggregated.components, key, r);
      pushAgg(overallAgg.components, key, r);
    }
  }

  // convert per-project maps to sorted arrays
  const mapToSortedList = (map) => Object.values(map || {}).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const projectsOut = {};
  for (const pid of Object.keys(projects)) {
    projectsOut[pid] = {
      project: projects[pid].project,
      cards: projects[pid].cards,
      aggregated: {
        materials: mapToSortedList(projects[pid].aggregated.materials),
        components: mapToSortedList(projects[pid].aggregated.components)
      }
    };
  }

  return {
    department,
    page, limit,
    totalCardsScanned: totalCards,
    projects: projectsOut,
    aggregatedOverall: {
      materials: mapToSortedList(overallAgg.materials),
      components: mapToSortedList(overallAgg.components)
    }
  };
}


// Add this near the other exported functions in services/pc_productionCard.service.js

export async function getTrackingByDepartmentAcrossProjectsFlattened(department, opts = { page: 1, limit: 200 }) {
  if (!department) throw new Error("department required");

  const page = Math.max(Number(opts.page || 1), 1);
  const limit = Math.min(Math.max(Number(opts.limit || 200), 1), 2000);
  const skip = (page - 1) * limit;

  // 1) fetch tracking cards across all projects (paged)
  const [cards, totalCards] = await Promise.all([
    PCProductionCard.find({ stage: "Tracking", isActive: true })
      .select("cardNumber productName cardQuantity projectId upper materials components packaging misc materialRequestStatus")
      .populate({ path: "projectId", select: "autoCode productName artName" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PCProductionCard.countDocuments({ stage: "Tracking", isActive: true })
  ]);

  // 2) Build itemId -> department map per project (to fill missing departments)
  const projIds = Array.from(new Set((cards || []).map(c => String(c.projectId?._id || c.projectId)).filter(Boolean)));

  async function buildItemDeptMapForProjects(projectIds) {
    const mapByProject = {};
    if (!projectIds.length) return mapByProject;

    // fetch cost rows for these projects
    const [upperRows, componentRows, materialRows, packagingRows, miscRows] = await Promise.all([
      UpperCostRow.find({ projectId: { $in: projectIds } }).select("_id projectId department").lean().catch(() => []),
      ComponentCostRow.find({ projectId: { $in: projectIds } }).select("_id projectId department").lean().catch(() => []),
      MaterialCostRow.find({ projectId: { $in: projectIds } }).select("_id projectId department").lean().catch(() => []),
      PackagingCostRow.find({ projectId: { $in: projectIds } }).select("_id projectId department").lean().catch(() => []),
      MiscCostRow.find({ projectId: { $in: projectIds } }).select("_id projectId department").lean().catch(() => []),
    ]);

    const addRows = (rows) => {
      for (const r of rows || []) {
        const pid = String(r.projectId || "");
        mapByProject[pid] = mapByProject[pid] || {};
        if (r._id) mapByProject[pid][String(r._id)] = r.department || null;
      }
    };

    addRows(upperRows); addRows(componentRows); addRows(materialRows); addRows(packagingRows); addRows(miscRows);
    return mapByProject;
  }

  const itemDeptMapByProject = await buildItemDeptMapForProjects(projIds);

  // helper: ensure department on a row using project's map
  const ensureDept = (row, projectId) => {
    if (!row) return row;
    if (row.department) return row;
    if (row.itemId && itemDeptMapByProject[String(projectId)] && itemDeptMapByProject[String(projectId)][String(row.itemId)]) {
      return { ...row, department: itemDeptMapByProject[String(projectId)][String(row.itemId)] };
    }
    return { ...row, department: row.department ?? "unknown" };
  };

  // aggregator for overall aggregated lists
  const overallAggregated = { materials: {}, components: {} };
  const pushAgg = (map, key, row) => {
    if (!map[key]) {
      map[key] = {
        itemId: row.itemId || null,
        name: row.name || "Unknown",
        specification: row.specification || row.description || "",
        unit: row.unit || "unit",
        requirement: Number(row.requirement || 0),
        available: Number(row.available || 0),
        issued: Number(row.issued || 0),
        balance: Number(row.balance || 0),
        occurrences: 1,
        department: row.department || department
      };
    } else {
      map[key].requirement += Number(row.requirement || 0);
      map[key].available += Number(row.available || 0);
      map[key].issued += Number(row.issued || 0);
      map[key].balance += Number(row.balance || 0);
      map[key].occurrences += 1;
    }
  };

  // build flattened items array
  const items = [];

  for (const c of (cards || [])) {
    const projId = String(c.projectId?._id || c.projectId || "");
    const projectObj = c.projectId || null;

    // normalize the five arrays and ensure departments
    const up = (Array.isArray(c.upper) ? c.upper : []).map(r => ensureDept(r, projId));
    const mats = (Array.isArray(c.materials) ? c.materials : []).map(r => ensureDept(r, projId));
    const comps = (Array.isArray(c.components) ? c.components : []).map(r => ensureDept(r, projId));
    const packs = (Array.isArray(c.packaging) ? c.packaging : []).map(r => ensureDept(r, projId));
    const misc = (Array.isArray(c.misc) ? c.misc : []).map(r => ensureDept(r, projId));

    // legacy combined groups
    const matCombined = [...up, ...mats];
    const compCombined = [...comps, ...packs, ...misc];

    // filter rows for the requested department
    const materialsForDept = matCombined.filter(r => (r.department || "unknown") === department);
    const componentsForDept = compCombined.filter(r => (r.department || "unknown") === department);

    // If nothing for this card in this department -> skip
    if (materialsForDept.length === 0 && componentsForDept.length === 0) continue;

    // push flattened item
    items.push({
      projectId: projId,
      project: projectObj,
      cardId: c._id,
      cardNumber: c.cardNumber,
      productName: c.productName,
      cardQuantity: c.cardQuantity,
      materialRequestStatus: c.materialRequestStatus,
      materials: materialsForDept,
      components: componentsForDept
    });

    // update overall aggregated maps
    for (const r of materialsForDept) {
      const key = r.itemId ? String(r.itemId) : `__noid__:${r.name || ""}`;
      pushAgg(overallAggregated.materials, key, r);
    }
    for (const r of componentsForDept) {
      const key = r.itemId ? String(r.itemId) : `__noid__:${r.name || ""}`;
      pushAgg(overallAggregated.components, key, r);
    }
  }

  // convert overall maps to sorted arrays
  const mapToSortedList = (map) => Object.values(map || {}).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  return {
    department,
    page, limit,
    totalCardsScanned: totalCards,
    count: items.length,
    items,
    aggregatedOverall: {
      materials: mapToSortedList(overallAggregated.materials),
      components: mapToSortedList(overallAggregated.components)
    }
  };
}

