import React, { useState, useEffect } from "react";
import {
  X,
  Scissors,
  Package,
  AlertCircle,
  CheckCircle,
  TrendingDown,
  Save,
  Clock,
  Activity,
  ChevronDown,
  ChevronUp,
  Printer,
  ShirtIcon,
  Wrench,
  FileCheck,
  History,
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
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import api from "../lib/api";


interface HistoryRecord {
  itemName: string;
  timestamp: string;
  type: "added" | "updated";
  quantity: number;
  previousTotal: number;
  newTotal: number;
  unit: string;
  updatedBy?: string;
  notes?: string;
}



interface CuttingItem {
  id: string;
  itemName: string;
  cardQuantity: number;        // ✅ required total
  alreadyCut: number;
  cuttingToday: number | string;
  unit: string;
  status: "pending" | "in-progress" | "completed";
  department: string;
  specification: string;
}


interface ItemCuttingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productData: any;
  rows: any[];
  loadingRows: boolean;
  stage: string;
  projectId: string;
  cardId: string;
}

const mapStageToDept = (stg: string) => {
  if (!stg) return "cutting";
  if (stg === "upper-rej") return "upper_rej";
  return stg;
};
function parseToNumber(value: string | number): number {
  if (typeof value === "number") return value;
  if (value === "" || value === ".") return 0;
  const num = parseFloat(value);
  return Number.isNaN(num) ? 0 : num;
}


const MobileItemCard = React.memo(
  ({
    item,
    isMobile,
    minimumAvailable,
    productData,
    stageDetails,
    updateCuttingQuantity,
    toggleItemExpanded,
    expandedItems,
    stage,
    onAdvanceToChange,
  }: {
    item: CuttingItem;
    isMobile: boolean;
    minimumAvailable: number;
    productData: any;
    stageDetails: any;
    updateCuttingQuantity: (itemId: string, value: string) => void;
    toggleItemExpanded: (itemId: string) => void;
    expandedItems: Set<string>;
    stage: string;
    onAdvanceToChange: (rowId: string, dept: string) => void;
  }) => {



    const alreadyCutNum = parseToNumber(item.alreadyCut);
    const cuttingTodayNum = parseToNumber(item.cuttingToday);
    const totalAfter = alreadyCutNum + cuttingTodayNum;
    const remaining = Math.max(item.cardQuantity - totalAfter, 0);
    const progressPercent = Math.min(
      (totalAfter / item.cardQuantity) * 100,
      100
    );
    const isBottleneck =
      totalAfter === minimumAvailable &&
      minimumAvailable < productData.targetQuantity;
    const isExpanded = expandedItems.has(item.id);

    const getDisplayValue = (): string => {
      if (typeof item.cuttingToday === "string") {
        return item.cuttingToday;
      }
      if (item.cuttingToday === 0) return "";
      return item.cuttingToday.toString();
    };

    const [inputValue, setInputValue] = useState(getDisplayValue());

    useEffect(() => {
      setInputValue(getDisplayValue());
    }, [item.cuttingToday]);

    const handleInputChange = (value: string) => {
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        if ((value.match(/\./g) || []).length > 1) {
          return;
        }

        if (value === "0") {
          setInputValue(value);
          updateCuttingQuantity(item.id, value);
          return;
        }

        if (value.length > 1 && value[0] === "0" && value[1] !== ".") {
          return;
        }

        setInputValue(value);
        updateCuttingQuantity(item.id, value);
      }
    };

    const getItemStatusBadge = () => {
      const total = totalAfter;
      const percentage =
  item.cardQuantity > 0 ? (total / item.cardQuantity) * 100 : 0;

      if (percentage >= 100) {
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
            {isMobile ? "✓" : "Completed"}
          </Badge>
        );
      } else if (percentage >= 50) {
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
            {isMobile ? "⟳" : "In Progress"}
          </Badge>
        );
      } else {
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
            {isMobile ? "⋯" : "Pending"}
          </Badge>
        );
      }
    };

    const handleDeliverItem = (projectId: string) => {
      try {
        api.post(`/projects/${projectId}/send-to-delivery`);
      } catch (error) {}
      toast.success(`Delivered ${item.itemName} to customer successfully!`);
    };

    const clampOnBlur = (item: CuttingItem, value: string) => {
      const alreadyCutNum = parseToNumber(item.alreadyCut);
     const maxAllowed = Math.max(item.cardQuantity - alreadyCutNum, 0);


      const num = parseFloat(value);
      if (isNaN(num)) return "0";

      return Math.min(num, maxAllowed).toFixed(4);
    };

    return (
      <div
        className={`bg-white border-2 rounded-xl p-4 transition-all ${
          isBottleneck
            ? "border-red-300 bg-red-50"
            : cuttingTodayNum > 0
            ? "border-purple-300 bg-purple-50"
            : "border-gray-200"
        }`}
      >
        {/* Item Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-linear-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shrink-0 border-2 border-gray-300">
              <Scissors className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm mb-1 truncate">
                {item.itemName}
              </div>
              {/* SPECIFICATION ADDED HERE */}
              {item.specification && (
                <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded mb-2 truncate border border-blue-100">
                  {item.specification}
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {getItemStatusBadge()}
                {isBottleneck && (
                  <Badge className="bg-red-100 text-red-800 border-red-200 text-xs flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    {isMobile ? "BN" : "Bottleneck"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center border-0 bg-transparent"
            onClick={() => toggleItemExpanded(item.id)}
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 rounded p-2 text-center">
            <div className="text-xs text-gray-500">Required</div>
            <div className="text-sm font-bold text-gray-900">
              {item.cardQuantity}
            </div>
          </div>
          <div className="bg-gray-50 rounded p-2 text-center">
            <div className="text-xs text-gray-500">Already Cut</div>
            <div className="text-sm font-semibold text-blue-600">
              {alreadyCutNum}
            </div>
          </div>
          <div className="bg-gray-50 rounded p-2 text-center">
            <div className="text-xs text-gray-500">Remaining</div>
            <div className="text-sm font-semibold text-orange-600">
              {remaining.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Progress</span>
            <span className="text-xs font-semibold text-gray-900">
              {progressPercent.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={progressPercent}
            className={`h-1.5 ${
              progressPercent >= 100
                ? "bg-green-200"
                : progressPercent >= 50
                ? "bg-blue-200"
                : "bg-orange-200"
            }`}
          />
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
            {/* Cutting Today Input */}
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-1 block">
                {stageDetails.title} Today
              </Label>
              <Input
                type="text"
                inputMode="decimal"
                value={
                  inputValue === "0" || inputValue === "" ? "" : inputValue
                }
                onChange={(e) => handleInputChange(e.target.value)}
                onBlur={(e) => {
                  const finalValue = clampOnBlur(item, e.target.value);
                  updateCuttingQuantity(item.id, finalValue);
                }}
                className="h-9 text-sm font-semibold border-2 focus:border-purple-500"
                placeholder="0"
              />
              {item.department !== "rfd" && (
                <Select
                  value={stage ? undefined : undefined}
                  onValueChange={(value) => onAdvanceToChange(item.id, value)}
                >
                  <SelectTrigger className="h-9 mt-2 text-xs border-2 border-emerald-300">
                    <SelectValue placeholder="Next stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cutting">Cutting</SelectItem>
                    <SelectItem value="printing">Printing</SelectItem>
                    <SelectItem value="upper">Upper</SelectItem>
                    <SelectItem value="upper-rej">Upper REJ</SelectItem>
                    <SelectItem value="assembly">Assembly</SelectItem>
                    <SelectItem value="packing">Packing</SelectItem>
                    <SelectItem value="rfd">RFD</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Today's Update Indicator */}
            {cuttingTodayNum > 0 && (
              <div className="p-2 bg-purple-100 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 text-xs text-purple-800">
                  <Activity className="w-3 h-3" />
                  <span className="font-medium">
                    Adding +{cuttingTodayNum} {item.unit} today
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

MobileItemCard.displayName = "MobileItemCard";

const saveBulkToday = async (actions: any[]) => {
  const res = await api.post("/micro-tracking/bulk/today", {
    actions,
  });
  return res.data;
};

// History Component
const HistoryTabContent = ({
  productData,
  stage,
}: {
  productData: any;
  stage: string;
}) => {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
  if (!productData?.projectId) return;

  setLoading(true);
  try {
    const res = await api.get(
      `/projects/${productData.projectId}/tracking-history`,
      { params: { stage } }
    );

    // ✅ handle all common shapes
    const raw = res.data;
    const list =
      Array.isArray(raw) ? raw :
      Array.isArray(raw?.data) ? raw.data :
      Array.isArray(raw?.items) ? raw.items :
      Array.isArray(raw?.history) ? raw.history :
      [];

    setHistoryData(list);
  } catch (error) {
    console.error("Failed to fetch history:", error);
    setHistoryData([]); // ✅ avoid crash
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    if (productData?.projectId) {
      fetchHistory();
    }
  }, [productData?.projectId, stage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  if (historyData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <History className="w-12 h-12 text-gray-300 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No History Yet
        </h3>
        <p className="text-sm text-gray-600">
          Tracking history will appear here once you start updating items
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-2">Tracking History</h3>
        <p className="text-sm text-gray-600">
          Showing all updates for {productData?.productName} in {stage}
        </p>
      </div>

      <div className="space-y-3">
        {historyData.map((record, index) => (
          <div
            key={index}
            className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{record.itemName}</h4>
                <p className="text-xs text-gray-500">
                  {new Date(record.timestamp).toLocaleDateString()} •
                  {new Date(record.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Badge
                className={`
                ${
                  record.type === "added"
                    ? "bg-green-100 text-green-800"
                    : record.type === "updated"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }
              `}
              >
                {record.type}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <div>
                <div className="text-xs text-gray-500">Quantity Added</div>
                <div className="text-sm font-semibold text-gray-900">
                  +{record.quantity} {record.unit}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Previous Total</div>
                <div className="text-sm font-semibold text-gray-900">
                  {record.previousTotal} {record.unit}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">New Total</div>
                <div className="text-sm font-semibold text-green-600">
                  {record.newTotal} {record.unit}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">By</div>
                <div className="text-sm font-semibold text-gray-900">
                  {record.updatedBy || "System"}
                </div>
              </div>
            </div>

            {record.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-1">Notes</div>
                <div className="text-sm text-gray-700">{record.notes}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export function ItemCuttingDialog({
  open,
  onOpenChange,
  productData,
  stage = "cutting",
  rows = [],
  loadingRows = false,
}: ItemCuttingDialogProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [nextDeptMap, setNextDeptMap] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("update");

  const fromDepartment = mapStageToDept(stage);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const updateNextDepartment = (rowId: string, dept: string) => {
    setNextDeptMap((prev) => ({
      ...prev,
      [rowId]: dept,
    }));
  };

  const getStageDetails = () => {
    switch (stage) {
      case "cutting":
        return {
          title: "Cutting",
          actionName: "Cutting",
          headerBg: "bg-gradient-to-r from-purple-50 via-white to-purple-50",
          headerBorder: "border-purple-200",
          iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
          badgeBg: "bg-purple-100 text-purple-800",
          buttonBg: "bg-purple-600 hover:bg-purple-700",
          icon: <Scissors className="w-5 h-5 sm:w-7 sm:h-7 text-white" />,
        };
      case "printing":
        return {
          title: "Printing",
          actionName: "Printing",
          headerBg: "bg-gradient-to-r from-blue-50 via-white to-blue-50",
          headerBorder: "border-blue-200",
          iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
          badgeBg: "bg-blue-100 text-blue-800",
          buttonBg: "bg-blue-600 hover:bg-blue-700",
          icon: <Package className="w-5 h-5 sm:w-7 sm:h-7 text-white" />,
        };
      case "upper":
        return {
          title: "Upper",
          actionName: "Upper",
          headerBg: "bg-gradient-to-r from-indigo-50 via-white to-indigo-50",
          headerBorder: "border-indigo-200",
          iconBg: "bg-gradient-to-br from-indigo-500 to-indigo-600",
          badgeBg: "bg-indigo-100 text-indigo-800",
          buttonBg: "bg-indigo-600 hover:bg-indigo-700",
          icon: <Package className="w-5 h-5 sm:w-7 sm:h-7 text-white" />,
        };
      case "upperREJ":
        return {
          title: "Upper Reg",
          actionName: "Upper Reg",
          headerBg: "bg-gradient-to-r from-orange-50 via-white to-orange-50",
          headerBorder: "border-orange-200",
          iconBg: "bg-gradient-to-br from-orange-500 to-orange-600",
          badgeBg: "bg-orange-100 text-orange-800",
          buttonBg: "bg-orange-600 hover:bg-orange-700",
          icon: <AlertCircle className="w-5 h-5 sm:w-7 sm:h-7 text-white" />,
        };
      case "assembly":
        return {
          title: "Assembly",
          actionName: "Assembly",
          headerBg: "bg-gradient-to-r from-green-50 via-white to-green-50",
          headerBorder: "border-green-200",
          iconBg: "bg-gradient-to-br from-green-500 to-green-600",
          badgeBg: "bg-green-100 text-green-800",
          buttonBg: "bg-green-600 hover:bg-green-700",
          icon: <Package className="w-5 h-5 sm:w-7 sm:h-7 text-white" />,
        };
      case "packing":
        return {
          title: "Packing",
          actionName: "Packing",
          headerBg: "bg-gradient-to-r from-teal-50 via-white to-teal-50",
          headerBorder: "border-teal-200",
          iconBg: "bg-gradient-to-br from-teal-500 to-teal-600",
          badgeBg: "bg-teal-100 text-teal-800",
          buttonBg: "bg-teal-600 hover:bg-teal-700",
          icon: <Package className="w-5 h-5 sm:w-7 sm:h-7 text-white" />,
        };
      case "rfd":
        return {
          title: "RFD",
          actionName: "RFD",
          headerBg: "bg-gradient-to-r from-emerald-50 via-white to-emerald-50",
          headerBorder: "border-emerald-200",
          iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
          badgeBg: "bg-emerald-100 text-emerald-800",
          buttonBg: "bg-emerald-600 hover:bg-emerald-700",
          icon: <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 text-white" />,
        };
      default:
        return {
          title: "Cutting",
          actionName: "Cutting",
          headerBg: "bg-gradient-to-r from-purple-50 via-white to-purple-50",
          headerBorder: "border-purple-200",
          iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
          badgeBg: "bg-purple-100 text-purple-800",
          buttonBg: "bg-purple-600 hover:bg-purple-700",
          icon: <Scissors className="w-5 h-5 sm:w-7 sm:h-7 text-white" />,
        };
    }
  };

  const stageDetails = getStageDetails();
  const [cuttingItems, setCuttingItems] = useState<CuttingItem[]>([]);

  useEffect(() => {
    if (!rows || rows.length === 0) {
      setCuttingItems([]);
      return;
    }
 const mapped: CuttingItem[] = rows.map((row) => {
  const required = Number(row.cardQuantity ?? row.cardId?.cardQuantity ?? 0);
  const completed = Number(row.progressDone ?? 0);

  return {
    id: row._id,
    itemName: row.name || "Unnamed Item",
    cardQuantity: required,    // ✅ required total = cardQuantity
    alreadyCut: completed,
    cuttingToday: 0,
    unit: row.unit || "unit",
    department: row.department,
    specification: row.specification,
    status:
      completed >= required
        ? "completed"
        : completed > 0
        ? "in-progress"
        : "pending",
  };
});



    setCuttingItems(mapped);
    setExpandedItems(new Set());
  }, [rows, open]);

 const calculateTotalRemaining = () => {
  return cuttingItems.reduce((sum, item) => {
    const totalAfter =
      Number(item.alreadyCut || 0) + parseToNumber(item.cuttingToday);
    const remaining = Math.max(Number(item.cardQuantity || 0) - totalAfter, 0);
    return sum + remaining;
  }, 0);
};


const completedToday = cuttingItems.reduce((sum, item) => {
  return sum + parseToNumber(item.cuttingToday);
}, 0);


 

  const updateCuttingQuantity = (itemId: string, value: string) => {
    setCuttingItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const alreadyCutNum = parseToNumber(item.alreadyCut);
        const maxAllowed = Math.max(item.cardQuantity - alreadyCutNum, 0);


        if (value === "" || value === ".") {
          return { ...item, cuttingToday: value };
        }

        if (!/^\d*\.?\d*$/.test(value)) {
          return item;
        }

        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 0) return item;

        if (numericValue > maxAllowed) {
          toast.error(`Max allowed today is ${maxAllowed.toFixed(4)}`);
          return { ...item, cuttingToday: maxAllowed.toString() };
        }

        return { ...item, cuttingToday: value };
      })
    );
  };

  const calculateMinimumAvailable = () => {
    if (!cuttingItems.length) return 0;

    const availableQuantities = cuttingItems.map((item) => {
      const alreadyCutNum = parseToNumber(item.alreadyCut);
      const cuttingTodayNum = parseToNumber(item.cuttingToday);
      return alreadyCutNum + cuttingTodayNum;
    });

    return Math.min(...availableQuantities);
  };

  const calculateTotalAfterCutting = (item: CuttingItem) => {
    const alreadyCutNum = parseToNumber(item.alreadyCut);
    const cuttingTodayNum = parseToNumber(item.cuttingToday);
    return alreadyCutNum + cuttingTodayNum;
  };

  const getItemStatusBadge = (item: CuttingItem) => {
    const total = calculateTotalAfterCutting(item);
    const percentage = (total / item.cardQuantity) * 100;

    if (percentage >= 100) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
          {isMobile ? "✓" : "Completed"}
        </Badge>
      );
    } else if (percentage >= 50) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
          {isMobile ? "⟳" : "In Progress"}
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
          {isMobile ? "⋯" : "Pending"}
        </Badge>
      );
    }
  };

  const handleSaveCutting = async () => {
    const actions = cuttingItems
      .map((item) => {
        const progressToday = parseToNumber(item.cuttingToday);

        if (progressToday <= 0) return null;

        return {
          rowId: item.id,
          progressToday,
          fromDepartment,
          toDepartment: nextDeptMap[item.id] || fromDepartment,
        };
      })
      .filter(Boolean);

    if (actions.length === 0) {
      toast.error("Please enter today quantity for at least one item");
      return;
    }

    try {
      const res = await saveBulkToday(actions);

      if (res.errors?.length) {
        toast.error(`Saved with ${res.errors.length} error(s). Check console.`);
        console.error("Bulk save errors:", res.errors);
      } else {
        toast.success("Today's progress saved successfully");
      }

      setCuttingItems((prev) =>
        prev.map((item) => ({
          ...item,
          alreadyCut:
            parseToNumber(item.alreadyCut) + parseToNumber(item.cuttingToday),
          cuttingToday: 0,
        }))
      );

      setNextDeptMap({});
      setActiveTab("history");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.error || "Failed to save today progress"
      );
    }
  };

  const toggleItemExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleDeliverItem = (projectId: string) => {
    try {
      api.put(`/projects/${projectId}/send-to-delivery`);
      toast.success("Item delivered to customer successfully!");
      return;
    } catch (error) {
      toast.error("Failed to deliver item to customer.");
      return;
    }
  };

  const clampOnBlur = (item: CuttingItem, value: string) => {
    const alreadyCutNum = parseToNumber(item.alreadyCut);
   const maxAllowed = item.cardQuantity - alreadyCutNum;


    const num = parseFloat(value);
    if (isNaN(num)) return "0";

    return Math.min(num, maxAllowed).toFixed(4);
  };

  const renderAdvanceToSection = (item: CuttingItem) => {
    if (item.department === "rfd") {
      return (
        <div className="col-span-12 sm:col-span-4">
          <Label className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2 block">
            Ready for Delivery
          </Label>
          <Button
            className="w-full h-9 sm:h-10 text-xs sm:text-sm bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium border-2 border-emerald-700 transition-all"
            onClick={() => handleDeliverItem(productData.projectId)}
          >
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            {isMobile ? "Deliver" : "Advanced to Deliver"}
          </Button>
        </div>
      );
    }

    // return (
    //   <div className="col-span-12 sm:col-span-4">
    //     <Label className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2 block">
    //       Advance To Next Stage
    //     </Label>
    //     <Select
    //       onValueChange={(value: any) => updateNextDepartment(item.id, value)}
    //     >
    //       <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm border-2 border-emerald-300 bg-linear-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 focus:border-emerald-500 transition-all">
    //         <SelectValue placeholder="Select next stage..." />
    //       </SelectTrigger>
    //       <SelectContent>
    //         <SelectItem value="cutting">
    //           <div className="flex items-center gap-2 text-xs sm:text-sm">
    //             <Scissors className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
    //             <span>Cutting</span>
    //           </div>
    //         </SelectItem>
    //         <SelectItem value="printing">
    //           <div className="flex items-center gap-2 text-xs sm:text-sm">
    //             <Printer className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
    //             <span>Printing</span>
    //           </div>
    //         </SelectItem>
    //         <SelectItem value="upper">
    //           <div className="flex items-center gap-2 text-xs sm:text-sm">
    //             <ShirtIcon className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
    //             <span>Upper</span>
    //           </div>
    //         </SelectItem>
    //         <SelectItem value="upper-rej">
    //           <div className="flex items-center gap-2 text-xs sm:text-sm">
    //             <Wrench className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
    //             <span>Upper REJ</span>
    //           </div>
    //         </SelectItem>
    //         <SelectItem value="assembly">
    //           <div className="flex items-center gap-2 text-xs sm:text-sm">
    //             <Package className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
    //             <span>Assembly</span>
    //           </div>
    //         </SelectItem>
    //         <SelectItem value="packing">
    //           <div className="flex items-center gap-2 text-xs sm:text-sm">
    //             <FileCheck className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
    //             <span>Packing</span>
    //           </div>
    //         </SelectItem>
    //         <SelectItem value="rfd">
    //           <div className="flex items-center gap-2 text-xs sm:text-sm">
    //             <FileCheck className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
    //             <span>RFD</span>
    //           </div>
    //         </SelectItem>
    //       </SelectContent>
    //     </Select>
    //   </div>
    // );
  };

  const minimumAvailable = calculateMinimumAvailable();
  const hasAnyValidAction = cuttingItems.some((item) => {
    const cuttingTodayNum = parseToNumber(item.cuttingToday);
    const nextDept = nextDeptMap[item.id];

    if (item.department === "rfd") {
      return cuttingTodayNum > 0;
    }

    return cuttingTodayNum > 0 && !!nextDept;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] !w-[95vw] sm:!max-w-[90vw] sm:!w-[90vw] lg:!max-w-[85vw] lg:!w-[85vw] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
        {/* Main Tabs Container - MOVE THIS TO THE TOP */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Sticky Header - NOW INSIDE TABS */}
          <div
            className={`sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${stageDetails.headerBg} border-b-2 ${stageDetails.headerBorder} shadow-sm`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 sm:gap-4 lg:gap-6">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 ${stageDetails.iconBg} rounded-lg sm:rounded-xl flex items-center justify-center shadow-md sm:shadow-lg shrink-0`}
                >
                  {stageDetails.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 mb-1 truncate">
                    {stageDetails.title} Management
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm sm:text-base lg:text-lg text-gray-600 truncate">
                      {productData?.productName}
                    </span>
                    <Badge
                      className={`${stageDetails.badgeBg} text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 truncate`}
                    >
                      {productData?.productionId}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                {activeTab === "update" && (
                  <Button
                    onClick={handleSaveCutting}
                    className={`${stageDetails.buttonBg} text-white h-9 sm:h-11 px-3 sm:px-6 text-xs sm:text-sm`}
                    disabled={!hasAnyValidAction}
                  >
                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {"Save"}
                  </Button>
                )}
                <button
                  onClick={() => onOpenChange(false)}
                  type="button"
                  className="h-8 w-8 sm:h-10 sm:w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center border-0 bg-transparent transition-colors"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="update"
                className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900"
              >
                <Package className="w-4 h-4 mr-2" />
                Update Items
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tabs Content Area */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Update Tab Content */}
              <TabsContent
                value="update"
                className="mt-0 space-y-4 sm:space-y-6 lg:space-y-8"
              >
                {/* Product Summary Card - NOW WITH TOP MARGIN */}
                <div className="mt-4 bg-linear-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    <div>
                      <div className="text-xs sm:text-sm text-gray-600 mb-1">
                        Product Name
                      </div>
                      <div className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        {productData?.productName}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-gray-600 mb-1">
                        Remaining Needed
                      </div>
                      <div className="text-sm sm:text-base font-bold text-orange-600">
                        {calculateTotalRemaining().toFixed(4)}{" "}
                        {isMobile ? "its" : "items"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-gray-600 mb-1">
                        Total Remaining
                      </div>
                      <div className="text-sm sm:text-base font-bold text-orange-600">
                        {cuttingItems.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-gray-600 mb-1">
                        Completed Today
                      </div>
                      <div className="text-sm sm:text-base font-bold text-orange-600">
                        {cuttingItems
                          .reduce((sum, item) => {
                            const cuttingTodayNum = parseToNumber(
                              item.cuttingToday
                            );
                            return sum + cuttingTodayNum;
                          }, 0)
                          .toFixed(4)}{" "}
                        {isMobile ? "its" : "items"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Production Capacity Alert */}
                {minimumAvailable < productData?.targetQuantity && (
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-3 sm:p-5">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-orange-900 text-sm sm:text-base mb-1">
                          Production Capacity Limited
                        </h4>
                        <p className="text-xs sm:text-sm text-orange-700">
                          You can currently produce{" "}
                          <span className="font-bold">
                            {minimumAvailable.toFixed(4)}{" "}
                            {isMobile ? "prs" : "pairs"}
                          </span>{" "}
                          based on the minimum cut quantity across all items.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {minimumAvailable >= productData?.targetQuantity && (
                  <div className="bg-green-50 border-2 border-green-300 rounded-xl p-3 sm:p-5">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg flex items-center justify-center shrink-0">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-green-900 text-sm sm:text-base mb-1">
                          Ready for Full Production!
                        </h4>
                        <p className="text-xs sm:text-sm text-green-700">
                          All materials have been cut sufficiently. You can now
                          produce the full target quantity of{" "}
                          {productData?.targetQuantity}{" "}
                          {isMobile ? "prs" : "pairs"}.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cutting Items Section */}
                <div className="space-y-3 sm:space-y-5">
                  <div className="flex items-center gap-3 sm:gap-5">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                      Raw Materials & Components {stageDetails.title}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-700 px-2 sm:px-3 py-1 text-xs"
                    >
                      {cuttingItems.length} Items
                    </Badge>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {!isMobile
                      ? cuttingItems.map((item) => {
                          const totalAfter = calculateTotalAfterCutting(item);
                          const remaining = Math.max(
                            item.cardQuantity - totalAfter,
                            0
                          );
                         const progressPercent =
  item.cardQuantity > 0 ? Math.min((totalAfter / item.cardQuantity) * 100, 100) : 0;
                          const isBottleneck =
                            totalAfter === minimumAvailable &&
                            minimumAvailable < productData?.targetQuantity;

                          const getDisplayValue = (): string => {
                            if (typeof item.cuttingToday === "string") {
                              return item.cuttingToday;
                            }
                            if (item.cuttingToday === 0) return "";
                            return item.cuttingToday.toString();
                          };

                          return (
                            <div
                              key={item.id}
                              className={`bg-white border-2 rounded-xl p-4 sm:p-6 transition-all ${
                                isBottleneck
                                  ? "border-red-300 bg-red-50"
                                  : parseToNumber(item.cuttingToday) > 0
                                  ? "border-purple-300 bg-purple-50"
                                  : "border-gray-200"
                              }`}
                            >
                              <div className="grid grid-cols-12 gap-4 sm:gap-6 items-center">
                                {/* Item Name & Status */}
                                <div className="col-span-12 sm:col-span-3">
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shrink-0 border-2 border-gray-300">
                                      <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-gray-900 text-sm sm:text-base mb-1 truncate">
                                        {item.itemName}
                                      </div>
                                      {item.specification && (
                                        <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded mb-2 truncate border border-blue-100">
                                          {item.specification}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {getItemStatusBadge(item)}
                                        {isBottleneck && (
                                          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs flex items-center gap-1">
                                            <TrendingDown className="w-3 h-3" />
                                            {isMobile ? "BN" : "Bottleneck"}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Required Quantity */}
                                <div className="col-span-4 sm:col-span-2">
                                  <div className="text-xs font-medium text-gray-600 mb-1">
                                    Required
                                  </div>
                                  <div className="text-sm sm:text-base font-bold text-gray-900">
                                   {Number(item.cardQuantity || 0).toFixed(4)} {item.unit}
                                  </div>
                                </div>

                                {/* Completed */}
                                <div className="col-span-4 sm:col-span-2">
                                  <div className="text-xs font-medium text-gray-600 mb-1">
                                    Completed
                                  </div>
                                  <div className="text-sm sm:text-base font-semibold text-blue-600">
                                    {Number(item.alreadyCut || 0).toFixed(4)} {item.unit}
                                  </div>
                                </div>

                                {/* Cutting Today Input */}
                                <div className="col-span-12 sm:col-span-3">
                                  <div className="grid grid-cols-2 gap-2">
                                    {/* Today Input */}
                                    <div>
                                      <div className="text-xs font-medium text-gray-600 mb-1">
                                        Today
                                      </div>
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={getDisplayValue()}
                                        onChange={(e) =>
                                          updateCuttingQuantity(
                                            item.id,
                                            e.target.value
                                          )
                                        }
                                        onBlur={(e) => {
                                          const finalValue = clampOnBlur(
                                            item,
                                            e.target.value
                                          );
                                          updateCuttingQuantity(
                                            item.id,
                                            finalValue
                                          );
                                        }}
                                        className="h-9 text-sm font-semibold border-2 focus:border-purple-500"
                                        placeholder="0"
                                      />
                                    </div>

                                    {/* Next Stage */}
                                    {item.department !== "rfd" && (
                                      <div>
                                        <div className="text-xs font-medium text-gray-600 mb-1">
                                          Next Stage
                                        </div>
                                        <Select
                                          value={nextDeptMap[item.id]}
                                          onValueChange={(value) =>
                                            updateNextDepartment(item.id, value)
                                          }
                                        >
                                          <SelectTrigger className="h-9 text-sm border-2 border-emerald-300">
                                            <SelectValue placeholder="Select" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="cutting">
                                              Cutting
                                            </SelectItem>
                                            <SelectItem value="printing">
                                              Printing
                                            </SelectItem>
                                            <SelectItem value="upper">
                                              Upper
                                            </SelectItem>
                                            <SelectItem value="upper-rej">
                                              Upper REJ
                                            </SelectItem>
                                            <SelectItem value="assembly">
                                              Assembly
                                            </SelectItem>
                                            <SelectItem value="packing">
                                              Packing
                                            </SelectItem>
                                            <SelectItem value="rfd">
                                              RFD
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Remaining */}
                                <div className="col-span-4 sm:col-span-1 text-right">
                                  <div className="text-xs font-medium text-gray-600 mb-1">
                                    Need
                                  </div>
                                  <div className="text-sm sm:text-base font-semibold text-orange-600">
                                  {Math.max(Number(item.cardQuantity || 0) - (Number(item.alreadyCut || 0) + parseToNumber(item.cuttingToday)),0).toFixed(4)}
                                  </div>
                                </div>
                              </div>

                              {/* Second Row with Deliver Button/Advance To Dropdown and Progress Bar */}
                              <div className="grid grid-cols-12 gap-4 sm:gap-6 items-center mt-4">
                                {/* {renderAdvanceToSection(item)} */}

                                {/* Progress Bar - Takes remaining columns */}
                                <div className="col-span-12">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-600">
                                      {stageDetails.title} Progress
                                    </span>
                                    <span className="text-xs font-semibold text-gray-900">
                                      {Number.isFinite(progressPercent)
                                        ? progressPercent.toFixed(1)
                                        : "0.0"}
                                      %
                                    </span>
                                  </div>
                                  <Progress
                                    value={progressPercent}
                                    className={`h-1.5 sm:h-2 ${
                                      progressPercent >= 100
                                        ? "bg-green-200"
                                        : progressPercent >= 50
                                        ? "bg-blue-200"
                                        : "bg-orange-200"
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* Today's Update Indicator */}
                              {parseToNumber(item.cuttingToday) > 0 && (
                                <div className="mt-3 p-2 bg-purple-100 rounded-lg border border-purple-200">
                                  <div className="flex items-center gap-2 text-xs text-purple-800">
                                    <Activity className="w-3.5 h-3.5" />
                                    <span className="font-medium">
                                      Adding +
                                      {parseToNumber(item.cuttingToday).toFixed(
                                        4
                                      )}{" "}
                                      {item.unit} today
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      : cuttingItems.map((item) => (
                          <MobileItemCard
                            key={item.id}
                            item={item}
                            isMobile={isMobile}
                            minimumAvailable={minimumAvailable}
                            productData={productData}
                            stageDetails={stageDetails}
                            updateCuttingQuantity={updateCuttingQuantity}
                            toggleItemExpanded={toggleItemExpanded}
                            expandedItems={expandedItems}
                            stage={stage}
                            onAdvanceToChange={updateNextDepartment}
                          />
                        ))}
                  </div>
                </div>
              </TabsContent>

              {/* History Tab Content */}
              <TabsContent value="history" className="mt-0">
                <HistoryTabContent productData={productData} stage={stage} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
