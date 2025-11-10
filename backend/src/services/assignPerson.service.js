import AssignPerson from "../models/AssignPerson.model.js";

export const createOrReactivateAssignPerson = async (name) => {
  // 1) Reactivate if exists but inactive
  const reactivated = await AssignPerson.findOneAndUpdate(
    { name, isActive: false },
    { $set: { isActive: true } },
    { new: true, collation: { locale: "en", strength: 2 } }
  ).lean();
  if (reactivated) return { action: "reactivated", data: reactivated };

  // 2) If already active → duplicate
  const exists = await AssignPerson.findOne(
    { name, isActive: true },
    null,
    { collation: { locale: "en", strength: 2 } }
  ).lean();
  if (exists) return { action: "exists", data: exists };

  // 3) Create fresh
  const created = await AssignPerson.create({ name, isActive: true });
  return { action: "created", data: created.toObject() };
};

export const getAssignPersons = async (query = {}) => {
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
    AssignPerson.find(filter)
      .sort(sort === "createdAt" ? { createdAt: -1 } : { name: 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean(),
    AssignPerson.countDocuments(filter),
  ]);

  return { items, total, page: Number(page), limit: Number(limit) };
};

export const getAssignPersonById = async (id) => {
  return AssignPerson.findOne({ _id: id, isActive: true }).lean();
};

export const updateAssignPersonById = async (id, payload) => {
  const update = {};
  if (typeof payload.name === "string") update.name = payload.name.trim();
  if (typeof payload.isActive === "boolean") update.isActive = payload.isActive;

  return AssignPerson.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true, collation: { locale: "en", strength: 2 } }
  );
};

export const deleteAssignPersonById = async (id) => {
  // soft delete
  return AssignPerson.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
};
