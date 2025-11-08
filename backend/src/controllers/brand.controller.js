import {
  createBrand,
  getBrands,
  getBrandById,
  updateBrandById,
  deleteBrandById,
} from "../services/brand.service.js";

export const create = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { companyId } = req.params;
    console.log("Creating brand with:", name, companyId);
    if (!name || !companyId) {
      return res.status(400).json({ message: "name and company are required" });
    }

    const brand = await createBrand({ name, company: companyId });
    return res.status(201).json({
      message: "brand created",
      data: brand,
    });
  } catch (err) {
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const brands = await getBrands(req.query);
    return res.json({
      message: "brand list",
      data: brands,
    });
  } catch (err) {
    next(err);
  }
};

export const get = async (req, res, next) => {
  try {
    const brand = await getBrandById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "brand not found" });
    }
    return res.json({
      message: "brand detail",
      data: brand,
    });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const brand = await updateBrandById(req.params.id, req.body);
    if (!brand) {
      return res.status(404).json({ message: "brand not found" });
    }
    return res.json({
      message: "brand updated",
      data: brand,
    });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const brand = await deleteBrandById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "brand not found" });
    }
    return res.json({
      message: "brand deleted",
      data: brand,
    });
  } catch (err) {
    next(err);
  }
};
