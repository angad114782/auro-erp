import mongoose from "mongoose";
import {
  listProductionProjectsService,
  getProductionProjectService,
  updateProductionProjectService,
  deleteProductionProjectService,
} from "../services/productionProject.service.js";

export const listProductionProjects = async (req, res, next) => {
  try {
    // If nested under project id, use req.params.id as projectId; allow query for global listing
    // const projectId = req.params.id || null;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const result = await listProductionProjectsService({ page, limit });
    return res.json({ message: "production list", data: result });
  } catch (err) {
    next(err);
  }
};

export const getProductionProject = async (req, res, next) => {
  try {
    const prodId = req.params.prodId;
    const doc = await getProductionProjectService(prodId);
    if (!doc) return res.status(404).json({ message: "production not found" });
    return res.json({ message: "production detail", data: doc });
  } catch (err) {
    next(err);
  }
};

export const updateProductionProject = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const prodId = req.params.prodId;
      const payload = req.body;
      const by = req.user?._id || null;
      const updated = await updateProductionProjectService(prodId, payload, {
        session,
        by,
      });
      if (!updated)
        return res
          .status(404)
          .json({ message: "production not found or inactive" });
      return res.json({ message: "production updated", data: updated });
    });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

export const deleteProductionProject = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const prodId = req.params.prodId;
      const by = req.user?._id || null;
      const deleted = await deleteProductionProjectService(prodId, {
        session,
        by,
      });
      if (!deleted)
        return res
          .status(404)
          .json({ message: "production not found or already deleted" });
      return res.json({ message: "production soft-deleted", data: deleted });
    });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};
