import { getAssignPersonDashboard } from "../services/assignPerson.dashboard.service.js";

export const assignPersonDashboard = async (req, res) => {
  try {
    const data = await getAssignPersonDashboard();

    res.json({
      success: true,
      totalAssignPersons: data.length,
      data
    });
  } catch (err) {
    console.error("assignPersonDashboard error:", err);
    res.status(500).json({ error: err.message });
  }
};
