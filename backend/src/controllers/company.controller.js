import {
  createOrReactivateCompanyByName,
  getAllCompanies,
  getCompanyById,
  updateCompanyById,
  deleteCompanyById,
} from "../services/company.service.js";

export const create = async (req, res, next) => {
  try {
    const trimmed = (req.body.name || "").trim();
    if (!trimmed) return res.status(400).json({ message: "name is required" });

    const { action, data } = await createOrReactivateCompanyByName(trimmed);

    if (action === "reactivated") {
      return res.status(200).json({ message: "company reactivated", data });
    }
    if (action === "exists") {
      return res.status(409).json({ message: "company already exists" });
    }
    // created
    return res.status(201).json({ message: "company created", data });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "company already exists" });
    }
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const companies = await getAllCompanies();
    res.json({ message: "company list", data: companies });
  } catch (err) { next(err); }
};

export const get = async (req, res, next) => {
  try {
    const company = await getCompanyById(req.params.id);
    if (!company) return res.status(404).json({ message: "company not found" });
    res.json({ message: "company detail", data: company });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const company = await updateCompanyById(req.params.id, req.body);
    if (!company) return res.status(404).json({ message: "company not found" });
    res.json({ message: "company updated", data: company });
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    const company = await deleteCompanyById(req.params.id);
    if (!company) return res.status(404).json({ message: "company not found" });
    res.json({ message: "company deleted", data: company });
  } catch (err) { next(err); }
};
