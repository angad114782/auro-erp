import { Project } from "../models/Project.model.js";

/** Clone default color's materials/components/images into provided colorIds */
export const cloneDefaultToColors = async (projectId, colorIds = [], by = null) => {
  const project = await Project.findById(projectId);
  if (!project || !project.isActive) return null;

  // default comes from base fields (UI me tum "default" variant bana sakte ho),
  // yahan hum blank variant se bhi clone allow karte hain
  const base = {
    materials:  [],
    components: [],
    images:     [],
  };
  const now = new Date();

  for (const colorId of colorIds) {
    const old = project.colorVariants.get(colorId);
    const merged = {
      materials:  old?.materials?.length ? old.materials : base.materials,
      components: old?.components?.length ? old.components : base.components,
      images:     old?.images?.length ? old.images : base.images,
      updatedBy:  by,
      updatedAt:  now,
    };
    project.colorVariants.set(colorId, merged);
  }

  await project.save();
  return project;
};

export const getColorVariant = async (projectId, colorId) => {
  const project = await Project.findById(projectId);
  if (!project || !project.isActive) return null;

  const data = project.colorVariants.get(colorId);
  return {
    colorId,
    exists: !!data,
    payload: data || { materials: [], components: [], images: [] },
  };
};

export const upsertColorVariant = async (projectId, colorId, { materials = [], components = [], images = [] }, by = null) => {
  const project = await Project.findById(projectId);
  if (!project || !project.isActive) return null;

  project.colorVariants.set(colorId, {
    materials,
    components,
    images,
    updatedBy: by || null,
    updatedAt: new Date(),
  });

  await project.save();
  return { colorId, payload: project.colorVariants.get(colorId) };
};

export const deleteColorVariant = async (projectId, colorId) => {
  const project = await Project.findById(projectId);
  if (!project || !project.isActive) return null;

  const had = project.colorVariants.delete(colorId);
  if (!had) return false;

  await project.save();
  return true;
};
