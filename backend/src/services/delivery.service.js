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

  // ✅ RFD ready qty (total till now)
  const { totalReady } = await getProjectRfdReadyQty(projectId);

  if (totalReady <= 0) {
    throw new Error("No finished quantity in RFD. Nothing to send for delivery.");
  }

  // ✅ find existing pending delivery for same project+po
  const existing = await Delivery.findOne({
    project: projectId,
    poDetails: po?._id || null,
    status: "pending",
  });

  const alreadyQty = Number(existing?.orderQuantity || 0);

  // ✅ how much NEW qty to add today
  let delta = totalReady - alreadyQty;

  // ✅ respect PO orderQuantity cap (optional)
  const poQty = Number(po?.orderQuantity || 0);
  if (poQty > 0) {
    const maxAllowedNow = poQty - alreadyQty;
    delta = Math.min(delta, maxAllowedNow);
  }

  if (delta <= 0) {
    throw new Error(
      `No new finished quantity since last send. Ready=${totalReady}, alreadySent=${alreadyQty}`
    );
  }

  // ✅ project status
  await Project.findByIdAndUpdate(projectId, { status: "delivery_pending" });

  const today = new Date();
  const poReceived = po?.issuedAt || today;
  const agingDays = Math.ceil((today - poReceived) / (1000 * 60 * 60 * 24));

  // ✅ update existing OR create new
  let deliveryDoc;

  if (existing) {
    const newQty = alreadyQty + delta;

    deliveryDoc = await Delivery.findByIdAndUpdate(
      existing._id,
      {
        orderQuantity: newQty,
        agingDays,
        $push: {
          history: {
            date: new Date(),
            updatedBy: user,
            changes: [
              { field: "orderQuantity", from: alreadyQty, to: newQty },
              { field: "rfdReadyQuantity", from: alreadyQty, to: totalReady },
            ],
          },
        },
      },
      { new: true }
    );
  } else {
    deliveryDoc = await Delivery.create({
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

      orderQuantity: delta, // ✅ FIRST send qty
      status: "pending",
      agingDays,

      history: [
        {
          date: new Date(),
          updatedBy: user,
          changes: [
            { field: "status", from: "planning/tracking", to: "pending" },
            { field: "orderQuantity", from: 0, to: delta },
            { field: "rfdReadyQuantity", from: 0, to: totalReady },
          ],
        },
      ],
    });
  }

  return deliveryDoc;
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
