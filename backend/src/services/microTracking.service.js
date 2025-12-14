import MicroTracking from "../models/MicroTracking.model.js";
import { PCProductionCard } from "../models/pc_productionCard.model.js";

/* ----------------------------------------------------
   1) CREATE rows for a Production Card
---------------------------------------------------- */
export async function createMicroTrackingForCard(cardId) {
  // check if tracking already exists
  const existing = await MicroTracking.findOne({ cardId }).lean();

  if (existing) {
    // Return all rows for this card
    return await MicroTracking.find({ cardId }).lean();
  }

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
    .populate({
      path: "cardId",
      select: "cardNumber productName cardQuantity stage assignedPlant"
    })
    .sort({ department: 1, name: 1 })
    .lean();
}


/* ----------------------------------------------------
   3) UPDATE full row
---------------------------------------------------- */
export async function updateMicroTracking(id, payload, updatedBy = "system") {
  const row = await MicroTracking.findById(id);
  if (!row) throw new Error("Row not found");

  const updates = {};
  const historyEntry = {
    date: new Date(),
    updatedBy,
    changes: []
  };

  // --------------------------
  // 1️⃣ Update progressDone
  // --------------------------
  if (payload.progressDone !== undefined) {
    historyEntry.changes.push({
      field: "progressDone",
      from: row.progressDone,
      to: Number(payload.progressDone)
    });
    updates.progressDone = Number(payload.progressDone);
  }

  // --------------------------
  // 2️⃣ Update progressToday
  // --------------------------
  if (payload.progressToday !== undefined) {
    historyEntry.changes.push({
      field: "progressToday",
      from: row.progressToday,
      to: Number(payload.progressToday)
    });
    updates.progressToday = Number(payload.progressToday);
  }

  // --------------------------
  // 3️⃣ Update Department
  // --------------------------
  const VALID_DEPTS = [
    "cutting", "printing", "upper",
    "upper_rej", "assembly", "packing",
    "rfd", "unknown"
  ];

  if (payload.department && VALID_DEPTS.includes(payload.department)) {
    historyEntry.changes.push({
      field: "department",
      from: row.department,
      to: payload.department
    });
    updates.department = payload.department;
  }

  updates.updatedAt = new Date();

  // --------------------------
  // 4️⃣ Save update + push history
//   --------------------------
  const updated = await MicroTracking.findByIdAndUpdate(
    id,
    {
      $set: updates,
      $push: { history: historyEntry }
    },
    { new: true }
  )
    .populate({
      path: "cardId",
      select: "cardNumber productName cardQuantity stage assignedPlant"
    })
    .lean();

  return updated;
}

/* ----------------------------------------------------
   4) GET rows inside 1 department
---------------------------------------------------- */
export async function getRowsByDepartment(projectId, department) {
  return await MicroTracking.find({ projectId, department })
    .populate({
      path: "cardId",
      select: "cardNumber productName cardQuantity stage assignedPlant"
    })
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
  )
    .populate({
      path: "cardId",
      select: "cardNumber productName cardQuantity stage assignedPlant"
    })
    .lean();
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


import { Project } from "../models/Project.model.js";
import { PoDetails } from "../models/PoDetails.model.js";

export async function getTrackingDashboard(month, year) {
  const m = Number(month);
  const y = Number(year);

  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59);

  // STEP 1 → MicroTracking वाले unique projects
  const activeProjectIds = await MicroTracking.distinct("projectId");

  if (activeProjectIds.length === 0) return [];

  // STEP 2 → FULL PROJECT DETAILS + BRAND + CATEGORY + COUNTRY + ASSIGN PERSON
  const projects = await Project.find({ _id: { $in: activeProjectIds } })
    .populate("company", "name")
    .populate("brand", "name")
    .populate("category", "name")
    .populate("type", "name")
    .populate("country", "name")
    .populate("assignPerson", "name email mobile")
    .lean();

  const departments = [
    "cutting", "printing", "upper",
    "upper_rej", "assembly", "packing", "rfd"
  ];

  const response = [];

  for (const p of projects) {

    // STEP 3 → Get PO Details for this project
    const po = await PoDetails.findOne({ project: p._id }).lean();

    // STEP 4 → fetch all cards
    const cards = await PCProductionCard.find({ projectId: p._id })
      .populate("assignedPlant", "name")
      .populate("materialRequests")
      .lean();

    // STEP 5 → fetch microtracking rows
    const microRows = await MicroTracking.find({
      projectId: p._id
    }).lean();

    // STEP 6 → Department summary initialize
    const resultDept = {};
    departments.forEach(dept => {
      resultDept[dept] = {
        daily: {},
        weekly: { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0 },
        monthTotal: 0
      };
    });

    // STEP 7 → Calculate daily, weekly, monthly using FULL HISTORY
    for (const row of microRows) {
      const dept = row.department;
      if (!departments.includes(dept)) continue;

      for (const h of row.history || []) {
        if (!h.addedToday) continue;

        const dateObj = new Date(h.date);
        if (dateObj < start || dateObj > end) continue;

        const day = dateObj.getDate();
        const added = Number(h.addedToday || 0);

        const week =
          day <= 7 ? "W1" :
          day <= 14 ? "W2" :
          day <= 21 ? "W3" :
          day <= 28 ? "W4" : "W5";

        // Daily
        resultDept[dept].daily[day] =
          (resultDept[dept].daily[day] || 0) + added;

        // Weekly
        resultDept[dept].weekly[week] += added;

        // Month total
        resultDept[dept].monthTotal += added;
      }
    }

    // FINAL PROJECT SUMMARY RECORD
    response.push({
      projectId: p._id,
      autoCode: p.autoCode,
      artName: p.artName,
      size: p.size,
      color: p.color,
      gender: p.gender,
      status: p.status,

      company: p.company,
      brand: p.brand,
      category: p.category,
      type: p.type,
      country: p.country,
      assignPerson: p.assignPerson,

      poDetails: po || {},

      cards,
      departments: resultDept
    });
  }

  return response;
}
