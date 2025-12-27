import express from "express";
import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", authMiddleware.protect, (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

export default router;
