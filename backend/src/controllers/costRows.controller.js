import {
  UpperCostRow,
  ComponentCostRow,
  MaterialCostRow,
  PackagingCostRow,
  MiscCostRow,
  DEPARTMENTS,
} from "../models/costRow.model.js";
import { ok, fail } from "../utils/http.js";
import { recomputeSummary } from "../services/cost.service.js";

const map = {
  upper: { Model: UpperCostRow, allowDept: true },
  component: { Model: ComponentCostRow, allowDept: true },
  material: { Model: MaterialCostRow, allowDept: false },
  packaging: { Model: PackagingCostRow, allowDept: false },
  miscellaneous: { Model: MiscCostRow, allowDept: false },
};

function pickModel(section) {
  const cfg = map[section];
  if (!cfg) throw new Error("Invalid section");
  return cfg;
}

export async function listRows(req, res) {
  try {
    const { projectId, section } = req.params;
    const { Model } = pickModel(section);
    const rows = await Model.find({ projectId }).sort({ createdAt: 1 });
    return ok(res, { rows });
  } catch (e) {
    return fail(res, e.message, 400);
  }
}

// OPTIMIZED: Consolidated endpoint to fetch ALL cost data in one request
// Replaces 7 parallel API calls with a single call
export async function getAllCostData(req, res) {
  try {
    const { projectId } = req.params;

    // Parallel fetch all cost sections
    const [upper, component, material, packaging, misc, labour, summary] =
      await Promise.all([
        UpperCostRow.find({ projectId }).sort({ createdAt: 1 }).lean(),
        ComponentCostRow.find({ projectId }).sort({ createdAt: 1 }).lean(),
        MaterialCostRow.find({ projectId }).sort({ createdAt: 1 }).lean(),
        PackagingCostRow.find({ projectId }).sort({ createdAt: 1 }).lean(),
        MiscCostRow.find({ projectId }).sort({ createdAt: 1 }).lean(),
        // Labour - need to import Labour model
        import("../models/labourCost.model.js").then((m) =>
          m.Labour.findOne({ projectId }).lean()
        ),
        // Summary - need to import Summary model
        import("../models/costSummary.model.js").then((m) =>
          m.CostSummary.findOne({ projectId }).lean()
        ),
      ]);

    return ok(res, {
      upper: upper || [],
      component: component || [],
      material: material || [],
      packaging: packaging || [],
      miscellaneous: misc || [],
      labour: labour || { items: [], directTotal: 0 },
      summary: summary || null,
      hasCostData: summary !== null,
    });
  } catch (e) {
    console.error("Error fetching all cost data:", e);
    return fail(res, e.message, 400);
  }
}

export async function createRow(req, res) {
  try {
    const { projectId, section } = req.params;
    const { Model } = pickModel(section);
    const {
      item,
      description = "",
      consumption = "",
      cost = 0,
      department,
    } = req.body;

    if (!item?.trim()) return fail(res, "item is required");
    if (department && !DEPARTMENTS.includes(department))
      return fail(res, "Invalid department");

    // Create and get the created document
    const row = await Model.create({
      projectId,
      item,
      description,
      consumption,
      cost,
      department,
    });

    const summary = await recomputeSummary(projectId);

    // Return both the created row and summary
    return ok(
      res,
      {
        message: "Created",
        row, // Add this line to return the created row
        summary,
      },
      201
    );
  } catch (e) {
    return fail(res, e.message, 400);
  }
}

export async function updateRow(req, res) {
  try {
    const { projectId, section, rowId } = req.params;
    const { Model } = pickModel(section);
    const payload = (({ item, description, consumption, cost }) => ({
      ...(item !== undefined ? { item } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(consumption !== undefined ? { consumption } : {}),
      ...(cost !== undefined ? { cost } : {}),
    }))(req.body);

    await Model.findOneAndUpdate({ _id: rowId, projectId }, payload, {
      new: true,
    });
    const summary = await recomputeSummary(projectId);
    return ok(res, { message: "Updated", summary });
  } catch (e) {
    return fail(res, e.message, 400);
  }
}

export async function deleteRow(req, res) {
  try {
    const { projectId, section, rowId } = req.params;
    const { Model } = pickModel(section);
    await Model.findOneAndDelete({ _id: rowId, projectId });
    const summary = await recomputeSummary(projectId);
    return ok(res, { message: "Deleted", summary });
  } catch (e) {
    return fail(res, e.message, 400);
  }
}

export async function setDepartment(req, res) {
  try {
    const { projectId, section, rowId } = req.params;
    const { department } = req.body;
    const cfg = pickModel(section);
    if (!cfg.allowDept)
      return fail(
        res,
        "Department tagging not supported for this section",
        400
      );
    if (!DEPARTMENTS.includes(department))
      return fail(res, "Invalid department", 400);

    await cfg.Model.findOneAndUpdate(
      { _id: rowId, projectId },
      { department },
      { new: true }
    );
    return ok(res, { message: "Department set" });
  } catch (e) {
    return fail(res, e.message, 400);
  }
}
