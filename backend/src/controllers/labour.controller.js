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

    let labour = await ensureLabour(projectId);

    // 1️⃣ Update total
    if (directTotal !== undefined) {
      labour.directTotal = Math.max(Number(directTotal) || 0, 0);
    }

    // 2️⃣ Update items smartly
    if (Array.isArray(items)) {
      const newItems = items.map((i) => {
        if (i._id) {
          return {
            _id: i._id,
            name: i.name.trim(),
            cost: Math.max(Number(i.cost) || 0, 0),
          };
        }
        return {
          name: i.name.trim(),
          cost: Math.max(Number(i.cost) || 0, 0),
        };
      });

      labour.items = newItems;
    }

    await labour.save();

    const summary = await recomputeSummary(projectId);

    return ok(res, { labour, summary });
  } catch (e) {
    console.error("LABOUR UPDATE ERROR:", e);
    return fail(res, e.message, 400);
  }
}
