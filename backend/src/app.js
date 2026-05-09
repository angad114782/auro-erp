import express from "express";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middleware/auth.middleware.js";

const app = express();

// ── Compression (saves ~50% bandwidth on JSON responses) ──
app.use(compression());

// ── ETag for conditional requests (304 Not Modified) ──
// Previously disabled with app.set("etag", false) — re-enabled for perf

app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5002",
      process.env.BACKEND_URL,
      process.env.FRONTEND_URL,
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body parser with size limit (prevents DoS) ──
app.use(express.json({ limit: "2mb" }));

// ── Logger: dev in dev, combined in prod ──
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

// ── Static uploads ──
app.use("/uploads", express.static("uploads"));

// ── Health check ──
app.get("/", (req, res) => {
  res.json({ message: "Footwear ERP API is running 🚀" });
});

// ── Selective cache headers ──
// Master data (rarely changes) → cache 5 min
// Everything else → no-store
const CACHEABLE_PREFIXES = [
  "/api/companies",
  "/api/brands",
  "/api/types",
  "/api/countries",
  "/api/assign-persons",
  "/api/vendors",
  "/api/health",
];

app.use("/api", (req, res, next) => {
  if (
    req.method === "GET" &&
    CACHEABLE_PREFIXES.some((p) => req.path.startsWith(p.replace("/api", "")))
  ) {
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
  } else {
    res.setHeader("Cache-Control", "no-store");
  }
  next();
});

app.use("/api", routes);

// ── Async error handler ──
app.use(errorHandler);

export default app;

