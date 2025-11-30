/**
 * Generic ERP DB cleaning script for MongoDB + Mongoose
 * Usage: NODE_ENV=production MONGO_URI="mongodb://..." node scripts/clean_erp.js
 *
 * BEFORE RUN: take DB backup. Test on staging first.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI missing in env. Set MONGO_URI and retry.");
  process.exit(1);
}

/** ---------- Simple mongoose schemas (replace with your actual models) ---------- **/
const userSchema = new mongoose.Schema({}, { strict: false, collection: "users" });
const productSchema = new mongoose.Schema({}, { strict: false, collection: "products" });
const orderSchema = new mongoose.Schema({}, { strict: false, collection: "orders" });

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Order = mongoose.model("Order", orderSchema);

/** ---------- Helpers ---------- **/
const trimStr = s => (typeof s === "string" ? s.trim() : s);
const lowerStr = s => (typeof s === "string" ? s.toLowerCase() : s);

function normalizePhone(raw) {
  if (!raw) return null;
  let s = String(raw).replace(/[^\d+]/g, "");
  // naive normalizer: if leads with 0, drop it; if no country, assume +91 (customize)
  if (/^0+/.test(s)) s = s.replace(/^0+/, "");
  if (!s.startsWith("+") && s.length === 10) s = "+91" + s;
  // trim accidental long numbers
  if (s.length > 16) return s.slice(0, 16);
  return s;
}

function isTestAccount(doc) {
  const email = (doc.email || "").toLowerCase();
  const name = (doc.name || "").toLowerCase();
  return (
    email.includes("test") ||
    email.includes("@example") ||
    name.includes("test") ||
    name.includes("dummy")
  );
}

async function removeEmptyAndNullFields(doc) {
  const keys = Object.keys(doc);
  const updates = {};
  for (const k of keys) {
    const v = doc[k];
    if (v === null || v === undefined || (typeof v === "string" && v.trim() === "")) {
      updates[k] = undefined; // mongoose unset via $unset
    }
  }
  return updates;
}

/** ---------- Cleaning operations ---------- **/
async function cleanUsers(session) {
  console.log("Cleaning users...");
  const summary = { total: 0, updated: 0, removedTest: 0, merged: 0, errors: 0 };

  const cursor = User.find().cursor({ session });
  for await (const u of cursor) {
    summary.total++;
    try {
      const updates = {};
      // Trim and normalize
      if (u.name) updates.name = trimStr(u.name);
      if (u.email) updates.email = lowerStr(trimStr(u.email));
      if (u.phone) updates.phone = normalizePhone(trimStr(u.phone));

      // set default role
      if (!u.role) updates.role = "user";

      // remove empty fields
      const emptyRemovals = await removeEmptyAndNullFields(u.toObject());
      // prepare bulk update
      const updateOps = {};
      if (Object.keys(updates).length) updateOps.$set = updates;
      if (Object.keys(emptyRemovals).length) updateOps.$unset = emptyRemovals;

      if (Object.keys(updateOps).length) {
        await User.updateOne({ _id: u._id }, updateOps, { session });
        summary.updated++;
      }

      // delete test accounts
      if (isTestAccount(u)) {
        await User.deleteOne({ _id: u._id }, { session });
        summary.removedTest++;
      }
    } catch (err) {
      console.error("User clean err:", u._id, err.message);
      summary.errors++;
    }
  }

  // Simple duplicate merge by email: keep earliest createdAt (or first found)
  // NOTE: This is basic; refine merging policy for your business logic.
  console.log("Merging duplicate users by email (basic)...");
  const duplicates = await User.aggregate([
    { $match: { email: { $exists: true, $ne: "" } } },
    {
      $group: {
        _id: "$email",
        ids: { $push: "$_id" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]).session(session);

  for (const d of duplicates) {
    try {
      const keepId = d.ids[0];
      const mergeIds = d.ids.slice(1);

      // Example merge policy: move orders referencing merged users to keepId
      await Order.updateMany(
        { userId: { $in: mergeIds } },
        { $set: { userId: keepId } },
        { session }
      );

      // remove merged user docs
      await User.deleteMany({ _id: { $in: mergeIds } }, { session });
      summary.merged += mergeIds.length;
    } catch (err) {
      console.error("Error merging dup users", d._id, err.message);
      summary.errors++;
    }
  }

  console.log("Users cleaned:", summary);
  return summary;
}

async function cleanProducts(session) {
  console.log("Cleaning products...");
  const summary = { total: 0, updated: 0, removed: 0, errors: 0 };
  const cursor = Product.find().cursor({ session });
  for await (const p of cursor) {
    summary.total++;
    try {
      const updates = {};
      if (p.name) updates.name = trimStr(p.name);
      // ensure price is number
      if (p.price !== undefined) {
        const priceNum = Number(p.price);
        if (isNaN(priceNum)) {
          updates.price = 0;
        } else {
          updates.price = priceNum;
        }
      } else {
        updates.price = 0;
      }

      // remove empty meta fields
      const emptyRemovals = await removeEmptyAndNullFields(p.toObject());
      const updateOps = {};
      if (Object.keys(updates).length) updateOps.$set = updates;
      if (Object.keys(emptyRemovals).length) updateOps.$unset = emptyRemovals;
      if (Object.keys(updateOps).length) {
        await Product.updateOne({ _id: p._id }, updateOps, { session });
        summary.updated++;
      }
      // optional: remove discontinued products flagged test
      if (p._test === true) {
        await Product.deleteOne({ _id: p._id }, { session });
        summary.removed++;
      }
    } catch (err) {
      console.error("Product clean err:", p._id, err.message);
      summary.errors++;
    }
  }
  console.log("Products cleaned:", summary);
  return summary;
}

async function cleanOrders(session) {
  console.log("Cleaning orders...");
  const summary = { total: 0, fixedDates: 0, orphaned: 0, errors: 0 };
  const cursor = Order.find().cursor({ session });
  for await (const o of cursor) {
    summary.total++;
    try {
      const ops = {};
      // Normalize date fields: orderDate, createdAt, updatedAt etc.
      if (o.orderDate && !(o.orderDate instanceof Date)) {
        const d = new Date(o.orderDate);
        if (!isNaN(d)) {
          ops.$set = { ...(ops.$set || {}), orderDate: d };
          summary.fixedDates++;
        } else {
          // try parsing common formats or set to now
          ops.$set = { ...(ops.$set || {}), orderDate: new Date() };
        }
      }

      // Validate references: userId, productIds
      if (o.userId) {
        const userExists = await User.exists({ _id: o.userId }).session(session);
        if (!userExists) {
          // mark as orphaned or set userId = null
          ops.$set = { ...(ops.$set || {}), userId: null, _orphanedUser: true };
          summary.orphaned++;
        }
      }

      if (ops && Object.keys(ops).length) {
        await Order.updateOne({ _id: o._id }, ops, { session });
      }
    } catch (err) {
      console.error("Order clean err:", o._id, err.message);
      summary.errors++;
    }
  }
  console.log("Orders cleaned:", summary);
  return summary;
}

/** ---------- Runner ---------- **/
async function run() {
  console.log("Connecting to DB...");
  await mongoose.connect(MONGO_URI, { dbName: process.env.DB_NAME || undefined });

  // use transaction if replica set
  const session = await mongoose.startSession();
  let useTransaction = false;
  // attempt to detect replica set by isMaster reply
  try {
    const admin = mongoose.connection.db.admin();
    const info = await admin.command({ ismaster: 1 });
    if (info && (info.ismaster || info.setName)) useTransaction = !!info.setName;
  } catch (e) {
    // ignore detection errors
  }

  try {
    if (useTransaction) {
      console.log("Starting transaction...");
      await session.withTransaction(async () => {
        await cleanUsers(session);
        await cleanProducts(session);
        await cleanOrders(session);
      }, { readPreference: 'primary' });
    } else {
      console.log("Transactions not available; running operations without transaction.");
      await cleanUsers(null);
      await cleanProducts(null);
      await cleanOrders(null);
    }
    console.log("Cleaning finished.");
  } catch (err) {
    console.error("Fatal error during cleaning:", err);
  } finally {
    session.endSession();
    await mongoose.disconnect();
    process.exit(0);
  }
}

run().catch(err => {
  console.error("Run failed:", err);
  process.exit(1);
});
