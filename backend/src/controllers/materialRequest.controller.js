import { MaterialRequest } from "../models/MaterialRequest.model.js";
import * as inventoryService from "../services/inventory.service.js";
import * as transactionService from "../services/transaction.service.js";

export const createMaterialRequest = async (req, res) => {
  try {
    const payload = req.body;
    const doc = await MaterialRequest.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const listMaterialRequests = async (req,res) => {
  const q = req.query;
  const filter = {};
  if (q.productionCardId) filter.productionCardId = q.productionCardId;
  const list = await MaterialRequest.find(filter);
  res.json(list);
};

export const updateMaterialRequest = async (req,res) => {
  try {
    const id = req.params.id;
    const patch = req.body;

    // if issuing items: patch may contain issued items -> update inventory
    if (patch.issue && Array.isArray(patch.issue)) {
      for (const it of patch.issue) {
        // it = { itemName, itemId (optional), quantityIssued }
        // find InventoryItem by name or id and call updateStock
        if (it.itemId) {
          await inventoryService.updateStockDirect(it.itemId, "remove", it.quantityIssued, /* other params */);
        } else {
          // fallback: find item by name and update
          const item = await inventoryService.findByName(it.itemName);
          if (item) {
            await inventoryService.updateStockDirect(item._id, "remove", it.quantityIssued, ...);
          }
        }
      }
    }

    const updated = await MaterialRequest.findByIdAndUpdate(id, { ...patch, updatedAt: new Date() }, { new: true });
    res.json(updated);
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
};
