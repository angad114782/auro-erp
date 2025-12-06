import React, { useEffect, useState } from "react";
import {
  X,
  Save,
  Calendar,
  User,
  Target,
  Package,
  FileText,
  AlertCircle,
  Plus,
  CheckCircle,
  Factory,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
} from "lucide-react";
// Add these imports at the top
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Trash2 } from "lucide-react";

// Add this interface after other interfaces

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
import { useCostManagement } from "../hooks/useCostManagement";
import api from "../lib/api";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

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
}

interface ProductionCardFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (cardData: ProductionCardData) => void;
  selectedProject?: RDProject | null;
  editingCard?: ProductionCardData | null;
  onCardCreated?: () => void;
}

export function ProductionCardFormDialog({
  open,
  onClose,
  onSave,
  selectedProject,
  editingCard,
  onCardCreated,
}: ProductionCardFormDialogProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1024px)");

  const {
    brands,
    categories,
    types,
    colors,
    countries,
    addMaterialRequest,
    updateMaterialRequest,
    getMaterialRequestByCardId,
    addProductionCard,
    productionCards,
  } = useERPStore();

  // --- compute PO / allocated / remaining ---
  const getProjectIdFromSelected = () => {
    return (
      (selectedProject as any)?.project?._id ||
      (selectedProject as any)?.id ||
      (selectedProject as any)?._id ||
      (selectedProject as any)?.projectId ||
      null
    );
  };

  const orderQty =
    Number(
      (selectedProject as any)?.po?.orderQuantity ??
        (selectedProject as any)?.poTarget ??
        0
    ) || 0;

  const projIdForCalc = getProjectIdFromSelected();

  const allocatedUnits = (productionCards || [])
    .filter((c: any) => {
      const pid =
        c.projectId ||
        c.project ||
        c.rdProjectId ||
        c.rdProject ||
        (c.project && (c.project._id || c.project.id)) ||
        null;
      return pid && projIdForCalc && String(pid) === String(projIdForCalc);
    })
    .reduce((sum: number, c: any) => {
      const v = Number(c.cardQuantity ?? c.targetQuantity ?? c.quantity ?? 0);
      return sum + (isFinite(v) ? v : 0);
    }, 0);

  const remainingUnits = Math.max(0, orderQty - allocatedUnits);

  const [costData, setCostData] = useState({
    upper: [],
    component: [],
    material: [],
    packaging: [],
    miscellaneous: [],
    labour: [],
  });

  const [summary, setSummary] = useState({
    tentativeCost: 0,
  });

  // Load Tentative Cost API
  const loadTentativeCost = async () => {
    try {
      const projectId =
        (selectedProject as any)?.project?._id ||
        (selectedProject as any)?.id ||
        (selectedProject as any)?._id ||
        (selectedProject as any)?.projectId;

      if (!projectId) return;

      const sumRes = await api.get(`/projects/${projectId}/costs`);
      const s = sumRes.data.summary || {};

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

      const labourRes = await api.get(`/projects/${projectId}/costs/labour`);

      setCostData({
        upper: results[0]?.data?.rows || [],
        component: results[1]?.data?.rows || [],
        material: results[2]?.data?.rows || [],
        packaging: results[3]?.data?.rows || [],
        miscellaneous: results[4]?.data?.rows || [],
        labour: labourRes?.data?.items || [],
      });

      setSummary({
        tentativeCost: s.tentativeCost || 0,
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

  const [materialRequestId, setMaterialRequestId] = useState<string>("");
  const [requestStatus, setRequestStatus] = useState<
    | "Pending Availability Check"
    | "Pending to Store"
    | "Issued"
    | "Partially Issued"
  >("Pending Availability Check");
  const [materialData, setMaterialData] = useState<{
    [key: string]: { available: number; issued: number };
  }>({});
  // Add to the component state declarations
  const [plants, setPlants] = useState<PlantType[]>([]);
  const [plantOpen, setPlantOpen] = useState(false);
  const [addingNewPlant, setAddingNewPlant] = useState(false);
  const [newPlantName, setNewPlantName] = useState("");
  const [loadingPlants, setLoadingPlants] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const sections = ["allocation", "materials", "timeline", "details"];

  // Mobile section navigation
  const handleSectionChange = (direction: "prev" | "next") => {
    if (direction === "prev" && currentSection > 0) {
      setCurrentSection(currentSection - 1);
    } else if (direction === "next" && currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  // Add this useEffect after other useEffect hooks
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

  // Add this function after other handlers
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

  // Check for existing material request when dialog opens
  useEffect(() => {
    if (open && materialRequestId) {
      const existingRequest = getMaterialRequestByCardId(materialRequestId);
      if (existingRequest) {
        setRequestStatus(existingRequest.status as any);
        const materialDataMap: {
          [key: string]: { available: number; issued: number };
        } = {};
        existingRequest.materials.forEach((item) => {
          materialDataMap[item.name] = {
            available: item.available,
            issued: item.issued,
          };
        });
        existingRequest.components.forEach((item) => {
          materialDataMap[item.name] = {
            available: item.available,
            issued: item.issued,
          };
        });
        setMaterialData(materialDataMap);
      }
    }
  }, [open, materialRequestId]);

  // Prefill form when editing an existing card
  useEffect(() => {
    if (open && editingCard) {
      setFormData({
        cardName: editingCard.cardName,
        productionType: editingCard.productionType,
        priority: editingCard.priority,
        targetQuantity: editingCard.targetQuantity,
        startDate: editingCard.startDate,
        endDate: editingCard.endDate,
        supervisor: editingCard.supervisor,
        workShift: editingCard.workShift,
        description: editingCard.description,
        specialInstructions: editingCard.specialInstructions,
        cardQuantity: editingCard.cardQuantity,
        assignPlant: editingCard.assignedPlant || "",
      });
    } else if (open && !editingCard) {
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

  const saveNewPlant = () => {
    if (!newPlantName.trim()) {
      toast.error("Please enter plant name");
      return;
    }
    setFormData({ ...formData, assignPlant: newPlantName });
    setNewPlantName("");
    setAddPlantDialogOpen(false);
    toast.success("Plant added successfully");
  };

  const getProductName = () => {
    if (!selectedProject) return "No Product Selected";
    return `${selectedProject.brandId || ""} ${
      selectedProject.categoryId || ""
    } - ${selectedProject.typeId || ""} ${selectedProject.colorId || ""}`;
  };

  const generateProductionCardNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const randomNum = String(Math.floor(Math.random() * 9000) + 1000);
    return `PC-${year}-${month}-${randomNum}`;
  };

  const generateCardId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PC-${timestamp}-${random}`;
  };

  const materials = [];
  ["upper", "material"].forEach((section) => {
    costData[section]?.forEach((row: any) => {
      const itemName = row.item;
      materials.push({
        id: row._id,
        name: row.item,
        specification: row.description,
        requirement:
          parseFloat(String(row.consumption).match(/\d+\.?\d*/)?.[0] || 0) *
          Number(formData.cardQuantity || 0),
        unit: row.unit || "unit",
        available: materialData[itemName]?.available || 0,
        issued: materialData[itemName]?.issued || 0,
        balance:
          parseFloat(String(row.consumption).match(/\d+\.?\d*/)?.[0] || 0) *
            Number(formData.cardQuantity || 0) -
          ((materialData[itemName]?.available || 0) +
            (materialData[itemName]?.issued || 0)),
      });
    });
  });

  const components = [];
  ["component", "packaging", "miscellaneous"].forEach((section) => {
    costData[section]?.forEach((row: any) => {
      const itemName = row.item;
      components.push({
        id: row._id,
        name: row.item,
        specification: row.description,
        requirement:
          parseFloat(String(row.consumption).match(/\d+\.?\d*/)?.[0] || 0) *
          Number(formData.cardQuantity || 0),
        unit: row.unit || "unit",
        available: materialData[itemName]?.available || 0,
        issued: materialData[itemName]?.issued || 0,
        balance:
          parseFloat(String(row.consumption).match(/\d+\.?\d*/)?.[0] || 0) *
            Number(formData.cardQuantity || 0) -
          ((materialData[itemName]?.available || 0) +
            (materialData[itemName]?.issued || 0)),
      });
    });
  });

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

    if (!selectedProject) {
      toast.error("No project selected for production card");
      return;
    }

    const cardId = editingCard?.id || generateCardId();
    const cardNumber = generateProductionCardNumber();
    const projectId =
      (selectedProject as any)?.project?._id ||
      (selectedProject as any)?.id ||
      (selectedProject as any)?._id ||
      (selectedProject as any)?.projectId;

    if (!projectId) {
      toast.error("Project id not found for selected project");
      return;
    }

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
      materials,
      components,
    };

    let serverCreated: any = null;

    try {
      if (editingCard) {
        const res = await api.put(
          `/projects/${projectId}/production-cards/${editingCard.id}`,
          payload
        );
        toast.success("Production card updated");
        onSave(res.data.data);
        onClose();
        return;
      }

      const res = await api.post(
        `/projects/${projectId}/production-cards`,
        payload
      );
      serverCreated = res?.data?.data || res?.data;
    } catch (err: any) {
      console.error("Failed to save production card to server:", err);
      toast.error(
        "Server error while creating production card — saved locally."
      );
    }

    const createdProductionCard =
      serverCreated?.productionCard ||
      serverCreated?.productionCardDoc ||
      serverCreated;
    const createdMaterialRequest =
      serverCreated?.materialRequest ||
      serverCreated?.materialRequestDoc ||
      null;

    if (createdProductionCard) {
      addProductionCard({
        id: createdProductionCard._id || createdProductionCard.id || cardId,
        cardNumber: createdProductionCard.cardNumber || cardNumber,
        projectId: createdProductionCard.projectId || projectId,
        productName: createdProductionCard.productName || getProductName(),
        cardQuantity:
          createdProductionCard.cardQuantity ||
          parseInt(formData.cardQuantity, 10),
        startDate: createdProductionCard.startDate || formData.startDate,
        assignedPlant:
          createdProductionCard.assignedPlant || formData.assignPlant,
        description: createdProductionCard.description || formData.description,
        specialInstructions:
          createdProductionCard.specialInstructions ||
          formData.specialInstructions,
        status: createdProductionCard.status || "Draft",
        materialRequestStatus:
          createdProductionCard.materialRequestStatus || requestStatus,
        createdBy: createdProductionCard.createdBy || "Production Manager",
        createdDate:
          createdProductionCard.createdAt || new Date().toISOString(),
        updatedDate:
          createdProductionCard.updatedAt || new Date().toISOString(),
        materials: createdProductionCard.materials || payload.materials,
        components: createdProductionCard.components || payload.components,
      } as any);
    } else {
      addProductionCard({
        ...payload,
        id: cardId,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      } as any);
    }

    const cardData: ProductionCardData = {
      id: createdProductionCard?._id || createdProductionCard?.id || cardId,
      cardName: createdProductionCard?.cardNumber || cardNumber,
      productionType: "Production Card",
      priority: "Medium",
      targetQuantity: formData.cardQuantity,
      cardQuantity: formData.cardQuantity,
      startDate: formData.startDate,
      endDate: "",
      supervisor: "",
      workShift: "",
      description: formData.description,
      specialInstructions: formData.specialInstructions,
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    try {
      const allocationQty = parseInt(formData.cardQuantity, 10);
      if (allocationQty > 0) {
        const extractNumericValue = (value: any): number => {
          if (typeof value === "number") return value;
          if (typeof value === "string") {
            const match = value.match(/\d+\.?\d*/);
            return match ? parseFloat(match[0]) : 0;
          }
          return 0;
        };

        const materials: any[] = [];
        const components: any[] = [];

        ["upper", "material"].forEach((section) => {
          (costData[section as keyof typeof costData] as any[])?.forEach(
            (row: any) => {
              const itemName = row.item;
              const consumptionNum = extractNumericValue(row.consumption);
              const actualReq = consumptionNum * allocationQty;
              materials.push({
                id: row._id || `${section}-${itemName}`,
                name: itemName,
                specification: row.description,
                requirement: actualReq,
                unit: row.unit || "unit",
                available: materialData[itemName]?.available || 0,
                issued: 0,
                balance: 0,
              });
            }
          );
        });

        ["component", "packaging", "miscellaneous"].forEach((section) => {
          (costData[section as keyof typeof costData] as any[])?.forEach(
            (row: any) => {
              const itemName = row.item;
              const consumptionNum = extractNumericValue(row.consumption);
              const actualReq = consumptionNum * allocationQty;
              components.push({
                id: row._id || `${section}-${itemName}`,
                name: itemName,
                specification: row.description,
                requirement: actualReq,
                unit: row.unit || "unit",
                available: materialData[itemName]?.available || 0,
                issued: 0,
                balance: 0,
              });
            }
          );
        });

        const productionCardIdForRequest =
          createdProductionCard?._id ||
          createdProductionCard?.id ||
          cardId ||
          generateCardId();

        const materialRequestData = {
          productionCardId: productionCardIdForRequest,
          requestedBy: "Production Manager",
          status: "Pending to Store" as const,
          materials,
          components,
        };

        addMaterialRequest(materialRequestData);
        setMaterialRequestId(materialRequestData.productionCardId);
        setRequestStatus("Pending to Store");

        if (!createdMaterialRequest) {
          try {
            await api.post(`/projects/${projectId}/material-requests`, {
              productionCardId: productionCardIdForRequest,
              requestedBy: materialRequestData.requestedBy,
              status: materialRequestData.status,
              materials: materialRequestData.materials,
              components: materialRequestData.components,
            });
          } catch (err) {
            console.warn("Failed to POST material-request to server:", err);
          }
        }

        toast.success(
          "Production card and material request saved successfully!"
        );
      } else {
        toast.success(
          editingCard
            ? "Production card updated successfully!"
            : "Production card created successfully!"
        );
      }
    } catch (err) {
      console.error("Failed to create material request:", err);
      toast.success(
        editingCard
          ? "Production card updated successfully!"
          : "Production card created successfully!"
      );
    }

    onSave(cardData);
    if (onCardCreated) onCardCreated();

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
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Determine dialog width based on screen size
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

  // Mobile section navigation UI
  const renderMobileNavigation = () => {
    if (!isMobile) return null;

    return (
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
    );
  };

  // Render mobile section content
  const renderMobileSection = () => {
    if (!isMobile) return null;

    switch (currentSection) {
      case 0: // allocation
        return renderAllocationSection();
      case 1: // materials
        return renderMaterialsSection();
      case 2: // timeline
        return renderTimelineSection();
      case 3: // details
        return renderDetailsSection();
      default:
        return null;
    }
  };

  // Render allocation section for mobile
  const renderAllocationSection = () => (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Package className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">Allocation</h3>
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
                onChange={(e) => {
                  const val = e.target.value;
                  const maxQty =
                    (selectedProject as any)?.po?.orderQuantity ||
                    (selectedProject as any)?.poTarget ||
                    1200;
                  const numVal = parseInt(val, 10);

                  if (numVal > maxQty) {
                    toast.error(
                      `Allocation cannot exceed maximum quantity of ${maxQty}`
                    );
                    handleInputChange("cardQuantity", String(maxQty));
                  } else {
                    handleInputChange("cardQuantity", val);
                  }
                }}
                placeholder="0"
                className="w-32 h-9 text-center border-2 border-gray-300"
                min="1"
              />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Quantity:</span>
                <span className="font-semibold">{orderQty || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Already Allocated:</span>
                <span className="font-semibold">{allocatedUnits}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-medium">Remaining:</span>
                <span
                  className={`font-bold ${
                    remainingUnits === 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {orderQty ? remainingUnits : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render materials section for mobile
  const renderMaterialsSection = () => (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">Materials</h3>
      </div>

      <div className="space-y-3">
        {[
          { label: "UPPER MATERIAL", key: "upper", color: "bg-cyan-100" },
          { label: "MATERIAL USED", key: "material", color: "bg-cyan-200" },
          {
            label: "COMPONENTS USED",
            key: "component",
            color: "bg-purple-100",
          },
          { label: "PACKAGING USED", key: "packaging", color: "bg-yellow-100" },
          {
            label: "MISCELLANEOUS USED",
            key: "miscellaneous",
            color: "bg-rose-100",
          },
        ].map((section) => (
          <div key={section.key}>
            <div
              className={`px-3 py-2 ${section.color} rounded-t-lg font-medium text-sm mb-2`}
            >
              {section.label}
            </div>

            {costData[section.key]?.slice(0, 3).map((row: any) => {
              const itemName = row.item;
              const available = materialData[itemName]?.available || 0;
              const issued = materialData[itemName]?.issued || 0;

              return (
                <Card key={row._id} className="mb-2 border border-gray-200">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="font-medium text-sm truncate">
                        {row.item}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {row.description}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1">
                          <div className="text-gray-500">Requirement</div>
                          <div className="font-semibold">
                            {parseFloat(
                              String(row.consumption).match(/\d+\.?\d*/)?.[0] ||
                                "0"
                            ) * Number(formData.cardQuantity || 0)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-gray-500">Available</div>
                          <Input
                            type="number"
                            className="h-7 text-xs px-2"
                            value={available}
                            onChange={(e) =>
                              handleMaterialDataChange(
                                itemName,
                                "available",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {costData[section.key]?.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-blue-600"
                onClick={() => {
                  // Could implement expand/collapse here
                }}
              >
                + {costData[section.key]?.length - 3} more items
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Render timeline section for mobile
  const renderTimelineSection = () => (
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
                onChange={(e) => handleInputChange("startDate", e.target.value)}
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
                      ? plants.find((p) => p._id === formData.assignPlant)?.name
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
                              await api.delete(`/assign-plants/${plant._id}`);
                              setPlants((prev) =>
                                prev.filter((p) => p._id !== plant._id)
                              );
                              // Clear selection if deleting currently selected plant
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
                          onChange={(e) => setNewPlantName(e.target.value)}
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

  // Render details section for mobile
  const renderDetailsSection = () => (
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
              onChange={(e) => handleInputChange("description", e.target.value)}
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
        {/* Header */}
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
                {/* Quantity Allocation Display for Desktop */}
                <Card className="border border-gray-200 shadow-sm min-w-[200px]">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">
                          Allocation
                        </Label>
                        <Input
                          type="number"
                          value={formData.cardQuantity || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const maxQty =
                              (selectedProject as any)?.po?.orderQuantity ||
                              (selectedProject as any)?.poTarget ||
                              1200;
                            const numVal = parseInt(val, 10);

                            if (numVal > maxQty) {
                              toast.error(
                                `Allocation cannot exceed maximum quantity of ${maxQty}`
                              );
                              handleInputChange("cardQuantity", String(maxQty));
                            } else {
                              handleInputChange("cardQuantity", val);
                            }
                          }}
                          placeholder="0"
                          className="w-20 h-8 text-center border border-gray-300"
                          min="1"
                        />
                      </div>

                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Order Qty:</span>
                          <span className="font-semibold">
                            {orderQty || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Allocated:</span>
                          <span className="font-semibold">
                            {allocatedUnits}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-gray-200">
                          <span className="font-medium">Remaining:</span>
                          <span
                            className={`font-bold ${
                              remainingUnits === 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {orderQty ? remainingUnits : "N/A"}
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
                        />
                        <span className="text-sm text-gray-600">
                          / {orderQty || "N/A"}
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

        {/* Mobile Navigation */}
        {renderMobileNavigation()}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {isMobile ? (
            renderMobileSection()
          ) : (
            <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8">
              {/* Materials Section for Desktop */}
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
                          {[
                            {
                              label: "UPPER MATERIAL",
                              key: "upper",
                              color: "bg-cyan-100 text-cyan-800",
                            },
                            {
                              label: "MATERIAL USED",
                              key: "material",
                              color: "bg-cyan-200 text-cyan-900",
                            },
                            {
                              label: "COMPONENTS USED",
                              key: "component",
                              color: "bg-purple-100 text-purple-800",
                            },
                            {
                              label: "PACKAGING USED",
                              key: "packaging",
                              color: "bg-yellow-100 text-yellow-800",
                            },
                            {
                              label: "MISCELLANEOUS USED",
                              key: "miscellaneous",
                              color: "bg-rose-100 text-rose-800",
                            },
                          ].map((section) => (
                            <>
                              <tr className={section.color}>
                                <td
                                  colSpan={6}
                                  className="px-3 sm:px-4 py-2 font-semibold text-xs sm:text-sm"
                                >
                                  {section.label}
                                </td>
                              </tr>
                              {costData[section.key]?.map((row: any) => {
                                const itemName = row.item;
                                const available =
                                  materialData[itemName]?.available || 0;
                                const issued =
                                  materialData[itemName]?.issued || 0;

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
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium">
                                      {parseFloat(
                                        String(row.consumption).match(
                                          /\d+\.?\d*/
                                        )?.[0] || "0"
                                      ) * Number(formData.cardQuantity || 0)}
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-center">
                                      <Input
                                        type="number"
                                        className="w-16 sm:w-20 h-7 sm:h-8 text-center text-xs"
                                        value={available}
                                        onChange={(e) =>
                                          handleMaterialDataChange(
                                            itemName,
                                            "available",
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                      />
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm">
                                      {issued}
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm">
                                      {Math.max(
                                        0,
                                        parseFloat(
                                          String(row.consumption).match(
                                            /\d+\.?\d*/
                                          )?.[0] || "0"
                                        ) *
                                          Number(formData.cardQuantity || 0) -
                                          available -
                                          issued
                                      ).toFixed(2)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Section for Desktop */}
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
                                      // Clear selection if deleting currently selected plant
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

              {/* Details Section for Desktop */}
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

        {/* Footer */}
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
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSectionChange("next")}
                  disabled={currentSection === sections.length - 1}
                  className="flex-1 ml-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
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
