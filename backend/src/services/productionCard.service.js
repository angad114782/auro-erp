import ProductionCard from "../models/ProductionCard.model.js";
import mongoose from "mongoose";

export const createProductionCardService = async (
  payload,
  { session, by } = {}
) => {
  const doc = await ProductionCard.create([payload], { session });
  return doc[0];
};

export const listProductionCardsService = async ({
  projectId = null,
  page = 1,
  limit = 50,
} = {}) => {
  const skip = (page - 1) * limit;
  const filter = { isActive: true };
  if (projectId && mongoose.Types.ObjectId.isValid(projectId))
    filter.project = projectId;

  const items = await ProductionCard.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const total = await ProductionCard.countDocuments(filter);
  return { items, total, page, limit };
};

export const getProductionCardService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const doc = await ProductionCard.findById(id).lean();
  return doc;
};
