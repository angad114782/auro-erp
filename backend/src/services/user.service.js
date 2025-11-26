import { User } from "../models/User.model.js";

export const userService = {
  async getAllUsers(search = "") {
    const query = {
      $or: [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { role: new RegExp(search, "i") },
      ],
    };
    return await User.find(query).sort({ createdAt: -1 });
  },

  async getUser(id) {
    return await User.findById(id);
  },

  async createUser(payload) {
    // password will hash automatically due to pre-save hook
    const user = await User.create(payload);
    user.password = undefined;
    return user;
  },

  async updateUser(id, payload) {
    const user = await User.findById(id);
    if (!user) return null;

    // update simple fields
    user.name = payload.name ?? user.name;
    user.email = payload.email ?? user.email;
    user.role = payload.role ?? user.role;

    // handle password (ONLY hash when provided)
    if (payload.password && payload.password.trim() !== "") {
      user.password = payload.password; // pre-save hook will hash
    }

    await user.save(); // triggers hashing + validation

    user.password = undefined;
    return user;
  },

  async deleteUser(id) {
    return await User.findByIdAndDelete(id);
  },
};
