// Comprehensive ERP data store following the exact specification
import { create } from "zustand";

// ============= MASTER DATA MANAGEMENT =============
export interface CompanyMaster {
  id: string;
  companyCode: string; // Auto-generated COM001, COM002...
  companyName: string;
  status: "Active" | "Inactive";
  createdDate: string;
}

export interface BrandMaster {
  id: string;
  brandCode: string; // Auto-generated BR001, BR002...
  brandName: string;
  companyId: string; // Link to company
  status: "Active" | "Inactive";
  createdDate: string;
}

export interface CategoryMaster {
  id: string;
  categoryId: string;
  categoryName: string;
  companyId: string; // Link to company
  status: "Active" | "Inactive";
}

export interface TypeMaster {
  id: string;
  typeId: string;
  typeName: string;
  usageArea: "Sole" | "Upper" | "Both";
}

export interface ColorMaster {
  id: string;
  colorId: string;
  colorName: string;
  hexCode: string;
  status: "Active" | "Inactive";
}

export interface CountryMaster {
  id: string;
  countryId: string;
  countryName: string;
  isoCode: string;
}

// ============= R&D MANAGEMENT =============
export interface RDProject {
  id: string;
  autoCode: string; // RND/25-26/09/103 format
  companyId: string;
  brandId: string;
  categoryId: string;
  typeId: string;
  colorId: string;
  countryId: string;
  companyName?: string;
  brandName?: string;
  categoryName?: string;
  typeName?: string;
  countryName?: string;
  gender?: string;
  assignPerson: string;

  // company: { _id: string; name: string };
  // brand: { _id: string; name: string };
  // category: { _id: string; name: string };
  // type: { _id: string; name: string };
  // country: { _id: string; name: string };
  // color: { _id: string; name: string; hexCode: string };

  designerId: string;
  status:
    | "Idea Submitted"
    | "Costing Pending"
    | "Costing Received"
    | "Prototype"
    | "Red Seal"
    | "Green Seal"
    | "Final Approved"
    | "PO Issued";
  tentativeCost: number;
  targetCost: number;
  finalCost: number;
  difference: number; // Auto calculated
  startDate: string;
  endDate: string;
  duration: number; // Auto calculated
  poTarget: string;
  poReceived: string;
  poNumber?: string; // PO Number provided by client
  poStatus?: "Approved" | "Pending"; // PO approval status
  poDelay: number; // Auto calculated
  nextUpdateDate: string;
  remarks: string;
  clientFeedback: "OK" | "Update Required" | "Pending";
  priority: "High" | "Medium" | "Low";
  taskInc: string; // Task-INC field
  updateNotes: string; // Notes for next update meeting
  createdDate: string;
  updatedDate: string;
  // Production materials and components
  materials?: ProjectMaterial[];
  components?: ProjectComponent[];
  // Color variants with their specific materials and components
  colorVariants?: {
    [colorId: string]: {
      colorName: string;
      colorHex: string;
      materials: Array<{ name: string; desc: string; consumption: string }>;
      components: Array<{ name: string; desc: string; consumption: string }>;
    };
  };
  // Image uploads
  coverPhoto?: string;
  additionalImages?: string[];
  dynamicImages?: string[];
}

export interface ProjectMaterial {
  id: string;
  name: string;
  specification: string;
  requirement: string;
  unit: string;
}

export interface ProjectComponent {
  id: string;
  name: string;
  specification: string;
  requirement: string;
  unit: string;
}

export interface PrototypeFile {
  id: string;
  projectId: string;
  fileName: string;
  fileType: "JPG" | "PNG" | "PDF";
  filePath: string;
  version: string; // V1, V2, V3...
  uploadedBy: string;
  uploadedDate: string;
  isProfileImage: boolean;
}

// ============= USER & ROLE MANAGEMENT =============
export interface User {
  id: string;
  userName: string;
  email: string;
  role: "Admin" | "R&D Manager" | "Designer" | "Client";
  permissions: string[];
  status: "Active" | "Inactive";
  lastLogin: string;
  createdDate: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  projectId?: string;
  action: string;
  module: string;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
}

// ============= NOTIFICATIONS & ALERTS =============
export interface Notification {
  id: string;
  userId: string;
  projectId?: string;
  triggerEvent: string;
  notificationType: "System" | "Email";
  message: string;
  status: "Sent" | "Pending" | "Failed";
  createdDate: string;
}

// ============= PRODUCTION & PLANT MANAGEMENT =============
export interface ProductionOrder {
  id: string;
  poId: string;
  projectId: string;
  quantity: number;
  plantId: string;
  startDate: string;
  endDate: string;
  status:
    | "Planning"
    | "In Progress"
    | "Quality Check"
    | "Completed"
    | "On Hold";
  qcStatus: "Pass" | "Fail" | "Pending";
  qcRemarks: string;
}

export interface MaterialRequest {
  id: string;
  productionCardId: string;
  requestedBy: string;
  requestedDate: string;
  status:
    | "Pending Availability Check"
    | "Pending to Store"
    | "Issued"
    | "Partially Issued"
    | "Rejected";
  approvedBy?: string;
  approvedDate?: string;
  materials: MaterialRequestItem[];
  components: ComponentRequestItem[];
}

export interface MaterialRequestItem {
  id: string;
  name: string;
  specification: string;
  requirement: number;
  unit: string;
  available: number;
  issued: number;
  balance: number;
}

export interface ComponentRequestItem {
  id: string;
  name: string;
  specification: string;
  requirement: number;
  unit: string;
  available: number;
  issued: number;
  balance: number;
}

export interface ProductionCard {
  id: string;
  cardNumber: string;
  projectId: string;
  productName: string;
  cardQuantity: number;
  startDate: string;
  assignedPlant: string;
  description: string;
  specialInstructions: string;
  status: "Draft" | "Active" | "In Progress" | "Completed" | "On Hold";
  materialRequestStatus:
    | "Pending Availability Check"
    | "Pending to Store"
    | "Issued"
    | "Partially Issued";
  createdBy: string;
  createdDate: string;
  updatedDate: string;
  materials: ProjectMaterial[];
  components: ProjectComponent[];
}

export interface PlantMaster {
  id: string;
  plantId: string;
  plantName: string;
  capacity: number;
  location: string;
  status: "Active" | "Inactive";
  assignedOrders: string[];
}

// ============= PROCUREMENT & INVENTORY =============
export interface RawMaterial {
  id: string;
  materialId: string;
  materialName: string;
  category: "Sole" | "Upper" | "Accessories";
  vendorId: string;
  stockQuantity: number;
  reorderLevel: number;
  unitPrice: number;
  lastUpdated: string;
}

export interface Vendor {
  id: string;
  vendorId: string;
  vendorName: string;
  countryId: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  // Item information fields
  itemName?: string;
  itemCode?: string;
  brand?: string;
}

// ============= LEGACY PRODUCT DATA (for existing components) =============
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  sku: string;
  barcode: string;
  quantity: number;
  labelPrice: number;
  manufacturingCost: number;
  sellPrice: number;
  customerSellingPrice: number;
  sellingType: "in-store" | "online" | "both";
  dimensions: {
    width: number;
    height: number;
    length: number;
    unit: "mm" | "cm" | "m";
  };
  weight: {
    value: number;
    unit: "g" | "kg";
  };
  expiryDate?: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

// ============= INVENTORY ITEMS =============
export interface InventoryItem {
  id: string;
  itemName: string;
  category:
    | "Raw Materials"
    | "Components & Parts"
    | "Finished Footwear"
    | "Accessories & Hardware";
  subCategory: string;
  code: string; // Auto-generated ITM/25-26/09/001 format
  brand?: string; // Optional brand field
  color?: string; // Optional color field
  vendorId?: string; // Vendor who supplies this item
  expiryDate?: string;
  quantity: number;
  quantityUnit: "piece" | "pair" | "kg" | "gm" | "meter" | "sq-ft" | "liter";
  description?: string;
  isDraft: boolean; // New field to distinguish drafts from completed items
  lastUpdate: string;
  lastUpdateTime: string;
  iconColor: string;
  createdDate: string;
  updatedDate: string;
}

// ============= INVENTORY TRANSACTIONS =============
export interface InventoryTransaction {
  id: string;
  itemId: string;
  transactionType: "Stock In" | "Stock Out";
  quantity: number;
  previousStock: number;
  newStock: number;
  billNumber?: string;
  orderValue?: number;
  vendorId?: string;
  reason: string;
  remarks?: string;
  transactionDate: string;
  createdBy: string;
  createdDate: string;
}

// ============= DELIVERY MANAGEMENT =============
export interface DeliveryItem {
  id: string;
  projectId: string; // Link to RDProject
  projectCode: string; // Auto code from RDProject
  productName: string;
  brandName: string;
  categoryName: string;
  poNumber: string;
  poReceivedDate: string; // PO received date from R&D
  quantity: number;
  deliveryStatus: "Pending" | "Parcel Delivered" | "Delivered";
  deliveryDate?: string; // Actual delivery date
  expectedDeliveryDate?: string; // Expected delivery date
  aging: number; // Days between PO received and delivery (auto-calculated)
  advance?: number; // Advance payment amount in ₹
  advancePercentage?: number; // Advance payment percentage
  balance?: number; // Balance amount in ₹
  totalAmount?: number; // Total order amount in ₹
  trackingNumber?: string; // Courier/Parcel tracking number
  courierService?: string; // Courier service name
  deliveryAddress?: string; // Delivery address
  customerName?: string; // Customer/Client name
  customerContact?: string; // Customer contact number
  remarks?: string; // Additional remarks
  createdDate: string;
  updatedDate: string;
}

// Store State Interface
interface ERPStore {
  assignPersons: { id: string; name: string }[];

  currentModule: string;
  companies: CompanyMaster[];
  brands: BrandMaster[];
  categories: CategoryMaster[];
  types: TypeMaster[];
  colors: ColorMaster[];
  countries: CountryMaster[];
  rdProjects: RDProject[];
  prototypeFiles: PrototypeFile[];
  selectedRDProject: RDProject | null;
  users: User[];
  auditLogs: AuditLog[];
  currentUser: User | null;
  notifications: Notification[];
  productionOrders: ProductionOrder[];
  plants: PlantMaster[];
  rawMaterials: RawMaterial[];
  vendors: Vendor[];
  products: Product[];
  selectedProduct: Product | null;
  isEditingProduct: boolean;
  isLoading: boolean;
  materialRequests: MaterialRequest[];
  productionCards: ProductionCard[];
  inventoryItems: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  deliveryItems: DeliveryItem[];

  // Actions

  setAssignPersons: (list: { id: string; name: string }[]) => void;

  setCurrentModule: (module: string) => void;
  addBrand: (
    brand: Omit<BrandMaster, "id" | "brandCode" | "createdDate">
  ) => void;
  updateBrand: (id: string, updates: Partial<BrandMaster>) => void;
  deleteBrand: (id: string) => void;
  addCategory: (category: Omit<CategoryMaster, "id" | "categoryId">) => void;
  updateCategory: (id: string, updates: Partial<CategoryMaster>) => void;
  deleteCategory: (id: string) => void;
  addType: (type: Omit<TypeMaster, "id" | "typeId">) => void;
  updateType: (id: string, updates: Partial<TypeMaster>) => void;
  deleteType: (id: string) => void;
  addColor: (color: Omit<ColorMaster, "id" | "colorId">) => void;
  updateColor: (id: string, updates: Partial<ColorMaster>) => void;
  deleteColor: (id: string) => void;
  addRDProject: (
    project: Omit<
      RDProject,
      | "id"
      | "autoCode"
      | "createdDate"
      | "updatedDate"
      | "difference"
      | "duration"
      | "poDelay"
      | "updateNotes"
    >
  ) => void;
  updateRDProject: (id: string, updates: Partial<RDProject>) => void;
  deleteRDProject: (id: string) => void;
  selectRDProject: (project: RDProject | null) => void;
  addPrototypeFile: (file: Omit<PrototypeFile, "id" | "uploadedDate">) => void;
  deletePrototypeFile: (id: string) => void;
  addProductionOrder: (order: Omit<ProductionOrder, "id" | "poId">) => void;
  updateProductionOrder: (
    id: string,
    updates: Partial<ProductionOrder>
  ) => void;
  addProduct: (
    product: Omit<Product, "id" | "createdAt" | "updatedAt">
  ) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  selectProduct: (product: Product | null) => void;
  setEditingProduct: (editing: boolean) => void;
  addNotification: (
    notification: Omit<Notification, "id" | "createdDate">
  ) => void;
  markNotificationRead: (id: string) => void;
  logActivity: (activity: Omit<AuditLog, "id" | "timestamp">) => void;
  addMaterialRequest: (
    request: Omit<MaterialRequest, "id" | "requestedDate">
  ) => void;
  updateMaterialRequest: (
    id: string,
    updates: Partial<MaterialRequest>
  ) => void;
  getMaterialRequestByCardId: (cardId: string) => MaterialRequest | undefined;
  addProductionCard: (
    card: Omit<ProductionCard, "id" | "createdDate" | "updatedDate">
  ) => void;
  updateProductionCard: (id: string, updates: Partial<ProductionCard>) => void;
  deleteProductionCard: (id: string) => void;
  getProductionCardsByProject: (projectId: string) => ProductionCard[];
  addInventoryItem: (
    item: Omit<InventoryItem, "id" | "createdDate" | "updatedDate">
  ) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  getInventoryItemByCode: (code: string) => InventoryItem | undefined;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  addVendor: (vendor: Omit<Vendor, "id">) => void;
  addInventoryTransaction: (
    transaction: Omit<InventoryTransaction, "id" | "createdDate">
  ) => void;
  getInventoryTransactionsByDateRange: (
    startDate: string,
    endDate: string
  ) => InventoryTransaction[];
  getInventoryTransactionsByItem: (itemId: string) => InventoryTransaction[];
  addDeliveryItem: (
    item: Omit<DeliveryItem, "id" | "createdDate" | "updatedDate" | "aging">
  ) => void;
  updateDeliveryItem: (id: string, updates: Partial<DeliveryItem>) => void;
  deleteDeliveryItem: (id: string) => void;
  getDeliveryItemsByStatus: (
    status: "Pending" | "Parcel Delivered" | "Delivered"
  ) => DeliveryItem[];

  setRDProjects: (projects: RDProject[]) => void;
}

// Helper functions
const generateBrandCode = (existingBrands: BrandMaster[]): string => {
  const maxNum =
    existingBrands.length > 0
      ? Math.max(
          ...existingBrands.map((b) => parseInt(b.brandCode.slice(2)) || 0)
        )
      : 0;
  return `BR${(maxNum + 1).toString().padStart(3, "0")}`;
};

const generateRDCode = (existingProjects: RDProject[]): string => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;
  const month = (now.getMonth() + 1).toString().padStart(2, "0");

  const currentYearPrefix = `RND/${currentYear.toString().slice(-2)}-${nextYear
    .toString()
    .slice(-2)}/${month}/`;
  const currentYearProjects = existingProjects.filter((p) =>
    p.autoCode.startsWith(currentYearPrefix)
  );

  const maxNum =
    currentYearProjects.length > 0
      ? Math.max(
          ...currentYearProjects.map((p) => {
            const parts = p.autoCode.split("/");
            return parseInt(parts[3]) || 0;
          })
        )
      : 100;

  return `RND/${currentYear.toString().slice(-2)}-${nextYear
    .toString()
    .slice(-2)}/${month}/${(maxNum + 1).toString().padStart(3, "0")}`;
};

const generateInventoryCode = (existingItems: InventoryItem[]): string => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;
  const month = (now.getMonth() + 1).toString().padStart(2, "0");

  const currentYearPrefix = `ITM/${currentYear.toString().slice(-2)}-${nextYear
    .toString()
    .slice(-2)}/${month}/`;
  const currentYearItems = existingItems.filter((item) =>
    item.code.startsWith(currentYearPrefix)
  );

  const maxNum =
    currentYearItems.length > 0
      ? Math.max(
          ...currentYearItems.map((item) => {
            const parts = item.code.split("/");
            return parseInt(parts[3]) || 0;
          })
        )
      : 0;

  return `ITM/${currentYear.toString().slice(-2)}-${nextYear
    .toString()
    .slice(-2)}/${month}/${(maxNum + 1).toString().padStart(3, "0")}`;
};

// Sample Data
const sampleCompanies: CompanyMaster[] = [
  {
    id: "1",
    companyCode: "COM001",
    companyName: "Lifestyle International Ltd.",
    status: "Active",
    createdDate: "2023-01-01",
  },
  {
    id: "2",
    companyCode: "COM002",
    companyName: "Bacca Bucci Global Pvt. Ltd.",
    status: "Active",
    createdDate: "2023-01-02",
  },
  {
    id: "3",
    companyCode: "COM003",
    companyName: "Yoho Footwear Industries",
    status: "Active",
    createdDate: "2023-01-03",
  },
  {
    id: "4",
    companyCode: "COM004",
    companyName: "Toucan Sports & Leisure",
    status: "Active",
    createdDate: "2023-01-04",
  },
  {
    id: "5",
    companyCode: "COM005",
    companyName: "Woodland Shoes Pvt. Ltd.",
    status: "Active",
    createdDate: "2023-01-05",
  },
];

const sampleBrands: BrandMaster[] = [
  {
    id: "1",
    brandCode: "BR001",
    brandName: "Lifestyle",
    companyId: "1",
    status: "Active",
    createdDate: "2024-01-01",
  },
  {
    id: "2",
    brandCode: "BR002",
    brandName: "Bacca Bucci",
    companyId: "2",
    status: "Active",
    createdDate: "2024-01-02",
  },
  {
    id: "3",
    brandCode: "BR003",
    brandName: "Yoho",
    companyId: "3",
    status: "Active",
    createdDate: "2024-01-03",
  },
  {
    id: "4",
    brandCode: "BR004",
    brandName: "Toucan",
    companyId: "4",
    status: "Active",
    createdDate: "2024-01-04",
  },
  {
    id: "5",
    brandCode: "BR005",
    brandName: "Woodland",
    companyId: "5",
    status: "Active",
    createdDate: "2024-01-05",
  },
  {
    id: "6",
    brandCode: "BR006",
    brandName: "Lifestyle Sport",
    companyId: "1",
    status: "Active",
    createdDate: "2024-01-06",
  },
  {
    id: "7",
    brandCode: "BR007",
    brandName: "Bacca Bucci Premium",
    companyId: "2",
    status: "Active",
    createdDate: "2024-01-07",
  },
];

const sampleCategories: CategoryMaster[] = [
  {
    id: "1",
    categoryId: "CAT001",
    categoryName: "Slippers",
    companyId: "1",
    status: "Active",
  },
  {
    id: "2",
    categoryId: "CAT002",
    categoryName: "Sneakers",
    companyId: "1",
    status: "Active",
  },
  {
    id: "3",
    categoryId: "CAT003",
    categoryName: "Sandals",
    companyId: "2",
    status: "Active",
  },
  {
    id: "4",
    categoryId: "CAT004",
    categoryName: "Boots",
    companyId: "2",
    status: "Active",
  },
  {
    id: "5",
    categoryId: "CAT005",
    categoryName: "Formal",
    companyId: "3",
    status: "Active",
  },
  {
    id: "6",
    categoryId: "CAT006",
    categoryName: "Casual",
    companyId: "3",
    status: "Active",
  },
  {
    id: "7",
    categoryId: "CAT007",
    categoryName: "Sneakers",
    companyId: "2",
    status: "Active",
  },
  {
    id: "8",
    categoryId: "CAT008",
    categoryName: "Boots",
    companyId: "4",
    status: "Active",
  },
  {
    id: "9",
    categoryId: "CAT009",
    categoryName: "Casual",
    companyId: "4",
    status: "Active",
  },
  {
    id: "10",
    categoryId: "CAT010",
    categoryName: "Formal",
    companyId: "5",
    status: "Active",
  },
];

const sampleColors: ColorMaster[] = [
  {
    id: "1",
    colorId: "COL001",
    colorName: "Black",
    hexCode: "#000000",
    status: "Active",
  },
  {
    id: "2",
    colorId: "COL002",
    colorName: "White",
    hexCode: "#FFFFFF",
    status: "Active",
  },
  {
    id: "3",
    colorId: "COL003",
    colorName: "Brown",
    hexCode: "#8B4513",
    status: "Active",
  },
  {
    id: "4",
    colorId: "COL004",
    colorName: "Navy Blue",
    hexCode: "#000080",
    status: "Active",
  },
  {
    id: "5",
    colorId: "COL005",
    colorName: "Red",
    hexCode: "#FF0000",
    status: "Active",
  },
];

const sampleTypes: TypeMaster[] = [
  { id: "1", typeId: "TYP001", typeName: "Foxing", usageArea: "Sole" },
  { id: "2", typeId: "TYP002", typeName: "Phylon", usageArea: "Sole" },
  { id: "3", typeId: "TYP003", typeName: "CKD", usageArea: "Both" },
  { id: "4", typeId: "TYP004", typeName: "EVA", usageArea: "Sole" },
  { id: "5", typeId: "TYP005", typeName: "Leather", usageArea: "Upper" },
];

const sampleCountries: CountryMaster[] = [
  { id: "1", countryId: "CN001", countryName: "India", isoCode: "IN" },
  { id: "2", countryId: "CN002", countryName: "China", isoCode: "CN" },
  { id: "3", countryId: "CN003", countryName: "Vietnam", isoCode: "VN" },
  { id: "4", countryId: "CN004", countryName: "Indonesia", isoCode: "ID" },
];

const sampleUsers: User[] = [
  {
    id: "1",
    userName: "Admin User",
    email: "admin@company.com",
    role: "Admin",
    permissions: ["all"],
    status: "Active",
    lastLogin: "2024-01-23T09:30:00Z",
    createdDate: "2024-01-01",
  },
  {
    id: "2",
    userName: "R&D Manager",
    email: "rdmanager@company.com",
    role: "R&D Manager",
    permissions: ["rd_manage", "approve_costing"],
    status: "Active",
    lastLogin: "2024-01-23T08:45:00Z",
    createdDate: "2024-01-02",
  },
  {
    id: "3",
    userName: "Priyanka Sharma",
    email: "priyanka@company.com",
    role: "Designer",
    permissions: ["upload_prototype", "add_remarks"],
    status: "Active",
    lastLogin: "2024-01-23T07:15:00Z",
    createdDate: "2024-01-03",
  },
  {
    id: "4",
    userName: "Rahul Gupta",
    email: "rahul@company.com",
    role: "Designer",
    permissions: ["upload_prototype", "add_remarks"],
    status: "Active",
    lastLogin: "2024-01-22T16:20:00Z",
    createdDate: "2024-01-04",
  },
  {
    id: "5",
    userName: "Meera Patel",
    email: "meera@company.com",
    role: "Designer",
    permissions: ["upload_prototype", "add_remarks"],
    status: "Active",
    lastLogin: "2024-01-22T14:30:00Z",
    createdDate: "2024-01-05",
  },
  {
    id: "6",
    userName: "Anjali Singh",
    email: "anjali@company.com",
    role: "Designer",
    permissions: ["upload_prototype", "add_remarks"],
    status: "Active",
    lastLogin: "2024-01-22T11:45:00Z",
    createdDate: "2024-01-06",
  },
  {
    id: "7",
    userName: "Suresh Kumar",
    email: "suresh@company.com",
    role: "Designer",
    permissions: ["upload_prototype", "add_remarks"],
    status: "Active",
    lastLogin: "2024-01-21T09:15:00Z",
    createdDate: "2024-01-07",
  },
  {
    id: "8",
    userName: "Kavya Reddy",
    email: "kavya@company.com",
    role: "Designer",
    permissions: ["upload_prototype", "add_remarks"],
    status: "Active",
    lastLogin: "2024-01-21T15:30:00Z",
    createdDate: "2024-01-08",
  },
  {
    id: "9",
    userName: "Rajesh Jain",
    email: "rajesh@company.com",
    role: "Designer",
    permissions: ["upload_prototype", "add_remarks"],
    status: "Active",
    lastLogin: "2024-01-20T13:20:00Z",
    createdDate: "2024-01-09",
  },
  {
    id: "10",
    userName: "Deepak Agarwal",
    email: "deepak@company.com",
    role: "Designer",
    permissions: ["upload_prototype", "add_remarks"],
    status: "Active",
    lastLogin: "2024-01-20T10:45:00Z",
    createdDate: "2024-01-10",
  },
];

const sampleVendors: Vendor[] = [
  {
    id: "1",
    vendorId: "VND001",
    vendorName: "Premium Leather Suppliers Ltd.",
    countryId: "1",
    contactPerson: "Rajesh Kumar",
    email: "rajesh@premiumleather.com",
    phone: "+91-9876543210",
    status: "Active",
    itemName: "Premium Leather",
    itemCode: "PL-001",
    brand: "Clarino",
  },
  {
    id: "2",
    vendorId: "VND002",
    vendorName: "Global Footwear Components",
    countryId: "2",
    contactPerson: "Chen Wei",
    email: "chen@globalfootwear.cn",
    phone: "+86-1234567890",
    status: "Active",
    itemName: "Rubber Soles",
    itemCode: "RS-002",
    brand: "Vibram",
  },
  {
    id: "3",
    vendorId: "VND003",
    vendorName: "European Hardware Solutions",
    countryId: "1",
    contactPerson: "Marco Rossi",
    email: "marco@euhardware.com",
    phone: "+39-3456789012",
    status: "Active",
    itemName: "Metal Eyelets",
    itemCode: "ME-003",
    brand: "EuroHard",
  },
  {
    id: "4",
    vendorId: "VND004",
    vendorName: "Textile & Fabric Co.",
    countryId: "3",
    contactPerson: "Nguyen Van",
    email: "nguyen@textilefabric.vn",
    phone: "+84-2345678901",
    status: "Active",
    itemName: "Canvas Fabric",
    itemCode: "CF-004",
    brand: "TexFab",
  },
  {
    id: "5",
    vendorId: "VND005",
    vendorName: "Advanced Sole Technology",
    countryId: "1",
    contactPerson: "Amit Sharma",
    email: "amit@advancedsole.com",
    phone: "+91-8765432109",
    status: "Active",
    itemName: "EVA Foam",
    itemCode: "EF-005",
    brand: "TechSole",
  },
  {
    id: "6",
    vendorId: "VND006",
    vendorName: "Quality Chemicals Inc.",
    countryId: "4",
    contactPerson: "Sari Indira",
    email: "sari@qualitychemicals.id",
    phone: "+62-3456789012",
    status: "Active",
    itemName: "Adhesive Glue",
    itemCode: "AG-006",
    brand: "ChemBond",
  },
];

// const sampleRDProjects: RDProject[] = [
//   {
//     id: "1",
//     autoCode: "RND/25-26/09/101",
//     companyId: "1",
//     brandId: "1",
//     categoryId: "2",
//     typeId: "2",
//     colorId: "1",
//     countryId: "1",
//     designerId: "3",
//     status: "Green Seal",
//     tentativeCost: 250000,
//     targetCost: 240000,
//     finalCost: 235000,
//     difference: -5000,
//     startDate: "2024-01-01",
//     endDate: "2024-03-01",
//     duration: 59,
//     poTarget: "2024-03-15",
//     poReceived: "2024-03-10",
//     poNumber: "PO-LS-2024-001",
//     poStatus: "Approved",
//     poDelay: -5,
//     nextUpdateDate: "2024-01-25",
//     remarks: "Premium summer collection targeting young professionals",
//     clientFeedback: "OK",
//     priority: "Medium",
//     taskInc: "Priyanka",
//     updateNotes: "Final review meeting scheduled with client for sign-off",
//     createdDate: "2024-01-01T10:00:00Z",
//     updatedDate: "2024-01-20T15:30:00Z",
//     materials: [
//       {
//         id: "1",
//         name: "Upper",
//         specification: "Rexine",
//         requirement: "25",
//         unit: "pair/vth",
//       },
//       {
//         id: "2",
//         name: "Lining",
//         specification: "Skimh",
//         requirement: "25",
//         unit: "pair @ 15/-",
//       },
//       {
//         id: "3",
//         name: "Lining",
//         specification: "EVA",
//         requirement: "3370 - 1.5mm",
//         unit: "35pair",
//       },
//     ],
//     components: [
//       {
//         id: "1",
//         name: "Foam",
//         specification: "-",
//         requirement: "7.5",
//         unit: "gm",
//       },
//       {
//         id: "2",
//         name: "Velcro",
//         specification: "75mm",
//         requirement: "1.25",
//         unit: "pair",
//       },
//       {
//         id: "3",
//         name: "Buckle",
//         specification: "-",
//         requirement: "2",
//         unit: "pcs",
//       },
//       {
//         id: "4",
//         name: "Trim",
//         specification: "sticker",
//         requirement: "10",
//         unit: "pcs",
//       },
//     ],
//     coverPhoto:
//       "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzbmVha2VyJTIwc2hvZXxlbnwxfHx8fDE3NTk1ODQ3NTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
//     additionalImages: [
//       "https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwYm9vdCUyMGZvb3R3ZWFyfGVufDF8fHx8MTc1OTU5MTUxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
//       "https://images.unsplash.com/photo-1554062097-69c634085c6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBzYW5kYWxzfGVufDF8fHx8MTc1OTU5MTUyMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
//       "https://images.unsplash.com/photo-1668069226492-508742b03147?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBkcmVzcyUyMHNob2VzfGVufDF8fHx8MTc1OTUxNTY2MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
//     ],
//     dynamicImages: [],
//   },
//   {
//     id: "2",
//     autoCode: "RND/25-26/09/102",
//     companyId: "2",
//     brandId: "2",
//     categoryId: "3",
//     typeId: "1",
//     colorId: "2",
//     countryId: "2",
//     designerId: "3",
//     status: "Red Seal",
//     tentativeCost: 180000,
//     targetCost: 175000,
//     finalCost: 172000,
//     difference: -3000,
//     startDate: "2024-01-15",
//     endDate: "2024-03-15",
//     duration: 60,
//     poTarget: "2024-04-01",
//     poReceived: "2024-03-28",
//     poNumber: "PO-BB-2024-002",
//     poStatus: "Pending",
//     poDelay: -4,
//     nextUpdateDate: "2024-01-30",
//     remarks: "Comfortable sandals for casual wear",
//     clientFeedback: "Update Required",
//     priority: "High",
//     taskInc: "Rahul",
//     updateNotes: "Need to revise sole design based on client feedback",
//     createdDate: "2024-01-15T09:00:00Z",
//     updatedDate: "2024-01-22T11:45:00Z",
//     materials: [
//       {
//         id: "5",
//         name: "Strap Material",
//         specification: "PU Leather",
//         requirement: "30",
//         unit: "pair",
//       },
//       {
//         id: "6",
//         name: "Base",
//         specification: "EVA",
//         requirement: "40",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "5",
//         name: "Buckle",
//         specification: "Metal",
//         requirement: "2",
//         unit: "pcs",
//       },
//       {
//         id: "6",
//         name: "Padding",
//         specification: "Memory Foam",
//         requirement: "15",
//         unit: "gm",
//       },
//     ],
//     coverPhoto:
//       "https://images.unsplash.com/photo-1554062097-69c634085c6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBzYW5kYWxzfGVufDF8fHx8MTc1OTU5MTUyMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
//     additionalImages: [
//       "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzbmVha2VyJTIwc2hvZXxlbnwxfHx8fDE3NTk1ODQ3NTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
//       "https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwYm9vdCUyMGZvb3R3ZWFyfGVufDF8fHx8MTc1OTU5MTUxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
//     ],
//     dynamicImages: [],
//   },
//   {
//     id: "3",
//     autoCode: "RND/25-26/09/103",
//     companyId: "3",
//     brandId: "3",
//     categoryId: "5",
//     typeId: "5",
//     colorId: "3",
//     countryId: "1",
//     designerId: "2",
//     status: "PO Issued",
//     tentativeCost: 320000,
//     targetCost: 310000,
//     finalCost: 308000,
//     difference: -2000,
//     startDate: "2024-02-01",
//     endDate: "2024-04-30",
//     duration: 89,
//     poTarget: "2024-05-15",
//     poReceived: "2024-05-12",
//     poNumber: "PO-YH-2024-003",
//     poStatus: "Approved",
//     poDelay: -3,
//     nextUpdateDate: "2024-02-15",
//     remarks: "Premium boots for winter collection",
//     clientFeedback: "OK",
//     priority: "High",
//     taskInc: "Meera",
//     updateNotes: "Production started, quality checks in progress",
//     createdDate: "2024-02-01T14:00:00Z",
//     updatedDate: "2024-02-10T16:20:00Z",
//     materials: [
//       {
//         id: "7",
//         name: "Leather Upper",
//         specification: "Full Grain",
//         requirement: "45",
//         unit: "sq-ft",
//       },
//       {
//         id: "8",
//         name: "Lining",
//         specification: "Thinsulate",
//         requirement: "30",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "7",
//         name: "Zipper",
//         specification: "YKK",
//         requirement: "1",
//         unit: "pcs",
//       },
//       {
//         id: "8",
//         name: "Sole",
//         specification: "Vibram",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//     coverPhoto:
//       "https://images.unsplash.com/photo-1668069226492-508742b03147?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBkcmVzcyUyMHNob2VzfGVufDF8fHx8MTc1OTUxNTY2MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
//     additionalImages: [
//       "https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwYm9vdCUyMGZvb3R3ZWFyfGVufDF8fHx8MTc1OTU5MTUxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
//       "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzbmVha2VyJTIwc2hvZXxlbnwxfHx8fDE3NTk1ODQ3NTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
//       "https://images.unsplash.com/photo-1554062097-69c634085c6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBzYW5kYWxzfGVufDF8fHx8MTc1OTU5MTUyMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
//     ],
//     dynamicImages: [
//       "https://images.unsplash.com/photo-1668069226492-508742b03147?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBkcmVzcyUyMHNob2VzfGVufDF8fHx8MTc1OTUxNTY2MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
//     ],
//   },
//   {
//     id: "4",
//     autoCode: "RND/25-26/09/104",
//     companyId: "4",
//     brandId: "4",
//     categoryId: "9",
//     typeId: "4",
//     colorId: "4",
//     countryId: "3",
//     designerId: "3",
//     status: "Prototype",
//     tentativeCost: 120000,
//     targetCost: 115000,
//     finalCost: 118000,
//     difference: 3000,
//     startDate: "2024-01-20",
//     endDate: "2024-03-20",
//     duration: 60,
//     poTarget: "2024-04-10",
//     poReceived: "2024-04-08",
//     poDelay: -2,
//     nextUpdateDate: "2024-02-05",
//     remarks: "Comfortable slippers for home use",
//     clientFeedback: "Pending",
//     priority: "Medium",
//     taskInc: "Anjali",
//     updateNotes: "Prototype testing phase, waiting for feedback",
//     createdDate: "2024-01-20T11:30:00Z",
//     updatedDate: "2024-01-25T13:15:00Z",
//     materials: [
//       {
//         id: "9",
//         name: "EVA Sheet",
//         specification: "Density 0.15",
//         requirement: "20",
//         unit: "sq-ft",
//       },
//       {
//         id: "10",
//         name: "Fabric",
//         specification: "Cotton",
//         requirement: "15",
//         unit: "yard",
//       },
//     ],
//     components: [
//       {
//         id: "9",
//         name: "Heel Pad",
//         specification: "Gel",
//         requirement: "2",
//         unit: "pcs",
//       },
//       {
//         id: "10",
//         name: "Strap",
//         specification: "Elastic",
//         requirement: "0.5",
//         unit: "meter",
//       },
//     ],
//   },
//   {
//     id: "5",
//     autoCode: "RND/25-26/09/105",
//     companyId: "5",
//     brandId: "5",
//     categoryId: "10",
//     typeId: "5",
//     colorId: "1",
//     countryId: "1",
//     designerId: "2",
//     status: "Final Approved",
//     tentativeCost: 280000,
//     targetCost: 275000,
//     finalCost: 273000,
//     difference: -2000,
//     startDate: "2024-01-10",
//     endDate: "2024-03-25",
//     duration: 75,
//     poTarget: "2024-04-05",
//     poReceived: "2024-04-03",
//     poNumber: "PO-WD-2024-004",
//     poStatus: "Approved",
//     poDelay: -2,
//     nextUpdateDate: "2024-02-20",
//     remarks: "Formal shoes for office wear",
//     clientFeedback: "OK",
//     priority: "High",
//     taskInc: "Suresh",
//     updateNotes: "Ready for production, all approvals received",
//     createdDate: "2024-01-10T08:45:00Z",
//     updatedDate: "2024-02-15T10:30:00Z",
//     materials: [
//       {
//         id: "11",
//         name: "Patent Leather",
//         specification: "Grade A",
//         requirement: "35",
//         unit: "sq-ft",
//       },
//       {
//         id: "12",
//         name: "Insole",
//         specification: "Memory Foam",
//         requirement: "25",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "11",
//         name: "Laces",
//         specification: "Waxed Cotton",
//         requirement: "1",
//         unit: "pair",
//       },
//       {
//         id: "12",
//         name: "Metal Eyelets",
//         specification: "Brass",
//         requirement: "12",
//         unit: "pcs",
//       },
//     ],
//   },
//   {
//     id: "6",
//     autoCode: "RND/25-26/09/106",
//     companyId: "1",
//     brandId: "6",
//     categoryId: "2",
//     typeId: "3",
//     colorId: "5",
//     countryId: "2",
//     designerId: "3",
//     status: "Costing Pending",
//     tentativeCost: 200000,
//     targetCost: 195000,
//     finalCost: 0,
//     difference: 0,
//     startDate: "2024-02-05",
//     endDate: "2024-04-05",
//     duration: 60,
//     poTarget: "2024-04-20",
//     poReceived: "2024-04-18",
//     poDelay: -2,
//     nextUpdateDate: "2024-02-12",
//     remarks: "Casual shoes for everyday wear",
//     clientFeedback: "Pending",
//     priority: "Medium",
//     taskInc: "Kavya",
//     updateNotes: "Waiting for cost analysis from procurement team",
//     createdDate: "2024-02-05T12:00:00Z",
//     updatedDate: "2024-02-08T14:45:00Z",
//     materials: [
//       {
//         id: "13",
//         name: "Canvas",
//         specification: "Heavy Duty",
//         requirement: "28",
//         unit: "yard",
//       },
//       {
//         id: "14",
//         name: "Rubber Sheet",
//         specification: "5mm thick",
//         requirement: "20",
//         unit: "sq-ft",
//       },
//     ],
//     components: [
//       {
//         id: "13",
//         name: "Grommets",
//         specification: "Metal",
//         requirement: "8",
//         unit: "pcs",
//       },
//       {
//         id: "14",
//         name: "Tongue Padding",
//         specification: "Foam",
//         requirement: "5",
//         unit: "gm",
//       },
//     ],
//   },
//   {
//     id: "7",
//     autoCode: "RND/25-26/09/107",
//     companyId: "2",
//     brandId: "7",
//     categoryId: "7",
//     typeId: "2",
//     colorId: "2",
//     countryId: "4",
//     designerId: "2",
//     status: "Costing Received",
//     tentativeCost: 150000,
//     targetCost: 145000,
//     finalCost: 148000,
//     difference: 3000,
//     startDate: "2024-01-25",
//     endDate: "2024-03-30",
//     duration: 65,
//     poTarget: "2024-04-12",
//     poReceived: "2024-04-10",
//     poDelay: -2,
//     nextUpdateDate: "2024-02-08",
//     remarks: "Lightweight sneakers for sports",
//     clientFeedback: "Update Required",
//     priority: "High",
//     taskInc: "Rajesh",
//     updateNotes: "Cost received, need approval for slight price increase",
//     createdDate: "2024-01-25T15:20:00Z",
//     updatedDate: "2024-02-01T09:10:00Z",
//     materials: [
//       {
//         id: "15",
//         name: "Mesh Fabric",
//         specification: "Breathable",
//         requirement: "22",
//         unit: "yard",
//       },
//       {
//         id: "16",
//         name: "Phylon Sole",
//         specification: "Lightweight",
//         requirement: "25",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "15",
//         name: "Air Cushion",
//         specification: "PU",
//         requirement: "2",
//         unit: "pcs",
//       },
//       {
//         id: "16",
//         name: "Reflective Strip",
//         specification: "3M",
//         requirement: "0.3",
//         unit: "meter",
//       },
//     ],
//   },
//   {
//     id: "8",
//     autoCode: "RND/25-26/09/108",
//     companyId: "3",
//     brandId: "3",
//     categoryId: "6",
//     typeId: "1",
//     colorId: "3",
//     countryId: "1",
//     designerId: "3",
//     status: "Idea Submitted",
//     tentativeCost: 90000,
//     targetCost: 85000,
//     finalCost: 0,
//     difference: 0,
//     startDate: "2024-02-10",
//     endDate: "2024-04-15",
//     duration: 65,
//     poTarget: "2024-05-01",
//     poReceived: "2024-04-28",
//     poDelay: -3,
//     nextUpdateDate: "2024-02-18",
//     remarks: "Beach sandals for summer collection",
//     clientFeedback: "Pending",
//     priority: "Low",
//     taskInc: "Deepak",
//     updateNotes: "Initial concept submitted, waiting for preliminary review",
//     createdDate: "2024-02-10T16:30:00Z",
//     updatedDate: "2024-02-10T16:30:00Z",
//     materials: [
//       {
//         id: "17",
//         name: "TPU Straps",
//         specification: "Flexible",
//         requirement: "18",
//         unit: "yard",
//       },
//       {
//         id: "18",
//         name: "Cork Base",
//         specification: "Natural",
//         requirement: "15",
//         unit: "sq-ft",
//       },
//     ],
//     components: [
//       {
//         id: "17",
//         name: "Toe Post",
//         specification: "Soft",
//         requirement: "1",
//         unit: "pcs",
//       },
//       {
//         id: "18",
//         name: "Heel Cushion",
//         specification: "Gel",
//         requirement: "2",
//         unit: "pcs",
//       },
//     ],
//   },
//   {
//     id: "9",
//     autoCode: "RND/25-26/09/109",
//     companyId: "4",
//     brandId: "4",
//     categoryId: "8",
//     typeId: "5",
//     colorId: "1",
//     countryId: "2",
//     designerId: "4",
//     status: "Green Seal",
//     tentativeCost: 290000,
//     targetCost: 285000,
//     finalCost: 283000,
//     difference: -2000,
//     startDate: "2024-01-18",
//     endDate: "2024-03-28",
//     duration: 70,
//     poTarget: "2024-04-15",
//     poReceived: "2024-04-12",
//     poNumber: "PO-TC-2024-005",
//     poStatus: "Approved",
//     poDelay: -3,
//     nextUpdateDate: "2024-02-22",
//     remarks: "Hiking boots for outdoor enthusiasts",
//     clientFeedback: "OK",
//     priority: "High",
//     taskInc: "Priyanka",
//     updateNotes: "Final quality check completed, ready for production sign-off",
//     createdDate: "2024-01-18T10:15:00Z",
//     updatedDate: "2024-02-18T11:30:00Z",
//     materials: [
//       {
//         id: "19",
//         name: "Synthetic Leather",
//         specification: "Waterproof",
//         requirement: "40",
//         unit: "sq-ft",
//       },
//       {
//         id: "20",
//         name: "Nylon Mesh",
//         specification: "Reinforced",
//         requirement: "20",
//         unit: "yard",
//       },
//     ],
//     components: [
//       {
//         id: "19",
//         name: "D-Rings",
//         specification: "Stainless Steel",
//         requirement: "6",
//         unit: "pcs",
//       },
//       {
//         id: "20",
//         name: "Shock Absorber",
//         specification: "EVA",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//   },
//   {
//     id: "10",
//     autoCode: "RND/25-26/09/110",
//     companyId: "1",
//     brandId: "1",
//     categoryId: "1",
//     typeId: "4",
//     colorId: "4",
//     countryId: "3",
//     designerId: "5",
//     status: "Prototype",
//     tentativeCost: 95000,
//     targetCost: 90000,
//     finalCost: 92000,
//     difference: 2000,
//     startDate: "2024-02-01",
//     endDate: "2024-04-01",
//     duration: 60,
//     poTarget: "2024-04-20",
//     poReceived: "2024-04-18",
//     poDelay: -2,
//     nextUpdateDate: "2024-02-25",
//     remarks: "Comfort slippers for indoor use",
//     clientFeedback: "Update Required",
//     priority: "Low",
//     taskInc: "Rahul",
//     updateNotes: "Prototype samples sent for client review, feedback pending",
//     createdDate: "2024-02-01T09:30:00Z",
//     updatedDate: "2024-02-15T14:20:00Z",
//     materials: [
//       {
//         id: "21",
//         name: "Fleece Fabric",
//         specification: "Soft Touch",
//         requirement: "15",
//         unit: "yard",
//       },
//       {
//         id: "22",
//         name: "TPR Sole",
//         specification: "Anti-Slip",
//         requirement: "20",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "21",
//         name: "Memory Foam Insole",
//         specification: "Premium",
//         requirement: "1",
//         unit: "pair",
//       },
//       {
//         id: "22",
//         name: "Elastic Band",
//         specification: "Stretchable",
//         requirement: "0.4",
//         unit: "meter",
//       },
//     ],
//   },
//   {
//     id: "11",
//     autoCode: "RND/25-26/09/111",
//     companyId: "2",
//     brandId: "2",
//     categoryId: "3",
//     typeId: "3",
//     colorId: "5",
//     countryId: "1",
//     designerId: "6",
//     status: "Red Seal",
//     tentativeCost: 165000,
//     targetCost: 160000,
//     finalCost: 162000,
//     difference: 2000,
//     startDate: "2024-01-22",
//     endDate: "2024-03-22",
//     duration: 60,
//     poTarget: "2024-04-08",
//     poReceived: "2024-04-06",
//     poNumber: "PO-BB-2024-006",
//     poStatus: "Pending",
//     poDelay: -2,
//     nextUpdateDate: "2024-02-10",
//     remarks: "Trendy sandals for youth market",
//     clientFeedback: "OK",
//     priority: "Medium",
//     taskInc: "Meera",
//     updateNotes: "Red seal approval in progress, minor design tweaks required",
//     createdDate: "2024-01-22T13:45:00Z",
//     updatedDate: "2024-02-05T10:15:00Z",
//     materials: [
//       {
//         id: "23",
//         name: "PVC Straps",
//         specification: "Colorful",
//         requirement: "25",
//         unit: "yard",
//       },
//       {
//         id: "24",
//         name: "EVA Midsole",
//         specification: "Lightweight",
//         requirement: "22",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "23",
//         name: "Logo Patch",
//         specification: "Embossed",
//         requirement: "2",
//         unit: "pcs",
//       },
//       {
//         id: "24",
//         name: "Heel Strap",
//         specification: "Adjustable",
//         requirement: "1",
//         unit: "pcs",
//       },
//     ],
//   },
//   {
//     id: "12",
//     autoCode: "RND/25-26/09/112",
//     companyId: "5",
//     brandId: "5",
//     categoryId: "10",
//     typeId: "5",
//     colorId: "3",
//     countryId: "4",
//     designerId: "7",
//     status: "Costing Pending",
//     tentativeCost: 310000,
//     targetCost: 305000,
//     finalCost: 0,
//     difference: 0,
//     startDate: "2024-02-08",
//     endDate: "2024-04-18",
//     duration: 70,
//     poTarget: "2024-05-05",
//     poReceived: "2024-05-02",
//     poDelay: -3,
//     nextUpdateDate: "2024-02-20",
//     remarks: "Executive formal shoes for corporate clients",
//     clientFeedback: "Pending",
//     priority: "High",
//     taskInc: "Anjali",
//     updateNotes: "Material sourcing in progress, cost estimation pending",
//     createdDate: "2024-02-08T11:00:00Z",
//     updatedDate: "2024-02-12T15:45:00Z",
//     materials: [
//       {
//         id: "25",
//         name: "Premium Calfskin",
//         specification: "Italian",
//         requirement: "50",
//         unit: "sq-ft",
//       },
//       {
//         id: "26",
//         name: "Leather Lining",
//         specification: "Soft",
//         requirement: "30",
//         unit: "sq-ft",
//       },
//     ],
//     components: [
//       {
//         id: "25",
//         name: "Metal Buckle",
//         specification: "Gold Plated",
//         requirement: "2",
//         unit: "pcs",
//       },
//       {
//         id: "26",
//         name: "Leather Sole",
//         specification: "Goodyear",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//   },
//   {
//     id: "13",
//     autoCode: "RND/25-26/09/113",
//     companyId: "3",
//     brandId: "3",
//     categoryId: "6",
//     typeId: "2",
//     colorId: "2",
//     countryId: "2",
//     designerId: "8",
//     status: "Final Approved",
//     tentativeCost: 135000,
//     targetCost: 130000,
//     finalCost: 132000,
//     difference: 2000,
//     startDate: "2024-01-28",
//     endDate: "2024-03-30",
//     duration: 62,
//     poTarget: "2024-04-15",
//     poReceived: "2024-04-12",
//     poNumber: "PO-YH-2024-007",
//     poStatus: "Approved",
//     poDelay: -3,
//     nextUpdateDate: "2024-02-28",
//     remarks: "Casual loafers for daily wear",
//     clientFeedback: "OK",
//     priority: "Medium",
//     taskInc: "Suresh",
//     updateNotes: "All approvals received, production scheduled to begin",
//     createdDate: "2024-01-28T14:30:00Z",
//     updatedDate: "2024-02-20T09:45:00Z",
//     materials: [
//       {
//         id: "27",
//         name: "Suede Leather",
//         specification: "Premium",
//         requirement: "32",
//         unit: "sq-ft",
//       },
//       {
//         id: "28",
//         name: "Rubber Sole",
//         specification: "Crepe",
//         requirement: "25",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "27",
//         name: "Tassel",
//         specification: "Leather",
//         requirement: "2",
//         unit: "pcs",
//       },
//       {
//         id: "28",
//         name: "Comfort Insole",
//         specification: "Cushioned",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//   },
//   {
//     id: "14",
//     autoCode: "RND/25-26/09/114",
//     companyId: "1",
//     brandId: "6",
//     categoryId: "2",
//     typeId: "1",
//     colorId: "1",
//     countryId: "1",
//     designerId: "3",
//     status: "Idea Submitted",
//     tentativeCost: 210000,
//     targetCost: 205000,
//     finalCost: 0,
//     difference: 0,
//     startDate: "2024-02-12",
//     endDate: "2024-04-22",
//     duration: 70,
//     poTarget: "2024-05-08",
//     poReceived: "2024-05-05",
//     poDelay: -3,
//     nextUpdateDate: "2024-02-26",
//     remarks: "Athletic sneakers for running enthusiasts",
//     clientFeedback: "Pending",
//     priority: "High",
//     taskInc: "Kavya",
//     updateNotes: "Initial design concepts submitted for review",
//     createdDate: "2024-02-12T10:00:00Z",
//     updatedDate: "2024-02-12T10:00:00Z",
//     materials: [
//       {
//         id: "29",
//         name: "Breathable Mesh",
//         specification: "Technical",
//         requirement: "28",
//         unit: "yard",
//       },
//       {
//         id: "30",
//         name: "Foam Padding",
//         specification: "High Density",
//         requirement: "12",
//         unit: "sq-ft",
//       },
//     ],
//     components: [
//       {
//         id: "29",
//         name: "Reflective Tape",
//         specification: "3M Scotchlite",
//         requirement: "0.5",
//         unit: "meter",
//       },
//       {
//         id: "30",
//         name: "Lace Locks",
//         specification: "Plastic",
//         requirement: "2",
//         unit: "pcs",
//       },
//     ],
//   },
//   {
//     id: "15",
//     autoCode: "RND/25-26/09/115",
//     companyId: "2",
//     brandId: "7",
//     categoryId: "7",
//     typeId: "4",
//     colorId: "3",
//     countryId: "2",
//     designerId: "4",
//     status: "Costing Received",
//     tentativeCost: 175000,
//     targetCost: 170000,
//     finalCost: 173000,
//     difference: 3000,
//     startDate: "2024-01-30",
//     endDate: "2024-04-05",
//     duration: 66,
//     poTarget: "2024-04-25",
//     poReceived: "2024-04-22",
//     poDelay: -3,
//     nextUpdateDate: "2024-02-18",
//     remarks: "Premium basketball sneakers",
//     clientFeedback: "Update Required",
//     priority: "Medium",
//     taskInc: "Rajesh",
//     updateNotes: "Cost analysis complete, awaiting client approval on pricing",
//     createdDate: "2024-01-30T11:30:00Z",
//     updatedDate: "2024-02-10T14:00:00Z",
//     materials: [
//       {
//         id: "31",
//         name: "Synthetic Upper",
//         specification: "Durable",
//         requirement: "35",
//         unit: "sq-ft",
//       },
//       {
//         id: "32",
//         name: "Air Sole Unit",
//         specification: "Pressurized",
//         requirement: "20",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "31",
//         name: "Ankle Support",
//         specification: "Reinforced",
//         requirement: "1",
//         unit: "pair",
//       },
//       {
//         id: "32",
//         name: "Traction Pads",
//         specification: "Rubber",
//         requirement: "4",
//         unit: "pcs",
//       },
//     ],
//   },
//   {
//     id: "16",
//     autoCode: "RND/25-26/09/116",
//     companyId: "3",
//     brandId: "3",
//     categoryId: "5",
//     typeId: "5",
//     colorId: "1",
//     countryId: "3",
//     designerId: "5",
//     status: "Prototype",
//     tentativeCost: 295000,
//     targetCost: 290000,
//     finalCost: 292000,
//     difference: 2000,
//     startDate: "2024-02-03",
//     endDate: "2024-04-15",
//     duration: 72,
//     poTarget: "2024-05-02",
//     poReceived: "2024-04-30",
//     poDelay: -2,
//     nextUpdateDate: "2024-02-24",
//     remarks: "Premium dress shoes for executives",
//     clientFeedback: "Pending",
//     priority: "High",
//     taskInc: "Deepak",
//     updateNotes: "Prototype samples ready for client inspection",
//     createdDate: "2024-02-03T09:15:00Z",
//     updatedDate: "2024-02-18T16:30:00Z",
//     materials: [
//       {
//         id: "33",
//         name: "Italian Leather",
//         specification: "Full Grain",
//         requirement: "48",
//         unit: "sq-ft",
//       },
//       {
//         id: "34",
//         name: "Silk Lining",
//         specification: "Premium",
//         requirement: "25",
//         unit: "sq-ft",
//       },
//     ],
//     components: [
//       {
//         id: "33",
//         name: "Metal Aglets",
//         specification: "Brass",
//         requirement: "4",
//         unit: "pcs",
//       },
//       {
//         id: "34",
//         name: "Welt Construction",
//         specification: "Goodyear",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//   },
//   {
//     id: "17",
//     autoCode: "RND/25-26/09/117",
//     companyId: "4",
//     brandId: "4",
//     categoryId: "9",
//     typeId: "3",
//     colorId: "5",
//     countryId: "4",
//     designerId: "6",
//     status: "Red Seal",
//     tentativeCost: 155000,
//     targetCost: 150000,
//     finalCost: 152000,
//     difference: 2000,
//     startDate: "2024-01-25",
//     endDate: "2024-03-28",
//     duration: 63,
//     poTarget: "2024-04-18",
//     poReceived: "2024-04-15",
//     poNumber: "PO-TC-2024-008",
//     poStatus: "Pending",
//     poDelay: -3,
//     nextUpdateDate: "2024-02-15",
//     remarks: "Outdoor casual footwear for adventure sports",
//     clientFeedback: "OK",
//     priority: "Medium",
//     taskInc: "Priyanka",
//     updateNotes: "Red seal review scheduled, minor adjustments needed",
//     createdDate: "2024-01-25T12:45:00Z",
//     updatedDate: "2024-02-08T11:20:00Z",
//     materials: [
//       {
//         id: "35",
//         name: "Canvas Material",
//         specification: "Water Resistant",
//         requirement: "30",
//         unit: "yard",
//       },
//       {
//         id: "36",
//         name: "Trail Sole",
//         specification: "Aggressive Tread",
//         requirement: "22",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "35",
//         name: "Quick Lace System",
//         specification: "Bungee",
//         requirement: "1",
//         unit: "set",
//       },
//       {
//         id: "36",
//         name: "Toe Cap",
//         specification: "Protective",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//   },
//   {
//     id: "18",
//     autoCode: "RND/25-26/09/118",
//     companyId: "5",
//     brandId: "5",
//     categoryId: "10",
//     typeId: "5",
//     colorId: "4",
//     countryId: "1",
//     designerId: "7",
//     status: "Green Seal",
//     tentativeCost: 265000,
//     targetCost: 260000,
//     finalCost: 262000,
//     difference: 2000,
//     startDate: "2024-01-20",
//     endDate: "2024-03-25",
//     duration: 65,
//     poTarget: "2024-04-12",
//     poReceived: "2024-04-09",
//     poNumber: "PO-WD-2024-009",
//     poStatus: "Approved",
//     poDelay: -3,
//     nextUpdateDate: "2024-02-22",
//     remarks: "Business formal shoes with modern design",
//     clientFeedback: "OK",
//     priority: "High",
//     taskInc: "Meera",
//     updateNotes: "Green seal approved, ready for final production",
//     createdDate: "2024-01-20T08:30:00Z",
//     updatedDate: "2024-02-15T13:45:00Z",
//     materials: [
//       {
//         id: "37",
//         name: "Patent Leather",
//         specification: "High Gloss",
//         requirement: "38",
//         unit: "sq-ft",
//       },
//       {
//         id: "38",
//         name: "Memory Foam",
//         specification: "Advanced",
//         requirement: "18",
//         unit: "sq-ft",
//       },
//     ],
//     components: [
//       {
//         id: "37",
//         name: "Oxford Laces",
//         specification: "Waxed",
//         requirement: "1",
//         unit: "pair",
//       },
//       {
//         id: "38",
//         name: "Heel Counter",
//         specification: "Rigid",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//   },
//   {
//     id: "19",
//     autoCode: "RND/25-26/09/119",
//     companyId: "1",
//     brandId: "1",
//     categoryId: "1",
//     typeId: "4",
//     colorId: "2",
//     countryId: "2",
//     designerId: "8",
//     status: "Final Approved",
//     tentativeCost: 88000,
//     targetCost: 85000,
//     finalCost: 86000,
//     difference: 1000,
//     startDate: "2024-01-18",
//     endDate: "2024-03-20",
//     duration: 62,
//     poTarget: "2024-04-08",
//     poReceived: "2024-04-05",
//     poNumber: "PO-LS-2024-010",
//     poStatus: "Approved",
//     poDelay: -3,
//     nextUpdateDate: "2024-02-28",
//     remarks: "Comfortable home slippers with ergonomic design",
//     clientFeedback: "OK",
//     priority: "Low",
//     taskInc: "Anjali",
//     updateNotes: "Final approval complete, production ready",
//     createdDate: "2024-01-18T15:00:00Z",
//     updatedDate: "2024-02-12T10:30:00Z",
//     materials: [
//       {
//         id: "39",
//         name: "Plush Fabric",
//         specification: "Ultra Soft",
//         requirement: "20",
//         unit: "yard",
//       },
//       {
//         id: "40",
//         name: "EVA Footbed",
//         specification: "Contoured",
//         requirement: "18",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "39",
//         name: "Arch Support",
//         specification: "Molded",
//         requirement: "1",
//         unit: "pair",
//       },
//       {
//         id: "40",
//         name: "Anti-Slip Dots",
//         specification: "Silicone",
//         requirement: "12",
//         unit: "pcs",
//       },
//     ],
//   },
//   {
//     id: "20",
//     autoCode: "RND/25-26/09/120",
//     companyId: "2",
//     brandId: "2",
//     categoryId: "3",
//     typeId: "1",
//     colorId: "5",
//     countryId: "3",
//     designerId: "9",
//     status: "PO Issued",
//     tentativeCost: 142000,
//     targetCost: 138000,
//     finalCost: 140000,
//     difference: 2000,
//     startDate: "2024-01-15",
//     endDate: "2024-03-18",
//     duration: 63,
//     poTarget: "2024-04-05",
//     poReceived: "2024-04-02",
//     poNumber: "PO-BB-2024-011",
//     poStatus: "Approved",
//     poDelay: -3,
//     nextUpdateDate: "2024-03-01",
//     remarks: "Summer beach sandals with stylish design",
//     clientFeedback: "OK",
//     priority: "Medium",
//     taskInc: "Suresh",
//     updateNotes: "PO issued, production in progress",
//     createdDate: "2024-01-15T11:15:00Z",
//     updatedDate: "2024-02-28T14:20:00Z",
//     materials: [
//       {
//         id: "41",
//         name: "Synthetic Straps",
//         specification: "UV Resistant",
//         requirement: "24",
//         unit: "yard",
//       },
//       {
//         id: "42",
//         name: "Cork Footbed",
//         specification: "Natural",
//         requirement: "16",
//         unit: "sq-ft",
//       },
//     ],
//     components: [
//       {
//         id: "41",
//         name: "Buckle System",
//         specification: "Adjustable",
//         requirement: "2",
//         unit: "pcs",
//       },
//       {
//         id: "42",
//         name: "Heel Cup",
//         specification: "Molded",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//   },
//   {
//     id: "21",
//     autoCode: "RND/25-26/09/121",
//     companyId: "3",
//     brandId: "3",
//     categoryId: "6",
//     typeId: "2",
//     colorId: "1",
//     countryId: "4",
//     designerId: "10",
//     status: "Costing Pending",
//     tentativeCost: 198000,
//     targetCost: 195000,
//     finalCost: 0,
//     difference: 0,
//     startDate: "2024-02-10",
//     endDate: "2024-04-20",
//     duration: 70,
//     poTarget: "2024-05-10",
//     poReceived: "2024-05-07",
//     poDelay: -3,
//     nextUpdateDate: "2024-02-25",
//     remarks: "Casual slip-on shoes for everyday comfort",
//     clientFeedback: "Pending",
//     priority: "Medium",
//     taskInc: "Kavya",
//     updateNotes: "Awaiting detailed cost breakdown from suppliers",
//     createdDate: "2024-02-10T09:45:00Z",
//     updatedDate: "2024-02-15T11:30:00Z",
//     materials: [
//       {
//         id: "43",
//         name: "Knit Upper",
//         specification: "Stretchable",
//         requirement: "26",
//         unit: "yard",
//       },
//       {
//         id: "44",
//         name: "Phylon Sole",
//         specification: "Flexible",
//         requirement: "20",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "43",
//         name: "Pull Tab",
//         specification: "Leather",
//         requirement: "1",
//         unit: "pcs",
//       },
//       {
//         id: "44",
//         name: "Cushion Insert",
//         specification: "Gel",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//   },
//   {
//     id: "22",
//     autoCode: "RND/25-26/09/122",
//     companyId: "4",
//     brandId: "4",
//     categoryId: "8",
//     typeId: "5",
//     colorId: "3",
//     countryId: "1",
//     designerId: "3",
//     status: "Idea Submitted",
//     tentativeCost: 325000,
//     targetCost: 320000,
//     finalCost: 0,
//     difference: 0,
//     startDate: "2024-02-14",
//     endDate: "2024-04-28",
//     duration: 74,
//     poTarget: "2024-05-18",
//     poReceived: "2024-05-15",
//     poDelay: -3,
//     nextUpdateDate: "2024-03-02",
//     remarks: "Premium trekking boots for mountain expeditions",
//     clientFeedback: "Pending",
//     priority: "High",
//     taskInc: "Rahul",
//     updateNotes: "Concept design submitted, awaiting feasibility review",
//     createdDate: "2024-02-14T13:00:00Z",
//     updatedDate: "2024-02-14T13:00:00Z",
//     materials: [
//       {
//         id: "45",
//         name: "Gore-Tex Fabric",
//         specification: "Waterproof",
//         requirement: "42",
//         unit: "sq-ft",
//       },
//       {
//         id: "46",
//         name: "Vibram Sole",
//         specification: "High Traction",
//         requirement: "24",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "45",
//         name: "Speed Hooks",
//         specification: "Metal",
//         requirement: "8",
//         unit: "pcs",
//       },
//       {
//         id: "46",
//         name: "Insulation Layer",
//         specification: "Thinsulate",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//   },
//   {
//     id: "23",
//     autoCode: "RND/25-26/09/123",
//     companyId: "5",
//     brandId: "5",
//     categoryId: "10",
//     typeId: "5",
//     colorId: "1",
//     countryId: "2",
//     designerId: "4",
//     status: "Prototype",
//     tentativeCost: 245000,
//     targetCost: 240000,
//     finalCost: 243000,
//     difference: 3000,
//     startDate: "2024-02-05",
//     endDate: "2024-04-10",
//     duration: 65,
//     poTarget: "2024-04-28",
//     poReceived: "2024-04-25",
//     poDelay: -3,
//     nextUpdateDate: "2024-02-27",
//     remarks: "Classic oxford shoes with contemporary twist",
//     clientFeedback: "Update Required",
//     priority: "Medium",
//     taskInc: "Deepak",
//     updateNotes: "Prototype testing in progress, fit adjustments needed",
//     createdDate: "2024-02-05T10:30:00Z",
//     updatedDate: "2024-02-20T15:15:00Z",
//     materials: [
//       {
//         id: "47",
//         name: "Nubuck Leather",
//         specification: "Premium",
//         requirement: "36",
//         unit: "sq-ft",
//       },
//       {
//         id: "48",
//         name: "Leather Midsole",
//         specification: "Stacked",
//         requirement: "22",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "47",
//         name: "Cap Toe",
//         specification: "Perforated",
//         requirement: "1",
//         unit: "pair",
//       },
//       {
//         id: "48",
//         name: "Blake Stitch",
//         specification: "Hand-sewn",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//   },
//   {
//     id: "24",
//     autoCode: "RND/25-26/09/124",
//     companyId: "1",
//     brandId: "6",
//     categoryId: "2",
//     typeId: "3",
//     colorId: "4",
//     countryId: "3",
//     designerId: "5",
//     status: "Red Seal",
//     tentativeCost: 185000,
//     targetCost: 180000,
//     finalCost: 182000,
//     difference: 2000,
//     startDate: "2024-01-28",
//     endDate: "2024-04-02",
//     duration: 65,
//     poTarget: "2024-04-22",
//     poReceived: "2024-04-19",
//     poNumber: "PO-LS-2024-012",
//     poStatus: "Pending",
//     poDelay: -3,
//     nextUpdateDate: "2024-02-20",
//     remarks: "Sport sneakers with advanced cushioning technology",
//     clientFeedback: "OK",
//     priority: "High",
//     taskInc: "Priyanka",
//     updateNotes: "Red seal evaluation underway, technical specs verified",
//     createdDate: "2024-01-28T12:00:00Z",
//     updatedDate: "2024-02-15T09:30:00Z",
//     materials: [
//       {
//         id: "49",
//         name: "Engineered Mesh",
//         specification: "Performance",
//         requirement: "32",
//         unit: "yard",
//       },
//       {
//         id: "50",
//         name: "Zoom Air Unit",
//         specification: "Responsive",
//         requirement: "18",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "49",
//         name: "Heel Clip",
//         specification: "TPU",
//         requirement: "1",
//         unit: "pair",
//       },
//       {
//         id: "50",
//         name: "Outsole Pods",
//         specification: "Carbon Rubber",
//         requirement: "6",
//         unit: "pcs",
//       },
//     ],
//   },
//   {
//     id: "25",
//     autoCode: "RND/25-26/09/125",
//     companyId: "2",
//     brandId: "7",
//     categoryId: "7",
//     typeId: "2",
//     colorId: "2",
//     countryId: "4",
//     designerId: "6",
//     status: "Green Seal",
//     tentativeCost: 168000,
//     targetCost: 165000,
//     finalCost: 166000,
//     difference: 1000,
//     startDate: "2024-01-22",
//     endDate: "2024-03-26",
//     duration: 64,
//     poTarget: "2024-04-15",
//     poReceived: "2024-04-12",
//     poNumber: "PO-BB-2024-013",
//     poStatus: "Approved",
//     poDelay: -3,
//     nextUpdateDate: "2024-02-26",
//     remarks: "Lifestyle sneakers with retro design elements",
//     clientFeedback: "OK",
//     priority: "Medium",
//     taskInc: "Meera",
//     updateNotes: "Green seal granted, proceeding to production planning",
//     createdDate: "2024-01-22T14:45:00Z",
//     updatedDate: "2024-02-18T11:00:00Z",
//     materials: [
//       {
//         id: "51",
//         name: "Suede Upper",
//         specification: "Soft Touch",
//         requirement: "34",
//         unit: "sq-ft",
//       },
//       {
//         id: "52",
//         name: "Rubber Cupsole",
//         specification: "Vulcanized",
//         requirement: "20",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "51",
//         name: "Logo Embroidery",
//         specification: "Custom",
//         requirement: "2",
//         unit: "pcs",
//       },
//       {
//         id: "52",
//         name: "Padded Collar",
//         specification: "Foam",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//   },
//   {
//     id: "26",
//     autoCode: "RND/25-26/09/126",
//     companyId: "3",
//     brandId: "3",
//     categoryId: "5",
//     typeId: "5",
//     colorId: "3",
//     countryId: "1",
//     designerId: "7",
//     status: "Final Approved",
//     tentativeCost: 278000,
//     targetCost: 275000,
//     finalCost: 276000,
//     difference: 1000,
//     startDate: "2024-01-16",
//     endDate: "2024-03-22",
//     duration: 66,
//     poTarget: "2024-04-10",
//     poReceived: "2024-04-07",
//     poNumber: "PO-YH-2024-014",
//     poStatus: "Approved",
//     poDelay: -3,
//     nextUpdateDate: "2024-03-05",
//     remarks: "Premium derby shoes for formal occasions",
//     clientFeedback: "OK",
//     priority: "High",
//     taskInc: "Anjali",
//     updateNotes: "All final approvals received, production initiated",
//     createdDate: "2024-01-16T09:30:00Z",
//     updatedDate: "2024-03-01T14:45:00Z",
//     materials: [
//       {
//         id: "53",
//         name: "Calfskin Upper",
//         specification: "Full Grain",
//         requirement: "40",
//         unit: "sq-ft",
//       },
//       {
//         id: "54",
//         name: "Leather Outsole",
//         specification: "Italian",
//         requirement: "24",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "53",
//         name: "Brogue Detail",
//         specification: "Medallion",
//         requirement: "1",
//         unit: "pair",
//       },
//       {
//         id: "54",
//         name: "Cork Filler",
//         specification: "Natural",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//   },
//   {
//     id: "27",
//     autoCode: "RND/25-26/09/127",
//     companyId: "4",
//     brandId: "4",
//     categoryId: "9",
//     typeId: "4",
//     colorId: "5",
//     countryId: "2",
//     designerId: "8",
//     status: "Costing Received",
//     tentativeCost: 125000,
//     targetCost: 120000,
//     finalCost: 123000,
//     difference: 3000,
//     startDate: "2024-02-02",
//     endDate: "2024-04-08",
//     duration: 66,
//     poTarget: "2024-04-26",
//     poReceived: "2024-04-23",
//     poDelay: -3,
//     nextUpdateDate: "2024-02-22",
//     remarks: "Lightweight walking shoes for daily use",
//     clientFeedback: "Update Required",
//     priority: "Low",
//     taskInc: "Suresh",
//     updateNotes: "Costing approved, minor material substitution suggested",
//     createdDate: "2024-02-02T11:00:00Z",
//     updatedDate: "2024-02-16T13:30:00Z",
//     materials: [
//       {
//         id: "55",
//         name: "Textile Upper",
//         specification: "Lightweight",
//         requirement: "26",
//         unit: "yard",
//       },
//       {
//         id: "56",
//         name: "EVA Midsole",
//         specification: "Compression Molded",
//         requirement: "18",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "55",
//         name: "Lace Eyelets",
//         specification: "Reinforced",
//         requirement: "10",
//         unit: "pcs",
//       },
//       {
//         id: "56",
//         name: "Heel Tab",
//         specification: "Reflective",
//         requirement: "1",
//         unit: "pcs",
//       },
//     ],
//   },
//   {
//     id: "28",
//     autoCode: "RND/25-26/09/128",
//     companyId: "5",
//     brandId: "5",
//     categoryId: "10",
//     typeId: "5",
//     colorId: "1",
//     countryId: "3",
//     designerId: "9",
//     status: "PO Issued",
//     tentativeCost: 295000,
//     targetCost: 290000,
//     finalCost: 292000,
//     difference: 2000,
//     startDate: "2024-01-12",
//     endDate: "2024-03-15",
//     duration: 63,
//     poTarget: "2024-04-02",
//     poReceived: "2024-03-30",
//     poNumber: "PO-WD-2024-015",
//     poStatus: "Approved",
//     poDelay: -3,
//     nextUpdateDate: "2024-03-08",
//     remarks: "Luxury formal shoes with premium craftsmanship",
//     clientFeedback: "OK",
//     priority: "High",
//     taskInc: "Kavya",
//     updateNotes: "Production order confirmed, manufacturing commenced",
//     createdDate: "2024-01-12T08:15:00Z",
//     updatedDate: "2024-03-05T10:45:00Z",
//     materials: [
//       {
//         id: "57",
//         name: "Shell Cordovan",
//         specification: "Premium",
//         requirement: "45",
//         unit: "sq-ft",
//       },
//       {
//         id: "58",
//         name: "Cedar Insole",
//         specification: "Aromatic",
//         requirement: "20",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "57",
//         name: "Toe Plate",
//         specification: "Metal",
//         requirement: "2",
//         unit: "pcs",
//       },
//       {
//         id: "58",
//         name: "Welt Strip",
//         specification: "Leather",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//   },
//   {
//     id: "29",
//     autoCode: "RND/25-26/09/129",
//     companyId: "1",
//     brandId: "1",
//     categoryId: "1",
//     typeId: "1",
//     colorId: "4",
//     countryId: "4",
//     designerId: "10",
//     status: "Idea Submitted",
//     tentativeCost: 78000,
//     targetCost: 75000,
//     finalCost: 0,
//     difference: 0,
//     startDate: "2024-02-16",
//     endDate: "2024-04-25",
//     duration: 69,
//     poTarget: "2024-05-12",
//     poReceived: "2024-05-09",
//     poDelay: -3,
//     nextUpdateDate: "2024-03-04",
//     remarks: "Flip-flop sandals for casual summer wear",
//     clientFeedback: "Pending",
//     priority: "Low",
//     taskInc: "Rajesh",
//     updateNotes: "Initial concept sketches submitted for evaluation",
//     createdDate: "2024-02-16T14:30:00Z",
//     updatedDate: "2024-02-16T14:30:00Z",
//     materials: [
//       {
//         id: "59",
//         name: "EVA Foam Sheet",
//         specification: "Soft",
//         requirement: "15",
//         unit: "sq-ft",
//       },
//       {
//         id: "60",
//         name: "Thong Straps",
//         specification: "Durable",
//         requirement: "18",
//         unit: "yard",
//       },
//     ],
//     components: [
//       {
//         id: "59",
//         name: "Toe Post",
//         specification: "Comfortable",
//         requirement: "1",
//         unit: "pair",
//       },
//       {
//         id: "60",
//         name: "Footbed Print",
//         specification: "Logo",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//   },
//   {
//     id: "30",
//     autoCode: "RND/25-26/09/130",
//     companyId: "2",
//     brandId: "2",
//     categoryId: "3",
//     typeId: "3",
//     colorId: "2",
//     countryId: "1",
//     designerId: "3",
//     status: "Prototype",
//     tentativeCost: 158000,
//     targetCost: 155000,
//     finalCost: 156000,
//     difference: 1000,
//     startDate: "2024-02-07",
//     endDate: "2024-04-12",
//     duration: 65,
//     poTarget: "2024-05-01",
//     poReceived: "2024-04-28",
//     poDelay: -3,
//     nextUpdateDate: "2024-02-28",
//     remarks: "Fashion sandals with embellished straps",
//     clientFeedback: "Pending",
//     priority: "Medium",
//     taskInc: "Deepak",
//     updateNotes: "Prototype samples under review, design refinement ongoing",
//     createdDate: "2024-02-07T10:15:00Z",
//     updatedDate: "2024-02-22T12:45:00Z",
//     materials: [
//       {
//         id: "61",
//         name: "Metallic Straps",
//         specification: "Decorative",
//         requirement: "22",
//         unit: "yard",
//       },
//       {
//         id: "62",
//         name: "Wedge Heel",
//         specification: "Cork Base",
//         requirement: "16",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "61",
//         name: "Rhinestone Accents",
//         specification: "Decorative",
//         requirement: "24",
//         unit: "pcs",
//       },
//       {
//         id: "62",
//         name: "Ankle Strap",
//         specification: "Adjustable",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//   },
//   {
//     id: "31",
//     autoCode: "RND/25-26/09/131",
//     companyId: "3",
//     brandId: "3",
//     categoryId: "6",
//     typeId: "2",
//     colorId: "5",
//     countryId: "2",
//     designerId: "4",
//     status: "Red Seal",
//     tentativeCost: 215000,
//     targetCost: 210000,
//     finalCost: 212000,
//     difference: 2000,
//     startDate: "2024-01-30",
//     endDate: "2024-04-05",
//     duration: 66,
//     poTarget: "2024-04-24",
//     poReceived: "2024-04-21",
//     poNumber: "PO-YH-2024-016",
//     poStatus: "Pending",
//     poDelay: -3,
//     nextUpdateDate: "2024-02-24",
//     remarks: "Smart casual loafers with breathable design",
//     clientFeedback: "OK",
//     priority: "Medium",
//     taskInc: "Priyanka",
//     updateNotes: "Red seal in progress, comfort testing completed",
//     createdDate: "2024-01-30T13:20:00Z",
//     updatedDate: "2024-02-20T15:50:00Z",
//     materials: [
//       {
//         id: "63",
//         name: "Perforated Leather",
//         specification: "Ventilated",
//         requirement: "30",
//         unit: "sq-ft",
//       },
//       {
//         id: "64",
//         name: "Rubber Sole",
//         specification: "Lightweight",
//         requirement: "20",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "63",
//         name: "Elastic Goring",
//         specification: "Stretchable",
//         requirement: "2",
//         unit: "pcs",
//       },
//       {
//         id: "64",
//         name: "Padded Insole",
//         specification: "Ortholite",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//   },
//   {
//     id: "32",
//     autoCode: "RND/25-26/09/132",
//     companyId: "4",
//     brandId: "4",
//     categoryId: "8",
//     typeId: "5",
//     colorId: "1",
//     countryId: "3",
//     designerId: "5",
//     status: "Green Seal",
//     tentativeCost: 315000,
//     targetCost: 310000,
//     finalCost: 312000,
//     difference: 2000,
//     startDate: "2024-01-24",
//     endDate: "2024-03-30",
//     duration: 66,
//     poTarget: "2024-04-18",
//     poReceived: "2024-04-15",
//     poNumber: "PO-TC-2024-017",
//     poStatus: "Approved",
//     poDelay: -3,
//     nextUpdateDate: "2024-03-02",
//     remarks: "Military-style tactical boots with durability features",
//     clientFeedback: "OK",
//     priority: "High",
//     taskInc: "Meera",
//     updateNotes: "Green seal confirmed, bulk production scheduled",
//     createdDate: "2024-01-24T09:45:00Z",
//     updatedDate: "2024-02-28T11:30:00Z",
//     materials: [
//       {
//         id: "65",
//         name: "Ballistic Nylon",
//         specification: "Heavy Duty",
//         requirement: "44",
//         unit: "yard",
//       },
//       {
//         id: "66",
//         name: "Combat Sole",
//         specification: "Oil Resistant",
//         requirement: "26",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "65",
//         name: "Metal Shank",
//         specification: "Steel",
//         requirement: "1",
//         unit: "pair",
//       },
//       {
//         id: "66",
//         name: "Side Zipper",
//         specification: "YKK Heavy Duty",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//   },
//   {
//     id: "33",
//     autoCode: "RND/25-26/09/133",
//     companyId: "5",
//     brandId: "5",
//     categoryId: "10",
//     typeId: "5",
//     colorId: "3",
//     countryId: "4",
//     designerId: "6",
//     status: "Costing Pending",
//     tentativeCost: 335000,
//     targetCost: 330000,
//     finalCost: 0,
//     difference: 0,
//     startDate: "2024-02-18",
//     endDate: "2024-04-30",
//     duration: 72,
//     poTarget: "2024-05-20",
//     poReceived: "2024-05-17",
//     poDelay: -3,
//     nextUpdateDate: "2024-03-06",
//     remarks: "Handcrafted luxury dress shoes with bespoke details",
//     clientFeedback: "Pending",
//     priority: "High",
//     taskInc: "Anjali",
//     updateNotes:
//       "Material sourcing from premium suppliers, cost analysis pending",
//     createdDate: "2024-02-18T15:00:00Z",
//     updatedDate: "2024-02-22T16:30:00Z",
//     materials: [
//       {
//         id: "67",
//         name: "Exotic Leather",
//         specification: "Crocodile",
//         requirement: "52",
//         unit: "sq-ft",
//       },
//       {
//         id: "68",
//         name: "Hand-Stitched Welt",
//         specification: "Premium",
//         requirement: "28",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "67",
//         name: "Custom Last",
//         specification: "Bespoke",
//         requirement: "1",
//         unit: "pair",
//       },
//       {
//         id: "68",
//         name: "Gold Hardware",
//         specification: "18k Plated",
//         requirement: "4",
//         unit: "pcs",
//       },
//     ],
//   },
//   {
//     id: "34",
//     autoCode: "RND/25-26/09/134",
//     companyId: "1",
//     brandId: "1",
//     categoryId: "2",
//     typeId: "3",
//     colorId: "4",
//     countryId: "1",
//     designerId: "3",
//     status: "Final Approved",
//     tentativeCost: 228000,
//     targetCost: 225000,
//     finalCost: 226000,
//     difference: 1000,
//     startDate: "2024-01-18",
//     endDate: "2024-03-25",
//     duration: 67,
//     poTarget: "2024-04-12",
//     poReceived: "",
//     poDelay: -3,
//     nextUpdateDate: "2024-03-15",
//     remarks: "Performance running shoes with advanced cushioning system",
//     clientFeedback: "OK",
//     priority: "High",
//     taskInc: "Priyanka",
//     updateNotes: "Final approval completed, awaiting PO assignment from client",
//     createdDate: "2024-01-18T09:00:00Z",
//     updatedDate: "2024-03-12T14:20:00Z",
//     materials: [
//       {
//         id: "69",
//         name: "Engineered Mesh",
//         specification: "Breathable",
//         requirement: "30",
//         unit: "yard",
//       },
//       {
//         id: "70",
//         name: "React Foam",
//         specification: "Responsive",
//         requirement: "22",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "69",
//         name: "TPU Heel Counter",
//         specification: "Supportive",
//         requirement: "1",
//         unit: "pair",
//       },
//       {
//         id: "70",
//         name: "Carbon Fiber Plate",
//         specification: "Performance",
//         requirement: "1",
//         unit: "pair",
//       },
//     ],
//     coverPhoto:
//       "https://images.unsplash.com/photo-1542291026-7eec264c27ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjBzbmVha2Vyc3xlbnwxfHx8fDE3MTIyMzU5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
//     additionalImages: [
//       "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzbmVha2VyJTIwc2hvZXxlbnwxfHx8fDE3NTk1ODQ3NTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
//     ],
//     dynamicImages: [],
//   },
//   {
//     id: "35",
//     autoCode: "RND/25-26/09/135",
//     companyId: "3",
//     brandId: "3",
//     categoryId: "5",
//     typeId: "5",
//     colorId: "1",
//     countryId: "3",
//     designerId: "2",
//     status: "Final Approved",
//     tentativeCost: 342000,
//     targetCost: 338000,
//     finalCost: 340000,
//     difference: 2000,
//     startDate: "2024-01-20",
//     endDate: "2024-03-28",
//     duration: 68,
//     poTarget: "2024-04-16",
//     poReceived: "",
//     poDelay: -3,
//     nextUpdateDate: "2024-03-18",
//     remarks: "Premium leather business shoes with Italian craftsmanship",
//     clientFeedback: "OK",
//     priority: "High",
//     taskInc: "Meera",
//     updateNotes: "All approvals received, pending PO number from client",
//     createdDate: "2024-01-20T10:30:00Z",
//     updatedDate: "2024-03-14T16:45:00Z",
//     materials: [
//       {
//         id: "71",
//         name: "Italian Calfskin",
//         specification: "Premium Grade",
//         requirement: "46",
//         unit: "sq-ft",
//       },
//       {
//         id: "72",
//         name: "Blake Rapid Sole",
//         specification: "Hand-Crafted",
//         requirement: "24",
//         unit: "pair",
//       },
//     ],
//     components: [
//       {
//         id: "71",
//         name: "Goodyear Welt",
//         specification: "Premium",
//         requirement: "1",
//         unit: "pair",
//       },
//       {
//         id: "72",
//         name: "Brass Eyelets",
//         specification: "Polished",
//         requirement: "10",
//         unit: "pcs",
//       },
//     ],
//     coverPhoto:
//       "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMGZvcm1hbCUyMHNob2VzfGVufDF8fHx8MTcxMjIzNTkzMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
//     additionalImages: [
//       "https://images.unsplash.com/photo-1668069226492-508742b03147?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBkcmVzcyUyMHNob2VzfGVufDF8fHx8MTc1OTUxNTY2MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
//     ],
//     dynamicImages: [],
//   },
// ];

const sampleProducts: Product[] = [
  {
    id: "1",
    name: "Lifestyle Premium Sneakers",
    category: "Sneakers",
    description: "High-quality sneakers for everyday wear",
    sku: "LS-SNK-001",
    barcode: "1234567890123",
    quantity: 150,
    labelPrice: 2999,
    manufacturingCost: 1200,
    sellPrice: 2400,
    customerSellingPrice: 2999,
    sellingType: "both",
    dimensions: { width: 120, height: 80, length: 280, unit: "mm" },
    weight: { value: 450, unit: "g" },
    images: [],
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T10:00:00Z",
  },
];

const sampleProductionCards: ProductionCard[] = [
  {
    id: "1",
    cardNumber: "PROD/25-26/09/001",
    projectId: "1",
    productName: "Lifestyle Sneakers",
    cardQuantity: 1200,
    startDate: "2024-01-25",
    assignedPlant: "Plant A",
    description: "Premium summer collection sneakers production",
    specialInstructions:
      "Use high-quality materials, ensure proper QC at each stage",
    status: "Active",
    materialRequestStatus: "Pending Availability Check",
    createdBy: "Production Manager",
    createdDate: "2024-01-20T10:00:00Z",
    updatedDate: "2024-01-20T10:00:00Z",
    materials: [
      {
        id: "1",
        name: "Upper",
        specification: "Rexine",
        requirement: "25",
        unit: "pair/vth",
      },
      {
        id: "2",
        name: "Lining",
        specification: "Skimh",
        requirement: "25",
        unit: "pair @ 15/-",
      },
      {
        id: "3",
        name: "Lining",
        specification: "EVA",
        requirement: "3370 - 1.5mm",
        unit: "35pair",
      },
    ],
    components: [
      {
        id: "1",
        name: "Foam",
        specification: "-",
        requirement: "7.5",
        unit: "gm",
      },
      {
        id: "2",
        name: "Velcro",
        specification: "75mm",
        requirement: "1.25",
        unit: "pair",
      },
      {
        id: "3",
        name: "Buckle",
        specification: "-",
        requirement: "2",
        unit: "pcs",
      },
      {
        id: "4",
        name: "Trim",
        specification: "sticker",
        requirement: "10",
        unit: "pcs",
      },
    ],
  },
];

const sampleInventoryItems: InventoryItem[] = [
  {
    id: "1",
    itemName: "Premium Leather Sheet",
    category: "Raw Materials",
    subCategory: "Leather",
    code: "ITM/25-26/09/001",
    brand: "Clarino",
    color: "Black",
    vendorId: "1",
    expiryDate: "2025-12-31",
    quantity: 245,
    quantityUnit: "sq-ft",
    description: "High-quality leather for premium footwear",
    isDraft: false,
    lastUpdate: "15-01-2025",
    lastUpdateTime: "2:30 PM",
    iconColor: "amber",
    createdDate: "2024-01-01T10:00:00Z",
    updatedDate: "2025-01-15T14:30:00Z",
  },
  {
    id: "2",
    itemName: "Rubber Sole Unit",
    category: "Components & Parts",
    subCategory: "Sole",
    code: "ITM/25-26/09/002",
    brand: "Vibram",
    color: "White",
    vendorId: "5",
    quantity: 580,
    quantityUnit: "pair",
    description: "Durable rubber sole for athletic footwear",
    isDraft: false,
    lastUpdate: "14-01-2025",
    lastUpdateTime: "11:45 AM",
    iconColor: "blue",
    createdDate: "2024-01-05T14:00:00Z",
    updatedDate: "2025-01-14T11:45:00Z",
  },
  {
    id: "3",
    itemName: "Canvas Fabric Roll",
    category: "Raw Materials",
    subCategory: "Fabric",
    code: "ITM/25-26/09/003",
    brand: "TexFab",
    color: "Navy Blue",
    vendorId: "4",
    quantity: 150,
    quantityUnit: "meter",
    description: "Heavy-duty canvas for casual footwear",
    isDraft: false,
    lastUpdate: "13-01-2025",
    lastUpdateTime: "3:15 PM",
    iconColor: "green",
    createdDate: "2024-01-08T09:00:00Z",
    updatedDate: "2025-01-13T15:15:00Z",
  },
  {
    id: "4",
    itemName: "Metal Eyelets",
    category: "Accessories & Hardware",
    subCategory: "Hardware",
    code: "ITM/25-26/09/004",
    brand: "EuroHard",
    color: "Silver",
    vendorId: "3",
    quantity: 2500,
    quantityUnit: "piece",
    description: "Brass eyelets for formal and casual shoes",
    isDraft: false,
    lastUpdate: "12-01-2025",
    lastUpdateTime: "10:20 AM",
    iconColor: "gray",
    createdDate: "2024-01-10T11:30:00Z",
    updatedDate: "2025-01-12T10:20:00Z",
  },
  {
    id: "5",
    itemName: "EVA Foam Sheet",
    category: "Raw Materials",
    subCategory: "Foam",
    code: "ITM/25-26/09/005",
    brand: "TechSole",
    color: "White",
    vendorId: "5",
    quantity: 320,
    quantityUnit: "sq-ft",
    description: "Lightweight EVA foam for comfortable insoles",
    isDraft: false,
    lastUpdate: "11-01-2025",
    lastUpdateTime: "4:45 PM",
    iconColor: "purple",
    createdDate: "2024-01-12T13:20:00Z",
    updatedDate: "2025-01-11T16:45:00Z",
  },
  {
    id: "6",
    itemName: "Athletic Shoe Laces",
    category: "Accessories & Hardware",
    subCategory: "Laces",
    code: "ITM/25-26/09/006",
    brand: "SportLace",
    color: "Black",
    vendorId: "2",
    quantity: 1200,
    quantityUnit: "pair",
    description: "Durable polyester laces for sports shoes",
    isDraft: false,
    lastUpdate: "10-01-2025",
    lastUpdateTime: "1:30 PM",
    iconColor: "red",
    createdDate: "2024-01-15T10:45:00Z",
    updatedDate: "2025-01-10T13:30:00Z",
  },
  {
    id: "7",
    itemName: "Finished Sneakers - LifeStyle",
    category: "Finished Footwear",
    subCategory: "Sneakers",
    code: "ITM/25-26/09/007",
    brand: "Lifestyle",
    color: "Multi",
    quantity: 85,
    quantityUnit: "pair",
    description: "Completed lifestyle sneakers ready for packaging",
    isDraft: false,
    lastUpdate: "09-01-2025",
    lastUpdateTime: "5:00 PM",
    iconColor: "cyan",
    createdDate: "2024-01-18T14:30:00Z",
    updatedDate: "2025-01-09T17:00:00Z",
  },
  {
    id: "8",
    itemName: "PU Leather Synthetic",
    category: "Raw Materials",
    subCategory: "Synthetic",
    code: "ITM/25-26/09/008",
    brand: "SynTech",
    color: "Brown",
    vendorId: "1",
    quantity: 180,
    quantityUnit: "sq-ft",
    description: "High-quality PU leather for mid-range footwear",
    isDraft: false,
    lastUpdate: "08-01-2025",
    lastUpdateTime: "9:15 AM",
    iconColor: "orange",
    createdDate: "2024-01-20T08:00:00Z",
    updatedDate: "2025-01-08T09:15:00Z",
  },
  {
    id: "9",
    itemName: "Zipper - YKK Heavy Duty",
    category: "Components & Parts",
    subCategory: "Fasteners",
    code: "ITM/25-26/09/009",
    brand: "YKK",
    color: "Black",
    vendorId: "3",
    quantity: 450,
    quantityUnit: "piece",
    description: "Premium zippers for boots and high-end footwear",
    isDraft: false,
    lastUpdate: "07-01-2025",
    lastUpdateTime: "2:45 PM",
    iconColor: "indigo",
    createdDate: "2024-01-22T12:15:00Z",
    updatedDate: "2025-01-07T14:45:00Z",
  },
  {
    id: "10",
    itemName: "Memory Foam Insole",
    category: "Components & Parts",
    subCategory: "Insole",
    code: "ITM/25-26/09/010",
    brand: "ComfortTech",
    color: "Beige",
    vendorId: "5",
    quantity: 680,
    quantityUnit: "pair",
    description: "Premium memory foam insoles for enhanced comfort",
    isDraft: false,
    lastUpdate: "06-01-2025",
    lastUpdateTime: "11:00 AM",
    iconColor: "pink",
    createdDate: "2024-01-25T16:40:00Z",
    updatedDate: "2025-01-06T11:00:00Z",
  },
];

const sampleInventoryTransactions: InventoryTransaction[] = [
  {
    id: "1",
    itemId: "1",
    transactionType: "Stock In",
    quantity: 100,
    previousStock: 0,
    newStock: 100,
    billNumber: "BI-001",
    orderValue: 5000,
    vendorId: "1",
    reason: "Initial stock",
    remarks: "Received from vendor",
    transactionDate: "2024-01-01T10:00:00Z",
    createdBy: "Inventory Manager",
    createdDate: "2024-01-01T10:00:00Z",
  },
  {
    id: "2",
    itemId: "2",
    transactionType: "Stock In",
    quantity: 300,
    previousStock: 0,
    newStock: 300,
    billNumber: "BI-002",
    orderValue: 15000,
    vendorId: "5",
    reason: "Initial stock",
    remarks: "Received from vendor",
    transactionDate: "2024-01-05T14:00:00Z",
    createdBy: "Inventory Manager",
    createdDate: "2024-01-05T14:00:00Z",
  },
  {
    id: "3",
    itemId: "3",
    transactionType: "Stock In",
    quantity: 200,
    previousStock: 0,
    newStock: 200,
    billNumber: "BI-003",
    orderValue: 10000,
    vendorId: "4",
    reason: "Initial stock",
    remarks: "Received from vendor",
    transactionDate: "2024-01-08T09:00:00Z",
    createdBy: "Inventory Manager",
    createdDate: "2024-01-08T09:00:00Z",
  },
  {
    id: "4",
    itemId: "4",
    transactionType: "Stock In",
    quantity: 5000,
    previousStock: 0,
    newStock: 5000,
    billNumber: "BI-004",
    orderValue: 25000,
    vendorId: "3",
    reason: "Initial stock",
    remarks: "Received from vendor",
    transactionDate: "2024-01-10T11:30:00Z",
    createdBy: "Inventory Manager",
    createdDate: "2024-01-10T11:30:00Z",
  },
  {
    id: "5",
    itemId: "5",
    transactionType: "Stock In",
    quantity: 160,
    previousStock: 0,
    newStock: 160,
    billNumber: "BI-005",
    orderValue: 8000,
    vendorId: "5",
    reason: "Initial stock",
    remarks: "Received from vendor",
    transactionDate: "2024-01-12T13:20:00Z",
    createdBy: "Inventory Manager",
    createdDate: "2024-01-12T13:20:00Z",
  },
  {
    id: "6",
    itemId: "6",
    transactionType: "Stock In",
    quantity: 600,
    previousStock: 0,
    newStock: 600,
    billNumber: "BI-006",
    orderValue: 3000,
    vendorId: "2",
    reason: "Initial stock",
    remarks: "Received from vendor",
    transactionDate: "2024-01-15T10:45:00Z",
    createdBy: "Inventory Manager",
    createdDate: "2024-01-15T10:45:00Z",
  },
  {
    id: "7",
    itemId: "7",
    transactionType: "Stock In",
    quantity: 50,
    previousStock: 0,
    newStock: 50,
    billNumber: "BI-007",
    orderValue: 2500,
    vendorId: "1",
    reason: "Initial stock",
    remarks: "Received from vendor",
    transactionDate: "2024-01-18T14:30:00Z",
    createdBy: "Inventory Manager",
    createdDate: "2024-01-18T14:30:00Z",
  },
  {
    id: "8",
    itemId: "8",
    transactionType: "Stock In",
    quantity: 100,
    previousStock: 0,
    newStock: 100,
    billNumber: "BI-008",
    orderValue: 5000,
    vendorId: "1",
    reason: "Initial stock",
    remarks: "Received from vendor",
    transactionDate: "2024-01-20T08:00:00Z",
    createdBy: "Inventory Manager",
    createdDate: "2024-01-20T08:00:00Z",
  },
  {
    id: "9",
    itemId: "9",
    transactionType: "Stock In",
    quantity: 300,
    previousStock: 0,
    newStock: 300,
    billNumber: "BI-009",
    orderValue: 15000,
    vendorId: "3",
    reason: "Initial stock",
    remarks: "Received from vendor",
    transactionDate: "2024-01-22T12:15:00Z",
    createdBy: "Inventory Manager",
    createdDate: "2024-01-22T12:15:00Z",
  },
  {
    id: "10",
    itemId: "10",
    transactionType: "Stock In",
    quantity: 400,
    previousStock: 0,
    newStock: 400,
    billNumber: "BI-010",
    orderValue: 20000,
    vendorId: "5",
    reason: "Initial stock",
    remarks: "Received from vendor",
    transactionDate: "2024-01-25T16:40:00Z",
    createdBy: "Inventory Manager",
    createdDate: "2024-01-25T16:40:00Z",
  },
  // Recent stock movements for better reporting
  {
    id: "11",
    itemId: "1",
    transactionType: "Stock In",
    quantity: 145,
    previousStock: 245,
    newStock: 390,
    billNumber: "BI-011",
    orderValue: 7250,
    vendorId: "1",
    reason: "Restocking",
    remarks: "Monthly reorder",
    transactionDate: "2025-01-10T10:00:00Z",
    createdBy: "Inventory Manager",
    createdDate: "2025-01-10T10:00:00Z",
  },
  {
    id: "12",
    itemId: "2",
    transactionType: "Stock Out",
    quantity: 280,
    previousStock: 580,
    newStock: 300,
    reason: "Production use",
    remarks: "Issued for production",
    transactionDate: "2025-01-12T14:30:00Z",
    createdBy: "Production Manager",
    createdDate: "2025-01-12T14:30:00Z",
  },
  {
    id: "13",
    itemId: "3",
    transactionType: "Stock Out",
    quantity: 50,
    previousStock: 150,
    newStock: 100,
    reason: "Production use",
    remarks: "Used in project RND/25-26/09/102",
    transactionDate: "2025-01-13T09:15:00Z",
    createdBy: "Production Manager",
    createdDate: "2025-01-13T09:15:00Z",
  },
  {
    id: "14",
    itemId: "4",
    transactionType: "Stock Out",
    quantity: 2500,
    previousStock: 2500,
    newStock: 0,
    reason: "Production use",
    remarks: "Bulk issue for multiple projects",
    transactionDate: "2025-01-14T11:00:00Z",
    createdBy: "Production Manager",
    createdDate: "2025-01-14T11:00:00Z",
  },
  {
    id: "15",
    itemId: "5",
    transactionType: "Stock In",
    quantity: 160,
    previousStock: 320,
    newStock: 480,
    billNumber: "BI-012",
    orderValue: 8000,
    vendorId: "5",
    reason: "Restocking",
    remarks: "Emergency reorder",
    transactionDate: "2025-01-15T16:45:00Z",
    createdBy: "Inventory Manager",
    createdDate: "2025-01-15T16:45:00Z",
  },
];

// Sample Delivery Items (from completed R&D projects with PO Issued status)
const sampleDeliveryItems: DeliveryItem[] = [
  {
    id: "1",
    projectId: "1",
    projectCode: "RND/24-25/09/101",
    productName: "Premium Lifestyle Sneaker",
    brandName: "Lifestyle",
    categoryName: "Sneakers",
    poNumber: "PO-2024-001",
    poReceivedDate: "2024-12-01",
    quantity: 5000,
    deliveryStatus: "Pending",
    expectedDeliveryDate: "2025-01-15",
    aging: 45,
    totalAmount: 2500000,
    advance: 750000,
    advancePercentage: 30,
    balance: 1750000,
    deliveryAddress: "Warehouse A, Mumbai, Maharashtra",
    customerName: "Lifestyle International Ltd.",
    customerContact: "+91 9876543210",
    remarks: "Urgent delivery required",
    createdDate: "2024-12-01T10:00:00Z",
    updatedDate: "2024-12-01T10:00:00Z",
  },
  {
    id: "2",
    projectId: "2",
    projectCode: "RND/24-25/09/102",
    productName: "Bacca Bucci Sport Casual",
    brandName: "Bacca Bucci",
    categoryName: "Casual",
    poNumber: "PO-2024-002",
    poReceivedDate: "2024-11-20",
    quantity: 3000,
    deliveryStatus: "Parcel Delivered",
    expectedDeliveryDate: "2025-01-10",
    trackingNumber: "DHL1234567890",
    courierService: "DHL Express",
    aging: 55,
    totalAmount: 1800000,
    advance: 900000,
    advancePercentage: 50,
    balance: 900000,
    deliveryAddress: "Distribution Center, Delhi",
    customerName: "Bacca Bucci Global Pvt. Ltd.",
    customerContact: "+91 9876543211",
    remarks: "In transit",
    createdDate: "2024-11-20T09:30:00Z",
    updatedDate: "2025-01-10T14:20:00Z",
  },
  {
    id: "3",
    projectId: "3",
    projectCode: "RND/24-25/09/103",
    productName: "Woodland Adventure Boot",
    brandName: "Woodland",
    categoryName: "Boots",
    poNumber: "PO-2024-003",
    poReceivedDate: "2024-10-15",
    quantity: 2000,
    deliveryStatus: "Delivered",
    deliveryDate: "2024-12-20",
    expectedDeliveryDate: "2024-12-15",
    trackingNumber: "FDX9876543210",
    courierService: "FedEx",
    aging: 66,
    totalAmount: 3200000,
    advance: 1280000,
    advancePercentage: 40,
    balance: 0,
    deliveryAddress: "Central Warehouse, Bangalore",
    customerName: "Woodland Shoes Pvt. Ltd.",
    customerContact: "+91 9876543212",
    remarks: "Delivered successfully - Payment completed",
    createdDate: "2024-10-15T11:00:00Z",
    updatedDate: "2024-12-20T16:45:00Z",
  },
  {
    id: "4",
    projectId: "5",
    projectCode: "RND/24-25/10/105",
    productName: "Yoho Formal Oxford",
    brandName: "Yoho",
    categoryName: "Formal",
    poNumber: "PO-2024-004",
    poReceivedDate: "2024-12-10",
    quantity: 4000,
    deliveryStatus: "Pending",
    expectedDeliveryDate: "2025-02-01",
    aging: 35,
    totalAmount: 2800000,
    advance: 840000,
    advancePercentage: 30,
    balance: 1960000,
    deliveryAddress: "Regional Depot, Pune",
    customerName: "Yoho Footwear Industries",
    customerContact: "+91 9876543213",
    remarks: "Production in progress",
    createdDate: "2024-12-10T08:15:00Z",
    updatedDate: "2024-12-10T08:15:00Z",
  },
  {
    id: "5",
    projectId: "7",
    projectCode: "RND/24-25/10/107",
    productName: "Toucan Hiking Boot",
    brandName: "Toucan",
    categoryName: "Boots",
    poNumber: "PO-2024-005",
    poReceivedDate: "2024-11-05",
    quantity: 1500,
    deliveryStatus: "Delivered",
    deliveryDate: "2024-12-28",
    expectedDeliveryDate: "2024-12-30",
    trackingNumber: "BLU4567891230",
    courierService: "BlueDart",
    aging: 53,
    totalAmount: 2250000,
    advance: 1125000,
    advancePercentage: 50,
    balance: 0,
    deliveryAddress: "Main Warehouse, Chennai",
    customerName: "Toucan Sports & Leisure",
    customerContact: "+91 9876543214",
    remarks: "Delivered ahead of schedule - Full payment received",
    createdDate: "2024-11-05T13:20:00Z",
    updatedDate: "2024-12-28T10:30:00Z",
  },
  {
    id: "6",
    projectId: "10",
    projectCode: "RND/24-25/11/110",
    productName: "Bacca Bucci Premium Loafer",
    brandName: "Bacca Bucci Premium",
    categoryName: "Formal",
    poNumber: "PO-2025-001",
    poReceivedDate: "2025-01-02",
    quantity: 2500,
    deliveryStatus: "Parcel Delivered",
    expectedDeliveryDate: "2025-02-15",
    trackingNumber: "DHL9876543210",
    courierService: "DHL Express",
    aging: 12,
    totalAmount: 3750000,
    advance: 1125000,
    advancePercentage: 30,
    balance: 2625000,
    deliveryAddress: "Premium Store, Kolkata",
    customerName: "Bacca Bucci Global Pvt. Ltd.",
    customerContact: "+91 9876543215",
    remarks: "Premium collection - Handle with care",
    createdDate: "2025-01-02T09:00:00Z",
    updatedDate: "2025-01-12T11:15:00Z",
  },
  {
    id: "7",
    projectId: "15",
    projectCode: "RND/24-25/12/115",
    productName: "Lifestyle Sport Runner",
    brandName: "Lifestyle Sport",
    categoryName: "Sneakers",
    poNumber: "PO-2025-002",
    poReceivedDate: "2024-12-20",
    quantity: 6000,
    deliveryStatus: "Pending",
    expectedDeliveryDate: "2025-02-10",
    aging: 25,
    totalAmount: 4200000,
    advance: 1680000,
    advancePercentage: 40,
    balance: 2520000,
    deliveryAddress: "Sports Complex, Hyderabad",
    customerName: "Lifestyle International Ltd.",
    customerContact: "+91 9876543216",
    remarks: "Bulk order - Verify quality before dispatch",
    createdDate: "2024-12-20T15:30:00Z",
    updatedDate: "2024-12-20T15:30:00Z",
  },
];

// Create the store
export const useERPStore = create<ERPStore>((set, get) => ({
  // Initial State
  currentModule: "dashboard",
  companies: [],
  brands: [],
  categories: [],
  types: [],
  countries: [],
  assignPersons: [],
  setAssignPersons: (a: any) => set({ assignPersons: a }),

  colors: sampleColors,
  // countries: sampleCountries,
  rdProjects: [],
  prototypeFiles: [],
  selectedRDProject: null,
  users: sampleUsers,
  auditLogs: [],
  currentUser: sampleUsers[0],
  notifications: [],
  productionOrders: [],
  plants: [],
  rawMaterials: [],
  vendors: sampleVendors,
  products: sampleProducts,
  selectedProduct: null,
  isEditingProduct: false,
  isLoading: false,
  materialRequests: [],
  productionCards: sampleProductionCards,
  inventoryItems: sampleInventoryItems,
  inventoryTransactions: sampleInventoryTransactions,
  deliveryItems: sampleDeliveryItems,

  // Actions
  setCurrentModule: (module) => set({ currentModule: module }),
  setRDProjects: (projects: RDProject[]) => set({ rdProjects: projects }),

  addBrand: (brand) => {
    const newBrand: BrandMaster = {
      id: Date.now().toString(),
      brandCode: generateBrandCode(get().brands),
      createdDate: new Date().toISOString(),
      ...brand,
    };
    set((state) => ({ brands: [...state.brands, newBrand] }));
  },

  updateBrand: (id, updates) =>
    set((state) => ({
      brands: state.brands.map((brand) =>
        brand.id === id ? { ...brand, ...updates } : brand
      ),
    })),

  deleteBrand: (id) =>
    set((state) => ({
      brands: state.brands.filter((brand) => brand.id !== id),
    })),

  addCategory: (category) => {
    const newCategory: CategoryMaster = {
      id: Date.now().toString(),
      categoryId: `CAT${(get().categories.length + 1)
        .toString()
        .padStart(3, "0")}`,
      ...category,
    };
    set((state) => ({ categories: [...state.categories, newCategory] }));
  },

  addType: (type) => {
    const newType: TypeMaster = {
      id: Date.now().toString(),
      typeId: `TYP${(get().types.length + 1).toString().padStart(3, "0")}`,
      ...type,
    };
    set((state) => ({ types: [...state.types, newType] }));
  },
  updateType: (id, updates) =>
    set((state) => ({
      types: state.types.map((type) =>
        type.id === id ? { ...type, ...updates } : type
      ),
    })),
  deleteType: (id) =>
    set((state) => ({
      types: state.types.filter((type) => type.id !== id),
    })),

  updateCategory: (id, updates) =>
    set((state) => ({
      categories: state.categories.map((category) =>
        category.id === id ? { ...category, ...updates } : category
      ),
    })),

  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((category) => category.id !== id),
    })),

  addColor: (color) => {
    const newColor: ColorMaster = {
      id: Date.now().toString(),
      colorId: `COL${(get().colors.length + 1).toString().padStart(3, "0")}`,
      ...color,
    };
    set((state) => ({ colors: [...state.colors, newColor] }));
  },

  updateColor: (id, updates) =>
    set((state) => ({
      colors: state.colors.map((color) =>
        color.id === id ? { ...color, ...updates } : color
      ),
    })),

  deleteColor: (id) =>
    set((state) => ({
      colors: state.colors.filter((color) => color.id !== id),
    })),

  addRDProject: (project) => {
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const duration = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const newProject: RDProject = {
      id: Date.now().toString(),
      autoCode: generateRDCode(get().rdProjects),
      difference: project.targetCost - project.tentativeCost,
      duration,
      poDelay: 0,
      updateNotes: "",
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      ...project,
    };

    set((state) => ({ rdProjects: [...state.rdProjects, newProject] }));
  },

  updateRDProject: (id, updates) =>
    set((state) => ({
      rdProjects: state.rdProjects.map((project) =>
        project.id === id
          ? { ...project, ...updates, updatedDate: new Date().toISOString() }
          : project
      ),
    })),

  deleteRDProject: (id) =>
    set((state) => ({
      rdProjects: state.rdProjects.filter((project) => project.id !== id),
    })),

  selectRDProject: (project) => set({ selectedRDProject: project }),

  addPrototypeFile: (file) => {
    const newFile: PrototypeFile = {
      id: Date.now().toString(),
      uploadedDate: new Date().toISOString(),
      ...file,
    };
    set((state) => ({ prototypeFiles: [...state.prototypeFiles, newFile] }));
  },

  deletePrototypeFile: (id) =>
    set((state) => ({
      prototypeFiles: state.prototypeFiles.filter((file) => file.id !== id),
    })),

  addProductionOrder: (order) => {
    const newOrder: ProductionOrder = {
      id: Date.now().toString(),
      poId: `PO${Date.now()}`,
      ...order,
    };
    set((state) => ({
      productionOrders: [...state.productionOrders, newOrder],
    }));
  },

  updateProductionOrder: (id, updates) =>
    set((state) => ({
      productionOrders: state.productionOrders.map((order) =>
        order.id === id ? { ...order, ...updates } : order
      ),
    })),

  addProduct: (product) => {
    const newProduct: Product = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...product,
    };
    set((state) => ({ products: [...state.products, newProduct] }));
  },

  updateProduct: (id, updates) =>
    set((state) => ({
      products: state.products.map((product) =>
        product.id === id
          ? { ...product, ...updates, updatedAt: new Date().toISOString() }
          : product
      ),
    })),

  deleteProduct: (id) =>
    set((state) => ({
      products: state.products.filter((product) => product.id !== id),
    })),

  selectProduct: (product) => set({ selectedProduct: product }),
  setEditingProduct: (editing) => set({ isEditingProduct: editing }),

  addNotification: (notification) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      createdDate: new Date().toISOString(),
      ...notification,
    };
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));
  },

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === id
          ? { ...notification, status: "Sent" as const }
          : notification
      ),
    })),

  logActivity: (activity) => {
    const newLog: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...activity,
    };
    set((state) => ({ auditLogs: [...state.auditLogs, newLog] }));
  },

  addMaterialRequest: (request) => {
    const newRequest: MaterialRequest = {
      id: Date.now().toString(),
      requestedDate: new Date().toISOString(),
      ...request,
    };
    set((state) => ({
      materialRequests: [...state.materialRequests, newRequest],
    }));
  },

  updateMaterialRequest: (id, updates) =>
    set((state) => ({
      materialRequests: state.materialRequests.map((request) =>
        request.id === id ? { ...request, ...updates } : request
      ),
    })),

  getMaterialRequestByCardId: (cardId) =>
    get().materialRequests.find(
      (request) => request.productionCardId === cardId
    ),

  addProductionCard: (card) => {
    const newCard: ProductionCard = {
      id: Date.now().toString(),
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      ...card,
    };
    set((state) => ({ productionCards: [...state.productionCards, newCard] }));
  },

  updateProductionCard: (id, updates) =>
    set((state) => ({
      productionCards: state.productionCards.map((card) =>
        card.id === id
          ? { ...card, ...updates, updatedDate: new Date().toISOString() }
          : card
      ),
    })),

  deleteProductionCard: (id) =>
    set((state) => ({
      productionCards: state.productionCards.filter((card) => card.id !== id),
    })),

  getProductionCardsByProject: (projectId) =>
    get().productionCards.filter((card) => card.projectId === projectId),

  addInventoryItem: (item) => {
    const state = get();
    const autoGeneratedCode = generateInventoryCode(state.inventoryItems);
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      // code: autoGeneratedCode,
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      // lastUpdate: new Date().toLocaleDateString("en-GB"),
      // lastUpdateTime: new Date().toLocaleTimeString("en-US", {
      //   hour: "numeric",
      //   minute: "2-digit",
      //   hour12: true,
      // }),
      // iconColor: [
      //   "amber",
      //   "blue",
      //   "green",
      //   "purple",
      //   "orange",
      //   "red",
      //   "indigo",
      // ][Math.floor(Math.random() * 7)],
      ...item,
    };
    set((state) => ({ inventoryItems: [...state.inventoryItems, newItem] }));
  },

  updateInventoryItem: (id, updates) =>
    set((state) => ({
      inventoryItems: state.inventoryItems.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedDate: new Date().toISOString() }
          : item
      ),
    })),

  deleteInventoryItem: (id) =>
    set((state) => ({
      inventoryItems: state.inventoryItems.filter((item) => item.id !== id),
    })),

  getInventoryItemByCode: (code: string) =>
    get().inventoryItems.find((item) => item.code === code),

  updateVendor: (id, updates) =>
    set((state) => ({
      vendors: state.vendors.map((vendor) =>
        vendor.id === id ? { ...vendor, ...updates } : vendor
      ),
    })),

  addVendor: (vendor: Omit<Vendor, "id">) => {
    const newVendor: Vendor = {
      id: Date.now().toString(),
      ...vendor,
    };
    set((state) => ({ vendors: [...state.vendors, newVendor] }));
  },

  addInventoryTransaction: (
    transaction: Omit<InventoryTransaction, "id" | "createdDate">
  ) => {
    const newTransaction: InventoryTransaction = {
      id: Date.now().toString(),
      createdDate: new Date().toISOString(),
      ...transaction,
    };
    set((state) => ({
      inventoryTransactions: [...state.inventoryTransactions, newTransaction],
    }));
  },

  getInventoryTransactionsByDateRange: (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return get().inventoryTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.transactionDate);
      return transactionDate >= start && transactionDate <= end;
    });
  },

  getInventoryTransactionsByItem: (itemId: string) =>
    get().inventoryTransactions.filter(
      (transaction) => transaction.itemId === itemId
    ),

  // Delivery Management Actions
  addDeliveryItem: (
    item: Omit<DeliveryItem, "id" | "createdDate" | "updatedDate" | "aging">
  ) => {
    const aging =
      item.deliveryDate && item.poReceivedDate
        ? Math.floor(
            (new Date(item.deliveryDate).getTime() -
              new Date(item.poReceivedDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

    const newItem: DeliveryItem = {
      id: Date.now().toString(),
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      aging,
      ...item,
    };
    set((state) => ({ deliveryItems: [...state.deliveryItems, newItem] }));
  },

  updateDeliveryItem: (id, updates) => {
    set((state) => ({
      deliveryItems: state.deliveryItems.map((item) => {
        if (item.id === id) {
          const updatedItem = {
            ...item,
            ...updates,
            updatedDate: new Date().toISOString(),
          };
          // Recalculate aging if dates changed
          if (updates.deliveryDate || updates.poReceivedDate) {
            const poDate = updates.poReceivedDate || item.poReceivedDate;
            const delDate = updates.deliveryDate || item.deliveryDate;
            updatedItem.aging =
              delDate && poDate
                ? Math.floor(
                    (new Date(delDate).getTime() - new Date(poDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0;
          }
          return updatedItem;
        }
        return item;
      }),
    }));
  },

  deleteDeliveryItem: (id) =>
    set((state) => ({
      deliveryItems: state.deliveryItems.filter((item) => item.id !== id),
    })),

  getDeliveryItemsByStatus: (
    status: "Pending" | "Parcel Delivered" | "Delivered"
  ) => get().deliveryItems.filter((item) => item.deliveryStatus === status),
}));
