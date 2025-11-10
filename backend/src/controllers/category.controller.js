import {
  createOrReactivateCategory,
  getCategoriesForBrand,
  getCategoryByIdForBrand,
  updateCategoryForBrand,
  deleteCategoryForBrand,
} from "../services/category.service.js";

export const create = async (req, res, next) => {
  try {
    const { companyId, brandId } = req.params;
    const name = (req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "name is required" });

    const { action, data } = await createOrReactivateCategory({ companyId, brandId, name });

    if (action === "reactivated") return res.status(200).json({ message: "category reactivated", data });
    if (action === "exists")      return res.status(409).json({ message: "category already exists" });
    return res.status(201).json({ message: "category created", data });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "category already exists" });
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const { companyId, brandId } = req.params;
    const result = await getCategoriesForBrand(companyId, brandId, req.query);
    res.json({ message: "category list", ...result });
  } catch (err) { next(err); }
};

export const get = async (req, res, next) => {
  try {
    const { companyId, brandId, categoryId } = req.params;
    const category = await getCategoryByIdForBrand(companyId, brandId, categoryId);
    if (!category) return res.status(404).json({ message: "category not found" });
    res.json({ message: "category detail", data: category });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const { companyId, brandId, categoryId } = req.params;
    const category = await updateCategoryForBrand(companyId, brandId, categoryId, req.body);
    if (!category) return res.status(404).json({ message: "category not found" });
    res.json({ message: "category updated", data: category });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "category already exists" });
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { companyId, brandId, categoryId } = req.params;
    const category = await deleteCategoryForBrand(companyId, brandId, categoryId);
    if (!category) return res.status(404).json({ message: "category not found" });
    res.json({ message: "category deleted", data: category });
  } catch (err) { next(err); }
};
