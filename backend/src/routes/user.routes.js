import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router({ mergeParams: true });

// LIST USERS
router.get(
  "/",
  authMiddleware.protect,
  authMiddleware.role("Admin", "Manager", "SuperAdmin"),
  userController.list
);

// CREATE USER (Only Admin)
router.post(
  "/",
  authMiddleware.protect,
  authMiddleware.role("Admin", "SuperAdmin"),

  userController.create
);

// UPDATE USER
router.put(
  "/:id",
  authMiddleware.protect,
  authMiddleware.role("Admin", "Manager", "SuperAdmin"),
  userController.update
);

// DELETE (Admin only)
router.delete(
  "/:id",
  authMiddleware.protect,
  authMiddleware.role("SuperAdmin"),
  userController.delete
);

// GET USER
router.get(
  "/:id",
  authMiddleware.protect,
  authMiddleware.role("Admin", "Manager", "Supervisor", "SuperAdmin"),
  userController.get
);

export default router;
