import { Project } from "../models/Project.model.js";
import { normalizeProjectStatus, requireValidProjectStatus } from "../utils/status.util.js";

export const createProject = async (payload, { session } = {}) => {
  const [project] = await Project.create([{
    company: payload.company,
    brand: payload.brand,
    category: payload.category,
    autoCode: payload.autoCode || null,

    type: payload.type || null,
    country: payload.country || null,
    assignPerson: payload.assignPerson || null,

    color: payload.color,
    artName: payload.artName,
    size: payload.size,
    gender: payload.gender,
    priority: payload.priority,
    // allow incoming status (normalized) or default
    status: normalizeProjectStatus(payload.status) || undefined,
    productDesc: payload.productDesc,
    redSealTargetDate: payload.redSealTargetDate ? new Date(payload.redSealTargetDate) : null,

    coverImage: payload.coverImage || "",
    sampleImages: payload.sampleImages || [],
  }], { session });

  return project;
};

export const getProjects = async (query = {}) => {
  const filter = { isActive: true };
  if (query.company)  filter.company  = query.company;
  if (query.brand)    filter.brand    = query.brand;
  if (query.category) filter.category = query.category;

  if (query.status) {
    const norm = normalizeProjectStatus(query.status);
    if (norm) filter.status = norm;
    else filter.status = "__no_match__"; // forces empty result for invalid filter
  }

  return Project.find(filter)
    .populate("company", "name")
    .populate("brand", "name")
    .populate("category", "name")
    .populate("type", "name")
    .populate("country", "name")
    .populate("assignPerson", "name")
    .sort({ createdAt: -1 });
};

export const getProjectById = async (id) => {
  return Project.findOne({ _id: id, isActive: true })
    .populate("company", "name")
    .populate("brand", "name")
    .populate("category", "name")
    .populate("type", "name")
    .populate("country", "name")
    .populate("assignPerson", "name");
};

export const updateProjectById = async (id, payload) => {
  const set = {
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
    redSealTargetDate: payload.redSealTargetDate ? new Date(payload.redSealTargetDate) : null,
  };

  if (payload.coverImage) set.coverImage = payload.coverImage;
  if (payload.sampleImages) set.sampleImages = payload.sampleImages;

  // optional status update through PUT
  if (payload.status) {
    const norm = requireValidProjectStatus(payload.status);
    set.status = norm;
  }

  return Project.findByIdAndUpdate(id, { $set: set }, { new: true });
};

export const deleteProjectById = async (id) => {
  return Project.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
};

// ✅ Dedicated status update with history
export const updateProjectStatus = async (id, statusInput, by = null) => {
  const to = requireValidProjectStatus(statusInput);

  const project = await Project.findById(id);
  if (!project || !project.isActive) return null;

  const from = project.status || null;

  project.status = to;
  project.statusHistory.push({ from, to, by, at: new Date() });

  await project.save();
  return project;
};
