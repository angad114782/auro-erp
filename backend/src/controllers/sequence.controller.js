import { reserveCode, cancelReservedCode } from "../services/sequence.service.js";

// POST /api/sequences/:name/reserve
export const reserve = async (req, res, next) => {
  try {
    const { name } = req.params; // e.g., "PRJ"
    const seq = await reserveCode(name);
    res.status(201).json({ message: "reserved", data: seq });
  } catch (err) { next(err); }
};

// POST /api/sequences/:id/cancel
export const cancel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const seq = await cancelReservedCode(id);
    res.json({ message: "cancelled", data: seq });
  } catch (err) { next(err); }
};
