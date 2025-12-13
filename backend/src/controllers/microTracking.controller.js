import * as service from "../services/microTracking.service.js";

/* ---------------- Create Micro Tracking for card ---------------- */
export async function createMicroTracking(req, res) {
  try {
    let cardId = req.params.cardId?.replace(/[^a-fA-F0-9]/g, "");
    if (!cardId || cardId.length !== 24) {
      return res.status(400).json({ error: "Invalid cardId" });
    }

    const rows = await service.createMicroTrackingForCard(cardId);

    return res.status(200).json({
      success: true,
      alreadyExists: Array.isArray(rows) && rows.length > 0,
      message: rows.length > 0 ? "Micro tracking already exists" : "Created",
      items: rows,
    });

  } catch (err) {
    console.error("createMicroTracking error:", err);
    return res.status(500).json({ error: err.message });
  }
}


/* ---------------- Get Micro Tracking by project ---------------- */
export async function getMicroTracking(req, res) {
  try {
    const { projectId } = req.params;
    const items = await service.getMicroTrackingByProject(projectId);

    return res.json({ success: true, items });
  } catch (err) {
    console.error("getMicroTracking error:", err);
    return res.status(500).json({ error: err.message });
  }
}

/* ---------------- Update progress for row ---------------- */
export async function updateMicroTracking(req, res) {
  try {
    const { id } = req.params;
    const updated = await service.updateMicroTracking(id, req.body);

    return res.json({ success: true, item: updated });
  } catch (err) {
    console.error("updateMicroTracking error:", err);
    return res.status(500).json({ error: err.message });
  }
}

/* ---------------- Department Wise Summary ---------------- */
export async function getDepartmentWiseTracking(req, res) {
  try {
    const { projectId } = req.params;
    const data = await service.getDepartmentWiseTrackingService(projectId);

    return res.json({ success: true, data });

  } catch (err) {
    console.error("getDepartmentWiseTracking error", err);
    return res.status(500).json({ error: err.message });
  }
}

/* ---------------- Get all rows inside a department ---------------- */
export async function getDepartmentRows(req, res) {
  try {
    const { projectId, department } = req.params;

    const rows = await service.getRowsByDepartment(projectId, department);

    return res.json({
      success: true,
      items: rows
    });

  } catch (err) {
    console.error("getDepartmentRows error:", err);
    return res.status(500).json({ error: err.message });
  }
}

/* ---------------- Update only progressToday ---------------- */
export async function updateProgressToday(req, res) {
  try {
    const { id } = req.params;
    const { progressToday } = req.body;
    const updatedBy = req.user?.name || "system";

    const updated = await service.updateProgressTodayService(
      id,
      progressToday,
      updatedBy
    );

    return res.json({
      success: true,
      item: updated
    });

  } catch (err) {
    console.error("updateProgressToday error:", err);
    return res.status(500).json({ error: err.message });
  }
}
