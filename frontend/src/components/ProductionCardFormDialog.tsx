import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Calendar,
  Target,
  Package,
  AlertCircle,
  Plus,
  CheckCircle,
  Factory,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  Send,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { useERPStore, RDProject } from "../lib/data-store";
import api from "../lib/api";
import { Card, CardContent } from "./ui/card";
import { generateProductionCardPDF } from "./CardPdfGenerator";

// Media query hook
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);
  return matches;
};

interface PlantType {
  _id: string;
  name: string;
  isActive: boolean;
}

interface ProductionCardData {
  id: string;
  cardName: string;
  productionType: string;
  priority: string;
  targetQuantity: string;
  cardQuantity: string;
  startDate: string;
  endDate: string;
  supervisor: string;
  workShift: string;
  description: string;
  specialInstructions: string;
  status: string;
  createdAt: string;
  _id?: string;
  materialRequests?: any[];
  assignedPlant?: any;
  cardNumber?: string;
  createdBy?: string;
  materialRequestStatus?: string;
}

interface ProductionCardFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (cardData: ProductionCardData) => void;
  selectedProject?: RDProject | null;
  editingCard?: ProductionCardData | null;
  productionCardCreated?: any;
  onCardCreated?: () => void;
}

export function ProductionCardFormDialog({
  open,
  onClose,
  onSave,
  selectedProject,
  editingCard,
  onCardCreated,
  productionCardCreated,
}: ProductionCardFormDialogProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1024px)");
  const [productionCards, setProductionCards] = useState<any[]>([]);
  const { productionCards: storeProductionCards } = useERPStore();

  const getProjectIdFromSelected = () => {
    return (
      (selectedProject as any)?.project?._id ||
      (selectedProject as any)?.id ||
      (selectedProject as any)?._id ||
      (selectedProject as any)?.projectId ||
      null
    );
  };

  const getAllocationSummary = () => {
    const projectIdRaw = getProjectIdFromSelected();

    if (!projectIdRaw)
      return {
        orderQty: 0,
        allocated: 0,
        remaining: 0,
        allocatedWithoutCurrent: 0,
        currentCardQuantity: 0,
        availableForEditing: 0,
      };

    const toNumber = (val: any) => {
      const num = parseFloat(val ?? 0);
      return Number.isFinite(num) ? num : 0;
    };

    const normalizeId = (val: any) => {
      if (!val) return null;
      if (typeof val === "object") {
        return val._id || val.id || val.projectId || null;
      }
      return val;
    };

    const projectId = normalizeId(projectIdRaw);
    const projectIdStr = projectId ? String(projectId) : null;

    const productionCardsArray = Array.isArray(productionCards)
      ? productionCards
      : [];

    const allCardsForProject = productionCardsArray.filter((c: any) => {
      if (!c) return false;

      const pidRaw =
        c.projectId || c.project || c.rdProjectId || c.rdProject || null;
      const pid = normalizeId(pidRaw);

      if (!pid || !projectIdStr) return false;
      return String(pid) === projectIdStr;
    });

    const orderQty =
      toNumber((selectedProject as any)?.po?.orderQuantity) ||
      toNumber((selectedProject as any)?.poTarget) ||
      0;

    const totalAllocated = allCardsForProject.reduce((sum: number, c: any) => {
      if (!c) return sum;
      const v = toNumber(c.cardQuantity ?? c.targetQuantity ?? c.quantity ?? 0);
      return sum + v;
    }, 0);

    const currentCardId = editingCard?._id || editingCard?.id;

    const allocatedWithoutCurrent = allCardsForProject.reduce(
      (sum: number, c: any) => {
        if (!c) return sum;
        const cardId = c._id || c.id;
        if (editingCard && cardId === currentCardId) {
          return sum;
        }
        const v = toNumber(
          c.cardQuantity ?? c.targetQuantity ?? c.quantity ?? 0
        );
        return sum + v;
      },
      0
    );

    const currentCardQuantity = editingCard
      ? toNumber(
          editingCard.cardQuantity ??
            editingCard.targetQuantity ??
            editingCard.quantity ??
            0
        )
      : 0;

    const availableForEditing = Math.max(0, orderQty - allocatedWithoutCurrent);
    const remaining = Math.max(0, orderQty - totalAllocated);

    return {
      orderQty,
      allocated: totalAllocated,
      remaining,
      allocatedWithoutCurrent,
      currentCardQuantity,
      availableForEditing,
    };
  };

  const {
    orderQty,
    allocated,
    remaining,
    allocatedWithoutCurrent,
    currentCardQuantity,
    availableForEditing,
  } = getAllocationSummary();

  const getMaxAllocation = () => {
    if (editingCard) {
      return availableForEditing;
    } else {
      return remaining;
    }
  };

  const maxAllocation = getMaxAllocation();

  const [costData, setCostData] = useState({
    upper: [] as any[],
    component: [] as any[],
    material: [] as any[],
    packaging: [] as any[],
    miscellaneous: [] as any[],
    labour: [] as any[],
  });

  const loadTentativeCost = async () => {
    try {
      const projectId = getProjectIdFromSelected();
      if (!projectId) return;

      const sections = [
        "upper",
        "component",
        "material",
        "packaging",
        "miscellaneous",
      ];
      const results = await Promise.all(
        sections.map((sec) => api.get(`/projects/${projectId}/costs/${sec}`))
      );

      console.log("Cost data loaded:", results); // Debug log

      setCostData({
        upper: results[0]?.data?.rows || [],
        component: results[1]?.data?.rows || [],
        material: results[2]?.data?.rows || [],
        packaging: results[3]?.data?.rows || [],
        miscellaneous: results[4]?.data?.rows || [],
        labour: [],
      });
    } catch (err) {
      console.error("Failed to load tentative cost:", err);
    }
  };

  useEffect(() => {
    if (open && (selectedProject as any)) {
      loadTentativeCost();
    }
  }, [open, selectedProject]);

  const [formData, setFormData] = useState({
    cardName: "",
    productionType: "",
    priority: "",
    targetQuantity: "",
    startDate: "",
    endDate: "",
    supervisor: "",
    workShift: "",
    description: "",
    specialInstructions: "",
    cardQuantity: "",
    assignPlant: "",
  });

  const [requestStatus, setRequestStatus] = useState<
    | "Pending Availability Check"
    | "Pending to Store"
    | "Issued"
    | "Partially Issued"
    | "Not Requested"
  >("Not Requested");

  const [createdCardId, setCreatedCardId] = useState<string>("");
  const [materialData, setMaterialData] = useState<{
    [key: string]: { available: number; issued: number };
  }>({});

  const [plants, setPlants] = useState<PlantType[]>([]);
  const [plantOpen, setPlantOpen] = useState(false);
  const [addingNewPlant, setAddingNewPlant] = useState(false);
  const [newPlantName, setNewPlantName] = useState("");
  const [loadingPlants, setLoadingPlants] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [existingMrId, setExistingMrId] = useState<string | null>(null);
  const sections = ["allocation", "materials", "timeline", "details"];

  const handleSectionChange = (direction: "prev" | "next") => {
    if (direction === "prev" && currentSection > 0) {
      setCurrentSection(currentSection - 1);
    } else if (direction === "next" && currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  useEffect(() => {
    if (!open) return;

    const loadPlants = async () => {
      try {
        setLoadingPlants(true);
        const res = await api.get("/assign-plant");
        const plantsData: PlantType[] = res.data?.items || res.data?.data || [];
        setPlants(plantsData);
      } catch (e: any) {
        console.error("Failed loading plants:", e);
        toast.error(e?.response?.data?.message || "Failed to load plants");
      } finally {
        setLoadingPlants(false);
      }
    };

    loadPlants();
  }, [open]);

  const fetchProduction = async () => {
    try {
      const projectId = getProjectIdFromSelected();
      if (!projectId) {
        setProductionCards([]);
        return;
      }

      const res = await api.get(`/projects/${projectId}/production-cards`);
      const items =
        res?.data?.data?.items ?? res?.data?.items ?? res?.data?.data ?? [];
      const normalized = Array.isArray(items)
        ? items
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setProductionCards(normalized);
    } catch (error) {
      console.error("Failed to fetch production cards:", error);
      setProductionCards([]);
    }
  };

  useEffect(() => {
    if (open && selectedProject) {
      fetchProduction();
    }
  }, [open, selectedProject]);

  const handleCreateNewPlant = async () => {
    if (!newPlantName.trim()) return toast.error("Please enter a plant name");

    try {
      const res = await api.post("/assign-plant", {
        name: newPlantName.trim(),
      });
      const createdPlantResponse = res.data?.data || res.data;
      setPlants((prev) => [createdPlantResponse, ...prev]);
      setFormData((prev) => ({
        ...prev,
        assignPlant: createdPlantResponse._id,
      }));
      toast.success(`Plant "${createdPlantResponse.name}" created`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create plant");
    } finally {
      setNewPlantName("");
      setAddingNewPlant(false);
      setPlantOpen(false);
    }
  };

  useEffect(() => {
    if (open && editingCard) {
      const firstMrId =
        editingCard.materialRequests?.[0]?._id ||
        editingCard.materialRequests?.[0] ||
        null;
      setExistingMrId(firstMrId);

      setFormData({
        cardName: editingCard.cardNumber || "",
        productionType: "Production Card",
        priority: "Medium",
        targetQuantity: String(editingCard.cardQuantity || ""),
        startDate: editingCard.startDate?.slice(0, 10) || "",
        endDate: "",
        supervisor: editingCard.createdBy || "",
        workShift: editingCard.workShift || "",
        description: editingCard.description || "",
        specialInstructions: editingCard.specialInstructions || "",
        cardQuantity: String(editingCard.cardQuantity || ""),
        assignPlant:
          typeof editingCard.assignedPlant === "string"
            ? editingCard.assignedPlant
            : editingCard.assignedPlant?._id || "",
      });

      setRequestStatus(
        (editingCard.materialRequestStatus as any) || "Not Requested"
      );
    }

    if (open && !editingCard) {
      setExistingMrId(null);
      setFormData({
        cardName: "",
        productionType: "",
        priority: "",
        targetQuantity: "",
        startDate: "",
        endDate: "",
        supervisor: "",
        workShift: "",
        description: "",
        specialInstructions: "",
        cardQuantity: "",
        assignPlant: "",
      });

      setRequestStatus("Not Requested");
      setCreatedCardId("");
      setMaterialData({});
    }
  }, [open, editingCard]);

  const handleMaterialDataChange = (
    itemName: string,
    field: "available" | "issued",
    value: number
  ) => {
    setMaterialData((prev) => ({
      ...prev,
      [itemName]: {
        ...prev[itemName],
        [field]: value,
      },
    }));
  };

  const getProductName = () => {
    if (!selectedProject) return "No Product Selected";
    return `${selectedProject.brandId || ""} ${
      selectedProject.categoryId || ""
    } - ${selectedProject.typeId || ""} ${
      (selectedProject as any)?.colorId || (selectedProject as any)?.color || ""
    }`;
  };

  const generateProductionCardNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const randomNum = String(Math.floor(Math.random() * 9000) + 1000);
    return `PC-${year}-${month}-${randomNum}`;
  };

  const extractConsumptionValue = (row: any): number => {
    const value =
      row.consumption ??
      row.consumptionPerUnit ??
      row.consumptionRate ??
      row.rate ??
      row.quantity ??
      row.qty;

    if (typeof value === "number" && !isNaN(value)) return value;

    if (typeof value === "string") {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }

    return 0;
  };

  // Helper function to create material line with department and itemId
  const createMaterialLine = (
    row: any,
    actualReq: number,
    itemName: string
  ) => {
    // Extract department from row data (check multiple possible field names)
    const department = row.department || row.dept || row.departmentName || null;

    // Extract itemId - use _id as primary, fall back to id
    const itemId = row._id || row.id;

    return {
      itemId: itemId, // Always include itemId
      name: row.item || row.name || row.description || "",
      specification: row.description || row.spec || "",
      requirement: actualReq,
      unit: row.unit || "unit",
      available: materialData[itemName]?.available || 0,
      issued: 0,
      balance: Math.max(
        0,
        actualReq - (materialData[itemName]?.available || 0)
      ),
      department: department, // Include department field
    };
  };

  const loadMaterialRequestForEdit = async (mrId: string) => {
    try {
      const res = await api.get(`/material-requests/${mrId}`);

      if (!res.data?.success || !res.data.data) return;

      const mr = res.data.data;

      const issuedMap: any = {};

      // Process all 5 categories
      [
        ...(mr.upper || []),
        ...(mr.materials || []),
        ...(mr.components || []),
        ...(mr.packaging || []),
        ...(mr.misc || []),
      ].forEach((item: any) => {
        issuedMap[item.name] = {
          available: Number(item.available || 0),
          issued: Number(item.issued || 0),
        };
      });

      setMaterialData(issuedMap);
      setRequestStatus(mr.status);
    } catch (err) {
      console.error("Failed to load material request for edit", err);
    }
  };

  useEffect(() => {
    const mrIdToUse = editingCard?.materialRequests?.[0]?._id;

    if (open && mrIdToUse) {
      setExistingMrId(mrIdToUse);
      loadMaterialRequestForEdit(mrIdToUse);
    }
  }, [open, editingCard]);

  const handleSendToStoreManager = async () => {
    if (!formData.cardQuantity || parseInt(formData.cardQuantity) === 0) {
      toast.error("Please enter production allocation quantity first");
      return;
    }

    let cardIdToUse = createdCardId || productionCardCreated?._id;

    if (!cardIdToUse && editingCard) {
      cardIdToUse = editingCard._id || editingCard.id;
    }

    if (!cardIdToUse) {
      toast.error("Please save the production card first");
      return;
    }

    const allocationQty = parseInt(formData.cardQuantity, 10);

    const projectId = getProjectIdFromSelected();

    if (!projectId) {
      toast.error("Project not found");
      return;
    }

    if (allocationQty > maxAllocation) {
      toast.error(`Cannot allocate more than ${maxAllocation} units`);
      return;
    }

    await api.put(`/projects/${projectId}/production-cards/${cardIdToUse}`, {
      cardQuantity: allocationQty,
    });

    // Prepare all 5 categories with proper data structure
    const upper: any[] = [];
    const materials: any[] = [];
    const components: any[] = [];
    const packaging: any[] = [];
    const misc: any[] = [];

    // Process upper - WITH department
    costData.upper?.forEach((row: any) => {
      const itemName = row.item;
      const consumptionNum = extractConsumptionValue(row);
      const actualReq = consumptionNum * allocationQty;

      upper.push(createMaterialLine(row, actualReq, itemName));
    });

    // Process materials
    costData.material?.forEach((row: any) => {
      const itemName = row.item;
      const consumptionNum = extractConsumptionValue(row);
      const actualReq = consumptionNum * allocationQty;

      materials.push(createMaterialLine(row, actualReq, itemName));
    });

    // Process components - WITH department
    costData.component?.forEach((row: any) => {
      const itemName = row.item;
      const consumptionNum = extractConsumptionValue(row);
      const actualReq = consumptionNum * allocationQty;

      components.push(createMaterialLine(row, actualReq, itemName));
    });

    // Process packaging
    costData.packaging?.forEach((row: any) => {
      const itemName = row.item;
      const consumptionNum = extractConsumptionValue(row);
      const actualReq = consumptionNum * allocationQty;

      packaging.push(createMaterialLine(row, actualReq, itemName));
    });

    // Process miscellaneous
    costData.miscellaneous?.forEach((row: any) => {
      const itemName = row.item;
      const consumptionNum = extractConsumptionValue(row);
      const actualReq = consumptionNum * allocationQty;

      misc.push(createMaterialLine(row, actualReq, itemName));
    });

    // Debug log to see the data being sent
    console.log("Material Request Payload:", {
      upper: upper.map((item) => ({
        name: item.name,
        department: item.department,
        itemId: item.itemId,
      })),
      components: components.map((item) => ({
        name: item.name,
        department: item.department,
        itemId: item.itemId,
      })),
    });

    try {
      let response;

      if (existingMrId) {
        response = await api.put(`/material-requests/${existingMrId}`, {
          status: "Pending to Store",
          upper,
          materials,
          components,
          packaging,
          misc,
          notes: "Material request updated from production card",
        });
      } else {
        response = await api.post(
          `/production-cards/${cardIdToUse}/material-requests`,
          {
            status: "Pending to Store",
            upper,
            materials,
            components,
            packaging,
            misc,
            notes: "Material request created from production card",
          }
        );
        const createdMrId =
          response.data?.mr?._id ||
          response.data?.data?._id ||
          response.data?.materialRequest?._id ||
          null;
        if (createdMrId) setExistingMrId(createdMrId);
      }

      if (response.data.success) {
        setRequestStatus(
          response.data?.mr?.status ||
            response.data?.data?.status ||
            "Pending to Store"
        );
        toast.success("Material request sent to Store Manager successfully!");
        onCardCreated?.();
      }
    } catch (err: any) {
      console.error("Failed to send/update material request:", err);
      console.error("Error details:", err.response?.data);
      toast.error(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to send material request"
      );
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "cardQuantity") {
      const numVal = parseInt(value, 10);

      if (value === "") {
        setFormData((prev) => ({ ...prev, [field]: "" }));
        return;
      }

      if (isNaN(numVal) || numVal < 0) {
        toast.error("Please enter a valid positive number");
        setFormData((prev) => ({ ...prev, [field]: "" }));
        return;
      }

      if (numVal > maxAllocation) {
        toast.error(
          editingCard
            ? `Cannot allocate more than ${maxAllocation} units. Other cards already use ${allocatedWithoutCurrent} units.`
            : `Cannot allocate more than ${maxAllocation} units. Total order quantity is ${orderQty}.`
        );
        setFormData((prev) => ({
          ...prev,
          [field]: String(maxAllocation),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [field]: String(numVal),
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSave = async () => {
    if (
      !formData.cardQuantity ||
      !formData.startDate ||
      !formData.assignPlant
    ) {
      toast.error(
        "Please fill in all required fields (Allocation, Start Date, and Plant)"
      );
      return;
    }

    const allocationQty = parseFloat(formData.cardQuantity);

    if (allocationQty > maxAllocation) {
      toast.error(`Cannot allocate more than ${maxAllocation} units`);
      return;
    }

    if (!selectedProject) {
      toast.error("No project selected for production card");
      return;
    }

    let cardIdToUse = createdCardId;

    if (!cardIdToUse && productionCardCreated) {
      cardIdToUse = productionCardCreated?._id;
    }

    if (!cardIdToUse && !editingCard) {
      try {
        const projectId = getProjectIdFromSelected();
        const skeletonRes = await api.post(
          `/projects/${projectId}/production-cards/skeleton`
        );
        cardIdToUse = skeletonRes.data.productionCard?._id;
      } catch (err) {
        toast.error("Failed to create card base");
        return;
      }
    }

    const cardNumber =
      editingCard?.cardNumber || generateProductionCardNumber();
    const projectId = getProjectIdFromSelected();

    if (!projectId) {
      toast.error("Project id not found for selected project");
      return;
    }

    // Prepare all 5 categories with proper data structure
    const upper: any[] = [];
    const materials: any[] = [];
    const components: any[] = [];
    const packaging: any[] = [];
    const misc: any[] = [];

    // Process upper - WITH department
    costData.upper?.forEach((row: any) => {
      const itemName = row.item;
      const consumptionNum = extractConsumptionValue(row);
      const actualReq = consumptionNum * Number(formData.cardQuantity || 0);

      upper.push(createMaterialLine(row, actualReq, itemName));
    });

    // Process materials
    costData.material?.forEach((row: any) => {
      const itemName = row.item;
      const consumptionNum = extractConsumptionValue(row);
      const actualReq = consumptionNum * Number(formData.cardQuantity || 0);

      materials.push(createMaterialLine(row, actualReq, itemName));
    });

    // Process components - WITH department
    costData.component?.forEach((row: any) => {
      const itemName = row.item;
      const consumptionNum = extractConsumptionValue(row);
      const actualReq = consumptionNum * Number(formData.cardQuantity || 0);

      components.push(createMaterialLine(row, actualReq, itemName));
    });

    // Process packaging
    costData.packaging?.forEach((row: any) => {
      const itemName = row.item;
      const consumptionNum = extractConsumptionValue(row);
      const actualReq = consumptionNum * Number(formData.cardQuantity || 0);

      packaging.push(createMaterialLine(row, actualReq, itemName));
    });

    // Process miscellaneous
    costData.miscellaneous?.forEach((row: any) => {
      const itemName = row.item;
      const consumptionNum = extractConsumptionValue(row);
      const actualReq = consumptionNum * Number(formData.cardQuantity || 0);

      misc.push(createMaterialLine(row, actualReq, itemName));
    });

    // Debug log to see the data structure
    console.log("Card Save Payload Structure:", {
      upperSample: upper[0]
        ? {
            name: upper[0].name,
            department: upper[0].department,
            itemId: upper[0].itemId,
          }
        : null,
      componentsSample: components[0]
        ? {
            name: components[0].name,
            department: components[0].department,
            itemId: components[0].itemId,
          }
        : null,
      totalUpper: upper.length,
      totalComponents: components.length,
    });

    const payload = {
      cardNumber,
      projectId,
      productName: getProductName(),
      cardQuantity: Number(formData.cardQuantity),
      startDate: formData.startDate,
      assignedPlant: formData.assignPlant,
      description: formData.description,
      specialInstructions: formData.specialInstructions,
      status: "Draft",
      materialRequestStatus: requestStatus,
      upper,
      materials,
      components,
      packaging,
      misc,
    };

    console.log("Full Save Payload:", payload); // Debug

    try {
      let response;
      if (editingCard) {
        response = await api.put(
          `/projects/${projectId}/production-cards/${editingCard?._id}`,
          payload
        );
        toast.success("Production card updated");
      } else {
        response = await api.put(
          `/projects/${projectId}/production-cards/${cardIdToUse}`,
          payload
        );
        toast.success("Production card created successfully!");
      }

      console.log("Save Response:", response.data); // Debug

      const createdCard = response.data.data || response.data.productionCard;
      setCreatedCardId(createdCard?._id);

      const cardData: ProductionCardData = {
        id: createdCard?._id,
        cardName: createdCard?.cardNumber || cardNumber,
        productionType: "Production Card",
        priority: "Medium",
        targetQuantity: formData?.cardQuantity,
        cardQuantity: formData?.cardQuantity,
        startDate: formData?.startDate,
        endDate: "",
        supervisor: "",
        workShift: "",
        description: formData?.description,
        specialInstructions: formData?.specialInstructions,
        status: "Active",
        createdAt: new Date().toISOString(),
      };

      onSave(cardData);
      if (onCardCreated) onCardCreated();
      onClose();
    } catch (err: any) {
      console.error("Failed to save production card:", err);
      console.error("Error details:", err.response?.data);
      toast.error(
        err?.response?.data?.error || "Failed to save production card"
      );
    }
  };
  const handleDownloadPDF = async (card: ProductionCardData) => {
    try {
      // Get full card data including material information
      const fullCard = apiCards.find((c: any) => (c._id || c.id) === card.id);

      if (!fullCard) {
        toast.error("Could not find card data for PDF generation");
        return;
      }

      // Prepare material sections
      const materialSections = {
        upper: fullCard.upper || [],
        materials: fullCard.materials || [],
        components: fullCard.components || [],
        packaging: fullCard.packaging || [],
        misc: fullCard.misc || [],
      };

      // Get allocation summary for this specific card
      const projectCards = displayProductionCards.filter(
        (c) => c.projectId === card.projectId
      );

      const otherCardsAllocation = projectCards
        .filter((c) => c.id !== card.id)
        .reduce((sum, c) => sum + (parseFloat(c.cardQuantity) || 0), 0);

      const totalOrder = totalOrderQty;
      const available = Math.max(
        0,
        totalOrder -
          (otherCardsAllocation + (parseFloat(card.cardQuantity) || 0))
      );

      const pdfData = {
        cardNumber: card.cardName || fullCard.cardNumber || "N/A",
        productName: getProductName(),
        projectId: card.projectId || "N/A",
        cardQuantity: parseFloat(card.cardQuantity) || 0,
        startDate:
          card.startDate || fullCard.startDate || new Date().toISOString(),
        assignedPlant:
          card.assignPlant?.name ||
          fullCard.assignedPlant?.name ||
          "Not Assigned",
        description: card.description || fullCard.description || "",
        specialInstructions:
          card.specialInstructions || fullCard.specialInstructions || "",
        status: card.status || fullCard.status || "Active",
        createdBy: card.supervisor || fullCard.createdBy || "System",
        createdAt:
          card.createdAt || fullCard.createdAt || new Date().toISOString(),
        materialSections,
        allocationSummary: {
          totalOrder,
          alreadyAllocated: otherCardsAllocation,
          thisCardAllocated: parseFloat(card.cardQuantity) || 0,
          available,
        },
      };

      toast.promise(generateProductionCardPDF(pdfData), {
        loading: "Generating PDF...",
        success: "PDF downloaded successfully!",
        error: "Failed to generate PDF",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };
  const getDialogStyle = () => {
    if (isMobile) {
      return {
        width: "95vw",
        maxWidth: "95vw",
        maxHeight: "98vh",
      };
    } else if (isTablet) {
      return {
        width: "90vw",
        maxWidth: "90vw",
        maxHeight: "95vh",
      };
    } else {
      return {
        width: "96vw",
        maxWidth: "1400px",
        maxHeight: "95vh",
      };
    }
  };

  const materialSections = [
    { label: "UPPER MATERIAL", key: "upper", color: "bg-cyan-100" },
    { label: "MATERIAL USED", key: "material", color: "bg-cyan-200" },
    { label: "COMPONENTS USED", key: "component", color: "bg-purple-100" },
    { label: "PACKAGING USED", key: "packaging", color: "bg-yellow-100" },
    { label: "MISCELLANEOUS USED", key: "miscellaneous", color: "bg-rose-100" },
  ];

  // Display department in the mobile card
  const renderMobileSection = () => {
    if (!isMobile) return null;

    switch (currentSection) {
      case 0:
        return (
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Allocation
              </h3>
            </div>
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">
                      Allocation Quantity
                    </Label>
                    <Input
                      type="number"
                      value={formData.cardQuantity || ""}
                      onChange={(e) =>
                        handleInputChange("cardQuantity", e.target.value)
                      }
                      placeholder="0"
                      className="w-32 h-9 text-center border-2 border-gray-300"
                      min="1"
                      max={maxAllocation}
                    />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Order:</span>
                      <span className="font-semibold">{orderQty || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {editingCard
                          ? "Other Cards Allocated:"
                          : "Already Allocated:"}
                      </span>
                      <span className="font-semibold">
                        {editingCard ? allocatedWithoutCurrent : allocated}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {editingCard ? "This Card Currently:" : "Available:"}
                      </span>
                      <span className="font-semibold">
                        {editingCard ? currentCardQuantity : remaining}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-medium">Max Allocation:</span>
                      <span
                        className={`font-bold ${
                          maxAllocation === 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {maxAllocation}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">Materials</h3>
            </div>
            <div className="space-y-3">
              {materialSections.map((section) => (
                <div key={section.key}>
                  <div
                    className={`px-3 py-2 ${section.color} rounded-t-lg font-medium text-sm mb-2`}
                  >
                    {section.label}
                  </div>
                  {costData[section.key as keyof typeof costData]
                    ?.slice(0, 3)
                    .map((row: any) => {
                      const itemName = row.item;
                      const available = materialData[itemName]?.available || 0;
                      const consumptionNum = extractConsumptionValue(row);
                      const allocationQty = Number(formData.cardQuantity || 0);

                      const requirement =
                        formData.cardQuantity === ""
                          ? consumptionNum
                          : consumptionNum * allocationQty;

                      // Get department for display
                      const department =
                        row.department ||
                        row.dept ||
                        row.departmentName ||
                        null;

                      return (
                        <Card
                          key={row._id}
                          className="mb-3 rounded-xl border border-gray-200 shadow-sm"
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="flex flex-col gap-1">
                              <div className="font-semibold text-sm text-gray-900 truncate">
                                {row.item}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {row.description}
                              </div>
                              {department && (
                                <div className="text-xs text-blue-600 font-medium mt-1">
                                  Dept: {department}
                                </div>
                              )}
                            </div>

                            <div className="h-px bg-gray-200" />

                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg py-2">
                                <span className="text-gray-500">Required</span>
                                <span className="font-bold text-blue-700">
                                  {requirement.toFixed(2)}
                                </span>
                              </div>

                              <div className="flex flex-col items-center justify-center bg-green-50 rounded-lg py-2">
                                <span className="text-gray-500 mb-1">
                                  Available
                                </span>
                                <Input
                                  type="number"
                                  className="h-7 w-16 text-xs text-center"
                                  value={available === 0 ? "" : available}
                                  onChange={(e) =>
                                    handleMaterialDataChange(
                                      itemName,
                                      "available",
                                      e.target.value === ""
                                        ? 0
                                        : parseFloat(e.target.value)
                                    )
                                  }
                                />
                              </div>

                              <div className="flex flex-col items-center justify-center bg-purple-50 rounded-lg py-2">
                                <span className="text-gray-500">Issued</span>
                                <span className="font-bold text-purple-700">
                                  {materialData[itemName]?.issued || 0}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg text-xs font-medium">
                              <span className="text-gray-600">Balance</span>
                              <span
                                className={`${
                                  Math.max(
                                    0,
                                    requirement -
                                      available -
                                      (materialData[itemName]?.issued || 0)
                                  ) === 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {Math.max(
                                  0,
                                  requirement -
                                    available -
                                    (materialData[itemName]?.issued || 0)
                                ).toFixed(2)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              ))}
            </div>
            <div className="mt-4 bg-white rounded-lg border border-blue-200 p-3">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 text-sm">
                    Status:
                  </span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    {requestStatus}
                  </span>
                </div>

                <Button
                  onClick={handleSendToStoreManager}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm"
                >
                  <Send className="w-4 h-4" />
                  {requestStatus === "Not Requested"
                    ? "Send to Store Manager"
                    : "Request Sent"}
                </Button>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Timeline & Plant
              </h3>
            </div>
            <Card className="border border-gray-200">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Start Date *
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        handleInputChange("startDate", e.target.value)
                      }
                      className="h-10 pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Assign Plant *
                  </Label>
                  <Popover open={plantOpen} onOpenChange={setPlantOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={plantOpen}
                        className="w-full h-10 justify-between"
                      >
                        <span className="truncate">
                          {formData.assignPlant
                            ? plants.find((p) => p._id === formData.assignPlant)
                                ?.name
                            : loadingPlants
                            ? "Loading..."
                            : "Select plant"}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search plants..."
                          className="h-9"
                        />
                        <CommandEmpty>No plant found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {plants.map((plant) => (
                            <CommandItem
                              key={plant._id}
                              value={plant.name}
                              className="flex items-center justify-between"
                              onSelect={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  assignPlant: plant._id,
                                }));
                                setPlantOpen(false);
                              }}
                            >
                              <div className="flex items-center flex-1 min-w-0">
                                <Check
                                  className={`mr-2 h-4 w-4 shrink-0 ${
                                    formData.assignPlant === plant._id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                <span className="truncate">{plant.name}</span>
                              </div>
                              <button
                                type="button"
                                className="p-1 hover:bg-red-50 rounded shrink-0"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    await api.delete(
                                      `/assign-plants/${plant._id}`
                                    );
                                    setPlants((prev) =>
                                      prev.filter((p) => p._id !== plant._id)
                                    );
                                    if (formData.assignPlant === plant._id) {
                                      setFormData((prev) => ({
                                        ...prev,
                                        assignPlant: "",
                                      }));
                                    }
                                    toast.success("Plant removed");
                                  } catch (err: any) {
                                    toast.error(
                                      err?.response?.data?.message ||
                                        "Failed to remove plant"
                                    );
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500 opacity-60 hover:opacity-100" />
                              </button>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <div className="border-t p-2">
                          {!addingNewPlant ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full justify-start text-blue-600"
                              onClick={() => setAddingNewPlant(true)}
                            >
                              <Plus className="w-4 h-4 mr-2" /> Create New Plant
                            </Button>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                placeholder="Enter new plant name..."
                                value={newPlantName}
                                onChange={(e) =>
                                  setNewPlantName(e.target.value)
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleCreateNewPlant()
                                }
                                autoFocus
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleCreateNewPlant}
                                  className="flex-1 text-xs"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" /> Add
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAddingNewPlant(false);
                                    setNewPlantName("");
                                  }}
                                  className="flex-1 text-xs"
                                >
                                  <X className="w-3 h-3 mr-1" /> Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">Details</h3>
            </div>
            <Card className="border border-gray-200">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Describe the production process..."
                    rows={3}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Special Instructions
                  </Label>
                  <Textarea
                    value={formData.specialInstructions}
                    onChange={(e) =>
                      handleInputChange("specialInstructions", e.target.value)
                    }
                    placeholder="Any special instructions..."
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        className="overflow-hidden p-0 m-0 flex flex-col"
        style={getDialogStyle()}
      >
        <div className="sticky top-0 z-50 px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-linear-to-r from-blue-50 via-white to-blue-50 border-b-2 border-blue-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-1 truncate">
                  {editingCard
                    ? "Edit Production Card"
                    : "Create Production Card"}
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base text-gray-600">
                  {editingCard
                    ? "Update production workflow and requirements"
                    : "Define production workflow and requirements"}
                </DialogDescription>
              </div>
            </div>

            {!isMobile && (
              <div className="flex items-center gap-4 self-end sm:self-center">
                <Card className="border border-gray-200 shadow-sm min-w-[220px]">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">
                          Allocation Quantity
                        </Label>
                        <Input
                          type="number"
                          value={formData.cardQuantity || ""}
                          onChange={(e) =>
                            handleInputChange("cardQuantity", e.target.value)
                          }
                          placeholder="0"
                          className="w-20 h-8 text-center border border-gray-300"
                          min="1"
                          max={maxAllocation}
                        />
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Total Order:</span>
                          <span className="font-semibold">
                            {orderQty || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            {editingCard ? "Other Cards:" : "Allocated:"}
                          </span>
                          <span className="font-semibold">
                            {editingCard ? allocatedWithoutCurrent : allocated}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            {editingCard ? "This Card:" : "Available:"}
                          </span>
                          <span
                            className={`font-semibold ${
                              (editingCard
                                ? currentCardQuantity
                                : remaining) === 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {editingCard ? currentCardQuantity : remaining}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-gray-200">
                          <span className="font-medium">Max Allocation:</span>
                          <span
                            className={`font-bold ${
                              maxAllocation === 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {maxAllocation}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>

          {isMobile && (
            <div className="mt-4">
              <Card className="border border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Allocation</div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={formData.cardQuantity || ""}
                          onChange={(e) =>
                            handleInputChange("cardQuantity", e.target.value)
                          }
                          placeholder="0"
                          className="w-20 h-8 text-center border border-gray-300"
                          min="1"
                          max={maxAllocation}
                        />
                        <span className="text-sm text-gray-600">
                          / {maxAllocation || "N/A"} max
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={onClose}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {isMobile && (
          <div className="sticky top-16 z-40 bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSectionChange("prev")}
                disabled={currentSection === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                {sections.map((section, index) => (
                  <div
                    key={section}
                    className={`w-2 h-2 rounded-full ${
                      index === currentSection ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSectionChange("next")}
                disabled={currentSection === sections.length - 1}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isMobile ? (
            renderMobileSection()
          ) : (
            <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8">
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Material Requirements & Allocation
                </h3>

                <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px]">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-200">
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-900 text-xs sm:text-sm">
                              ITEM
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-900 text-xs sm:text-sm">
                              SPECIFICATION
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-900 text-xs sm:text-sm">
                              DEPARTMENT
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-center font-semibold text-gray-900 text-xs sm:text-sm">
                              REQUIREMENT
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-center font-semibold text-gray-900 text-xs sm:text-sm">
                              AVAILABLE
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-center font-semibold text-gray-900 text-xs sm:text-sm">
                              ISSUED
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-center font-semibold text-gray-900 text-xs sm:text-sm">
                              BALANCE
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {materialSections.map((section) => (
                            <React.Fragment key={section.key}>
                              <tr className={section.color}>
                                <td
                                  colSpan={7}
                                  className="px-3 sm:px-4 py-2 font-semibold text-xs sm:text-sm"
                                >
                                  {section.label}
                                </td>
                              </tr>
                              {costData[
                                section.key as keyof typeof costData
                              ]?.map((row: any) => {
                                const itemName = row.item;
                                const available =
                                  materialData[itemName]?.available || 0;
                                const issued =
                                  materialData[itemName]?.issued || 0;
                                const consumptionNum =
                                  extractConsumptionValue(row);
                                const allocationQty = Number(
                                  formData.cardQuantity || 0
                                );

                                const requirement =
                                  formData.cardQuantity === ""
                                    ? consumptionNum
                                    : consumptionNum * allocationQty;

                                const balance =
                                  formData.cardQuantity === ""
                                    ? 0
                                    : Math.max(
                                        0,
                                        requirement - available - issued
                                      );

                                // Get department for display
                                const department =
                                  row.department ||
                                  row.dept ||
                                  row.departmentName ||
                                  null;

                                return (
                                  <tr
                                    key={row._id}
                                    className="border-b hover:bg-gray-50"
                                  >
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                                      {row.item}
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                                      {row.description}
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                                      <span className="text-blue-600 font-medium">
                                        {department || "-"}
                                      </span>
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium">
                                      {requirement.toFixed(2)}
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-center">
                                      <Input
                                        type="number"
                                        className="w-16 sm:w-20 h-7 sm:h-8 text-center text-xs"
                                        value={available === 0 ? "" : available}
                                        onChange={(e) =>
                                          handleMaterialDataChange(
                                            itemName,
                                            "available",
                                            e.target.value === ""
                                              ? 0
                                              : parseFloat(e.target.value)
                                          )
                                        }
                                      />
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm">
                                      {issued}
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm">
                                      {balance.toFixed(2)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6 bg-white rounded-lg border border-blue-200 p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 text-sm sm:text-base">
                            Status:
                          </span>
                          <span className="px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs sm:text-sm font-medium">
                            {requestStatus}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <Button
                          onClick={handleSendToStoreManager}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 text-xs sm:text-sm"
                        >
                          <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                          {requestStatus === "Not Requested"
                            ? "Send to Store Manager"
                            : "Request Sent"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Timeline & Resources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Start Date
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          handleInputChange("startDate", e.target.value)
                        }
                        className="h-10 sm:h-11 pl-10 sm:pl-12 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Assign Plant *
                    </Label>
                    <Popover open={plantOpen} onOpenChange={setPlantOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={plantOpen}
                          className="w-full h-10 md:h-12 justify-between"
                        >
                          <span className="truncate">
                            {formData.assignPlant
                              ? plants.find(
                                  (p) => p._id === formData.assignPlant
                                )?.name
                              : loadingPlants
                              ? "Loading..."
                              : "Select plant"}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search plants..."
                            className="h-9"
                          />
                          <CommandEmpty>No plant found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {plants.map((plant) => (
                              <CommandItem
                                key={plant._id}
                                value={plant.name}
                                className="flex items-center justify-between"
                                onSelect={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    assignPlant: plant._id,
                                  }));
                                  setPlantOpen(false);
                                }}
                              >
                                <div className="flex items-center flex-1 min-w-0">
                                  <Check
                                    className={`mr-2 h-4 w-4 shrink-0 ${
                                      formData.assignPlant === plant._id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                  <span className="truncate">{plant.name}</span>
                                </div>
                                <button
                                  type="button"
                                  className="p-1 hover:bg-red-50 rounded shrink-0"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    try {
                                      await api.delete(
                                        `/assign-plants/${plant._id}`
                                      );
                                      setPlants((prev) =>
                                        prev.filter((p) => p._id !== plant._id)
                                      );
                                      if (formData.assignPlant === plant._id) {
                                        setFormData((prev) => ({
                                          ...prev,
                                          assignPlant: "",
                                        }));
                                      }
                                      toast.success("Plant removed");
                                    } catch (err: any) {
                                      toast.error(
                                        err?.response?.data?.message ||
                                          "Failed to remove plant"
                                      );
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500 opacity-60 hover:opacity-100" />
                                </button>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <div className="border-t p-2">
                            {!addingNewPlant ? (
                              <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start text-blue-600"
                                onClick={() => setAddingNewPlant(true)}
                              >
                                <Plus className="w-4 h-4 mr-2" /> Create New
                                Plant
                              </Button>
                            ) : (
                              <div className="space-y-2">
                                <Input
                                  placeholder="Enter new plant name..."
                                  value={newPlantName}
                                  onChange={(e) =>
                                    setNewPlantName(e.target.value)
                                  }
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && handleCreateNewPlant()
                                  }
                                  autoFocus
                                  className="text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleCreateNewPlant}
                                    className="flex-1 text-xs"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" /> Add
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setAddingNewPlant(false);
                                      setNewPlantName("");
                                    }}
                                    className="flex-1 text-xs"
                                  >
                                    <X className="w-3 h-3 mr-1" /> Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  Additional Details
                </h3>
                <div className="space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Description
                    </Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      placeholder="Describe the production process and requirements..."
                      rows={3}
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Special Instructions
                    </Label>
                    <Textarea
                      value={formData.specialInstructions}
                      onChange={(e) =>
                        handleInputChange("specialInstructions", e.target.value)
                      }
                      placeholder="Any special instructions or quality requirements..."
                      rows={3}
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 px-4 sm:px-6 md:px-8 py-4 bg-white/95 backdrop-blur-sm border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {isMobile && (
              <div className="flex items-center justify-between w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSectionChange("prev")}
                  disabled={currentSection === 0}
                  className="flex-1 mr-2"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSectionChange("next")}
                  disabled={currentSection === sections.length - 1}
                  className="flex-1 ml-2"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
            <div
              className={`${isMobile ? "mt-3 w-full" : "flex gap-3 ml-auto"}`}
            >
              <Button
                onClick={onClose}
                variant="outline"
                size={isMobile ? "sm" : "default"}
                className={isMobile ? "w-full" : ""}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                size={isMobile ? "sm" : "default"}
                className={`${
                  isMobile ? "w-full mt-2" : ""
                } bg-blue-500 hover:bg-blue-600 text-white`}
                disabled={
                  !formData.cardQuantity ||
                  !formData.startDate ||
                  !formData.assignPlant
                }
              >
                <Save className="w-4 h-4 mr-2" />
                {editingCard ? "Update Card" : "Save Card"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
