// backend/src/services/pc_productionCard.service.js
import mongoose from "mongoose";
import { PCProjectCounter } from "../models/pc_projectCounter.model.js";
import { PCProductionCard } from "../models/pc_productionCard.model.js";
import { PCMaterialRequest } from "../models/pc_materialRequest.model.js";

// <<< new: import the cost row models from the wrapper file you just created >>>
import {
  UpperCostRow,
  ComponentCostRow,
  MaterialCostRow,
  PackagingCostRow,
  MiscCostRow,
} from "../models/projectCost.model.js";

/* incrementCounter / generateNextCardNumber (same as before) */
async function incrementCounter(projectId, session = null) {
  const query = { projectId: mongoose.Types.ObjectId(projectId) };
  const update = { $inc: { seq: 1 } };
  const opts = { new: true, upsert: true, setDefaultsOnInsert: true };
  if (session) opts.session = session;
  const updated = await PCProjectCounter.findOneAndUpdate(query, update, opts);
  return updated.seq;
}

export async function generateNextCardNumber(projectId, session = null) {
  try {
    const seq = await incrementCounter(projectId, session);
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    return `PC-${ym}-${String(seq).padStart(4, "0")}`;
  } catch (err) {
    console.error("generateNextCardNumber error:", err);
    return `PC-FALLBACK-${Date.now()}`;
  }
}

/* helper to extract numeric from consumption strings */
function extractNumeric(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const m = String(value).match(/\d+\.?\d*/);
  return m ? parseFloat(m[0]) : 0;
}

/**
 * computeMaterialsFromProject:
 * - reads all cost-row collections for a project,
 * - multiplies consumption * allocationQty,
 * - returns { materials, components } arrays.
 */
export async function computeMaterialsFromProject(projectId, allocationQty, provided = { materials: [], components: [] }) {
  // use provided arrays if client passed them (trusting client)
  if (Array.isArray(provided.materials) && provided.materials.length > 0) {
    return { materials: provided.materials, components: provided.components || [] };
  }

  // fetch rows from all cost collections in parallel
  const [upperRows, componentRows, materialRows, packagingRows, miscRows] = await Promise.all([
    UpperCostRow.find({ projectId }).lean().catch(() => []),
    ComponentCostRow.find({ projectId }).lean().catch(() => []),
    MaterialCostRow.find({ projectId }).lean().catch(() => []),
    PackagingCostRow.find({ projectId }).lean().catch(() => []),
    MiscCostRow.find({ projectId }).lean().catch(() => []),
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
  upperRows.forEach(r => pushItem(r, materials));
  materialRows.forEach(r => pushItem(r, materials));

  // component, packaging, misc => components
  componentRows.forEach(r => pushItem(r, components));
  packagingRows.forEach(r => pushItem(r, components));
  miscRows.forEach(r => pushItem(r, components));

  return { materials, components };
}

/* createProductionCardWithRequest: transaction-capable or fallback */
export async function createProductionCardWithRequest(payload, userName = "Production Manager", useTransaction = false) {
  const { projectId, cardQuantity = 0 } = payload;

  if (useTransaction) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const cardNumber = await generateNextCardNumber(projectId, session);
      const computed = await computeMaterialsFromProject(projectId, cardQuantity, { materials: payload.materials || [], components: payload.components || [] });

      const [productionCard] = await PCProductionCard.create([{
        cardNumber,
        projectId,
        productName: payload.productName || "",
        cardQuantity,
        startDate: payload.startDate ? new Date(payload.startDate) : undefined,
        assignedPlant: payload.assignedPlant,
        description: payload.description,
        specialInstructions: payload.specialInstructions,
        status: payload.status || "Draft",
        materialRequestStatus: "Pending to Store",
        materials: computed.materials,
        components: computed.components,
        createdBy: userName,
      }], { session });

      const [materialRequest] = await PCMaterialRequest.create([{
        productionCardId: productionCard._id,
        projectId,
        requestedBy: userName,
        status: "Pending to Store",
        materials: computed.materials,
        components: computed.components,
      }], { session });

      await session.commitTransaction();
      session.endSession();
      return { productionCard, materialRequest };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("createProductionCardWithRequest transaction failed", err);
      throw err;
    }
  }

  // fallback non-transactional
  const cardNumber = await generateNextCardNumber(projectId);
  const computed = await computeMaterialsFromProject(projectId, cardQuantity, { materials: payload.materials || [], components: payload.components || [] });

  const productionCard = await PCProductionCard.create({
    cardNumber,
    projectId,
    productName: payload.productName || "",
    cardQuantity,
    startDate: payload.startDate ? new Date(payload.startDate) : undefined,
    assignedPlant: payload.assignedPlant,
    description: payload.description,
    specialInstructions: payload.specialInstructions,
    status: payload.status || "Draft",
    materialRequestStatus: "Pending to Store",
    materials: computed.materials,
    components: computed.components,
    createdBy: userName,
  });

  const materialRequest = await PCMaterialRequest.create({
    productionCardId: productionCard._id,
    projectId,
    requestedBy: userName,
    status: "Pending to Store",
    materials: computed.materials,
    components: computed.components,
  });

  return { productionCard, materialRequest };
}
