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
        return res
          .status(400)
          .json({ success: false, message: "Invalid credentials" });
      }

      return res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
