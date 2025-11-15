import mongoose from "mongoose";
import SequenceCode from "../models/SequenceCode.model.js";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProjectById,
  deleteProjectById,
  updateProjectStatus,
  setProjectNextUpdate,
  setProjectClientCost,
  setClientApproval,
} from "../services/project.service.js";

export const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const {
        sequenceId,
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
        status,
        clientFinalCost,
        nextUpdate,
        clientApproval,
      } = req.body;

      if (!sequenceId)
        return res.status(400).json({ message: "sequenceId is required" });
      if (!company || !brand || !category)
        return res
          .status(400)
          .json({ message: "company, brand, category are required" });
      if (!color) return res.status(400).json({ message: "color is required" });

      const seq = await SequenceCode.findOne({ _id: sequenceId }).session(
        session
      );
      if (!seq) return res.status(404).json({ message: "sequence not found" });
      if (seq.status !== "reserved")
        return res.status(409).json({ message: "sequence is not reserved" });

      const autoCode = seq.code;

      let coverImage = "";
      let sampleImages = [];
      if (req.files?.coverImage?.[0]) coverImage = req.files.coverImage[0].path;
      if (req.files?.sampleImages?.length) {
        sampleImages = req.files.sampleImages.map((f) => f.path);
      }

      const project = await createProject(
        {
          company,
          brand,
          category,
          autoCode,
          type,
          country,
          assignPerson,
          color,
          artName,
          size,
          gender,
          priority,
          productDesc,
          redSealTargetDate,
          status,
          clientFinalCost,
          nextUpdate,
          clientApproval,
          coverImage,
          sampleImages,
        },
        { session }
      );

      seq.status = "assigned";
      seq.project = project._id;
      seq.assignedAt = new Date();
      await seq.save({ session });

      return res
        .status(201)
        .json({ message: "project created", data: project });
    });
  } catch (err) {
    if (err?.code === 11000)
      return res.status(409).json({ message: "autoCode already exists" });
    next(err);
  } finally {
    session.endSession();
  }
};

export const list = async (req, res, next) => {
  try {
    const projects = await getProjects(req.query);
    return res.json({ message: "project list", data: projects });
  } catch (e) {
    next(e);
  }
};

export const get = async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id);
    if (!project) return res.status(404).json({ message: "project not found" });
    return res.json({ message: "project detail", data: project });
  } catch (e) {
    next(e);
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
      status,
      clientFinalCost,
      nextUpdate,
      clientApproval,
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
      status,
      clientFinalCost,
      nextUpdate,
      clientApproval,
    };
    console.log(payload);
    console.log(req.params.id);

    if (req.files?.coverImage?.[0])
      payload.coverImage = req.files.coverImage[0].path;
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
// ✅ ALTERNATIVE: Dedicated image update endpoint
export const updateImages = async (req, res, next) => {
  try {
    const payload = {};

    // Handle cover image
    if (req.files?.coverImage?.[0]) {
      payload.coverImage = req.files.coverImage[0].path;
    }

    // Handle sample images - replace all
    if (req.files?.sampleImages?.length) {
      payload.sampleImages = req.files.sampleImages.map((f) => f.path);
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    const project = await updateProjectById(req.params.id, payload);
    if (!project) {
      return res.status(404).json({ message: "project not found" });
    }

    return res.json({
      message: "images updated",
      data: {
        _id: project._id,
        coverImage: project.coverImage,
        sampleImages: project.sampleImages,
        updatedAt: project.updatedAt,
      },
    });
  } catch (err) {
    console.error("Image update error:", err);
    next(err);
  }
};
export const remove = async (req, res, next) => {
  try {
    const project = await deleteProjectById(req.params.id);
    if (!project) return res.status(404).json({ message: "project not found" });
    return res.json({ message: "project deleted", data: project });
  } catch (e) {
    next(e);
  }
};

// ---- Atomic PATCH actions ----

// ✅ STATUS (no note)
export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const by = req.user?._id || null;
    if (!status) return res.status(400).json({ message: "status is required" });

    const project = await updateProjectStatus(req.params.id, status, by);
    if (!project) return res.status(404).json({ message: "project not found" });

    return res.json({
      message: "project status updated",
      data: {
        _id: project._id,
        status: project.status,
        statusHistory: project.statusHistory.slice(-5),
        updatedAt: project.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ✅ NEXT UPDATE (date + note)
export const updateNextUpdate = async (req, res, next) => {
  try {
    const { date, note } = req.body; // note ONLY here
    const by = req.user?._id || null;

    const project = await setProjectNextUpdate(req.params.id, date, note, by);
    if (!project) return res.status(404).json({ message: "project not found" });

    return res.json({
      message: "next update scheduled",
      data: {
        _id: project._id,
        nextUpdate: project.nextUpdate,
        updatedAt: project.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ✅ CLIENT FINAL COST (no note)
export const updateClientCost = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const by = req.user?._id || null;

    const project = await setProjectClientCost(req.params.id, { amount, by });
    if (!project) return res.status(404).json({ message: "project not found" });

    return res.json({
      message: "client final cost updated",
      data: {
        _id: project._id,
        clientFinalCost: project.clientFinalCost,
        clientCostHistory: project.clientCostHistory.slice(-5),
        updatedAt: project.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ✅ CLIENT APPROVAL (no note)
export const updateClientApproval = async (req, res, next) => {
  try {
    const { status } = req.body;
    const by = req.user?._id || null;

    const project = await setClientApproval(req.params.id, { status, by });
    if (!project) return res.status(404).json({ message: "project not found" });

    return res.json({
      message: "client approval updated",
      data: {
        _id: project._id,
        clientApproval: project.clientApproval,
        updatedAt: project.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};
