import * as service from "../services/country.dashboard.service.js";

export async function countryDashboardController(req, res) {
  try {
    const data = await service.getCountryDashboardService();

    return res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error("countryDashboardController error:", err);
    res.status(500).json({ error: err.message });
  }
}