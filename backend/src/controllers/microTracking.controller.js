import * as service from "../services/microTracking.service.js";



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


export async function trackingDashboardController(req, res) {
  try {
    const { month, year } = req.query;

    if (!month || !year)
      return res.status(400).json({ error: "month & year required" });

    const data = await service.getTrackingDashboard(month, year);

    return res.json({ success: true, data });

  } catch (err) {
    console.error("trackingDashboardController error", err);
    return res.status(500).json({ error: err.message });
  }
}


export async function trackingDashboardDepartmentController(req, res) {
  try {
    const { dept, month, year } = req.query;

    if (!dept) return res.status(400).json({ error: "dept is required" });
    if (!month || !year)
      return res.status(400).json({ error: "month & year required" });

    const data = await service.getTrackingDashboardByDepartment(dept, month, year);

    return res.json({ success: true, data });
  } catch (err) {
    console.error("trackingDashboardDepartment error:", err);
    return res.status(500).json({ error: err.message });
  }
}


export async function getProjectCardTracking(req, res) {
  try {
    const { projectId, cardId } = req.params;

    const data = await service.getMicroTrackingByProjectAndCard(
      projectId,
      cardId
    );

    return res.json({ success: true, ...data });

  } catch (err) {
    console.error("getProjectCardTracking error:", err);
    return res.status(500).json({ error: err.message });
  }
}


/* ---------------- Get all tracking cards of a project ---------------- */
export async function getProjectTrackingCards(req, res) {
  try {
    const { projectId } = req.params;

    if (!projectId)
      return res.status(400).json({ error: "projectId required" });

    const items = await service.getTrackingCardsByProject(projectId);

    return res.json({
      success: true,
      items
    });

  } catch (err) {
    console.error("getProjectTrackingCards error:", err);
    return res.status(500).json({ error: err.message });
  }
}
