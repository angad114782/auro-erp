import mongoose from "mongoose";
import { Project } from "../models/Project.model.js";

export async function getCountryDashboardService(brandId, companyId) {
  const match = { isActive: true };

  // ✅ Apply company filter if provided
  if (companyId && companyId !== "all") {
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      throw new Error("Invalid companyId");
    }
    match.company = new mongoose.Types.ObjectId(companyId);
  }

  // ✅ Apply brand filter if provided
  if (brandId && brandId !== "all") {
    if (!mongoose.Types.ObjectId.isValid(brandId)) {
      throw new Error("Invalid brandId");
    }
    match.brand = new mongoose.Types.ObjectId(brandId);
  }

  const result = await Project.aggregate([
    { $match: match },

    { $group: { _id: "$country", totalProjects: { $sum: 1 } } },

    {
      $lookup: {
        from: "countries",
        localField: "_id",
        foreignField: "_id",
        as: "country",
      },
    },

    // ✅ if some projects have no country, avoid crash:
    { $unwind: { path: "$country", preserveNullAndEmptyArrays: false } },

    {
      $project: {
        _id: 0,
        countryId: "$country._id",
        countryName: "$country.name",
        totalProjects: 1,
      },
    },

    { $sort: { totalProjects: -1 } },
  ]);

  return result;
}
