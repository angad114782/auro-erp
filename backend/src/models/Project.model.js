import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    company:  { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    brand:    { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },

    // optional masters
    type:         { type: mongoose.Schema.Types.ObjectId, ref: "Type", default: null },
    country:      { type: mongoose.Schema.Types.ObjectId, ref: "Country", default: null },
    assignPerson: { type: mongoose.Schema.Types.ObjectId, ref: "AssignPerson", default: null },

    // CHANGED: projectName -> color (required)
    color: { type: String, required: true, trim: true },

    artName:            { type: String, default: "" },
    size:               { type: String, default: "" },
    gender:             { type: String, default: "" },
    priority:           { type: String, default: "normal" },
    productDesc:        { type: String, default: "" },
    redSealTargetDate:  { type: Date, default: null },

    coverImage:   { type: String, default: "" },
    sampleImages: [{ type: String }],

    // NEW: auto-generated, unique project code (read-only for clients)
    projectCode: { type: String, unique: true, index: true, required: true },
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);
