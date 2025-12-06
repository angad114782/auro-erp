import React, { useState, useEffect } from "react";
import {
  X,
  Factory,
  Edit,
  Trash2,
  Play,
  Pause,
  Calendar,
  Plus,
  CheckCircle,
  Calculator,
  Building,
  Package,
  IndianRupee,
  Users,
  Target,
  BarChart3,
  ChevronRight,
  AlertCircle,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import api from "../lib/api";
import { CreateProductionCardDialog } from "./CreateProductionCardDialog";

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

interface CostItem {
  _id: string;
  item: string;
  description: string;
  consumption: string;
  cost: number;
}

interface ReadOnlyCostCategoryProps {
  title: string;
  color: "orange" | "purple" | "teal" | "rose" | "gray" | "amber";
  items: CostItem[];
}

const ReadOnlyCostCategory = ({
  title,
  color,
  items,
}: ReadOnlyCostCategoryProps) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const total = items.reduce((s, i) => s + (Number(i.cost) || 0), 0);

  const colorClasses = {
    orange: "border-orange-300 bg-orange-50 text-orange-900",
    purple: "border-purple-300 bg-purple-50 text-purple-900",
    teal: "border-teal-300 bg-teal-50 text-teal-900",
    rose: "border-rose-300 bg-rose-50 text-rose-900",
    gray: "border-gray-300 bg-gray-50 text-gray-900",
    amber: "border-amber-300 bg-amber-50 text-amber-900",
  };

  return (
    <Card className={`rounded-lg border ${colorClasses[color]}`}>
      <CardContent className="p-0">
        <div className="p-2 flex items-center gap-2 font-semibold text-sm">
          <Calculator className="w-4 h-4" />
          {title}
        </div>

        {/* MOBILE TABLE */}
        {isMobile ? (
          <div className="p-2 space-y-3">
            <div className="grid grid-cols-4 text-[10px] font-semibold text-gray-700 bg-gray-100 p-2 rounded-md border">
              <div className="text-center">ITEM</div>
              <div className="text-center">DESC</div>
              <div className="text-center">CONS</div>
              <div className="text-center">COST</div>
            </div>

            {items.map((row) => (
              <div
                key={row._id}
                className="grid grid-cols-4 text-[11px] p-2 border rounded-md bg-white shadow-sm"
              >
                <div className="text-center truncate">{row.item}</div>
                <div className="text-center truncate">{row.description}</div>
                <div className="text-center">{row.consumption}</div>
                <div className="text-center font-semibold">
                  ₹{Number(row.cost || 0).toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 p-2 bg-gray-100 text-xs font-medium border-b">
              <div className="col-span-3 text-center">ITEM</div>
              <div className="col-span-4 text-center">DESCRIPTION</div>
              <div className="col-span-2 text-center">CONSUMPTION</div>
              <div className="col-span-3 text-center">COST</div>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {items.map((row) => (
                <div
                  key={row._id}
                  className="grid grid-cols-12 text-xs p-2 border-b"
                >
                  <div className="col-span-3 text-center truncate">
                    {row.item}
                  </div>
                  <div className="col-span-4 text-center truncate">
                    {row.description}
                  </div>
                  <div className="col-span-2 text-center">
                    {row.consumption}
                  </div>
                  <div className="col-span-3 text-center font-semibold">
                    ₹{Number(row.cost || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="p-2 font-semibold flex justify-between text-sm">
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

interface ProductionPlan {
  id: string;
  planName: string;
  projectCode: string;
  poNumber: string;
  productName: string;
  brand: string;
  category: string;
  type: string;
  gender: string;
  artColour: string;
  color: string;
  country: string;
  quantity: number;
  assignedPlant: string;
  assignedTeam: string;
  assignPerson: string;
  taskInc: string;
  status: string;
  priority: string;
  remarks?: string;
  project: { _id: string };
  artNameSnapshot?: string;
  colorSnapshot?: string;
  coverImageSnapshot?: string;
  po?: any;
  quantitySnapshot?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ProductionPlan | null;
  onStartProduction?: (plan: ProductionPlan) => void;
}

export function ProductionPlanDetailsDialog({
  open,
  onOpenChange,
  plan,
  onStartProduction,
}: Props) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1024px)");

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

  const [productionPlanningData, setProductionPlanningData] = useState({
    assignedPlant: "Plant A - Main Factory",
    sendDate: "2025-01-15",
    receivedDate: "2025-01-18",
    soleVendor: "Rubber Solutions Ltd.",
    soleColor: "Black",
    soleReceivedDate: "2025-01-20",
  });

  const [isEditingRemarks, setIsEditingRemarks] = useState(false);
  const [editedRemarks, setEditedRemarks] = useState("");
  const [openCreateCardDialog, setOpenCreateCardDialog] = useState(false);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);

  useEffect(() => {
    const loadTentativeCost = async () => {
      try {
        const id = plan?.project?._id;
        if (!id) return;

        const sumRes = await api.get(`/projects/${id}/costs`);
        const s = sumRes.data.summary;

        const sections = [
          "upper",
          "component",
          "material",
          "packaging",
          "miscellaneous",
        ];
        const results = await Promise.all(
          sections.map((sec) => api.get(`/projects/${id}/costs/${sec}`))
        );

        const labourRes = await api.get(`/projects/${id}/costs/labour`);

        setCostData({
          upper: results[0].data.rows,
          component: results[1].data.rows,
          material: results[2].data.rows,
          packaging: results[3].data.rows,
          miscellaneous: results[4].data.rows,
          labour: labourRes.data.items,
        });

        setSummary({
          tentativeCost: s.tentativeCost || 0,
        });
      } catch (err) {
        console.error("Failed to load tentative cost:", err);
      }
    };

    if (open && plan?.project?._id) {
      loadTentativeCost();
    }
  }, [open, plan?.project?._id]);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        if (!plan?.project?._id) return;
        setIsScheduleLoading(true);
        const res = await api.get(`/projects/${plan.project._id}/schedule`);
        const payload = res.data?.data ?? res.data;
        const first =
          Array.isArray(payload.items) && payload.items.length > 0
            ? payload.items[0]
            : null;

        if (first) {
          const sched = first.scheduling ?? {};
          setProductionPlanningData((prev) => ({
            ...prev,
            assignedPlant: sched.assignedPlant || prev.assignedPlant,
            sendDate: sched.scheduleDate
              ? new Date(sched.scheduleDate).toISOString().slice(0, 10)
              : prev.sendDate,
            receivedDate: sched.receivedDate
              ? new Date(sched.receivedDate).toISOString().slice(0, 10)
              : prev.receivedDate,
            soleVendor: sched.soleFrom || prev.soleVendor,
            soleColor: sched.soleColor || prev.soleColor,
            soleReceivedDate: sched.soleExpectedDate
              ? new Date(sched.soleExpectedDate).toISOString().slice(0, 10)
              : prev.soleReceivedDate,
          }));
        }
      } catch (err) {
        console.error("Failed to load project schedule:", err);
        toast.error("Failed to load production schedule");
      } finally {
        setIsScheduleLoading(false);
      }
    };

    if (open && plan?.project?._id) {
      loadSchedule();
    }
  }, [open, plan?.project?._id]);

  if (!plan) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Planning":
        return "bg-blue-100 text-blue-800";
      case "Capacity Allocated":
        return "bg-purple-100 text-purple-800";
      case "Manufacturing Assigned":
        return "bg-orange-100 text-orange-800";
      case "Process Defined":
        return "bg-yellow-100 text-yellow-800";
      case "Ready for Production":
        return "bg-green-100 text-green-800";
      case "In Production":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-hidden p-0 m-0 flex flex-col"
        style={{
          width: isMobile ? "95vw" : isTablet ? "90vw" : "85vw",
          maxWidth: "1400px",
        }}
      >
        {/* HEADER - Fixed at top */}
        <div className="sticky top-0 z-50 px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-linear-to-r from-blue-50 via-white to-blue-50 border-b-2 border-blue-200 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-linear-to-br from-[#0c9dcb] to-[#26b4e0] rounded-xl flex items-center justify-center shadow-lg">
                <Factory className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-1 truncate">
                  {plan.planName}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm sm:text-base md:text-lg font-mono text-blue-600 truncate">
                    {plan.projectCode}
                  </span>
                  <Badge
                    className={`${getPriorityColor(
                      plan.priority
                    )} text-xs sm:text-sm px-2 sm:px-3 py-1`}
                  >
                    {plan.priority}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="self-end sm:self-center"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
            {/* Product Information + Manufacturing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Product Information */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Product Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Art</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {plan.artNameSnapshot || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Gender</p>
                    <p className="text-sm font-medium text-gray-900">
                      {plan?.project?.gender || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Color</p>
                    <p className="text-sm font-medium text-gray-900">
                      {plan.colorSnapshot || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Manufacturing Assignment */}
              <div className="bg-orange-50 rounded-lg p-3 sm:p-4 border border-orange-200">
                <h4 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Manufacturing Assignment
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-green-600 mb-1">Quantity</p>
                    <p className="text-sm font-medium text-green-900">
                      {(plan.quantity || 0).toLocaleString("en-IN")} units
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-orange-600 mb-1">
                      Task Coordinator
                    </p>
                    <p className="text-sm font-medium text-orange-900 truncate">
                      {plan.assignPerson || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Production Planning */}
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Production Planning
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-blue-600 mb-1">Assigned Plant</p>
                  <Input
                    value={productionPlanningData.assignedPlant}
                    readOnly
                    className="h-8 sm:h-9 text-sm border-blue-200 bg-white"
                  />
                </div>
                <div>
                  <p className="text-xs text-blue-600 mb-1">Send Date</p>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <Input
                      type="date"
                      value={productionPlanningData.sendDate}
                      readOnly
                      className="h-8 sm:h-9 pl-8 sm:pl-10 text-sm border-blue-200 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-blue-600 mb-1">Received Date</p>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <Input
                      type="date"
                      value={productionPlanningData.receivedDate}
                      readOnly
                      className="h-8 sm:h-9 pl-8 sm:pl-10 text-sm border-blue-200 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-blue-600 mb-1">Sole Vendor</p>
                  <Input
                    value={productionPlanningData.soleVendor}
                    readOnly
                    className="h-8 sm:h-9 text-sm border-blue-200 bg-white"
                  />
                </div>
                <div>
                  <p className="text-xs text-blue-600 mb-1">Sole Color</p>
                  <Input
                    value={productionPlanningData.soleColor}
                    readOnly
                    className="h-8 sm:h-9 text-sm border-blue-200 bg-white"
                  />
                </div>
                <div>
                  <p className="text-xs text-blue-600 mb-1">
                    Sole Received Date
                  </p>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <Input
                      type="date"
                      value={productionPlanningData.soleReceivedDate}
                      readOnly
                      className="h-8 sm:h-9 pl-8 sm:pl-10 text-sm border-blue-200 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tentative Cost Breakdown */}
            <div className="bg-green-50 border border-green-300 rounded-lg p-3 sm:p-4 space-y-4 sm:space-y-6">
              <h4 className="text-base sm:text-lg font-semibold text-green-800 flex items-center gap-2">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                Tentative Cost Breakdown
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <ReadOnlyCostCategory
                  title="Upper Cost"
                  color="orange"
                  items={costData.upper}
                />
                <ReadOnlyCostCategory
                  title="Component Cost"
                  color="purple"
                  items={costData.component}
                />
                <ReadOnlyCostCategory
                  title="Material Cost"
                  color="teal"
                  items={costData.material}
                />
                <ReadOnlyCostCategory
                  title="Packaging Cost"
                  color="rose"
                  items={costData.packaging}
                />
                <ReadOnlyCostCategory
                  title="Miscellaneous Cost"
                  color="gray"
                  items={costData.miscellaneous}
                />
              </div>
              <div className="p-3 sm:p-4 bg-white rounded-lg border border-green-400 flex justify-between font-semibold text-green-900 text-sm sm:text-base">
                <span>Total Tentative Cost</span>
                <span>₹{summary.tentativeCost?.toFixed(2)}</span>
              </div>
            </div>

            {/* Remarks */}
            {plan.remarks && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                {!isEditingRemarks ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-green-800">
                        <span className="font-medium">Remarks: </span>
                        {plan.remarks || "No remarks added"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditedRemarks(plan.remarks || "");
                        setIsEditingRemarks(true);
                      }}
                      className="h-7 w-7 sm:h-8 sm:w-auto sm:px-3"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      {!isMobile && (
                        <span className="ml-2 hidden sm:inline">Edit</span>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-green-800 mb-2 block">
                        Edit Remarks
                      </Label>
                      <Textarea
                        value={editedRemarks}
                        onChange={(e) => setEditedRemarks(e.target.value)}
                        className="min-h-20 bg-white text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingRemarks(false);
                          setEditedRemarks("");
                        }}
                        className="h-8 px-3 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          plan.remarks = editedRemarks;
                          setIsEditingRemarks(false);
                          toast.success("Remarks updated successfully");
                        }}
                        className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER - Fixed at bottom */}
        <div className="sticky bottom-0 z-50 px-4 sm:px-6 md:px-8 py-4 bg-white border-t border-gray-200 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 w-full">
            {(plan.status === "Planning" ||
              plan.status === "Capacity Allocated" ||
              plan.status === "Manufacturing Assigned" ||
              plan.status === "Process Defined" ||
              plan.status === "Ready for Production") &&
              onStartProduction && (
                <Button
                  size={isMobile ? "sm" : "default"}
                  className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
                  onClick={() => {
                    setOpenCreateCardDialog(true);
                  }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Production
                </Button>
              )}

            {plan.status === "In Production" && (
              <Button
                size={isMobile ? "sm" : "default"}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 w-full sm:w-auto"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause Production
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Create Production Dialog */}
      <CreateProductionCardDialog
        open={openCreateCardDialog}
        onClose={() => {
          setOpenCreateCardDialog(false);
          // Remove onOpenChange(false) - only close the child dialog
        }}
        selectedProductionCard={plan}
      />
    </Dialog>
  );
}

export default ProductionPlanDetailsDialog;
