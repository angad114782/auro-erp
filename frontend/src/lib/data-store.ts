// Comprehensive ERP data store following the exact specification
import { create } from "zustand";
import {
  sampleDeliveryItems,
  sampleInventoryItems,
  sampleInventoryTransactions,
  sampleProductionCards,
  sampleProducts,
  sampleUsers,
  sampleVendors,
} from "./dummyData";

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
  artName: string;
  companyId: string;
  brandId: string;
  categoryId: string;
  typeId: string;
  color: string;
  countryId: string;
  companyName?: string;
  brandName?: string;
  categoryName?: string;
  typeName?: string;
  countryName?: string;
  gender?: string;
  assignPerson: { _id: string; name: string };

  // company: { _id: string; name: string };
  // brand: { _id: string; name: string };
  // category: { _id: string; name: string };
  // type: { _id: string; name: string };
  // country: { _id: string; name: string };
  // color: string;

  designerId: string;
  status:
    | "ready_for_red_seal"
    | "Idea Submitted"
    | "Costing Pending"
    | "Costing Received"
    | "prototype"
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
  priority: "HIGH" | "MEDIUM" | "LOW";
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
  assignPersons: { _id: string; name: string }[];
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

  setAssignPersons: (list: { _id: string; name: string }[]) => void;
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

  setRDProjects: (
    projects: RDProject[] | ((prev: RDProject[]) => RDProject[])
  ) => void;
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

  colors: [],
  // countries: sampleCountries,
  setAssignPersons: (list: { _id: string; name: string }[]) =>
    set({ assignPersons: list }),

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
  setRDProjects: (
    projects: RDProject[] | ((prev: RDProject[]) => RDProject[])
  ) =>
    set((state) => ({
      rdProjects:
        typeof projects === "function" ? projects(state.rdProjects) : projects,
    })),

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
