import mongoose from "mongoose";
import { PROJECT_STATUS } from "../utils/status.util.js";

const statusHistorySchema = new mongoose.Schema(
  {
    from: { type: String, default: null },
    to:   { type: String, required: true },
    note: { type: String, default: "" },
    by:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // optional
    at:   { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    autoCode: { type: String, required: true, unique: true },

    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    brand:   { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    category:{ type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },

    type:        { type: mongoose.Schema.Types.ObjectId, ref: "Type", default: null },
    country:     { type: mongoose.Schema.Types.ObjectId, ref: "Country", default: null },
    assignPerson:{ type: mongoose.Schema.Types.ObjectId, ref: "AssignPerson", default: null },

    color:   { type: String, required: true, trim: true },
    artName: { type: String, default: "" },
    size:    { type: String, default: "" },
    gender:  { type: String, default: "" },
    priority:{ type: String, default: "normal" },

    // ✅ Status with canonical enum
    status: { 
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: PROJECT_STATUS.PROTOTYPE,
      index: true
    },

    productDesc:        { type: String, default: "" },
    redSealTargetDate:  { type: Date, default: null },

    coverImage:   { type: String, default: "" },
    sampleImages: [{ type: String }],

    isActive: { type: Boolean, default: true },

    // ✅ optional history
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true }
);

// models/Project.model.js (after schema)
projectSchema.index({ isActive: 1, status: 1, company: 1, brand: 1, category: 1, updatedAt: -1 });


export const Project = mongoose.model("Project", projectSchema);
