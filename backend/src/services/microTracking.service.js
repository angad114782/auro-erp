import MicroTracking from "../models/MicroTracking.model.js";
import { PCProductionCard } from "../models/pc_productionCard.model.js";

/* ----------------------------------------------------
   1) CREATE rows for a Production Card
---------------------------------------------------- */
export async function createMicroTrackingForCard(cardId) {
  const card = await PCProductionCard.findById(cardId).lean();
  if (!card) throw new Error("Production Card not found");

  const rows = [];

  const pushRows = (array, category) => {
    array.forEach((item) => {
      rows.push({
        projectId: card.projectId,
        cardId: card._id,
        cardNumber: card.cardNumber,
        cardQuantity: card.cardQuantity,

        category,
        itemId: item.itemId,
        name: item.name,
        specification: item.specification,
        unit: item.unit,
        requirement: item.requirement,
        issued: item.issued,
        balance: item.balance,

        department: item.department || "unknown",
        progressDone: 0,
        progressToday: 0,
        history: []
      });
    });
  };

  pushRows(card.upper || [], "upper");
  pushRows(card.components || [], "components");

  if (rows.length === 0) return [];

  return await MicroTracking.insertMany(rows);
}

/* ----------------------------------------------------
   2) GET all rows for a Project
---------------------------------------------------- */
export async function getMicroTrackingByProject(projectId) {
  return await MicroTracking.find({ projectId })
    .sort({ department: 1, name: 1 })
    .lean();
}

/* ----------------------------------------------------
   3) UPDATE full row
---------------------------------------------------- */
export async function updateMicroTracking(id, payload) {
  return await MicroTracking.findByIdAndUpdate(
    id,
    {
      $set: {
        progressDone: payload.progressDone ?? 0,
        progressToday: payload.progressToday ?? 0,
        updatedAt: new Date()
      }
    },
    { new: true }
  );
}

/* ----------------------------------------------------
   4) GET rows inside 1 department
---------------------------------------------------- */
export async function getRowsByDepartment(projectId, department) {
  return await MicroTracking.find({ projectId, department })
    .sort({ name: 1 })
    .lean();
}

/* ----------------------------------------------------
   5) UPDATE only progressToday + push history
---------------------------------------------------- */
export async function updateProgressTodayService(id, progressToday, updatedBy = "system") {
  const todayProgress = Number(progressToday || 0);

  const row = await MicroTracking.findById(id);
  if (!row) throw new Error("Row not found");

  const previousDone = Number(row.progressDone || 0);
  const newDone = previousDone + todayProgress;

  const historyEntry = {
    date: new Date(),
    addedToday: todayProgress,
    previousDone,
    newDone,
    updatedBy
  };

  return await MicroTracking.findByIdAndUpdate(
    id,
    {
      $set: {
        progressToday: todayProgress,
        progressDone: newDone,
        updatedAt: new Date()
      },
      $push: { history: historyEntry }
    },
    { new: true }
  ).lean();
}

/* ----------------------------------------------------
   6) DEPARTMENT WISE SUMMARY
---------------------------------------------------- */
export async function getDepartmentWiseTrackingService(projectId) {
  const rows = await MicroTracking.find({ projectId }).lean();

  const DEPARTMENTS = [
    "cutting",
    "printing",
    "upper",
    "upper_rej",
    "assembly",
    "packing",
    "rfd",
  ];

  return DEPARTMENTS.map((dept) => {
    const items = rows.filter((r) => r.department === dept);

    let planned = 0;
    let completed = 0;

    for (const it of items) {
      planned += Number(it.requirement || 0);
      completed += Number(it.progressDone || 0);
    }

    const remaining = planned - completed;
    const rate = planned === 0 ? 0 : Math.round((completed / planned) * 100);

    return {
      department: dept,
      planned,
      completed,
      remaining,
      rate
    };
  });
}
