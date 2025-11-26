import jwt from "jsonwebtoken";

export const authMiddleware = {
  protect(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Not authorized" });

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "my_jwt_secret"
      );
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ message: "Invalid token" });
    }
  },

  role(...allowedRoles) {
    return (req, res, next) => {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      next();
    };
  },
};
