import {
  cloneDefaultToColors,
  getColorVariant,
  upsertColorVariant,
  deleteColorVariant,
} from "../services/colorVariant.service.js";

/**
 * Clone default/base variant into new color variants
 */
export const cloneDefault = async (req, res, next) => {
  try {
    const { colors } = req.body; // ["c_black", "c_white"]

    if (!Array.isArray(colors) || colors.length === 0) {
      return res.status(400).json({ message: "colors array is required" });
    }

    const by = req.user?._id || null;

    const project = await cloneDefaultToColors(req.params.id, colors, by);
    if (!project) {
      return res.status(404).json({ message: "project not found" });
    }

    const keys = Array.from(project.colorVariants?.keys?.() || []);

    return res.status(201).json({
      message: "variants cloned from default",
      data: { keys },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get one color variant from backend
 */
export const getOne = async (req, res, next) => {
  try {
    const data = await getColorVariant(req.params.id, req.params.colorId);

    if (!data) {
      return res.status(404).json({ message: "project not found" });
    }

    return res.json({
      message: "color variant",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create/update (upsert) one color variant + full costing
 */
export const upsertOne = async (req, res, next) => {
  try {
    const {
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
    } = req.body;

    const by = req.user?._id || null;

    const data = await upsertColorVariant(
      req.params.id,
      req.params.colorId,
      {
        materials,
        components,
        images,
        costing,
      },
      by
    );

    if (!data) {
      return res.status(404).json({ message: "project not found" });
    }

    return res.json({
      message: "color variant updated",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete one color variant
 */
export const removeOne = async (req, res, next) => {
  try {
    const ok = await deleteColorVariant(req.params.id, req.params.colorId);

    if (ok === null) {
      return res.status(404).json({ message: "project not found" });
    }

    return res.json({ message: "color variant deleted" });
  } catch (error) {
    next(error);
  }
};
