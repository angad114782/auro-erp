// src/services/delevery.service.js

import { Project } from "../models/Project.model.js";
import { PoDetails } from "../models/PoDetails.model.js";
import { Delivery } from "../models/Delivery.model.js";
import MicroTracking from "../models/MicroTracking.model.js";
import mongoose from "mongoose";

/* ----------------------------------------------------
   RFD READY QTY (MIN SYSTEM)
   - Per card: min(completedQty) in RFD rows
   - Total: sum of per card ready
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

  const totalReady = perCard.reduce((sum, c) => sum + Number(c.ready || 0), 0);
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
   AUTO STATUS CALC (ONLY 2 STATUS)
   - parcel_delivered (partial)
   - delivered (full)
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

  // ✅ Only 2 statuses
  let newStatus = "parcel_delivered";
  if (targetQty > 0 && sent >= targetQty) newStatus = "delivered";

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

  // ✅ Sync project status (only these 2)
  await Project.findByIdAndUpdate(delivery.project, { status: newStatus });

  return newStatus;
}

/* ----------------------------------------------------
   SEND PROJECT TO DELIVERY (AUTO)
   - orderQuantity = PO order qty (fixed)
   - sendQuantity  = sent qty (accumulates)
   - status on create/update = parcel_delivered
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
    await recalcDeliveryStatusAndSyncProject(existing._id, user);
    const fresh = await Delivery.findById(existing._id).lean();

    if (fresh?.status === "delivered") {
      throw new Error("This PO is already fully delivered. Create a new PO to send again.");
    }
  }

  // Already sent qty
  const alreadySent = Number(existing?.sendQuantity || 0);

  // PO order qty (fixed)
  const poQty = Number(po?.orderQuantity || 0);

  // delta = newly ready since last send
  let delta = totalReady - alreadySent;

  // cap by remaining PO qty
  if (poQty > 0) {
    const remainingPo = Math.max(poQty - alreadySent, 0);
    delta = Math.min(delta, remainingPo);
  }

  if (delta <= 0) {
    throw new Error("No new finished quantity since last send.");
  }

  // Since we're sending now => at least partial delivery
  await Project.findByIdAndUpdate(projectId, { status: "parcel_delivered" });

  const today = new Date();
  const poReceived = po?.issuedAt || today;
  const agingDays = Math.ceil((today - poReceived) / (1000 * 60 * 60 * 24));

  // -----------------------
  // UPDATE EXISTING DELIVERY
  // -----------------------
  if (existing) {
    const newSentQty = alreadySent + delta;

    const updatePayload = {
      ...(poQty > 0 ? { orderQuantity: poQty } : {}),
      sendQuantity: newSentQty,
      agingDays,

      // ✅ only 2 statuses allowed
      status: "parcel_delivered",

      $push: {
        history: {
          date: new Date(),
          updatedBy: user,
          changes: [
            { field: "sendQuantity", from: alreadySent, to: newSentQty },
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
      .populate("poDetails", "poNumber deliveryDate orderQuantity issuedAt")
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

    // PO qty fixed; if PO missing, fall back to totalReady
    orderQuantity: poQty > 0 ? poQty : totalReady,

    // sent qty starts with delta
    sendQuantity: delta,

    // ✅ only 2 statuses allowed
    status: "parcel_delivered",

    agingDays,

    history: [
      {
        date: new Date(),
        updatedBy: user,
        changes: [
          { field: "sendQuantity", from: 0, to: delta },
          { field: "rfdReadyQuantity", from: 0, to: totalReady },
          { field: "status", from: "parcel_delivered", to: "parcel_delivered" },
        ],
      },
    ],
  });

  await recalcDeliveryStatusAndSyncProject(created._id, user);

  return await Delivery.findById(created._id)
    .populate("project", "autoCode artName brand category country gender")
    .populate("poDetails", "poNumber deliveryDate orderQuantity issuedAt")
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
   - parcel_delivered: partial/in-progress deliveries
   - delivered: completed deliveries
---------------------------------------------------- */
export async function getParcelDelivered() {
  const items = await Delivery.find({ status: "parcel_delivered" })
    .populate("project", "autoCode artName brand category country gender")
    .populate("poDetails", "poNumber deliveryDate orderQuantity issuedAt")
    .lean();

  // attach current ready qty for UI convenience
  const mapped = [];
  for (const d of items) {
    const poQty = Number(d?.poDetails?.orderQuantity || 0);
    const { totalReady } = await getProjectRfdReadyQty(d.project?._id || d.project);
    mapped.push({
      ...d,
      orderQuantity: poQty > 0 ? poQty : Number(d.orderQuantity || 0),
      rfdReadyQuantity: Number(totalReady || 0),
    });
  }
  return mapped;
}

// ✅ If UI still calls "pending", return parcel_delivered list
export async function getPendingDeliveries() {
  return await getParcelDelivered();
}

export async function getDelivered() {
  const items = await Delivery.find({ status: "delivered" })
    .populate("project", "autoCode artName brand category country gender")
    .populate("poDetails", "poNumber deliveryDate orderQuantity issuedAt")
    .lean();

  const mapped = [];
  for (const d of items) {
    const poQty = Number(d?.poDetails?.orderQuantity || 0);
    const { totalReady } = await getProjectRfdReadyQty(d.project?._id || d.project);
    mapped.push({
      ...d,
      orderQuantity: poQty > 0 ? poQty : Number(d.orderQuantity || 0),
      rfdReadyQuantity: Number(totalReady || 0),
    });
  }
  return mapped;
}
