import MicroTracking from "../models/MicroTracking.model.js";
export async function getRowsByDepartment(projectId, department) {
  if (!projectId) throw new Error("projectId required");
  if (!department) throw new Error("department required");

  return await MicroTracking.find({
    projectId,
    department
  })
    .sort({ name: 1 })
    .lean();
}


export async function updateProgressTodayService(id, progressToday, updatedBy = "system") {
  const todayProgress = Number(progressToday || 0);

  const row = await MicroTracking.findById(id);
  if (!row) throw new Error("Row not found");

  const previousDone = Number(row.progressDone || 0);
  const newDone = previousDone + todayProgress;

  const historyEntry = {
    date: new Date(),
    addedToday: todayProgress,
    previousDone,
    newDone,
    updatedBy
  };

  const updated = await MicroTracking.findByIdAndUpdate(
    id,
    {
      $set: {
        progressToday: todayProgress,
        progressDone: newDone,
        updatedAt: new Date()
      },
      $push: { history: historyEntry }
    },
    { new: true }
  ).lean();

  return updated;
}

export async function getDepartmentWiseTrackingService(projectId) {
  if (!projectId) throw new Error("projectId is required");

  const rows = await MicroTracking.find({ projectId }).lean();

  const DEPARTMENTS = [
    "cutting",
    "printing",
    "upper",
    "upper_rej",
    "assembly",
    "packing",
    "rfd",
  ];

  return DEPARTMENTS.map((dept) => {
    const items = rows.filter((r) => r.department === dept);

    let planned = 0;
    let completed = 0;

    for (const it of items) {
      planned += Number(it.requirement || 0);
      completed += Number(it.progressDone || 0);
    }

    const remaining = planned - completed;
    const progress = planned === 0 ? 0 : Math.round((completed / planned) * 100);

    return {
      department: dept,
      planned,
      completed,
      remaining,
      rate: progress,
      progress,
    };
  });
}
