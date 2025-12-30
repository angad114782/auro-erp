import { Project } from "../models/Project.model.js";
import Brand from "../models/Brand.model.js";
import Category from "../models/Category.model.js";
import { User } from "../models/User.model.js";
import { Vendor } from "../models/Vendor.model.js";
import { InventoryItem } from "../models/InventoryItem.model.js";
import Company from "../models/Company.model.js";
import mongoose from "mongoose";

import { getCountryDashboardService } from "../services/country.dashboard.service.js";
import { getAssignPersonDashboard } from "../services/assignPerson.dashboard.service.js";

export const getDashboard = async (req, res, next) => {
  try {
    const brandId = String(req.query.brandId || "");
    const companyId = String(req.query.companyId || "");

    const projectFilter = { isActive: true };

    // ✅ Apply company filter if provided
    if (companyId && companyId !== "all") {
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid companyId" });
      }
      projectFilter.company = new mongoose.Types.ObjectId(companyId);
    }

    // ✅ Apply brand filter if provided (only after company filter)
    if (brandId && brandId !== "all") {
      if (!mongoose.Types.ObjectId.isValid(brandId)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid brandId" });
      }

      // Also verify that the brand belongs to the selected company
      const brand = await Brand.findOne({
        _id: brandId,
        ...(companyId && companyId !== "all" ? { company: companyId } : {}),
      });

      if (!brand) {
        return res.status(400).json({
          success: false,
          error: "Brand not found or doesn't belong to selected company",
        });
      }

      projectFilter.brand = new mongoose.Types.ObjectId(brandId);
    }

    // Get all companies for the dropdown
    const companies = await Company.find({ isActive: true }).lean();

    // Get brands based on company filter
    let brands = [];
    if (companyId && companyId !== "all") {
      brands = await Brand.find({ company: companyId }).lean();
    } else {
      brands = await Brand.find({}).lean();
    }

    // Get projects with filtering
    const projects = await Project.find(projectFilter)
      .populate([
        { path: "brand", select: "name company" },
        { path: "category", select: "name" },
        { path: "company", select: "name" },
      ])
      .lean();

    // Get categories based on company and brand filters
    let categories = [];
    if (companyId && companyId !== "all") {
      const categoryFilter = { company: companyId };
      if (brandId && brandId !== "all") {
        categoryFilter.brand = brandId;
      }
      categories = await Category.find(categoryFilter).lean();
    } else {
      categories = await Category.find({}).lean();
    }

    const [users, vendors, inventory] = await Promise.all([
      User.find({}).lean(),
      Vendor.find({}).lean(),
      InventoryItem.find({ isDeleted: { $ne: true } }).lean(),
    ]);

    // ✅ analytics (with both filters)
    const [countryDashboard, assignPersonDashboard] = await Promise.all([
      getCountryDashboardService(brandId, companyId),
      getAssignPersonDashboard(brandId, companyId),
    ]);

    return res.json({
      projects: Array.isArray(projects) ? projects : [],
      brands: Array.isArray(brands) ? brands : [],
      categories: Array.isArray(categories) ? categories : [],
      users: Array.isArray(users) ? users : [],
      vendors: Array.isArray(vendors) ? vendors : [],
      inventory: Array.isArray(inventory) ? inventory : [],
      companies: Array.isArray(companies) ? companies : [],
      analytics: {
        countries: Array.isArray(countryDashboard) ? countryDashboard : [],
        assignPersons: Array.isArray(assignPersonDashboard)
          ? assignPersonDashboard
          : [],
      },
      filters: {
        companyId: companyId && companyId !== "all" ? companyId : null,
        brandId: brandId && brandId !== "all" ? brandId : null,
      },
    });
  } catch (err) {
    console.error("dashboard error", err);
    return next(err);
  }
};

export default { getDashboard };
