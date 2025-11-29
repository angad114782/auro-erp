// scripts/backfillProjectSnapshotNames.js
import mongoose from "mongoose";
import ProductionCalendar from "../models/ProductionCalendar.model.js";
import Project from "../models/Project.model.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const entries = await ProductionCalendar.find({}).lean();
  for (const e of entries) {
    if (e.project && (!e.projectSnapshot || !e.projectSnapshot.brandName)) {
      const proj = await Project.findById(e.project).populate("brand", "name").populate("category", "name").lean();
      if (!proj) continue;
      const upd = {
        "projectSnapshot.brandName": proj.brand?.name ?? null,
        "projectSnapshot.categoryName": proj.category?.name ?? null,
        "projectSnapshot.companyName": proj.company?.name ?? null,
      };
      await ProductionCalendar.updateOne({ _id: e._id }, { $set: upd });
      console.log("Backfilled", e._id);
    }
  }
  console.log("Done");
  process.exit(0);
}
run().catch((err)=>{ console.error(err); process.exit(1); });
