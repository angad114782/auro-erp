import { authService } from "../services/auth.service.js";

export const authController = {
  async register(req, res) {
    try {
      const user = await authService.register(req.body);
      return res.json({ success: true, data: user });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      if (!result) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Set HTTP-only cookie
      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // ✅ recommended for same-site apps
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: { user: result.user }, // ✅ FIX HERE
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
  async logout(req, res) {
    res.clearCookie("token");
    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  },

  async getCurrentUser(req, res) {
    try {
      return res.json({
        success: true,
        data: req.user,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
