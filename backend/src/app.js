import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middleware/auth.middleware.js";

const app = express();
app.set("etag", false);
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5002",
      process.env.BACKEND_URL,
      process.env.FRONTEND_URL,
    ], // Your frontend URL
    credentials: true, // Allow credentials (cookies)
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// app.use(authMiddleware.protect);
app.use(express.json());
app.use(morgan("dev"));

// uploads ko static bana do
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({ message: "Footwear ERP API is running 🚀" });
});
app.use("/api", (req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});
app.use("/api", routes);

app.use(errorHandler);

export default app;
