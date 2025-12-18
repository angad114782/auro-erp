import AssignPlant from "../models/CaAssignPlants.model.js";

export const createOrReactivateAssignPlant = async (name) => {
  // 1) Reactivate if exists but inactive
  const reactivated = await AssignPlant.findOneAndUpdate(
    { name, isActive: false },
    { $set: { isActive: true } },
    { new: true, collation: { locale: "en", strength: 2 } }
  ).lean();
  if (reactivated) return { action: "reactivated", data: reactivated };

  // 2) If already active → duplicate
  const exists = await AssignPlant.findOne(
    { name, isActive: true },
    null,
    { collation: { locale: "en", strength: 2 } }
  ).lean();
  if (exists) return { action: "exists", data: exists };

  // 3) Create fresh
  const created = await AssignPlant.create({ name, isActive: true });
  return { action: "created", data: created.toObject() };
};

export const getAssignPlants = async (query = {}) => {
  const {
    includeInactive, // "true" | "false"
    q,               // search by name
    page = 1,
    limit = 50,
    sort = "name",   // "name" | "createdAt"
  } = query;

  const filter = {};
  if (includeInactive !== "true") filter.isActive = true;
  if (q?.trim()) filter.name = { $regex: q.trim(), $options: "i" };

  const [items, total] = await Promise.all([
    AssignPlant.find(filter)
      .sort(sort === "createdAt" ? { createdAt: -1 } : { name: 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean(),
    AssignPlant.countDocuments(filter),
  ]);

  return { items, total, page: Number(page), limit: Number(limit) };
};

export const getAssignPlantById = async (id) => {
  return AssignPlant.findOne({ _id: id, isActive: true }).lean();
};

export const updateAssignPlantById = async (id, payload) => {
  const update = {};
  if (typeof payload.name === "string") update.name = payload.name.trim();
  if (typeof payload.isActive === "boolean") update.isActive = payload.isActive;

  return AssignPlant.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true, collation: { locale: "en", strength: 2 } }
  );
};

export const deleteAssignPlantById = async (id) => {
  // soft delete
  return AssignPlant.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
};
