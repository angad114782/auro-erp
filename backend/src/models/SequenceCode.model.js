import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name:    { type: String, required: true, index: true }, // same as config.name (e.g. "PRJ")
    code:    { type: String, required: true, unique: true },// formatted code
    counter: { type: Number, required: true },              // used integer
    status:  { type: String, enum: ["reserved","assigned","cancelled"], default: "reserved", index: true },
    reservedAt: { type: Date, default: Date.now },
    // link to project when assigned
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  },
  { timestamps: true }
);

// allow only one RESERVED per sequence name
schema.index({ name: 1, status: 1 }, { unique: true, partialFilterExpression: { status: "reserved" } });

export default mongoose.model("SequenceCode", schema);
