import * as service from "../services/microTracking.service.js";

/* ---------------- Create Micro Tracking for card ---------------- */
export async function createMicroTracking(req, res) {
  try {
    const { cardId } = req.params;
    const rows = await service.createMicroTrackingForCard(cardId);

    return res.status(201).json({
      success: true,
      message: "Micro tracking rows created",
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
    if (!projectId)
      return res.status(400).json({ error: "projectId is required" });

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

    if (!projectId || !department)
      return res.status(400).json({ error: "projectId & department required" });

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
