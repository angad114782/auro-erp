// controllers/pc_materialRequest.controller.js

import * as service from "../services/pc_productionCard.service.js";

/* ------------------------------------------------------
   CREATE MATERIAL REQUEST
------------------------------------------------------- */
export async function createMR(req, res) {
  try {
    const cardId = req.params.cardId;
    if (!cardId)
      return res.status(400).json({ error: "cardId required in URL" });

    const payload = req.body || {};
    const userName = req.user?.name || "Production Manager";

    // Payload अब 5 category स्वीकार करेगा
    const formattedPayload = {
      upper: payload.upper || [],
      materials: payload.materials || [],
      components: payload.components || [],
      packaging: payload.packaging || [],
      misc: payload.misc || [],
      status: payload.status,
      notes: payload.notes,
    };

    const { mr, card } = await service.createMaterialRequestForCard(
      cardId,
      formattedPayload,
      userName
    );

    return res.status(201).json({ success: true, mr, card });
  } catch (err) {
    console.error("createMR error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/* ------------------------------------------------------
   LIST MATERIAL REQUESTS
------------------------------------------------------- */
export async function listMRs(req, res) {
  try {
    const { status, projectId, page = 1, limit = 50 } = req.query;

    const { items, total } = await service.listMaterialRequests(
      { status, projectId },
      { page: Number(page), limit: Number(limit) }
    );

    return res.json({ success: true, total, items });
  } catch (err) {
    console.error("listMRs error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/* ------------------------------------------------------
   UPDATE MATERIAL REQUEST + SYNC CARD SNAPSHOT
------------------------------------------------------- */
export async function updateMR(req, res) {
  try {
    const mrId = req.params.mrId;
    if (!mrId)
      return res.status(400).json({ error: "mrId required in URL" });

    const updates = req.body || {};

    // Ensure update payload contains all 5 sections
    const formattedUpdates = {
      upper: updates.upper,
      materials: updates.materials,
      components: updates.components,
      packaging: updates.packaging,
      misc: updates.misc,
      status: updates.status,
      notes: updates.notes,
    };

    const { mr, card } = await service.updateMaterialRequest(mrId, formattedUpdates, {
      syncCard: true,
    });

    return res.json({ success: true, mr, card });
  } catch (err) {
    console.error("updateMR error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/* ------------------------------------------------------
   SOFT DELETE MR
------------------------------------------------------- */
export async function softDeleteMR(req, res) {
  try {
    const mrId = req.params.mrId;
    if (!mrId)
      return res.status(400).json({ error: "mrId required in URL" });

    const { mr, card } = await service.softDeleteMaterialRequest(
      mrId,
      { removeFromCard: true }
    );

    return res.json({ success: true, mr, card });
  } catch (err) {
    console.error("softDeleteMR error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/* ------------------------------------------------------
   GET MATERIAL REQUEST DETAILS (FULL STRUCTURE)
------------------------------------------------------- */
export async function getMR(req, res) {
  try {
    const mrId = req.params.mrId;
    if (!mrId)
      return res.status(400).json({ error: "mrId required" });

    const mr = await service.getMaterialRequestById(mrId);

    return res.json({ success: true, data: mr });
  } catch (err) {
    console.error("getMR error", err);

    if (err.message?.includes("not found"))
      return res.status(404).json({ error: "Not found" });

    return res.status(500).json({ error: err.message || "Server error" });
  }
}
