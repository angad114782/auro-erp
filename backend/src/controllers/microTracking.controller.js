import * as service from "../services/microTracking.service.js";
function normalizeDept(d) {
  d = String(d || "").trim().toLowerCase();
  if (d === "upperrej" || d === "upper_rej") return "upper_rej";
  return d;
}
export async function createMicroTrackingCard(req, res) {
  try {
    const { cardId } = req.params;
    if (!cardId) return res.status(400).json({ error: "cardId required" });

    const updatedBy = req.user?.name || "system"; // ✅ add this

    const doc = await service.syncMicroTrackingIssuedFromMR(cardId, updatedBy)
    return res.json({ success: true, item: doc });
  } catch (err) {
    console.error("createMicroTrackingCard error:", err);
    return res.status(500).json({ error: err.message });
  }
}
export async function trackingDashboardDepartmentController(req, res) {
  try {
    const dept = String(req.query.dept || "").trim().toLowerCase();
    const { month, year } = req.query;

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

/* ---------------- Get all tracking cards of a project ---------------- */
export async function getProjectTrackingCards(req, res) {
  try {
    const { projectId } = req.params;

    if (!projectId)
      return res.status(400).json({ error: "projectId required" });

    const items = await service.getTrackingCardsByProject(projectId);

    return res.json({
      success: true,
      items,
    });
  } catch (err) {
    console.error("getProjectTrackingCards error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function getMicroTrackingCard(req, res) {
  try {
    const { cardId } = req.params;
    const dept = String(req.query.dept || "").trim().toLowerCase(); // ✅ add

    const item = await service.getMicroTrackingByCard(cardId, dept);

    return res.json({ success: true, item });
  } catch (e) {
    return res.status(404).json({ success: false, error: e.message });
  }
}


// export async function addWorkAndTransferController(req, res) {
//   try {
//     const { cardId } = req.params;

//     const fromDept = req.body?.fromDept || req.body?.dept; // ✅ accept both
//     const toDept = req.body?.toDept;

//     const itemId = req.body?.itemId;
//     const qtyWork = req.body?.qtyWork;
//     const qtyTransfer = req.body?.qtyTransfer;

//     if (!cardId)
//       return res.status(400).json({ success: false, error: "cardId required" });
//     if (!fromDept)
//       return res
//         .status(400)
//         .json({ success: false, error: "fromDept (or dept) required" });
//     if (!itemId)
//       return res.status(400).json({ success: false, error: "itemId required" });

//     const updatedBy = req.user?.name || "system";

//     const item = await service.addWorkAndTransfer({
//       cardId,
//       fromDept,
//       itemId,
//       qtyWork,
//       qtyTransfer,
//       toDept,
//       updatedBy,
//     });

//     return res.json({ success: true, item });
//   } catch (err) {
//     console.error("addWorkAndTransferController error:", err);
//     return res.status(400).json({ success: false, error: err.message });
//   }
// }

export async function addWorkAndTransferController(req, res) {
  try {
    const { cardId } = req.params;
    const fromDept = req.body?.fromDept || req.body?.dept;
    const toDept = req.body?.toDept;

    const itemId = req.body?.itemId;
    const qtyWork = req.body?.qtyWork;
    const qtyTransfer = req.body?.qtyTransfer;

    if (!cardId) return res.status(400).json({ success: false, error: "cardId required" });
    if (!fromDept) return res.status(400).json({ success: false, error: "fromDept (or dept) required" });

    const d = String(fromDept).toLowerCase();
    const isAgg = ["assembly", "packing", "rfd"].includes(d);

    // ✅ ITEM depts only require itemId
    if (!isAgg && !itemId)
      return res.status(400).json({ success: false, error: "itemId required for item stages" });

    const updatedBy = req.user?.name || "system";

    const item = await service.addWorkAndTransfer({
      cardId,
      fromDept,
      itemId: isAgg ? null : itemId,
      qtyWork,
      qtyTransfer,
      toDept,
      updatedBy,
    });

    return res.json({ success: true, item });
  } catch (err) {
    console.error("addWorkAndTransferController error:", err);
    return res.status(400).json({ success: false, error: err.message });
  }
}


// controller.js (or microTracking.controller.js)

export async function addWorkOnlyRFDController(req, res) {
  try {
    const { cardId } = req.params;
    const qtyWork = req.body?.qtyWork;

    if (!cardId)
      return res.status(400).json({ success: false, error: "cardId required" });

    const updatedBy = req.user?.name || "system";

    const item = await service.addWorkOnlyRFD({
      cardId,
      qtyWork,
      updatedBy,
    });

    return res.json({ success: true, item });
  } catch (err) {
    console.error("addWorkOnlyRFDController error:", err);
    return res.status(400).json({ success: false, error: err.message });
  }
}


export async function getTrackingHistory(req, res) {
  try {
    const { projectId } = req.params;
    const { stage, cardId } = req.query; // stage optional, cardId optional

    const data = await service.getTrackingHistoryService(
      projectId,
      stage,
      cardId
    );

    return res.json({ success: true, data });
  } catch (err) {
    console.error("getTrackingHistory error:", err);
    return res.status(500).json({ error: err.message });
  }
}