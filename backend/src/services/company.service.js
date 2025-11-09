// services/company.service.js
import { Company } from "../models/Company.model.js";

export const createCompany = async (payload) => {
  const company = await Company.create({ name: payload.name });
  return company;
};

export const getAllCompanies = async () => {
  return await Company.find().sort({ createdAt: -1 });
};

export const getCompanyById = async (id) => {
  return await Company.findById(id);
};

export const updateCompanyById = async (id, payload) => {
  return await Company.findByIdAndUpdate(
    id,
    { name: payload.name },
    { new: true }
  );
};

export const deleteCompanyById = async (id) => {
  // return await Company.findByIdAndDelete(id);
  return await Company.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
};
