import { Router } from "express";
import sequenceRoutes from "./sequence.routes.js";
import companyRoutes from "./company.routes.js";
import companyBrandRoutes from "./brand.routes.js";
import companyBrandCategoryRoutes from "./companyBrandCategory.routes.js";
import projectRoutes from "./project.routes.js";
import typeRoutes from "./type.routes.js";
import countryRoutes from "./country.routes.js";
import assignPersonRoutes from "./assignPerson.routes.js";
import costRoutes from "./cost.routes.js";
import productionCardRoutes from "./productionCard.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import productionCalendarRouter from "./productionCalendar.routes.js";
import vendorRoutes from "./vendor.route.js";
import pcProdRoutes from "./pc_productionCard.routes.js";
import pcMrRoutes from "./pc_materialRequest.routes.js";
import {
  fetchmateriallist,
  getMaterialRequests,
} from "../controllers/pc_materialRequest.controller.js";
import assignPlantRoutes from "./assignPlant.routes.js";
const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.use("/sequences", sequenceRoutes);
router.use("/companies", companyRoutes);

// /companies/:companyId/brands

router.use("/brands", companyBrandRoutes);

router.use("/companies/:companyId/brands", companyBrandRoutes);

// /companies/:companyId/brands/:brandId/categories
router.use(
  "/companies/:companyId/brands/:brandId/categories",
  companyBrandCategoryRoutes
);

// /companies/:companyId/brands/:brandId/categories/:categoryId/projects
router.use(
  "/companies/:companyId/brands/:brandId/categories/:categoryId/projects",
  projectRoutes
);

// simple masters
router.use("/types", typeRoutes);
router.use("/countries", countryRoutes);
router.use("/assign-persons", assignPersonRoutes);
router.use("/projects", projectRoutes);
router.use("/projects/:projectId/costs", costRoutes);
router.use("/production-cards", productionCardRoutes);

router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/vendors", vendorRoutes);
router.use("/", productionCalendarRouter);
router.use("/dashboard", dashboardRoutes);
router.use("/projects/:projectId/production-cards", pcProdRoutes);
router.use("/projects/:projectId/material-requests", pcMrRoutes);
router.get("/material-requests/all", fetchmateriallist);
router.use("/assign-plant", assignPlantRoutes);


export default router;
