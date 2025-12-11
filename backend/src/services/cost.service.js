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

/** ✅ ATOMIC UPSERT — SAFE */
export async function ensureSummary(projectId) {
  return CostSummary.findOneAndUpdate(
    { projectId },
    {}, // no updates, just ensure document exists
    { upsert: true, new: true }
  );
}

export async function ensureLabour(projectId) {
  return LabourCost.findOneAndUpdate(
    { projectId },
    { $setOnInsert: { directTotal: 0, items: [] } },
    { upsert: true, new: true }
  );
}

/**
 * ✅ Recompute summary safely with atomic updates
 * NEVER uses create() or save() → no race conditions.
 */
export async function recomputeSummary(projectId) {
  const [upper, component, material, packaging, misc] = await Promise.all([
    sumByProject(UpperCostRow, projectId),
    sumByProject(ComponentCostRow, projectId),
    sumByProject(MaterialCostRow, projectId),
    sumByProject(PackagingCostRow, projectId),
    sumByProject(MiscCostRow, projectId),
  ]);

  const labour = await ensureLabour(projectId);
  const labourTotal = Number(labour.directTotal) || 0;

  const hasNoCost =
    upper === 0 &&
    component === 0 &&
    material === 0 &&
    packaging === 0 &&
    misc === 0 &&
    labourTotal === 0 &&
    (!labour.items || labour.items.length === 0);

  // Delete summary if no data
  if (hasNoCost) {
    await CostSummary.deleteOne({ projectId });
    return null;
  }

  // Make sure summary exists
  const summary = await ensureSummary(projectId);

  const additionalCosts = Number(summary.additionalCosts) || 0;
  const profitMargin = Number(summary.profitMargin) || 0;

  const totalAllCosts =
    upper + component + material + packaging + misc + labourTotal;

  const subtotal = totalAllCosts + additionalCosts;
  const profitAmount = Math.round((subtotal * profitMargin) / 100);
  const tentativeCost = subtotal + profitAmount;

  // Atomic update for computed fields
  return CostSummary.findOneAndUpdate(
    { projectId },
    {
      $set: {
        upperTotal: upper,
        componentTotal: component,
        materialTotal: material,
        packagingTotal: packaging,
        miscTotal: misc,
        labourTotal,
        totalAllCosts,
        profitAmount,
        tentativeCost,
      },
    },
    { new: true }
  );
}
