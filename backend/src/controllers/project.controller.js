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
  setProjectPO,
} from "../services/project.service.js";
import { Project } from "../models/Project.model.js";
import Company from "../models/Company.model.js";
import Brand from "../models/Brand.model.js";
import { createProductionFromProject } from "../services/productionProject.service.js";
import { assignReservedCodeOrNew } from "../services/sequence.service.js";
/** CREATE */
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

      // ---------- VALIDATION ----------
      if (!sequenceId)
        return res.status(400).json({ message: "sequenceId is required" });

      if (!company || !brand || !category)
        return res
          .status(400)
          .json({ message: "company, brand, category are required" });

      if (!color)
        return res.status(400).json({ message: "color is required" });

      // ---------- FILES ----------
      let coverImage = "";
      let sampleImages = [];

      if (req.files?.coverImage?.[0])
        coverImage = req.files.coverImage[0].path;

      if (req.files?.sampleImages?.length)
        sampleImages = req.files.sampleImages.map((f) => f.path);

      // ---------- 🔥 GET SAFE AUTO CODE FIRST ----------
      const seq = await assignReservedCodeOrNew(
        sequenceId,
        null,        // projectId abhi nahi hai
        "PRJ",
        session
      );

      // ---------- CREATE PROJECT WITH autoCode ----------
      const project = await createProject(
        {
          company,
          brand,
          category,
          autoCode: seq.code, // ✅ NOW PROVIDED
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

      // ---------- LINK CODE → PROJECT ----------
      seq.project = project._id;
      seq.status = "assigned";
      seq.assignedAt = new Date();
      await seq.save({ session });

      return res.status(201).json({
        message: "project created",
        data: project,
      });
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ message: "autoCode already exists" });
    }
    next(err);
  } finally {
    session.endSession();
  }
};


export const list = async (req, res, next) => {
  try {
    const result = await getProjects(req.query);
    return res.json(result);
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

/** UPDATE (PUT) */
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
      keepExistingCover, // ✅ NEW: flag to keep existing cover
      keepExistingSamples, // ✅ NEW: existing sample URLs to keep
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
      clientApproval,
      clientFinalCost,
    };

    // Handle nextUpdate
    let nextUpdateRaw = nextUpdate;
    if (Array.isArray(nextUpdateRaw)) {
      nextUpdateRaw = nextUpdateRaw[0];
    }
    if (typeof nextUpdateRaw === "string" && nextUpdateRaw.trim()) {
      try {
        payload.nextUpdate = JSON.parse(nextUpdateRaw);
      } catch (err) {
        console.error("nextUpdate parse error:", err);
      }
    }

    // ✅ FIXED: Handle cover image properly
    if (req.files?.coverImage?.[0]) {
      // New cover image uploaded
      payload.coverImage = req.files.coverImage[0].path;
      payload.keepExistingCover = false;
    } else if (keepExistingCover === "true") {
      // Keep existing cover image (don't change it)
      payload.keepExistingCover = true;
    } else {
      // No cover image (remove it)
      payload.coverImage = null;
      payload.keepExistingCover = false;
    }

    // ✅ FIXED: Handle sample images properly
    const existingSamplesToKeep = [];
    if (keepExistingSamples) {
      try {
        const parsed =
          typeof keepExistingSamples === "string"
            ? JSON.parse(keepExistingSamples)
            : keepExistingSamples;
        existingSamplesToKeep.push(...(Array.isArray(parsed) ? parsed : []));
      } catch (err) {
        console.error("keepExistingSamples parse error:", err);
      }
    }

    const newSamplePaths =
      req.files?.sampleImages?.map((file) => file.path) || [];

    // Combine existing samples with new ones
    payload.sampleImages = [...existingSamplesToKeep, ...newSamplePaths];

    // Update project
    const project = await updateProjectById(req.params.id, payload);
    if (!project) {
      return res.status(404).json({ message: "project not found" });
    }

    return res.json({
      message: "project updated",
      data: project,
    });
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

/** PATCH: STATUS (no note) */
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

/** PATCH: NEXT UPDATE (date + note only here) */
export const updateNextUpdate = async (req, res, next) => {
  try {
    const { date, note } = req.body;
    if (!date) return res.status(400).json({ message: "date is required" });
    const by = req.user?._id || null;

    const project = await setProjectNextUpdate(
      req.params.id,
      date,
      note || "",
      by
    );
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

/** PATCH: CLIENT FINAL COST (no note) */
export const updateClientCost = async (req, res, next) => {
  try {
    const raw = req.body?.amount;
    const amount = typeof raw === "string" ? Number(raw) : raw;
    if (!Number.isFinite(amount) || amount < 0) {
      return res
        .status(400)
        .json({ message: "amount must be a non-negative number" });
    }
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

/** PATCH: CLIENT APPROVAL (no note) */
export const updateClientApproval = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "status is required" });
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

export const updatePO = async (req, res, next) => {
  try {
    const by = req.user?._id || null;
    const updatedProject = await setProjectPO(req?.params?.id, req?.body, by);

    if (!updatedProject)
      return res.status(404).json({ message: "Project not found" });

    // updatedProject already has .po attached by the service
    return res.json({
      message: "PO details saved",
      data: {
        _id: updatedProject._id,
        status: updatedProject.status, // "po_pending" | "po_approved"
        po: updatedProject.po || null, // all PO fields from separate model
        statusHistory: updatedProject.statusHistory?.slice(-5) || [],
        updatedAt: updatedProject.updatedAt,
      },
    });
  } catch (e) {
    next(e);
  }
};

// GET /projects/search?query=abc
export const searchProjects = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.json({ success: true, data: [] });
    }

    // 1. Find matching company IDs
    const companies = await Company.find({
      name: { $regex: query, $options: "i" },
      isActive: true,
    }).select("_id");
    const companyIds = companies.map((c) => c._id);

    // 2. Find matching brand IDs
    const brands = await Brand.find({
      name: { $regex: query, $options: "i" },
      isActive: true,
    }).select("_id");
    const brandIds = brands.map((b) => b._id);

    const projects = await Project.find({
      isActive: true,
      $or: [
        { artName: { $regex: query, $options: "i" } },
        { autoCode: { $regex: query, $options: "i" } },
        { company: { $in: companyIds } },
        { brand: { $in: brandIds } },
      ],
    })
      .limit(25)
      .populate("company", "name")
      .populate("brand", "name")
      .populate("category", "name")
      .populate("type", "name")
      .populate("country", "name")
      .lean();

    res.json({ success: true, data: projects });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const moveToProduction = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const projectId = req.params.id;
      if (!projectId)
        return res.status(400).json({ message: "project id required" });

      const options = {
        initialPlan: req.body?.initialPlan || {},
        force: !!req.body?.force,
        by: req.user?._id || null,
      };

      const result = await createProductionFromProject(projectId, options, {
        session,
      });

      if (!result)
        return res
          .status(404)
          .json({ message: "Project not found or not active" });

      // result contains { project: populatedProject, production: productionDoc }
      return res.status(201).json({
        message: "Project moved to production",
        data: {
          project: result.project,
          production: result.production,
        },
      });
    });
  } catch (err) {
    // handle duplicate / validation errors gracefully
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Production already exists" });
    }
    next(err);
  } finally {
    session.endSession();
  }
};
