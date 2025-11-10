import {
  createOrReactivateType,
  getTypes,
  getTypeById,
  updateTypeById,
  deleteTypeById,
} from "../services/type.service.js";

export const create = async (req, res, next) => {
  try {
    const name = (req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "name is required" });

    const { action, data } = await createOrReactivateType(name);

    if (action === "reactivated") return res.status(200).json({ message: "type reactivated", data });
    if (action === "exists")      return res.status(409).json({ message: "type already exists" });
    return res.status(201).json({ message: "type created", data });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "type already exists" });
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const result = await getTypes(req.query);
    res.json({ message: "type list", ...result });
  } catch (err) { next(err); }
};

export const get = async (req, res, next) => {
  try {
    const type = await getTypeById(req.params.id);
    if (!type) return res.status(404).json({ message: "type not found" });
    res.json({ message: "type detail", data: type });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const type = await updateTypeById(req.params.id, req.body);
    if (!type) return res.status(404).json({ message: "type not found" });
    res.json({ message: "type updated", data: type });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "type already exists" });
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const type = await deleteTypeById(req.params.id);
    if (!type) return res.status(404).json({ message: "type not found" });
    res.json({ message: "type deleted", data: type });
  } catch (err) { next(err); }
};
