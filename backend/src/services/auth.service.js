import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";

export const authService = {
  async register(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return await User.create({ ...data, password: hashedPassword });
  },

  async login(email, password) {
    const user = await User.findOne({ email });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return false;

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "my_jwt_secret",
      { expiresIn: "7d" }
    );

    return { user, token };
  },
};
