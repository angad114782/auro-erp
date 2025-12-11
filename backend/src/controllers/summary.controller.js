import { CostSummary } from "../models/costSummary.model.js";
import { ok, fail } from "../utils/http.js";
import { recomputeSummary, ensureSummary } from "../services/cost.service.js";
import mongoose from "mongoose";

export async function getSummary(req, res) {
  try {
    const { projectId } = req.params;

    const {
      UpperCostRow,
      ComponentCostRow,
      MaterialCostRow,
      PackagingCostRow,
      MiscCostRow,
    } = await import("../models/costRow.model.js");
    const { LabourCost } = await import("../models/labourCost.model.js");

    const [upper, comp, mat, pack, misc, labourDoc] = await Promise.all([
      UpperCostRow.countDocuments({ projectId }),
      ComponentCostRow.countDocuments({ projectId }),
      MaterialCostRow.countDocuments({ projectId }),
      PackagingCostRow.countDocuments({ projectId }),
      MiscCostRow.countDocuments({ projectId }),
      LabourCost.findOne({ projectId }),
    ]);

    const hasData =
      upper > 0 ||
      comp > 0 ||
      mat > 0 ||
      pack > 0 ||
      misc > 0 ||
      (labourDoc && labourDoc.items.length > 0);

    if (!hasData) {
      return ok(res, {
        summary: null,
        hasCostData: false,
        message: "No cost data yet",
      });
    }

    const summary = await recomputeSummary(projectId);

    return ok(res, { summary, hasCostData: true });
  } catch (e) {
    return fail(res, e.message);
  }
}

/** ✅ ATOMIC UPSERT PATCH — NO RACE CONDITION */
export async function patchSummary(req, res) {
  try {
    const { projectId } = req.params;

    const update = {};
    if (req.body.additionalCosts !== undefined)
      update.additionalCosts = Math.max(Number(req.body.additionalCosts), 0);

    if (req.body.profitMargin !== undefined)
      update.profitMargin = Math.min(
        Math.max(Number(req.body.profitMargin), 0),
        100
      );

    if (req.body.remarks !== undefined)
      update.remarks = String(req.body.remarks);

    // atomic update, ensures doc exists
    await CostSummary.findOneAndUpdate(
      { projectId },
      { $set: update },
      { upsert: true }
    );

    const fresh = await recomputeSummary(projectId);
    return ok(res, { summary: fresh });
  } catch (e) {
    return fail(res, e.message);
  }
}

/** ✅ FIXED — NO save(), uses atomic update */
export async function approveSummary(req, res) {
  try {
    const { projectId } = req.params;
    const userId = req.user?._id;

    const summary = await recomputeSummary(projectId);
    if (!summary) return fail(res, "No cost data to approve", 400);

    if ((summary.tentativeCost || 0) <= 0)
      return fail(res, "Tentative cost must be > 0", 400);

    const approved = await CostSummary.findOneAndUpdate(
      { projectId },
      {
        $set: {
          status: "ready_for_red_seal",
          approvedAt: new Date(),
          ...(mongoose.isValidObjectId(userId) && { approvedBy: userId }),
        },
      },
      { new: true }
    );

    // Optionally update Project status
    try {
      const Project = mongoose.models.Project;
      if (Project) {
        Project.findByIdAndUpdate(projectId, { status: "red_seal" }).catch(
          () => {}
        );
      }
    } catch {}

    return ok(res, {
      summary: approved,
      message: "Approved & moved to Red Seal",
    });
  } catch (e) {
    return fail(res, e.message);
  }
}
