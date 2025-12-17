import AssignPerson from "../models/AssignPerson.model.js";
import { Project } from "../models/Project.model.js";
import { PoDetails } from "../models/PoDetails.model.js";

export async function getAssignPersonDashboard() {
  // 1️⃣ Get active assign persons
  const persons = await AssignPerson.find({ isActive: true })
    .select("_id name")
    .lean();

  if (!persons.length) return [];

  const personIds = persons.map(p => p._id);

  // 2️⃣ Count projects per assign person
  const projectCounts = await Project.aggregate([
    { $match: { assignPerson: { $in: personIds } } },
    {
      $group: {
        _id: "$assignPerson",
        totalProjects: { $sum: 1 }
      }
    }
  ]);

  const projectCountMap = {};
  projectCounts.forEach(p => {
    projectCountMap[p._id.toString()] = p.totalProjects;
  });

  // 3️⃣ Count PO approved projects per assign person
  const poApprovedCounts = await Project.aggregate([
    { $match: { assignPerson: { $in: personIds } } },
    {
      $lookup: {
        from: "podetails",
        localField: "_id",
        foreignField: "project",
        as: "po"
      }
    },
    { $unwind: "$po" },
    { $match: { "po.status": "po_approved" } },
    {
      $group: {
        _id: "$assignPerson",
        poApprovedCount: { $sum: 1 }
      }
    }
  ]);

  const poApprovedMap = {};
  poApprovedCounts.forEach(p => {
    poApprovedMap[p._id.toString()] = p.poApprovedCount;
  });

  // 4️⃣ Final dashboard response
  return persons.map(p => ({
    assignPersonId: p._id,
    name: p.name,
    totalProjects: projectCountMap[p._id.toString()] || 0,
    poApprovedProjects: poApprovedMap[p._id.toString()] || 0
  }));
}
