import { AssignPerson } from "../models/AssignPerson.model.js";

export const createAssignPerson = async (payload) => {
  return await AssignPerson.create({ name: payload.name });
};

export const getAssignPersons = async () => {
  return await AssignPerson.find().sort({ name: 1 });
};

export const getAssignPersonById = async (id) => {
  return await AssignPerson.findById(id);
};

export const updateAssignPersonById = async (id, payload) => {
  return await AssignPerson.findByIdAndUpdate(
    id,
    { name: payload.name },
    { new: true }
  );
};

export const deleteAssignPersonById = async (id) => {
  return await AssignPerson.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
};
