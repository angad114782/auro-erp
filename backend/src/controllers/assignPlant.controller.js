import {
  createOrReactivateAssignPlant,
  getAssignPlants,
  getAssignPlantById,
  updateAssignPlantById,
  deleteAssignPlantById,
} from "../services/assignPlant.services.js";

export const create = async (req, res, next) => {
  try {
    const name = (req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "name is required" });

    const { action, data } = await createOrReactivateAssignPlant(name);

    if (action === "reactivated") return res.status(200).json({ message: "assign person reactivated", data });
    if (action === "exists")      return res.status(409).json({ message: "assign person already exists" });
    return res.status(201).json({ message: "assign person created", data });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "assign person already exists" });
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const result = await getAssignPlants(req.query);
    res.json({ message: "assign person list", ...result });
  } catch (err) { next(err); }
};

export const get = async (req, res, next) => {
  try {
    const person = await getAssignPlantById(req.params.id);
    if (!person) return res.status(404).json({ message: "assign person not found" });
    res.json({ message: "assign person detail", data: person });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const person = await updateAssignPlantById(req.params.id, req.body);
    if (!person) return res.status(404).json({ message: "assign person not found" });
    res.json({ message: "assign person updated", data: person });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "assign person already exists" });
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const person = await deleteAssignPlantById(req.params.id);
    if (!person) return res.status(404).json({ message: "assign person not found" });
    res.json({ message: "assign person deleted", data: person });
  } catch (err) { next(err); }
};
