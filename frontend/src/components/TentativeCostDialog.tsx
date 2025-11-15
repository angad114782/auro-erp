import {
  ArrowRight,
  Calculator,
  CheckCircle,
  FileCheck,
  IndianRupee,
  Package,
  Percent,
  Plus,
  Printer,
  Save,
  Scissors,
  Shirt,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { RDProject } from "../lib/data-store";
import { useERPStore } from "../lib/data-store";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";
import api from "../lib/api";
import { ProductDevelopment } from "./ProjectDetailsDialog";

interface TentativeCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProductDevelopment | null;
  onApproved: () => void;
}

// Cost item interface matching backend
interface CostItem {
  _id: string;
  item: string;
  description: string;
  consumption: string;
  cost: number;
  department?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Labour cost interface matching backend
interface LabourCost {
  directTotal: number;
  items: Array<{
    _id: string;
    name: string;
    cost: number;
  }>;
}

// Cost summary interface matching backend
interface CostSummary {
  additionalCosts: number;
  profitMargin: number;
  remarks: string;
  upperTotal: number;
  componentTotal: number;
  materialTotal: number;
  packagingTotal: number;
  miscTotal: number;
  labourTotal: number;
  totalAllCosts: number;
  profitAmount: number;
  tentativeCost: number;
  status: "draft" | "ready_for_red_seal";
  approvedAt?: string;
  approvedBy?: string;
}

// Add New Item Dialog Component
const AddNewItemDialog = ({
  category,
  isOpen,
  onClose,
  formData,
  onFormChange,
  onAddItem,
}: {
  category: string;
  isOpen: boolean;
  onClose: () => void;
  formData: {
    item: string;
    description: string;
    consumption: string;
    cost: number;
  };
  onFormChange: (field: string, value: string | number) => void;
  onAddItem: () => void;
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New {category.charAt(0).toUpperCase() + category.slice(1)} Item
        </DialogTitle>
        <DialogDescription>
          Add a new item to the {category} cost breakdown
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor={`item-${category}`}>Item Name *</Label>
          <Input
            id={`item-${category}`}
            value={formData.item}
            onChange={(e) => onFormChange("item", e.target.value)}
            placeholder="Enter item name"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`description-${category}`}>Description</Label>
          <Input
            id={`description-${category}`}
            value={formData.description}
            onChange={(e) => onFormChange("description", e.target.value)}
            placeholder="Enter description (optional)"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`consumption-${category}`}>Consumption</Label>
          <Input
            id={`consumption-${category}`}
            value={formData.consumption}
            onChange={(e) => onFormChange("consumption", e.target.value)}
            placeholder="Enter consumption details (optional)"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`cost-${category}`}>Cost *</Label>
          <div className="relative mt-1">
            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id={`cost-${category}`}
              type="number"
              value={formData.cost || ""}
              onChange={(e) =>
                onFormChange("cost", Number(e.target.value) || 0)
              }
              placeholder="0.00"
              className="pl-10"
              min="0"
              step="0.01"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onAddItem}>Add Item</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

// Stage Selector Component
const StageSelector = ({
  itemId,
  category,
  onStageSelect,
}: {
  itemId: string;
  category: string;
  onStageSelect: (itemId: string, department: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const stages = [
    {
      value: "cutting",
      label: "Cutting",
      icon: Scissors,
      color: "text-purple-600",
    },
    {
      value: "printing",
      label: "Printing",
      icon: Printer,
      color: "text-blue-600",
    },
    {
      value: "stitching",
      label: "Stitching",
      icon: Shirt,
      color: "text-indigo-600",
    },
    {
      value: "lasting",
      label: "Lasting",
      icon: Wrench,
      color: "text-orange-600",
    },
    {
      value: "packing",
      label: "Packing",
      icon: Package,
      color: "text-green-600",
    },
    {
      value: "quality",
      label: "Quality Check",
      icon: FileCheck,
      color: "text-emerald-600",
    },
  ];

  const handleStageSelect = (department: string, label: string) => {
    setIsOpen(false);
    onStageSelect(itemId, department);
    toast.success(`Item will advance to ${label}`);
  };

  // Only show department selector for upper and component categories
  if (!["upper", "component"].includes(category)) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 p-0 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
        title="Advance to stage"
      >
        <Plus className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
            {stages.map((stage) => {
              const Icon = stage.icon;
              return (
                <button
                  key={stage.value}
                  onClick={() => handleStageSelect(stage.value, stage.label)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <Icon className={`w-4 h-4 ${stage.color}`} />
                  <span className="text-sm">{stage.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// Cost Category Card Component
const CostCategoryCard = ({
  title,
  category,
  items,
  onUpdateCost,
  onDeleteItem,
  onAddItem,
  onStageSelect,
  color = "orange",
}: {
  title: string;
  category: string;
  items: CostItem[];
  onUpdateCost: (itemId: string, cost: number) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: () => void;
  onStageSelect: (itemId: string, department: string) => void;
  color?: "orange" | "purple" | "teal" | "rose" | "gray" | "amber";
}) => {
  const colorClasses = {
    orange: {
      border: "border-orange-200",
      header: "bg-orange-50",
      icon: "text-orange-600",
      button: "text-orange-600 border-orange-200 hover:bg-orange-50",
      total: "bg-orange-50 text-orange-900",
    },
    purple: {
      border: "border-purple-200",
      header: "bg-purple-50",
      icon: "text-purple-600",
      button: "text-purple-600 border-purple-200 hover:bg-purple-50",
      total: "bg-purple-50 text-purple-900",
    },
    teal: {
      border: "border-teal-200",
      header: "bg-teal-50",
      icon: "text-teal-600",
      button: "text-teal-600 border-teal-200 hover:bg-teal-50",
      total: "bg-teal-50 text-teal-900",
    },
    rose: {
      border: "border-rose-200",
      header: "bg-rose-50",
      icon: "text-rose-600",
      button: "text-rose-600 border-rose-200 hover:bg-rose-50",
      total: "bg-rose-50 text-rose-900",
    },
    gray: {
      border: "border-gray-200",
      header: "bg-gray-50",
      icon: "text-gray-600",
      button: "text-gray-600 border-gray-200 hover:bg-gray-50",
      total: "bg-gray-50 text-gray-900",
    },
    amber: {
      border: "border-amber-200",
      header: "bg-amber-50",
      icon: "text-amber-600",
      button: "text-amber-600 border-amber-200 hover:bg-amber-50",
      total: "bg-amber-50 text-amber-900",
    },
  };

  const currentColor = colorClasses[color];

  // Ensure items is always an array and handle undefined/null values
  const safeItems = Array.isArray(items) ? items : [];
  const totalCost = safeItems.reduce(
    (sum, item) => sum + (Number(item.cost) || 0),
    0
  );

  // Define column headers based on category
  const getColumnHeaders = () => {
    switch (category) {
      case "component":
        return {
          col1: "COMPONENT",
          col2: "DESCRIPTION",
          col3: "CONSUMPTION",
          col4: "COST",
        };
      case "material":
        return {
          col1: "MATERIAL",
          col2: "DESCRIPTION",
          col3: "CONSUMPTION",
          col4: "COST",
        };
      case "packaging":
        return {
          col1: "PACKING",
          col2: "DESCRIPTION",
          col3: "CONSUMPTION",
          col4: "COST",
        };
      default:
        return {
          col1: "ITEM",
          col2: "DESCRIPTION",
          col3: "CONSUMPTION",
          col4: "COST",
        };
    }
  };

  const headers = getColumnHeaders();

  return (
    <Card className={`border-2 ${currentColor.border} h-148`}>
      <CardHeader className={currentColor.header}>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className={`w-5 h-5 ${currentColor.icon}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 bg-gray-100 p-2 rounded text-sm font-medium">
            <div className="col-span-3 text-center">{headers.col1}</div>
            <div className="col-span-4 text-center">{headers.col2}</div>
            <div className="col-span-2 text-center">{headers.col3}</div>
            <div className="col-span-2 text-center">{headers.col4}</div>
            <div className="col-span-1 text-center"></div>
          </div>

          {/* Scrollable Table Content */}
          <div className="h-64 overflow-y-auto scrollbar-hide space-y-4">
            {safeItems.map((item) => (
              <div
                key={item._id}
                className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded"
              >
                <div className="col-span-3">
                  <Input
                    value={item.item || ""}
                    readOnly
                    className="text-center text-sm bg-gray-50"
                  />
                </div>
                <div className="col-span-4">
                  <Input
                    value={item.description || ""}
                    readOnly
                    className="text-sm bg-gray-50"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    value={item.consumption || ""}
                    readOnly
                    className="text-sm bg-gray-50"
                  />
                </div>
                <div className="col-span-2">
                  <div className="relative">
                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                    <Input
                      type="number"
                      value={item.cost || ""}
                      onChange={(e) =>
                        onUpdateCost(item._id, Number(e.target.value) || 0)
                      }
                      className="pl-6 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="col-span-1 flex justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteItem(item._id)}
                    className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <StageSelector
                    itemId={item._id}
                    category={category}
                    onStageSelect={onStageSelect}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add New Item Button */}
          <Button
            variant="outline"
            size="sm"
            className={`w-full ${currentColor.button}`}
            onClick={onAddItem}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Item
          </Button>

          <Separator />

          {/* Total Cost */}
          <div className={`p-3 rounded-lg ${currentColor.total}`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">Total {title}:</span>
              <span className="text-lg font-bold">₹{totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function TentativeCostDialog({
  open,
  onOpenChange,
  project,
  onApproved,
}: TentativeCostDialogProps) {
  const { updateRDProject } = useERPStore();

  // Initialize with proper default values to avoid undefined issues
  const [costRows, setCostRows] = useState<{
    upper: CostItem[];
    component: CostItem[];
    material: CostItem[];
    packaging: CostItem[];
    miscellaneous: CostItem[];
  }>({
    upper: [],
    component: [],
    material: [],
    packaging: [],
    miscellaneous: [],
  });

  const [labourCost, setLabourCost] = useState<LabourCost>({
    directTotal: 0,
    items: [],
  });

  const [costSummary, setCostSummary] = useState<CostSummary>({
    additionalCosts: 0,
    profitMargin: 25,
    remarks: "",
    upperTotal: 0,
    componentTotal: 0,
    materialTotal: 0,
    packagingTotal: 0,
    miscTotal: 0,
    labourTotal: 0,
    totalAllCosts: 0,
    profitAmount: 0,
    tentativeCost: 0,
    status: "draft",
  });

  // Real-time summary for instant UI updates
  const [realTimeSummary, setRealTimeSummary] = useState<CostSummary | null>(
    null
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);

  // Dialog states
  const [addItemDialogs, setAddItemDialogs] = useState({
    upper: false,
    component: false,
    material: false,
    packaging: false,
    labour: false,
    miscellaneous: false,
  });

  const [dialogForms, setDialogForms] = useState({
    upper: { item: "", description: "", consumption: "", cost: 0 },
    component: { item: "", description: "", consumption: "", cost: 0 },
    material: { item: "", description: "", consumption: "", cost: 0 },
    packaging: { item: "", description: "", consumption: "", cost: 0 },
    labour: { item: "", description: "", consumption: "", cost: 0 },
    miscellaneous: { item: "", description: "", consumption: "", cost: 0 },
  });

  // Use realTimeSummary for display, fallback to costSummary
  const displaySummary = realTimeSummary || costSummary;

  // Load all cost data from backend
  useEffect(() => {
    if (project && open && !dataLoaded) {
      loadAllCostData();
    }
  }, [project, open, dataLoaded]);

  // Reset data loaded state when dialog closes
  useEffect(() => {
    if (!open) {
      setDataLoaded(false);
      setRealTimeSummary(null); // Clear real-time calculations when closing
    }
  }, [open]);

  // Reset real-time summary when data loads from backend
  useEffect(() => {
    if (dataLoaded) {
      setRealTimeSummary(null); // Clear real-time calculations when we have fresh backend data
    }
  }, [dataLoaded]);

  const loadAllCostData = async () => {
    if (!project) return;

    setIsLoading(true);
    try {
      // Load cost summary
      const summaryResponse = await api.get(`/projects/${project._id}/costs`);

      // Handle different response structures
      const summaryData = summaryResponse.data.summary || summaryResponse.data;

      if (summaryData) {
        setCostSummary((prev) => ({
          ...prev,
          ...summaryData,
          // Ensure all number fields have safe defaults
          additionalCosts: Number(summaryData.additionalCosts) || 0,
          profitMargin: Number(summaryData.profitMargin) || 25,
          upperTotal: Number(summaryData.upperTotal) || 0,
          componentTotal: Number(summaryData.componentTotal) || 0,
          materialTotal: Number(summaryData.materialTotal) || 0,
          packagingTotal: Number(summaryData.packagingTotal) || 0,
          miscTotal: Number(summaryData.miscTotal) || 0,
          labourTotal: Number(summaryData.labourTotal) || 0,
          totalAllCosts: Number(summaryData.totalAllCosts) || 0,
          profitAmount: Number(summaryData.profitAmount) || 0,
          tentativeCost: Number(summaryData.tentativeCost) || 0,
          remarks: summaryData.remarks || "",
          status: summaryData.status || "draft",
        }));
      }

      // Load cost rows for each section with safe defaults
      const sections = [
        "upper",
        "component",
        "material",
        "packaging",
        "miscellaneous",
      ];
      const rowPromises = sections.map((section) =>
        api.get(`/projects/${project._id}/costs/${section}`)
      );
      const rowResponses = await Promise.all(rowPromises);

      const newCostRows = {
        upper: Array.isArray(rowResponses[0]?.data?.rows)
          ? rowResponses[0].data.rows.map((item: any) => ({
              _id: item._id || `upper_${Date.now()}_${Math.random()}`,
              item: item.item || "",
              description: item.description || "",
              consumption: item.consumption || "",
              cost: Number(item.cost) || 0,
              department: item.department || "",
            }))
          : [],
        component: Array.isArray(rowResponses[1]?.data?.rows)
          ? rowResponses[1].data.rows.map((item: any) => ({
              _id: item._id || `component_${Date.now()}_${Math.random()}`,
              item: item.item || "",
              description: item.description || "",
              consumption: item.consumption || "",
              cost: Number(item.cost) || 0,
              department: item.department || "",
            }))
          : [],
        material: Array.isArray(rowResponses[2]?.data?.rows)
          ? rowResponses[2].data.rows.map((item: any) => ({
              _id: item._id || `material_${Date.now()}_${Math.random()}`,
              item: item.item || "",
              description: item.description || "",
              consumption: item.consumption || "",
              cost: Number(item.cost) || 0,
            }))
          : [],
        packaging: Array.isArray(rowResponses[3]?.data?.rows)
          ? rowResponses[3].data.rows.map((item: any) => ({
              _id: item._id || `packaging_${Date.now()}_${Math.random()}`,
              item: item.item || "",
              description: item.description || "",
              consumption: item.consumption || "",
              cost: Number(item.cost) || 0,
            }))
          : [],
        miscellaneous: Array.isArray(rowResponses[4]?.data?.rows)
          ? rowResponses[4].data.rows.map((item: any) => ({
              _id: item._id || `misc_${Date.now()}_${Math.random()}`,
              item: item.item || "",
              description: item.description || "",
              consumption: item.consumption || "",
              cost: Number(item.cost) || 0,
            }))
          : [],
      };

      setCostRows(newCostRows);

      // Load labour cost with safe defaults
      const labourResponse = await api.get(
        `/projects/${project._id}/costs/labour`
      );

      // Handle different labour response structures
      const labourData = labourResponse.data.labour || labourResponse.data;

      if (labourData) {
        setLabourCost({
          directTotal: Number(labourData.directTotal) || 0,
          items: Array.isArray(labourData.items)
            ? labourData.items.map((item: any) => ({
                _id: item._id || `labour_${Date.now()}_${Math.random()}`,
                name: item.name || "",
                cost: Number(item.cost) || 0,
              }))
            : [],
        });
      }

      setDataLoaded(true);
    } catch (error) {
      console.error("Failed to load cost data:", error);
      toast.error("Failed to load cost data");

      // Reset to safe defaults on error
      setCostRows({
        upper: [],
        component: [],
        material: [],
        packaging: [],
        miscellaneous: [],
      });
      setLabourCost({
        directTotal: 0,
        items: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Real-time calculation handlers
  const handleAdditionalCostsChange = (value: number) => {
    const newAdditionalCosts = Number(value) || 0;
    const newProfitMargin = costSummary.profitMargin || 25;

    // Calculate real-time totals based on current backend data
    const totalAllCosts =
      (costSummary.upperTotal || 0) +
      (costSummary.componentTotal || 0) +
      (costSummary.materialTotal || 0) +
      (costSummary.packagingTotal || 0) +
      (costSummary.miscTotal || 0) +
      (costSummary.labourTotal || 0);

    const subtotalBeforeProfit = totalAllCosts + newAdditionalCosts;
    const profitAmount = Math.round(
      (subtotalBeforeProfit * newProfitMargin) / 100
    );
    const tentativeCost = subtotalBeforeProfit + profitAmount;

    setRealTimeSummary({
      ...costSummary,
      additionalCosts: newAdditionalCosts,
      profitMargin: newProfitMargin,
      totalAllCosts,
      profitAmount,
      tentativeCost,
    });

    // Also update the main state for saving
    setCostSummary((prev) => ({
      ...prev,
      additionalCosts: newAdditionalCosts,
    }));
  };

  const handleProfitMarginChange = (value: number) => {
    const newProfitMargin = Number(value) || 25;
    const newAdditionalCosts = costSummary.additionalCosts || 0;

    // Calculate real-time totals based on current backend data
    const totalAllCosts =
      (costSummary.upperTotal || 0) +
      (costSummary.componentTotal || 0) +
      (costSummary.materialTotal || 0) +
      (costSummary.packagingTotal || 0) +
      (costSummary.miscTotal || 0) +
      (costSummary.labourTotal || 0);

    const subtotalBeforeProfit = totalAllCosts + newAdditionalCosts;
    const profitAmount = Math.round(
      (subtotalBeforeProfit * newProfitMargin) / 100
    );
    const tentativeCost = subtotalBeforeProfit + profitAmount;

    setRealTimeSummary({
      ...costSummary,
      additionalCosts: newAdditionalCosts,
      profitMargin: newProfitMargin,
      totalAllCosts,
      profitAmount,
      tentativeCost,
    });

    // Also update the main state for saving
    setCostSummary((prev) => ({
      ...prev,
      profitMargin: newProfitMargin,
    }));
  };

  const handleRemarksChange = (value: string) => {
    setCostSummary((prev) => ({
      ...prev,
      remarks: value,
    }));

    // Also update real-time summary if it exists
    if (realTimeSummary) {
      setRealTimeSummary((prev) => ({
        ...prev!,
        remarks: value,
      }));
    }
  };

  // Cost item management
  const updateItemCost = async (itemId: string, cost: number) => {
    if (!project) return;

    try {
      // Find which section contains this item
      let section: string | null = null;
      for (const [sec, items] of Object.entries(costRows)) {
        if (items.find((item) => item._id === itemId)) {
          section = sec;
          break;
        }
      }

      if (!section) {
        toast.error("Item not found");
        return;
      }

      // Update the cost via API
      await api.patch(`/projects/${project._id}/costs/${section}/${itemId}`, {
        cost: Number(cost) || 0,
      });

      // Update local state
      setCostRows((prev) => ({
        ...prev,
        [section as string]: prev[section as keyof typeof prev].map((item) =>
          item._id === itemId ? { ...item, cost: Number(cost) || 0 } : item
        ),
      }));

      // Reload summary to get updated totals
      await loadSummary();
    } catch (error) {
      console.error("Failed to update item cost:", error);
      toast.error("Failed to update item cost");
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!project) return;

    try {
      // Find which section contains this item
      let section: string | null = null;
      for (const [sec, items] of Object.entries(costRows)) {
        if (items.find((item) => item._id === itemId)) {
          section = sec;
          break;
        }
      }

      if (!section) {
        toast.error("Item not found");
        return;
      }

      // Delete via API
      await api.delete(`/projects/${project._id}/costs/${section}/${itemId}`);

      // Update local state
      setCostRows((prev) => ({
        ...prev,
        [section as string]: prev[section as keyof typeof prev].filter(
          (item) => item._id !== itemId
        ),
      }));

      // Reload summary to get updated totals
      await loadSummary();

      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast.error("Failed to delete item");
    }
  };

  const setItemDepartment = async (itemId: string, department: string) => {
    if (!project) return;

    try {
      // Find which section contains this item
      let section: string | null = null;
      for (const [sec, items] of Object.entries(costRows)) {
        if (items.find((item) => item._id === itemId)) {
          section = sec;
          break;
        }
      }

      if (!section || !["upper", "component"].includes(section)) {
        toast.error(
          "Department tagging only allowed for upper and component items"
        );
        return;
      }

      // Update department via API
      await api.patch(
        `/projects/${project._id}/costs/${section}/${itemId}/department`,
        {
          department,
        }
      );

      // Update local state
      setCostRows((prev) => ({
        ...prev,
        [section as string]: prev[section as keyof typeof prev].map((item) =>
          item._id === itemId ? { ...item, department } : item
        ),
      }));

      toast.success("Department updated successfully");
    } catch (error) {
      console.error("Failed to update department:", error);
      toast.error("Failed to update department");
    }
  };

  // Dialog management
  const openAddItemDialog = (category: string) => {
    setAddItemDialogs((prev) => ({ ...prev, [category]: true }));
    setDialogForms((prev) => ({
      ...prev,
      [category]: { item: "", description: "", consumption: "", cost: 0 },
    }));
  };

  const closeAddItemDialog = (category: string) => {
    setAddItemDialogs((prev) => ({ ...prev, [category]: false }));
  };

  const updateDialogForm = (
    category: string,
    field: string,
    value: string | number
  ) => {
    setDialogForms((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const handleAddNewItem = async (category: string) => {
    if (!project) return;

    const currentForm = dialogForms[category as keyof typeof dialogForms];
    if (!currentForm.item.trim()) {
      toast.error("Please enter an item name");
      return;
    }

    try {
      const payload = {
        item: currentForm.item.trim(),
        description: currentForm.description || "",
        consumption: currentForm.consumption || "",
        cost: Number(currentForm.cost) || 0,
      };

      // Add item via API
      const response = await api.post(
        `/projects/${project._id}/costs/${category}`,
        payload
      );

      console.log("Add item response:", response);

      // Use the row returned from backend
      if (response.data.row) {
        setCostRows((prev) => ({
          ...prev,
          [category]: [
            ...prev[category as keyof typeof prev],
            {
              _id: response.data.row._id,
              item: response.data.row.item || "",
              description: response.data.row.description || "",
              consumption: response.data.row.consumption || "",
              cost: Number(response.data.row.cost) || 0,
              department: response.data.row.department || "",
            },
          ],
        }));
      }

      // Reload summary to get updated totals
      await loadSummary();

      closeAddItemDialog(category);
      toast.success(`New ${category} item added successfully!`);
    } catch (error) {
      console.error("Failed to add item:", error);
      toast.error("Failed to add item");
    }
  };

  const updateLabourCost = async (updates: Partial<LabourCost>) => {
    if (!project) return;

    try {
      const response = await api.patch(
        `/projects/${project._id}/costs/labour`,
        updates
      );

      console.log("Labour update response:", response);

      // Update local state with the new data
      setLabourCost((prev) => ({ ...prev, ...updates }));

      // Wait for the backend to process and then reload summary
      setTimeout(async () => {
        await loadSummary();
      }, 500); // Small delay to ensure backend has processed
    } catch (error) {
      console.error("Failed to update labour cost:", error);
      toast.error("Failed to update labour cost");
    }
  };

  const loadSummary = async () => {
    if (!project) return;

    try {
      const response = await api.get(`/projects/${project._id}/costs`);
      console.log("Load summary response:", response);

      // Handle different response structures
      const summaryData = response.data.summary || response.data;

      if (summaryData) {
        setCostSummary((prev) => ({
          ...prev,
          ...summaryData,
          // Ensure all number fields have safe defaults
          additionalCosts: Number(summaryData.additionalCosts) || 0,
          profitMargin: Number(summaryData.profitMargin) || 25,
          upperTotal: Number(summaryData.upperTotal) || 0,
          componentTotal: Number(summaryData.componentTotal) || 0,
          materialTotal: Number(summaryData.materialTotal) || 0,
          packagingTotal: Number(summaryData.packagingTotal) || 0,
          miscTotal: Number(summaryData.miscTotal) || 0,
          labourTotal: Number(summaryData.labourTotal) || 0,
          totalAllCosts: Number(summaryData.totalAllCosts) || 0,
          profitAmount: Number(summaryData.profitAmount) || 0,
          tentativeCost: Number(summaryData.tentativeCost) || 0,
          remarks: summaryData.remarks || "",
          status: summaryData.status || "draft",
        }));

        // Clear real-time summary when we get fresh backend data
        setRealTimeSummary(null);
      }
    } catch (error) {
      console.error("Failed to load summary:", error);
    }
  };

  const handleSaveSummary = async () => {
    if (!project) return;

    setIsLoading(true);

    try {
      const payload = {
        additionalCosts: Number(costSummary.additionalCosts) || 0,
        profitMargin: Number(costSummary.profitMargin) || 25,
        remarks: costSummary.remarks || "",
      };

      console.log("🔄 Saving cost summary...", payload);

      const response = await api.patch(
        `/projects/${project._id}/costs`,
        payload
      );

      console.log("✅ Save response:", response.data);

      // Update the state with the fresh summary data from backend
      if (response.data && response.data.summary) {
        const freshSummary = response.data.summary;

        setCostSummary((prev) => ({
          ...prev,
          // Update the input fields
          additionalCosts: Number(freshSummary.additionalCosts) || 0,
          profitMargin: Number(freshSummary.profitMargin) || 25,
          remarks: freshSummary.remarks || "",
          // Update ALL computed totals from backend
          upperTotal: Number(freshSummary.upperTotal) || 0,
          componentTotal: Number(freshSummary.componentTotal) || 0,
          materialTotal: Number(freshSummary.materialTotal) || 0,
          packagingTotal: Number(freshSummary.packagingTotal) || 0,
          miscTotal: Number(freshSummary.miscTotal) || 0,
          labourTotal: Number(freshSummary.labourTotal) || 0,
          totalAllCosts: Number(freshSummary.totalAllCosts) || 0,
          profitAmount: Number(freshSummary.profitAmount) || 0,
          tentativeCost: Number(freshSummary.tentativeCost) || 0,
          status: freshSummary.status || "draft",
        }));

        // Clear real-time summary after successful save
        setRealTimeSummary(null);

        console.log("✅ UI updated with fresh summary data");
      }

      toast.success("Cost summary saved successfully!");
    } catch (error: any) {
      console.error("❌ Failed to save cost summary:", error);
      toast.error(
        `Failed to save cost summary: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!project) return;

    try {
      await api.post(`/projects/${project._id}/costs/approve`);

      toast.success("Tentative cost approved! Ready to advance to Red Seal.");

      // Update local project state
      const updatedProject = {
        ...project,
        finalCost: costSummary.tentativeCost,
        remarks: costSummary.remarks,
      };

      updateRDProject(project._id, updatedProject as any);

      // Call the onApproved callback to advance the stage
      setTimeout(() => {
        onApproved();
        onOpenChange(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to approve cost:", error);
      toast.error("Failed to approve cost");
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[75vw] !w-[75vw] max-h-[85vh] overflow-hidden p-0 m-0 top-[7.5vh] translate-y-0 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 px-6 py-4 bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-semibold text-gray-900">
                  Tentative Cost Calculation
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  Calculate production cost and profit margin for{" "}
                  {project.autoCode}
                  {isLoading && " (Loading...)"}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveSummary}
                variant="outline"
                disabled={isLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={handleApprove}
                className="bg-[rgba(0,188,125,1)] hover:bg-green-600"
                disabled={displaySummary.tentativeCost === 0 || isLoading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isLoading ? "Processing..." : "Approve & Proceed"}
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-6 space-y-6">
            {/* Cost Breakdown Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CostCategoryCard
                key="upper-card"
                title="Upper Cost Breakdown"
                category="upper"
                items={costRows.upper}
                onUpdateCost={updateItemCost}
                onDeleteItem={deleteItem}
                onAddItem={() => openAddItemDialog("upper")}
                onStageSelect={setItemDepartment}
                color="orange"
              />

              <CostCategoryCard
                key="component-card"
                title="Component Cost Breakdown"
                category="component"
                items={costRows.component}
                onUpdateCost={updateItemCost}
                onDeleteItem={deleteItem}
                onAddItem={() => openAddItemDialog("component")}
                onStageSelect={setItemDepartment}
                color="purple"
              />

              <CostCategoryCard
                key="material-card"
                title="Material Cost Breakdown"
                category="material"
                items={costRows.material}
                onUpdateCost={updateItemCost}
                onDeleteItem={deleteItem}
                onAddItem={() => openAddItemDialog("material")}
                onStageSelect={setItemDepartment}
                color="teal"
              />

              <CostCategoryCard
                key="packaging-card"
                title="Packaging Cost Breakdown"
                category="packaging"
                items={costRows.packaging}
                onUpdateCost={updateItemCost}
                onDeleteItem={deleteItem}
                onAddItem={() => openAddItemDialog("packaging")}
                onStageSelect={setItemDepartment}
                color="rose"
              />

              <CostCategoryCard
                key="miscellaneous-card"
                title="Miscellaneous Cost Breakdown"
                category="miscellaneous"
                items={costRows.miscellaneous}
                onUpdateCost={updateItemCost}
                onDeleteItem={deleteItem}
                onAddItem={() => openAddItemDialog("miscellaneous")}
                onStageSelect={setItemDepartment}
                color="gray"
              />

              {/* Labour Cost Card */}
              <Card
                key="labour-card"
                className="border-2 border-amber-200 h-148"
              >
                <CardHeader className="bg-amber-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-amber-600" />
                    Labour Cost + OH Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Direct Total Labour Cost Input */}
                    <div className="bg-amber-100 p-4 rounded-lg border-2 border-amber-300">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-amber-900">
                          Labour + OH Cost:
                        </span>
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
                          <Input
                            type="number"
                            value={labourCost.directTotal || 0}
                            onChange={(e) =>
                              updateLabourCost({
                                directTotal: Number(e.target.value) || 0,
                              })
                            }
                            className="pl-8 text-lg font-bold text-amber-900 bg-white border-amber-300 w-32"
                          />
                        </div>
                      </div>
                    </div>

                    <h4 className="font-medium text-amber-900">
                      Individual Labour Components:
                    </h4>

                    {/* Labour Items */}
                    <div className="h-32 overflow-y-auto scrollbar-hide space-y-3">
                      {labourCost.items.map((item) => (
                        <div
                          key={item._id}
                          className="grid grid-cols-[1fr_2fr_auto] gap-4 items-center border-b border-amber-100 pb-2 group hover:bg-amber-50/50 px-2 -mx-2 rounded transition-colors"
                        >
                          <div>
                            <Label className="text-amber-800">
                              {item.name}
                            </Label>
                          </div>
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input
                              type="number"
                              value={item.cost || 0}
                              onChange={(e) => {
                                const updatedItems = labourCost.items.map(
                                  (labourItem) =>
                                    labourItem._id === item._id
                                      ? {
                                          ...labourItem,
                                          cost: Number(e.target.value) || 0,
                                        }
                                      : labourItem
                                );
                                updateLabourCost({ items: updatedItems });
                              }}
                              className="pl-6 text-sm"
                              placeholder="0.00"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updatedItems = labourCost.items.filter(
                                (labourItem) => labourItem._id !== item._id
                              );
                              updateLabourCost({ items: updatedItems });
                            }}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Add New Labour Component Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-amber-600 border-amber-200 hover:bg-amber-50"
                      onClick={() => openAddItemDialog("labour")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Labour Component
                    </Button>

                    <Separator />

                    {/* Total Labour Cost */}
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-amber-900">
                          Total Labour Cost:
                        </span>
                        <span className="text-lg font-bold text-amber-900">
                          ₹{(labourCost.directTotal || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Final Cost Summary */}
            <Card className="border-2 border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-green-600" />
                  Final Cost Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Additional Costs
                  </Label>
                  <div className="relative mt-1">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="number"
                      value={displaySummary.additionalCosts || 0}
                      onChange={(e) =>
                        handleAdditionalCostsChange(Number(e.target.value))
                      }
                      className="pl-10"
                      placeholder="Additional costs (optional)"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Profit Margin (%)
                  </Label>
                  <div className="relative mt-1">
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="number"
                      value={displaySummary.profitMargin || 25}
                      onChange={(e) =>
                        handleProfitMarginChange(Number(e.target.value))
                      }
                      className="pl-10"
                      placeholder="Enter profit margin %"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>

                <Separator />

                {/* Cost Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Upper Cost:</span>
                    <span className="font-medium">
                      {formatCurrency(displaySummary.upperTotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Component Cost:</span>
                    <span className="font-medium">
                      {formatCurrency(displaySummary.componentTotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Material Cost:</span>
                    <span className="font-medium">
                      {formatCurrency(displaySummary.materialTotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Packaging Cost:</span>
                    <span className="font-medium">
                      {formatCurrency(displaySummary.packagingTotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Miscellaneous Cost:</span>
                    <span className="font-medium">
                      {formatCurrency(displaySummary.miscTotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Labour + OH Cost:</span>
                    <span className="font-medium">
                      {formatCurrency(displaySummary.labourTotal || 0)}
                    </span>
                  </div>

                  <Separator />
                  <div className="flex justify-between text-sm font-medium bg-blue-50 p-2 rounded">
                    <span className="text-blue-900">Total All Costs:</span>
                    <span className="text-blue-900">
                      {formatCurrency(displaySummary.totalAllCosts || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Additional Costs:</span>
                    <span className="font-medium">
                      +{formatCurrency(displaySummary.additionalCosts || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Profit ({displaySummary.profitMargin || 25}%):
                    </span>
                    <span className="font-medium">
                      +{formatCurrency(displaySummary.profitAmount || 0)}
                    </span>
                  </div>
                  <Separator />
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-green-900">
                        Tentative Cost:
                      </span>
                      <span className="text-xl font-bold text-green-900">
                        {formatCurrency(displaySummary.tentativeCost || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Remarks Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Label className="text-sm font-medium text-gray-600">
                  Remarks & Justification
                </Label>
                <Textarea
                  value={displaySummary.remarks || ""}
                  onChange={(e) => handleRemarksChange(e.target.value)}
                  className="mt-2"
                  rows={3}
                  placeholder="Add notes about cost calculation methodology, assumptions, or special considerations..."
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-40 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-t-2 border-gray-200 shadow-lg">
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              Project: {project.autoCode}
            </Badge>
            <div className="text-sm text-gray-600">
              Status:{" "}
              {displaySummary.status === "draft"
                ? "Draft"
                : "Ready for Red Seal"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              Total:{" "}
              <span className="font-bold text-green-600">
                {formatCurrency(displaySummary.tentativeCost || 0)}
              </span>
            </div>
            <Button
              onClick={handleApprove}
              className="bg-[rgba(0,188,125,1)] hover:bg-green-600"
              disabled={
                displaySummary.tentativeCost === 0 ||
                isLoading ||
                displaySummary.status !== "ready_for_red_seal"
              }
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              {isLoading ? "Processing..." : "Approve & Advance to Red Seal"}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Add New Item Dialogs */}
      {Object.keys(addItemDialogs).map((category) => (
        <AddNewItemDialog
          key={`dialog-${category}`}
          category={category}
          isOpen={addItemDialogs[category as keyof typeof addItemDialogs]}
          onClose={() => closeAddItemDialog(category)}
          formData={dialogForms[category as keyof typeof dialogForms]}
          onFormChange={(field, value) =>
            updateDialogForm(category, field, value)
          }
          onAddItem={() => handleAddNewItem(category)}
        />
      ))}
    </Dialog>
  );
}
