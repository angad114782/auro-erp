import {
  createProductionCardService,
  listProductionCardsService,
  getProductionCardService,
} from "../services/productionCard.service.js";

export const createProductionCard = async (req, res, next) => {
  try {
    const payload = {
      cardNumber: req.body.cardNumber,
      project: req.body.projectId,
      productName: req.body.productName,
      cardQuantity: req.body.cardQuantity,
      startDate: req.body.startDate,
      assignedPlant: req.body.assignedPlant,
      description: req.body.description,
      specialInstructions: req.body.specialInstructions,
      status: req.body.status || "Draft",
      materialRequestStatus: req.body.materialRequestStatus,
      createdBy: req.user?._id || req.body.createdBy || null,
      materials: req.body.materials || [],
      components: req.body.components || [],
      serverProduction: req.body.serverProductionId || null,
    };

    const created = await createProductionCardService(payload);
    return res
      .status(201)
      .json({ message: "production card created", data: created });
  } catch (err) {
    next(err);
  }
};

export const listProductionCards = async (req, res, next) => {
  try {
    const projectId = req.query.projectId || null;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const result = await listProductionCardsService({ projectId, page, limit });
    return res.json({ message: "production cards list", data: result });
  } catch (err) {
    next(err);
  }
};

export const getProductionCard = async (req, res, next) => {
  try {
    const id = req.params.id;
    const doc = await getProductionCardService(id);
    if (!doc)
      return res.status(404).json({ message: "production card not found" });
    return res.json({ message: "production card", data: doc });
  } catch (err) {
    next(err);
  }
};
