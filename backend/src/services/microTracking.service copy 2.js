import MicroTrackingCard from "../models/MicroTracking.model.js";
import { PCProductionCard } from "../models/pc_productionCard.model.js";
import { Project } from "../models/Project.model.js";
import mongoose from "mongoose";
// ✅ TODO: Replace with your actual MR model path/name
import { PCMaterialRequest } from "../models/pc_materialRequest.model.js";

const DEPARTMENTS = [
  "cutting",
  "printing",
  "upper",
  "upper_rej",
  "assembly",
  "packing",
  "rfd",
];

const AGG_DEPTS = new Set(["assembly", "packing", "rfd"]);
const ITEM_DEPTS = new Set(["cutting", "printing", "upper", "upper_rej"]);


// =================== UNIT-CONVERSION HELPERS ===================

// ✅ Safe model getter
function getModelSafe(name) {
  try {
    return mongoose.models[name] || mongoose.model(name);
  } catch {
    return null;
  }
}

// 🔧 CHANGE THESE NAMES to your actual mongoose model names
const UpperCostRowModel = getModelSafe("UpperCostRow");         // uppercostrows
const ComponentCostRowModel = getModelSafe("ComponentCostRow"); // componentcostrows

async function getConsumptionPerPair(projectId, itemId) {
  const pid = String(projectId || "");
  const iid = String(itemId || "");
  if (!pid || !iid) return { consumption: 0, unit: "" };

  let row = null;

  if (UpperCostRowModel) {
    row =
      (await UpperCostRowModel.findOne({ projectId: pid, _id: iid })
        .select("consumption unit itemId")
        .lean()) || null;

    // If your schema uses itemId field:
    // row = row || await UpperCostRowModel.findOne({ projectId: pid, itemId: iid }).select("consumption unit").lean();
  }

  if (!row && ComponentCostRowModel) {
    row =
      (await ComponentCostRowModel.findOne({ projectId: pid, _id: iid })
        .select("consumption unit itemId")
        .lean()) || null;

    // If your schema uses itemId field:
    // row = row || await ComponentCostRowModel.findOne({ projectId: pid, itemId: iid }).select("consumption unit").lean();
  }

  return {
    consumption: Number(row?.consumption) || 0,
    unit: String(row?.unit || "").trim(),
  };
}

function calcIssuedPairsPossible(issuedMaterialQty, consumptionPerPair) {
  const issued = Number(issuedMaterialQty) || 0;
  const cons = Number(consumptionPerPair) || 0;
  if (issued <= 0 || cons <= 0) return 0;
  return Math.floor(issued / cons);
}


function aggregateDeptForCard(doc, dept) {
  const deptRows = (doc.rows || []).filter(
    (r) => r.isActive !== false && normDept(r.department) === dept
  );
  if (!deptRows.length) return null;

  const minOf = (field) => Math.min(...deptRows.map((r) => toNum(r[field])));

  // bottleneck by receivedQty
  const bottleneckItem = deptRows.reduce(
    (minR, r) => (toNum(r.receivedQty) < toNum(minR.receivedQty) ? r : minR),
    deptRows[0]
  );

  return {
    dept,
    receivedQty: minOf("receivedQty"),
    completedQty: minOf("completedQty"),
    transferredQty: minOf("transferredQty"),
    itemsCount: deptRows.length,
    bottleneckItem: {
      itemId: bottleneckItem.itemId,
      name: bottleneckItem.name,
      receivedQty: toNum(bottleneckItem.receivedQty),
    },
  };
}

function hasDeptActivityInMonth(doc, dept, start, end) {
  // ✅ if any history event in dept rows within month -> active
  const deptRows = (doc.rows || []).filter(
    (r) => r.isActive !== false && normDept(r.department) === dept
  );

  for (const r of deptRows) {
    for (const h of r.history || []) {
      const ts = new Date(h.ts || h.date || h.createdAt || 0);
      if (ts >= start && ts <= end) return true;
    }
  }

  // ✅ fallback: tracking created this month
  const createdAt = new Date(doc.createdAt || 0);
  if (createdAt >= start && createdAt <= end) return true;

  return false;
}

function normDeptOrNull(v) {
  const d = String(v || "")
    .trim()
    .toLowerCase();
  return DEPARTMENTS.includes(d) ? d : null;
}

function normDept(v) {
  return normDeptOrNull(v) || "cutting";
}

function pickFirstDeptFromCard(card) {
  const pick = (arr) =>
    (arr || []).map((x) => normDeptOrNull(x?.department)).find(Boolean);

  return (
    pick(card.upper) ||
    pick(card.components) ||
    pick(card.materials) ||
    pick(card.packaging) ||
    pick(card.misc) ||
    "cutting"
  );
}

function buildItemKey(it) {
  const iid = it?.itemId != null ? String(it.itemId).trim() : "";
  if (iid) return `iid:${iid}`;

  const n = String(it?.name || "")
    .trim()
    .toLowerCase();
  const s = String(it?.specification || "")
    .trim()
    .toLowerCase();
  const u = String(it?.unit || "")
    .trim()
    .toLowerCase();
  return `n:${n}|s:${s}|u:${u}`;
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * ✅ pushRows with DEDUPE by itemKey
 * - If same itemKey already exists -> merge snapshot issuedQty (max)
 * - RECEIVE history only for firstDept rows (tracking start)
 */
function pushRows(
  rows,
  arr = [],
  category,
  firstDept,
  cardQty,
  updatedBy,
  seen
) {
  for (const it of arr || []) {
    const name = String(it?.name || "").trim();
    if (!name) continue;

    const dept = normDept(it?.department);
    const issuedMaterial = toNum(it?.issued || 0); // ✅ material unit


    const key = buildItemKey(it);

    // ✅ dedupe: same item already added -> merge (no new row)
    if (seen.has(key)) {
      const existing = rows.find((r) => r.itemKey === key);
      if (existing) {
        existing.issuedMaterialQty = Math.max(
  toNum(existing.issuedMaterialQty),
  issuedMaterial
);
existing.issuedPairsPossible = calcIssuedPairsPossible(
  existing.issuedMaterialQty,
  toNum(existing.consumptionPerPair || 0)
);

        if (!existing.category) existing.category = category;
      }
      continue;
    }

    seen.add(key);

    const isFirst = dept === firstDept;
    const receivedInit = isFirst ? toNum(cardQty || 0) : 0;

    const row = {
      category,
      itemId: it?.itemId ?? null,
      itemKey: key,

      name,
      specification: String(it?.specification || "").trim(),
      unit: String(it?.unit || "unit").trim(),

      department: dept,

      // ✅ tracking numbers
      receivedQty: receivedInit,
      issuedMaterialQty: issuedMaterial, // ✅ material qty snapshot
consumptionPerPair: 0,             // ✅ will be filled later
issuedPairsPossible: 0,            // ✅ derived

      completedQty: 0,
      transferredQty: 0,

      history: [],
      isActive: true,
    };

    // ✅ TRACKING START LOG: ONLY RECEIVE
    if (isFirst && receivedInit > 0) {
      row.history.push({
        ts: new Date(),
        type: "RECEIVE",
        qty: receivedInit,
        fromDept: "",
        toDept: firstDept,
        meta: { category, reason: "TRACKING_START" },
        updatedBy: updatedBy || "system",
      });
    }

    rows.push(row);
  }
}

/**
 * ✅ Build issued map from MR (source of truth when card isn't updated)
 * - Uses SAME itemKey logic so row matching never fails
 * - Uses MAX snapshot per key
 */
/**
 * ✅ Collect issued snapshot from MR by itemId string
 */
function buildIssuedByItemIdFromMR(mr) {
  const map = new Map();

  const add = (arr = []) => {
    for (const it of arr || []) {
      const id = it?.itemId != null ? String(it.itemId).trim() : "";
      if (!id) continue;

      const issued = toNum(it?.issued || 0);
      const prev = toNum(map.get(id));
      // snapshot -> take max
      map.set(id, Math.max(prev, issued));
    }
  };

  add(mr.upper);
  add(mr.materials);
  add(mr.components);
  add(mr.packaging);
  add(mr.misc);

  return map;
}

/**
 * ✅ Sync issuedQty from latest MR into MicroTracking rows
 */
export async function syncMicroTrackingIssuedFromMR(cardId, updatedBy = "system") {
  const card = await PCProductionCard.findById(cardId).lean();
  if (!card) throw new Error("Production Card not found");

  const doc = await MicroTrackingCard.findOne({
    projectId: card.projectId,
    cardId: card._id,
    isActive: true,
  });

  if (!doc) return null;

  // ✅ IMPORTANT: MR uses productionCardId + isDeleted
  const mr = await PCMaterialRequest.findOne({
    projectId: card.projectId,
    productionCardId: card._id,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .lean();

  console.log("✅ [MR_SYNC] MR FOUND:", {
    cardId: String(cardId),
    projectId: String(card.projectId),
    mrId: mr?._id,
    status: mr?.status,
    isDeleted: mr?.isDeleted,
    upperCount: mr?.upper?.length,
    materialsCount: mr?.materials?.length,
    componentsCount: mr?.components?.length,
  });

  if (!mr) return doc.toObject();

  const issuedMap = buildIssuedByItemIdFromMR(mr);
  let changed = false;

   for (const row of doc.rows || []) {
    const rid = row?.itemId != null ? String(row.itemId).trim() : "";
    if (!rid) continue;

    const newIssuedMaterial = toNum(issuedMap.get(rid) || 0);

    // ✅ backward: old docs me issuedQty ho sakta hai
    const oldIssuedMaterial = toNum(
      row.issuedMaterialQty != null ? row.issuedMaterialQty : row.issuedQty
    );

    // ✅ ensure consumptionPerPair
    let cons = toNum(row.consumptionPerPair || 0);
    if (cons <= 0) {
      const c = await getConsumptionPerPair(card.projectId, rid);
      cons = toNum(c?.consumption);

      console.log("🧪 [MR_SYNC] CONSUMPTION_LOOKUP:", {
        itemId: rid,
        itemName: row.name,
        found: cons > 0,
        consumptionPerPair: cons,
        costUnit: c?.unit || null,
      });

      if (cons > 0) {
        row.consumptionPerPair = cons;
        changed = true;
      }
    }

    const pairsPossible =
      cons > 0 ? calcIssuedPairsPossible(newIssuedMaterial, cons) : 0;

    console.log("🧾 [MR_SYNC_DEBUG]", {
      cardId: String(cardId),
      projectId: String(card.projectId),
      dept: row.department,
      itemId: rid,
      itemName: row.name,
      materialUnit: row.unit,
      consumptionPerPair: cons,
      issuedMaterialQty_MR: newIssuedMaterial,
      issuedPairsPossible: cons > 0 ? pairsPossible : "NO_CONSUMPTION_FOUND",
      oldIssuedMaterialQty: oldIssuedMaterial,
    });

    if (newIssuedMaterial !== oldIssuedMaterial) {
      const delta = newIssuedMaterial - oldIssuedMaterial;

      // ✅ new field
      row.issuedMaterialQty = newIssuedMaterial;
      // ✅ keep old field also (optional but helps legacy UI)
      row.issuedQty = newIssuedMaterial;

      row.issuedPairsPossible = pairsPossible;
      changed = true;

      if (delta > 0) {
        row.history = row.history || [];
        row.history.push({
          ts: new Date(),
          type: "ISSUE",
          qty: delta,
          fromDept: "store",
          toDept: row.department,
          meta: {
            reason: "MR_SYNC",
            source: "pcmaterialrequests",
            unit: row.unit,
            consumptionPerPair: cons,
            issuedPairsPossible: pairsPossible,
          },
          updatedBy,
        });
      }
    } else {
      // ✅ keep derived in sync
      if (toNum(row.issuedPairsPossible || 0) !== toNum(pairsPossible || 0)) {
        row.issuedPairsPossible = pairsPossible;
        changed = true;
      }
    }
  }


  if (changed) {
    doc.markModified("rows");
    await doc.save();
    console.log("✅ [MR_SYNC] MicroTracking updated & saved:", {
      cardId: String(cardId),
      rows: doc.rows?.length,
    });
  } else {
    console.log("ℹ️ [MR_SYNC] No changes detected:", { cardId: String(cardId) });
  }

  return doc.toObject();
}


export async function createMicroTrackingForCard(cardId, updatedBy = "system") {
  const card = await PCProductionCard.findById(cardId).lean();
  if (!card) throw new Error("Production Card not found");

  const qty = toNum(card.cardQuantity || 0);
  const firstDept = pickFirstDeptFromCard(card);

  // ✅ stop duplicates (one doc per card)
  const exists = await MicroTrackingCard.findOne({
    projectId: card.projectId,
    cardId: card._id,
    isActive: true,
  }).lean();

  if (exists) return exists;

  const rows = [];
  const seen = new Set();

  pushRows(rows, card.upper, "upper", firstDept, qty, updatedBy, seen);
  pushRows(rows, card.materials, "materials", firstDept, qty, updatedBy, seen);
  pushRows(
    rows,
    card.components,
    "components",
    firstDept,
    qty,
    updatedBy,
    seen
  );
  pushRows(rows, card.packaging, "packaging", firstDept, qty, updatedBy, seen);
  pushRows(rows, card.misc, "misc", firstDept, qty, updatedBy, seen);

  const doc = await MicroTrackingCard.create({
    projectId: card.projectId,
    cardId: card._id,
    cardNumber: card.cardNumber,
    cardQuantity: qty,
    firstDept,
    rows,
    isActive: true,
  });

  return doc.toObject();
}

export async function getTrackingDashboardByDepartment(dept, month, year) {
  const dRaw = String(dept || "")
    .trim()
    .toLowerCase();
  const d = dRaw === "upperrej" || dRaw === "upper_rej" ? "upper_rej" : dRaw;

  const m = Number(month);
  const y = Number(year);

  if (!d) throw new Error("dept is required");
  if (!m || !y) throw new Error("month & year required");

  const start = new Date(y, m - 1, 1, 0, 0, 0);
  const end = new Date(y, m, 0, 23, 59, 59);

  // ✅ Step-1: fetch docs that have dept rows (no month filter here)
  const rawDocs = await MicroTrackingCard.find({
    isActive: true,
    rows: { $elemMatch: { department: d, isActive: true } },
  })
    .select("projectId cardId rows cardNumber cardQuantity createdAt")
    .lean();

  // ✅ Step-2: apply month filter safely in JS
  const trackingDocs = rawDocs.filter((doc) =>
    hasDeptActivityInMonth(doc, d, start, end)
  );
  if (!trackingDocs.length) return [];

  const projectIds = [
    ...new Set(trackingDocs.map((t) => String(t.projectId)).filter(Boolean)),
  ].map((id) => new mongoose.Types.ObjectId(id));

  const projects = await Project.find({
    _id: { $in: projectIds },
    isActive: true,
  })
    .populate("brand", "name")
    .populate("country", "name")
    .populate("assignPerson", "name email mobile")
    .lean();

  let PoDetailsModel = mongoose.models.PoDetails;
  if (!PoDetailsModel) {
    try {
      PoDetailsModel = mongoose.model("PoDetails");
    } catch {
      PoDetailsModel = null;
    }
  }

  const poList = PoDetailsModel
    ? await PoDetailsModel.find({ project: { $in: projectIds } }).lean()
    : [];
  const poMap = new Map(poList.map((po) => [String(po.project), po]));

  const trackedCardIds = [
    ...new Set(trackingDocs.map((t) => String(t.cardId)).filter(Boolean)),
  ].map((id) => new mongoose.Types.ObjectId(id));

  const cards = trackedCardIds.length
    ? await PCProductionCard.find({ _id: { $in: trackedCardIds } })
        .populate("assignedPlant", "name")
        .lean()
    : [];

  const cardMap = new Map(cards.map((c) => [String(c._id), c]));

  // group docs by project
  const byProject = new Map();
  for (const t of trackingDocs) {
    const pid = String(t.projectId);
    if (!byProject.has(pid)) byProject.set(pid, []);
    byProject.get(pid).push(t);
  }

  const response = [];

  for (const p of projects) {
    const pid = String(p._id);
    const docsForProject = byProject.get(pid) || [];

    // ✅ summary (optional)
    const summary = {
      daily: {},
      weekly: { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0 },
      monthTotal: 0,
    };

    const deptCards = [];

    for (const doc of docsForProject) {
      const card = cardMap.get(String(doc.cardId));

      // ✅ AGG view (assembly/packing/rfd)
      if (AGG_DEPTS.has(d)) {
        const agg = aggregateDeptForCard(doc, d);
        if (!agg) continue;

        deptCards.push({
          cardId: doc.cardId,
          cardNumber: doc.cardNumber,
          cardQuantity: doc.cardQuantity,
          assignedPlant: card?.assignedPlant || null,
          startDate: card?.startDate || null,
          agg,
        });

        // ✅ summary (if you want WORK_ADDED only)
        const deptRows = (doc.rows || []).filter(
          (r) => r.isActive !== false && normDept(r.department) === d
        );
        for (const row of deptRows) {
          for (const h of row.history || []) {
            const dt = new Date(h.ts || 0);
            if (dt < start || dt > end) continue;
            if (String(h.type || "") !== "WORK_ADDED") continue;

            const day = dt.getDate();
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

            summary.weekly[week] += toNum(h.qty);
            summary.monthTotal += toNum(h.qty);
          }
        }

        continue;
      }

      // ✅ ITEM view (cutting/printing/upper/upper_rej)
      if (card) deptCards.push(card);

      const deptRows = (doc.rows || []).filter(
        (r) => normDept(r.department) === d && r.isActive !== false
      );

      for (const row of deptRows) {
        for (const h of row.history || []) {
          const dt = new Date(h.ts || 0);
          if (dt < start || dt > end) continue;
          if (String(h.type || "") !== "WORK_ADDED") continue;

          const yyyy = dt.getFullYear();
          const mm = String(dt.getMonth() + 1).padStart(2, "0");
          const dd = String(dt.getDate()).padStart(2, "0");
          const dateKey = `${yyyy}-${mm}-${dd}`;

          const added = toNum(h.qty);
          const day = dt.getDate();
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

          summary.daily[dateKey] = (summary.daily[dateKey] || 0) + added;
          summary.weekly[week] += added;
          summary.monthTotal += added;
        }
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
      poDetails: poMap.get(pid) || null,

      department: d,
      summary,

      // ✅ cards structure differs for agg vs item
      cards: AGG_DEPTS.has(d)
        ? deptCards // [{cardId, cardNumber, agg...}]
        : [...new Map(deptCards.map((c) => [String(c._id), c])).values()],
    });
  }

  return response;
}

/* ----------------------------------------------------
   GET ONLY TRACKING-ENABLED CARDS OF A PROJECT
---------------------------------------------------- */
export async function getTrackingCardsByProject(projectId) {
  if (!projectId) throw new Error("projectId required");

  const pid = new mongoose.Types.ObjectId(String(projectId));

  // 1️⃣ Find cardIds which actually have tracking
  const trackedCardIds = await MicroTrackingCard.distinct("cardId", {
    projectId: pid,
    isActive: true,
  });

  if (!trackedCardIds.length) return [];

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

export async function getMicroTrackingByCard(cardId, dept = "") {
  if (!cardId) throw new Error("cardId required");

  const d = String(dept || "")
    .trim()
    .toLowerCase();
  const deptNorm = d === "upperrej" || d === "upper_rej" ? "upper_rej" : d;

  const doc = await MicroTrackingCard.findOne({ cardId, isActive: true })
    .populate([
      {
        path: "projectId",
        select: `
          autoCode company brand category type country assignPerson
          color artName size gender priority status productDesc
          redSealTargetDate coverImage sampleImages
          clientFinalCost clientApproval nextUpdate
          createdAt updatedAt
        `,
        populate: [
          { path: "company", select: "name companyName title" },
          { path: "brand", select: "name title" },
          { path: "category", select: "name title" },
          { path: "type", select: "name title" },
          { path: "country", select: "name code" },
          { path: "assignPerson", select: "name" },
        ],
      },
      {
        path: "cardId",
        select: "cardNumber cardQuantity status stage startDate",
      },
    ])
    .lean();

  if (!doc) throw new Error("MicroTracking not found for card");

  // ✅ PoDetails safe
  const PoDetailsModel = mongoose.models.PoDetails;
  let poDetails = null;
  if (PoDetailsModel) {
    poDetails = await PoDetailsModel.findOne({ project: doc.projectId?._id })
      .populate({ path: "updatedBy", select: "name email" })
      .lean();
  }

  // ✅ If no dept -> return full doc
  if (!deptNorm) {
    return { ...doc, poDetails: poDetails || null, agg: null };
  }

  // ✅ ITEM_DEPTS => return rows
  if (ITEM_DEPTS.has(deptNorm)) {
    const rows = (doc.rows || []).filter(
      (r) =>
        r.isActive !== false &&
        String(r.department || "").toLowerCase() === deptNorm
    );

    return {
      ...doc,
      rows,

      agg: null,
      poDetails: poDetails || null,
    };
  }

  // ✅ AGG_DEPTS => return agg + rows empty
  if (AGG_DEPTS.has(deptNorm)) {
    const agg = aggregateDeptForCard(doc, deptNorm); // ✅ now agg will not be null
    return {
      ...doc,
      rows: [],
      agg,
      poDetails: poDetails || null,
    };
  }

  // ✅ fallback: unknown dept -> full rows
  return { ...doc, poDetails: poDetails || null, agg: null };
}

export async function addWorkAndTransfer({
  cardId,
  fromDept,
  dept, // backward compatible
  itemId,
  qtyWork = 0,
  qtyTransfer = 0,
  toDept,
  updatedBy = "system",
}) {
  if (!cardId) throw new Error("cardId required");

  const sourceDeptRaw = fromDept || dept;
  if (!sourceDeptRaw) throw new Error("fromDept (or dept) required");

  const d = normDept(sourceDeptRaw);
  const targetDept = toDept ? normDept(toDept) : nextDeptOf(d);
  if (!targetDept) throw new Error(`Next department not found from ${d}`);

  const workQty = toNum(qtyWork); // ✅ pairs
  const transferQty = toNum(qtyTransfer); // ✅ pairs

  if (workQty < 0 || transferQty < 0) throw new Error("qty cannot be negative");
  if (workQty === 0 && transferQty === 0)
    throw new Error("qtyWork or qtyTransfer required");

  const doc = await MicroTrackingCard.findOne({ cardId, isActive: true });
  if (!doc) throw new Error("MicroTracking doc not found");

  // ============================================================
  // ✅ AGG DEPTS (assembly/packing/rfd) -> IGNORE itemId
  // ============================================================
  if (AGG_DEPTS.has(d)) {
    const deptRows = (doc.rows || []).filter(
      (r) => r.isActive !== false && normDept(r.department) === d
    );

    if (!deptRows.length) {
      throw new Error(`No rows found for dept ${d} in this card`);
    }

    // ✅ WORK (AGG): ONLY received check
    if (workQty > 0) {
      const availableToWork = Math.min(
        ...deptRows.map((r) => toNum(r.receivedQty) - toNum(r.completedQty))
      );

      console.log("🛠️ [WORK_LIMIT_DEBUG_AGG]", {
        cardId: String(cardId),
        projectId: String(doc.projectId?._id || doc.projectId || ""),
        dept: d,
        deptRowsCount: deptRows.length,
        availableToWorkPairs: availableToWork,
        requestedWorkPairs: workQty,
        note: "AGG dept: material check skipped",
      });

      if (availableToWork <= 0) {
        throw new Error(
          `No available qty to work in ${d}. available=${availableToWork}`
        );
      }
      if (workQty > availableToWork) {
        throw new Error(`Work qty exceeds limit. Allowed=${availableToWork}`);
      }

      // ✅ apply work to bottleneck-first rows
      let remaining = workQty;
      const sorted = [...deptRows].sort(
        (a, b) =>
          (toNum(a.receivedQty) - toNum(a.completedQty)) -
          (toNum(b.receivedQty) - toNum(b.completedQty))
      );

      for (const r of sorted) {
        if (remaining <= 0) break;
        const cap = toNum(r.receivedQty) - toNum(r.completedQty);
        if (cap <= 0) continue;

        const add = Math.min(cap, remaining);
        r.completedQty = toNum(r.completedQty) + add;

        r.history = r.history || [];
        r.history.push({
          ts: new Date(),
          type: "WORK_ADDED",
          qty: add,
          fromDept: d,
          toDept: d,
          meta: { reason: "MANUAL_WORK_AGG_ONLY_RECEIVED_CHECK" },
          updatedBy,
        });

        remaining -= add;
      }
    }

    // ✅ TRANSFER (AGG): based on bottleneck transferable
    if (transferQty > 0) {
      const canTransfer = Math.min(
        ...deptRows.map((r) => toNum(r.completedQty) - toNum(r.transferredQty))
      );

      if (canTransfer <= 0) {
        throw new Error(`Nothing to transfer in ${d}. canTransfer=${canTransfer}`);
      }
      if (transferQty > canTransfer) {
        throw new Error(`Transfer qty exceeds limit. Allowed=${canTransfer}`);
      }

      let remainingT = transferQty;

      // sort by transferable (smallest first)
      const sortedT = [...deptRows].sort(
        (a, b) =>
          (toNum(a.completedQty) - toNum(a.transferredQty)) -
          (toNum(b.completedQty) - toNum(b.transferredQty))
      );

      for (const r of sortedT) {
        if (remainingT <= 0) break;
        const capT = toNum(r.completedQty) - toNum(r.transferredQty);
        if (capT <= 0) continue;

        const move = Math.min(capT, remainingT);

        r.transferredQty = toNum(r.transferredQty) + move;

        r.history = r.history || [];
        r.history.push({
          ts: new Date(),
          type: "TRANSFER",
          qty: move,
          fromDept: d,
          toDept: targetDept,
          meta: { reason: "MOVE_NEXT_DEPT_AGG" },
          updatedBy,
        });

        // ✅ receive in targetDept for SAME real itemId
        const tgt = (doc.rows || []).find(
          (x) =>
            x.isActive !== false &&
            String(x.itemId || "") === String(r.itemId || "") &&
            normDept(x.department) === targetDept
        );

        if (!tgt) {
          doc.rows.push({
            itemId: r.itemId,
            itemKey: r.itemKey,
            name: r.name,
            specification: r.specification,
            unit: r.unit,
            category: r.category,
            department: targetDept,

            receivedQty: move,
            completedQty: 0,
            transferredQty: 0,

            // ✅ for AGG: keep these but 0 (no material logic)
            issuedMaterialQty: 0,
            issuedQty: 0,
            consumptionPerPair: toNum(r.consumptionPerPair || 0),
            issuedPairsPossible: 0,

            history: [
              {
                ts: new Date(),
                type: "RECEIVE",
                qty: move,
                fromDept: d,
                toDept: targetDept,
                meta: { reason: "FROM_PREV_DEPT_AGG" },
                updatedBy,
              },
            ],
            isActive: true,
          });
        } else {
          tgt.receivedQty = toNum(tgt.receivedQty) + move;
          tgt.history = tgt.history || [];
          tgt.history.push({
            ts: new Date(),
            type: "RECEIVE",
            qty: move,
            fromDept: d,
            toDept: targetDept,
            meta: { reason: "FROM_PREV_DEPT_AGG" },
            updatedBy,
          });
        }

        remainingT -= move;
      }
    }

    doc.markModified("rows");
    await doc.save();
    return doc.toObject();
  }

  // ============================================================
  // ✅ ITEM DEPTS (cutting/printing/upper/upper_rej) -> itemId REQUIRED
  // ============================================================
  if (!itemId) throw new Error("itemId required");

  const src = (doc.rows || []).find(
    (r) =>
      r.isActive !== false &&
      String(r.itemId || "") === String(itemId) &&
      normDept(r.department) === d
  );
  if (!src) throw new Error(`Row not found for itemId ${itemId} in dept ${d}`);

  src.history = src.history || [];

  // ✅ WORK (ITEM): material + consumption restrictions apply
  if (workQty > 0) {
    const receivedPairs = toNum(src.receivedQty);
    const completedPairs = toNum(src.completedQty);

    let cons = toNum(src.consumptionPerPair || 0);
    if (cons <= 0) {
      const pid = String(doc.projectId?._id || doc.projectId || "");
      const c = await getConsumptionPerPair(pid, src.itemId);
      cons = toNum(c?.consumption);
      if (cons > 0) src.consumptionPerPair = cons;

      console.log("🧪 [WORK] CONSUMPTION_LOOKUP:", {
        cardId: String(cardId),
        dept: d,
        itemId: String(src.itemId),
        itemName: src.name,
        found: cons > 0,
        consumptionPerPair: cons,
        costUnit: c?.unit || null,
      });
    }

    let maxAllowedPairs = receivedPairs;

    const issuedMaterial = toNum(
      src.issuedMaterialQty != null ? src.issuedMaterialQty : src.issuedQty
    );

    const issuedPairsPossible =
      cons > 0 ? calcIssuedPairsPossible(issuedMaterial, cons) : 0;

    if (cons > 0) src.issuedPairsPossible = issuedPairsPossible;

    if (cons > 0) {
      maxAllowedPairs = Math.min(receivedPairs, issuedPairsPossible);
    }

    // const availableToWork = maxAllowedPairs - completedPairs;
    const availableToWork = completedPairs;

    console.log("🛠️ [WORK_LIMIT_DEBUG]", {
      cardId: String(cardId),
      projectId: String(doc.projectId?._id || doc.projectId || ""),
      dept: d,
      itemId: String(src.itemId),
      itemName: src.name,
      materialUnit: src.unit,
      receivedPairs,
      completedPairs,
      issuedMaterialQty: issuedMaterial,
      consumptionPerPair: cons,
      issuedPairsPossible: cons > 0 ? issuedPairsPossible : "NO_CONSUMPTION_FOUND",
      maxAllowedPairs,
      availableToWorkPairs: availableToWork,
      requestedWorkPairs: workQty,
    });

    if (availableToWork <= 0) {
      throw new Error(
        `No available qty to work. maxAllowedPairs=${maxAllowedPairs}, completed=${completedPairs}`
      );
    }
    if (workQty > availableToWork) {
      throw new Error(`Work qty exceeds limit. Allowed=${availableToWork}`);
    }

    src.completedQty = completedPairs + workQty;

    src.history.push({
      ts: new Date(),
      type: "WORK_ADDED",
      qty: workQty,
      fromDept: d,
      toDept: d,
      meta: {
        reason: "MANUAL_WORK",
        maxAllowedPairs,
        issuedMaterialQty: issuedMaterial,
        consumptionPerPair: cons,
        issuedPairsPossible: cons > 0 ? issuedPairsPossible : 0,
      },
      updatedBy,
    });
  }

  // ✅ TRANSFER (ITEM): carry forward issued material in next stage
  if (transferQty > 0) {
    const completedQty = toNum(src.completedQty);
    const transferredQty = toNum(src.transferredQty);

    const canTransfer = completedQty - transferredQty;
    if (canTransfer <= 0)
      throw new Error(
        `Nothing to transfer. completed=${completedQty}, transferred=${transferredQty}`
      );
    if (transferQty > canTransfer)
      throw new Error(`Transfer qty exceeds limit. Allowed=${canTransfer}`);

    let cons = toNum(src.consumptionPerPair || 0);
    if (cons <= 0) {
      const pid = String(doc.projectId?._id || doc.projectId || "");
      const c = await getConsumptionPerPair(pid, src.itemId);
      cons = toNum(c?.consumption);
      if (cons > 0) src.consumptionPerPair = cons;
    }

    const issuedMaterial = toNum(
      src.issuedMaterialQty != null ? src.issuedMaterialQty : src.issuedQty
    );

    const materialForTransfer = cons > 0 ? transferQty * cons : 0;

    console.log("🧾 [TRANSFER_MATERIAL_CARRY]", {
      cardId: String(cardId),
      itemId: String(src.itemId),
      itemName: src.name,
      fromDept: d,
      toDept: targetDept,
      transferPairs: transferQty,
      consumptionPerPair: cons,
      sourceIssuedMaterialQty: issuedMaterial,
      materialForTransfer,
    });

    src.transferredQty = transferredQty + transferQty;

    src.history.push({
      ts: new Date(),
      type: "TRANSFER",
      qty: transferQty,
      fromDept: d,
      toDept: targetDept,
      meta: {
        reason: "MOVE_NEXT_DEPT",
        consumptionPerPair: cons,
        materialForTransfer,
      },
      updatedBy,
    });

    const tgt = (doc.rows || []).find(
      (r) =>
        r.isActive !== false &&
        String(r.itemId || "") === String(itemId) &&
        normDept(r.department) === targetDept
    );

    if (!tgt) {
      const issuedPairsPossibleNew =
        cons > 0 ? calcIssuedPairsPossible(materialForTransfer, cons) : 0;

      doc.rows.push({
        itemId: src.itemId,
        itemKey: src.itemKey,
        name: src.name,
        specification: src.specification,
        unit: src.unit,
        category: src.category,
        department: targetDept,

        receivedQty: transferQty,
        completedQty: 0,
        transferredQty: 0,

        issuedMaterialQty: materialForTransfer,
        issuedQty: materialForTransfer, // legacy
        consumptionPerPair: cons,
        issuedPairsPossible: issuedPairsPossibleNew,

        history: [
          {
            ts: new Date(),
            type: "RECEIVE",
            qty: transferQty,
            fromDept: d,
            toDept: targetDept,
            meta: {
              reason: "FROM_PREV_DEPT",
              materialForTransfer,
              consumptionPerPair: cons,
              issuedPairsPossible: issuedPairsPossibleNew,
            },
            updatedBy,
          },
        ],
        isActive: true,
      });
    } else {
      tgt.receivedQty = toNum(tgt.receivedQty) + transferQty;

      if (materialForTransfer > 0) {
        tgt.issuedMaterialQty =
          toNum(tgt.issuedMaterialQty || 0) + materialForTransfer;
        tgt.issuedQty = tgt.issuedMaterialQty;

        const tCons = toNum(tgt.consumptionPerPair || cons);
        tgt.consumptionPerPair = tCons;

        tgt.issuedPairsPossible =
          tCons > 0
            ? calcIssuedPairsPossible(toNum(tgt.issuedMaterialQty || 0), tCons)
            : 0;
      }

      tgt.history = tgt.history || [];
      tgt.history.push({
        ts: new Date(),
        type: "RECEIVE",
        qty: transferQty,
        fromDept: d,
        toDept: targetDept,
        meta: {
          reason: "FROM_PREV_DEPT",
          materialForTransfer,
          consumptionPerPair: cons,
          issuedPairsPossible: toNum(tgt.issuedPairsPossible || 0),
        },
        updatedBy,
      });
    }
  }

  doc.markModified("rows");
  await doc.save();
  return doc.toObject();
}
