import mongoose from "mongoose";

export const connectDb = async () => {
  const uri =
    process.env.MONGO_URI ||
    "mongodb+srv://ecommerce:puneet2001jangra@ecommerce.cpaysu1.mongodb.net/footwear_erp";
  try {
    await mongoose.connect(uri, {
      dbName: "footwear_erp",
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ Mongo error:", err.message);
    process.exit(1);
  }
};
