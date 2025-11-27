// backend/src/utils/seedSuperAdmin.js
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { User } from "../models/User.model.js"; // adjust path if needed

// Read super admin creds from env, fall back to defaults
const SA_NAME = process.env.SA_NAME || "Super Admin";
const SA_EMAIL = process.env.SA_EMAIL || "admin@example.com";
const SA_PASSWORD = process.env.SA_PASSWORD || "P@ssw0rd123";
const SA_ROLE = process.env.SA_ROLE || "SuperAdmin"; // match your auth.role strings

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("ERROR: MONGO_URI not set in .env");
  process.exit(1);
}

async function connectDB() {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

async function seedSuperAdmin() {
  try {
    await connectDB();
    console.log("MongoDB connected");

    // check if a SuperAdmin with same email exists
    let existing = await User.findOne({ email: SA_EMAIL });

    if (existing) {
      // If exists but not SuperAdmin, update role; otherwise update name/password if you want
      if (existing.role !== SA_ROLE) {
        existing.role = SA_ROLE;
        await existing.save();
        console.log(`Existing user (${SA_EMAIL}) role updated to ${SA_ROLE}`);
      } else {
        console.log(`SuperAdmin with email ${SA_EMAIL} already exists. No changes made.`);
      }
    } else {
      // create new user
      const created = await User.create({
        name: SA_NAME,
        email: SA_EMAIL,
        password: SA_PASSWORD, // will be hashed by pre "save" hook in your model
        role: SA_ROLE,
      });

      // hide password for logs
      created.password = undefined;
      console.log("SuperAdmin created:", {
        id: created._id,
        name: created.name,
        email: created.email,
        role: created.role,
      });
    }
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedSuperAdmin();
