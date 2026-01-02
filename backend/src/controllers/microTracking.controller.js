import * as service from "../services/microTracking.service.js";



/* ---------------- Get Micro Tracking by project ---------------- */
/* ---------------- Get Micro Tracking by project ---------------- */
export async function getMicroTracking(req, res) {
  try {
    const { projectId } = req.params;
    const { department, month, year } = req.query;

    const result = await service.getMicroTrackingByProject(
      projectId,
      department,
      Number(month),
      Number(year)
    );

    return res.json({
      success: true,
      filters: {
        department: department || "all",
        month: month || "all",
        year: year || "all"
      },
      ...result
    });
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
import mongoose from "mongoose";

export async function getDepartmentRows(req, res) {
  try {
    const { projectId, cardId, department } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(cardId)
    ) {
      return res.status(400).json({ error: "Invalid IDs" });
    }

    const rows = await service.getRowsByDepartment(
      projectId,
      cardId,
      department
    );

    return res.json({
      success: true,
      data: rows
    });

  } catch (err) {
    console.error("getDepartmentRows error:", err);
    return res.status(500).json({ error: err.message });
  }
}

/* ---------------- Update only progressToday ---------------- */
export async function updateProgressToday(req, res) {
  try {
    const { rowId, progressToday } = req.body; // ✅ id from body
    const updatedBy = req.user?.name || "system";

    if (!rowId || progressToday === undefined) {
      return res.status(400).json({
        error: "rowId and progressToday are required"
      });
    }

    const updated = await service.updateProgressTodayService(
      rowId,
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



export async function transferToNextDepartment(req, res) {
  try {
    const { projectId, cardId, fromDepartment, toDepartment, quantity } = req.body;

    if (!projectId || !cardId || !fromDepartment || !toDepartment || !quantity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await service.transferToNextDepartmentService(
      projectId,
      cardId,
      fromDepartment,
      toDepartment,
      Number(quantity),
      req.user?.name || "system"
    );

    return res.json({ success: true, ...result });

  } catch (err) {
    console.error("transferToNextDepartment error:", err);
    return res.status(500).json({ error: err.message });
  }
}




export async function transferTodayWork(req, res) {
  try {
    const { rowId, fromDepartment, toDepartment } = req.body;

    if (!rowId || !fromDepartment || !toDepartment) {
      return res.status(400).json({
        error: "rowId, fromDepartment, toDepartment are required"
      });
    }

    const result = await service.transferTodayWorkByRowService(
      rowId,
      fromDepartment,
      toDepartment,
      req.user?.name || "system"
    );

    return res.json({ success: true, ...result });

  } catch (err) {
    console.error("transferTodayWork error:", err);
    return res.status(500).json({ error: err.message });
  }
}


export async function bulkTodayProcess(req, res) {
  try {
    const { actions } = req.body;
    const updatedBy = req.user?.name || "system";

    if (!Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({ error: "actions array required" });
    }

    const result = await service.bulkTodayProcessService(actions, updatedBy);

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("bulkTodayProcess error:", err);
    return res.status(500).json({ error: err.message });
  }
}




export async function getTrackingHistory(req, res) {
  try {
    const { projectId } = req.params;
    const { stage, cardId } = req.query; // stage optional, cardId optional

    const data = await service.getTrackingHistoryService(projectId, stage, cardId);

    return res.json({ success: true, data });
  } catch (err) {
    console.error("getTrackingHistory error:", err);
    return res.status(500).json({ error: err.message });
  }
}


import { getDeptCardSummaryService } from "../services/microTracking.service.js";

export async function getDeptCardSummaryController(req, res) {
  try {
    const { projectId, cardId, department } = req.query;

    if (!projectId || !cardId || !department) {
      return res.status(400).json({
        success: false,
        error: "projectId, cardId, department are required",
      });
    }

    const updatedBy = req.user?.name || "system";

    const summary = await getDeptCardSummaryService(
      projectId,
      cardId,
      department,
      updatedBy
    );

    return res.json({ success: true, summary });
  } catch (err) {
    console.error("getDeptCardSummaryController:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to get summary",
    });
  }
}
