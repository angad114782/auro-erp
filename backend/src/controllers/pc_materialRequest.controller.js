import { PCProductionCard } from "../models/pc_productionCard.model.js";
import mongoose from "mongoose";

/**
 * Helper to map embedded MRs into standalone shape:
 * { _id, productionCardId, projectId, requestedBy, status, materials, components, notes, createdAt, updatedAt }
 */
function mapEmbeddedMR(card, mr) {
  return {
    _id: mr._id,
    productionCardId: card._id,
    cardNumber: card.cardNumber,
    projectId: card.projectId,
    productName: card.productName,
    requestedBy: mr.requestedBy,
    status: mr.status,
    materials: mr.materials,
    components: mr.components,
    notes: mr.notes,
    createdAt: mr.createdAt,
    updatedAt: mr.updatedAt,
  };
}


export async function getMaterialRequests(req, res) {
  try {
    const { projectId } = req.params;
    const cards = await PCProductionCard.find({ projectId })
      .select("cardNumber projectId materialRequests")
      .sort({ createdAt: -1 })
      .lean();

    const items = [];
    for (const c of cards) {
      const mrs = c.materialRequests || [];
      for (const mr of mrs) {
        items.push(mapEmbeddedMR(c, mr));
      }
    }

    return res.json({ success: true, data: items });
  } catch (err) {
    console.error("getMaterialRequests error", err);
    return res.status(500).json({ error: err.message });
  }
}


export async function getMaterialRequestById(req, res) {
  try {
    const { projectId, requestId } = req.params;

    // validate requestId length to choose strategy quickly
    const isObjectIdLike = typeof requestId === "string" && requestId.match(/^[0-9a-fA-F]{24}$/);

    if (!isObjectIdLike) {
      // if not an ObjectId-like string, definitely won't match embedded _id — return 400
      return res.status(400).json({ error: "Invalid requestId format" });
    }

    // 1) Try to find an embedded MR with this id
    let card = await PCProductionCard.findOne({ projectId, "materialRequests._id": requestId })
      .select("cardNumber projectId productName materialRequests")
      .lean();

    if (card) {
      const mr = (card.materialRequests || []).find(m => String(m._id) === String(requestId));
      if (mr) return res.json({ success: true, data: mapEmbeddedMR(card, mr) });
      // rare: card found but mr missing — continue to next check
    }

    // 2) Maybe the requestId is actually the production card id — fetch that card and return all MRs
    card = await PCProductionCard.findOne({ _id: requestId, projectId })
      .select("cardNumber projectId productName materialRequests")
      .lean();

    if (card) {
      const mrs = (card.materialRequests || []).map(mr => mapEmbeddedMR(card, mr));
      return res.json({ success: true, data: mrs });
    }

    // not found
    return res.status(404).json({ error: "Not found" });
  } catch (err) {
    console.error("getMaterialRequestById error", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function updateMaterialRequest(req, res) {
  try {
    const { projectId, requestId } = req.params;
    const body = req.body || {};

    // build update fields allowed
    const allowed = {};
    if (body.status) allowed["materialRequests.$.status"] = body.status;
    if (body.requestedBy) allowed["materialRequests.$.requestedBy"] = body.requestedBy;
    if (body.notes !== undefined) allowed["materialRequests.$.notes"] = body.notes;
    if (body.materials) allowed["materialRequests.$.materials"] = body.materials;
    if (body.components) allowed["materialRequests.$.components"] = body.components;
    allowed["materialRequests.$.updatedAt"] = new Date();

    const updated = await PCProductionCard.findOneAndUpdate(
      { projectId, "materialRequests._id": requestId },
      { $set: allowed },
      { new: true }
    ).select("cardNumber projectId materialRequests");

    if (!updated) return res.status(404).json({ error: "Not found" });

    const mr = (updated.materialRequests || []).find(m => String(m._id) === String(requestId));
    return res.json({ success: true, data: mapEmbeddedMR(updated, mr) });
  } catch (err) {
    console.error("updateMaterialRequest error", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteMaterialRequest(req, res) {
  try {
    const { projectId, requestId } = req.params;

    const updated = await PCProductionCard.findOneAndUpdate(
      { projectId, "materialRequests._id": requestId },
      { $pull: { materialRequests: { _id: requestId } } },
      { new: true }
    ).select("cardNumber projectId materialRequests");

    if (!updated) return res.status(404).json({ error: "Not found" });

    return res.json({ success: true, data: { message: "Deleted", productionCardId: updated._id } });
  } catch (err) {
    console.error("deleteMaterialRequest error", err);
    return res.status(500).json({ error: err.message });
  }
}

/* Admin helper: list all material requests with card and project populated */
export async function fetchmateriallist(req, res) {
  try {
    // get all cards with materialRequests
    const cards = await PCProductionCard.find()
      .select("cardNumber projectId productName materialRequests")
      .populate({ path: "projectId", select: "autoCode brand client" })
      .sort({ createdAt: -1 })
      .lean();

    const items = [];
    for (const c of cards) {
      const mrs = c.materialRequests || [];
      for (const mr of mrs) {
        const mapped = mapEmbeddedMR(c, mr);
        mapped.project = c.projectId;
        mapped.cardNumber = c.cardNumber;
        items.push(mapped);
      }
    }

    return res.json({ success: true, data: items });
  } catch (err) {
    console.error("fetchmateriallist error", err);
    return res.status(500).json({ error: err.message });
  }
}

