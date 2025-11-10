// services/brand.service.js
import mongoose from "mongoose";
import Brand from "../models/Brand.model.js";

export const createOrReactivateBrand = async ({ companyId, name }) => {
  // Reactivate if same (company, name) exists but inactive
  const reactivated = await Brand.findOneAndUpdate(
    { company: companyId, name, isActive: false },
    { $set: { isActive: true } },
    { new: true, collation: { locale: "en", strength: 2 } }
  ).populate("company", "name").lean();

  if (reactivated) return { action: "reactivated", data: reactivated };

  // If already active, treat as duplicate
  const exists = await Brand.findOne(
    { company: companyId, name, isActive: true },
    null,
    { collation: { locale: "en", strength: 2 } }
  ).lean();

  if (exists) return { action: "exists", data: exists };

  // Create fresh
  const created = await Brand.create({ company: companyId, name, isActive: true });
  const populated = await Brand.findById(created._id).populate("company", "name").lean();
  return { action: "created", data: populated };
};

export const getBrands = async (query = {}) => {
  const {
    company,                // companyId
    includeInactive,        // "true" | "false"
    q,                      // optional search by name
    limit = 50,
    page = 1,
  } = query;

  const filter = {};
  if (company) filter.company = company;
  if (includeInactive !== "true") filter.isActive = true; // default only active
  if (q?.trim()) filter.name = { $regex: q.trim(), $options: "i" };

  const docs = await Brand.find(filter)
    .populate("company", "name")
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .lean();

  const total = await Brand.countDocuments(filter);

  return { items: docs, total, page: Number(page), limit: Number(limit) };
};

export const getBrandById = async (id) => {
  return Brand.findOne({ _id: id, isActive: true })
    .populate("company", "name")
    .lean();
};

export const updateBrandById = async (id, payload) => {
  // allow moving company and/or renaming; keep isActive if provided
  const update = {};
  if (typeof payload.name === "string") update.name = payload.name.trim();
  if (payload.company) update.company = payload.company;
  if (typeof payload.isActive === "boolean") update.isActive = payload.isActive;

  const updated = await Brand.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true, collation: { locale: "en", strength: 2 } }
  ).populate("company", "name");

  return updated;
};

export const deleteBrandById = async (id) => {
  // soft delete
  return Brand.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true })
    .populate("company", "name");
};
