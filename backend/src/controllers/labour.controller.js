import { ensureLabour, recomputeSummary } from "../services/cost.service.js";
import { LabourCost } from "../models/labourCost.model.js";
import { ok, fail } from "../utils/http.js";

export async function getLabour(req, res) {
  try {
    const { projectId } = req.params;
    const labour = await ensureLabour(projectId);
    return ok(res, { labour });
  } catch (e) {
    return fail(res, e.message, 400);
  }
}

export async function patchLabour(req, res) {
  try {
    const { projectId } = req.params;
    const { directTotal, items } = req.body;
    const labour = await ensureLabour(projectId);

    if (directTotal !== undefined) labour.directTotal = Math.max(Number(directTotal) || 0, 0);
    if (Array.isArray(items)) labour.items = items.map((i) => ({ name: i.name, cost: Math.max(Number(i.cost)||0, 0) }));

    await labour.save();
    const summary = await recomputeSummary(projectId);
    return ok(res, { labour, summary });
  } catch (e) {
    return fail(res, e.message, 400);
  }
}
