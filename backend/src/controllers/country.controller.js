import {
  createOrReactivateCountry,
  getCountries,
  getCountryById,
  updateCountryById,
  deleteCountryById,
} from "../services/country.service.js";

export const create = async (req, res, next) => {
  try {
    const name = (req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "name is required" });

    const { action, data } = await createOrReactivateCountry(name);

    if (action === "reactivated") return res.status(200).json({ message: "country reactivated", data });
    if (action === "exists")      return res.status(409).json({ message: "country already exists" });
    return res.status(201).json({ message: "country created", data });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "country already exists" });
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const result = await getCountries(req.query);
    res.json({ message: "country list", ...result });
  } catch (err) { next(err); }
};

export const get = async (req, res, next) => {
  try {
    const country = await getCountryById(req.params.id);
    if (!country) return res.status(404).json({ message: "country not found" });
    res.json({ message: "country detail", data: country });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const country = await updateCountryById(req.params.id, req.body);
    if (!country) return res.status(404).json({ message: "country not found" });
    res.json({ message: "country updated", data: country });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "country already exists" });
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const country = await deleteCountryById(req.params.id);
    if (!country) return res.status(404).json({ message: "country not found" });
    res.json({ message: "country deleted", data: country });
  } catch (err) { next(err); }
};
