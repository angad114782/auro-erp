import { PCMaterialRequest } from "../models/pc_materialRequest.model.js";

export async function getMaterialRequests(req, res) {
  try {
    const { projectId } = req.params;
    const items = await PCMaterialRequest.find({ projectId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error("getMaterialRequests error", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function getMaterialRequestById(req, res) {
  try {
    const { projectId, requestId } = req.params;
    const doc = await PCMaterialRequest.findOne({
      _id: requestId,
      projectId,
    }).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error("getMaterialRequestById error", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function updateMaterialRequest(req, res) {
  try {
    const { projectId, requestId } = req.params;
    const body = req.body;
    const updated = await PCMaterialRequest.findOneAndUpdate(
      { _id: requestId, projectId },
      { $set: body },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updateMaterialRequest error", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteMaterialRequest(req, res) {
  try {
    const { projectId, requestId } = req.params;
    const removed = await PCMaterialRequest.findOneAndDelete({
      _id: requestId,
      projectId,
    });
    if (!removed) return res.status(404).json({ error: "Not found" });
    return res.json({ success: true, data: removed });
  } catch (err) {
    console.error("deleteMaterialRequest error", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function fetchmateriallist(req, res) {
  try {
    const items = await PCMaterialRequest.find()
      .populate("productionCardId")
      .populate("projectId")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error("fetchmateriallist error", err);
    return res.status(500).json({ error: err.message });
  }
}
