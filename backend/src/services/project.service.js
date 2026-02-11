import mongoose from "mongoose";
import BrandModel from "../models/Brand.model.js";
import CompanyModel from "../models/Company.model.js";
import { PoDetails } from "../models/PoDetails.model.js";
import { Project } from "../models/Project.model.js";
import CategoryModel from "../models/Category.model.js";
import TypeModel from "../models/Type.model.js";
import CountryModel from "../models/Country.model.js";
import AssignPersonModel from "../models/AssignPerson.model.js";
import {
  normalizeProjectStatus,
  requireValidProjectStatus,
  requireValidClientApproval,
  normalizeClientApproval,
} from "../utils/status.util.js";

/** ---------- CREATE ---------- **/
export const createProject = async (payload, { session } = {}) => {
  const doc = {
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

    status: normalizeProjectStatus(payload.status) || undefined,

    productDesc: payload.productDesc,
    redSealTargetDate: payload.redSealTargetDate
      ? new Date(payload.redSealTargetDate)
      : null,

    coverImage: payload.coverImage || "",
    sampleImages: payload.sampleImages || [],
  };

  // Optional business fields on create
  if (payload.clientFinalCost != null) {
    const amt = Number(payload.clientFinalCost);
    if (Number.isFinite(amt) && amt >= 0) doc.clientFinalCost = amt;
  }
  if (payload.clientApproval) {
    const appr = normalizeClientApproval(payload.clientApproval);
    if (appr) doc.clientApproval = appr;
  }
  if (payload.nextUpdate?.date) {
    const d = new Date(payload.nextUpdate.date);
    if (!Number.isNaN(d.getTime())) {
      doc.nextUpdate = {
        date: d,
        note: payload.nextUpdate.note || "",
        by: payload.nextUpdate.by || null,
        at: new Date(),
      };
    }
  }

  const [project] = await Project.create([doc], { session });
  
  // Populate reference fields before returning
  const populatedProject = await Project.findById(project._id)
    .populate("company", "name")
    .populate("brand", "name")
    .populate("category", "name")
    .populate("type", "name")
    .populate("country", "name")
    .populate("assignPerson", "name")
    .session(session);

  return populatedProject;
};

/** ---------- LIST WITH PO INCLUDED ---------- **/
// OPTIMIZED: Single aggregation with $lookup for company/brand search and PO data
export const getProjects = async (query = {}) => {
  const {
    search,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const skip = (Number(page) - 1) * Number(limit);

  // Build match stage for filtering
  const matchStage = { isActive: true };

  // Date filters
  if (query.dateFilter) {
    const now = new Date();
    let startDate;
    let endDate = new Date();

    switch (query.dateFilter) {
      case "today":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case "yesterday":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "last_7_days":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "last_30_days":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        break;
    }

    if (startDate) {
      matchStage.createdAt = { $gte: startDate, $lte: endDate };
    }
  }

  // Custom date range
  if (query.fromDate || query.toDate) {
    const from = query.fromDate ? new Date(query.fromDate) : new Date("1970-01-01");
    const to = query.toDate ? new Date(query.toDate) : new Date();
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    matchStage.createdAt = { $gte: from, $lte: to };
  }

  // Master data filters
  if (query.company) matchStage.company = new mongoose.Types.ObjectId(query.company);
  if (query.brand) matchStage.brand = new mongoose.Types.ObjectId(query.brand);
  if (query.category) matchStage.category = new mongoose.Types.ObjectId(query.category);
  if (query.type) matchStage.type = new mongoose.Types.ObjectId(query.type);
  if (query.country) matchStage.country = new mongoose.Types.ObjectId(query.country);

  // Status filter
  if (query.status) matchStage.status = normalizeProjectStatus(query.status);

  // Priority filter
  if (query.priority) matchStage.priority = query.priority.toLowerCase();

  // Client approval filter
  if (query.clientApproval) {
    matchStage.clientApproval = normalizeClientApproval(query.clientApproval);
  }

  // Cost range filter
  if (query.minCost || query.maxCost) {
    matchStage.clientFinalCost = {};
    if (query.minCost) matchStage.clientFinalCost.$gte = Number(query.minCost);
    if (query.maxCost) matchStage.clientFinalCost.$lte = Number(query.maxCost);
  }

  // Build aggregation pipeline
  const pipeline = [
    // Stage 1: Initial match for non-search filters
    { $match: matchStage },

    // Stage 2: Lookup company for population AND search
    {
      $lookup: {
        from: "companies",
        localField: "company",
        foreignField: "_id",
        as: "companyDoc",
      },
    },
    { $unwind: { path: "$companyDoc", preserveNullAndEmptyArrays: true } },

    // Stage 3: Lookup brand for population AND search
    {
      $lookup: {
        from: "brands",
        localField: "brand",
        foreignField: "_id",
        as: "brandDoc",
      },
    },
    { $unwind: { path: "$brandDoc", preserveNullAndEmptyArrays: true } },

    // Stage 4: Lookup category
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryDoc",
      },
    },
    { $unwind: { path: "$categoryDoc", preserveNullAndEmptyArrays: true } },

    // Stage 5: Lookup type
    {
      $lookup: {
        from: "types",
        localField: "type",
        foreignField: "_id",
        as: "typeDoc",
      },
    },
    { $unwind: { path: "$typeDoc", preserveNullAndEmptyArrays: true } },

    // Stage 6: Lookup country
    {
      $lookup: {
        from: "countries",
        localField: "country",
        foreignField: "_id",
        as: "countryDoc",
      },
    },
    { $unwind: { path: "$countryDoc", preserveNullAndEmptyArrays: true } },

    // Stage 7: Lookup assignPerson
    {
      $lookup: {
        from: "assignpeople",
        localField: "assignPerson",
        foreignField: "_id",
        as: "assignPersonDoc",
      },
    },
    { $unwind: { path: "$assignPersonDoc", preserveNullAndEmptyArrays: true } },

    // Stage 8: Lookup PO details (consolidated from separate query)
    {
      $lookup: {
        from: "podetails",
        localField: "_id",
        foreignField: "project",
        as: "po",
      },
    },
    { $unwind: { path: "$po", preserveNullAndEmptyArrays: true } },
  ];

  // Stage 9: Add search filter AFTER lookups (so we can search on populated names)
  if (search) {
    const regex = new RegExp(search, "i");
    pipeline.push({
      $match: {
        $or: [
          { autoCode: regex },
          { artName: regex },
          { "companyDoc.name": regex },
          { "brandDoc.name": regex },
        ],
      },
    });
  }

  // Use $facet to get both data and count in one query
  pipeline.push({
    $facet: {
      // Paginated results
      data: [
        { $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 } },
        { $skip: skip },
        { $limit: Number(limit) },
        // Project final shape
        {
          $project: {
            _id: 1,
            autoCode: 1,
            artName: 1,
            color: 1,
            size: 1,
            gender: 1,
            priority: 1,
            status: 1,
            productDesc: 1,
            redSealTargetDate: 1,
            coverImage: 1,
            sampleImages: 1,
            clientFinalCost: 1,
            clientApproval: 1,
            nextUpdate: 1,
            statusHistory: 1,
            clientCostHistory: 1,
            colorVariants: 1,
            createdAt: 1,
            updatedAt: 1,
            // Populated refs with just name
            company: { _id: "$companyDoc._id", name: "$companyDoc.name" },
            brand: { _id: "$brandDoc._id", name: "$brandDoc.name" },
            category: { _id: "$categoryDoc._id", name: "$categoryDoc.name" },
            type: { _id: "$typeDoc._id", name: "$typeDoc.name" },
            country: { _id: "$countryDoc._id", name: "$countryDoc.name" },
            assignPerson: { _id: "$assignPersonDoc._id", name: "$assignPersonDoc.name" },
            po: 1,
          },
        },
      ],
      // Total count
      totalCount: [{ $count: "count" }],
    },
  });

  // Execute single aggregation
  const [result] = await Project.aggregate(pipeline);

  const projects = result.data || [];
  const total = result.totalCount[0]?.count || 0;

  return {
    data: projects,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  };
};

/** ---------- GET BY ID WITH PO ---------- **/
export const getProjectById = async (id) => {
  const project = await Project.findOne({ _id: id, isActive: true })
    .populate("company", "name")
    .populate("brand", "name")
    .populate("category", "name")
    .populate("type", "name")
    .populate("country", "name")
    .populate("assignPerson", "name")
    .lean();

  if (!project) return null;

  const po = await PoDetails.findOne({ project: project._id }).lean();
  project.po = po || null;

  return project;
};

/** ---------- UPDATE (PUT) ---------- **/
export const updateProjectById = async (id, payload) => {
  const set = {
    company: payload.company,
    brand: payload.brand,
    category: payload.category,
    type: payload.type || null,
    country: payload.country || null,
    assignPerson: payload.assignPerson || null,
    artName: payload.artName,
    size: payload.size,
    gender: payload.gender,
    priority: payload.priority,
    productDesc: payload.productDesc,
    redSealTargetDate: payload.redSealTargetDate
      ? new Date(payload.redSealTargetDate)
      : null,
    color: payload.color,
  };

  // Only update cover if new one given
  if (payload.coverImage !== undefined) {
    if (payload.keepExistingCover !== true) {
      set.coverImage = payload.coverImage;
    }
  }

  // Only update samples if explicitly passed
  if (payload.sampleImages !== undefined) {
    set.sampleImages = payload.sampleImages;
  }

  if (payload.status) {
    const norm = requireValidProjectStatus(payload.status);
    set.status = norm;
  }

  if (payload.clientFinalCost != null) {
    const amt = Number(payload.clientFinalCost);
    if (!Number.isFinite(amt) || amt < 0) {
      const err = new Error("clientFinalCost must be a non-negative number");
      err.status = 400;
      throw err;
    }
    set.clientFinalCost = amt;
  }

  if (payload.clientApproval) {
    const appr = requireValidClientApproval(payload.clientApproval);
    set.clientApproval = appr;
  }

  if (payload.nextUpdate?.date) {
    const d = new Date(payload.nextUpdate.date);
    if (Number.isNaN(d.getTime())) {
      const err = new Error("invalid nextUpdate.date");
      err.status = 400;
      throw err;
    }
    set.nextUpdate = {
      date: d,
      note: payload.nextUpdate.note || "",
      by: payload.nextUpdate.by || null,
      at: new Date(),
    };
  }

  return Project.findByIdAndUpdate(id, { $set: set }, { new: true })
    .populate("company", "name")
    .populate("brand", "name")
    .populate("category", "name")
    .populate("type", "name")
    .populate("country", "name")
    .populate("assignPerson", "name");
};

/** ---------- SOFT DELETE ---------- **/
export const deleteProjectById = async (id) => {
  return Project.findByIdAndUpdate(
    id,
    { $set: { isActive: false } },
    { new: true }
  );
};

/** ---------- STATUS UPDATE ---------- **/
export const updateProjectStatus = async (id, statusInput, by = null) => {
  const to = requireValidProjectStatus(statusInput);
  const project = await Project.findById(id);
  if (!project || !project.isActive) return null;

  const from = project.status || null;
  project.status = to;
  project.statusHistory.push({ from, to, by, at: new Date() });
  await project.save();

  return await Project.findById(id)
    .populate("company", "name")
    .populate("brand", "name")
    .populate("category", "name")
    .populate("type", "name")
    .populate("country", "name")
    .populate("assignPerson", "name");
};

/** ---------- NEXT UPDATE ---------- **/
export const setProjectNextUpdate = async (id, date, note = "", by = null) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    const err = new Error("invalid date");
    err.status = 400;
    throw err;
  }

  const project = await Project.findById(id);
  if (!project || !project.isActive) return null;

  project.nextUpdate = { date: d, note: note || "", by, at: new Date() };
  await project.save();

  return project;
};

/** ---------- CLIENT COST ---------- **/
export const setProjectClientCost = async (id, { amount, by = null }) => {
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt < 0) {
    const err = new Error("amount must be a non-negative number");
    err.status = 400;
    throw err;
  }
  const project = await Project.findById(id);
  if (!project || !project.isActive) return null;

  project.clientFinalCost = amt;
  project.clientCostHistory.push({ amount: amt, by, at: new Date() });
  await project.save();

  return project;
};

/** ---------- CLIENT APPROVAL ---------- **/
export const setClientApproval = async (id, { status, by = null }) => {
  const appr = requireValidClientApproval(status);
  const project = await Project.findById(id);
  if (!project || !project.isActive) return null;

  project.clientApproval = appr;
  await project.save();
  return project;
};

/** ---------- PO SET/UPDATE ---------- **/
export const setProjectPO = async (id, payload = {}, by = null) => {
  const project = await Project.findById(id);
  if (!project || !project.isActive) return null;

  const now = new Date();
  const qty =
    payload.orderQuantity != null ? Number(payload.orderQuantity) : null;
  const price = payload.unitPrice != null ? Number(payload.unitPrice) : null;

  if (qty != null && (!Number.isFinite(qty) || qty < 0)) {
    const err = new Error("orderQuantity must be a non-negative number");
    err.status = 400;
    throw err;
  }
  if (price != null && (!Number.isFinite(price) || price < 0)) {
    const err = new Error("unitPrice must be a non-negative number");
    err.status = 400;
    throw err;
  }

  const hasPoNumber = (payload.poNumber || "").trim().length > 0;
  const nextStatus = hasPoNumber ? "po_approved" : "po_pending";

  let poDetails = await PoDetails.findOne({ project: id });

  if (poDetails) {
    const prev = poDetails.toObject();

    const effectiveQty = qty != null ? qty : prev.orderQuantity ?? null;
    const effectivePrice = price != null ? price : prev.unitPrice ?? null;

    const totalAmount =
      effectiveQty != null && effectivePrice != null
        ? effectiveQty * effectivePrice
        : prev.totalAmount ?? null;

    poDetails.orderQuantity = effectiveQty;
    poDetails.unitPrice = effectivePrice;
    poDetails.totalAmount = totalAmount;
    poDetails.poNumber = payload.poNumber ?? prev.poNumber ?? "";
    poDetails.status = nextStatus;
    poDetails.deliveryDate = payload.deliveryDate
      ? new Date(payload.deliveryDate)
      : prev.deliveryDate ?? null;

    poDetails.paymentTerms = payload.paymentTerms ?? prev.paymentTerms ?? "";
    poDetails.urgencyLevel =
      payload.urgencyLevel ?? prev.urgencyLevel ?? "Normal";
    poDetails.qualityRequirements =
      payload.qualityRequirements ?? prev.qualityRequirements ?? "";
    poDetails.clientFeedback =
      payload.clientFeedback ?? prev.clientFeedback ?? "";
    poDetails.specialInstructions =
      payload.specialInstructions ?? prev.specialInstructions ?? "";

    poDetails.targetAt = prev.targetAt ?? now;
    poDetails.issuedAt = hasPoNumber
      ? prev.issuedAt ?? now
      : prev.issuedAt ?? null;

    poDetails.updatedBy = by;
    poDetails.updatedAt = now;

    await poDetails.save();
  } else {
    const totalAmount = qty != null && price != null ? qty * price : null;

    poDetails = await PoDetails.create({
      project: id,
      orderQuantity: qty,
      unitPrice: price,
      totalAmount: totalAmount,
      poNumber: payload.poNumber ?? "",
      status: nextStatus,
      deliveryDate: payload.deliveryDate
        ? new Date(payload.deliveryDate)
        : null,
      paymentTerms: payload.paymentTerms ?? "",
      urgencyLevel: payload.urgencyLevel ?? "Normal",
      qualityRequirements: payload.qualityRequirements ?? "",
      clientFeedback: payload.clientFeedback ?? "",
      specialInstructions: payload.specialInstructions ?? "",
      targetAt: now,
      issuedAt: hasPoNumber ? now : null,
      updatedAt: now,
      updatedBy: by,
    });
  }

  const from = project.status || null;
  project.status = nextStatus;
  project.statusHistory.push({ from, to: nextStatus, by, at: now });
  await project.save();

  const populatedProject = await Project.findById(project._id)
    .populate("company brand category type country assignPerson")
    .lean();

  populatedProject.po = poDetails;

  return populatedProject;
};
