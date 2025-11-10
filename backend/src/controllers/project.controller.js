// controllers/project.controller.js
import {
  createProject,
  getProjects,
  getProjectById,
  updateProjectById,
  deleteProjectById,
} from "../services/project.service.js";
import mongoose from "mongoose";
import SequenceCode from "../models/SequenceCode.model.js";

export const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const {
        sequenceId, // <-- REQUIRED
        company, brand, category,
        color, artName, size, gender,
        priority, productDesc, redSealTargetDate,
        type, country, assignPerson
      } = req.body;

      if (!sequenceId) {
        return res.status(400).json({ message: "sequenceId is required" });
      }
      if (!company || !brand || !category) {
        return res.status(400).json({ message: "company, brand, category are required" });
      }
      if (!color) {
        return res.status(400).json({ message: "color is required" });
      }

      // 1) Fetch the reserved sequence & code (and lock intent)
      const seq = await SequenceCode.findOne({ _id: sequenceId }).session(session);
      if (!seq) return res.status(404).json({ message: "sequence not found" });
      if (seq.status !== "reserved") {
        return res.status(409).json({ message: "sequence is not reserved" });
      }
      const autoCode = seq.code; // we will store this in Project.autoCode

      // 2) Files
      let coverImage = "";
      let sampleImages = [];
      if (req.files?.coverImage?.[0]) coverImage = req.files.coverImage[0].path;
      if (req.files?.sampleImages?.length) {
        sampleImages = req.files.sampleImages.map(f => f.path);
      }

      // 3) Create project WITH the autoCode
      const project = await createProject({
        company, brand, category,
        autoCode,                  // <- IMPORTANT
        type, country, assignPerson,
        color, artName, size, gender,
        priority, productDesc, redSealTargetDate,
        coverImage, sampleImages
      }, { session });

      // 4) Mark sequence as assigned to this project
      seq.status = "assigned";
      seq.project = project._id;
      seq.assignedAt = new Date();
      await seq.save({ session });

      // 5) Respond
      return res.status(201).json({ message: "project created", data: project });
    });
  } catch (err) {
    // Unique autoCode clash safety net
    if (err?.code === 11000) {
      return res.status(409).json({ message: "autoCode already exists" });
    }
    next(err);
  } finally {
    session.endSession();
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
