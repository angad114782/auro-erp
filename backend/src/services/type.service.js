import Type from "../models/Type.model.js";

export const createOrReactivateType = async (name) => {
  // 1) Reactivate if same name exists but inactive
  const reactivated = await Type.findOneAndUpdate(
    { name, isActive: false },
    { $set: { isActive: true } },
    { new: true, collation: { locale: "en", strength: 2 } }
  ).lean();
  if (reactivated) return { action: "reactivated", data: reactivated };

  // 2) If already active, duplicate
  const exists = await Type.findOne(
    { name, isActive: true },
    null,
    { collation: { locale: "en", strength: 2 } }
  ).lean();
  if (exists) return { action: "exists", data: exists };

  // 3) Create fresh
  const created = await Type.create({ name, isActive: true });
  return { action: "created", data: created.toObject() };
};

export const getTypes = async (query = {}) => {
  const {
    includeInactive, // "true" | "false"
    q,               // search by name
    page = 1,
    limit = 50,
  } = query;

  const filter = {};
  if (includeInactive !== "true") filter.isActive = true;
  if (q?.trim()) filter.name = { $regex: q.trim(), $options: "i" };

  const [items, total] = await Promise.all([
    Type.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean(),
    Type.countDocuments(filter),
  ]);

  return { items, total, page: Number(page), limit: Number(limit) };
};

export const getTypeById = async (id) => {
  return Type.findOne({ _id: id, isActive: true }).lean();
};

export const updateTypeById = async (id, payload) => {
  const update = {};
  if (typeof payload.name === "string") update.name = payload.name.trim();
  if (typeof payload.isActive === "boolean") update.isActive = payload.isActive;

  return Type.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true, collation: { locale: "en", strength: 2 } }
  );
};

export const deleteTypeById = async (id) => {
  // soft delete
  return Type.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
};
