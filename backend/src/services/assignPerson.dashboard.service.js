import mongoose from "mongoose";
import AssignPerson from "../models/AssignPerson.model.js";
import { Project } from "../models/Project.model.js";

export async function getAssignPersonDashboard(brandId) {
  const persons = await AssignPerson.find({ isActive: true })
    .select("_id name")
    .lean();

  if (!persons.length) return [];

  const personIds = persons.map((p) => p._id);

  // ✅ base match
  const match = {
    assignPerson: { $in: personIds },
    isActive: true,
  };

  // ✅ brand filter apply only if valid and not all
  if (brandId && brandId !== "all") {
    if (!mongoose.Types.ObjectId.isValid(brandId)) {
      throw new Error("Invalid brandId");
    }
    // NOTE: if your field is brandId instead of brand, change here:
    match.brand = new mongoose.Types.ObjectId(brandId);
    // match.brandId = new mongoose.Types.ObjectId(brandId);
  }

  // 1) total projects per assign person
  const projectCounts = await Project.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$assignPerson",
        totalProjects: { $sum: 1 },
      },
    },
  ]);

  const projectCountMap = {};
  projectCounts.forEach((p) => {
    projectCountMap[String(p._id)] = p.totalProjects;
  });

  // 2) PO approved count (same filtered set)
  const poApprovedCounts = await Project.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "podetails",
        localField: "_id",
        foreignField: "project",
        as: "po",
      },
    },
    { $unwind: "$po" },
    { $match: { "po.status": "po_approved" } },
    {
      $group: {
        _id: "$assignPerson",
        poApprovedCount: { $sum: 1 },
      },
    },
  ]);

  const poApprovedMap = {};
  poApprovedCounts.forEach((p) => {
    poApprovedMap[String(p._id)] = p.poApprovedCount;
  });

  return persons.map((p) => ({
    assignPersonId: p._id,
    name: p.name,
    totalProjects: projectCountMap[String(p._id)] || 0,
    poApprovedProjects: poApprovedMap[String(p._id)] || 0,
  }));
}
