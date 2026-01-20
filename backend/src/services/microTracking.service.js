// ✅ FINAL microTracking.service.js (complete flow - no ghost rows, printing receive fixed, legacy safe)
// Drop-in replacement

import mongoose from "mongoose";
import MicroTrackingCard from "../models/MicroTracking.model.js";
import MicroTracking from "../models/MicroTracking.model.js";
import { PCProductionCard } from "../models/pc_productionCard.model.js";
import { PCMaterialRequest } from "../models/pc_materialRequest.model.js";
import { Project } from "../models/Project.model.js";

/* ----------------------------------------------------
  CONSTANTS
---------------------------------------------------- */
const FLOW = ["cutting", "printing", "upper", "upper_rej", "assembly", "packing", "rfd"];
const DEPARTMENTS = new Set(FLOW);

const AGG_DEPTS = new Set(["assembly", "packing", "rfd"]);
const ITEM_DEPTS = new Set(["cutting", "printing", "upper", "upper_rej"]);

const TRACK_CATEGORIES = new Set(["upper", "components"]); // ✅ ONLY these tracked

/* ----------------------------------------------------
  SMALL UTILS
---------------------------------------------------- */
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normStr(v) {
  return String(v ?? "").trim();
}

function normDeptOrNull(v) {
  const d = String(v || "").trim().toLowerCase();
  if (!d) return null;
  if (d === "upperrej" || d === "upper_rej" || d === "upper-rej") return "upper_rej";
  return DEPARTMENTS.has(d) ? d : null;
}

export function normDept(v) {
  return normDeptOrNull(v) || "cutting";
}

function normDeptOrFallback(v, fallback = null) {
  return normDeptOrNull(v) || fallback;
}

function nextDeptOf(d) {
  const idx = FLOW.indexOf(d);
  if (idx < 0) return null;
  return FLOW[idx + 1] || null;
}

// ✅ hard-safe row validity (prevents mongoose "name is required" crashes)
function isValidRow(r) {
  if (!r) return false;
  const name = normStr(r.name);
  const dept = normDeptOrNull(r.department);
  const iid = r.itemId != null ? normStr(r.itemId) : "";
  return Boolean(name && dept && iid);
}

// ✅ sanitize doc rows before any save
function sanitizeDocRows(doc) {
  if (!doc) return doc;
  doc.rows = (doc.rows || []).filter(isValidRow);
  return doc;
}

function getModelSafe(name) {
  try {
    return mongoose.models[name] || mongoose.model(name);
  } catch {
    return null;
  }
}

const UpperCostRowModel = getModelSafe("UpperCostRow");
const ComponentCostRowModel = getModelSafe("ComponentCostRow");

async function getConsumptionPerPair(projectId, itemId) {
  const pid = String(projectId || "");
  const iid = String(itemId || "");
  if (!pid || !iid) return { consumption: 0, unit: "" };

  let row = null;

  if (UpperCostRowModel) {
    row =
      (await UpperCostRowModel.findOne({ projectId: pid, _id: iid })
        .select("consumption unit")
        .lean()) || null;
  }

  if (!row && ComponentCostRowModel) {
    row =
      (await ComponentCostRowModel.findOne({ projectId: pid, _id: iid })
        .select("consumption unit")
        .lean()) || null;
  }

  return {
    consumption: toNum(row?.consumption),
    unit: String(row?.unit || "").trim(),
  };
}

function calcIssuedPairsPossible(issuedMaterialQty, consumptionPerPair) {
  const issued = toNum(issuedMaterialQty);
  const cons = toNum(consumptionPerPair);
  if (issued <= 0 || cons <= 0) return 0;
  return Math.floor(issued / cons);
}

/* ----------------------------------------------------
  DASHBOARD HELPERS
---------------------------------------------------- */
export function hasDeptActivityInMonth(doc, dept, start, end) {
  const d = normDept(dept);

  const deptRows = (doc.rows || []).filter(
    (r) => r.isActive !== false && normDept(r.department) === d
  );

  for (const r of deptRows) {
    for (const h of r.history || []) {
      const ts = new Date(h.ts || h.date || h.createdAt || 0);
      if (ts >= start && ts <= end) return true;
    }
  }

  const createdAt = new Date(doc.createdAt || 0);
  if (createdAt >= start && createdAt <= end) return true;

  return false;
}

// ✅ only for AGG depts min-based
function aggregateDeptForCard(doc, dept) {
  const deptRows = (doc.rows || []).filter(
    (r) => r.isActive !== false && String(r.department) === dept
  );
  if (!deptRows.length) return null;

  const minOf = (field) => Math.min(...deptRows.map((r) => toNum(r[field])));

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

/* ----------------------------------------------------
  ISSUED SNAPSHOT MAPS
---------------------------------------------------- */
function buildIssuedByItemIdFromMR(mr) {
  const map = new Map();
  const add = (arr = []) => {
    for (const it of arr || []) {
      const id = it?.itemId != null ? String(it.itemId).trim() : "";
      if (!id) continue;
      map.set(id, Math.max(toNum(map.get(id)), toNum(it?.issued)));
    }
  };
  add(mr.upper);
  add(mr.components);
  return map;
}

function buildIssuedByItemIdFromCard(card) {
  const map = new Map();
  const add = (arr = []) => {
    for (const it of arr || []) {
      const id = it?.itemId != null ? String(it.itemId).trim() : "";
      if (!id) continue;
      map.set(id, Math.max(toNum(map.get(id)), toNum(it?.issued)));
    }
  };
  add(card.upper);
  add(card.components);
  return map;
}

/* ----------------------------------------------------
  ROW BUILDER (from card)
---------------------------------------------------- */
function buildTrackingRowsFromCard(card, updatedBy) {
  const qty = toNum(card.cardQuantity || 0);
  const rows = [];
  const seen = new Set();

  const pushTracked = (arr = [], category) => {
    if (!TRACK_CATEGORIES.has(category)) return;

    for (const it of arr || []) {
      const itemId = it?.itemId != null ? String(it.itemId).trim() : "";
      const name = String(it?.name || "").trim();
      if (!itemId || !name) continue;

      if (seen.has(itemId)) continue;
      seen.add(itemId);

      // ✅ if item dept missing -> start from cutting (safe default)
      const dept = normDeptOrNull(it?.department) || "cutting";

      rows.push({
        category,
        itemId,
        itemKey: `iid:${itemId}`,

        name,
        specification: String(it?.specification || "").trim(),
        unit: String(it?.unit || "unit").trim(),

        department: dept,

        receivedQty: qty,
        completedQty: 0,
        transferredQty: 0,

        issuedMaterialQty: toNum(it?.issued || 0),
        issuedQty: toNum(it?.issued || 0),
        consumptionPerPair: 0,
        issuedPairsPossible: 0,

        history: [
          {
            ts: new Date(),
            type: "RECEIVE",
            qty,
            fromDept: "",
            toDept: dept,
            meta: { reason: "TRACKING_START", category },
            updatedBy: updatedBy || "system",
          },
        ],
        isActive: true,
      });
    }
  };

  pushTracked(card.upper, "upper");
  pushTracked(card.components, "components");

  return rows;
}

function buildKey(r) {
  return `${String(r.itemId || "")}::${String(r.department || "")}`;
}

// ✅ clone base row without carrying mongoose refs / without broken fields
function cloneRowBase(src) {
  return {
    category: src.category || "upper",
    itemId: src.itemId,
    itemKey: src.itemKey || `iid:${String(src.itemId || "").trim()}`,

    name: normStr(src.name),
    specification: normStr(src.specification),
    unit: normStr(src.unit || "unit"),

    isActive: src.isActive !== false,

    // snapshots
    issuedMaterialQty: toNum(src.issuedMaterialQty ?? src.issuedQty),
    issuedQty: toNum(src.issuedMaterialQty ?? src.issuedQty),
    consumptionPerPair: toNum(src.consumptionPerPair),
    issuedPairsPossible: toNum(src.issuedPairsPossible),

    history: [], // target row will start with RECEIVE history only
  };
}

/* ----------------------------------------------------
  ENSURE DOC FOR CARD (rebuild/merge)
---------------------------------------------------- */
export async function ensureMicroTrackingForCard(cardId, updatedBy = "system") {
  const card = await PCProductionCard.findById(cardId).lean();
  if (!card) throw new Error("Production Card not found");

  let doc = await MicroTrackingCard.findOne({
    projectId: card.projectId,
    cardId: card._id,
    isActive: true,
  });

  if (!doc) {
    const created = await createMicroTrackingForCard(cardId, updatedBy);
    return created;
  }

  // ✅ sanitize old doc (fix ghost rows)
  sanitizeDocRows(doc);

  const freshRows = buildTrackingRowsFromCard(card, updatedBy);

  const oldMap = new Map((doc.rows || []).map((r) => [buildKey(r), r]));

  const merged = freshRows.map((nr) => {
    const key = buildKey(nr);
    const old = oldMap.get(key);

    if (!old) return nr;

    return {
      ...nr,

      receivedQty: toNum(old.receivedQty),
      completedQty: toNum(old.completedQty),
      transferredQty: toNum(old.transferredQty),

      issuedMaterialQty: toNum(old.issuedMaterialQty ?? old.issuedQty ?? nr.issuedMaterialQty),
      issuedQty: toNum(old.issuedMaterialQty ?? old.issuedQty ?? nr.issuedQty),
      consumptionPerPair: toNum(old.consumptionPerPair ?? nr.consumptionPerPair),
      issuedPairsPossible: toNum(old.issuedPairsPossible ?? nr.issuedPairsPossible),

      history: Array.isArray(old.history) && old.history.length ? old.history : nr.history,

      category: old.category ?? nr.category,
    };
  });

  // ✅ keep extra tracked rows not present in fresh (including legacy rows with missing category)
  for (const old of doc.rows || []) {
    const cat = String(old.category || "").trim().toLowerCase();
    const isTracked = TRACK_CATEGORIES.has(cat) || !cat;
    if (!isTracked) continue;

    if (!cat) old.category = "upper";

    const key = buildKey(old);
    if (!merged.find((x) => buildKey(x) === key)) merged.push(old);
  }

  doc.rows = merged.filter(isValidRow); // ✅ hard clean
  doc.markModified("rows");
  await doc.save();

  return doc.toObject();
}

/* ----------------------------------------------------
  CREATE DOC
---------------------------------------------------- */
export async function createMicroTrackingForCard(cardId, updatedBy = "system") {
  const card = await PCProductionCard.findById(cardId).lean();
  if (!card) throw new Error("Production Card not found");

  const exists = await MicroTrackingCard.findOne({
    projectId: card.projectId,
    cardId: card._id,
    isActive: true,
  }).lean();
  if (exists) return exists;

  const rows = buildTrackingRowsFromCard(card, updatedBy);

  const doc = await MicroTrackingCard.create({
    projectId: card.projectId,
    cardId: card._id,
    cardNumber: card.cardNumber,
    cardQuantity: toNum(card.cardQuantity || 0),
    firstDept: null,
    rows,
    isActive: true,
  });

  return doc.toObject();
}

/* ----------------------------------------------------
  SYNC ISSUED FROM MR (MR wins else card)
---------------------------------------------------- */
export async function syncMicroTrackingIssuedFromMR(cardId, updatedBy = "system") {
  const card = await PCProductionCard.findById(cardId).lean();
  if (!card) throw new Error("Production Card not found");

  const doc = await MicroTrackingCard.findOne({
    projectId: card.projectId,
    cardId: card._id,
    isActive: true,
  });
  if (!doc) return null;

  // ✅ sanitize first (avoid validation crash)
  sanitizeDocRows(doc);

  const mr = await PCMaterialRequest.findOne({
    projectId: card.projectId,
    productionCardId: card._id,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .lean();

  const mrIssued = mr ? buildIssuedByItemIdFromMR(mr) : new Map();
  const cardIssued = buildIssuedByItemIdFromCard(card);

  let changed = false;

  for (const row of doc.rows || []) {
    const rid = row?.itemId != null ? String(row.itemId).trim() : "";
    if (!rid) continue;

    const cat = String(row.category || "").trim().toLowerCase();
    const isTracked = TRACK_CATEGORIES.has(cat) || !cat;
    if (!isTracked) continue;

    if (!cat) {
      row.category = "upper";
      changed = true;
    }

    const mrVal = toNum(mrIssued.get(rid));
    const cardVal = toNum(cardIssued.get(rid));
    const newIssuedMaterial = mrVal > 0 ? mrVal : cardVal;

    const oldIssuedMaterial = toNum(row.issuedMaterialQty != null ? row.issuedMaterialQty : row.issuedQty);

    let cons = toNum(row.consumptionPerPair);
    if (cons <= 0) {
      const c = await getConsumptionPerPair(card.projectId, rid);
      cons = toNum(c?.consumption);
      if (cons > 0) {
        row.consumptionPerPair = cons;
        changed = true;
      }
    }

    const pairsPossible = cons > 0 ? calcIssuedPairsPossible(newIssuedMaterial, cons) : 0;

    if (newIssuedMaterial !== oldIssuedMaterial) {
      const delta = newIssuedMaterial - oldIssuedMaterial;

      row.issuedMaterialQty = newIssuedMaterial;
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
            reason: "ISSUE_SNAPSHOT_SYNC",
            source: mr ? "pcmaterialrequests" : "pccard_fallback",
            consumptionPerPair: cons,
            issuedPairsPossible: pairsPossible,
          },
          updatedBy,
        });
      }
    } else {
      if (toNum(row.issuedPairsPossible) !== toNum(pairsPossible)) {
        row.issuedPairsPossible = pairsPossible;
        changed = true;
      }
    }
  }

  if (changed) {
    doc.rows = (doc.rows || []).filter(isValidRow);
    doc.markModified("rows");
    await doc.save();
  }

  return doc.toObject();
}

/* ----------------------------------------------------
  READ BY CARD (dept filter)
---------------------------------------------------- */
export async function getMicroTrackingByCard(cardId, dept = "") {
  if (!cardId) throw new Error("cardId required");

  await ensureMicroTrackingForCard(cardId);
  await syncMicroTrackingIssuedFromMR(cardId);

  const d = String(dept || "").trim().toLowerCase();
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

  const trackedRows = (doc.rows || []).filter((r) => {
    if (r.isActive === false) return false;
    // ✅ only show tracked + legacy allowed
    const cat = String(r.category || "").trim().toLowerCase();
    return TRACK_CATEGORIES.has(cat) || !cat;
  });

  if (!deptNorm) return { ...doc, rows: trackedRows, agg: null };

  if (ITEM_DEPTS.has(deptNorm)) {
    const rows = trackedRows.filter((r) => String(r.department) === deptNorm);
    return { ...doc, rows, agg: null };
  }

  if (AGG_DEPTS.has(deptNorm)) {
    const agg = aggregateDeptForCard({ ...doc, rows: trackedRows }, deptNorm);
    return { ...doc, rows: [], agg };
  }

  return { ...doc, rows: trackedRows, agg: null };
}

/* ----------------------------------------------------
  ADD WORK + AUTO TRANSFER (FIXED printing receive)
---------------------------------------------------- */
export async function addWorkAndTransfer({
  cardId,
  fromDept,
  dept,
  itemId,
  qtyWork = 0,
  qtyTransfer = 0,
  toDept,
  updatedBy = "system",
}) {
  if (!cardId) throw new Error("cardId required");

  const sourceDeptRaw = fromDept || dept;
  if (!sourceDeptRaw) throw new Error("fromDept (or dept) required");

  const d = normDeptOrFallback(sourceDeptRaw);
  if (!d) throw new Error("Invalid fromDept");

  const targetDept = toDept ? normDeptOrFallback(toDept) : nextDeptOf(d);
  if (!targetDept) throw new Error(`Next department not found from ${d}`);

  const workPairs = toNum(qtyWork);
  const legacyTransferPairs = toNum(qtyTransfer);

  if (workPairs < 0 || legacyTransferPairs < 0) throw new Error("qty cannot be negative");
  if (workPairs === 0 && legacyTransferPairs === 0) throw new Error("qtyWork required");

  const transferPairs = workPairs > 0 ? workPairs : legacyTransferPairs;

  const doc = await MicroTrackingCard.findOne({ cardId, isActive: true });
  if (!doc) throw new Error("MicroTracking doc not found");

  // ✅ sanitize immediately (removes ghost rows)
  sanitizeDocRows(doc);

  const rowsTracked = (doc.rows || []).filter((r) => {
    if (r.isActive === false) return false;
    const cat = String(r.category || "").trim().toLowerCase();
    return TRACK_CATEGORIES.has(cat) || !cat; // ✅ legacy ok
  });

  /* ---------------- AGG ---------------- */
  if (AGG_DEPTS.has(d)) {
    const rowsInDept = rowsTracked.filter((r) => String(r.department) === d);
    if (!rowsInDept.length) throw new Error(`No rows found in AGG dept ${d}`);

    const availableToWork = Math.min(...rowsInDept.map((r) => toNum(r.receivedQty) - toNum(r.completedQty)));

    if (workPairs > 0) {
      if (workPairs > availableToWork) throw new Error(`Work qty exceeds limit in ${d}. Allowed=${availableToWork}`);

      for (const r of rowsInDept) {
        r.completedQty = toNum(r.completedQty) + workPairs;
        r.history = r.history || [];
        r.history.push({
          ts: new Date(),
          type: "WORK_ADDED",
          qty: workPairs,
          fromDept: d,
          toDept: d,
          meta: { reason: "AGG_WORK_AUTO" },
          updatedBy,
        });
      }
    }

    if (transferPairs > 0) {
      const canTransfer = Math.min(...rowsInDept.map((r) => toNum(r.completedQty) - toNum(r.transferredQty)));
      if (transferPairs > canTransfer) throw new Error(`Transfer qty exceeds limit in ${d}. Allowed=${canTransfer}`);

      for (const r of rowsInDept) {
        r.transferredQty = toNum(r.transferredQty) + transferPairs;
        r.history = r.history || [];
        r.history.push({
          ts: new Date(),
          type: "TRANSFER",
          qty: transferPairs,
          fromDept: d,
          toDept: targetDept,
          meta: { reason: "AGG_MOVE_NEXT_AUTO" },
          updatedBy,
        });

        // receive into next dept for same item
        let tgt = (doc.rows || []).find(
          (x) =>
            x.isActive !== false &&
            String(x.itemId || "") === String(r.itemId) &&
            String(x.department) === targetDept
        );

        if (!tgt) {
          const base = cloneRowBase(r);

          doc.rows.push({
            ...base,
            department: targetDept,
            receivedQty: transferPairs,
            completedQty: 0,
            transferredQty: 0,
            history: [
              {
                ts: new Date(),
                type: "RECEIVE",
                qty: transferPairs,
                fromDept: d,
                toDept: targetDept,
                meta: { reason: "AGG_RECEIVE_FROM_PREV" },
                updatedBy,
              },
            ],
          });
        } else {
          tgt.receivedQty = toNum(tgt.receivedQty) + transferPairs;
          tgt.history = tgt.history || [];
          tgt.history.push({
            ts: new Date(),
            type: "RECEIVE",
            qty: transferPairs,
            fromDept: d,
            toDept: targetDept,
            meta: { reason: "AGG_RECEIVE_FROM_PREV" },
            updatedBy,
          });
        }
      }
    }

    doc.rows = (doc.rows || []).filter(isValidRow);
    doc.markModified("rows");
    await doc.save();
    return doc.toObject();
  }

  /* ---------------- ITEM ---------------- */
  if (!itemId) throw new Error("itemId required for ITEM depts");

  const src = (doc.rows || []).find((r) =>
    r.isActive !== false &&
    (TRACK_CATEGORIES.has(String(r.category || "").trim().toLowerCase()) || !r.category) &&
    String(r.itemId || "") === String(itemId) &&
    String(r.department) === d
  );

  if (!src) throw new Error(`Row not found for itemId ${itemId} in dept ${d}`);

  src.history = src.history || [];

  // WORK
  if (workPairs > 0) {
    const receivedPairs = toNum(src.receivedQty);
    const completedPairs = toNum(src.completedQty);

    let cons = toNum(src.consumptionPerPair);
    if (cons <= 0) {
      const pid = String(doc.projectId?._id || doc.projectId || "");
      const c = await getConsumptionPerPair(pid, src.itemId);
      cons = toNum(c?.consumption);
      if (cons > 0) src.consumptionPerPair = cons;
    }

    const issuedMaterial = toNum(src.issuedMaterialQty != null ? src.issuedMaterialQty : src.issuedQty);
    const issuedPairsPossible = cons > 0 ? calcIssuedPairsPossible(issuedMaterial, cons) : receivedPairs;

    src.issuedPairsPossible = toNum(issuedPairsPossible);

    const maxAllowedPairs = cons > 0 ? Math.min(receivedPairs, issuedPairsPossible) : receivedPairs;
    const availableToWork = maxAllowedPairs - completedPairs;

    if (workPairs > availableToWork) throw new Error(`Work qty exceeds limit. Allowed=${availableToWork}`);

    src.completedQty = completedPairs + workPairs;

    src.history.push({
      ts: new Date(),
      type: "WORK_ADDED",
      qty: workPairs,
      fromDept: d,
      toDept: d,
      meta: { reason: "ITEM_WORK_AUTO", maxAllowedPairs, issuedMaterialQty: issuedMaterial, consumptionPerPair: cons },
      updatedBy,
    });
  }

  // TRANSFER
  if (transferPairs > 0) {
    const completedQty = toNum(src.completedQty);
    const transferredQty = toNum(src.transferredQty);
    const canTransfer = completedQty - transferredQty;

    if (transferPairs > canTransfer) throw new Error(`Transfer qty exceeds limit. Allowed=${canTransfer}`);

    let cons = toNum(src.consumptionPerPair);
    if (cons <= 0) {
      const pid = String(doc.projectId?._id || doc.projectId || "");
      const c = await getConsumptionPerPair(pid, src.itemId);
      cons = toNum(c?.consumption);
      if (cons > 0) src.consumptionPerPair = cons;
    }

    const materialForTransfer = cons > 0 ? transferPairs * cons : 0;

    src.transferredQty = transferredQty + transferPairs;

    src.history.push({
      ts: new Date(),
      type: "TRANSFER",
      qty: transferPairs,
      fromDept: d,
      toDept: targetDept,
      meta: { reason: "ITEM_MOVE_NEXT_AUTO", consumptionPerPair: cons, materialForTransfer },
      updatedBy,
    });

    // ✅ FIND target row (legacy allowed)
    let tgt = (doc.rows || []).find(
      (r) =>
        r.isActive !== false &&
        (TRACK_CATEGORIES.has(String(r.category || "").trim().toLowerCase()) || !r.category) &&
        String(r.itemId || "") === String(itemId) &&
        String(r.department) === targetDept
    );

    if (!tgt) {
      // ✅ SAFE create (NO spreading src)
      const base = cloneRowBase(src);

      doc.rows.push({
        ...base,
        department: targetDept,
        receivedQty: transferPairs,
        completedQty: 0,
        transferredQty: 0,

        // material snapshot forward
        issuedMaterialQty: toNum(base.issuedMaterialQty) + materialForTransfer,
        issuedQty: toNum(base.issuedMaterialQty) + materialForTransfer,
        consumptionPerPair: cons,
        issuedPairsPossible: cons > 0
          ? calcIssuedPairsPossible(toNum(base.issuedMaterialQty) + materialForTransfer, cons)
          : 0,

        history: [
          {
            ts: new Date(),
            type: "RECEIVE",
            qty: transferPairs,
            fromDept: d,
            toDept: targetDept,
            meta: { reason: "ITEM_RECEIVE_FROM_PREV", materialForTransfer, consumptionPerPair: cons },
            updatedBy,
          },
        ],
      });
    } else {
      tgt.receivedQty = toNum(tgt.receivedQty) + transferPairs;

      tgt.issuedMaterialQty = toNum(tgt.issuedMaterialQty) + materialForTransfer;
      tgt.issuedQty = tgt.issuedMaterialQty;
      tgt.consumptionPerPair = cons;
      tgt.issuedPairsPossible = cons > 0 ? calcIssuedPairsPossible(tgt.issuedMaterialQty, cons) : 0;

      tgt.history = tgt.history || [];
      tgt.history.push({
        ts: new Date(),
        type: "RECEIVE",
        qty: transferPairs,
        fromDept: d,
        toDept: targetDept,
        meta: { reason: "ITEM_RECEIVE_FROM_PREV", materialForTransfer, consumptionPerPair: cons },
        updatedBy,
      });
    }
  }

  doc.rows = (doc.rows || []).filter(isValidRow); // ✅ hard clean
  doc.markModified("rows");
  await doc.save();
  return doc.toObject();
}

/* ----------------------------------------------------
  HISTORY SERVICE (fixed to read from doc.rows properly)
---------------------------------------------------- */
function mapStageToDept(stg) {
  if (!stg) return null;
  if (stg === "upper-rej") return "upper_rej";
  return stg;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function getTrackingHistoryService(projectId, stage, cardId) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  const filter = { projectId: new mongoose.Types.ObjectId(projectId) };

  if (cardId) {
    if (!mongoose.Types.ObjectId.isValid(cardId)) throw new Error("Invalid cardId");
    filter.cardId = new mongoose.Types.ObjectId(cardId);
  }

  // We read docs (each doc has rows[])
  const docs = await MicroTrackingCard.find(filter)
    .select("rows")
    .lean();

  const dept = mapStageToDept(stage);
  const flat = [];

  for (const doc of docs) {
    for (const r of doc.rows || []) {
      if (!r || r.isActive === false) continue;

      const cat = String(r.category || "").trim().toLowerCase();
     if (cat && !TRACK_CATEGORIES.has(cat)) continue; // ✅ only tracked categories (allow legacy empty)


      const rowStage = String(r.department || "");
      if (dept && rowStage !== dept) continue;

      const itemName = r?.name || "Unnamed";
      const unit = r?.unit || "unit";

      for (const h of r.history || []) {
        const timestamp = h.ts || h.date || new Date();

        // old legacy shapes support (if present)
        if (h.addedToday !== undefined) {
          flat.push({
            itemName,
            unit,
            stage: rowStage,
            timestamp,
            type: num(h.addedToday) > 0 ? "added" : "updated",
            quantity: num(h.addedToday),
            previousTotal: num(h.previousDone),
            newTotal: num(h.newDone),
            updatedBy: h.updatedBy || "system",
            notes: "",
          });
          continue;
        }

        const notes = h?.meta ? JSON.stringify(h.meta) : "";
        flat.push({
          itemName,
          unit,
          stage: rowStage,
          timestamp,
          type: String(h.type || "updated").toLowerCase(),
          quantity: num(h.qty),
          previousTotal: 0,
          newTotal: 0,
          updatedBy: h.updatedBy || "system",
          notes,
        });
      }
    }
  }

  flat.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return flat;
}

/* ----------------------------------------------------
  DASHBOARD
---------------------------------------------------- */
export async function getTrackingDashboardByDepartment(dept, month, year) {
  const dRaw = String(dept || "").trim().toLowerCase();
  const d = dRaw === "upperrej" || dRaw === "upper_rej" ? "upper_rej" : dRaw;

  const m = Number(month);
  const y = Number(year);

  if (!d) throw new Error("dept is required");
  if (!m || !y) throw new Error("month & year required");

  const start = new Date(y, m - 1, 1, 0, 0, 0);
  const end = new Date(y, m, 0, 23, 59, 59);

  const rawDocs = await MicroTrackingCard.find({
    isActive: true,
    rows: { $elemMatch: { department: d, isActive: true } },
  })
    .select("projectId cardId rows cardNumber cardQuantity createdAt")
    .lean();

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

    const summary = {
      daily: {},
      dailyByDay: {},
      weekly: { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0 },
      monthTotal: 0,
    };

    const deptCards = [];

    // ✅ NEW: project cutting completion = MIN completedQty across cards (MIN system)
    // - first: per card -> min(completedQty among dept rows)
    // - then: project -> min(of all cards)
    let projectMinCompleted = null;

    for (const doc of docsForProject) {
      const card = cardMap.get(String(doc.cardId));
      if (card) deptCards.push(card);

      const deptRows = (doc.rows || []).filter(
        (r) => r.isActive !== false && normDept(r.department) === d
      );
      if (!deptRows.length) continue;

      // ✅ per-card min completedQty
      const cardMinCompleted = Math.min(
        ...deptRows.map((r) => toNum(r.completedQty))
      );

      if (projectMinCompleted === null) projectMinCompleted = cardMinCompleted;
      else projectMinCompleted = Math.min(projectMinCompleted, cardMinCompleted);

      // existing: month summary from history WORK_ADDED
      for (const row of deptRows) {
        for (const h of row.history || []) {
          const dt = new Date(h.ts || 0);
          if (dt < start || dt > end) continue;
          if (String(h.type || "") !== "WORK_ADDED") continue;

          const added = toNum(h.qty);
          const dayNum = dt.getDate();

          const week =
            dayNum <= 7
              ? "W1"
              : dayNum <= 14
              ? "W2"
              : dayNum <= 21
              ? "W3"
              : dayNum <= 28
              ? "W4"
              : "W5";

          const yyyy = dt.getFullYear();
          const mm = String(dt.getMonth() + 1).padStart(2, "0");
          const dd = String(dayNum).padStart(2, "0");
          const dateKey = `${yyyy}-${mm}-${dd}`;

          summary.daily[dateKey] = (summary.daily[dateKey] || 0) + added;
          summary.dailyByDay[String(dayNum)] =
            (summary.dailyByDay[String(dayNum)] || 0) + added;

          summary.weekly[week] += added;
          summary.monthTotal += added;
        }
      }
    }

    if (projectMinCompleted === null) projectMinCompleted = 0;

    const po = poMap.get(pid) || null;
    const poQty = toNum(po?.orderQuantity);

    // ✅ status/progress should be PO based
    const targetQty = poQty > 0 ? poQty : 0;

    // ✅ cap completed to targetQty (so 568/540 -> 540/540)
    const completedQty =
      targetQty > 0
        ? Math.min(toNum(projectMinCompleted), targetQty)
        : toNum(projectMinCompleted);

    const progressPercent =
      targetQty > 0 ? (completedQty / targetQty) * 100 : 0;

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
      coverImage: p.coverImage,
      poDetails: po,

      department: d,
      summary,

      // ✅ NEW: frontend "Cutting Status" ko isse render karo
      progress: {
        targetQty,            // PO qty
        completedQty,         // MIN system completion (capped)
        minCompletedQty: toNum(projectMinCompleted), // raw min (debug)
        percent: Number(progressPercent.toFixed(2)),
      },

      cards: [...new Map(deptCards.map((c) => [String(c._id), c])).values()],
    });
  }

  return response;
}


/* ----------------------------------------------------
  GET TRACKING CARDS BY PROJECT
---------------------------------------------------- */
export async function getTrackingCardsByProject(projectId) {
  if (!projectId) throw new Error("projectId required");
  if (!mongoose.Types.ObjectId.isValid(projectId)) throw new Error("Invalid projectId");

  const pid = new mongoose.Types.ObjectId(projectId);

  const trackedCardIds = await MicroTrackingCard.distinct("cardId", {
    projectId: pid,
    isActive: true,
  });

  if (!trackedCardIds.length) return [];

  const cards = await PCProductionCard.find({ _id: { $in: trackedCardIds } })
    .select("cardNumber productName cardQuantity stage assignedPlant createdAt")
    .populate("assignedPlant", "name")
    .sort({ createdAt: -1 })
    .lean();

  return cards;
}
