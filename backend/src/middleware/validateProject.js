import mongoose from "mongoose";
export function validateProjectId(req, res, next) {
  const { projectId } = req.params;
  if (!mongoose.isValidObjectId(projectId)) {
    return res.status(400).json({ ok: false, message: "Invalid projectId" });
  }
  next();
}
