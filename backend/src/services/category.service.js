import { Category } from "../models/Category.model.js";

export const createCategoryForBrand = async (companyId, brandId, payload) => {
  return await Category.create({
    name: payload.name,
    company: companyId,
    brand: brandId,
  });
};

export const getCategoriesForBrand = async (companyId, brandId) => {
  return await Category.find({ company: companyId, brand: brandId })
    .sort({ createdAt: -1 })
    .select("name company brand");
};

export const getCategoryByIdForBrand = async (
  companyId,
  brandId,
  categoryId
) => {
  return await Category.findOne({
    _id: categoryId,
    company: companyId,
    brand: brandId,
  });
};

export const updateCategoryForBrand = async (
  companyId,
  brandId,
  categoryId,
  payload
) => {
  return await Category.findOneAndUpdate(
    { _id: categoryId, company: companyId, brand: brandId },
    { name: payload.name },
    { new: true }
  );
};

export const deleteCategoryForBrand = async (
  companyId,
  brandId,
  categoryId
) => {
  //
  // return await Category.findOneAndDelete({
  //   _id: categoryId,
  //   company: companyId,
  //   brand: brandId,
  // });
  return await Category.findOneAndUpdate(
    { _id: categoryId, company: companyId, brand: brandId },
    { isActive: false },
    { new: true }
  );
};
