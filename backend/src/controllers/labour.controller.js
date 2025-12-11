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

    let labour = await LabourCost.findOne({ projectId });
    if (!labour) {
      labour = await LabourCost.create({
        projectId,
        directTotal: 0,
        items: [],
      });
    }

    // Update total
    if (directTotal !== undefined) {
      labour.directTotal = Number(directTotal) || 0;
    }

    // Update items
    if (Array.isArray(items)) {
      labour.items = items.map((it) => ({
        _id: it._id || undefined,
        name: it.name,
        cost: Number(it.cost) || 0,
      }));
    }

    await labour.save();

    return res.json({ ok: true, labour });
  } catch (err) {
    console.error("LABOUR PATCH FAILED", err);
    return res.status(400).json({
      ok: false,
      message: err.message || "Failed to save labour data",
    });
  }
}
