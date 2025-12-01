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
} from "lucide-react";
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
  onCardCreated?: () => void; // Callback to refresh parent after card creation
}

export function ProductionCardFormDialog({
  open,
  onClose,
  onSave,
  selectedProject,
  editingCard,
  onCardCreated,
}: ProductionCardFormDialogProps) {
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

  // Sum allocations from store production cards that belong to this project
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

  // Plants list and dialog state
  // const [plantsList, setPlantsList] = useState<string[]>([
  //   "Aura",
  //   "Prime",
  //   "Smith",
  //   "Plant A - Main Factory",
  //   "Plant B - North Unit",
  // ]);
  const [addPlantDialogOpen, setAddPlantDialogOpen] = useState(false);
  const [newPlantName, setNewPlantName] = useState("");

  // Check for existing material request when dialog opens
  React.useEffect(() => {
    if (open && materialRequestId) {
      const existingRequest = getMaterialRequestByCardId(materialRequestId);
      if (existingRequest) {
        setRequestStatus(existingRequest.status as any);
        // Load material data from existing request
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
  React.useEffect(() => {
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
      // Reset form for new card
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

  // Handler to save new plant
  const saveNewPlant = () => {
    if (!newPlantName.trim()) {
      toast.error("Please enter plant name");
      return;
    }

    // if (plantsList.includes(newPlantName)) {
    //   toast.error("Plant already exists");
    //   return;
    // }

    // setPlantsList([...plantsList, newPlantName]);
    setFormData({ ...formData, assignPlant: newPlantName });
    setNewPlantName("");
    setAddPlantDialogOpen(false);
    toast.success("Plant added successfully");
  };

  // Helper functions to get names from IDs
  const getBrandName = (brandId: string) => {
    const brand = brands.find((b) => b.id === brandId);
    return brand ? brand.brandName : "Unknown Brand";
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.categoryName : "Unknown Category";
  };

  const getTypeName = (typeId: string) => {
    const type = types.find((t) => t.id === typeId);
    return type ? type.typeName : "Unknown Type";
  };

  const getColorName = (colorId: string) => {
    const color = colors.find((c) => c.id === colorId);
    return color ? color.colorName : "Unknown Color";
  };

  const getCountryName = (countryId: string) => {
    const country = countries.find((c) => c.id === countryId);
    return country ? country.countryName : "Unknown Country";
  };

  // Generate product name from project data
  const getProductName = () => {
    if (!selectedProject) return "No Product Selected";

    const brand = getBrandName(selectedProject.brandId);
    const category = getCategoryName(selectedProject.categoryId);
    const type = getTypeName(selectedProject.typeId);
    const color = getColorName(selectedProject.colorId);

    return `${brand} ${category} - ${type} ${color}`;
  };

  // Generate production card number
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
  // MATERIALS (upper + material)
  const materials = [];
  ["upper", "material"].forEach((section) => {
    costData[section]?.forEach((row) => {
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

  // COMPONENTS (component + packaging + misc)
  const components = [];
  ["component", "packaging", "miscellaneous"].forEach((section) => {
    costData[section]?.forEach((row) => {
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

    // Resolve projectId (same logic you already use)
    const projectId =
      (selectedProject as any)?.project?._id ||
      (selectedProject as any)?.id ||
      (selectedProject as any)?._id ||
      (selectedProject as any)?.projectId;

    if (!projectId) {
      toast.error("Project id not found for selected project");
      return;
    }

    // Build payload for server (note: server expects route /projects/:projectId/production-cards)
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
      materials, // <-- FIXED
      components, // <-- FIXED
    };

    let serverCreated: any = null;

    try {
      // NOTE: your api baseURL already contains /api (see api.ts)
      if (editingCard) {
        // UPDATE existing card
        const res = await api.put(
          `/projects/${projectId}/production-cards/${editingCard.id}`,
          payload
        );

        toast.success("Production card updated");
        onSave(res.data.data);
        onClose();
        return;
      }

      // CREATE new card
      const res = await api.post(
        `/projects/${projectId}/production-cards`,
        payload
      );

      // server returns { success: true, data: { productionCard, materialRequest } }
      serverCreated = res?.data?.data || res?.data;
    } catch (err: any) {
      console.error(
        "Failed to save production card to server:",
        err?.response?.data || err.message || err
      );
      toast.error(
        "Server error while creating production card — saved locally."
      );
    }

    // If server returned nested objects, normalize
    const createdProductionCard =
      serverCreated?.productionCard ||
      serverCreated?.productionCardDoc ||
      serverCreated;
    const createdMaterialRequest =
      serverCreated?.materialRequest ||
      serverCreated?.materialRequestDoc ||
      null;

    // Update local store with created doc (or fallback)
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
      // fallback local add
      addProductionCard({
        ...payload,
        id: cardId,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      } as any);
    }

    // Prepare the cardData to pass to onSave (compat)
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

    // --- Auto-send material request when saving (same logic as old button) ---
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

        const materialSections = ["upper", "material"];
        materialSections.forEach((section) => {
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

        const componentSections = ["component", "packaging", "miscellaneous"];
        componentSections.forEach((section) => {
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

        // Add to local store
        addMaterialRequest(materialRequestData);
        setMaterialRequestId(materialRequestData.productionCardId);
        setRequestStatus("Pending to Store");

        // Optional: POST material request to server as well (recommended if you want persistent material requests)
        if (!createdMaterialRequest) {
          try {
            // POST to /projects/:projectId/material-requests
            // server expects projectId in route; include it here
            await api.post(`/projects/${projectId}/material-requests`, {
              productionCardId: productionCardIdForRequest,
              requestedBy: materialRequestData.requestedBy,
              status: materialRequestData.status,
              materials: materialRequestData.materials,
              components: materialRequestData.components,
            });
          } catch (err) {
            console.warn(
              "Failed to POST material-request to server (non-fatal):",
              err?.response?.data || err.message || err
            );
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

    // Call original onSave
    onSave(cardData);

    // Call parent refresh callback if present
    if (onCardCreated) {
      onCardCreated();
    }

    // Reset form
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

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="!max-w-6xl !w-[90vw] max-h-[95vh] overflow-hidden p-0 m-0 top-[2.5vh] translate-y-0 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-50 px-10 py-8 bg-linear-to-r from-blue-50 via-white to-blue-50 border-b-2 border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-semibold text-gray-900">
                  {editingCard
                    ? "Edit Production Card"
                    : "Create Production Card"}
                </DialogTitle>
                <DialogDescription className="text-lg text-gray-600 mt-2">
                  {editingCard
                    ? "Update production workflow and requirements"
                    : "Define production workflow and requirements"}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {/* Quantity Allocation Input */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 min-w-[200px]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-500" />
                    <Label
                      htmlFor="cardQuantity"
                      className="text-sm font-medium text-gray-700 whitespace-nowrap"
                    >
                      Allocation
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      id="cardQuantity"
                      type="number"
                      value={formData.cardQuantity || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const maxQty =
                          (selectedProject as any)?.po?.orderQuantity ||
                          (selectedProject as any)?.poTarget ||
                          1200;
                        const numVal = parseInt(val, 10);

                        // Prevent exceeding max quantity
                        if (numVal > maxQty) {
                          toast.error(
                            `Allocation cannot exceed maximum quantity of ${maxQty}`
                          );
                          handleInputChange("cardQuantity", String(maxQty));
                        } else {
                          handleInputChange("cardQuantity", val);
                        }
                      }}
                      placeholder=""
                      className="w-20 h-9 text-center border-2 border-gray-300 rounded-md bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-semibold text-gray-900 text-base hover:border-gray-400 transition-all duration-200"
                      min="1"
                    />
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-blue-600">
                        /{" "}
                        {(selectedProject as any)?.po?.orderQuantity ||
                          (selectedProject as any)?.poTarget ||
                          "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  <div>
                    Order (PO) quantity:{" "}
                    <span className="font-semibold text-gray-800">
                      {orderQty || "Not specified"}
                    </span>
                  </div>
                  <div>
                    Allocated to cards:{" "}
                    <span className="font-semibold text-gray-800">
                      {allocatedUnits}
                    </span>
                  </div>
                  <div className="mt-1">
                    Remaining units:{" "}
                    <span
                      className={`font-bold ${
                        remainingUnits === 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {orderQty ? remainingUnits : "Not specified"}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-12 w-12 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-gray-500" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-10 py-8 space-y-10">
            {/* Tentative Cost Breakdown */}
            <div className="space-y-8">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-4">
                <Target className="w-6 h-6 text-blue-500" />
                Material Requirements & Allocation
              </h3>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
                {/* Materials Requirements Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100 border-b-2 border-gray-200">
                          <th className="px-6 py-4 text-left font-semibold text-gray-900 border-r border-gray-300 min-w-[120px]">
                            ITEM
                          </th>
                          <th className="px-6 py-4 text-left font-semibold text-gray-900 border-r border-gray-300 min-w-[200px]">
                            SPECIFICATION
                          </th>
                          <th className="px-6 py-4 text-center font-semibold text-gray-900 border-r border-gray-300 min-w-[120px]">
                            REQUIREMENT
                          </th>
                          {/* <th className="px-6 py-4 text-center font-semibold text-gray-900 border-r border-gray-300 min-w-[120px]">
                            COST
                          </th> */}
                          <th className="px-6 py-4 text-center font-semibold text-gray-900 border-r border-gray-300 min-w-[120px]">
                            AVAILABLE
                          </th>
                          <th className="px-6 py-4 text-center font-semibold text-gray-900 border-r border-gray-300 min-w-[100px]">
                            ISSUED
                          </th>
                          <th className="px-6 py-4 text-center font-semibold text-gray-900 min-w-[100px]">
                            BALANCE
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* LOOP SECTIONS */}
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
                            {/* SECTION HEADER */}
                            <tr
                              className={`border-b border-gray-300 ${section.color}`}
                            >
                              <td
                                colSpan={7}
                                className="px-6 py-3 font-semibold"
                              >
                                {section.label}
                              </td>
                            </tr>

                            {/* SECTION ROWS */}
                            {costData[section.key]?.map((row: any) => {
                              const itemName = row.item;
                              const available =
                                materialData[itemName]?.available || 0;
                              const issued =
                                materialData[itemName]?.issued || 0;

                              // Extract numeric value from consumption (handles "test cons 1" → 1)
                              const extractNumericValue = (
                                value: any
                              ): number => {
                                if (typeof value === "number") return value;
                                if (typeof value === "string") {
                                  const match = value.match(/\d+\.?\d*/);
                                  return match ? parseFloat(match[0]) : 0;
                                }
                                return 0;
                              };

                              const consumptionNum = extractNumericValue(
                                row.consumption
                              );
                              const allocationQty =
                                parseInt(formData.cardQuantity, 10) || 0;
                              const actualRequirement =
                                allocationQty > 0 && consumptionNum > 0
                                  ? (consumptionNum * allocationQty).toFixed(2)
                                  : consumptionNum.toFixed(2);

                              return (
                                <tr
                                  key={row._id}
                                  className="border-b hover:bg-gray-50"
                                >
                                  <td className="px-6 py-4 border-r font-medium">
                                    {row.item}
                                  </td>

                                  {/* SPECIFICATION */}
                                  <td className="px-6 py-4 border-r">
                                    {row.description}
                                  </td>

                                  {/* REQUIREMENT - Multiplied by Allocation */}
                                  <td className="px-6 py-4 text-center border-r font-medium bg-blue-50">
                                    <div className="text-sm">
                                      <span className="text-gray-600">
                                        {consumptionNum}
                                      </span>
                                      <span className="mx-1 text-gray-400">
                                        ×
                                      </span>
                                      <span className="font-semibold text-blue-600">
                                        {allocationQty || 0}
                                      </span>
                                      <span className="mx-1 text-gray-400">
                                        =
                                      </span>
                                      <span className="font-bold text-blue-700">
                                        {actualRequirement}
                                      </span>
                                    </div>
                                  </td>

                                  {/* COST COLUMN (NEW) */}
                                  {/* <td className="px-6 py-4 text-center border-r font-semibold text-blue-600">
                                    {row.cost ?? "-"}
                                  </td> */}

                                  {/* AVAILABLE (Always editable) */}
                                  <td className="px-6 py-4 text-center border-r">
                                    <Input
                                      type="number"
                                      className="w-20 h-8 text-center border border-gray-300 rounded"
                                      value={available}
                                      onChange={(e) =>
                                        handleMaterialDataChange(
                                          itemName,
                                          "available",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      placeholder="0"
                                      step="0.1"
                                    />
                                  </td>

                                  {/* ISSUED */}
                                  <td className="px-6 py-4 text-center border-r">
                                    {requestStatus === "Issued" ||
                                    requestStatus === "Partially Issued"
                                      ? issued
                                      : "-"}
                                  </td>

                                  {/* BALANCE */}
                                  <td className="px-6 py-4 text-center">
                                    {requestStatus === "Issued" ||
                                    requestStatus === "Partially Issued"
                                      ? Math.max(
                                          0,
                                          parseFloat(
                                            actualRequirement.toString()
                                          ) -
                                            available -
                                            issued
                                        ).toFixed(2)
                                      : "-"}
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

                {/* Quick Summary */}
                <div className="mt-6 bg-white rounded-lg border border-blue-200 p-4">
                  <div className="flex items-center justify-between">
                    {/* Left side - Status and Info */}
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">
                          Status:
                        </span>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                          {requestStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline & Resources */}
            <div className="space-y-8">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-4">
                <Calendar className="w-6 h-6 text-blue-500" />
                Timeline & Resources
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label
                    htmlFor="startDate"
                    className="text-base font-medium text-gray-700"
                  >
                    Start Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        handleInputChange("startDate", e.target.value)
                      }
                      className="h-12 border-2 focus:border-blue-500 text-base pl-12 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label
                    htmlFor="assignPlant"
                    className="text-base font-medium text-gray-700"
                  >
                    Assign Plant
                  </Label>

                  <Input
                    id="assignPlant"
                    type="text"
                    value={formData.assignPlant}
                    onChange={(e) =>
                      handleInputChange("assignPlant", e.target.value)
                    }
                    className="h-12 border-2 focus:border-blue-500 text-base pl-12 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-8">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-4">
                <AlertCircle className="w-6 h-6 text-blue-500" />
                Additional Details
              </h3>

              <div className="space-y-8">
                <div className="space-y-4">
                  <Label
                    htmlFor="description"
                    className="text-base font-medium text-gray-700"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Describe the production process and requirements..."
                    rows={4}
                    className="resize-none border-2 focus:border-blue-500 text-base"
                  />
                </div>

                <div className="space-y-4">
                  <Label
                    htmlFor="specialInstructions"
                    className="text-base font-medium text-gray-700"
                  >
                    Special Instructions
                  </Label>
                  <Textarea
                    id="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={(e) =>
                      handleInputChange("specialInstructions", e.target.value)
                    }
                    placeholder="Any special instructions or quality requirements..."
                    rows={4}
                    className="resize-none border-2 focus:border-blue-500 text-base"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 px-8 py-4 shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  // This would open the Start Production Manager dialog
                  toast.info("Start Production Manager dialog would open here");
                }}
                variant="outline"
                className="px-6 py-2 border-green-500 text-green-600 hover:bg-green-50"
              >
                <Target className="w-4 h-4 mr-2" />
                Start Production
              </Button>
            </div>
            <div className="flex gap-4">
              <Button onClick={onClose} variant="outline" className="px-6 py-2">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingCard
                  ? "Update Production Card"
                  : "Save Production Card"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Add New Plant Dialog */}
      <Dialog open={addPlantDialogOpen} onOpenChange={setAddPlantDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Factory className="w-5 h-5 text-blue-600" />
              Add New Plant
            </DialogTitle>
            <DialogDescription>
              Enter the name of the new manufacturing plant
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plantName">Plant Name *</Label>
              <Input
                id="plantName"
                value={newPlantName}
                onChange={(e) => setNewPlantName(e.target.value)}
                placeholder="e.g., Plant F - Central Unit"
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNewPlant();
                  }
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAddPlantDialogOpen(false);
                setNewPlantName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveNewPlant}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Add Plant
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
