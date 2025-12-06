import {
  UpperCostRow,
  ComponentCostRow,
  MaterialCostRow,
  PackagingCostRow,
  MiscCostRow,
} from "../models/costRow.model.js";
import { LabourCost } from "../models/labourCost.model.js";
import { CostSummary } from "../models/costSummary.model.js";
import mongoose from "mongoose";

const sumByProject = async (Model, projectId) => {
  const [{ total = 0 } = {}] = await Model.aggregate([
    { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
    { $group: { _id: null, total: { $sum: "$cost" } } },
  ]);
  return Number(total) || 0;
};

export async function ensureSummary(projectId) {
  const existing = await CostSummary.findOne({ projectId });
  if (existing) return existing;
  return CostSummary.create({ projectId });
}

export async function ensureLabour(projectId) {
  const existing = await LabourCost.findOne({ projectId });
  if (existing) return existing;
  return LabourCost.create({ projectId, directTotal: 0, items: [] });
}

/** Recalculate & persist summary for a project. Returns fresh summary doc. */
export async function recomputeSummary(projectId) {
  // section totals
  const [upperTotal, componentTotal, materialTotal, packagingTotal, miscTotal] =
    await Promise.all([
      sumByProject(UpperCostRow, projectId),
      sumByProject(ComponentCostRow, projectId),
      sumByProject(MaterialCostRow, projectId),
      sumByProject(PackagingCostRow, projectId),
      sumByProject(MiscCostRow, projectId),
    ]);

  const labour = await ensureLabour(projectId);
  const labourTotal = Number(labour.directTotal) || 0;

  // Check if ALL costs are zero AND labour has no items
  const hasNoCostData =
    upperTotal === 0 &&
    componentTotal === 0 &&
    materialTotal === 0 &&
    packagingTotal === 0 &&
    miscTotal === 0 &&
    labourTotal === 0 &&
    (!labour.items || labour.items.length === 0);

  // If no data exists, delete the summary to indicate no cost data
  if (hasNoCostData) {
    await CostSummary.deleteOne({ projectId });
    return null;
  }

  const summary = await ensureSummary(projectId);

  const totalAllCosts =
    upperTotal +
    componentTotal +
    materialTotal +
    packagingTotal +
    miscTotal +
    labourTotal;

  const additionalCosts = Number(summary.additionalCosts) || 0;
  const profitMargin = Number(summary.profitMargin) || 0;

  const subtotalBeforeProfit = totalAllCosts + additionalCosts;
  const profitAmount = Math.round((subtotalBeforeProfit * profitMargin) / 100);
  const tentativeCost = subtotalBeforeProfit + profitAmount;

  summary.set({
    upperTotal,
    componentTotal,
    materialTotal,
    packagingTotal,
    miscTotal,
    labourTotal,
    totalAllCosts,
    profitAmount,
    tentativeCost,
  });

  await summary.save();
  return summary;
}
