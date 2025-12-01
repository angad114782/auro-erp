import { Project } from "../models/Project.model.js";
import Brand from "../models/Brand.model.js";
import Category from "../models/Category.model.js";
import { User } from "../models/User.model.js";
import { Vendor } from "../models/Vendor.model.js";
import { InventoryItem } from "../models/InventoryItem.model.js";
import Company from "../models/Company.model.js";

export const getDashboard = async (req, res, next) => {
  try {
    const [projects, brands, categories, users, vendors, inventory, companies] =
      await Promise.all([
        Project.find({ isActive: true })
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
      ]);

    const out = {
      projects: Array.isArray(projects) && projects.length > 0 ? projects : [],
      brands: Array.isArray(brands) && brands.length > 0 ? brands : [],
      categories:
        Array.isArray(categories) && categories.length > 0 ? categories : [],
      users: Array.isArray(users) || users.length > 0 ? users : [],
      vendors: Array.isArray(vendors) || vendors.length > 0 ? vendors : [],
      inventory:
        Array.isArray(inventory) && inventory.length > 0 ? inventory : [],
      companies:
        Array.isArray(companies) && companies.length > 0 ? companies : [],
    };

    return res.json(out);
  } catch (err) {
    console.error("dashboard error", err);
    return next(err);
  }
};

export default { getDashboard };
