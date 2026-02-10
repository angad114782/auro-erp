// routes/cost.routes.js
import { Router } from "express";
import { validateProjectId } from "../middleware/validateProject.js";
import {
  listRows,
  createRow,
  updateRow,
  deleteRow,
  setDepartment,
  getAllCostData,
} from "../controllers/costRows.controller.js";
import { getLabour, patchLabour } from "../controllers/labour.controller.js";
import {
  getSummary,
  patchSummary,
  approveSummary,
} from "../controllers/summary.controller.js";

const r = Router({ mergeParams: true });

const ALLOWED_SECTIONS = new Set([
  "upper",
  "component",
  "material",
  "packaging",
  "miscellaneous",
]);

const DEPARTMENT_ALLOWED = new Set(["upper", "component"]);

function sectionGuard(req, res, next) {
  const { section } = req.params;
  if (!ALLOWED_SECTIONS.has(section)) {
    return res.status(404).json({ message: "Invalid section" });
  }
  return next();
}

function departmentGuard(req, res, next) {
  const { section } = req.params;
  if (!DEPARTMENT_ALLOWED.has(section)) {
    return res
      .status(400)
      .json({ message: "Department tagging allowed only for upper/component" });
  }
  return next();
}

// Project guard
r.use(validateProjectId);

// SUMMARY
r.get("/", getSummary); // GET /projects/:projectId/costs
r.patch("/", patchSummary); // PATCH /projects/:projectId/costs
r.post("/approve", approveSummary);

// LABOUR
r.get("/labour", getLabour);
r.patch("/labour", patchLabour);

// OPTIMIZED: Consolidated endpoint to get all cost data in one request
// Replaces 7 parallel API calls on the frontend
r.get("/all", getAllCostData);

// ROWS (CRUD)
// List + Create
r.get("/:section", sectionGuard, listRows);
r.post("/:section", sectionGuard, createRow);

// Update + Delete a row
r.patch("/:section/:rowId", sectionGuard, updateRow);
r.delete("/:section/:rowId", sectionGuard, deleteRow);

// Department tagging (+ icon) — only for upper/component
r.patch("/:section/:rowId/department", sectionGuard, setDepartment);

export default r;
