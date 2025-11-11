import mongoose from "mongoose";
import CostSheet from "../models/CostSheet.model.js";
import { Project } from "../models/Project.model.js";

function sum(items = []) {
  return items.reduce((s, r) => s + (Number.isFinite(r.cost) ? r.cost : 0), 0);
}

function computeTotals(doc) {
  const upper      = sum(doc.upper);
  const component  = sum(doc.component);
  const material   = sum(doc.material);
  const packaging  = sum(doc.packaging);
  const misc       = sum(doc.misc);

  const labourSubtotal = doc.labourComponents.reduce((s, r) => s + (Number.isFinite(r.cost) ? r.cost : 0), 0);

  const overheadValue =
    doc.overhead?.type === "percent"
      ? (upper + component + material + packaging + misc + labourSubtotal) * (doc.overhead.value / 100)
      : (doc.overhead?.value || 0);

  const labourOhTotal = labourSubtotal + overheadValue;

  const baseCost = upper + component + material + packaging + misc + labourOhTotal;

  const additionalValue =
    doc.additional?.type === "percent"
      ? baseCost * (doc.additional.value / 100)
      : (doc.additional?.value || 0);

  const beforeMargin = baseCost + additionalValue;

  const profitValue = beforeMargin * ((doc.marginPct || 0) / 100);

  const targetPrice = beforeMargin + profitValue;

  return {
    upper, component, material, packaging, misc,
    labourSubtotal, overheadValue, labourOhTotal,
    baseCost, additionalValue, beforeMargin, profitValue, targetPrice,
  };
}

/** Ensure one sheet per project (init if missing) */
export async function initCostSheet(projectId) {
  const proj = await Project.findById(projectId).lean();
  if (!proj) throw new Error("project not found");

  let sheet = await CostSheet.findOne({ project: projectId });
  if (!sheet) {
    sheet = await CostSheet.create({ project: projectId });
  }
  sheet.totals = computeTotals(sheet);
  await sheet.save();
  return sheet;
}

export async function getCostSheet(projectId) {
  const sheet = await CostSheet.findOne({ project: projectId });
  if (!sheet) return null;
  return sheet;
}

export async function upsertSummary(projectId, { overhead, additional, marginPct, notes }) {
  const sheet = await initCostSheet(projectId);
  if (overhead)  sheet.overhead  = { type: overhead.type, value: Number(overhead.value || 0) };
  if (additional)sheet.additional= { type: additional.type, value: Number(additional.value || 0) };
  if (typeof marginPct === "number") sheet.marginPct = marginPct;
  if (typeof notes === "string") sheet.notes = notes;
  sheet.totals = computeTotals(sheet);
  await sheet.save();
  return sheet;
}

const validSections = ["upper","component","material","packaging","misc"];

export async function addItem(projectId, section, payload) {
  if (!validSections.includes(section)) throw new Error("invalid section");
  const sheet = await initCostSheet(projectId);
  sheet[section].push({
    item: payload.item,
    description: payload.description || "",
    consumption: payload.consumption || "",
    cost: Number(payload.cost || 0),
  });
  sheet.totals = computeTotals(sheet);
  await sheet.save();
  return sheet;
}

export async function updateItem(projectId, section, itemId, payload) {
  if (!validSections.includes(section)) throw new Error("invalid section");
  const sheet = await initCostSheet(projectId);
  const row = sheet[section].id(itemId);
  if (!row) throw new Error("item not found");
  if (payload.item !== undefined)        row.item = payload.item;
  if (payload.description !== undefined) row.description = payload.description;
  if (payload.consumption !== undefined) row.consumption = payload.consumption;
  if (payload.cost !== undefined)        row.cost = Number(payload.cost || 0);
  sheet.totals = computeTotals(sheet);
  await sheet.save();
  return sheet;
}

export async function removeItem(projectId, section, itemId) {
  if (!validSections.includes(section)) throw new Error("invalid section");
  const sheet = await initCostSheet(projectId);
  const row = sheet[section].id(itemId);
  if (!row) throw new Error("item not found");
  row.deleteOne();
  sheet.totals = computeTotals(sheet);
  await sheet.save();
  return sheet;
}

export async function setDepartment(projectId, section, itemId, department) {
  if (!validSections.includes(section)) throw new Error("invalid section");
  const sheet = await initCostSheet(projectId);
  const row = sheet[section].id(itemId);
  if (!row) throw new Error("item not found");
  row.department = department || undefined;
  sheet.totals = computeTotals(sheet); // totals unaffected but keep consistent
  await sheet.save();
  return sheet;
}

// Labour
export async function addLabour(projectId, payload) {
  const sheet = await initCostSheet(projectId);
  sheet.labourComponents.push({ name: payload.name, cost: Number(payload.cost || 0) });
  sheet.totals = computeTotals(sheet);
  await sheet.save();
  return sheet;
}
export async function updateLabour(projectId, labourId, payload) {
  const sheet = await initCostSheet(projectId);
  const row = sheet.labourComponents.id(labourId);
  if (!row) throw new Error("labour item not found");
  if (payload.name !== undefined) row.name = payload.name;
  if (payload.cost !== undefined) row.cost = Number(payload.cost || 0);
  sheet.totals = computeTotals(sheet);
  await sheet.save();
  return sheet;
}
export async function removeLabour(projectId, labourId) {
  const sheet = await initCostSheet(projectId);
  const row = sheet.labourComponents.id(labourId);
  if (!row) throw new Error("labour item not found");
  row.deleteOne();
  sheet.totals = computeTotals(sheet);
  await sheet.save();
  return sheet;
}

// Status transitions
export async function submitSheet(projectId) {
  const sheet = await initCostSheet(projectId);
  sheet.status = "submitted";
  sheet.totals = computeTotals(sheet); // freeze snapshot on submit
  await sheet.save();
  return sheet;
}
export async function approveSheet(projectId) {
  const sheet = await initCostSheet(projectId);
  sheet.status = "approved";
  await sheet.save();
  return sheet;
}
export async function rejectSheet(projectId, reason) {
  const sheet = await initCostSheet(projectId);
  sheet.status = "rejected";
  if (reason) sheet.notes = (sheet.notes ? sheet.notes + "\n" : "") + `Rejected: ${reason}`;
  await sheet.save();
  return sheet;
}
