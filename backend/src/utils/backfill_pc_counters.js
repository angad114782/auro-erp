// run: node scripts/backfill_pc_counters.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { PCProjectCounter } from "../backend/src/models/pc_projectCounter.model.js";
import { PCProductionCard } from "../backend/src/models/pc_productionCard.model.js";
import { Project } from "../backend/src/models/project.model.js"; // adapt if path differs

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  const projects = await Project.find({}).lean();
  for (const p of projects) {
    const projectId = p._id;
    // You can compute a safer seq — here we set seq = count
    const count = await PCProductionCard.countDocuments({ projectId });
    await PCProjectCounter.findOneAndUpdate({ projectId }, { $set: { seq: count } }, { upsert: true });
    console.log(`Backfilled counter for project ${projectId} => seq=${count}`);
  }
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
