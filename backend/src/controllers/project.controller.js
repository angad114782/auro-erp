// controllers/project.controller.js
import {
  createProject,
  getProjects,
  getProjectById,
  updateProjectById,
  deleteProjectById,
} from "../services/project.service.js";

export const create = async (req, res, next) => {
  try {
    const {
      company,
      brand,
      category,
      color,
      artName,
      size,
      gender,
      priority,
      productDesc,
      redSealTargetDate,
      type,
      country,
      assignPerson,
      autoCode,
    } = req.body;

    if (!company || !brand || !category) {
      return res
        .status(400)
        .json({ message: "company, brand, category are required" });
    }
    if (!color) {
      return res.status(400).json({ message: "color is required" });
    }

    // files
    let coverImage = "";
    let sampleImages = [];

    if (req.files?.coverImage?.[0]) {
      coverImage = req.files.coverImage[0].path;
    }
    if (req.files?.sampleImages?.length) {
      sampleImages = req.files.sampleImages.map((f) => f.path);
    }

    const project = await createProject({
      company,
      brand,
      category,
      color,
      artName,
      size,
      gender,
      priority,
      productDesc,
      redSealTargetDate,
      type,
      country,
      assignPerson,
      coverImage,
      sampleImages,
      autoCode,
    });

    return res.status(201).json({ message: "project created", data: project });
  } catch (err) {
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const projects = await getProjects(req.query);
    return res.json({ message: "project list", data: projects });
  } catch (err) {
    next(err);
  }
};

export const get = async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id);
    if (!project) return res.status(404).json({ message: "project not found" });
    return res.json({ message: "project detail", data: project });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const {
      company,
      brand,
      category,
      color,
      artName,
      size,
      gender,
      priority,
      productDesc,
      redSealTargetDate,
      type,
      country,
      assignPerson,
    } = req.body;

    const payload = {
      company,
      brand,
      category,
      color,
      artName,
      size,
      gender,
      priority,
      productDesc,
      redSealTargetDate,
      type,
      country,
      assignPerson,
    };

    if (req.files?.coverImage?.[0]) {
      payload.coverImage = req.files.coverImage[0].path;
    }
    if (req.files?.sampleImages?.length) {
      payload.sampleImages = req.files.sampleImages.map((f) => f.path);
    }

    const project = await updateProjectById(req.params.id, payload);
    if (!project) return res.status(404).json({ message: "project not found" });

    return res.json({ message: "project updated", data: project });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const project = await deleteProjectById(req.params.id);
    if (!project) return res.status(404).json({ message: "project not found" });
    return res.json({ message: "project deleted", data: project });
  } catch (err) {
    next(err);
  }
};
