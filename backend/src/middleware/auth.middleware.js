import jwt from "jsonwebtoken";

export const authMiddleware = {
  protect(req, res, next) {
    // Get token from HTTP-only cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, please login",
      });
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "my_jwt_secret"
      );
      req.user = decoded;
      next();
    } catch (err) {
      // Clear invalid token
      res.clearCookie("token");
      res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  },

  role(...allowedRoles) {
    return (req, res, next) => {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
      next();
    };
  },
};
