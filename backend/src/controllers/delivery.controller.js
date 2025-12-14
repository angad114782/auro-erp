// src/controllers/delivery.controller.js

import * as service from "../services/delivery.service.js";

/* ----------------------------------------------------
   CONTROLLER → CALL SERVICE
---------------------------------------------------- */
export async function sendToDeliveryController(req, res) {
  try {
    const { projectId } = req.params;

    const delivery = await service.sendToDeliveryService(projectId);

    return res.json({
      success: true,
      message: "Project moved to Delivery Pending",
      delivery,
    });
  } catch (err) {
    console.error("sendToDeliveryController error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function markParcelDeliveredController(req, res) {
  try {
    const { id } = req.params;
    await service.markParcelDelivered(id, req.user?.name || "system");
    res.json({ success: true, message: "Parcel Marked Delivered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function markDeliveredController(req, res) {
  try {
    const { id } = req.params;
    await service.markDelivered(id, req.user?.name || "system");
    res.json({ success: true, message: "Project Fully Delivered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


export async function getPendingDeliveriesController(req, res) {
  try {
    const data = await service.getPendingDeliveries();
    res.json({ success: true, items: data });
  } catch (err) {
    console.error("getPendingDeliveries error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function getParcelDeliveredController(req, res) {
  try {
    const data = await service.getParcelDelivered();
    res.json({ success: true, items: data });
  } catch (err) {
    console.error("getParcelDelivered error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function getDeliveredController(req, res) {
  try {
    const data = await service.getDelivered();
    res.json({ success: true, items: data });
  } catch (err) {
    console.error("getDelivered error:", err);
    res.status(500).json({ error: err.message });
  }
}
