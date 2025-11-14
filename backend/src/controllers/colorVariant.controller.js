import {
  cloneDefaultToColors,
  getColorVariant,
  upsertColorVariant,
  deleteColorVariant,
} from "../services/colorVariant.service.js";

export const cloneDefault = async (req, res, next) => {
  try {
    const { colors } = req.body; // ["c_black","c_white"]
    if (!Array.isArray(colors) || colors.length === 0) {
      return res.status(400).json({ message: "colors array is required" });
    }
    const by = req.user?._id || null;
    const project = await cloneDefaultToColors(req.params.id, colors, by);
    if (!project) return res.status(404).json({ message: "project not found" });

    const keys = Array.from(project.colorVariants?.keys?.() || []);
    return res.status(201).json({ message: "variants cloned from default", data: { keys } });
  } catch (e) { next(e); }
};

export const getOne = async (req, res, next) => {
  try {
    const data = await getColorVariant(req.params.id, req.params.colorId);
    if (!data) return res.status(404).json({ message: "project not found" });
    return res.json({ message: "color variant", data });
  } catch (e) { next(e); }
};

export const upsertOne = async (req, res, next) => {
  try {
    const { materials, components, images } = req.body;
    const by = req.user?._id || null;
    const data = await upsertColorVariant(req.params.id, req.params.colorId, { materials, components, images }, by);
    if (!data) return res.status(404).json({ message: "project not found" });
    return res.json({ message: "color variant updated", data });
  } catch (e) { next(e); }
};

export const removeOne = async (req, res, next) => {
  try {
    const ok = await deleteColorVariant(req.params.id, req.params.colorId);
    if (ok === null) return res.status(404).json({ message: "project not found" });
    return res.json({ message: "color variant deleted" });
  } catch (e) { next(e); }
};
