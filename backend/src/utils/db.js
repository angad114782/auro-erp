import mongoose from "mongoose";

export const connectDb = async () => {
  const uri =
    process.env.MONGO_URI ||
    "mongodb+srv://ecommerce:puneet2001jangra@ecommerce.cpaysu1.mongodb.net/footwear_erp";
  // "mongodb+srv://toucantoes01:toucantoes01@cluster0.rutvvoj.mongodb.net/?appName=Cluster0";
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
