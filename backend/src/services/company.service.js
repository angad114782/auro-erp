import Company from "../models/Company.model.js"; // default export recommended

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
  return { action: "created", data: created.toObject() };
};

export const createCompany = async (payload) => {
  return Company.create({ name: payload.name, isActive: true });
};

export const getAllCompanies = async () => {
  return Company.find({ isActive: true }).sort({ createdAt: -1 }).lean();
};

export const getCompanyById = async (id) => {
  return Company.findOne({ _id: id, isActive: true }).lean();
};

export const updateCompanyById = async (id, payload) => {
  return Company.findByIdAndUpdate(
    id,
    { $set: { name: payload.name } },
    { new: true, runValidators: true }
  );
};

export const deleteCompanyById = async (id) => {
  return Company.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
};
