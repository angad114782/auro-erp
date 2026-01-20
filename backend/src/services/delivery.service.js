// src/services/delivery.service.js

import { Project } from "../models/Project.model.js";
import { PoDetails } from "../models/PoDetails.model.js";
import { Delivery } from "../models/Delivery.model.js";
import MicroTracking from "../models/MicroTracking.model.js";
import mongoose from "mongoose";

async function getProjectRfdReadyQty(projectId) {
  const pid = new mongoose.Types.ObjectId(projectId);

  /**
   * Logic:
   * - MicroTrackingCard → rows[]
   * - sirf rows jinka department === "rfd"
   * - per card → MIN(completedQty)
   * - totalReady = sum of per-card ready
   */

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

  return {
    totalReady,
    perCard, // debug ke liye
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
    .populate("company", "name")
    .populate("brand", "name")
    .populate("category", "name")
    .populate("country", "name")
    .lean();

  if (!project) throw new Error("Project not found");

  const po = await PoDetails.findOne({ project: projectId }).lean();

  const { totalReady } = await getProjectRfdReadyQty(projectId);

  if (totalReady <= 0) {
    throw new Error("No finished quantity in RFD. Nothing to send for delivery.");
  }

  // ✅ ONE DOC per project+po (no status filter)
  let existing = await Delivery.findOne({
    project: projectId,
    poDetails: po?._id || null,
  });

  // ✅ if already delivered, don't allow sending again for same PO
  if (existing && existing.status === "delivered") {
    throw new Error("This PO is already fully delivered. Create a new PO to send again.");
  }

  const alreadySent = Number(existing?.orderQuantity || 0); // (your 'sent so far')
  let delta = totalReady - alreadySent;

  const poQty = Number(po?.orderQuantity || 0);
  if (poQty > 0) {
    const maxAllowedNow = poQty - alreadySent;
    delta = Math.min(delta, maxAllowedNow);
  }

  if (delta <= 0) {
    throw new Error(
      `No new finished quantity since last send. Ready=${totalReady}, alreadySent=${alreadySent}`
    );
  }

  // ✅ update project status
  await Project.findByIdAndUpdate(projectId, { status: "delivery_pending" });

  const today = new Date();
  const poReceived = po?.issuedAt || today;
  const agingDays = Math.ceil((today - poReceived) / (1000 * 60 * 60 * 24));

  if (existing) {
    const newQty = alreadySent + delta;

    const updated = await Delivery.findByIdAndUpdate(
      existing._id,
      {
        orderQuantity: newQty,
        agingDays,
        status: "pending", // ✅ force back to pending if new dispatch happens
        $push: {
          history: {
            date: new Date(),
            updatedBy: user,
            changes: [
              { field: "orderQuantity", from: alreadySent, to: newQty },
              { field: "rfdReadyQuantity", from: alreadySent, to: totalReady },
              { field: "status", from: existing.status, to: "pending" },
            ],
          },
        },
      },
      { new: true }
    );

    return updated;
  }

  // ✅ create first time
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
          { field: "status", from: "planning/tracking", to: "pending" },
          { field: "orderQuantity", from: 0, to: delta },
          { field: "rfdReadyQuantity", from: 0, to: totalReady },
        ],
      },
    ],
  });

  return created;
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
    .populate("project", "autoCode artName brand category company country gender")
    .populate("poDetails", "poNumber deliveryDate")
    .lean();
}

export async function getParcelDelivered() {
  return await Delivery.find({ status: "parcel_delivered" })
    .populate("project", "autoCode artName brand category company country gender")
    .populate("poDetails", "poNumber deliveryDate")
    .lean();
}

export async function getDelivered() {
  return await Delivery.find({ status: "delivered" })
    .populate("project", "autoCode artName brand category company country gender")
    .populate("poDetails", "poNumber deliveryDate")
    .lean();
}
