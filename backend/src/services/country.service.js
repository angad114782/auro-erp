import { Country } from "../models/Country.model.js";

export const createCountry = async (payload) => {
  return await Country.create({ name: payload.name });
};

export const getCountries = async () => {
  return await Country.find().sort({ name: 1 });
};

export const getCountryById = async (id) => {
  return await Country.findById(id);
};

export const updateCountryById = async (id, payload) => {
  return await Country.findByIdAndUpdate(
    id,
    { name: payload.name },
    { new: true }
  );
};

export const deleteCountryById = async (id) => {
  // return await Country.findByIdAndDelete(id);
  return await Country.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
};
