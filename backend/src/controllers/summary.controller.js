import { CostSummary } from "../models/costSummary.model.js";
import { ok, fail } from "../utils/http.js";
import { recomputeSummary, ensureSummary } from "../services/cost.service.js";
import mongoose from "mongoose";

export async function getSummary(req, res) {
  try {
    const { projectId } = req.params;
    await ensureSummary(projectId);
    const summary = await recomputeSummary(projectId);
    return ok(res, { summary });
  } catch (e) {
    return fail(res, e.message, 400);
  }
}

export async function patchSummary(req, res) {
  try {
    const { projectId } = req.params;
    const { additionalCosts, profitMargin, remarks } = req.body;

    const summary = await ensureSummary(projectId);

    if (additionalCosts !== undefined)
      summary.additionalCosts = Math.max(Number(additionalCosts) || 0, 0);
    if (profitMargin !== undefined)
      summary.profitMargin = Math.min(
        Math.max(Number(profitMargin) || 0, 0),
        100
      );
    if (remarks !== undefined) summary.remarks = String(remarks);

    await summary.save();
    const fresh = await recomputeSummary(projectId);
    return ok(res, { summary: fresh });
  } catch (e) {
    return fail(res, e.message, 400);
  }
}

export async function approveSummary(req, res) {
  try {
    const { projectId } = req.params;
    const userId = req.user?._id; // optional if you have auth
    const summary = await recomputeSummary(projectId);

    if ((summary.tentativeCost || 0) <= 0) {
      return fail(res, "Tentative cost must be greater than 0");
    }

    summary.status = "ready_for_red_seal";
    summary.approvedAt = new Date();
    if (mongoose.isValidObjectId(userId)) summary.approvedBy = userId;
    await summary.save();

    // (Optional) mirror status on Project if field exists
    try {
      const { default: mongoosePkg } = await import("mongoose");
      const Project = mongoosePkg.models.Project;
      if (Project) {
        await Project.findByIdAndUpdate(projectId, {
          status: "red_seal",
        }).catch(() => {});
      }
    } catch {}

    return ok(res, { summary, message: "Approved & advanced to Red Seal" });
  } catch (e) {
    return fail(res, e.message, 400);
  }
}
