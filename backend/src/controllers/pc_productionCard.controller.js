// controllers/pc_productionCard.controller.js

import * as service from "../services/pc_productionCard.service.js";

/* ------------------------- Create Skeleton ------------------------- */
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

/* ------------------------- Update Card ----------------------------- */
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

    if (err.message?.includes("Invalid cardId"))
      return res.status(400).json({ error: err.message });

    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/* ------------------------- Get Card ----------------------------- */
export async function getCard(req, res) {
  try {
    const cardId = req.params.cardId;
    if (!cardId) return res.status(400).json({ error: "cardId required in URL" });

    const card = await service.getCardById(cardId);
    return res.json({ success: true, productionCard: card });
  } catch (err) {
    console.error("getCard error", err);

    if (err.message?.includes("Invalid cardId"))
      return res.status(400).json({ error: err.message });

    if (err.message?.includes("Card not found"))
      return res.status(404).json({ error: err.message });

    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/* ------------------- Preview Next Card Number --------------------- */
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

/* --------------------- Fetch Cards for Project --------------------- */
export async function getProductionCards(req, res) {
  try {
    const { projectId } = req.params;
    if (!projectId)
      return res.status(400).json({ error: "projectId required in URL" });

    const page = Number(req.query.page) || undefined;
    const limit = Number(req.query.limit) || undefined;

    const result = await service.fetchProductionCardsForProject(projectId, {
      page,
      limit,
      status: req.query.status,
      search: req.query.search,
      sort: req.query.sort,
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("getProductionCards error", err);

    if (err.message?.includes("Invalid projectId"))
      return res.status(400).json({ error: err.message });

    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/* --------------------------- Soft Delete --------------------------- */
export async function deleteCard(req, res) {
  try {
    const { cardId } = req.params;
    const deletedBy = req.user?.name || "Production Manager";

    const deleted = await service.softDeleteProductionCard(cardId, deletedBy);

    return res.json({
      success: true,
      message: "Production card deleted successfully",
      productionCard: deleted,
    });
  } catch (err) {
    console.error("deleteCard error", err);

    if (err.message?.includes("Invalid cardId"))
      return res.status(400).json({ error: err.message });

    return res.status(500).json({
      error: err.message || "Server error",
    });
  }
}

/* --------------------------- Change Stage -------------------------- */
export async function changeStageController(req, res) {
  try {
    const { projectId, cardId } = req.params;
    const { stage } = req.body;

    const updatedBy = req.user?.name || req.body.updatedBy || "System";

    if (!stage) return res.status(400).json({ error: "stage is required in body" });

    const updatedCard = await service.updateCardStage(
      cardId,
      projectId,
      stage,
      updatedBy
    );

    return res.json({ success: true, productionCard: updatedCard });
  } catch (err) {
    console.error("changeStageController error", err);

    if (err.message?.includes("Invalid cardId"))
      return res.status(400).json({ error: err.message });

    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/* ---------------- Tracking Overview (Project Level) ---------------- */
export async function getProjectTrackingOverviewController(req, res) {
  try {
    const { projectId } = req.params;
    if (!projectId)
      return res.status(400).json({ error: "projectId required in URL" });

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 25);
    const sort = req.query.sort || "createdAt:desc";

    const result = await service.getProjectTrackingOverview(projectId, {
      page,
      limit,
      sort,
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("getProjectTrackingOverview error", err);

    if (err.message?.includes("Invalid projectId"))
      return res.status(400).json({ error: err.message });

    if (err.message?.includes("Project not found"))
      return res.status(404).json({ error: err.message });

    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/* --------------- Tracking Materials (Department Wise + all 5 groups) --------------- */
export async function getTrackingMaterialsController(req, res) {
  try {
    const { projectId } = req.params;
    if (!projectId)
      return res.status(400).json({ error: "projectId required in URL" });

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 200);

    const department = req.query.department
      ? String(req.query.department).trim()
      : null;

    // UPDATED to new function name
    const data = await service.getTrackingMaterialsForProject(projectId, {
      page,
      limit,
      department,
    });

    return res.json({ success: true, data });
  } catch (err) {
    console.error("getTrackingMaterialsController error", err);

    if (err.message?.includes("Invalid projectId"))
      return res.status(400).json({ error: err.message });

    return res.status(500).json({ error: err.message || "Server error" });
  }
}
