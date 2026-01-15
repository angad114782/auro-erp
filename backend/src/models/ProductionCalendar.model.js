import mongoose from "mongoose";

const schedulingSchema = new mongoose.Schema({
  scheduleDate: { type: Date, required: true },
  receivedDate: { type: Date, default: null }, 
  assignedPlant: { 
  type: mongoose.Schema.Types.ObjectId, 
  ref: "AssignPlant", 
  default: null 
},
  soleFrom: { type: String, default: "" },       // e.g., supplier / mold name
  soleColor: { type: String, default: "" },
  soleExpectedDate: { type: Date, default: null },
  footbed: { type: String, default: "" },
}, { _id: false });

const productionDetailsSchema = new mongoose.Schema({
  quantity: { type: Number, required: true, min: 0 },
  // add other production-specific fields later (sizeBreakdown, lines, batch, etc.)
}, { _id: false });

const productionCalendarSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  // snapshot of project fields for autofill:
  projectSnapshot: {
  autoCode: String,
  artName: String,
  productDesc: String,
  color: String,
  size: String,
  brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },   // keep id if stored
  brandName: String,   // <-- add
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  categoryName: String, // <-- add
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  companyName: String,  // <-- add
  poNumber: String,
  poRef: { type: mongoose.Schema.Types.ObjectId, ref: "PoDetails" }
},

  // Card 2: scheduling
  scheduling: { type: schedulingSchema, required: true },

  // Card 3: production details
  productionDetails: { type: productionDetailsSchema, required: true },

  // Card 4: additional
  additional: {
    remarks: { type: String, default: "" }
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const ProductionCalendar = mongoose.model("ProductionCalendar", productionCalendarSchema);
export default ProductionCalendar;
