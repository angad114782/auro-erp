// controllers/brand.controller.js
import mongoose from "mongoose";
import {
  createOrReactivateBrand,
  getBrands,
  getBrandById,
  updateBrandById,
  deleteBrandById,
} from "../services/brand.service.js";

export const create = async (req, res, next) => {
  try {
    const name = (req.body.name || "").trim();
    const companyId = req.params.companyId || req.body.company; // support both
    if (!name || !companyId) {
      return res.status(400).json({ message: "name and company are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: "invalid company id" });
    }

    const { action, data } = await createOrReactivateBrand({ companyId, name });

    if (action === "reactivated") return res.status(200).json({ message: "brand reactivated", data });
    if (action === "exists")      return res.status(409).json({ message: "brand already exists" });
    return res.status(201).json({ message: "brand created", data });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "brand already exists" });
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const result = await getBrands(req.query);
    res.json({ message: "brand list", ...result });
  } catch (err) { next(err); }
};

export const get = async (req, res, next) => {
  try {
    const brand = await getBrandById(req.params.id);
    if (!brand) return res.status(404).json({ message: "brand not found" });
    res.json({ message: "brand detail", data: brand });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const brand = await updateBrandById(req.params.id, req.body);
    if (!brand) return res.status(404).json({ message: "brand not found" });
    res.json({ message: "brand updated", data: brand });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "brand already exists" });
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const brand = await deleteBrandById(req.params.id);
    if (!brand) return res.status(404).json({ message: "brand not found" });
    res.json({ message: "brand deleted", data: brand });
  } catch (err) { next(err); }
};
