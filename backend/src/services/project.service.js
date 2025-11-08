import { Project } from "../models/Project.model.js";

export const createProject = async (payload) => {
  const project = await Project.create({
    company: payload.company,
    brand: payload.brand,
    category: payload.category,

    type: payload.type || null,
    country: payload.country || null,
    assignPerson: payload.assignPerson || null,

    projectName: payload.projectName,
    artName: payload.artName,
    size: payload.size,
    gender: payload.gender,
    priority: payload.priority,
    productDesc: payload.productDesc,
    redSealTargetDate: payload.redSealTargetDate
      ? new Date(payload.redSealTargetDate)
      : null,

    coverImage: payload.coverImage || "",
    sampleImages: payload.sampleImages || [],
  });
  return project;
};

export const getProjects = async (query = {}) => {
  const filter = {};
  if (query.company) filter.company = query.company;
  if (query.brand) filter.brand = query.brand;
  if (query.category) filter.category = query.category;

  return await Project.find(filter)
    .populate("company", "name")
    .populate("brand", "name")
    .populate("category", "name")
    .populate("type", "name")
    .populate("country", "name")
    .populate("assignPerson", "name")
    .sort({ createdAt: -1 });
};

export const getProjectById = async (id) => {
  return await Project.findById(id)
    .populate("company", "name")
    .populate("brand", "name")
    .populate("category", "name")
    .populate("type", "name")
    .populate("country", "name")
    .populate("assignPerson", "name");
};

export const updateProjectById = async (id, payload) => {
  return await Project.findByIdAndUpdate(
    id,
    {
      $set: {
        company: payload.company,
        brand: payload.brand,
        category: payload.category,
        type: payload.type || null,
        country: payload.country || null,
        assignPerson: payload.assignPerson || null,
        projectName: payload.projectName,
        artName: payload.artName,
        size: payload.size,
        gender: payload.gender,
        priority: payload.priority,
        productDesc: payload.productDesc,
        redSealTargetDate: payload.redSealTargetDate
          ? new Date(payload.redSealTargetDate)
          : null,
        ...(payload.coverImage ? { coverImage: payload.coverImage } : {}),
        ...(payload.sampleImages ? { sampleImages: payload.sampleImages } : {}),
      },
    },
    { new: true }
  );
};

export const deleteProjectById = async (id) => {
  return await Project.findByIdAndDelete(id);
};
