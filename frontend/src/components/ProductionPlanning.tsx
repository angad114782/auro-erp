import React, { useEffect, useState } from "react";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Clock,
  Users,
  Package,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Target,
  Factory,
  ArrowRight,
  IndianRupee,
  Eye,
  Building,
  Award,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Menu,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Calendar as CalendarUI } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useERPStore } from "../lib/data-store";
import { CreateProductionCardDialog } from "./CreateProductionCardDialog";
import { AddProductionCardDialog } from "./AddProductionCardDialog";
import { ViewProductionCardDialog } from "./ViewProductionCardDialog";
import { ProductionPlanDetailsDialog } from "./ProductionPlanDetailsDialog";
import { toast } from "sonner";
import api from "../lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

// Production Plan interface based on R&D project data
interface ProductionPlan {
  id: string;
  rdProjectId: string;
  projectCode: string;
  poNumber: string;
  planName: string;
  productName: string;

  // resolved human-friendly names (optional)
  brand?: string;
  brandId?: string;
  brandCode?: string;

  category?: string;
  categoryId?: string;
  project?: any;
  type?: string;
  typeId?: string;

  gender?: string;
  company?: string;
  companyId?: string;

  artColour?: string;
  color?: string;
  country?: string;
  assignPerson?: string;
  countryId?: string;

  profileImage?: string; // Add this for displaying product image

  quantity: number;
  startDate: string;
  endDate: string;
  deliveryDate: string;
  priority: "High" | "Medium" | "Low";
  status:
    | "Planning"
    | "Capacity Allocated"
    | "Manufacturing Assigned"
    | "Process Defined"
    | "Ready for Production"
    | "In Production";
  assignedPlant: string;
  assignedTeam: string;

  targetCost: number;
  finalCost: number;
  poValue: number;
  estimatedCost: number;
  costVariance: {
    amount: number;
    isOverBudget: boolean;
    percentage: string;
  };

  materials: Array<{ name: string; required: number; available: number }>;
  progress: number;
  remarks: string;
  createdDate: string;
  updatedDate: string;

  // raw original doc
  raw?: any;
}

type CalendarEntry = {
  id: string;
  projectId: string | null;
  projectCode: string;
  productName: string;
  artName: string;
  color: string;
  size: string;
  brand?: string;
  brandId?: string;
  category?: string;
  categoryId?: string;
  type?: string;
  typeId?: string;
  company?: string;
  companyId?: string;
  country?: string;
  countryId?: string;
  gender?: string;
  assignedPlant: string | null;
  quantity: number;
  startDate: string;
  endDate: string;
  remarks?: string;
  raw?: any;
};

const resolveNameFromList = (
  value: any,
  list: any[] = [],
  nameKeys: string[] = [
    "name",
    "brandName",
    "categoryName",
    "typeName",
    "countryName",
  ]
): string | undefined => {
  if (!value) return undefined;

  // If it's an object with name-like keys
  if (typeof value === "object") {
    for (const key of nameKeys) if (value[key]) return String(value[key]);
    if (value.name) return String(value.name);
    return undefined;
  }

  // If it's a string id, try to find in list by id/_id/value
  const foundById = list.find((it) => (it.id ?? it._id ?? it.value) === value);
  if (foundById) {
    for (const key of nameKeys)
      if (foundById[key]) return String(foundById[key]);
    if (foundById.name) return String(foundById.name);
    return String(foundById.id ?? foundById._id ?? value);
  }

  // If it's already a readable non-ObjectId string, return it
  if (
    typeof value === "string" &&
    value.length > 0 &&
    !/^[0-9a-fA-F]{24}$/.test(value)
  ) {
    return value;
  }

  return undefined;
};

// normalize various priority values from DB into High|Medium|Low
const normalizePriority = (val: any): "High" | "Medium" | "Low" => {
  if (!val && val !== 0) return "Medium";
  const s = String(val).trim().toLowerCase();

  // common explicit labels
  if (["high", "hi", "h", "urgent", "critical", "1"].includes(s)) return "High";
  if (["low", "lo", "l", "minor", "3"].includes(s)) return "Low";
  // treat numeric 2 or 'medium' as medium
  if (["medium", "med", "m", "2"].includes(s)) return "Medium";

  // fallback heuristics
  if (s.includes("urgent") || (s.includes("priority") && s.includes("high")))
    return "High";
  if (s.includes("low")) return "Low";
  if (s.includes("high")) return "High";
  if (s.includes("medium") || s.includes("med")) return "Medium";

  // default
  return "Medium";
};

export function ProductionPlanning() {
  const { rdProjects, brands, categories, types, colors, countries } =
    useERPStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedView, setSelectedView] = useState("list");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isSavingCalendarChange, setIsSavingCalendarChange] = useState(false);
  const [isDeletingEntryId, setIsDeletingEntryId] = useState<string | null>(
    null
  );
  // Add near other state hooks in ProductionPlanning
  const [isLoadingPlanDetails, setIsLoadingPlanDetails] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Production cards management state
  const [isProductionDialogOpen, setIsProductionDialogOpen] = useState(false);
  const [isCreateCardDialogOpen, setIsCreateCardDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<
    string | null
  >(null);

  const [isViewCardDialogOpen, setIsViewCardDialogOpen] = useState(false);
  // keep this flexible because calendar entries shape is not full ProductionPlan
  const [selectedProductionForView, setSelectedProductionForView] = useState<
    any | null
  >(null);
  const [isPlanDetailsDialogOpen, setIsPlanDetailsDialogOpen] = useState(false);
  const [selectedPlanForDetails, setSelectedPlanForDetails] =
    useState<ProductionPlan | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Date change dialog state
  const [isDateChangeDialogOpen, setIsDateChangeDialogOpen] = useState(false);
  const [selectedProductionForDateChange, setSelectedProductionForDateChange] =
    useState<any | null>(null);
  const [newProductionDate, setNewProductionDate] = useState("");
  const [productionCards, setProductionCards] = useState<
    Array<{
      id: string;
      cardName: string;
      description: string;
      assignedTo: string;
      priority: "High" | "Medium" | "Low";
      startDate: string;
      endDate: string;
      status: "Not Started" | "In Progress" | "Completed";
      createdDate: string;
    }>
  >([]);

  const [productionPlans, setProductionPlans] = useState<ProductionPlan[]>([]);

  React.useEffect(() => {
    // inside ProductionPlanning component:
    const fetchProductionPlans = async () => {
      try {
        const res = await api.get("/projects/production");
        // axios returns response in res.data
        const raw = res.data;
        console.log("raw fetchProductionPlans response:", raw);

        // Normalize to array
        let rawItems: any[] = [];

        if (Array.isArray(raw)) {
          rawItems = raw;
        } else if (Array.isArray(raw.data?.items)) {
          rawItems = raw.data.items;
        } else if (Array.isArray(raw.items)) {
          rawItems = raw.items;
        } else if (Array.isArray(raw.data)) {
          rawItems = raw.data;
        } else if (Array.isArray(raw.items?.data)) {
          // defensive
          rawItems = raw.items.data;
        } else {
          console.warn("fetchProductionPlans unexpected response shape:", raw);
          toast.error(
            "Unexpected response from production API — check console."
          );
          rawItems = [];
        }

        // Map to ProductionPlan[] — ensure all required fields exist
        const mapped: ProductionPlan[] = rawItems.map((doc: any) => {
          const proj = doc.project || {};
          const po = doc.po || {};

          const safeDate = (d: any) =>
            d ? new Date(d).toISOString().split("T")[0] : "";

          return {
            id: doc._id,
            rdProjectId: proj._id || "",
            projectCode: proj.autoCode || doc.autoCodeSnapshot || "-",
            poNumber: po.poNumber || "-",
            poValue: po.totalAmount || 0,

            // Name fields
            planName: proj.artName || doc.artNameSnapshot || "Untitled",
            productName: proj.artName || doc.artNameSnapshot || "Untitled",

            // brand/category/type not available → fallback to "-"
            brand: proj.brand || "-",
            category: proj.category || "-",
            type: proj.type || "-",

            // color / art colour
            artColour: proj.color || doc.colorSnapshot || "",
            assignPerson: proj.assignPerson || "",
            color: proj.color || doc.colorSnapshot || "",

            // quantity from PO
            quantity: po.orderQuantity || 0,

            // dates
            startDate: safeDate(doc.startDate),
            endDate: safeDate(doc.targetCompletionDate),
            deliveryDate: safeDate(doc.targetCompletionDate),

            priority: normalizePriority(
              doc.priority ??
                proj.priority ??
                doc.projectSnapshot?.priority ??
                doc.productionDetails?.priority ??
                doc.priorityLevel ?? // possible alternate field name
                "Medium"
            ),
            status: doc.status || "Planning",

            assignedPlant: doc.assignedPlant || "",
            assignedTeam: (doc.assignedTeam || []).join(", ") || "",

            targetCost: doc.targetCost || 0,
            finalCost: doc.finalCost || 0,
            estimatedCost: doc.estimatedCost || 0,

            costVariance: {
              amount: 0,
              isOverBudget: false,
              percentage: "0",
            },

            materials: doc.materials || [],
            progress: 0,

            remarks: doc.notes || "",
            createdDate: safeDate(doc.createdAt),
            updatedDate: safeDate(doc.updatedAt),

            profileImage: doc.coverImageSnapshot || "",

            raw: doc,
          };
        });

        // Set state (replace whole array)
        setProductionPlans(mapped);
      } catch (err) {
        console.error("Error loading production plans:", err);
        toast.error("Failed to load production plans");
      }
    };

    fetchProductionPlans();
  }, []);

  // ---------------------- Calendar types & state ----------------------
  const [calendarEntries, setCalendarEntries] = React.useState<CalendarEntry[]>(
    []
  );

  // ---------------------- fetch function (calendar) ----------------------
  // ---------------------- fetch function (calendar) ----------------------
  const fetchCalendarEntries = async () => {
    try {
      console.log("Fetching calendar entries...");
      const res = await api.get("/calendar"); // -> /api/calendar
      const raw = res.data;
      console.log("raw calendar response:", raw);

      let docs: any[] = [];
      if (Array.isArray(raw)) docs = raw;
      else if (Array.isArray(raw.data?.items)) docs = raw.data.items;
      else if (Array.isArray(raw.items)) docs = raw.items;
      else if (Array.isArray(raw.data)) docs = raw.data;
      else {
        console.warn("Unexpected calendar response shape, see raw:", raw);
        toast.error("Calendar: unexpected response shape (check console).");
        docs = [];
      }

      console.log("Normalized docs length:", docs.length, docs);

      // Replace existing toYMD / dateToYMD_Utc with these (use inside the component)
      const toLocalYMD = (input: string | Date | undefined | null): string => {
        if (!input) return "";
        const d = typeof input === "string" ? new Date(input) : input;
        // convert to local date (avoid UTC shift)
        const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const y = local.getFullYear();
        const m = String(local.getMonth() + 1).padStart(2, "0");
        const day = String(local.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      const mapped: CalendarEntry[] = docs.map((doc: any) => {
        const scheduling = doc.scheduling ?? {};
        const prod = doc.productionDetails ?? {};
        const snapshot = doc.projectSnapshot ?? {};
        const project = doc.project ?? {};

        // prefer scheduleDate (your API) and fallback to other fields
        const start = scheduling.scheduleDate; // THIS IS THE MAIN DATE
        const end = scheduling.soleExpectedDate; // only for details view

        const quantity =
          Number(
            prod.quantity ?? doc.quantity ?? doc.qty ?? scheduling.quantity ?? 0
          ) || 0;

        const s = toLocalYMD(start);
        const e = toLocalYMD(end);

        // FIXED: Properly extract plant name from object
        const assignedPlantObj = scheduling.assignedPlant;
        let assignedPlantName: string | null = null;

        if (assignedPlantObj) {
          if (typeof assignedPlantObj === "string") {
            assignedPlantName = assignedPlantObj;
          } else if (typeof assignedPlantObj === "object") {
            // Try common name properties
            assignedPlantName =
              assignedPlantObj.name ||
              assignedPlantObj.plantName ||
              assignedPlantObj.plant ||
              assignedPlantObj.title;

            // If still no name found but it's an object with _id, use a fallback
            if (!assignedPlantName && assignedPlantObj._id) {
              assignedPlantName = "Assigned Plant";
            }
          }
        }

        // Fallback to other possible sources
        if (!assignedPlantName) {
          assignedPlantName = prod.assignedPlant || doc.assignedPlant || null;
        }

        // FIXED: Extract brand name properly from nested objects
        const getBrandName = (brandObj: any): string => {
          if (!brandObj) return "-";
          if (typeof brandObj === "string") return brandObj;
          if (typeof brandObj === "object") {
            return (
              brandObj.name ||
              brandObj.brandName ||
              brandObj.brand ||
              String(brandObj)
            );
          }
          return String(brandObj);
        };

        // FIXED: Extract category name properly
        const getCategoryName = (categoryObj: any): string => {
          if (!categoryObj) return "-";
          if (typeof categoryObj === "string") return categoryObj;
          if (typeof categoryObj === "object") {
            return (
              categoryObj.name ||
              categoryObj.categoryName ||
              categoryObj.category ||
              String(categoryObj)
            );
          }
          return String(categoryObj);
        };

        // FIXED: Extract type name properly
        const getTypeName = (typeObj: any): string => {
          if (!typeObj) return "-";
          if (typeof typeObj === "string") return typeObj;
          if (typeof typeObj === "object") {
            return (
              typeObj.name ||
              typeObj.typeName ||
              typeObj.type ||
              String(typeObj)
            );
          }
          return String(typeObj);
        };

        // FIXED: Extract company name properly
        const getCompanyName = (companyObj: any): string => {
          if (!companyObj) return "-";
          if (typeof companyObj === "string") return companyObj;
          if (typeof companyObj === "object") {
            return (
              companyObj.name ||
              companyObj.companyName ||
              companyObj.company ||
              String(companyObj)
            );
          }
          return String(companyObj);
        };

        // FIXED: Extract country name properly
        const getCountryName = (countryObj: any): string => {
          if (!countryObj) return "-";
          if (typeof countryObj === "string") return countryObj;
          if (typeof countryObj === "object") {
            return (
              countryObj.name ||
              countryObj.countryName ||
              countryObj.country ||
              String(countryObj)
            );
          }
          return String(countryObj);
        };

        return {
          id:
            doc._id ??
            doc.id ??
            `cal-${Math.random().toString(36).slice(2, 8)}`,
          projectId: project._id ?? project.id ?? snapshot.projectId ?? null,

          // projectCode / product
          projectCode:
            snapshot.autoCode ??
            project.autoCode ??
            snapshot.projectCode ??
            doc.projectCode ??
            "-",

          // product / art / display name (priority order)
          artName:
            snapshot.artName ??
            project.artName ??
            snapshot.productName ??
            prod.productName ??
            doc.productName ??
            project.name ??
            "Untitled",

          // make productName the human-friendly name (same as artName)
          productName:
            // prefer explicit artName from snapshot, then project.artName, then snapshot.productName, then prod.productName, then doc.productName, then project.name
            snapshot.artName ??
            project.artName ??
            snapshot.productName ??
            prod.productName ??
            doc.productName ??
            project.name ??
            "Untitled",
          // color & size
          color:
            snapshot.color ?? project.color ?? prod.color ?? doc.color ?? "",

          size: snapshot.size ?? prod.size ?? doc.size ?? "-",

          // brand / category / type / company / country / gender
          // FIXED: Use helper functions to extract names properly
          brand: getBrandName(
            snapshot.brand ??
              snapshot.brandName ??
              project.brand ??
              project.brandName
          ),

          category: getCategoryName(
            snapshot.category ??
              snapshot.categoryName ??
              project.category ??
              project.categoryName
          ),

          type: getTypeName(
            snapshot.type ??
              snapshot.typeName ??
              project.type ??
              project.typeName
          ),

          company: getCompanyName(
            snapshot.companyName ?? project.companyName ?? project.company
          ),

          country: getCountryName(
            snapshot.countryName ?? project.countryName ?? project.country
          ),

          gender:
            snapshot.gender ??
            project.gender ??
            prod.gender ??
            doc.gender ??
            "-",

          // scheduling / production specifics
          // FIXED: Use the extracted plant name instead of the object
          assignedPlant: assignedPlantName,
          quantity,

          // Use scheduleDate as primary (s) and keep end for details
          startDate: s, // always scheduleDate (toLocalYMD result)
          endDate: e || s, // used for details, fallback to start

          remarks:
            doc.remarks ?? doc.notes ?? doc.additional?.remarks ?? "" ?? "",
          raw: doc,
        } as CalendarEntry;
      });

      // dedupe by id (keep first occurrence) and set state
      const uniqueEntries: CalendarEntry[] = mapped.filter(
        (v, i, a) => a.findIndex((x) => x.id === v.id) === i
      );

      setCalendarEntries(uniqueEntries);
      console.log("Mapped calendar entries:", uniqueEntries);
    } catch (err) {
      console.error("fetchCalendarEntries error:", err);
      toast.error("Failed to load calendar entries");
      setCalendarEntries([]);
    }
  };

  const dateToLocalYMD = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getProductionsForDateUniversal = (
    date: Date
  ): Array<{
    productName: string;
    artName?: string;
    projectCode?: string;
    color?: string;
    size?: string;
    brand?: string;
    category?: string;
    type?: string;
    company?: string;
    country?: string;
    gender?: string;
    quantity: number;
    assignedPlant?: string | null;
    remarks?: string;
    startDate: string;
    endDate: string;
    id?: string;
    raw?: any;
  }> => {
    const dStr = dateToLocalYMD(date);

    if (selectedView === "calendar") {
      return calendarEntries
        .filter((e) => {
          const entryDate = e.startDate || e.endDate || "";
          return entryDate === dStr;
        })
        .map((e) => ({
          productName: e.productName,
          artName: e.artName,
          projectCode: e.projectCode,
          color: e.color,
          size: e.size,
          brand: e.brand,
          category: e.category,
          type: e.type,
          company: e.company,
          country: e.country,
          gender: e.gender,
          quantity: e.quantity,
          assignedPlant: e.assignedPlant,
          remarks: e.remarks,
          startDate: e.startDate,
          endDate: e.endDate,
          id: e.id,
          raw: e.raw,
        }));
    }

    // fallback: match productionPlans by local startDate equality
    return productionPlans
      .filter((plan) => {
        if (!plan.startDate) return false;
        const planStart = plan.startDate.split("T")[0];
        return planStart === dStr;
      })
      .map((plan) => ({
        productName: plan.productName,
        artName: plan.artColour || plan.color,
        assignPerson: plan.assignPerson,
        projectCode: plan.projectCode,
        color: plan.color,
        size: undefined,
        brand: plan.brand,
        category: plan.category,
        priority: plan.priority,
        type: plan.type,
        company: undefined,
        country: plan.country,
        gender: plan.gender,
        quantity: plan.quantity,
        assignedPlant: plan.assignedPlant,
        remarks: plan.remarks,
        startDate: plan.startDate,
        endDate: plan.endDate,
        id: plan.id,
        raw: plan,
      }));
  };

  // ---------------------- call fetch when calendar tab opens ----------------------
  React.useEffect(() => {
    if (selectedView === "calendar") {
      setCurrentDate(new Date());
      fetchCalendarEntries();
    }
  }, [selectedView]);

  // Helper to fetch full production or project data
  const loadFullPlanDetails = async (plan: any) => {
    if (!plan) return null;

    // Try a few candidate ids (production id first, then project id)
    const tryIds = [
      plan.id,
      plan.raw?._id,
      plan.raw?.id,
      plan.rdProjectId,
      plan.projectId,
      plan.project?._id,
    ].filter(Boolean);

    setIsLoadingPlanDetails(true);
    try {
      // 1) Try fetch production doc by prodId
      for (const candidate of tryIds) {
        try {
          const prodRes = await api.get(`/projects/production/${candidate}`);
          const prodDoc = prodRes.data?.data ?? prodRes.data;
          if (prodDoc) {
            // if project is not populated try to fetch it
            if (!prodDoc.project || typeof prodDoc.project === "string") {
              const projectId =
                prodDoc.project || plan.rdProjectId || prodDoc.projectId;
              if (projectId) {
                try {
                  const pRes = await api.get(`/projects/${projectId}`);
                  prodDoc.project = pRes.data?.data ?? pRes.data;
                } catch (e) {
                  // ignore project fetch error
                  console.debug("project fetch failed for", projectId, e);
                }
              }
            }

            // compute a safe numeric quantity
            const quantity =
              prodDoc.quantity ??
              prodDoc.quantitySnapshot ??
              prodDoc.po?.orderQuantity ??
              prodDoc.project?.po?.orderQuantity ??
              prodDoc.project?.orderQuantity ??
              0;

            return {
              // don't mutate original — return a normalized copy
              ...prodDoc,
              quantity,
              project: prodDoc.project ?? null,
            };
          }
        } catch (e) {
          // ignore single-prod fetch failures, try next candidate
          console.debug("prod fetch candidate failed:", candidate, e);
        }
      }

      // 2) No production doc — try fetching project directly
      const projectId =
        plan.rdProjectId ?? plan.projectId ?? plan.raw?.project ?? null;
      if (projectId) {
        try {
          const pRes = await api.get(`/projects/${projectId}`);
          const project = pRes.data?.data ?? pRes.data;
          if (project) {
            const computedQuantity =
              plan.quantity ??
              plan.quantitySnapshot ??
              project.po?.orderQuantity ??
              project.orderQuantity ??
              0;

            return {
              ...plan,
              project,
              artNameSnapshot:
                plan.artNameSnapshot ??
                project.artName ??
                plan.productName ??
                "",
              colorSnapshot: plan.colorSnapshot ?? project.color ?? "",
              coverImageSnapshot:
                plan.coverImageSnapshot ?? project.coverImage ?? "",
              priority: plan.priority ?? project.priority ?? "Medium",
              po: plan.po ?? project.po ?? null,
              quantity: computedQuantity,
            };
          }
        } catch (e) {
          console.debug("project fetch error:", projectId, e);
        }
      }

      // fallback to original plan but ensure quantity is present
      return {
        ...plan,
        quantity:
          plan.quantity ??
          plan.quantitySnapshot ??
          plan.po?.orderQuantity ??
          plan.project?.po?.orderQuantity ??
          0,
        project: plan.project ?? null,
      };
    } finally {
      setIsLoadingPlanDetails(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      Planning: "bg-blue-100 text-blue-800",
      "Capacity Allocated": "bg-yellow-100 text-yellow-800",
      "Manufacturing Assigned": "bg-purple-100 text-purple-800",
      "Process Defined": "bg-orange-100 text-orange-800",
      "Ready for Production": "bg-green-100 text-green-800",
      "In Production": "bg-teal-100 text-teal-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      High: "bg-red-500 text-white",
      Medium: "bg-purple-500 text-white",
      Low: "bg-green-600 text-white",
    };
    return colors[priority as keyof typeof colors] || "bg-gray-500 text-white";
  };

  const filteredPlans = productionPlans.filter((plan) => {
    const matchesSearch =
      (plan.planName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (plan.projectCode || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (plan.poNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (plan.productName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (plan.brand || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      selectedFilter === "all" ||
      (plan.status || "").toLowerCase().replace(" ", "-") === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  // Pagination helper functions
  const getPaginatedPlans = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPlans.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredPlans.length / itemsPerPage);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const getResourceAvailability = (
    materials: Array<{ name: string; required: number; available: number }>
  ) => {
    const total = materials.reduce((sum, mat) => sum + mat.required, 0);
    const available = materials.reduce(
      (sum, mat) => sum + Math.min(mat.available, mat.required),
      0
    );
    return (available / total) * 100;
  };

  // Status-based filtering counts
  const statusCounts = {
    planning: productionPlans.filter((p) => p.status === "Planning").length,
    capacityAllocated: productionPlans.filter(
      (p) => p.status === "Capacity Allocated"
    ).length,
    manufacturingAssigned: productionPlans.filter(
      (p) => p.status === "Manufacturing Assigned"
    ).length,
    processDefinied: productionPlans.filter(
      (p) => p.status === "Process Defined"
    ).length,
    readyForProduction: productionPlans.filter(
      (p) => p.status === "Ready for Production"
    ).length,
    inProgress: productionPlans.filter((p) => p.status === "In Production")
      .length,
  };

  // Calendar helper functions
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Start week on Monday
    return new Date(d.setDate(diff));
  };

  const getWeekDays = (weekStart: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getWeeksInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstWeekStart = getWeekStart(firstDay);
    const weeks = [];

    let currentWeek = new Date(firstWeekStart);
    while (currentWeek <= lastDay) {
      weeks.push(new Date(currentWeek));
      currentWeek.setDate(currentWeek.getDate() + 7);
    }

    return weeks;
  };

  const getProductionsForDate = (date: Date) => {
    return filteredPlans.filter((plan) => {
      // Normalize dates to compare only date parts (ignore time)
      const checkDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const startDate = new Date(plan.startDate);
      const planStartDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      );
      const endDate = new Date(plan.endDate);
      const planEndDate = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
      );

      return checkDate >= planStartDate && checkDate <= planEndDate;
    });
  };

  const getWeekTotal = (weekStart: Date) => {
    const weekDays = getWeekDays(weekStart);
    const weekProductions = weekDays.flatMap((day) =>
      getProductionsForDateUniversal(day)
    );
    return weekProductions.reduce(
      (total, plan) => total + (plan.quantity || 0),
      0
    );
  };

  const getOrdinalSuffix = (num: number) => {
    if (num > 3 && num < 21) return "th";
    switch (num % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  // Production card management functions
  const handleStartProduction = (plan: ProductionPlan) => {
    setSelectedPlan(plan);
    setIsCreateCardDialogOpen(true);
  };

  // Convert production plan to RD Project format for the dialog
  const convertPlanToRDProject = (plan: ProductionPlan | null) => {
    if (!plan) return null;

    // Find matching brand, category, type, color, country by name
    const brand = brands.find((b) => b.brandName === plan.brand);
    const category = categories.find((c) => c.categoryName === plan.category);
    const type = types.find((t) => t.typeName === plan.type);
    const color = colors.find((c) => c.colorName === plan.color);
    const country = countries.find((c) => c.countryName === plan.country);

    return {
      id: plan.rdProjectId,
      autoCode: plan.projectCode,
      brandId: brand?.id || "1",
      categoryId: category?.id || "1",
      typeId: type?.id || "1",
      colorId: color?.id || "1",
      countryId: country?.id || "1",
      designerId: "3",
      status: "Final Approved" as const,
      tentativeCost: plan.targetCost,
      targetCost: plan.targetCost,
      finalCost: plan.finalCost,
      difference: plan.finalCost - plan.targetCost,
      startDate: plan.startDate,
      endDate: plan.endDate,
      duration: Math.ceil(
        (new Date(plan.endDate).getTime() -
          new Date(plan.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      poTarget: plan.deliveryDate,
      poReceived: plan.deliveryDate,
      poNumber: plan.poNumber,
      poStatus: "Approved" as const,
      poDelay: 0,
      nextUpdateDate: plan.updatedDate,
      remarks: plan.remarks,
      clientFeedback: "OK" as const,
      priority: plan.priority,
      // taskInc: plan.taskInc,
      updateNotes: "",
      createdDate: plan.createdDate,
      updatedDate: plan.updatedDate,
    };
  };

  // Handle saving new production card from calendar
  const handleSaveProductionCard = (cardData: any) => {
    // Generate unique ID
    const newId = `PP${String(productionPlans.length + 1).padStart(3, "0")}`;

    // Create new production plan
    const newPlan: ProductionPlan = {
      id: newId,
      rdProjectId: `rd-${newId}`,
      projectCode: `RND/25-26/09/${100 + productionPlans.length + 1}`,
      poNumber: "-",
      planName: `${cardData.productName} Production`,
      productName: cardData.productName,
      brand: cardData.brand || "-",
      brandCode: "-",
      category: cardData.category || "-",
      type: cardData.type || "-",
      gender: cardData.gender || "-",
      artColour: cardData.artColour || "-",
      assignPerson: cardData.assignPerson || "-",
      color: cardData.artColour || "-",
      country: cardData.country || "-",
      quantity: cardData.quantity,
      startDate: cardData.startDate,
      endDate: cardData.endDate,
      deliveryDate: cardData.endDate,
      priority: "Medium",
      status: "Planning",
      assignedPlant: cardData.assignedPlant || "-",
      assignedTeam: "-",
      targetCost: 0,
      finalCost: 0,
      poValue: 0,
      estimatedCost: 0,
      costVariance: {
        amount: 0,
        isOverBudget: false,
        percentage: "0%",
      },
      materials: [],
      progress: cardData.progress || 0,
      remarks: cardData.remarks || "",
      createdDate: new Date().toISOString().split("T")[0],
      updatedDate: new Date().toISOString().split("T")[0],
    };

    // Add to production plans
    setProductionPlans([...productionPlans, newPlan]);
  };

  // Handle updating existing production card
  const handleUpdateProductionCard = (updatedData: any) => {
    // Find and update the production plan
    const updatedPlans = productionPlans.map((plan) =>
      plan.id === updatedData.id ? updatedData : plan
    );

    // Update state
    setProductionPlans(updatedPlans);
  };

  const handleProductionDateChange = async () => {
    if (!selectedProductionForDateChange || !newProductionDate) {
      return;
    }

    // Prepare doc id (calendar entry id)
    const docId =
      selectedProductionForDateChange.id ??
      selectedProductionForDateChange._id ??
      selectedProductionForDateChange.raw?._id ??
      selectedProductionForDateChange.raw?.id;

    // If there's no docId, fallback to local update (productionPlans)
    if (!docId) {
      // local-only plan (fallback)
      const updatedPlans = productionPlans.map((plan) => {
        if (plan.id === selectedProductionForDateChange.id) {
          return {
            ...plan,
            startDate: newProductionDate,
            endDate: newProductionDate,
            updatedDate: dateToLocalYMD(new Date()),
          };
        }
        return plan;
      });

      setProductionPlans(updatedPlans);
      setIsDateChangeDialogOpen(false);
      setSelectedProductionForDateChange(null);
      setNewProductionDate("");
      toast.success("Production date updated locally");
      return;
    }

    // Build payload shape expected by backend
    const payload = {
      scheduling: {
        scheduleDate: newProductionDate,
        // keep assignedPlant/sole fields from existing raw if available to avoid accidental overwrites
        assignedPlant:
          selectedProductionForDateChange.raw?.scheduling?.assignedPlant ??
          selectedProductionForDateChange.assignedPlant ??
          selectedProductionForDateChange.raw?.scheduling?.assignedPlant ??
          "",
        soleFrom:
          selectedProductionForDateChange.raw?.scheduling?.soleFrom ?? "",
        soleColor:
          selectedProductionForDateChange.raw?.scheduling?.soleColor ?? "",
        soleExpectedDate:
          selectedProductionForDateChange.raw?.scheduling?.soleExpectedDate ??
          null,
      },
    };

    try {
      setIsSavingCalendarChange(true);
      const res = await api.put(`/calendar/${docId}`, payload);
      const updated = res.data?.data ?? res.data;

      // Update local calendarEntries list: replace by id
      setCalendarEntries((prev) =>
        prev.map((e) =>
          e.id === (updated._id ?? updated.id)
            ? {
                ...e,
                startDate: updated.scheduling?.scheduleDate
                  ? dateToLocalYMD(new Date(updated.scheduling.scheduleDate))
                  : newProductionDate,
                endDate: updated.scheduling?.soleExpectedDate
                  ? dateToLocalYMD(
                      new Date(updated.scheduling.soleExpectedDate)
                    )
                  : updated.endDate || newProductionDate,
                remarks: updated.additional?.remarks ?? e.remarks,
                raw: updated,
              }
            : e
        )
      );

      // If you also keep productionPlans in sync, update there if matching
      setProductionPlans((prev) =>
        prev.map((p) =>
          p.id === (updated._id ?? updated.id) ||
          p.rdProjectId === updated.project
            ? {
                ...p,
                startDate: updated.scheduling?.scheduleDate
                  ? dateToLocalYMD(new Date(updated.scheduling.scheduleDate))
                  : p.startDate,
                endDate: updated.scheduling?.soleExpectedDate
                  ? dateToLocalYMD(
                      new Date(updated.scheduling.soleExpectedDate)
                    )
                  : p.endDate,
              }
            : p
        )
      );

      setIsDateChangeDialogOpen(false);
      setSelectedProductionForDateChange(null);
      setNewProductionDate("");

      toast.success("Production date updated");
    } catch (err: any) {
      console.error("Error updating calendar entry date:", err);
      const message =
        err?.response?.data?.message ?? err.message ?? "Failed to update date";
      toast.error(message);
    } finally {
      setIsSavingCalendarChange(false);
    }
  };

  const handleDeleteCalendarEntry = async (entry: any) => {
    const docId = entry.id ?? entry._id ?? entry.raw?._id ?? entry.raw?.id;
    if (!docId) {
      // local removal fallback if no id
      setCalendarEntries((prev) => prev.filter((e) => e.id !== entry.id));
      setProductionPlans((prev) => prev.filter((p) => p.id !== entry.id));
      toast.success("Production removed locally");
      return;
    }

    if (
      !confirm("Are you sure you want to remove this production (soft-delete)?")
    )
      return;

    try {
      setIsDeletingEntryId(docId);
      const res = await api.delete(`/calendar/${docId}`);
      const deleted = res.data?.data ?? res.data;

      // remove from calendarEntries
      setCalendarEntries((prev) =>
        prev.filter((e) => e.id !== (deleted._id ?? deleted.id ?? docId))
      );
      // optionally update productionPlans if needed
      setProductionPlans((prev) =>
        prev.filter((p) => p.id !== (deleted._id ?? deleted.id ?? docId))
      );

      toast.success("Production removed (soft-deleted)");
    } catch (err: any) {
      console.error("Error deleting calendar entry:", err);
      const message =
        err?.response?.data?.message ?? err.message ?? "Failed to delete";
      toast.error(message);
    } finally {
      setIsDeletingEntryId(null);
    }
  };

  // Add this function near other handler functions
  const handleRefreshCalendar = async () => {
    if (selectedView === "calendar") {
      await fetchCalendarEntries();
      toast.success("Calendar refreshed");
    }
  };

  // Responsive grid classes
  const summaryGridClass = isMobile
    ? "grid grid-cols-1 gap-4"
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6";

  const calendarDayGridClass = isMobile
    ? "grid grid-cols-1"
    : "grid grid-cols-7";

  const calendarDayClass = isMobile ? "min-h-[150px]" : "min-h-[200px]";

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Production Planning
            </h1>
            <p className="text-sm text-gray-600">
              Schedule and manage manufacturing operations from approved R&D
              projects
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {!isMobile && (
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          )}
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Production Plan</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="planName">Plan Name</Label>
                    <Input id="planName" placeholder="Enter plan name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productCode">R&D Project Code</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select R&D project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RND/25-26/09/103">
                          RND/25-26/09/103
                        </SelectItem>
                        <SelectItem value="RND/25-26/09/104">
                          RND/25-26/09/104
                        </SelectItem>
                        <SelectItem value="RND/25-26/09/105">
                          RND/25-26/09/105
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Production Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Production Start Date</Label>
                    <Input id="startDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Target Completion Date</Label>
                    <Input id="endDate" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plantId">Assigned Manufacturing Plant</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plant-a-china">
                        Plant A - China
                      </SelectItem>
                      <SelectItem value="plant-b-india">
                        Plant B - India
                      </SelectItem>
                      <SelectItem value="plant-c-india">
                        Plant C - India
                      </SelectItem>
                      <SelectItem value="plant-d-vietnam">
                        Plant D - Vietnam
                      </SelectItem>
                      <SelectItem value="plant-e-bangladesh">
                        Plant E - Bangladesh
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Production Requirements & Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter any production requirements, material specifications, or additional notes"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateDialogOpen(false)}>
                    Create Production Plan
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Production Planning</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className={summaryGridClass}>
        <Card className="border-0 shadow-lg bg-linear-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">
                  Total Plans
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {productionPlans.length}
                </p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600">
                    From R&D Projects
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">
                  Ready for Production
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {statusCounts.readyForProduction +
                    statusCounts.processDefinied}
                </p>
                <div className="flex items-center mt-2">
                  <Play className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Ready to Start</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Factory className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">
                  In Planning
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {statusCounts.planning +
                    statusCounts.capacityAllocated +
                    statusCounts.manufacturingAssigned}
                </p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-600">Being Planned</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">
                  Total PO Value
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(
                    productionPlans.reduce((sum, plan) => sum + plan.poValue, 0)
                  )}
                </p>
                <div className="flex items-center mt-2">
                  <IndianRupee className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600">
                    Total Order Value
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1 w-full">
              {/* Search and Filter Section */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search production plans, PO numbers, products..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>

                {/* Filter Dropdown - Hidden on mobile in favor of filter button */}
                {!isMobile ? (
                  <Select
                    value={selectedFilter}
                    onValueChange={(value) => {
                      setSelectedFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[220px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="capacity-allocated">
                        Capacity Allocated
                      </SelectItem>
                      <SelectItem value="manufacturing-assigned">
                        Manufacturing Assigned
                      </SelectItem>
                      <SelectItem value="process-defined">
                        Process Defined
                      </SelectItem>
                      <SelectItem value="ready-for-production">
                        Ready for Production
                      </SelectItem>
                      <SelectItem value="in-production">
                        In Production
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="w-full"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button
                  variant={selectedView === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedView("list")}
                  className="flex-1 md:flex-none"
                >
                  List View
                </Button>
                <Button
                  variant={selectedView === "calendar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedView("calendar")}
                  className="flex-1 md:flex-none"
                >
                  Calendar View
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Filters */}
          {isMobile && showMobileFilters && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selectedFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter("all")}
                  className="text-xs"
                >
                  All Status
                </Button>
                <Button
                  variant={
                    selectedFilter === "planning" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedFilter("planning")}
                  className="text-xs"
                >
                  Planning
                </Button>
                <Button
                  variant={
                    selectedFilter === "capacity-allocated"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedFilter("capacity-allocated")}
                  className="text-xs"
                >
                  Capacity Allocated
                </Button>
                <Button
                  variant={
                    selectedFilter === "manufacturing-assigned"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedFilter("manufacturing-assigned")}
                  className="text-xs"
                >
                  Manufacturing Assigned
                </Button>
                <Button
                  variant={
                    selectedFilter === "ready-for-production"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedFilter("ready-for-production")}
                  className="text-xs"
                >
                  Ready for Production
                </Button>
                <Button
                  variant={
                    selectedFilter === "in-production" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedFilter("in-production")}
                  className="text-xs"
                >
                  In Production
                </Button>
              </div>
            </div>
          )}

          {/* Production Plans List - Card Based */}
          {selectedView === "list" ? (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                {isMobile ? (
                  // Mobile Card View
                  <div className="space-y-4 p-4">
                    {getPaginatedPlans().map((plan) => (
                      <div
                        key={plan.id}
                        onClick={async () => {
                          try {
                            const full = await loadFullPlanDetails(plan);
                            setSelectedPlanForDetails(full || plan);
                            setIsPlanDetailsDialogOpen(true);
                          } catch (err) {
                            console.error("Failed to load plan details:", err);
                            toast.error("Failed to load plan details");
                          }
                        }}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {plan.profileImage ? (
                              <img
                                src={`${import.meta.env.VITE_BACKEND_URL}/${
                                  plan.profileImage
                                }`}
                                alt="Product"
                                className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {plan.projectCode}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {plan.productName}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={`${getPriorityColor(
                              plan.priority
                            )} text-xs px-2 py-1`}
                          >
                            {plan.priority}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">PO:</span>
                            <span className="font-medium ml-1">
                              {plan.poNumber}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Color:</span>
                            <span className="font-medium ml-1">
                              {plan.color}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Desktop Table View
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Product Code
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Image & Profile
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Art & Colour
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          PO Number
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Priority
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getPaginatedPlans().map((plan) => (
                        <tr
                          key={plan.id}
                          className="hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={async () => {
                            try {
                              const full = await loadFullPlanDetails(plan);
                              setSelectedPlanForDetails(full || plan);
                              setIsPlanDetailsDialogOpen(true);
                            } catch (err) {
                              console.error(
                                "Failed to load plan details:",
                                err
                              );
                              toast.error("Failed to load plan details");
                            }
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono font-medium text-blue-600">
                              {plan.projectCode}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center ">
                              {plan.profileImage ? (
                                <img
                                  src={`${import.meta.env.VITE_BACKEND_URL}/${
                                    plan.profileImage
                                  }`}
                                  alt="Product"
                                  className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                  <ImageIcon className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {plan?.productName}
                              </span>
                              <span className="text-xs text-gray-500 mt-0.5">
                                {plan.color}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono font-medium text-green-600">
                              {plan.poNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              className={`${getPriorityColor(
                                plan.priority
                              )} text-xs px-2 py-1`}
                            >
                              {plan.priority}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {filteredPlans.length === 0 && (
                  <div className="text-center py-12">
                    <Factory className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No production plans found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      No production plans match your current search and filter
                      criteria.
                    </p>
                    <Button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedFilter("all");
                        setCurrentPage(1);
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {filteredPlans.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="text-sm text-gray-600 mb-4 md:mb-0">
                    Showing {getPaginatedPlans().length} of{" "}
                    {filteredPlans.length} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    {Array.from(
                      { length: getTotalPages() },
                      (_, i) => i + 1
                    ).map((page) => (
                      <Button
                        key={page}
                        size="sm"
                        variant={currentPage === page ? "default" : "outline"}
                        className={
                          currentPage === page
                            ? "bg-blue-500 hover:bg-blue-600"
                            : ""
                        }
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === getTotalPages()}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Calendar View */}
          {selectedView === "calendar" && (
            <div className="space-y-4">
              {/* Calendar Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-linear-to-r from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() - 1,
                          1
                        )
                      )
                    }
                    className="hover:bg-white/80 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                    {currentDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    Production Schedule
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() + 1,
                          1
                        )
                      )
                    }
                    className="hover:bg-white/80 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4">
                  {/* Month Total */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/50 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="text-xl md:text-2xl font-bold text-blue-900">
                        {(() => {
                          // Calculate month total by summing daily quantities (similar to week totals)
                          const year = currentDate.getFullYear();
                          const month = currentDate.getMonth();
                          const firstDay = new Date(year, month, 1);
                          const lastDay = new Date(year, month + 1, 0);
                          let monthTotal = 0;

                          for (let day = 1; day <= lastDay.getDate(); day++) {
                            const currentDay = new Date(year, month, day);
                            const dayProductions =
                              getProductionsForDateUniversal(currentDay);
                            monthTotal += dayProductions.reduce(
                              (total, plan) => total + (plan.quantity || 0),
                              0
                            );
                          }

                          return monthTotal.toLocaleString();
                        })()}
                      </div>
                      <div className="text-xs text-blue-800 font-medium">
                        Month Total
                      </div>
                    </div>
                  </div>

                  {/* Add Production Card Button */}
                  <Button
                    onClick={() => {
                      // Default to today's date instead of first day of month
                      const today = new Date().toISOString().split("T")[0];
                      setSelectedCalendarDate(today);
                      setIsAddCardDialogOpen(true);
                    }}
                    className="bg-linear-to-r from-[#0c9dcb] to-[#26b4e0] hover:from-[#0a8bb5] hover:to-[#1ea3c9] text-white shadow-lg hover:shadow-xl transition-all duration-200 h-10 px-6"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule New
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                    className="hover:bg-white/80 transition-colors"
                  >
                    Today
                  </Button>
                </div>
              </div>

              {/* Weekly Production Schedule - Responsive Grid Layout */}
              <div className="space-y-6">
                {getWeeksInMonth(currentDate).map((weekStart, weekIndex) => {
                  const weekDays = getWeekDays(weekStart);
                  const weekTotal = getWeekTotal(weekStart);

                  return (
                    <div
                      key={weekIndex}
                      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                    >
                      {/* Week Header */}
                      <div className="bg-linear-to-r from-violet-50 to-violet-100 p-4 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {weekIndex + 1}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-violet-900">
                                Week {weekIndex + 1}
                              </h3>
                              <p className="text-sm text-violet-600">
                                {weekStart.toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                })}{" "}
                                -{" "}
                                {getWeekDays(weekStart)[6].toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-violet-800">
                              {weekTotal.toLocaleString()}
                            </div>
                            <div className="text-sm text-violet-600">
                              Total Units
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Days Grid - Mobile: Stack vertically, Desktop: Grid */}
                      {isMobile ? (
                        <div className="divide-y divide-gray-200">
                          {weekDays.map((day, dayIndex) => {
                            const isCurrentMonth =
                              day.getMonth() === currentDate.getMonth();
                            const dayProductions =
                              getProductionsForDateUniversal(day);
                            const isToday =
                              day.toDateString() === new Date().toDateString();
                            const dayNames = [
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                              "Sunday",
                            ];
                            const dayAbbrevs = [
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat",
                              "Sun",
                            ];

                            if (!isCurrentMonth) return null;

                            return (
                              <div
                                key={dayIndex}
                                className={`p-4 ${
                                  isToday ? "bg-blue-50" : "bg-white"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">
                                      {String(day.getDate()).padStart(2, "0")}{" "}
                                      {dayAbbrevs[dayIndex]}
                                    </h4>
                                    {dayProductions.length > 0 && (
                                      <div className="mt-1 flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                          {dayProductions.length} product
                                          {dayProductions.length !== 1
                                            ? "s"
                                            : ""}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                          Total:{" "}
                                          {dayProductions.reduce(
                                            (sum, prod) =>
                                              sum + (prod.quantity || 0),
                                            0
                                          )}{" "}
                                          units
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {dayProductions.length > 0 ? (
                                  <div className="space-y-3">
                                    {dayProductions.map((production, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => {
                                          setSelectedProductionForView(
                                            production
                                          );
                                          setIsViewCardDialogOpen(true);
                                        }}
                                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
                                      >
                                        {/* Product Name and Quantity */}
                                        <div className="flex items-center justify-between mb-2">
                                          <h5 className="font-semibold text-gray-900 text-sm leading-tight truncate flex-1 mr-2">
                                            {production.productName}
                                          </h5>
                                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                                            {production.quantity.toLocaleString()}
                                          </span>
                                        </div>

                                        {/* Assigned Plant */}
                                        {production.assignedPlant && (
                                          <div className="flex items-center gap-1.5 mb-2">
                                            <Building className="w-3.5 h-3.5 text-emerald-600" />
                                            <span className="text-xs font-medium text-emerald-700">
                                              {production.assignedPlant}
                                            </span>
                                          </div>
                                        )}

                                        {/* Remarks */}
                                        {production.remarks && (
                                          <p className="text-xs text-gray-600 leading-relaxed">
                                            {production.remarks}
                                          </p>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 mt-3">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedProductionForDateChange(
                                                production
                                              );
                                              setNewProductionDate(
                                                production.startDate
                                              );
                                              setIsDateChangeDialogOpen(true);
                                            }}
                                            className="text-xs h-7"
                                          >
                                            <Calendar className="w-3 h-3 mr-1" />
                                            Change Date
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteCalendarEntry(
                                                production
                                              );
                                            }}
                                            className="text-xs h-7"
                                          >
                                            {isDeletingEntryId ===
                                            (production.id ??
                                              production._id ??
                                              production.raw?._id) ? (
                                              <svg
                                                className="animate-spin w-3 h-3 mr-1"
                                                viewBox="0 0 24 24"
                                              >
                                                <circle
                                                  cx="12"
                                                  cy="12"
                                                  r="10"
                                                  stroke="currentColor"
                                                  strokeWidth="4"
                                                  strokeDasharray="60"
                                                  strokeLinecap="round"
                                                  fill="none"
                                                ></circle>
                                              </svg>
                                            ) : (
                                              <Trash2 className="w-3 h-3 mr-1" />
                                            )}
                                            Delete
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-32 text-gray-400">
                                    <div className="text-center">
                                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                      <p className="text-sm">
                                        No production scheduled
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Desktop Calendar Grid */
                        <div className={calendarDayGridClass}>
                          {weekDays.map((day, dayIndex) => {
                            const isCurrentMonth =
                              day.getMonth() === currentDate.getMonth();
                            const dayProductions =
                              getProductionsForDateUniversal(day);
                            const isToday =
                              day.toDateString() === new Date().toDateString();
                            const dayAbbrevs = [
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat",
                              "Sun",
                            ];

                            // Get theme colors based on day
                            let headerBg = "bg-gray-50";
                            let headerText = "text-gray-700";
                            let cellBg = "bg-white";

                            if (
                              dayIndex === 0 ||
                              dayIndex === 2 ||
                              dayIndex === 4
                            ) {
                              // Mon, Wed, Fri
                              headerBg = "bg-emerald-50";
                              headerText = "text-emerald-700";
                              cellBg = "bg-emerald-25";
                            } else if (dayIndex === 1 || dayIndex === 3) {
                              // Tue, Thu
                              headerBg = "bg-sky-50";
                              headerText = "text-sky-700";
                              cellBg = "bg-sky-25";
                            } else if (dayIndex === 5) {
                              // Sat
                              headerBg = "bg-slate-50";
                              headerText = "text-slate-700";
                              cellBg = "bg-slate-25";
                            } else if (dayIndex === 6) {
                              // Sun
                              headerBg = "bg-orange-50";
                              headerText = "text-orange-700";
                              cellBg = "bg-orange-25";
                            }

                            if (!isCurrentMonth) {
                              headerBg = "bg-gray-50";
                              headerText = "text-gray-400";
                              cellBg = "bg-gray-50";
                            }

                            return (
                              <div
                                key={dayIndex}
                                className={`${calendarDayClass} border-r last:border-r-0 ${
                                  isToday
                                    ? "ring-2 ring-blue-500 ring-inset"
                                    : ""
                                }`}
                              >
                                {/* Day Header */}
                                <div
                                  className={`${headerBg} p-3 border-b border-gray-200`}
                                >
                                  <div className="text-center">
                                    <div
                                      className={`text-lg font-bold mb-2 ${headerText} ${
                                        isToday ? "text-blue-600" : ""
                                      }`}
                                    >
                                      {String(day.getDate()).padStart(2, "0")}{" "}
                                      {dayAbbrevs[dayIndex]}
                                    </div>
                                    {dayProductions.length > 0 && (
                                      <div className="space-y-1 flex flex-col items-center">
                                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                          {dayProductions.length} product
                                          {dayProductions.length !== 1
                                            ? "s"
                                            : ""}
                                        </div>
                                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                          Total:{" "}
                                          {dayProductions.reduce(
                                            (sum, prod) =>
                                              sum + (prod.quantity || 0),
                                            0
                                          )}{" "}
                                          units
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Day Content */}
                                <div className={`${cellBg} p-3 min-h-40`}>
                                  {isCurrentMonth ? (
                                    <div className="space-y-2">
                                      {dayProductions.map((production, idx) => (
                                        <div
                                          key={idx}
                                          onClick={() => {
                                            setSelectedProductionForView(
                                              production
                                            );
                                            setIsViewCardDialogOpen(true);
                                          }}
                                          className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer relative pb-8"
                                        >
                                          {/* Product Name and Quantity */}
                                          <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-gray-900 text-sm leading-tight truncate flex-1 mr-2">
                                              {production.productName}
                                            </h4>
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                                              {production.quantity.toLocaleString()}
                                            </span>
                                          </div>

                                          {/* Assigned Plant */}
                                          {production.assignedPlant && (
                                            <div className="flex items-center gap-1.5 mb-2">
                                              <Building className="w-3.5 h-3.5 text-emerald-600" />
                                              <span className="text-xs font-medium text-emerald-700">
                                                {production.assignedPlant}
                                              </span>
                                            </div>
                                          )}

                                          {/* Remarks */}
                                          {production.remarks && (
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                              {production.remarks}
                                            </p>
                                          )}

                                          {/* Calendar Button - Bottom Left */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedProductionForDateChange(
                                                production
                                              );
                                              setNewProductionDate(
                                                production.startDate
                                              );
                                              setIsDateChangeDialogOpen(true);
                                            }}
                                            className="absolute bottom-2 left-2 w-6 h-6 bg-blue-500 hover:bg-blue-600 
             rounded-md flex items-center justify-center shadow-sm 
             hover:shadow-md transition-all duration-200 group"
                                            title="Change production date"
                                          >
                                            <Calendar className="w-3.5 h-3.5 text-white" />
                                          </button>

                                          {/* Trash Button - Bottom Right */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteCalendarEntry(
                                                production
                                              );
                                            }}
                                            className="absolute bottom-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 
    rounded-md flex items-center justify-center shadow-sm 
    hover:shadow-md transition-all duration-200 group"
                                            title="Delete production"
                                          >
                                            {isDeletingEntryId ===
                                            (production.id ??
                                              production._id ??
                                              production.raw?._id) ? (
                                              <svg
                                                className="animate-spin w-3.5 h-3.5 text-white"
                                                viewBox="0 0 24 24"
                                              >
                                                <circle
                                                  cx="12"
                                                  cy="12"
                                                  r="10"
                                                  stroke="currentColor"
                                                  strokeWidth="4"
                                                  strokeDasharray="60"
                                                  strokeLinecap="round"
                                                  fill="none"
                                                ></circle>
                                              </svg>
                                            ) : (
                                              <Trash2 className="w-3.5 h-3.5 text-white" />
                                            )}
                                          </button>
                                        </div>
                                      ))}

                                      {dayProductions.length === 0 && (
                                        <div className="flex items-center justify-center h-32 text-gray-400">
                                          <div className="text-center">
                                            <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                            <p className="text-xs">
                                              No production scheduled
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center h-32">
                                      <span className="text-gray-400 text-sm">
                                        {day.getDate()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Production Management Dialog */}
      <Dialog
        open={isProductionDialogOpen}
        onOpenChange={setIsProductionDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-green-600" />
              Production Management - {selectedPlan?.planName}
            </DialogTitle>
            <DialogDescription>
              Manage production cards and track progress for this production
              plan.
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-6">
              {/* Project Details */}
              <div className="bg-linear-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">
                  Project Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Project Code</p>
                    <p className="font-medium text-blue-900">
                      {selectedPlan.projectCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Product Name</p>
                    <p className="font-medium text-blue-900">
                      {selectedPlan.productName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Brand</p>
                    <p className="font-medium text-blue-900">
                      {selectedPlan.brand}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Quantity</p>
                    <p className="font-medium text-blue-900">
                      {selectedPlan.quantity.toLocaleString()} units
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Priority</p>
                    <Badge
                      className={`${getPriorityColor(
                        selectedPlan.priority
                      )} text-xs`}
                    >
                      {selectedPlan.priority}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Status</p>
                    <Badge
                      className={`${getStatusColor(
                        selectedPlan.status
                      )} text-xs`}
                    >
                      {selectedPlan.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Start Date</p>
                    <p className="font-medium text-blue-900">
                      {formatDate(selectedPlan.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">End Date</p>
                    <p className="font-medium text-blue-900">
                      {formatDate(selectedPlan.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Assigned Plant</p>
                    <p className="font-medium text-blue-900">
                      {selectedPlan.assignedPlant}
                    </p>
                  </div>
                </div>
              </div>

              {/* Production Cards Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Production Cards
                  </h3>
                  <Button onClick={() => setIsCreateCardDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Create Production Card
                  </Button>
                </div>

                {productionCards.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-900 mb-2">
                      No Production Cards
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Create production cards to organize and track different
                      aspects of production.
                    </p>
                    <Button onClick={() => setIsCreateCardDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Create Your First Card
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productionCards.map((card) => (
                      <Card
                        key={card.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">
                              {card.cardName}
                            </h4>
                            <Badge
                              className={`${getPriorityColor(
                                card.priority
                              )} text-xs`}
                            >
                              {card.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {card.description}
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">
                                Assigned to:
                              </span>
                              <span className="font-medium">
                                {card.assignedTo}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Start Date:</span>
                              <span className="font-medium">
                                {formatDate(card.startDate)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">End Date:</span>
                              <span className="font-medium">
                                {formatDate(card.endDate)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Status:</span>
                              <Badge variant="outline" className="text-xs">
                                {card.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Production Card Dialog */}
      <CreateProductionCardDialog
        open={isCreateCardDialogOpen}
        onClose={() => setIsCreateCardDialogOpen(false)}
        selectedProductionCard={selectedPlan}
      />

      {/* Add Production Card Dialog (from calendar) */}
      <AddProductionCardDialog
        open={isAddCardDialogOpen}
        onOpenChange={(open) => {
          setIsAddCardDialogOpen(open);
          // When dialog closes, refresh calendar if we were adding
          if (!open) {
            // Small delay to ensure backend processed the request
            setTimeout(() => {
              if (selectedView === "calendar") {
                fetchCalendarEntries();
              }
            }, 300);
          }
        }}
        selectedDate={selectedCalendarDate}
        onSave={(newCard) => {
          console.log("New calendar card created:", newCard);
          // Immediately refresh the calendar view
          if (selectedView === "calendar") {
            fetchCalendarEntries();
          }
        }}
      />

      {/* View Production Card Dialog */}
      <ViewProductionCardDialog
        open={isViewCardDialogOpen}
        onOpenChange={setIsViewCardDialogOpen}
        productionData={selectedProductionForView}
        onSave={handleUpdateProductionCard}
      />

      {/* Production Plan Details Dialog */}
      <ProductionPlanDetailsDialog
        open={isPlanDetailsDialogOpen}
        onOpenChange={setIsPlanDetailsDialogOpen}
        plan={selectedPlanForDetails}
        onStartProduction={handleStartProduction}
      />

      <Dialog
        open={isDateChangeDialogOpen}
        onOpenChange={setIsDateChangeDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Change Production Date
            </DialogTitle>
            <DialogDescription>
              Select a new date for this production schedule
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedProductionForDateChange && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {selectedProductionForDateChange.productName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Current:{" "}
                      {new Date(
                        selectedProductionForDateChange.startDate
                      ).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label>Select New Production Date *</Label>
              <div className="flex items-center justify-center border rounded-lg p-4 bg-linear-to-br from-blue-50 to-indigo-50">
                <CalendarUI
                  mode="single"
                  selected={
                    newProductionDate ? new Date(newProductionDate) : undefined
                  }
                  onSelect={(date: Date | undefined) => {
                    if (date) {
                      // FIX: Use local date, not UTC
                      const y = date.getFullYear();
                      const m = String(date.getMonth() + 1).padStart(2, "0");
                      const d = String(date.getDate()).padStart(2, "0");
                      setNewProductionDate(`${y}-${m}-${d}`);
                    }
                  }}
                  className="rounded-md border-0"
                  disabled={(date: Date | undefined) => {
                    if (!date) return false;
                    // Compare dates without time component
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selectedDate = new Date(date);
                    selectedDate.setHours(0, 0, 0, 0);
                    return selectedDate < today;
                  }}
                />
              </div>
              <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5"></div>
                <p className="text-xs text-blue-700 leading-relaxed">
                  The production card will automatically move to the selected
                  date in the calendar view
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDateChangeDialogOpen(false);
                setSelectedProductionForDateChange(null);
                setNewProductionDate("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProductionDateChange}
              disabled={!newProductionDate || isSavingCalendarChange}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSavingCalendarChange ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Update Date
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProductionPlanning;
