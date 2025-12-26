import MicroTracking from "../models/MicroTracking.model.js";
import { PCProductionCard } from "../models/pc_productionCard.model.js";

function getTodayDone(row) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  let sum = 0;
  for (const h of row.history || []) {
    if (!h.addedToday) continue;
    const dt = new Date(h.date);
    if (dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d) {
      sum += Number(h.addedToday || 0);
    }
  }
  return sum;
}

function sameItem(a, b) {
  if (a.itemId != null && b.itemId != null) {
    return String(a.itemId) === String(b.itemId);
  }
  return (
    a.name === b.name &&
    a.specification === b.specification &&
    a.unit === b.unit
  );
}

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
   GET Micro Tracking by project
   (department + month + year)
---------------------------------------------------- */
export async function getMicroTrackingByProject(
  projectId,
  department,
  month,
  year
) {
  const filter = { projectId };

  // ✅ department filter
  if (department) {
    filter.department = department;
  }

  // ✅ month + year filter
  if (month && year) {
    const startDate = new Date(year, month - 1, 1); // month is 0-based
    const endDate = new Date(year, month, 1);

    filter.createdAt = {
      $gte: startDate,
      $lt: endDate,
    };
  }

  const rows = await MicroTracking.find(filter)
    .populate({
      path: "cardId",
      select: "cardNumber productName cardQuantity stage assignedPlant",
      populate: {
        path: "assignedPlant",
        select: "name code location", // jo bhi fields chahiye
      },
    })
    .sort({ cardNumber: 1, name: 1 })
    .lean();

  // ✅ unique card calculation
  const cardMap = new Map();

  rows.forEach((row) => {
    const cardId = row.cardId?._id?.toString();
    if (!cardId) return;

    if (!cardMap.has(cardId)) {
      cardMap.set(cardId, row.cardId.cardQuantity || 0);
    }
  });

  return {
    totalCards: cardMap.size,
    totalCardQuantity: [...cardMap.values()].reduce((a, b) => a + b, 0),
    items: rows,
  };
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
    changes: [],
  };

  // --------------------------
  // 1️⃣ Update progressDone
  // --------------------------
  if (payload.progressDone !== undefined) {
    historyEntry.changes.push({
      field: "progressDone",
      from: row.progressDone,
      to: Number(payload.progressDone),
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
      to: Number(payload.progressToday),
    });
    updates.progressToday = Number(payload.progressToday);
  }

  // --------------------------
  // 3️⃣ Update Department
  // --------------------------
  const VALID_DEPTS = [
    "cutting",
    "printing",
    "upper",
    "upper_rej",
    "assembly",
    "packing",
    "rfd",
    "unknown",
  ];

  if (payload.department && VALID_DEPTS.includes(payload.department)) {
    historyEntry.changes.push({
      field: "department",
      from: row.department,
      to: payload.department,
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
      $push: { history: historyEntry },
    },
    { new: true }
  )
    .populate({
      path: "cardId",
      select: "cardNumber productName cardQuantity stage assignedPlant",
    })
    .lean();

  return updated;
}
import mongoose from "mongoose";

/* ----------------------------------------------------
   4) GET rows inside 1 department
---------------------------------------------------- */

export async function getRowsByDepartment(projectId, cardId, department) {
  const rows = await MicroTracking.find({
    projectId: new mongoose.Types.ObjectId(projectId),
    cardId: new mongoose.Types.ObjectId(cardId),
    department,
  })
    .populate({
      path: "cardId",
      select: "cardNumber productName cardQuantity stage assignedPlant",
    })
    .sort({ name: 1 })
    .lean();

  // ✅ Attach today-based computed fields for UI
  return rows.map((r) => {
    const todayDone = getTodayDone(r);
    const todayTransferred = Number(r.transferredToday || 0);
    const todayTransferable = Math.max(0, todayDone - todayTransferred);

    return {
      ...r,
      todayDone,
      todayTransferred,
      todayTransferable,
    };
  });
}

/* ----------------------------------------------------
   5) UPDATE only progressToday + push history
---------------------------------------------------- */
export async function updateProgressTodayService(
  id,
  progressToday,
  updatedBy = "system"
) {
  const todayProgress = Number(progressToday || 0);
  if (todayProgress <= 0) {
    throw new Error("progressToday must be greater than 0");
  }

  const row = await MicroTracking.findById(id);
  if (!row) throw new Error("Row not found");

  const previousDone = Number(row.progressDone || 0);

  // ✅ 1) REQUIREMENT GUARD (never exceed requirement)
  const reqTotal = Number(row.requirement || 0);
  const reqRemaining = reqTotal - previousDone;

  if (reqRemaining <= 0) {
    throw new Error(
      `Requirement already completed. Allowed: 0 (requirement ${reqTotal}, done ${previousDone})`
    );
  }

  if (todayProgress - reqRemaining > 1e-9) {
    throw new Error(
      `Only ${reqRemaining} allowed. (requirement ${reqTotal}, done ${previousDone})`
    );
  }

  // ✅ 2) RECEIVED GUARD (only if received > 0)
  // If printing/upper direct start => received = 0 => allow
  const receivedQty = Number(row.received || 0);
  if (receivedQty > 0) {
    const allowedByReceived = receivedQty - previousDone;

    if (allowedByReceived <= 0) {
      throw new Error(
        "No quantity received from previous department. Transfer required."
      );
    }

    if (todayProgress - allowedByReceived > 1e-9) {
      throw new Error(
        `Only ${allowedByReceived} allowed as per received (received ${receivedQty}, done ${previousDone}).`
      );
    }
  }

  const newDone = previousDone + todayProgress;

  const historyEntry = {
    date: new Date(),
    addedToday: todayProgress,
    previousDone,
    newDone,
    updatedBy
  };

  // ✅ If we reached here => safe to save
  return await MicroTracking.findByIdAndUpdate(
    id,
    {
      $inc: { progressToday: todayProgress, progressDone: todayProgress },
      $set: { updatedAt: new Date() },
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
      rate,
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
    "cutting",
    "printing",
    "upper",
    "upper_rej",
    "assembly",
    "packing",
    "rfd",
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
      projectId: p._id,
    }).lean();

    // STEP 6 → Department summary initialize
    const resultDept = {};
    departments.forEach((dept) => {
      resultDept[dept] = {
        daily: {},
        weekly: { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0 },
        monthTotal: 0,
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
          day <= 7
            ? "W1"
            : day <= 14
            ? "W2"
            : day <= 21
            ? "W3"
            : day <= 28
            ? "W4"
            : "W5";

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
      departments: resultDept,
    });
  }

  return response;
}

export async function getTrackingDashboardByDepartment(dept, month, year) {
  const m = Number(month);
  const y = Number(year);

  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59);

  // STEP 1 → Projects having microtracking in this department
  const activeProjectIds = await MicroTracking.distinct("projectId", {
    department: dept,
  });

  if (!activeProjectIds.length) return [];

  const projects = await Project.find({ _id: { $in: activeProjectIds } })
    .populate("brand", "name")
    .populate("country", "name")
    .populate("assignPerson", "name email mobile")
    .lean();

  const response = [];

  for (const p of projects) {
    // STEP 2 → PO
    const po = await PoDetails.findOne({ project: p._id }).lean();

    // STEP 3 → Department-specific microtracking rows
    const microRows = await MicroTracking.find({
      projectId: p._id,
      department: dept,
    }).lean();

    // STEP 4 → Extract ONLY tracked cardIds
    const trackedCardIds = [
      ...new Set(microRows.map((r) => r.cardId).filter(Boolean)),
    ];

    // STEP 5 → Fetch ONLY tracked cards
    const cards = trackedCardIds.length
      ? await PCProductionCard.find({
          _id: { $in: trackedCardIds },
        })
          .populate("assignedPlant", "name")
          .lean()
      : [];

    // STEP 6 → Prepare summary
    const data = {
      daily: {},
      weekly: { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0 },
      monthTotal: 0,
    };

    for (const row of microRows) {
      for (const h of row.history || []) {
        if (!h.addedToday) continue;

        const d = new Date(h.date);
        if (d < start || d > end) continue;

        const day = d.getDate();
        const added = Number(h.addedToday || 0);

        const week =
          day <= 7
            ? "W1"
            : day <= 14
            ? "W2"
            : day <= 21
            ? "W3"
            : day <= 28
            ? "W4"
            : "W5";

        data.daily[day] = (data.daily[day] || 0) + added;
        data.weekly[week] += added;
        data.monthTotal += added;
      }
    }

    response.push({
      projectId: p._id,
      autoCode: p.autoCode,
      artName: p.artName,
      size: p.size,
      color: p.color,
      gender: p.gender,
      assignPerson: p.assignPerson,
      brand: p.brand,
      country: p.country,
      poDetails: po || {},
      cards, // ✅ ONLY STAGE-TRACKED CARDS
      department: dept,
      summary: data,
    });
  }

  return response;
}

export async function getMicroTrackingByProjectAndCard(projectId, cardId) {
  const project = await Project.findById(projectId)
    .populate("brand", "name")
    .populate("country", "name")
    .lean();

  if (!project) throw new Error("Project not found");

  const card = await PCProductionCard.findById(cardId).lean();

  if (!card) throw new Error("Card not found");

  // fetch rows for this card only
  const rows = await MicroTracking.find({ projectId, cardId })
    .populate({
      path: "cardId",
      select: "cardNumber productName cardQuantity assignedPlant stage",
    })
    .lean();

  const DEPARTMENTS = [
    "cutting",
    "printing",
    "upper",
    "upper_rej",
    "assembly",
    "packing",
    "rfd",
  ];

  const grouped = {};

  DEPARTMENTS.forEach((d) => (grouped[d] = []));

  rows.forEach((r) => {
    const d = r.department || "unknown";
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(r);
  });

  return {
    project,
    card,
    departments: grouped,
  };
}

/* ----------------------------------------------------
   GET ONLY TRACKING-ENABLED CARDS OF A PROJECT
---------------------------------------------------- */
export async function getTrackingCardsByProject(projectId) {
  // 1️⃣ Find cardIds which actually have tracking
  const trackedCardIds = await MicroTracking.distinct("cardId", {
    projectId,
  });

  if (trackedCardIds.length === 0) return [];

  // 2️⃣ Fetch only those cards
  const cards = await PCProductionCard.find({
    _id: { $in: trackedCardIds },
  })
    .select("cardNumber productName cardQuantity stage assignedPlant createdAt")
    .populate("assignedPlant", "name")
    .sort({ createdAt: -1 })
    .lean();

  return cards;
}

export async function transferToNextDepartmentService(
  projectId,
  cardId,
  fromDept,
  toDept,
  quantity,
  updatedBy
) {
  // 1️⃣ Get FROM department rows
  const fromRows = await MicroTracking.find({
    projectId,
    cardId,
    department: fromDept,
  });

  if (!fromRows.length) throw new Error("Source department rows not found");

  const totalDone = fromRows.reduce((s, r) => s + (r.progressDone || 0), 0);
  const totalTransferred = fromRows.reduce(
    (s, r) => s + (r.transferred || 0),
    0
  );

  const available = totalDone - totalTransferred;

  if (quantity > available) {
    throw new Error(`Only ${available} available to transfer`);
  }

  // 2️⃣ Distribute transfer proportionally
  let remaining = quantity;

  for (const row of fromRows) {
    if (remaining <= 0) break;

    const canGive = (row.progressDone || 0) - (row.transferred || 0);

    const give = Math.min(canGive, remaining);

    if (give > 0) {
      row.transferred += give;
      row.history.push({
        date: new Date(),
        updatedBy,
        changes: [
          {
            field: "transferred",
            from: row.transferred - give,
            to: row.transferred,
          },
        ],
      });
      await row.save();
      remaining -= give;
    }
  }

  // 3️⃣ Update TO department rows (received)
  const toRows = await MicroTracking.find({
    projectId,
    cardId,
    department: toDept,
  });

  if (!toRows.length) throw new Error("Target department rows not found");

  let receiveRemaining = quantity;

  for (const row of toRows) {
    if (receiveRemaining <= 0) break;

    const capacity = (row.requirement || 0) - (row.received || 0);
    const receive = Math.min(capacity, receiveRemaining);

    if (receive > 0) {
      row.received += receive;
      row.history.push({
        date: new Date(),
        updatedBy,
        changes: [
          { field: "received", from: row.received - receive, to: row.received },
        ],
      });
      await row.save();
      receiveRemaining -= receive;
    }
  }

  return {
    fromDepartment: fromDept,
    toDepartment: toDept,
    transferred: quantity,
  };
}


function round4(n) {
  return Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;
}

function normStr(v) {
  return String(v ?? "").trim().toLowerCase();
}

function normItemId(v) {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function itemQueryFor(fr, toDept) {
  const iid = normItemId(fr.itemId);
  if (iid) {
    return { projectId: fr.projectId, cardId: fr.cardId, department: toDept, itemId: iid };
  }
  // fallback match
  return {
    projectId: fr.projectId,
    cardId: fr.cardId,
    department: toDept,
    name: fr.name,
    specification: fr.specification,
    unit: fr.unit
  };
}

export async function transferTodayWorkByRowService(
  rowId,
  fromDept,
  toDept,
  updatedBy = "system"
) {
  if (!rowId || !fromDept || !toDept) {
    throw new Error("rowId, fromDepartment, toDepartment required");
  }
  if (fromDept === toDept) throw new Error("fromDepartment and toDepartment cannot be same");

  const fr = await MicroTracking.findById(rowId);
  if (!fr) throw new Error("Source row not found");

  // ✅ ensure row belongs to fromDept
  if (String(fr.department) !== String(fromDept)) {
    throw new Error(`Row department is ${fr.department}, not ${fromDept}`);
  }

  // ✅ today transferable from this row only
  const todayDone = round4(getTodayDone(fr));
  const alreadyTodayTransferred = round4(fr.transferredToday || 0);
  const transferableToday = round4(todayDone - alreadyTodayTransferred);

  if (transferableToday <= 0) {
    return {
      fromRowId: String(fr._id),
      fromDepartment: fromDept,
      toDepartment: toDept,
      transferredToday: 0,
      message: "No today quantity available to transfer for this row"
    };
  }

  // ✅ also ensure overall availability (progressDone - transferred)
  const overallAvailable = round4((fr.progressDone || 0) - (fr.transferred || 0));
  const give = round4(Math.min(transferableToday, overallAvailable));

  if (give <= 0) {
    return {
      fromRowId: String(fr._id),
      fromDepartment: fromDept,
      toDepartment: toDept,
      transferredToday: 0,
      message: "No overall quantity available to transfer"
    };
  }

  // ✅ FIND OR CREATE target row (UPSERT = no duplicate)
  const query = itemQueryFor(fr, toDept);

  const tr = await MicroTracking.findOneAndUpdate(
    query,
    {
      $setOnInsert: {
        projectId: fr.projectId,
        cardId: fr.cardId,
        cardNumber: fr.cardNumber,
        cardQuantity: fr.cardQuantity,
        category: fr.category,
        itemId: normItemId(fr.itemId),
        name: fr.name,
        specification: fr.specification,
        unit: fr.unit,

        requirement: 0,
        issued: 0,
        balance: 0,

        department: toDept,
        progressDone: 0,
        progressToday: 0,
        transferred: 0,
        received: 0,
        transferredToday: 0,
        history: []
      }
    },
    { new: true, upsert: true }
  );

  // ---------- FROM updates
  const frOldTransferred = round4(fr.transferred || 0);
  const frOldTransferredToday = round4(fr.transferredToday || 0);
  const frOldReq = round4(fr.requirement || 0);
  const frOldBal = round4(fr.balance || 0);

  fr.transferred = round4(frOldTransferred + give);
  fr.transferredToday = round4(frOldTransferredToday + give);
  fr.requirement = round4(Math.max(0, frOldReq - give));
  fr.balance = round4(Math.max(0, frOldBal - give));

  fr.history.push({
    date: new Date(),
    updatedBy,
    changes: [
      { field: "transferred", from: frOldTransferred, to: fr.transferred },
      { field: "transferredToday", from: frOldTransferredToday, to: fr.transferredToday },
      { field: "requirement", from: frOldReq, to: fr.requirement },
      { field: "balance", from: frOldBal, to: fr.balance },
      { field: "toDepartment", from: fromDept, to: toDept }
    ]
  });

  // ---------- TO updates
  const trOldReceived = round4(tr.received || 0);
  const trOldReq = round4(tr.requirement || 0);
  const trOldBal = round4(tr.balance || 0);

  tr.received = round4(trOldReceived + give);
  tr.requirement = round4(trOldReq + give);
  tr.balance = round4(trOldBal + give);

  tr.history.push({
    date: new Date(),
    updatedBy,
    changes: [
      { field: "received", from: trOldReceived, to: tr.received },
      { field: "requirement", from: trOldReq, to: tr.requirement },
      { field: "balance", from: trOldBal, to: tr.balance },
      { field: "fromDepartment", from: fromDept, to: toDept }
    ]
  });

  await fr.save();
  await tr.save();

  return {
    fromRowId: String(fr._id),
    toRowId: String(tr._id),
    fromDepartment: fromDept,
    toDepartment: toDept,
    transferredToday: give
  };
}


export async function bulkTodayProcessService(actions, updatedBy = "system") {
  const results = [];
  const errors = [];

  for (const a of actions) {
    try {
      const { rowId, progressToday, fromDepartment, toDepartment } = a;

      if (!rowId || progressToday === undefined || !fromDepartment || !toDepartment) {
        throw new Error("rowId, progressToday, fromDepartment, toDepartment required");
      }

      // 1) update today work
      const updatedRow = await updateProgressTodayService(rowId, progressToday, updatedBy);

      // 2) transfer today work (only what was done today)
      const transfer = await transferTodayWorkByRowService(
        rowId,
        fromDepartment,
        toDepartment,
        updatedBy
      );

      results.push({
        rowId,
        updatedRowId: updatedRow?._id,
        progressAdded: Number(progressToday),
        transfer
      });
    } catch (e) {
      errors.push({ rowId: a?.rowId, error: e.message });
    }
  }

  return { results, errors };
}
