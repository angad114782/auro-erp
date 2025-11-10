import Category from "../models/Category.model.js";

export const createOrReactivateCategory = async ({ companyId, brandId, name }) => {
  // 1) Reactivate if same tuple exists but inactive
  const reactivated = await Category.findOneAndUpdate(
    { company: companyId, brand: brandId, name, isActive: false },
    { $set: { isActive: true } },
    { new: true, collation: { locale: "en", strength: 2 } }
  ).populate([{ path: "company", select: "name" }, { path: "brand", select: "name" }]).lean();
  if (reactivated) return { action: "reactivated", data: reactivated };

  // 2) If already active, duplicate
  const exists = await Category.findOne(
    { company: companyId, brand: brandId, name, isActive: true },
    null,
    { collation: { locale: "en", strength: 2 } }
  ).lean();
  if (exists) return { action: "exists",   data: exists };

  // 3) Create fresh
  const created = await Category.create({ company: companyId, brand: brandId, name, isActive: true });
  const populated = await Category.findById(created._id)
    .populate([{ path: "company", select: "name" }, { path: "brand", select: "name" }])
    .lean();
  return { action: "created", data: populated };
};

export const getCategoriesForBrand = async (companyId, brandId, query = {}) => {
  const {
    includeInactive, // "true" | "false"
    q,               // search by name
    page = 1,
    limit = 50,
  } = query;

  const filter = { company: companyId, brand: brandId };
  if (includeInactive !== "true") filter.isActive = true;
  if (q?.trim()) filter.name = { $regex: q.trim(), $options: "i" };

  const [items, total] = await Promise.all([
    Category.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select("name company brand isActive createdAt")
      .populate([{ path: "company", select: "name" }, { path: "brand", select: "name" }])
      .lean(),
    Category.countDocuments(filter),
  ]);

  return { items, total, page: Number(page), limit: Number(limit) };
};

export const getCategoryByIdForBrand = async (companyId, brandId, categoryId) => {
  return Category.findOne({
    _id: categoryId,
    company: companyId,
    brand: brandId,
    isActive: true, // active-only
  })
    .populate([{ path: "company", select: "name" }, { path: "brand", select: "name" }])
    .lean();
};

export const updateCategoryForBrand = async (companyId, brandId, categoryId, payload) => {
  const update = {};
  if (typeof payload.name === "string") update.name = payload.name.trim();
  if (payload.company) update.company = payload.company; // allow moving company/brand
  if (payload.brand)   update.brand   = payload.brand;
  if (typeof payload.isActive === "boolean") update.isActive = payload.isActive;

  return Category.findOneAndUpdate(
    { _id: categoryId, company: companyId, brand: brandId },
    { $set: update },
    { new: true, runValidators: true, collation: { locale: "en", strength: 2 } }
  ).populate([{ path: "company", select: "name" }, { path: "brand", select: "name" }]);
};

export const deleteCategoryForBrand = async (companyId, brandId, categoryId) => {
  // soft delete
  return Category.findOneAndUpdate(
    { _id: categoryId, company: companyId, brand: brandId },
    { $set: { isActive: false } },
    { new: true }
  ).populate([{ path: "company", select: "name" }, { path: "brand", select: "name" }]);
};
