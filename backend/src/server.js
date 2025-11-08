import "dotenv/config.js";
import http from "http";
import app from "./app.js";
import { connectDb } from "./utils/db.js";

const PORT = process.env.PORT || 5002;

const start = async () => {
  await connectDb();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`🚀 API running on :${PORT}`);
  });

  // graceful shutdown
  const shutdown = () => {
    console.log("⏳ Shutting down...");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

start();
