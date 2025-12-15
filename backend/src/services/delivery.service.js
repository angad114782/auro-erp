// src/services/delivery.service.js

import { Project } from "../models/Project.model.js";
import { PoDetails } from "../models/PoDetails.model.js";
import { Delivery } from "../models/Delivery.model.js";

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

  // Update Project Status
  await Project.findByIdAndUpdate(projectId, {
    status: "delivery_pending",
  });

  const today = new Date();
  const poReceived = po?.issuedAt || today;

  const agingDays = Math.ceil((today - poReceived) / (1000 * 60 * 60 * 24));

  // Create Delivery Record
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

    orderQuantity: po?.orderQuantity || 0,

    status: "pending",
    agingDays,
  });

  // ⭐ ADD HISTORY ENTRY
  await addDeliveryHistory(
    delivery._id,
    [{ field: "status", from: "planning/tracking", to: "pending" }],
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
