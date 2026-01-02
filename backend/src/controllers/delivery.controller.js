// src/controllers/delivery.controller.js

import mongoose from "mongoose";
import { Delivery } from "../models/Delivery.model.js";
import * as service from "../services/delivery.service.js";

/* ----------------------------------------------------
   CONTROLLER → CALL SERVICE
---------------------------------------------------- */
export async function sendToDeliveryController(req, res) {
  try {
    const { projectId } = req.params;

    const delivery = await service.sendToDeliveryService(
      projectId,
      req.user?.name || "system"
    );

    return res.json({
      success: true,
      message: "Project moved to Delivery Pending",
      delivery,
    });
  } catch (err) {
    console.error("sendToDeliveryController error:", err);

    // ✅ not a server crash → business rule
    if (String(err.message || "").includes("No new finished quantity")) {
      return res.status(409).json({ success: false, error: err.message });
    }

    if (String(err.message || "").includes("No finished quantity in RFD")) {
      return res.status(400).json({ success: false, error: err.message });
    }

    return res.status(500).json({ success: false, error: err.message });
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

export async function updatedDelivery(req, res) {
  try {
    const { id } = req.params;
    const {
      billNumber,
      deliveryDate,
      lrNumber,
      status,
      remarks,
      sendQuantity,
      updatedBy = "system",
    } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid delivery ID" });
    }

    // Find the delivery
    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return res
        .status(404)
        .json({ success: false, error: "Delivery not found" });
    }

    // Track changes
    const changes = [];
    const now = new Date();

    // Only track changes for editable fields
    const fieldsToTrack = [
      { name: "billNumber", value: billNumber },
      { name: "lrNumber", value: lrNumber },
      { name: "status", value: status },
      { name: "remarks", value: remarks },
      { name: "sendQuantity", value: sendQuantity },
    ];

    fieldsToTrack.forEach(({ name, value }) => {
      if (value !== undefined && delivery[name] !== value) {
        changes.push({
          field: name,
          from: delivery[name],
          to: value,
        });
      }
    });

    // Track delivery date separately
    if (deliveryDate !== undefined) {
      const newDate = deliveryDate ? new Date(deliveryDate) : null;
      const oldDate = delivery.deliveryDate || null;

      // Check if dates are different
      const oldDateStr = oldDate ? oldDate.toISOString() : null;
      const newDateStr = newDate ? newDate.toISOString() : null;

      if (oldDateStr !== newDateStr) {
        changes.push({
          field: "deliveryDate",
          from: oldDate,
          to: newDate,
        });
      }
    }

    // Prepare update data - ONLY update editable fields
    const updateData = {};

    // Update only the editable fields if they are provided
    if (billNumber !== undefined) updateData.billNumber = billNumber;
    if (lrNumber !== undefined) updateData.lrNumber = lrNumber;
    if (status !== undefined) {
      // Validate status
      const validStatuses = ["pending", "parcel_delivered", "delivered"];
      if (validStatuses.includes(status.toLowerCase())) {
        updateData.status = status.toLowerCase();
      } else {
        return res.status(400).json({
          success: false,
          error:
            "Invalid status. Must be one of: pending, parcel_delivered, delivered",
        });
      }
    }
    if (remarks !== undefined) updateData.remarks = remarks;

    // Handle send quantity with decimal support
    if (sendQuantity !== undefined) {
      // Validate send quantity doesn't exceed order quantity (with tolerance)
      if (sendQuantity > delivery.orderQuantity + 0.0001) {
        return res.status(400).json({
          success: false,
          error: "Send quantity cannot exceed order quantity",
        });
      }
      // Validate send quantity is not negative
      if (sendQuantity < 0) {
        return res.status(400).json({
          success: false,
          error: "Send quantity cannot be negative",
        });
      }
      // Round to 4 decimal places to avoid floating point issues
      updateData.sendQuantity = parseFloat(sendQuantity.toFixed(4));
    }

    // Handle delivery date
    if (deliveryDate !== undefined) {
      updateData.deliveryDate = deliveryDate ? new Date(deliveryDate) : null;
    }

    // Calculate aging days if delivery date is updated and poReceivedDate exists
    if (updateData.deliveryDate && delivery.poReceivedDate) {
      const poDate = new Date(delivery.poReceivedDate);
      const delDate = new Date(updateData.deliveryDate);
      const diffTime = Math.abs(delDate - poDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      updateData.agingDays = diffDays;
    } else if (deliveryDate && delivery.poReceivedDate && deliveryDate !== "") {
      const poDate = new Date(delivery.poReceivedDate);
      const delDate = new Date(deliveryDate);
      const diffTime = Math.abs(delDate - poDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      updateData.agingDays = diffDays;
    }

    // If there are changes, add to history
    if (changes.length > 0) {
      updateData.$push = {
        history: {
          date: now,
          changes,
          updatedBy,
        },
      };
    }

    // Perform the update
    const updatedDelivery = await Delivery.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      // Use findOneAndUpdate to properly handle $push with history
      useFindAndModify: false,
    })
      .populate("project", "autoCode artName brand category country gender")
      .populate("poDetails", "poNumber deliveryDate");

    if (!updatedDelivery) {
      return res.status(404).json({
        success: false,
        error: "Delivery not found after update",
      });
    }

    res.json({
      success: true,
      message: "Delivery updated successfully",
      delivery: updatedDelivery,
      changes: changes.length > 0 ? changes : null,
    });
  } catch (error) {
    console.error("Error updating delivery:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: errors,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Duplicate field value entered",
        details: error.keyValue,
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error",
      details: error.message,
    });
  }
}
