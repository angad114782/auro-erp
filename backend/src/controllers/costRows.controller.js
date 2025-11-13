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

export async function createRow(req, res) {
  try {
    const { projectId, section } = req.params;
    const { Model } = pickModel(section);
    const { item, description = "", consumption = "", cost = 0, department } = req.body;

    if (!item?.trim()) return fail(res, "item is required");
    if (department && !DEPARTMENTS.includes(department)) return fail(res, "Invalid department");

    await Model.create({ projectId, item, description, consumption, cost, department });

    const summary = await recomputeSummary(projectId);
    return ok(res, { message: "Created", summary }, 201);
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

    await Model.findOneAndUpdate({ _id: rowId, projectId }, payload, { new: true });
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
    if (!cfg.allowDept) return fail(res, "Department tagging not supported for this section", 400);
    if (!DEPARTMENTS.includes(department)) return fail(res, "Invalid department", 400);

    await cfg.Model.findOneAndUpdate({ _id: rowId, projectId }, { department }, { new: true });
    return ok(res, { message: "Department set" });
  } catch (e) {
    return fail(res, e.message, 400);
  }
}
