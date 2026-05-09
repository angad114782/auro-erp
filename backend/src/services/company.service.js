import Company from "../models/Company.model.js";
import { cacheWrap, cacheDel } from "../utils/redis.js";

const CACHE_KEY = "master:companies";
const CACHE_TTL = 300; // 5 minutes

export const createOrReactivateCompanyByName = async (name) => {
  // 1) Reactivate if same name but inactive
  const reactivated = await Company.findOneAndUpdate(
    { name, isActive: false },
    { $set: { isActive: true } },
    { new: true, collation: { locale: "en", strength: 2 } }
  ).lean();
  if (reactivated) return { action: "reactivated", data: reactivated };

  // 2) If already active, block
  const exists = await Company.findOne(
    { name, isActive: true },
    null,
    { collation: { locale: "en", strength: 2 } }
  ).lean();
  if (exists) return { action: "exists", data: exists };

  // 3) Create fresh
  const created = await Company.create({ name, isActive: true });
  await cacheDel(CACHE_KEY);
  return { action: "created", data: created.toObject() };
};

export const createCompany = async (payload) => {
  const doc = await Company.create({ name: payload.name, isActive: true });
  await cacheDel(CACHE_KEY);
  return doc;
};

export const getAllCompanies = async () => {
  return cacheWrap(CACHE_KEY, CACHE_TTL, () =>
    Company.find({ isActive: true }).sort({ createdAt: -1 }).lean()
  );
};

export const getCompanyById = async (id) => {
  return Company.findOne({ _id: id, isActive: true }).lean();
};

export const updateCompanyById = async (id, payload) => {
  const doc = await Company.findByIdAndUpdate(
    id,
    { $set: { name: payload.name } },
    { new: true, runValidators: true }
  );
  await cacheDel(CACHE_KEY);
  return doc;
};

export const deleteCompanyById = async (id) => {
  const doc = await Company.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
  await cacheDel(CACHE_KEY);
  return doc;
};
