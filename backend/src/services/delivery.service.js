// src/services/delivery.service.js

import { Project } from "../models/Project.model.js";
import { PoDetails } from "../models/PoDetails.model.js";
import { Delivery } from "../models/Delivery.model.js";
import MicroTracking from "../models/MicroTracking.model.js";
import mongoose from "mongoose";

async function getProjectRfdReadyQty(projectId) {
  const pid = new mongoose.Types.ObjectId(projectId);

  // Per card: min(progressDone) across rfd rows
  const perCard = await MicroTracking.aggregate([
    { $match: { projectId: pid, department: "rfd" } },
    {
      $group: {
        _id: "$cardId",
        ready: { $min: { $ifNull: ["$progressDone", 0] } },
        rowsCount: { $sum: 1 },
      },
    },
  ]);

  const totalReady = perCard.reduce((s, c) => s + Number(c.ready || 0), 0);

  return {
    totalReady,
    perCard, // optional debug
  };
}

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
   SEND PROJECT TO DELIVERY PENDING
---------------------------------------------------- */
export async function sendToDeliveryService(projectId, user = "system") {
  const project = await Project.findById(projectId)
    .populate("brand", "name")
    .populate("category", "name")
    .populate("country", "name")
    .lean();

  if (!project) throw new Error("Project not found");

  const po = await PoDetails.findOne({ project: projectId }).lean();

  // ✅ RFD ready qty
  const { totalReady, perCard } = await getProjectRfdReadyQty(projectId);

  if (totalReady <= 0) {
    throw new Error("No finished quantity in RFD. Nothing to send for delivery.");
  }

  // ✅ Manage orderQuantity
  const poQty = Number(po?.orderQuantity || 0);
  const finalQty = poQty > 0 ? Math.min(poQty, totalReady) : totalReady;

  // Update Project Status
  await Project.findByIdAndUpdate(projectId, { status: "delivery_pending" });

  const today = new Date();
  const poReceived = po?.issuedAt || today;
  const agingDays = Math.ceil((today - poReceived) / (1000 * 60 * 60 * 24));

  const delivery = await Delivery.create({
    project: projectId,
    poDetails: po?._id || null,

    projectCode: project.autoCode,
    productName: project.artName,
    category: project.category?.name || "",
    brand: project.brand?.name || "",
    gender: project.gender || "",

    poNumber: po?.poNumber || "",
    poReceivedDate: po?.issuedAt || null,
    deliveryDateExpected: po?.deliveryDate || null,

    // ✅ IMPORTANT: now delivery quantity comes from RFD completion
    orderQuantity: finalQty,

    // optional fields if you want (only if schema allows)
    // poOrderQuantity: poQty,
    // rfdReadyQuantity: totalReady,
    // rfdPerCard: perCard,

    status: "pending",
    agingDays,
  });

  await addDeliveryHistory(
    delivery._id,
    [
      { field: "status", from: "planning/tracking", to: "pending" },
      { field: "orderQuantity", from: poQty, to: finalQty },
      { field: "rfdReadyQuantity", from: 0, to: totalReady },
    ],
    user
  );

  return delivery;
}


// export async function markParcelDelivered(deliveryId, user = "system") {
//   const old = await Delivery.findById(deliveryId);

//   await Delivery.findByIdAndUpdate(deliveryId, {
//     status: "parcel_delivered",
//     updatedAt: new Date()
//   });

//   await addDeliveryHistory(deliveryId, [
//     { field: "status", from: old.status, to: "parcel_delivered" }
//   ], user);

//   return true;
// }
export async function markParcelDelivered(deliveryId, user = "system") {
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) throw new Error("Delivery not found");

  // 1️⃣ Update Delivery
  await Delivery.findByIdAndUpdate(deliveryId, {
    status: "parcel_delivered",
    updatedAt: new Date(),
  });

  // 2️⃣ Update Project
  await Project.findByIdAndUpdate(delivery.project, {
    status: "parcel_delivered",
  });

  // 3️⃣ History
  await addDeliveryHistory(
    deliveryId,
    [{ field: "status", from: delivery.status, to: "parcel_delivered" }],
    user
  );
}

// export async function markDelivered(deliveryId, user = "system") {
//   const old = await Delivery.findById(deliveryId);

//   await Delivery.findByIdAndUpdate(deliveryId, {
//     status: "delivered",
//     updatedAt: new Date(),
//   });

//   await addDeliveryHistory(
//     deliveryId,
//     [{ field: "status", from: old.status, to: "delivered" }],
//     user
//   );

//   return true;
// }

export async function markDelivered(deliveryId, user = "system") {
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) throw new Error("Delivery not found");

  await Delivery.findByIdAndUpdate(deliveryId, {
    status: "delivered",
    updatedAt: new Date(),
  });

  await Project.findByIdAndUpdate(delivery.project, {
    status: "delivered",
  });

  await addDeliveryHistory(
    deliveryId,
    [{ field: "status", from: delivery.status, to: "delivered" }],
    user
  );
}

export async function getPendingDeliveries() {
  return await Delivery.find({ status: "pending" })
    .populate("project", "autoCode artName brand category country gender")
    .populate("poDetails", "poNumber deliveryDate")
    .lean();
}

export async function getParcelDelivered() {
  return await Delivery.find({ status: "parcel_delivered" })
    .populate("project", "autoCode artName brand category country gender")
    .populate("poDetails", "poNumber deliveryDate")
    .lean();
}

export async function getDelivered() {
  return await Delivery.find({ status: "delivered" })
    .populate("project", "autoCode artName brand category country gender")
    .populate("poDetails", "poNumber deliveryDate")
    .lean();
}
