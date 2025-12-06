import { Project } from "../models/Project.model.js";

/**
 * Clone default color’s materials/components/images/costing into provided colorIds
 */
export const cloneDefaultToColors = async (
  projectId,
  colorIds = [],
  by = null
) => {
  const project = await Project.findById(projectId);
  if (!project || !project.isActive) return null;

  // Base empty costing structure for new color variants
  const base = {
    materials: [],
    components: [],
    images: [],
    costing: {
      upper: [],
      material: [],
      component: [],
      packaging: [],
      misc: [],
      labour: { items: [], directTotal: 0 },
      summary: {},
    },
  };

  const now = new Date();

  for (const colorId of colorIds) {
    const old = project.colorVariants.get(colorId);

    // Merge existing (if exists) else start empty
    const merged = {
      materials: old?.materials?.length ? old.materials : base.materials,
      components: old?.components?.length ? old.components : base.components,
      images: old?.images?.length ? old.images : base.images,
      costing: old?.costing ? old.costing : base.costing,
      updatedBy: by,
      updatedAt: now,
    };

    project.colorVariants.set(colorId, merged);
  }

  await project.save();
  return project;
};

/**
 * Get one color variant from project
 */
export const getColorVariant = async (projectId, colorId) => {
  const project = await Project.findById(projectId);
  if (!project || !project.isActive) return null;

  const data = project.colorVariants.get(colorId);

  return {
    colorId,
    exists: !!data,
    payload: data || {
      materials: [],
      components: [],
      images: [],
      costing: {
        upper: [],
        material: [],
        component: [],
        packaging: [],
        misc: [],
        labour: { items: [], directTotal: 0 },
        summary: {},
      },
    },
  };
};

/**
 * Create or update a single color variant
 */
export const upsertColorVariant = async (
  projectId,
  colorId,
  {
    materials = [],
    components = [],
    images = [],
    costing = {
      upper: [],
      material: [],
      component: [],
      packaging: [],
      misc: [],
      labour: { items: [], directTotal: 0 },
      summary: {},
    },
  },
  by = null
) => {
  const project = await Project.findById(projectId);
  if (!project || !project.isActive) return null;

  project.colorVariants.set(colorId, {
    materials,
    components,
    images,
    costing,
    updatedBy: by || null,
    updatedAt: new Date(),
  });

  await project.save();
  return {
    colorId,
    payload: project.colorVariants.get(colorId),
  };
};

/**
 * Delete a color variant
 */
export const deleteColorVariant = async (projectId, colorId) => {
  const project = await Project.findById(projectId);
  if (!project || !project.isActive) return null;

  const had = project.colorVariants.delete(colorId);
  if (!had) return false;

  await project.save();
  return true;
};
