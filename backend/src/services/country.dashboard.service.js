import mongoose from "mongoose";
import { Project } from "../models/Project.model.js";

export async function getCountryDashboardService(brandId) {
  const match = { isActive: true };

  if (brandId && brandId !== "all") {
    if (!mongoose.Types.ObjectId.isValid(brandId)) {
      throw new Error("Invalid brandId");
    }
    // NOTE: if your field is brandId instead of brand, change here:
    match.brand = new mongoose.Types.ObjectId(brandId);
    // match.brandId = new mongoose.Types.ObjectId(brandId);
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
