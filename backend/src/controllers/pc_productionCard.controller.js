import * as service from "../services/pc_productionCard.service.js";

export async function createSkeleton(req, res) {
  try {
    const projectId = req.params.projectId;
    if (!projectId)
      return res.status(400).json({ error: "projectId required in URL" });
    const createdBy = req.user?.name || "Production Manager";
    const productionCard = await service.createProductionCardSkeleton(
      projectId,
      createdBy,
      true
    );
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
    const updated = await service.updateProductionCard(cardId, updates, {
      computeMaterialsIfMissing,
    });
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
    if (!projectId)
      return res.status(400).json({ error: "projectId required" });
    const next = await service.generateNextCardNumber(projectId);
    return res.json({ success: true, next });
  } catch (err) {
    console.error("previewNextCardNumber error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

export async function getProductionCards(req, res) {
  try {
    const { projectId } = req.params;
    if (!projectId)
      return res.status(400).json({ error: "projectId required in URL" });

    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const status = req.query.status;
    const search = req.query.search;
    const sort = req.query.sort;

    const result = await service.fetchProductionCardsForProject(projectId, {
      page,
      limit,
      status,
      search,
      sort,
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("getProductionCards error", err);
    if (err.message && err.message.includes("Invalid projectId")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
