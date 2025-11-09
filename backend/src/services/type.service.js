import { Type } from "../models/Type.model.js";

export const createType = async (payload) => {
  return await Type.create({ name: payload.name });
};

export const getTypes = async () => {
  return await Type.find().sort({ createdAt: -1 });
};

export const getTypeById = async (id) => {
  return await Type.findById(id);
};

export const updateTypeById = async (id, payload) => {
  return await Type.findByIdAndUpdate(
    id,
    { name: payload.name },
    { new: true }
  );
};

export const deleteTypeById = async (id) => {
  // return await Type.findByIdAndDelete(id);
  return await Type.findByIdAndUpdate(id, { isActive: false }, { new: true });
};
