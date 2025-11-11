import {
  initCostSheet, getCostSheet, upsertSummary,
  addItem, updateItem, removeItem, setDepartment,
  addLabour, updateLabour, removeLabour,
  submitSheet, approveSheet, rejectSheet
} from "../services/costsheet.service.js";

export const init = async (req, res, next) => {
  try { res.status(201).json({ message: "initialized", data: await initCostSheet(req.params.projectId) }); }
  catch (e) { next(e); }
};
export const get = async (req, res, next) => {
  try {
    const data = await getCostSheet(req.params.projectId);
    if (!data) return res.status(404).json({ message: "sheet not found" });
    res.json({ message: "ok", data });
  } catch (e) { next(e); }
};

export const saveSummary = async (req, res, next) => {
  try { res.json({ message: "summary saved", data: await upsertSummary(req.params.projectId, req.body) }); }
  catch (e) { next(e); }
};

// items
export const addSectionItem = async (req, res, next) => {
  try { res.status(201).json({ message: "item added", data: await addItem(req.params.projectId, req.params.section, req.body) }); }
  catch (e) { next(e); }
};
export const updateSectionItem = async (req, res, next) => {
  try { res.json({ message: "item updated", data: await updateItem(req.params.projectId, req.params.section, req.params.itemId, req.body) }); }
  catch (e) { next(e); }
};
export const removeSectionItem = async (req, res, next) => {
  try { res.json({ message: "item removed", data: await removeItem(req.params.projectId, req.params.section, req.params.itemId) }); }
  catch (e) { next(e); }
};
export const assignDepartment = async (req, res, next) => {
  try { res.json({ message: "department set", data: await setDepartment(req.params.projectId, req.params.section, req.params.itemId, req.body.department) }); }
  catch (e) { next(e); }
};

// labour
export const addLabourItem = async (req, res, next) => {
  try { res.status(201).json({ message: "labour added", data: await addLabour(req.params.projectId, req.body) }); }
  catch (e) { next(e); }
};
export const updateLabourItem = async (req, res, next) => {
  try { res.json({ message: "labour updated", data: await updateLabour(req.params.projectId, req.params.labourId, req.body) }); }
  catch (e) { next(e); }
};
export const removeLabourItem = async (req, res, next) => {
  try { res.json({ message: "labour removed", data: await removeLabour(req.params.projectId, req.params.labourId) }); }
  catch (e) { next(e); }
};

// status
export const submit = async (req, res, next) => {
  try { res.json({ message: "submitted", data: await submitSheet(req.params.projectId) }); }
  catch (e) { next(e); }
};
export const approve = async (req, res, next) => {
  try { res.json({ message: "approved", data: await approveSheet(req.params.projectId) }); }
  catch (e) { next(e); }
};
export const reject = async (req, res, next) => {
  try { res.json({ message: "rejected", data: await rejectSheet(req.params.projectId, req.body?.reason) }); }
  catch (e) { next(e); }
};
