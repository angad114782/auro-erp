import * as service from "../services/pc_productionCard.service.js";
import * as trackingService from "../services/microTracking.service.js";

export async function createMR(req, res) {
  try {
    const { cardId } = req.params;
    if (!cardId) return res.status(400).json({ error: "cardId required in URL" });

    const payload = req.body || {};
    const userName = req.user?.name || "Production Manager";

    const formattedPayload = {
      upper: payload.upper || [],
      materials: payload.materials || [],
      components: payload.components || [],
      packaging: payload.packaging || [],
      misc: payload.misc || [],
      status: payload.status,
      notes: payload.notes,
    };

    const { mr, card } = await trackingService.syncMicroTrackingIssuedFromMR(
    String(mr?.productionCardId || card?._id || cardId),
    req.user?.name || "system"
  );

    // ✅ sync issued (safe)
    try {
      await trackingService.syncMicroTrackingIssuedFromCard(
        String(mr?.productionCardId || card?._id || cardId),
        req.user?.name || "system"
      );
    } catch (e) {
      console.warn("MicroTracking issued sync skipped:", e.message);
    }

    return res.status(201).json({ success: true, mr, card });
  } catch (err) {
    console.error("createMR error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

export async function updateMR(req, res) {
  try {
    const { mrId } = req.params;
    if (!mrId) return res.status(400).json({ error: "mrId required in URL" });

    const updates = req.body || {};

    const formattedUpdates = {
      upper: updates.upper || [],
      materials: updates.materials || [],
      components: updates.components || [],
      packaging: updates.packaging || [],
      misc: updates.misc || [],
      status: updates.status,
      notes: updates.notes,
    };

    const { mr, card } = await service.updateMaterialRequest(
      mrId,
      formattedUpdates,
      { syncCard: true }
    );

    // ✅ safest cardId extraction
    try {
      const cid = String(mr?.productionCardId || card?._id || "");
      if (cid) {
        await trackingService.syncMicroTrackingIssuedFromMR(
    cid,
    req.user?.name || "system"
  );
      }
    } catch (e) {
      console.warn("MicroTracking issued sync skipped:", e.message);
    }

    return res.json({ success: true, mr, card });
  } catch (err) {
    console.error("updateMR error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/* ------------------------------------------------------
   LIST MATERIAL REQUESTS
------------------------------------------------------- */
export async function listMRs(req, res) {
  try {
    const { status, projectId, search, page = 1, limit = 50 } = req.query;

    const { items, total } = await service.listMaterialRequests(
      { status, projectId, search },
      { page: Number(page), limit: Number(limit) }
    );

    return res.json({ success: true, total, items });
  } catch (err) {
    console.error("listMRs error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}



/* ------------------------------------------------------
   SOFT DELETE MR
------------------------------------------------------- */
export async function softDeleteMR(req, res) {
  try {
    const mrId = req.params.mrId;
    if (!mrId) return res.status(400).json({ error: "mrId required in URL" });

    const { mr, card } = await service.softDeleteMaterialRequest(mrId, {
      removeFromCard: true,
    });

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
    if (!mrId) return res.status(400).json({ error: "mrId required" });

    const mr = await service.getMaterialRequestById(mrId);

    return res.json({ success: true, data: mr });
  } catch (err) {
    console.error("getMR error", err);

    if (err.message?.includes("not found"))
      return res.status(404).json({ error: "Not found" });

    return res.status(500).json({ error: err.message || "Server error" });
  }
}
