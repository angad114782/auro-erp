import {
  ArrowRight,
  Calculator,
  CheckCircle,
  Cross,
  FileCheck,
  IndianRupee,
  Package,
  Percent,
  Plus,
  Printer,
  Save,
  Scissors,
  Send,
  Shirt,
  Trash2,
  Wrench,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo, useRef, JSX } from "react";
import { toast } from "sonner";
import { useRedirect } from "../hooks/useRedirect";
import api from "../lib/api";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Textarea } from "./ui/textarea";

interface TentativeCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any | null;
  onApproved: () => void;
}

// Cost item interface matching backend
export interface CostItem {
  _id: string;
  item: string;
  description: string;
  consumption: number;
  cost: number;
  department?: string;
  createdAt?: string;
  updatedAt?: string;
  isNew?: boolean; // Flag for newly created dummy items
}

// Labour cost interface matching backend
export interface LabourCost {
  directTotal: number;
  items: Array<{
    _id: string;
    name: string;
    cost: number;
    isNew?: boolean;
  }>;
}

// Cost summary interface matching backend
export interface CostSummary {
  additionalCosts: number;
  profitMargin: number | "";
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

// Constants
const CATEGORIES = [
  { id: "upper", label: "Upper", color: "orange", icon: Shirt },
  { id: "component", label: "Component", color: "purple", icon: Scissors },
  { id: "material", label: "Material", color: "teal", icon: Package },
  { id: "packaging", label: "Packaging", color: "rose", icon: Package },
  { id: "labour", label: "Labour", color: "amber", icon: Wrench },
  { id: "misc", label: "Misc", color: "gray", icon: FileCheck },
] as const;

const STAGES = [
  {
    value: "cutting",
    label: "Cutting",
    icon: Scissors,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    value: "printing",
    label: "Printing",
    icon: Printer,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    value: "upper",
    label: "Upper",
    icon: Shirt,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
  {
    value: "upperREJ",
    label: "Upper Reject",
    icon: X,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    value: "assembly",
    label: "Assembly",
    icon: Wrench,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    value: "packing",
    label: "Packing",
    icon: Package,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    value: "rfd",
    label: "Ready for Dispatch",
    icon: Send,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
] as const;

const TOTAL_ROWS_PER_CATEGORY = 5;

// Helper function to get empty dummy rows
const getEmptyDummyRows = (count: number, category: string): CostItem[] => {
  return Array.from({ length: count }).map((_, index) => ({
    _id: `dummy_${category}_${Date.now()}_${index}_${Math.random()}`,
    item: "",
    description: "",
    consumption: 0,
    cost: 0,
    isNew: true,
  }));
};

const getEmptyLabourItems = (count: number) => {
  return Array.from({ length: count }).map((_, index) => ({
    _id: `dummy_labour_${Date.now()}_${index}_${Math.random()}`,
    name: "",
    cost: 0,
    isNew: true,
  }));
};

// Mobile Category Selector
const MobileCategorySelector = ({
  activeCategory,
  onSelectCategory,
}: {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}) => {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? `bg-${cat.color}-100 text-${cat.color}-700 border border-${cat.color}-300`
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};

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
    consumption: number;
    cost: number;
  };
  onFormChange: (field: string, value: string | number) => void;
  onAddItem: () => void;
}) => {
  const [errors, setErrors] = useState<{
    item?: string;
    consumption?: string;
    cost?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: {
      item?: string;
      consumption?: string;
      cost?: string;
    } = {};

    if (!formData.item.trim()) {
      newErrors.item = "Item name is required";
    }

    if (formData.consumption < 0) {
      newErrors.consumption = "Consumption cannot be negative";
    }

    if (formData.cost < 0) {
      newErrors.cost = "Cost cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onAddItem();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Plus className="w-5 h-5" />
            Add New {category.charAt(0).toUpperCase() + category.slice(1)} Item
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Add a new item to the {category} cost breakdown
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label
              htmlFor={`item-${category}`}
              className="text-sm sm:text-base"
            >
              Item Name *
            </Label>
            <Input
              id={`item-${category}`}
              value={formData.item}
              onChange={(e) => {
                onFormChange("item", e.target.value);
                if (errors.item) setErrors({ ...errors, item: undefined });
              }}
              placeholder="Enter item name"
              className={`mt-1 h-10 sm:h-12 text-sm sm:text-base ${
                errors.item ? "border-red-500" : ""
              }`}
            />
            {errors.item && (
              <p className="text-xs text-red-500 mt-1">{errors.item}</p>
            )}
          </div>
          <div>
            <Label
              htmlFor={`description-${category}`}
              className="text-sm sm:text-base"
            >
              Description
            </Label>
            <Input
              id={`description-${category}`}
              value={formData.description}
              onChange={(e) => onFormChange("description", e.target.value)}
              placeholder="Enter description (optional)"
              className="mt-1 h-10 sm:h-12 text-sm sm:text-base"
            />
          </div>
          <div>
            <Label
              htmlFor={`consumption-${category}`}
              className="text-sm sm:text-base"
            >
              Consumption *
            </Label>
            <Input
              id={`consumption-${category}`}
              type="number"
              step="0.01"
              min="0"
              value={formData.consumption || ""}
              onChange={(e) => {
                const value =
                  e.target.value === "" ? 0 : Number(e.target.value);
                onFormChange("consumption", value);
                if (errors.consumption)
                  setErrors({ ...errors, consumption: undefined });
              }}
              placeholder="Enter consumption amount"
              className={`mt-1 h-10 sm:h-12 text-sm sm:text-base ${
                errors.consumption ? "border-red-500" : ""
              }`}
            />
            {errors.consumption && (
              <p className="text-xs text-red-500 mt-1">{errors.consumption}</p>
            )}
          </div>
          <div>
            <Label
              htmlFor={`cost-${category}`}
              className="text-sm sm:text-base"
            >
              Cost *
            </Label>
            <div className="relative mt-1">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id={`cost-${category}`}
                type="number"
                step="0.01"
                min="0"
                value={formData.cost || ""}
                onChange={(e) => {
                  const value =
                    e.target.value === "" ? 0 : Number(e.target.value);
                  onFormChange("cost", value);
                  if (errors.cost) setErrors({ ...errors, cost: undefined });
                }}
                placeholder="0.00"
                className={`pl-10 h-10 sm:h-12 text-sm sm:text-base ${
                  errors.cost ? "border-red-500" : ""
                }`}
              />
            </div>
            {errors.cost && (
              <p className="text-xs text-red-500 mt-1">{errors.cost}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:flex-1 h-10 sm:h-12"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="w-full sm:flex-1 h-10 sm:h-12"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Item"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Stage Selector Component
const StageSelector = ({
  itemId,
  category,
  onStageSelect,
  currentDepartment = "",
  isMobile = false,
}: {
  itemId: string;
  category: string;
  onStageSelect: (itemId: string, department: string) => void;
  currentDepartment?: string;
  isMobile?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!["upper", "component"].includes(category)) {
    return null;
  }

  const currentStage = STAGES.find(
    (stage) => stage.value === currentDepartment
  );

  const handleStageSelect = (department: string, label: string) => {
    setIsOpen(false);
    onStageSelect(itemId, department);
    toast.success(`Item will advance to ${label}`);
  };

  if (isMobile) {
    return (
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={`h-8 px-3 text-xs border min-w-[100px] ${
            currentDepartment
              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
              : "bg-gray-50 text-gray-600 border-gray-300"
          }`}
          title={
            currentDepartment
              ? `Selected: ${currentStage?.label}`
              : "Select stage"
          }
        >
          {currentDepartment ? (
            <>
              <ArrowRight className="w-3 h-3 mr-1" />
              {currentStage?.label.substring(0, 8)}
              {currentStage?.label.length > 8 ? "..." : ""}
            </>
          ) : (
            <>
              <Plus className="w-3 h-3 mr-1" />
              Stage
            </>
          )}
        </Button>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle>Select Department</SheetTitle>
              <SheetDescription>
                Choose a department to advance this item
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-2 max-h-[calc(70vh-120px)] overflow-y-auto">
              {STAGES.map((stage) => {
                const Icon = stage.icon;
                const isSelected = currentDepartment === stage.value;
                return (
                  <button
                    key={stage.value}
                    onClick={() => handleStageSelect(stage.value, stage.label)}
                    className={`w-full p-4 rounded-lg flex items-center gap-4 transition-all ${
                      isSelected
                        ? "bg-emerald-50 border-2 border-emerald-300"
                        : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <div className={`p-2 rounded-full ${stage.bgColor}`}>
                      <Icon className={`w-5 h-5 ${stage.color}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{stage.label}</div>
                      {isSelected && (
                        <div className="text-xs text-emerald-600 mt-1">
                          ✓ Currently selected
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-8 px-3 text-xs border min-w-[100px] ${
          currentDepartment
            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
            : "bg-gray-50 text-gray-600 border-gray-300"
        }`}
        title={
          currentDepartment
            ? `Selected: ${currentStage?.label}`
            : "Select stage"
        }
      >
        {currentDepartment ? (
          <>
            <ArrowRight className="w-3 h-3 mr-1" />
            {currentStage?.label.substring(0, 12)}
            {currentStage?.label.length > 12 ? "..." : ""}
          </>
        ) : (
          <>
            <Plus className="w-3 h-3 mr-1" />
            Stage
          </>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-100 py-2">
            <div className="px-3 py-2 border-b">
              <div className="text-xs font-semibold text-gray-600">
                Select Department
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Item will be tagged for this department
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {STAGES.map((stage) => {
                const Icon = stage.icon;
                const isSelected = currentDepartment === stage.value;
                return (
                  <button
                    key={stage.value}
                    onClick={() => handleStageSelect(stage.value, stage.label)}
                    className={`w-full px-3 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                      isSelected ? "bg-emerald-50" : ""
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${stage.color}`} />
                    <div className="flex-1">
                      <div className="text-sm">{stage.label}</div>
                      {isSelected && (
                        <div className="text-xs text-emerald-600 mt-0.5">
                          Currently selected
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>
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
  onUpdateItem,
  onUpdateConsumption,
  onUpdateCost,
  onDeleteItem,
  onAddItem,
  onStageSelect,
  color = "orange",
  isMobile = false,
}: {
  title: string;
  category: string;
  items: CostItem[];
  onUpdateItem: (itemId: string, field: string, value: string | number) => void;
  onUpdateConsumption: (itemId: string, consumption: number) => void;
  onUpdateCost: (itemId: string, cost: number) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: () => void;
  onStageSelect: (itemId: string, department: string) => void;
  color?: "orange" | "purple" | "teal" | "rose" | "gray" | "amber";
  isMobile?: boolean;
}) => {
  const colorClasses = useMemo(
    () => ({
      orange: {
        border: "border-orange-200",
        header: "bg-orange-50",
        icon: "text-orange-600",
        button: "text-orange-600 border-orange-200 hover:bg-orange-50",
        total: "bg-orange-50 text-orange-900",
        badge: "bg-orange-100 text-orange-700 border-orange-300",
      },
      purple: {
        border: "border-purple-200",
        header: "bg-purple-50",
        icon: "text-purple-600",
        button: "text-purple-600 border-purple-200 hover:bg-purple-50",
        total: "bg-purple-50 text-purple-900",
        badge: "bg-purple-100 text-purple-700 border-purple-300",
      },
      teal: {
        border: "border-teal-200",
        header: "bg-teal-50",
        icon: "text-teal-600",
        button: "text-teal-600 border-teal-200 hover:bg-teal-50",
        total: "bg-teal-50 text-teal-900",
        badge: "bg-teal-100 text-teal-700 border-teal-300",
      },
      rose: {
        border: "border-rose-200",
        header: "bg-rose-50",
        icon: "text-rose-600",
        button: "text-rose-600 border-rose-200 hover:bg-rose-50",
        total: "bg-rose-50 text-rose-900",
        badge: "bg-rose-100 text-rose-700 border-rose-300",
      },
      gray: {
        border: "border-gray-200",
        header: "bg-gray-50",
        icon: "text-gray-600",
        button: "text-gray-600 border-gray-200 hover:bg-gray-50",
        total: "bg-gray-50 text-gray-900",
        badge: "bg-gray-100 text-gray-700 border-gray-300",
      },
      amber: {
        border: "border-amber-200",
        header: "bg-amber-50",
        icon: "text-amber-600",
        button: "text-amber-600 border-amber-200 hover:bg-amber-50",
        total: "bg-amber-50 text-amber-900",
        badge: "bg-amber-100 text-amber-700 border-amber-300",
      },
    }),
    []
  );

  const currentColor = colorClasses[color];
  const safeItems = Array.isArray(items) ? items : [];

  // Calculate total cost from non-empty items (items with name or cost)
  const totalCost = safeItems.reduce((sum, item) => {
    if (item.item.trim() || item.cost > 0 || item.consumption > 0) {
      return sum + (Number(item.cost) || 0);
    }
    return sum;
  }, 0);

  const renderMobileView = () => (
    <Card className={`border-2 ${currentColor.border}`}>
      <CardHeader className={currentColor.header}>
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className={`w-4 h-4 ${currentColor.icon}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-4">
          <div className="space-y-3">
            {safeItems.map((item) => (
              <div
                key={item._id}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm mb-1">
                      <Input
                        value={item.item || ""}
                        onChange={(e) =>
                          onUpdateItem(item._id, "item", e.target.value)
                        }
                        placeholder="Enter item name"
                        className="text-sm h-7"
                      />
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      <Input
                        value={item.description || ""}
                        onChange={(e) =>
                          onUpdateItem(item._id, "description", e.target.value)
                        }
                        placeholder="Description (optional)"
                        className="text-xs h-6"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteItem(item._id)}
                      className="h-7 w-7 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {["upper", "component"].includes(category) && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 mb-1">
                        Department:
                      </span>
                      <StageSelector
                        itemId={item._id}
                        category={category}
                        onStageSelect={onStageSelect}
                        currentDepartment={item.department || ""}
                        isMobile={isMobile}
                      />
                    </div>
                    {item.department && (
                      <div className="mt-1 flex justify-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 h-4 ${currentColor.badge}`}
                        >
                          {STAGES.find((s) => s.value === item.department)
                            ?.label || item.department}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="text-gray-500">Consumption *</div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.consumption || ""}
                      onChange={(e) => {
                        const value =
                          e.target.value === "" ? 0 : Number(e.target.value);
                        onUpdateConsumption(item._id, value);
                      }}
                      className="h-7 text-xs px-2"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-gray-500">Cost *</div>
                    <div className="relative">
                      <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-2 h-2" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-7 text-xs pl-5"
                        value={item.cost || ""}
                        onChange={(e) =>
                          onUpdateCost(item._id, Number(e.target.value) || 0)
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className={`w-full ${currentColor.button} h-9`}
            onClick={onAddItem}
          >
            <Plus className="w-3 h-3 mr-2" />
            Add New Item
          </Button>

          <Separator />

          <div className={`p-3 rounded-lg ${currentColor.total}`}>
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Total {title}:</span>
              <span className="text-base font-bold">
                ₹{totalCost.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderDesktopView = () => (
    <Card className={`border-2 ${currentColor.border} h-[500px] flex flex-col`}>
      <CardHeader className={currentColor.header}>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className={`w-5 h-5 ${currentColor.icon}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-13 gap-2 bg-gray-100 p-2 rounded text-sm font-medium mb-2 flex-shrink-0">
            <div className="col-span-3 text-center">
              {category === "component"
                ? "COMPONENT"
                : category === "material"
                ? "MATERIAL"
                : category === "packaging"
                ? "PACKING"
                : "ITEM"}
            </div>
            <div className="col-span-3 text-center">DESCRIPTION</div>
            <div className="col-span-2 text-center">CONSUMPTION *</div>
            <div className="col-span-2 text-center">COST *</div>
            <div className="col-span-2 text-center">DEPARTMENT</div>
            <div className="col-span-1 text-center">ACTIONS</div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 space-y-2">
            {safeItems.map((item) => (
              <div
                key={item._id}
                className="grid grid-cols-13 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded"
              >
                <div className="col-span-3">
                  <Input
                    value={item.item || ""}
                    onChange={(e) =>
                      onUpdateItem(item._id, "item", e.target.value)
                    }
                    className="text-sm h-8"
                    placeholder="Enter item name"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    value={item.description || ""}
                    onChange={(e) =>
                      onUpdateItem(item._id, "description", e.target.value)
                    }
                    className="text-sm h-8"
                    placeholder="Description (optional)"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.consumption || ""}
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? 0 : Number(e.target.value);
                      onUpdateConsumption(item._id, value);
                    }}
                    className="text-sm h-8"
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-2">
                  <div className="relative">
                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.cost || ""}
                      onChange={(e) =>
                        onUpdateCost(item._id, Number(e.target.value) || 0)
                      }
                      className="pl-6 text-sm h-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex flex-col items-center gap-1">
                    <StageSelector
                      itemId={item._id}
                      category={category}
                      onStageSelect={onStageSelect}
                      currentDepartment={item.department || ""}
                    />
                    {item.department && (
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0 h-5 ${currentColor.badge}`}
                      >
                        {STAGES.find((s) => s.value === item.department)
                          ?.label || item.department}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="col-span-1 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteItem(item._id)}
                    className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-shrink-0 pt-4">
            <Button
              variant="outline"
              size="sm"
              className={`w-full ${currentColor.button}`}
              onClick={onAddItem}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Item
            </Button>

            <Separator className="my-4" />

            <div className={`p-3 rounded-lg ${currentColor.total}`}>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total {title}:</span>
                <span className="text-lg font-bold">
                  ₹{totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return isMobile ? renderMobileView() : renderDesktopView();
};

// Mobile Labour Cost Card
const MobileLabourCostCard = ({
  labourCost,
  onUpdateLabour,
  onDeleteLabourItem,
  onAddItem,
  isLoading = false,
}: {
  labourCost: LabourCost;
  onUpdateLabour: (updates: Partial<LabourCost>) => void;
  onDeleteLabourItem: (itemId: string) => void;
  onAddItem: () => void;
  isLoading?: boolean;
}) => {
  const [localLabourCost, setLocalLabourCost] =
    useState<LabourCost>(labourCost);

  // Update local state when prop changes
  useEffect(() => {
    setLocalLabourCost(labourCost);
  }, [labourCost]);

  // Debounced update function
  const handleDirectTotalChange = useCallback(
    (value: number) => {
      const newValue = Number(value) || 0;
      setLocalLabourCost((prev) => ({ ...prev, directTotal: newValue }));

      // Debounce the API call
      const timeoutId = setTimeout(() => {
        onUpdateLabour({ directTotal: newValue });
      }, 500);

      return () => clearTimeout(timeoutId);
    },
    [onUpdateLabour]
  );

  return (
    <Card className="border-2 border-amber-200">
      <CardHeader className="bg-amber-50">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber-600" />
          Labour Cost + OH
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-4">
          <div className="bg-amber-100 p-3 rounded-lg border-2 border-amber-300">
            <div className="flex justify-between items-center">
              <span className="font-medium text-amber-900 text-sm">
                Labour + OH Cost:
              </span>
              <div className="relative">
                <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-amber-600 w-3 h-3" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={localLabourCost.directTotal || 0}
                  onChange={(e) =>
                    handleDirectTotalChange(Number(e.target.value) || 0)
                  }
                  disabled={isLoading}
                  className="pl-7 text-base font-bold text-amber-900 bg-white border-amber-300 w-28 h-9"
                />
                {isLoading && (
                  <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-600 animate-spin" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {localLabourCost.items.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between border-b border-amber-100 pb-2"
              >
                <div className="flex-1">
                  <Input
                    value={item.name || ""}
                    onChange={(e) => {
                      const updatedItems = localLabourCost.items.map(
                        (labourItem) =>
                          labourItem._id === item._id
                            ? {
                                ...labourItem,
                                name: e.target.value,
                              }
                            : labourItem
                      );
                      setLocalLabourCost((prev) => ({
                        ...prev,
                        items: updatedItems,
                      }));
                      onUpdateLabour({ items: updatedItems });
                    }}
                    disabled={isLoading}
                    placeholder="Labour item name"
                    className="text-sm h-8"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.cost || 0}
                      onChange={(e) => {
                        const updatedItems = localLabourCost.items.map(
                          (labourItem) =>
                            labourItem._id === item._id
                              ? {
                                  ...labourItem,
                                  cost: Number(e.target.value) || 0,
                                }
                              : labourItem
                        );
                        setLocalLabourCost((prev) => ({
                          ...prev,
                          items: updatedItems,
                        }));
                        onUpdateLabour({ items: updatedItems });
                      }}
                      disabled={isLoading}
                      className="pl-7 text-sm h-8 w-24"
                      placeholder="0.00"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteLabourItem(item._id)}
                    disabled={isLoading}
                    className="h-7 w-7 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full text-amber-600 border-amber-200 hover:bg-amber-50 h-9"
            onClick={onAddItem}
            disabled={isLoading}
          >
            <Plus className="w-3 h-3 mr-2" />
            Add Labour Component
          </Button>

          <Separator />

          <div className="bg-amber-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-amber-900 text-sm">
                Total Labour Cost:
              </span>
              <span className="text-base font-bold text-amber-900">
                ₹{(localLabourCost.directTotal || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Desktop Labour Cost Card
const DesktopLabourCostCard = ({
  labourCost,
  onUpdateLabour,
  onDeleteLabourItem,
  onAddItem,
  isLoading = false,
}: {
  labourCost: LabourCost;
  onUpdateLabour: (updates: Partial<LabourCost>) => void;
  onDeleteLabourItem: (itemId: string) => void;
  onAddItem: () => void;
  isLoading?: boolean;
}) => {
  const [localLabourCost, setLocalLabourCost] =
    useState<LabourCost>(labourCost);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when prop changes
  useEffect(() => {
    setLocalLabourCost(labourCost);
  }, [labourCost]);

  // Debounced update function for directTotal
  const handleDirectTotalChange = useCallback(
    (value: number) => {
      const newValue = Number(value) || 0;
      setLocalLabourCost((prev) => ({ ...prev, directTotal: newValue }));

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout for API call
      debounceTimeoutRef.current = setTimeout(() => {
        onUpdateLabour({ directTotal: newValue });
      }, 800);
    },
    [onUpdateLabour]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Card className="border-2 border-amber-200 h-[500px] flex flex-col">
      <CardHeader className="bg-amber-50">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-600" />
          Labour Cost + OH Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="bg-amber-100 p-4 rounded-lg border-2 border-amber-300 mb-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-amber-900">
                Labour + OH Total Cost:
              </span>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={localLabourCost.directTotal || 0}
                  onChange={(e) =>
                    handleDirectTotalChange(Number(e.target.value) || 0)
                  }
                  disabled={isLoading}
                  className="pl-10 text-lg font-bold text-amber-900 bg-white border-amber-300 w-36 h-10"
                />
                {isLoading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-600 animate-spin" />
                )}
              </div>
            </div>
          </div>

          <h4 className="font-medium text-amber-900 mb-3">
            Individual Labour Components:
          </h4>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-amber-100 space-y-3 pr-2">
            {localLabourCost.items.map((item) => (
              <div
                key={item._id}
                className="grid grid-cols-[1fr_2fr_auto] gap-4 items-center border-b border-amber-100 pb-3 group hover:bg-amber-50/50 px-2 -mx-2 rounded transition-colors"
              >
                <div>
                  <Input
                    value={item.name || ""}
                    onChange={(e) => {
                      const updatedItems = localLabourCost.items.map(
                        (labourItem) =>
                          labourItem._id === item._id
                            ? {
                                ...labourItem,
                                name: e.target.value,
                              }
                            : labourItem
                      );
                      setLocalLabourCost((prev) => ({
                        ...prev,
                        items: updatedItems,
                      }));
                      onUpdateLabour({ items: updatedItems });
                    }}
                    disabled={isLoading}
                    placeholder="Labour item name"
                    className="text-sm h-9"
                  />
                </div>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.cost || 0}
                    onChange={(e) => {
                      const updatedItems = localLabourCost.items.map(
                        (labourItem) =>
                          labourItem._id === item._id
                            ? {
                                ...labourItem,
                                cost: Number(e.target.value) || 0,
                              }
                            : labourItem
                      );
                      setLocalLabourCost((prev) => ({
                        ...prev,
                        items: updatedItems,
                      }));
                      onUpdateLabour({ items: updatedItems });
                    }}
                    disabled={isLoading}
                    className="pl-8 text-sm h-9"
                    placeholder="0.00"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteLabourItem(item._id)}
                  disabled={isLoading}
                  className="h-9 w-9 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex-shrink-0 pt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-amber-600 border-amber-200 hover:bg-amber-50"
              onClick={onAddItem}
              disabled={isLoading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Labour Component
            </Button>

            <Separator className="my-4" />

            <div className="bg-amber-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-amber-900">
                  Total Labour Cost:
                </span>
                <span className="text-lg font-bold text-amber-900">
                  ₹{(localLabourCost.directTotal || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Component
export function TentativeCostDialog({
  open,
  onOpenChange,
  project,
  onApproved,
}: TentativeCostDialogProps) {
  const { updateRDProject } = useERPStore();
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileCategory, setActiveMobileCategory] = useState("upper");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [isSavingLabour, setIsSavingLabour] = useState<boolean>(false);

  // State management
  const [costRows, setCostRows] = useState<Record<string, CostItem[]>>({
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

  const [realTimeSummary, setRealTimeSummary] = useState<CostSummary | null>(
    null
  );
  const [addItemDialogs, setAddItemDialogs] = useState<Record<string, boolean>>(
    {
      upper: false,
      component: false,
      material: false,
      packaging: false,
      labour: false,
      miscellaneous: false,
    }
  );

  const [dialogForms, setDialogForms] = useState<Record<string, any>>({
    upper: { item: "", description: "", consumption: 0, cost: 0 },
    component: { item: "", description: "", consumption: 0, cost: 0 },
    material: { item: "", description: "", consumption: 0, cost: 0 },
    packaging: { item: "", description: "", consumption: 0, cost: 0 },
    labour: { item: "", description: "", consumption: 0, cost: 0 },
    miscellaneous: { item: "", description: "", consumption: 0, cost: 0 },
  });

  const { goTo } = useRedirect();
  const displaySummary = realTimeSummary || costSummary;

  // Check screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load all cost data from backend when dialog opens
  useEffect(() => {
    if (project && open && !dataLoaded) {
      loadAllCostData();
    }
  }, [project, open, dataLoaded]);

  // Reset data loaded state when dialog closes
  useEffect(() => {
    if (!open) {
      setDataLoaded(false);
      setRealTimeSummary(null);
      setActiveMobileCategory("upper");
      setIsSavingLabour(false);
    }
  }, [open]);

  // Ensure always 5 rows in each category
  useEffect(() => {
    if (dataLoaded) {
      maintainFiveRowsPerCategory();
      maintainFiveLabourItems();
    }
  }, [dataLoaded, costRows, labourCost]);

  const maintainFiveRowsPerCategory = useCallback(() => {
    setCostRows((prev) => {
      const updated: Record<string, CostItem[]> = { ...prev };
      Object.keys(updated).forEach((category) => {
        const currentItems = updated[category] || [];
        const existingItems = currentItems.filter((item) => !item.isNew);
        const dummyItems = currentItems.filter((item) => item.isNew);

        const totalItems = existingItems.length + dummyItems.length;
        const neededDummyRows = Math.max(
          0,
          TOTAL_ROWS_PER_CATEGORY - totalItems
        );

        if (neededDummyRows > 0) {
          const newDummyRows = getEmptyDummyRows(neededDummyRows, category);
          updated[category] = [
            ...existingItems,
            ...dummyItems,
            ...newDummyRows,
          ];
        } else if (totalItems > TOTAL_ROWS_PER_CATEGORY) {
          // If we have more than 5 items, keep all existing items and remove excess dummy items
          const excessDummyCount = totalItems - TOTAL_ROWS_PER_CATEGORY;
          const dummyToKeep = dummyItems.slice(
            0,
            Math.max(0, dummyItems.length - excessDummyCount)
          );
          updated[category] = [...existingItems, ...dummyToKeep];
        }
      });
      return updated;
    });
  }, []);

  const maintainFiveLabourItems = useCallback(() => {
    setLabourCost((prev) => {
      const existingItems = prev.items.filter((item) => !item.isNew);
      const dummyItems = prev.items.filter((item) => item.isNew);

      const totalItems = existingItems.length + dummyItems.length;
      const neededDummyRows = Math.max(0, TOTAL_ROWS_PER_CATEGORY - totalItems);

      if (neededDummyRows > 0) {
        const newDummyRows = getEmptyLabourItems(neededDummyRows);
        return {
          ...prev,
          items: [...existingItems, ...dummyItems, ...newDummyRows],
        };
      } else if (totalItems > TOTAL_ROWS_PER_CATEGORY) {
        // If we have more than 5 items, keep all existing items and remove excess dummy items
        const excessDummyCount = totalItems - TOTAL_ROWS_PER_CATEGORY;
        const dummyToKeep = dummyItems.slice(
          0,
          Math.max(0, dummyItems.length - excessDummyCount)
        );
        return {
          ...prev,
          items: [...existingItems, ...dummyToKeep],
        };
      }
      return prev;
    });
  }, []);

  const loadAllCostData = async () => {
    if (!project) return;

    setIsLoading(true);
    try {
      const [summaryResponse, ...rowResponses] = await Promise.all([
        api.get(`/projects/${project._id}/costs`),
        ...["upper", "component", "material", "packaging", "miscellaneous"].map(
          (section) => api.get(`/projects/${project._id}/costs/${section}`)
        ),
        api.get(`/projects/${project._id}/costs/labour`),
      ]);

      // Process summary
      const summaryData = summaryResponse.data.summary || summaryResponse.data;
      if (summaryData) {
        setCostSummary(processSummaryData(summaryData));
      }

      // Process cost rows - always ensure we have 5 total rows per category
      const newCostRows: Record<string, CostItem[]> = {};
      const sections = [
        "upper",
        "component",
        "material",
        "packaging",
        "miscellaneous",
      ];

      sections.forEach((section, index) => {
        const rows = rowResponses[index]?.data?.rows;
        const existingItems = Array.isArray(rows)
          ? rows.map(processCostItem)
          : [];

        // Add empty dummy rows to make total of 5 rows
        const neededDummyRows = Math.max(
          0,
          TOTAL_ROWS_PER_CATEGORY - existingItems.length
        );
        const dummyRows = getEmptyDummyRows(neededDummyRows, section);

        newCostRows[section] = [...existingItems, ...dummyRows];
      });

      setCostRows(newCostRows);

      // Process labour cost - always ensure 5 total items
      const labourData = rowResponses[5]?.data?.labour || rowResponses[5]?.data;
      let labourItems: LabourCost["items"] = [];

      if (labourData && Array.isArray(labourData.items)) {
        labourItems = labourData.items.map((item: any) => ({
          _id: item._id || `labour_${Date.now()}_${Math.random()}`,
          name: item.name || "",
          cost: Number(item.cost) || 0,
        }));
      }

      // Add empty dummy items to make total of 5 items
      const neededLabourDummyItems = Math.max(
        0,
        TOTAL_ROWS_PER_CATEGORY - labourItems.length
      );
      const labourDummyItems = getEmptyLabourItems(neededLabourDummyItems);

      setLabourCost({
        directTotal: Number(labourData?.directTotal) || 0,
        items: [...labourItems, ...labourDummyItems],
      });

      setDataLoaded(true);
    } catch (error) {
      console.error("Failed to load cost data:", error);
      toast.error("Failed to load cost data. Starting with empty rows.");

      // Initialize with 5 empty rows per category
      const emptyCostRows: Record<string, CostItem[]> = {};
      sections.forEach((section) => {
        emptyCostRows[section] = getEmptyDummyRows(
          TOTAL_ROWS_PER_CATEGORY,
          section
        );
      });

      setCostRows(emptyCostRows);
      setLabourCost({
        directTotal: 0,
        items: getEmptyLabourItems(TOTAL_ROWS_PER_CATEGORY),
      });

      setDataLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  const sections = [
    "upper",
    "component",
    "material",
    "packaging",
    "miscellaneous",
  ];

  const processSummaryData = (data: any): CostSummary => ({
    additionalCosts: Number(data.additionalCosts) || 0,
    profitMargin:
      data.profitMargin === undefined || data.profitMargin === null
        ? 0
        : Number(data.profitMargin),
    remarks: data.remarks || "",
    upperTotal: Number(data.upperTotal) || 0,
    componentTotal: Number(data.componentTotal) || 0,
    materialTotal: Number(data.materialTotal) || 0,
    packagingTotal: Number(data.packagingTotal) || 0,
    miscTotal: Number(data.miscTotal) || 0,
    labourTotal: Number(data.labourTotal) || 0,
    totalAllCosts: Number(data.totalAllCosts) || 0,
    profitAmount: Number(data.profitAmount) || 0,
    tentativeCost: Number(data.tentativeCost) || 0,
    status: data.status || "draft",
  });

  const processCostItem = (item: any): CostItem => ({
    _id: item._id || `item_${Date.now()}_${Math.random()}`,
    item: item.item || "",
    description: item.description || "",
    consumption: Number(item.consumption) || 0,
    cost: Number(item.cost) || 0,
    department: item.department || "",
    isNew: false,
  });

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  // Local update functions for immediate UI changes
  const updateLocalItem = useCallback(
    (
      category: string,
      itemId: string,
      field: string,
      value: string | number
    ) => {
      setCostRows((prev) => ({
        ...prev,
        [category]: prev[category].map((item) =>
          item._id === itemId ? { ...item, [field]: value } : item
        ),
      }));
    },
    []
  );

  const updateLocalConsumption = useCallback(
    (category: string, itemId: string, consumption: number) => {
      updateLocalItem(category, itemId, "consumption", consumption);

      // Update category total
      const categoryItems = costRows[category] || [];
      const categoryTotal = categoryItems.reduce((sum, item) => {
        if (item.item.trim() || item.cost > 0 || item.consumption > 0) {
          return sum + (Number(item.cost) || 0);
        }
        return sum;
      }, 0);

      updateCategoryTotal(category, categoryTotal);
    },
    [costRows, updateLocalItem]
  );

  const updateLocalCost = useCallback(
    (category: string, itemId: string, cost: number) => {
      updateLocalItem(category, itemId, "cost", cost);

      // Update category total
      const categoryItems = costRows[category] || [];
      const categoryTotal = categoryItems.reduce((sum, item) => {
        if (item.item.trim() || item.cost > 0 || item.consumption > 0) {
          return sum + (Number(item.cost) || 0);
        }
        return sum;
      }, 0);

      updateCategoryTotal(category, categoryTotal);
    },
    [costRows, updateLocalItem]
  );

  const updateCategoryTotal = useCallback((category: string, total: number) => {
    setCostSummary((prev) => {
      const newSummary = { ...prev };
      switch (category) {
        case "upper":
          newSummary.upperTotal = total;
          break;
        case "component":
          newSummary.componentTotal = total;
          break;
        case "material":
          newSummary.materialTotal = total;
          break;
        case "packaging":
          newSummary.packagingTotal = total;
          break;
        case "miscellaneous":
          newSummary.miscTotal = total;
          break;
      }

      // Recalculate totals
      const totalAllCosts =
        newSummary.upperTotal +
        newSummary.componentTotal +
        newSummary.materialTotal +
        newSummary.packagingTotal +
        newSummary.miscTotal +
        newSummary.labourTotal;

      const subtotalBeforeProfit = totalAllCosts + newSummary.additionalCosts;
      const profitAmount = Math.round(
        (subtotalBeforeProfit * (Number(newSummary.profitMargin) || 25)) / 100
      );
      const tentativeCost = subtotalBeforeProfit + profitAmount;

      return {
        ...newSummary,
        totalAllCosts,
        profitAmount,
        tentativeCost,
      };
    });
  }, []);

  const updateItemCost = useCallback(
    async (itemId: string, cost: number) => {
      if (!project) return;

      const section = findItemSection(itemId);
      if (!section) {
        // Update locally for dummy items
        const category = Object.keys(costRows).find((cat) =>
          costRows[cat].some((item) => item._id === itemId)
        );
        if (category) {
          updateLocalCost(category, itemId, cost);
        }
        return;
      }

      try {
        await api.patch(`/projects/${project._id}/costs/${section}/${itemId}`, {
          cost: Number(cost) || 0,
        });

        updateLocalCost(section, itemId, cost);
      } catch (error) {
        console.error("Failed to update item cost:", error);
        toast.error("Failed to update item cost");
      }
    },
    [project, costRows, updateLocalCost]
  );

  const updateItemConsumption = useCallback(
    async (itemId: string, consumption: number) => {
      if (!project) return;

      const section = findItemSection(itemId);
      if (!section) {
        // Update locally for dummy items
        const category = Object.keys(costRows).find((cat) =>
          costRows[cat].some((item) => item._id === itemId)
        );
        if (category) {
          updateLocalConsumption(category, itemId, consumption);
        }
        return;
      }

      try {
        await api.patch(`/projects/${project._id}/costs/${section}/${itemId}`, {
          consumption: Number(consumption) || 0,
        });

        updateLocalConsumption(section, itemId, consumption);
      } catch (error) {
        console.error("Failed to update item consumption:", error);
        toast.error("Failed to update item consumption");
      }
    },
    [project, costRows, updateLocalConsumption]
  );

  const updateItemField = useCallback(
    async (itemId: string, field: string, value: string | number) => {
      if (!project) return;

      const section = findItemSection(itemId);
      if (!section) {
        // Update locally for dummy items
        const category = Object.keys(costRows).find((cat) =>
          costRows[cat].some((item) => item._id === itemId)
        );
        if (category) {
          updateLocalItem(category, itemId, field, value);
        }
        return;
      }

      try {
        await api.patch(`/projects/${project._id}/costs/${section}/${itemId}`, {
          [field]: value,
        });

        updateLocalItem(section, itemId, field, value);
      } catch (error) {
        console.error(`Failed to update item ${field}:`, error);
        toast.error(`Failed to update item ${field}`);
      }
    },
    [project, costRows, updateLocalItem]
  );

  const findItemSection = useCallback(
    (itemId: string): string | null => {
      for (const [section, items] of Object.entries(costRows)) {
        const item = items.find((item) => item._id === itemId);
        if (item && !item.isNew) {
          return section;
        }
      }
      return null;
    },
    [costRows]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      if (!project) return;

      const section = findItemSection(itemId);
      if (!section) {
        // Delete locally for dummy items
        const category = Object.keys(costRows).find((cat) =>
          costRows[cat].some((item) => item._id === itemId)
        );
        if (category) {
          setCostRows((prev) => ({
            ...prev,
            [category]: prev[category].filter((item) => item._id !== itemId),
          }));

          // After deleting, ensure we still have 5 rows
          setTimeout(() => maintainFiveRowsPerCategory(), 0);

          toast.success("Item removed");
        }
        return;
      }

      try {
        await api.delete(`/projects/${project._id}/costs/${section}/${itemId}`);

        setCostRows((prev) => ({
          ...prev,
          [section]: prev[section].filter((item) => item._id !== itemId),
        }));

        // After deleting, ensure we still have 5 rows
        setTimeout(() => maintainFiveRowsPerCategory(), 0);

        await loadSummary();
        toast.success("Item deleted successfully");
      } catch (error) {
        console.error("Failed to delete item:", error);
        toast.error("Failed to delete item");
      }
    },
    [project, findItemSection, costRows, maintainFiveRowsPerCategory]
  );

  const setItemDepartment = useCallback(
    async (itemId: string, department: string) => {
      if (!project) return;

      // Find the item and check if it's saved
      const section = findItemSection(itemId);
      const item = costRows[section]?.find((item) => item._id === itemId);
      const isDummyItem = item?.isNew;
      const hasRequiredFields =
        item?.item?.trim() && (item?.cost > 0 || item?.consumption > 0);

      if (isDummyItem && !hasRequiredFields) {
        // For unsaved (dummy) items that don't have required fields, show warning
        toast.warning(
          "Please fill in item details before assigning department",
          {
            description:
              "Enter item name and cost/consumption, then save before assigning department.",
            duration: 5000,
          }
        );

        // Still update UI locally so user can see their selection
        setCostRows((prev) => ({
          ...prev,
          [section]: prev[section].map((item) =>
            item._id === itemId ? { ...item, department } : item
          ),
        }));
        return;
      }

      if (!section || !["upper", "component"].includes(section)) {
        toast.error(
          "Department tagging only allowed for upper and component items"
        );
        return;
      }

      try {
        // If it's a dummy item with required fields, save it first
        if (isDummyItem && hasRequiredFields) {
          await handleAddItemFromExisting(itemId, section, item);
        }

        // Now update the department
        await api.patch(
          `/projects/${project._id}/costs/${section}/${itemId}/department`,
          { department }
        );

        setCostRows((prev) => ({
          ...prev,
          [section]: prev[section].map((item) =>
            item._id === itemId ? { ...item, department } : item
          ),
        }));

        const stageLabel =
          STAGES.find((s) => s.value === department)?.label || department;
        toast.success(`Department updated to ${stageLabel}`);
      } catch (error) {
        console.error("Failed to update department:", error);
        toast.error("Failed to update department");
      }
    },
    [project, findItemSection, costRows]
  );

  const handleAddItemFromExisting = async (
    itemId: string,
    section: string,
    itemData: CostItem
  ) => {
    if (!project) return;

    try {
      const payload = {
        item: itemData.item.trim(),
        description: itemData.description || "",
        consumption: Number(itemData.consumption) || 0,
        cost: Number(itemData.cost) || 0,
      };

      const response = await api.post(
        `/projects/${project._id}/costs/${section}`,
        payload
      );

      if (response.data.row) {
        setCostRows((prev) => {
          const updatedItems = prev[section].map((item) =>
            item._id === itemId
              ? {
                  ...item,
                  _id: response.data.row._id,
                  isNew: false,
                }
              : item
          );

          return { ...prev, [section]: updatedItems };
        });

        return response.data.row._id; // Return the new ID
      }
    } catch (error) {
      console.error("Failed to save item:", error);
      toast.error("Failed to save item");
      throw error;
    }
  };

  const loadSummary = useCallback(async () => {
    if (!project) return;

    try {
      const response = await api.get(`/projects/${project._id}/costs`);
      const summaryData = response.data.summary || response.data;

      if (summaryData) {
        setCostSummary(processSummaryData(summaryData));
        setRealTimeSummary(null);
      }
    } catch (error) {
      console.error("Failed to load summary:", error);
    }
  }, [project]);

  const openAddItemDialog = useCallback((category: string) => {
    setAddItemDialogs((prev) => ({ ...prev, [category]: true }));
    setDialogForms((prev) => ({
      ...prev,
      [category]: { item: "", description: "", consumption: 0, cost: 0 },
    }));
  }, []);

  const closeAddItemDialog = useCallback((category: string) => {
    setAddItemDialogs((prev) => ({ ...prev, [category]: false }));
  }, []);

  const updateDialogForm = useCallback(
    (category: string, field: string, value: string | number) => {
      setDialogForms((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: value,
        },
      }));
    },
    []
  );

  const handleAddNewItem = useCallback(
    async (category: string) => {
      if (!project) return;

      const currentForm = dialogForms[category];
      if (!validateItemForm(currentForm)) return;

      try {
        const payload = {
          item: currentForm.item.trim(),
          description: currentForm.description || "",
          consumption: Number(currentForm.consumption) || 0,
          cost: Number(currentForm.cost) || 0,
        };

        const response = await api.post(
          `/projects/${project._id}/costs/${category}`,
          payload
        );

        if (response.data.row) {
          setCostRows((prev) => {
            const updatedItems = [
              ...prev[category],
              {
                _id: response.data.row._id,
                item: response.data.row.item || "",
                description: response.data.row.description || "",
                consumption: Number(response.data.row.consumption) || 0,
                cost: Number(response.data.row.cost) || 0,
                department: response.data.row.department || "",
                isNew: false,
              },
            ];

            // Remove one dummy item to maintain 5 rows total
            const dummyItems = updatedItems.filter((item) => item.isNew);
            if (dummyItems.length > 0) {
              const itemToRemove = dummyItems[0]._id;
              return {
                ...prev,
                [category]: updatedItems.filter(
                  (item) => item._id !== itemToRemove
                ),
              };
            }

            return { ...prev, [category]: updatedItems };
          });
        }

        await loadSummary();
        closeAddItemDialog(category);
        toast.success(`New ${category} item added successfully!`);
      } catch (error) {
        console.error("Failed to add item:", error);
        toast.error("Failed to add item");
      }
    },
    [project, dialogForms, closeAddItemDialog]
  );

  const validateItemForm = (form: any): boolean => {
    if (!form.item.trim()) {
      toast.error("Please enter an item name");
      return false;
    }

    if (form.consumption < 0) {
      toast.error("Consumption cannot be negative");
      return false;
    }

    if (form.cost < 0) {
      toast.error("Cost cannot be negative");
      return false;
    }

    return true;
  };

  const updateLabourCost = useCallback(
    async (updates: Partial<LabourCost>) => {
      if (!project) return;

      setIsSavingLabour(true);
      try {
        // Clean items before sending
        const cleanItems = (updates.items || labourCost.items)
          .filter((i) => i.name.trim() || i.cost > 0)
          .map((i) => ({
            _id: i.isNew ? undefined : i._id,
            name: i.name.trim() || "Labour Component",
            cost: Number(i.cost) || 0,
          }));

        const payload = {
          directTotal:
            updates.directTotal !== undefined
              ? updates.directTotal
              : labourCost.directTotal,
          items: cleanItems,
        };

        const response = await api.patch(
          `/projects/${project._id}/costs/labour`,
          payload
        );

        if (response.data.labour) {
          const updatedLabour = response.data.labour;
          setLabourCost({
            directTotal: updatedLabour.directTotal,
            items: updatedLabour.items.map((it: any) => ({
              _id: it._id,
              name: it.name,
              cost: it.cost,
              isNew: false,
            })),
          });

          // Ensure we have 5 items
          setTimeout(() => maintainFiveLabourItems(), 100);

          // Update summary
          await loadSummary();
        }
      } catch (error) {
        console.error("Failed to update labour:", error);
        toast.error("Failed to update labour cost");
      } finally {
        setIsSavingLabour(false);
      }
    },
    [project, labourCost, maintainFiveLabourItems, loadSummary]
  );

  const updateLabourItem = useCallback(
    (itemId: string, field: string, value: string | number) => {
      setLabourCost((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item._id === itemId ? { ...item, [field]: value } : item
        ),
      }));
    },
    []
  );

  const deleteLabourItem = useCallback(
    (itemId: string) => {
      setLabourCost((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item._id !== itemId),
      }));

      // After deleting, ensure we still have 5 items
      setTimeout(() => maintainFiveLabourItems(), 0);

      toast.success("Labour item removed");
    },
    [maintainFiveLabourItems]
  );

  const handleAdditionalCostsChange = useCallback(
    (value: number) => {
      const newAdditionalCosts = Number(value) || 0;
      const newProfitMargin = costSummary.profitMargin || 25;

      const totalAllCosts =
        costSummary.upperTotal +
        costSummary.componentTotal +
        costSummary.materialTotal +
        costSummary.packagingTotal +
        costSummary.miscTotal +
        costSummary.labourTotal;

      const subtotalBeforeProfit = totalAllCosts + newAdditionalCosts;
      const profitAmount =
        (subtotalBeforeProfit * Number(newProfitMargin)) / 100;
      const tentativeCost = subtotalBeforeProfit + profitAmount;

      setRealTimeSummary({
        ...costSummary,
        additionalCosts: newAdditionalCosts,
        profitMargin: newProfitMargin,
        totalAllCosts,
        profitAmount,
        tentativeCost,
      });

      setCostSummary((prev) => ({
        ...prev,
        additionalCosts: newAdditionalCosts,
      }));
    },
    [costSummary]
  );

  const handleProfitMarginChange = useCallback(
    (raw: string) => {
      let value = Number(raw);
      if (raw.trim() === "" || isNaN(value)) {
        value = 0;
      }
      value = Math.max(0, Math.min(value, 100));

      const newProfitMargin = value;
      const newAdditionalCosts = costSummary.additionalCosts || 0;

      const totalAllCosts =
        costSummary.upperTotal +
        costSummary.componentTotal +
        costSummary.materialTotal +
        costSummary.packagingTotal +
        costSummary.miscTotal +
        costSummary.labourTotal;

      const subtotal = totalAllCosts + newAdditionalCosts;
      const profitAmount = Math.round((subtotal * newProfitMargin) / 100);
      const tentativeCost = subtotal + profitAmount;

      setRealTimeSummary({
        ...costSummary,
        profitMargin: newProfitMargin,
        totalAllCosts,
        profitAmount,
        tentativeCost,
      });

      setCostSummary((prev) => ({
        ...prev,
        profitMargin: newProfitMargin,
      }));
    },
    [costSummary]
  );

  const handleRemarksChange = useCallback(
    (value: string) => {
      setCostSummary((prev) => ({
        ...prev,
        remarks: value,
      }));

      if (realTimeSummary) {
        setRealTimeSummary((prev) => ({
          ...prev!,
          remarks: value,
        }));
      }
    },
    [realTimeSummary]
  );

  const hasUnsavedChanges = useCallback(() => {
    // Check for unsaved dummy rows
    const hasUnsavedRows = Object.values(costRows).some((items) =>
      items.some(
        (item) =>
          item.isNew &&
          (item.item.trim() || item.cost > 0 || item.consumption > 0)
      )
    );

    // Check for unsaved labour items
    const hasUnsavedLabour = labourCost.items.some(
      (item) => item.isNew && (item.name.trim() || item.cost > 0)
    );

    return hasUnsavedRows || hasUnsavedLabour;
  }, [costRows, labourCost]);

  const handleSaveSummary = useCallback(async () => {
    if (!project) return;

    setIsLoading(true);

    try {
      // Save all filled dummy rows
      await saveAllFilledDummyRows();

      const payload = {
        additionalCosts: Number(costSummary.additionalCosts) || 0,
        profitMargin: Number(costSummary.profitMargin) || 0,
        remarks: costSummary.remarks || "",
      };

      const response = await api.patch(
        `/projects/${project._id}/costs`,
        payload
      );

      if (response.data?.summary) {
        setCostSummary(processSummaryData(response.data.summary));
        setRealTimeSummary(null);
      }

      toast.success("All data saved successfully!");
    } catch (error: any) {
      console.error("❌ Failed to save data:", error);
      toast.error(
        `Failed to save data: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsLoading(false);
    }
  }, [project, costSummary]);

  const saveAllFilledDummyRows = useCallback(async () => {
    if (!project) return;

    const savePromises: Promise<any>[] = [];

    /* ---------------------------------------------------------
     * 1️⃣ SAVE COST ROWS (upper, component, material, etc.)
     * --------------------------------------------------------- */
    Object.entries(costRows).forEach(([category, items]) => {
      const dummyItemsToSave = items.filter(
        (item) =>
          item.isNew &&
          (item.item.trim() || item.cost > 0 || item.consumption > 0)
      );

      dummyItemsToSave.forEach((item) => {
        savePromises.push(
          api
            .post(`/projects/${project._id}/costs/${category}`, {
              item: item.item.trim() || "Unnamed Item",
              description: item.description || "",
              consumption: Number(item.consumption) || 0,
              cost: Number(item.cost) || 0,
            })
            .then((response) => {
              const newId = response.data.row?._id;

              // Update UI state safely
              setCostRows((prev) => ({
                ...prev,
                [category]: prev[category].map((i) =>
                  i._id === item._id
                    ? {
                        ...i,
                        _id: newId,
                        isNew: false,
                        item: item.item.trim(),
                      }
                    : i
                ),
              }));
            })
            .catch((error) => {
              console.error(`Failed to save ${category} item:`, error);
              toast.error(`Failed to save ${category} item: ${item.item}`);
            })
        );
      });
    });

    /* ---------------------------------------------------------
     * 2️⃣ SAVE LABOUR ITEMS
     * --------------------------------------------------------- */
    const labourItemsToSave = labourCost.items.filter(
      (item) => item.isNew && (item.name.trim() || item.cost > 0)
    );

    if (labourItemsToSave.length > 0 || labourCost.directTotal !== 0) {
      const cleanLabourItems = labourCost.items
        .filter((i) => i.name.trim() || i.cost > 0)
        .map((i) => ({
          _id: i.isNew ? undefined : i._id,
          name: i.name.trim() || "Labour Component",
          cost: Number(i.cost) || 0,
        }));

      savePromises.push(
        api
          .patch(`/projects/${project._id}/costs/labour`, {
            directTotal: labourCost.directTotal,
            items: cleanLabourItems,
          })
          .then((res) => {
            const updated = res.data.labour;

            // Replace UI with fresh backend data
            setLabourCost({
              directTotal: updated.directTotal,
              items: updated.items.map((it: any) => ({
                _id: it._id,
                name: it.name,
                cost: it.cost,
                isNew: false,
              })),
            });
          })
          .catch((error) => {
            console.error("Failed to save labour:", error);
            toast.error("Failed to save labour items");
          })
      );
    }

    /* ---------------------------------------------------------
     * 3️⃣ EXECUTE ALL SAVES
     * --------------------------------------------------------- */
    if (savePromises.length > 0) {
      await Promise.all(savePromises);
      await loadSummary();
      toast.success("All new items saved successfully!");
    }
  }, [project, costRows, labourCost, loadSummary]);

  const handleApprove = useCallback(async () => {
    if (!project) return;

    try {
      // Save all unsaved changes first
      if (hasUnsavedChanges()) {
        await handleSaveSummary();
      }

      await api.post(`/projects/${project._id}/costs/approve`);

      toast.success("Tentative cost saved and approved! Moving to Red Seal.");

      const updatedProject = {
        ...project,
        finalCost: costSummary.tentativeCost,
        remarks: costSummary.remarks,
      };

      updateRDProject(project._id, updatedProject as any);

      setTimeout(() => {
        onApproved();
        onOpenChange(false);
      }, 500);

      goTo("rd-management", "red-seal");
    } catch (error) {
      console.error("❌ Failed to approve:", error);
      toast.error("Failed to approve cost");
    }
  }, [
    project,
    handleSaveSummary,
    costSummary,
    updateRDProject,
    onApproved,
    onOpenChange,
    goTo,
    hasUnsavedChanges,
  ]);

  const renderMobileContent = useMemo(() => {
    const categoryComponents: Record<string, JSX.Element> = {
      upper: (
        <CostCategoryCard
          key="upper-mobile"
          title="Upper Cost"
          category="upper"
          items={costRows.upper}
          onUpdateItem={updateItemField}
          onUpdateConsumption={updateItemConsumption}
          onUpdateCost={updateItemCost}
          onDeleteItem={deleteItem}
          onAddItem={() => openAddItemDialog("upper")}
          onStageSelect={setItemDepartment}
          color="orange"
          isMobile={true}
        />
      ),
      component: (
        <CostCategoryCard
          key="component-mobile"
          title="Component Cost"
          category="component"
          items={costRows.component}
          onUpdateItem={updateItemField}
          onUpdateConsumption={updateItemConsumption}
          onUpdateCost={updateItemCost}
          onDeleteItem={deleteItem}
          onAddItem={() => openAddItemDialog("component")}
          onStageSelect={setItemDepartment}
          color="purple"
          isMobile={true}
        />
      ),
      material: (
        <CostCategoryCard
          key="material-mobile"
          title="Material Cost"
          category="material"
          items={costRows.material}
          onUpdateItem={updateItemField}
          onUpdateConsumption={updateItemConsumption}
          onUpdateCost={updateItemCost}
          onDeleteItem={deleteItem}
          onAddItem={() => openAddItemDialog("material")}
          onStageSelect={setItemDepartment}
          color="teal"
          isMobile={true}
        />
      ),
      packaging: (
        <CostCategoryCard
          key="packaging-mobile"
          title="Packaging Cost"
          category="packaging"
          items={costRows.packaging}
          onUpdateItem={updateItemField}
          onUpdateConsumption={updateItemConsumption}
          onUpdateCost={updateItemCost}
          onDeleteItem={deleteItem}
          onAddItem={() => openAddItemDialog("packaging")}
          onStageSelect={setItemDepartment}
          color="rose"
          isMobile={true}
        />
      ),
      misc: (
        <CostCategoryCard
          key="miscellaneous-mobile"
          title="Miscellaneous Cost"
          category="miscellaneous"
          items={costRows.miscellaneous}
          onUpdateItem={updateItemField}
          onUpdateConsumption={updateItemConsumption}
          onUpdateCost={updateItemCost}
          onDeleteItem={deleteItem}
          onAddItem={() => openAddItemDialog("miscellaneous")}
          onStageSelect={setItemDepartment}
          color="gray"
          isMobile={true}
        />
      ),
      labour: (
        <MobileLabourCostCard
          labourCost={labourCost}
          onUpdateLabour={updateLabourCost}
          onDeleteLabourItem={deleteLabourItem}
          onAddItem={() => openAddItemDialog("labour")}
          isLoading={isSavingLabour}
        />
      ),
    };

    return categoryComponents[activeMobileCategory];
  }, [
    activeMobileCategory,
    costRows,
    labourCost,
    updateItemField,
    updateItemConsumption,
    updateItemCost,
    deleteItem,
    openAddItemDialog,
    setItemDepartment,
    updateLabourCost,
    deleteLabourItem,
    isSavingLabour,
  ]);

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`
          ${
            isMobile
              ? "max-w-[95vw]! w-[95vw]! max-h-[95vh] top-[2.5vh] translate-y-0"
              : "max-w-[85vw]! w-[85vw]! max-h-[90vh] top-[5vh] translate-y-0"
          } overflow-hidden p-0 m-0 flex flex-col
        `}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b border-blue-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <Calculator className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 truncate">
                  Tentative Cost Calculation
                </DialogTitle>
                <DialogDescription className="text-xs md:text-sm text-gray-600 mt-1 truncate">
                  Calculate production cost for {project.autoCode}
                  {isLoading && " (Loading...)"}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <Button
                onClick={handleSaveSummary}
                variant="outline"
                disabled={isLoading || isSavingLabour}
                size={isMobile ? "sm" : "default"}
                className="text-xs md:text-sm"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                )}
                {isMobile ? "Save All" : "Save All Data"}
              </Button>
              <Button
                onClick={handleApprove}
                className="bg-[rgba(0,188,125,1)] hover:bg-green-600"
                disabled={
                  displaySummary.tentativeCost === 0 ||
                  isLoading ||
                  isSavingLabour
                }
                size={isMobile ? "sm" : "default"}
              >
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                {isMobile ? "Approve" : "Approve & Proceed"}
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 md:h-10 md:w-10 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges() && (
          <div className="sticky top-[72px] md:top-[84px] z-40 bg-amber-50 border-y border-amber-200 px-4 py-2">
            <div className="flex items-center justify-center gap-2 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs md:text-sm">
                You have unsaved changes. Save before assigning departments.
              </span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !dataLoaded && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading cost data...</p>
            </div>
          </div>
        )}

        {/* Content when loaded */}
        {(!isLoading || dataLoaded) && (
          <>
            {/* Mobile Category Selector */}
            {isMobile && (
              <MobileCategorySelector
                activeCategory={activeMobileCategory}
                onSelectCategory={setActiveMobileCategory}
              />
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="p-3 md:p-4 lg:p-6 space-y-4 md:space-y-6">
                {isMobile ? (
                  <>
                    {renderMobileContent}

                    {/* Mobile Cost Summary */}
                    <Card className="border-2 border-green-200">
                      <CardHeader className="bg-green-50">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-green-600" />
                          Cost Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 space-y-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Additional Costs
                            </Label>
                            <div className="relative mt-1">
                              <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={displaySummary.additionalCosts || 0}
                                onChange={(e) =>
                                  handleAdditionalCostsChange(
                                    Number(e.target.value)
                                  )
                                }
                                className="pl-8 h-9 text-sm"
                                placeholder="Additional costs"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Profit Margin (%)
                            </Label>
                            <div className="relative mt-1">
                              <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={displaySummary.profitMargin ?? 0}
                                onChange={(e) =>
                                  handleProfitMarginChange(e.target.value)
                                }
                                className="pl-8 h-9 text-sm"
                                placeholder="Profit margin %"
                              />
                            </div>
                          </div>

                          <Separator />

                          {/* Mobile Cost Breakdown */}
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="text-xs text-gray-600">
                                Upper Cost:
                              </div>
                              <div className="text-xs font-medium text-right">
                                {formatCurrency(displaySummary.upperTotal || 0)}
                              </div>
                              <div className="text-xs text-gray-600">
                                Component Cost:
                              </div>
                              <div className="text-xs font-medium text-right">
                                {formatCurrency(
                                  displaySummary.componentTotal || 0
                                )}
                              </div>
                              <div className="text-xs text-gray-600">
                                Material Cost:
                              </div>
                              <div className="text-xs font-medium text-right">
                                {formatCurrency(
                                  displaySummary.materialTotal || 0
                                )}
                              </div>
                              <div className="text-xs text-gray-600">
                                Packaging Cost:
                              </div>
                              <div className="text-xs font-medium text-right">
                                {formatCurrency(
                                  displaySummary.packagingTotal || 0
                                )}
                              </div>
                              <div className="text-xs text-gray-600">
                                Misc Cost:
                              </div>
                              <div className="text-xs font-medium text-right">
                                {formatCurrency(displaySummary.miscTotal || 0)}
                              </div>
                              <div className="text-xs text-gray-600">
                                Labour Cost:
                              </div>
                              <div className="text-xs font-medium text-right">
                                {formatCurrency(
                                  displaySummary.labourTotal || 0
                                )}
                              </div>
                            </div>

                            <Separator />

                            <div className="flex justify-between text-sm font-medium bg-blue-50 p-2 rounded">
                              <span className="text-blue-900">
                                Total Costs:
                              </span>
                              <span className="text-blue-900">
                                {formatCurrency(
                                  displaySummary.totalAllCosts || 0
                                )}
                              </span>
                            </div>

                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Additional:</span>
                              <span className="font-medium">
                                +
                                {formatCurrency(
                                  displaySummary.additionalCosts || 0
                                )}
                              </span>
                            </div>

                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">
                                Profit ({displaySummary.profitMargin || 25}%):
                              </span>
                              <span className="font-medium">
                                +
                                {formatCurrency(
                                  displaySummary.profitAmount || 0
                                )}
                              </span>
                            </div>

                            <Separator />

                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-green-900">
                                  Tentative Cost:
                                </span>
                                <span className="text-lg font-bold text-green-900">
                                  {formatCurrency(
                                    displaySummary.tentativeCost || 0
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Mobile Remarks */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Notes</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <Label className="text-sm font-medium text-gray-600">
                          Remarks
                        </Label>
                        <Textarea
                          value={displaySummary.remarks || ""}
                          onChange={(e) => handleRemarksChange(e.target.value)}
                          className="mt-2 text-sm h-24"
                          placeholder="Add notes..."
                        />
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  /* Desktop Content */
                  <>
                    {/* Cost Breakdown Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                      <CostCategoryCard
                        key="upper-desktop"
                        title="Upper Cost Breakdown"
                        category="upper"
                        items={costRows.upper}
                        onUpdateItem={updateItemField}
                        onUpdateConsumption={updateItemConsumption}
                        onUpdateCost={updateItemCost}
                        onDeleteItem={deleteItem}
                        onAddItem={() => openAddItemDialog("upper")}
                        onStageSelect={setItemDepartment}
                        color="orange"
                      />

                      <CostCategoryCard
                        key="component-desktop"
                        title="Component Cost Breakdown"
                        category="component"
                        items={costRows.component}
                        onUpdateItem={updateItemField}
                        onUpdateConsumption={updateItemConsumption}
                        onUpdateCost={updateItemCost}
                        onDeleteItem={deleteItem}
                        onAddItem={() => openAddItemDialog("component")}
                        onStageSelect={setItemDepartment}
                        color="purple"
                      />

                      <CostCategoryCard
                        key="material-desktop"
                        title="Material Cost Breakdown"
                        category="material"
                        items={costRows.material}
                        onUpdateItem={updateItemField}
                        onUpdateConsumption={updateItemConsumption}
                        onUpdateCost={updateItemCost}
                        onDeleteItem={deleteItem}
                        onAddItem={() => openAddItemDialog("material")}
                        onStageSelect={setItemDepartment}
                        color="teal"
                      />

                      <CostCategoryCard
                        key="packaging-desktop"
                        title="Packaging Cost Breakdown"
                        category="packaging"
                        items={costRows.packaging}
                        onUpdateItem={updateItemField}
                        onUpdateConsumption={updateItemConsumption}
                        onUpdateCost={updateItemCost}
                        onDeleteItem={deleteItem}
                        onAddItem={() => openAddItemDialog("packaging")}
                        onStageSelect={setItemDepartment}
                        color="rose"
                      />

                      <CostCategoryCard
                        key="miscellaneous-desktop"
                        title="Miscellaneous Cost Breakdown"
                        category="miscellaneous"
                        items={costRows.miscellaneous}
                        onUpdateItem={updateItemField}
                        onUpdateConsumption={updateItemConsumption}
                        onUpdateCost={updateItemCost}
                        onDeleteItem={deleteItem}
                        onAddItem={() => openAddItemDialog("miscellaneous")}
                        onStageSelect={setItemDepartment}
                        color="gray"
                      />

                      {/* Desktop Labour Cost Card */}
                      <DesktopLabourCostCard
                        labourCost={labourCost}
                        onUpdateLabour={updateLabourCost}
                        onDeleteLabourItem={deleteLabourItem}
                        onAddItem={() => openAddItemDialog("labour")}
                        isLoading={isSavingLabour}
                      />
                    </div>

                    {/* Final Cost Summary */}
                    <Card className="border-2 border-green-200">
                      <CardHeader className="bg-green-50">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calculator className="w-5 h-5 text-green-600" />
                          Final Cost Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 md:p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Additional Costs
                            </Label>
                            <div className="relative mt-1">
                              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={displaySummary.additionalCosts || 0}
                                onChange={(e) =>
                                  handleAdditionalCostsChange(
                                    Number(e.target.value)
                                  )
                                }
                                className="pl-10 h-10 md:h-12"
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
                                step="0.1"
                                min="0"
                                max="100"
                                value={displaySummary.profitMargin ?? 0}
                                onChange={(e) =>
                                  handleProfitMarginChange(e.target.value)
                                }
                                className="pl-10 h-10 md:h-12"
                                placeholder="Enter profit margin %"
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                            <div className="text-center">
                              <div className="text-xs text-gray-600">
                                Upper Cost
                              </div>
                              <div className="text-sm font-medium">
                                {formatCurrency(displaySummary.upperTotal || 0)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-600">
                                Component Cost
                              </div>
                              <div className="text-sm font-medium">
                                {formatCurrency(
                                  displaySummary.componentTotal || 0
                                )}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-600">
                                Material Cost
                              </div>
                              <div className="text-sm font-medium">
                                {formatCurrency(
                                  displaySummary.materialTotal || 0
                                )}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-600">
                                Packaging Cost
                              </div>
                              <div className="text-sm font-medium">
                                {formatCurrency(
                                  displaySummary.packagingTotal || 0
                                )}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-600">
                                Misc Cost
                              </div>
                              <div className="text-sm font-medium">
                                {formatCurrency(displaySummary.miscTotal || 0)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-600">
                                Labour Cost
                              </div>
                              <div className="text-sm font-medium">
                                {formatCurrency(
                                  displaySummary.labourTotal || 0
                                )}
                              </div>
                            </div>
                          </div>

                          <Separator />

                          <div className="flex justify-between text-sm font-medium bg-blue-50 p-3 rounded">
                            <span className="text-blue-900">
                              Total All Costs:
                            </span>
                            <span className="text-blue-900">
                              {formatCurrency(
                                displaySummary.totalAllCosts || 0
                              )}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                Additional Costs:
                              </span>
                              <span className="font-medium">
                                +
                                {formatCurrency(
                                  displaySummary.additionalCosts || 0
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                Profit ({displaySummary.profitMargin || 25}%):
                              </span>
                              <span className="font-medium">
                                +
                                {formatCurrency(
                                  displaySummary.profitAmount || 0
                                )}
                              </span>
                            </div>
                          </div>

                          <Separator />

                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-green-900">
                                Tentative Cost:
                              </span>
                              <span className="text-xl md:text-2xl font-bold text-green-900">
                                {formatCurrency(
                                  displaySummary.tentativeCost || 0
                                )}
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
                      <CardContent className="p-4 md:p-6">
                        <Label className="text-sm font-medium text-gray-600">
                          Remarks & Justification
                        </Label>
                        <Textarea
                          value={displaySummary.remarks || ""}
                          onChange={(e) => handleRemarksChange(e.target.value)}
                          className="mt-2 h-24 md:h-32"
                          placeholder="Add notes about cost calculation methodology, assumptions, or special considerations..."
                        />
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-40 bg-white border-t-2 border-gray-200 px-4 md:px-6 py-3 md:py-4 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2 md:gap-4">
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 text-xs md:text-sm"
              >
                Project: {project.autoCode}
              </Badge>
              <div className="text-xs md:text-sm text-gray-600">
                Status:{" "}
                {displaySummary.status === "draft"
                  ? "Draft"
                  : "Ready for Red Seal"}
              </div>
              {hasUnsavedChanges() && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                >
                  Unsaved Changes
                </Badge>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="text-sm md:text-base text-gray-600">
                Total:{" "}
                <span className="font-bold text-green-600">
                  {formatCurrency(displaySummary.tentativeCost || 0)}
                </span>
              </div>
              <Button
                onClick={handleApprove}
                className="bg-[rgba(0,188,125,1)] hover:bg-green-600 w-full sm:w-auto h-10 md:h-12"
                disabled={
                  displaySummary.tentativeCost === 0 ||
                  isLoading ||
                  isSavingLabour
                }
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                {isLoading ? "Processing..." : "Approve & Advance"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Add New Item Dialogs */}
      {Object.keys(addItemDialogs).map((category) => (
        <AddNewItemDialog
          key={`dialog-${category}`}
          category={category}
          isOpen={addItemDialogs[category]}
          onClose={() => closeAddItemDialog(category)}
          formData={dialogForms[category]}
          onFormChange={(field, value) =>
            updateDialogForm(category, field, value)
          }
          onAddItem={() => handleAddNewItem(category)}
        />
      ))}
    </Dialog>
  );
}
