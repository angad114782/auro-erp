import { generateNextCardNumber, createProductionCardWithRequest } from "../services/pc_productionCard.service.js";
import { PCProductionCard } from "../models/pc_productionCard.model.js";
import { PCMaterialRequest } from "../models/pc_materialRequest.model.js";

export async function createProductionCard(req, res) {
  try {
    const body = req.body;
    const userName = req.user?.name || 'Production Manager';

    if (!body.projectId) return res.status(400).json({ error: 'projectId is required' });
    if (!body.cardQuantity || body.cardQuantity <= 0) return res.status(400).json({ error: 'cardQuantity must be > 0' });

    // toggle this to true only if your MongoDB is a replica set (supports transactions)
    const useTransaction = false;

    const result = await createProductionCardWithRequest(body, userName, useTransaction);
    return res.status(201).json({ success: true, data: { productionCard: result.productionCard, materialRequest: result.materialRequest } });
  } catch (err) {
    console.error('createProductionCard error', err);
    if (err && err.name === "ValidationError") {
      return res.status(400).json({ error: "ValidationError", details: err.errors });
    }
    return res.status(500).json({ error: 'Failed to create production card', details: err.message });
  }
}

export async function getProductionCards(req, res) {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 25, status } = req.query;
    const q = { projectId };
    if (status) q.status = status;

    const docs = await PCProductionCard.find(q)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await PCProductionCard.countDocuments(q);
    return res.json({ success: true, data: { items: docs, total } });
  } catch (err) {
    console.error('getProductionCards error', err);
    return res.status(500).json({ error: err.message });
  }
}

export async function getProductionCardById(req, res) {
  try {
    const { projectId, cardId } = req.params;
    const doc = await PCProductionCard.findOne({ _id: cardId, projectId }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error('getProductionCardById error', err);
    return res.status(500).json({ error: err.message });
  }
}

export async function updateProductionCard(req, res) {
  try {
    const { projectId, cardId } = req.params;
    const body = req.body;
    const updated = await PCProductionCard.findOneAndUpdate({ _id: cardId, projectId }, { $set: body }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateProductionCard error', err);
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteProductionCard(req, res) {
  try {
    const { projectId, cardId } = req.params;
    const removed = await PCProductionCard.findOneAndDelete({ _id: cardId, projectId });
    if (!removed) return res.status(404).json({ error: 'Not found' });
    // cascade delete material requests
    await PCMaterialRequest.deleteMany({ productionCardId: removed._id });
    return res.json({ success: true, data: removed });
  } catch (err) {
    console.error('deleteProductionCard error', err);
    return res.status(500).json({ error: err.message });
  }
}

export async function previewNextCardNumber(req, res) {
  try {
    const { projectId } = req.params;
    if (!projectId) return res.status(400).json({ error: 'projectId required' });
    const next = await generateNextCardNumber(projectId);
    return res.json({ success: true, data: { next } });
  } catch (err) {
    console.error('previewNextCardNumber error', err);
    return res.status(500).json({ error: err.message });
  }
}
