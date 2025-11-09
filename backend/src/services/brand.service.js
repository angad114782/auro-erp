import { Brand } from "../models/Brand.model.js";

export const createBrand = async (payload) => {
  // payload: { name, company }
  const brand = await Brand.create({
    name: payload.name,
    company: payload.company,
  });
  return brand;
};

export const getBrands = async (query = {}) => {
  const filter = {};
  if (query.company) {
    filter.company = query.company;
  }
  if (typeof query.isActive !== "undefined") {
    filter.isActive = query.isActive === "true";
  }

  // populate company name
  return await Brand.find(filter)
    .populate("company", "name")
    .sort({ createdAt: -1 });
};

export const getBrandById = async (id) => {
  return await Brand.findById(id).populate("company", "name");
};

export const updateBrandById = async (id, payload) => {
  return await Brand.findByIdAndUpdate(
    id,
    {
      name: payload.name,
      company: payload.company, // allow move to another company
      isActive: payload.isActive,
    },
    { new: true }
  ).populate("company", "name");
};

export const deleteBrandById = async (id) => {
  // hard delete
  // return await Brand.findByIdAndDelete(id);
  // soft:
  return await Brand.findByIdAndUpdate(id, { isActive: false }, { new: true });
};
