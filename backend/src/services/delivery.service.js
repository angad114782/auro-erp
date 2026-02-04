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
   AUTO STATUS CALC (NO MANUAL STATUS) ✅ FIXED
---------------------------------------------------- */
export async function recalcDeliveryStatusAndSyncProject(deliveryId, user = "system") {
  const delivery = await Delivery.findById(deliveryId).lean();
  if (!delivery) return null;

  const po = delivery.poDetails
    ? await PoDetails.findById(delivery.poDetails).lean()
    : await PoDetails.findOne({ project: delivery.project }).lean();

  const poQty = Number(po?.orderQuantity || 0);
  const fallbackQty = Number(delivery.orderQuantity || 0);
  const targetQty = poQty > 0 ? poQty : fallbackQty;

  const sent = Number(delivery.sendQuantity || 0);

  // ✅ Correct status logic
  let newStatus = "delivery_pending";

  if (sent > 0 && (targetQty <= 0 || sent < targetQty)) {
    newStatus = "parcel_delivered"; // or "in_transit" if you prefer
  }

  if (targetQty > 0 && sent >= targetQty) {
    newStatus = "delivered";
  }

  if (newStatus !== delivery.status) {
    await Delivery.findByIdAndUpdate(deliveryId, {
      status: newStatus,
      updatedAt: new Date(),
      $push: {
        history: {
          date: new Date(),
          updatedBy: user,
          changes: [{ field: "status", from: delivery.status, to: newStatus }],
        },
      },
    });
  }

  // ✅ Sync project status
  await Project.findByIdAndUpdate(delivery.project, { status: newStatus });

  return newStatus;
}

/* ----------------------------------------------------
   SEND PROJECT TO DELIVERY (AUTO)  ✅ FIXED:
   - orderQuantity = PO order qty (fixed)
   - sendQuantity  = sent qty (accumulates)
   - status on create = delivery_pending (not parcel_delivered)
   - PO cap guard (never negative)
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

  // Find existing delivery row for same project+PO
  let existing = await Delivery.findOne({
    project: projectId,
    poDetails: po?._id || null,
  });

  if (existing) {
    // keep status in sync (optional)
    await recalcDeliveryStatusAndSyncProject(existing._id, user);
    const fresh = await Delivery.findById(existing._id).lean();

    if (fresh?.status === "delivered") {
      throw new Error("This PO is already fully delivered. Create a new PO to send again.");
    }
  }

  // ✅ Correct fields
  const alreadySent = Number(existing?.sendQuantity || 0); // ✅ FIX (was orderQuantity)

  // PO order qty (fixed)
  const poQty = Number(po?.orderQuantity || 0);

  // delta = newly ready since last send
  let delta = totalReady - alreadySent;

  // ✅ cap by remaining PO qty (and guard negative)
  if (poQty > 0) {
    const remainingPo = Math.max(poQty - alreadySent, 0);
    delta = Math.min(delta, remainingPo);
  }

  if (delta <= 0) {
    throw new Error("No new finished quantity since last send.");
  }

  await Project.findByIdAndUpdate(projectId, { status: "delivery_pending" });

  const today = new Date();
  const poReceived = po?.issuedAt || today;
  const agingDays = Math.ceil((today - poReceived) / (1000 * 60 * 60 * 24));

  // -----------------------
  // UPDATE EXISTING DELIVERY
  // -----------------------
  if (existing) {
    const newSentQty = alreadySent + delta;

    const updatePayload = {
      // ✅ keep orderQuantity fixed (prefer PO qty if available)
      ...(poQty > 0 ? { orderQuantity: poQty } : {}),

      // ✅ sent qty updates here
      sendQuantity: newSentQty,

      agingDays,
      status: "delivery_pending", // ✅ keep consistent while sending
      $push: {
        history: {
          date: new Date(),
          updatedBy: user,
          changes: [
            { field: "sendQuantity", from: alreadySent, to: newSentQty },
            // Note: if you don't have rfdReadyQuantity field in schema,
            // keep it only in history as a snapshot.
            { field: "rfdReadyQuantity", from: Number(existing?.rfdReadyQuantity || 0), to: totalReady },
          ],
        },
      },
    };

    const updated = await Delivery.findByIdAndUpdate(existing._id, updatePayload, {
      new: true,
    });

    await recalcDeliveryStatusAndSyncProject(updated._id, user);

    return await Delivery.findById(updated._id)
      .populate("project", "autoCode artName brand category country gender")
      .populate("poDetails", "poNumber deliveryDate")
      .lean();
  }

  // -----------------------
  // CREATE NEW DELIVERY
  // -----------------------
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

    // ✅ PO qty fixed; if PO missing, fall back to totalReady/delta
    orderQuantity: poQty > 0 ? poQty : totalReady,

    // ✅ sent qty starts with delta
    sendQuantity: delta,

    status: "delivery_pending", // ✅ FIX (was parcel_delivered)
    agingDays,

    history: [
      {
        date: new Date(),
        updatedBy: user,
        changes: [
          { field: "sendQuantity", from: 0, to: delta },
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
