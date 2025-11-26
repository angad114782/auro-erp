import { userService } from "../services/user.service.js";

export const userController = {
  async list(req, res) {
    try {
      const { search = "" } = req.query;
      const users = await userService.getAllUsers(search);
      return res.json({ success: true, data: users });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const user = await userService.createUser(req.body);
      return res.json({ success: true, data: user });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      return res.json({ success: true, data: user });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      await userService.deleteUser(req.params.id);
      return res.json({ success: true, message: "User deleted" });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async get(req, res) {
    try {
      const user = await userService.getUser(req.params.id);
      return res.json({ success: true, data: user });
    } catch (err) {
      res.status(404).json({ success: false, message: err.message });
    }
  },
};
