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

    const projectFilter = { isActive: true };

    // ✅ ignore "all" / empty
    if (brandId && brandId !== "all") {
      if (!mongoose.Types.ObjectId.isValid(brandId)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid brandId" });
      }

      // ⚠️ If your Project field is brandId, replace "brand" with "brandId"
      projectFilter.brand = new mongoose.Types.ObjectId(brandId);
    }

    const [
      projects,
      brands,
      categories,
      users,
      vendors,
      inventory,
      companies,
      countryDashboard,
      assignPersonDashboard,
    ] = await Promise.all([
      Project.find(projectFilter)
        .populate([
          { path: "brand", select: "name" },
          { path: "category", select: "name" },
          { path: "company", select: "name" },
        ])
        .lean(),

      Brand.find({}).lean(),
      Category.find({}).lean(),
      User.find({}).lean(),
      Vendor.find({}).lean(),
      InventoryItem.find({ isDeleted: { $ne: true } }).lean(),
      Company.find({}).lean(),

      // ✅ analytics (same brandId)
      getCountryDashboardService(brandId),
      getAssignPersonDashboard(brandId),
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
      filters: { brandId: brandId && brandId !== "all" ? brandId : null },
    });
  } catch (err) {
    console.error("dashboard error", err);
    return next(err);
  }
};

export default { getDashboard };
