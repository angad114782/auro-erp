import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { User } from "../models/User.model.js";

dotenv.config();

async function seed() {
  await mongoose.connect(
    process.env.MONGO_URI ||
      "mongodb+srv://ecommerce:puneet2001jangra@ecommerce.cpaysu1.mongodb.net/footwear_erp"
  );
  console.log("DB connected");

  const exists = await User.findOne({ email: "superadmin@erp.com" });

  if (exists) {
    console.log("Super Admin already exists");
    process.exit(0);
  }

  const hashed = await bcrypt.hash("superadmin123", 10);

  await User.create({
    name: "Super Admin",
    email: "superadmin@erp.com",
    password: hashed,
    role: "Admin", // OR "SuperAdmin" if you want a new tier
  });

  console.log("Super Admin created ✔");
  process.exit(0);
}

seed();
