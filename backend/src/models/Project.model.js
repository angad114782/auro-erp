import mongoose from "mongoose";
import { PROJECT_STATUS } from "../utils/status.util.js";

const statusHistorySchema = new mongoose.Schema(
  {
    from: { type: String, default: null },
    to:   { type: String, required: true },
    by:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    at:   { type: Date, default: Date.now },
  },
  { _id: false }
);

const clientCostHistorySchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    by:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    setAt:  { type: Date, default: Date.now },
  },
  { _id: false }
);

const nextUpdateSchema = new mongoose.Schema(
  {
    date:  { type: Date, required: true },
    note:  { type: String, default: "" }, // ✅ note only here
    setBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    setAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const clientApprovalSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    autoCode: { type: String, required: true, unique: true },

    company:  { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    brand:    { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },

    type:         { type: mongoose.Schema.Types.ObjectId, ref: "Type", default: null },
    country:      { type: mongoose.Schema.Types.ObjectId, ref: "Country", default: null },
    assignPerson: { type: mongoose.Schema.Types.ObjectId, ref: "AssignPerson", default: null },

    color:   { type: String, required: true, trim: true },
    artName: { type: String, default: "" },
    size:    { type: String, default: "" },
    gender:  { type: String, default: "" },
    priority:{ type: String, default: "normal" },

    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: PROJECT_STATUS.PROTOTYPE,
      index: true,
    },

    productDesc:       { type: String, default: "" },
    redSealTargetDate: { type: Date, default: null },

    coverImage:   { type: String, default: "" },
    sampleImages: [{ type: String }],

    // ----- lifecycle fields -----
    clientFinalCost:   { type: Number, default: 0, min: 0 },
    clientCostHistory: { type: [clientCostHistorySchema], default: [] },

    nextUpdate: { type: nextUpdateSchema, default: null }, // ✅ note lives here

    clientApproval: { type: clientApprovalSchema, default: () => ({ status: "pending" }) },

    isActive: { type: Boolean, default: true },

    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);
