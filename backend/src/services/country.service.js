import Country from "../models/Country.model.js";
import { cacheWrap, cacheDel } from "../utils/redis.js";

const CACHE_KEY = "master:countries";
const CACHE_TTL = 300;

export const createOrReactivateCountry = async (name) => {
  // 1) Reactivate if exists but inactive
  const reactivated = await Country.findOneAndUpdate(
    { name, isActive: false },
    { $set: { isActive: true } },
    { new: true, collation: { locale: "en", strength: 2 } }
  ).lean();
  if (reactivated) {
    await cacheDel(CACHE_KEY);
    return { action: "reactivated", data: reactivated };
  }

  // 2) If already active, duplicate
  const exists = await Country.findOne(
    { name, isActive: true },
    null,
    { collation: { locale: "en", strength: 2 } }
  ).lean();
  if (exists) return { action: "exists", data: exists };

  // 3) Create fresh
  const created = await Country.create({ name, isActive: true });
  await cacheDel(CACHE_KEY);
  return { action: "created", data: created.toObject() };
};

export const getCountries = async (query = {}) => {
  const { includeInactive, q, page = 1, limit = 50, sort = "name" } = query;
  const cacheKey = `${CACHE_KEY}:${JSON.stringify({ includeInactive, q, page, limit, sort })}`;

  return cacheWrap(cacheKey, CACHE_TTL, async () => {
    const filter = {};
    if (includeInactive !== "true") filter.isActive = true;
    if (q?.trim()) filter.name = { $regex: q.trim(), $options: "i" };

    const [items, total] = await Promise.all([
      Country.find(filter)
        .sort(sort === "createdAt" ? { createdAt: -1 } : { name: 1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Country.countDocuments(filter),
    ]);

    return { items, total, page: Number(page), limit: Number(limit) };
  });
};

export const getCountryById = async (id) => {
  return Country.findOne({ _id: id, isActive: true }).lean();
};

export const updateCountryById = async (id, payload) => {
  const update = {};
  if (typeof payload.name === "string") update.name = payload.name.trim();
  if (typeof payload.isActive === "boolean") update.isActive = payload.isActive;

  const doc = await Country.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true, collation: { locale: "en", strength: 2 } }
  );
  await cacheDel(CACHE_KEY);
  return doc;
};

export const deleteCountryById = async (id) => {
  const doc = await Country.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
  await cacheDel(CACHE_KEY);
  return doc;
};
