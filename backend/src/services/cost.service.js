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
  // Helper function to parse string to number with decimal preservation
  const parseDecimal = (value) => {
    if (!value) return 0;
    if (typeof value === "string") {
      return parseFloat(value) || 0;
    }
    return Number(value) || 0;
  };

  // Sum functions need to handle string values
  const sumByProjectWithStrings = async (Model, projectId) => {
    const items = await Model.find({ projectId });
    return items.reduce((sum, item) => {
      return sum + parseDecimal(item.cost);
    }, 0);
  };

  const [upper, component, material, packaging, misc] = await Promise.all([
    sumByProjectWithStrings(UpperCostRow, projectId),
    sumByProjectWithStrings(ComponentCostRow, projectId),
    sumByProjectWithStrings(MaterialCostRow, projectId),
    sumByProjectWithStrings(PackagingCostRow, projectId),
    sumByProjectWithStrings(MiscCostRow, projectId),
  ]);

  const labour = await ensureLabour(projectId);
  const labourTotal = parseDecimal(labour.directTotal);

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

  const additionalCosts = parseDecimal(summary.additionalCosts);
  const profitMargin = parseDecimal(summary.profitMargin);

  const totalAllCosts =
    upper + component + material + packaging + misc + labourTotal;

  const subtotal = totalAllCosts + additionalCosts;
  const profitAmount = (subtotal * profitMargin) / 100;
  const tentativeCost = subtotal + profitAmount;

  // Atomic update for computed fields - use toFixed(3) to preserve 3 decimal places
  return CostSummary.findOneAndUpdate(
    { projectId },
    {
      $set: {
        upperTotal: parseFloat(upper.toFixed(3)),
        componentTotal: parseFloat(component.toFixed(3)),
        materialTotal: parseFloat(material.toFixed(3)),
        packagingTotal: parseFloat(packaging.toFixed(3)),
        miscTotal: parseFloat(misc.toFixed(3)),
        labourTotal: parseFloat(labourTotal.toFixed(3)),
        totalAllCosts: parseFloat(totalAllCosts.toFixed(3)),
        profitAmount: parseFloat(profitAmount.toFixed(3)),
        tentativeCost: parseFloat(tentativeCost.toFixed(3)),
      },
    },
    { new: true }
  );
}
