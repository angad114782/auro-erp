import * as service from "../services/pc_productionCard.service.js";

export async function createMR(req, res) {
  try {
    const cardId = req.params.cardId;
    const payload = req.body || {};
    const userName = req.user?.name || "Production Manager";
    const { mr, card } = await service.createMaterialRequestForCard(cardId, payload, userName);
    return res.status(201).json({ success: true, mr, card });
  } catch (err) {
    console.error("createMR error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

export async function listMRs(req, res) {
  try {
    const { status, projectId, page = 1, limit = 50 } = req.query;
    const { items, total } = await service.listMaterialRequests({ status, projectId }, { page: Number(page), limit: Number(limit) });
    return res.json({ success: true, total, items });
  } catch (err) {
    console.error("listMRs error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

export async function updateMR(req, res) {
  try {
    const mrId = req.params.mrId;
    const updates = req.body || {};
    const { mr, card } = await service.updateMaterialRequest(mrId, updates, { syncCard: true });
    return res.json({ success: true, mr, card });
  } catch (err) {
    console.error("updateMR error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

export async function softDeleteMR(req, res) {
  try {
    const mrId = req.params.mrId;
    const { mr, card } = await service.softDeleteMaterialRequest(mrId, { removeFromCard: true });
    return res.json({ success: true, mr, card });
  } catch (err) {
    console.error("softDeleteMR error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}


export async function getMR(req, res) {
  try {
    const mrId = req.params.mrId;
    if (!mrId) return res.status(400).json({ error: "mrId required" });
    const mr = await service.getMaterialRequestById(mrId);
    return res.json({ success: true, data: mr });
  } catch (err) {
    console.error("getMR error", err);
    if (err.message && err.message.includes("not found")) return res.status(404).json({ error: "Not found" });
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
