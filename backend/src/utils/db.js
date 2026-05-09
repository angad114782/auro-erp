import mongoose from "mongoose";

export const connectDb = async () => {
  const uri =
    process.env.MONGO_URI ||
    "mongodb+srv://toucantoes01:toucantoes01@cluster0.rutvvoj.mongodb.net/footwear_erp?appName=Cluster0";

  try {
    await mongoose.connect(uri, {
      dbName: "footwear_erp",

      // ── Connection pool ──
      maxPoolSize: 20,
      minPoolSize: 5,

      // ── Timeouts ──
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,

      // ── Wire compression (saves bandwidth to Atlas) ──
      compressors: ["zstd", "zlib"],

      // ── Prevent slow-query stalls ──
      maxIdleTimeMS: 30000,
    });

    console.log("✅ MongoDB connected (pool: 5–20)");
  } catch (err) {
    console.error("❌ Mongo error:", err.message);
    process.exit(1);
  }
};
