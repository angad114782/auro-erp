// src/services/delevery.service.js

import { Project } from "../models/Project.model.js";
import { PoDetails } from "../models/PoDetails.model.js";
import { Delivery } from "../models/Delivery.model.js";
import MicroTracking from "../models/MicroTracking.model.js";
import mongoose from "mongoose";

/* ----------------------------------------------------
   RFD READY QTY (MIN SYSTEM)
---------------------------------------------------- */
async function getProjectRfdReadyQty(projectId) {
  const pid = new mongoose.Types.ObjectId(projectId);

  const perCard = await MicroTracking.aggregate([
    { $match: { projectId: pid, isActive: true } },
    { $unwind: "$rows" },
    {
      $match: {
        "rows.isActive": true,
        "rows.department": "rfd",
      },
    },
    {
      $group: {
        _id: "$cardId",
        ready: { $min: { $ifNull: ["$rows.completedQty", 0] } },
        rowsCount: { $sum: 1 },
      },
    },
  ]);

  const totalReady = perCard.reduce(
    (sum, c) => sum + Number(c.ready || 0),
    0
  );

  return { totalReady, perCard };
}

/* ----------------------------------------------------
   HISTORY PUSH HELPER
---------------------------------------------------- */
async function addDeliveryHistory(deliveryId, changes, updatedBy = "system") {
  await Delivery.findByIdAndUpdate(deliveryId, {
    $push: {
      history: {
        date: new Date(),
        changes,
        updatedBy,
      },
    },
  });
}

/* ----------------------------------------------------
   AUTO STATUS CALC (NO MANUAL STATUS)
---------------------------------------------------- */
export async function recalcDeliveryStatusAndSyncProject(
  deliveryId,
  user = "system"
) {
  const delivery = await Delivery.findById(deliveryId).lean();
  if (!delivery) return null;

  const po = delivery.poDetails
    ? await PoDetails.findById(delivery.poDetails).lean()
    : await PoDetails.findOne({ project: delivery.project }).lean();

  const poQty = Number(po?.orderQuantity || 0);
  const fallbackQty = Number(delivery.orderQuantity || 0);
  const targetQty = poQty > 0 ? poQty : fallbackQty;

  const sent = Number(delivery.sendQuantity || 0);

  let newStatus = "parcel_delivered";
  if (sent > 0 && sent < targetQty) newStatus = "parcel_delivered";
  if (targetQty > 0 && sent >= targetQty) newStatus = "delivered";

  if (newStatus !== delivery.status) {
    await Delivery.findByIdAndUpdate(deliveryId, {
      status: newStatus,
      updatedAt: new Date(),
      $push: {
        history: {
          date: new Date(),
          updatedBy: user,
          changes: [
            { field: "status", from: delivery.status, to: newStatus },
          ],
        },
      },
    });
  }

  const projectStatusMap = {
    pending: "delivery_pending",
    parcel_delivered: "parcel_delivered",
    delivered: "delivered",
  };

  await Project.findByIdAndUpdate(delivery.project, {
    status: projectStatusMap[newStatus],
  });

  return newStatus;
}

/* ----------------------------------------------------
   SEND PROJECT TO DELIVERY (AUTO)
---------------------------------------------------- */
export async function sendToDeliveryService(projectId, user = "system") {
  const project = await Project.findById(projectId)
    .populate("company", "name")
    .populate("brand", "name")
    .populate("category", "name")
    .populate("country", "name")
    .lean();

  if (!project) throw new Error("Project not found");

  const po = await PoDetails.findOne({ project: projectId }).lean();
  const { totalReady } = await getProjectRfdReadyQty(projectId);

  if (totalReady <= 0) {
    throw new Error(
      "No finished quantity in RFD. Nothing to send for delivery."
    );
  }

  let existing = await Delivery.findOne({
    project: projectId,
    poDetails: po?._id || null,
  });

  if (existing) {
    await recalcDeliveryStatusAndSyncProject(existing._id, user);
    const fresh = await Delivery.findById(existing._id).lean();
    if (fresh?.status === "delivered") {
      throw new Error(
        "This PO is already fully delivered. Create a new PO to send again."
      );
    }
  }

  const alreadySent = Number(existing?.orderQuantity || 0);
  let delta = totalReady - alreadySent;

  const poQty = Number(po?.orderQuantity || 0);
  if (poQty > 0) {
    delta = Math.min(delta, poQty - alreadySent);
  }

  if (delta <= 0) {
    throw new Error("No new finished quantity since last send.");
  }

  await Project.findByIdAndUpdate(projectId, { status: "delivery_pending" });

  const today = new Date();
  const poReceived = po?.issuedAt || today;
  const agingDays = Math.ceil(
    (today - poReceived) / (1000 * 60 * 60 * 24)
  );

  if (existing) {
    const newQty = alreadySent + delta;

    const updated = await Delivery.findByIdAndUpdate(
      existing._id,
      {
        orderQuantity: newQty,
        agingDays,
        $push: {
          history: {
            date: new Date(),
            updatedBy: user,
            changes: [
              { field: "orderQuantity", from: alreadySent, to: newQty },
              { field: "rfdReadyQuantity", from: alreadySent, to: totalReady },
            ],
          },
        },
      },
      { new: true }
    );

    await recalcDeliveryStatusAndSyncProject(updated._id, user);

    return await Delivery.findById(updated._id)
      .populate("project", "autoCode artName brand category country gender")
      .populate("poDetails", "poNumber deliveryDate")
      .lean();
  }

  const created = await Delivery.create({
    project: projectId,
    poDetails: po?._id || null,

    projectCode: project.autoCode,
    productName: project.artName,
    category: project.category?.name || "",
    brand: project.brand?.name || "",
    company: project.company?.name || "",
    gender: project.gender || "",

    poNumber: po?.poNumber || "",
    poReceivedDate: po?.issuedAt || null,
    deliveryDateExpected: po?.deliveryDate || null,

    orderQuantity: delta,
    status: "pending",
    agingDays,

    history: [
      {
        date: new Date(),
        updatedBy: user,
        changes: [
          { field: "orderQuantity", from: 0, to: delta },
          { field: "rfdReadyQuantity", from: 0, to: totalReady },
        ],
      },
    ],
  });

  await recalcDeliveryStatusAndSyncProject(created._id, user);

  return await Delivery.findById(created._id)
    .populate("project", "autoCode artName brand category country gender")
    .populate("poDetails", "poNumber deliveryDate")
    .lean();
}

/* ----------------------------------------------------
   ❌ MANUAL STATUS DISABLED
---------------------------------------------------- */
export async function markParcelDelivered() {
  throw new Error("Manual status update disabled. Status is automatic now.");
}

export async function markDelivered() {
  throw new Error("Manual status update disabled. Status is automatic now.");
}

/* ----------------------------------------------------
   LIST APIs
---------------------------------------------------- */
export async function getParcelDelivered() {
  const items = await Delivery.find({ status: "parcel_delivered" })
    .populate("project", "autoCode artName brand category country gender")
    .populate("poDetails", "poNumber deliveryDate orderQuantity issuedAt")
    .lean();

  return items.map((d) => {
    const poQty = Number(d?.poDetails?.orderQuantity || 0);
    return {
      ...d,
      orderQuantity: poQty > 0 ? poQty : Number(d.orderQuantity || 0),
      rfdReadyQuantity: Number(d.orderQuantity || 0),
    };
  });
}

export async function getPendingDeliveries() {
  const items = await Delivery.find({ status: "pending" })
    .populate("project", "autoCode artName brand category country gender")
    .populate("poDetails", "poNumber deliveryDate orderQuantity issuedAt")
    .lean();

  return items.map((d) => {
    const poQty = Number(d?.poDetails?.orderQuantity || 0);
    return {
      ...d,
      orderQuantity: poQty > 0 ? poQty : Number(d.orderQuantity || 0),
      rfdReadyQuantity: Number(d.orderQuantity || 0),
    };
  });
}

export async function getDelivered() {
  const items = await Delivery.find({ status: "delivered" })
    .populate("project", "autoCode artName brand category country gender")
    .populate("poDetails", "poNumber deliveryDate orderQuantity issuedAt")
    .lean();

  return items.map((d) => {
    const poQty = Number(d?.poDetails?.orderQuantity || 0);
    return {
      ...d,
      orderQuantity: poQty > 0 ? poQty : Number(d.orderQuantity || 0),
      rfdReadyQuantity: Number(d.orderQuantity || 0),
    };
  });
}
