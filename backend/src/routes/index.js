import { Router } from "express";
import companyRoutes from "./company.routes.js";
import companyBrandRoutes from "./brand.routes.js";
import companyBrandCategoryRoutes from "./companyBrandCategory.routes.js";
import projectRoutes from "./project.routes.js";
import typeRoutes from "./type.routes.js";
import countryRoutes from "./country.routes.js";
import assignPersonRoutes from "./assignPerson.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok111" });
});

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

export default router;
