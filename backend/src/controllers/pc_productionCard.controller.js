import * as service from "../services/pc_productionCard.service.js";

export async function createSkeleton(req, res) {
  try {
    const projectId = req.params.projectId;
    if (!projectId) return res.status(400).json({ error: "projectId required in URL" });
    const createdBy = req.user?.name || "Production Manager";
    const productionCard = await service.createProductionCardSkeleton(projectId, createdBy, true);
    return res.status(201).json({ success: true, productionCard });
  } catch (err) {
    console.error("createSkeleton error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

export async function updateCard(req, res) {
  try {
    const cardId = req.params.cardId;
    const updates = req.body || {};
    const computeMaterialsIfMissing = !!req.query.computeMaterials;
    const updated = await service.updateProductionCard(cardId, updates, { computeMaterialsIfMissing });
    return res.json({ success: true, productionCard: updated });
  } catch (err) {
    console.error("updateCard error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

export async function getCard(req, res) {
  try {
    const cardId = req.params.cardId;
    const card = await service.getCardById(cardId);
    return res.json({ success: true, productionCard: card });
  } catch (err) {
    console.error("getCard error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

export async function previewNextCardNumber(req, res) {
  try {
    const projectId = req.params.projectId;
    if (!projectId) return res.status(400).json({ error: "projectId required" });
    const next = await service.generateNextCardNumber(projectId);
    return res.json({ success: true, next });
  } catch (err) {
    console.error("previewNextCardNumber error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
