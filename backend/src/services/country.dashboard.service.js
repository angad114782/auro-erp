import { Project } from "../models/Project.model.js";

export async function getCountryDashboardService() {
  const result = await Project.aggregate([
    // ✅ only active projects
    {
      $match: { isActive: true }
    },

    // ✅ group by country
    {
      $group: {
        _id: "$country",
        totalProjects: { $sum: 1 }
      }
    },

    // ✅ join country collection
    {
      $lookup: {
        from: "countries",
        localField: "_id",
        foreignField: "_id",
        as: "country"
      }
    },

    { $unwind: "$country" },

    // ✅ final shape
    {
      $project: {
        _id: 0,
        countryId: "$country._id",
        countryName: "$country.name",
        totalProjects: 1
      }
    },

    // optional: sort by count
    { $sort: { totalProjects: -1 } }
  ]);

  return result;
}
