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
import { toast } from "sonner@2.0.3";
import api from "../lib/api"; // REQUIRED

// ============================================
// READ-ONLY COST CATEGORY COMPONENT (6 tables)
// ============================================
interface CostItem {
  _id: string;
  item: string;
  description: string;
  consumption: string;
  cost: number;
}

interface readOnlyCostCategoryProps {
  title: string;
  color: "orange" | "purple" | "teal" | "rose" | "gray" | "amber";
  items: CostItem[];
}

const ReadOnlyCostCategory = ({
  title,
  color,
  items,
}: readOnlyCostCategoryProps) => {
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
        {/* Header */}
        <div className="p-3 flex items-center gap-2 font-semibold">
          <Calculator className="w-4 h-4" />
          {title}
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 p-2 bg-gray-100 text-xs font-medium border-b">
          <div className="col-span-3 text-center">ITEM</div>
          <div className="col-span-4 text-center">DESCRIPTION</div>
          <div className="col-span-2 text-center">CONSUMPTION</div>
          <div className="col-span-3 text-center">COST</div>
        </div>

        {/* Rows */}
        <div className="max-h-56 overflow-y-auto">
          {items.map((row) => (
            <div
              key={row._id}
              className="grid grid-cols-12 text-xs p-2 border-b"
            >
              <div className="col-span-3 text-center">{row.item}</div>
              <div className="col-span-4 text-center">{row.description}</div>
              <div className="col-span-2 text-center">{row.consumption}</div>
              <div className="col-span-3 text-center font-semibold">
                ₹{Number(row.cost || 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 font-semibold flex justify-between">
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// ==========================================
// MAIN COMPONENT START
// ==========================================

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
  project: { _id: string }; // IMPORTANT
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
  // Tentative Cost States
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

  useEffect(() => {
    if (open && plan?.project?._id) {
      loadTentativeCost();
    }
  }, [open]);

  // -----------------------------------------
  // Your existing component state continues…
  // -----------------------------------------

  const [productionPlanningData, setProductionPlanningData] = useState({
    assignedPlant: "Plant A - Main Factory",
    sendDate: "2025-01-15",
    receivedDate: "2025-01-18",
    soleVendor: "Rubber Solutions Ltd.",
    soleColor: "Black",
    soleReceivedDate: "2025-01-20",
  });

  const [plantsList, setPlantsList] = useState<string[]>([
    "Plant A - Main Factory",
    "Plant B - North Unit",
    "Plant C - South Unit",
    "Plant D - Export Hub",
  ]);

  const [vendorsList, setVendorsList] = useState<string[]>([
    "Rubber Solutions Ltd.",
    "Elite Sole Manufacturing",
    "Premium Footwear Materials",
    "Global Sole Suppliers",
  ]);

  const [addPlantDialogOpen, setAddPlantDialogOpen] = useState(false);
  const [addVendorDialogOpen, setAddVendorDialogOpen] = useState(false);

  const [newPlantName, setNewPlantName] = useState("");
  const [newVendorName, setNewVendorName] = useState("");

  const [isEditingRemarks, setIsEditingRemarks] = useState(false);
  const [editedRemarks, setEditedRemarks] = useState("");

  // -----------------------------------------
  // MAIN JSX BEGINS
  // -----------------------------------------

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
      <DialogContent className="!max-w-[85vw] !w-[85vw] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
        {/* HEADER */}
        <div className="sticky top-0 z-50 px-8 py-6 bg-linear-to-r from-blue-50 via-white to-blue-50 border-b-2 border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-linear-to-br from-[#0c9dcb] to-[#26b4e0] rounded-xl flex items-center justify-center shadow-lg">
                <Factory className="w-7 h-7 text-white" />
              </div>

              <div>
                <DialogTitle className="text-3xl font-semibold text-gray-900 mb-1">
                  {plan.planName}
                </DialogTitle>

                <div className="flex items-center gap-4">
                  <span className="text-lg font-mono text-blue-600">
                    {plan.projectCode}
                  </span>

                  <Badge
                    className={`${getPriorityColor(
                      plan.priority
                    )} text-sm px-3 py-1`}
                  >
                    {plan.priority}
                  </Badge>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* BODY SCROLL */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-8 py-8 space-y-6">
            {/* PRODUCT INFORMATION + MANUFACTURING */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Product Information */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">
                  Product Information
                </h4>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Art</p>
                    <p className="text-sm font-medium text-gray-900">
                      {plan?.artNameSnapshot || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Gender</p>
                    <p className="text-sm font-medium text-gray-900">
                      {plan?.project?.gender}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Color</p>
                    <p className="text-sm font-medium text-gray-900">
                      {plan.color || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Manufacturing Assignment */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h4 className="text-sm font-semibold text-orange-800 mb-3">
                  Manufacturing Assignment
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-green-600 mb-1">Quantity</p>
                    <p className="text-sm font-medium text-green-900">
                      {plan?.quantity?.toLocaleString("en-IN")} units
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-orange-600 mb-1">
                      Task Coordinator
                    </p>
                    <p className="text-sm font-medium text-orange-900">
                      {plan?.assignPerson}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PRODUCTION PLANNING */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-3">
                Production Planning
              </h4>

              <div className="grid grid-cols-3 gap-4">
                {/* Assigned Plant */}
                <div>
                  <p className="text-xs text-blue-600 mb-1">Assigned Plant</p>

                  <Select
                    value={productionPlanningData.assignedPlant}
                    onValueChange={(value) => {
                      if (value === "__add_new__")
                        return setAddPlantDialogOpen(true);
                      setProductionPlanningData({
                        ...productionPlanningData,
                        assignedPlant: value,
                      });
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm border-blue-200 bg-white">
                      <SelectValue placeholder="Select plant" />
                    </SelectTrigger>

                    <SelectContent>
                      {plantsList.map((plant) => (
                        <SelectItem key={plant} value={plant}>
                          {plant}
                        </SelectItem>
                      ))}

                      <Separator className="my-1" />

                      <div
                        className="px-2 py-1.5 text-sm cursor-pointer flex items-center gap-2 hover:bg-blue-50"
                        onClick={() => setAddPlantDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4" /> Add New Plant
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                {/* Send Date */}
                <div>
                  <p className="text-xs text-blue-600 mb-1">Send Date</p>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      type="date"
                      value={productionPlanningData.sendDate}
                      onChange={(e) =>
                        setProductionPlanningData({
                          ...productionPlanningData,
                          sendDate: e.target.value,
                        })
                      }
                      className="h-9 pl-9 text-sm border-blue-200 bg-white"
                      style={{ colorScheme: "light" }}
                    />
                  </div>
                </div>

                {/* Received Date */}
                <div>
                  <p className="text-xs text-blue-600 mb-1">Received Date</p>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      type="date"
                      value={productionPlanningData.receivedDate}
                      onChange={(e) =>
                        setProductionPlanningData({
                          ...productionPlanningData,
                          receivedDate: e.target.value,
                        })
                      }
                      className="h-9 pl-9 text-sm border-blue-200 bg-white"
                      style={{ colorScheme: "light" }}
                    />
                  </div>
                </div>

                {/* Sole Vendor */}
                <div>
                  <p className="text-xs text-blue-600 mb-1">Sole Vendor</p>

                  <Select
                    value={productionPlanningData.soleVendor}
                    onValueChange={(value) => {
                      if (value === "__add_new__")
                        return setAddVendorDialogOpen(true);
                      setProductionPlanningData({
                        ...productionPlanningData,
                        soleVendor: value,
                      });
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm border-blue-200 bg-white">
                      <SelectValue placeholder="Select Vendor" />
                    </SelectTrigger>

                    <SelectContent>
                      {vendorsList.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}

                      <Separator className="my-1" />

                      <div
                        className="px-2 py-1.5 text-sm cursor-pointer flex items-center gap-2 hover:bg-blue-50"
                        onClick={() => setAddVendorDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4" /> Add New Vendor
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sole Color */}
                <div>
                  <p className="text-xs text-blue-600 mb-1">Sole Color</p>
                  <Input
                    value={productionPlanningData.soleColor}
                    readOnly
                    className="h-9 text-sm bg-transparent border-0 text-gray-700"
                  />
                </div>

                {/* Sole Received Date */}
                <div>
                  <p className="text-xs text-blue-600 mb-1">
                    Sole Received Date
                  </p>

                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />

                    <Input
                      type="date"
                      value={productionPlanningData.soleReceivedDate}
                      onChange={(e) =>
                        setProductionPlanningData({
                          ...productionPlanningData,
                          soleReceivedDate: e.target.value,
                        })
                      }
                      className="h-9 pl-9 text-sm border-blue-200 bg-white"
                      style={{ colorScheme: "light" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ================================
                 TENTATIVE COST BREAKDOWN (API)
               ================================ */}
            <div className="bg-green-50 border border-green-300 rounded-lg p-4 space-y-6">
              <h4 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                <Calculator className="w-5 h-5" /> Tentative Cost Breakdown
              </h4>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

                {/* <ReadOnlyCostCategory
                  title="Labour Cost"
                  color="amber"
                  items={costData?.labour?.map((l) => ({
                    _id: l._id,
                    item: l.name,
                    description: "",
                    consumption: "",
                    cost: Number(l.cost || 0),
                  }))}
                /> */}
              </div>

              <div className="p-4 bg-white rounded-lg border border-green-400 flex justify-between font-semibold text-green-900">
                <span>Total Tentative Cost</span>
                <span>₹{summary.tentativeCost?.toFixed(2)}</span>
              </div>
            </div>

            {/* =====================================
                 REMARKS SECTION (unchanged)
               ===================================== */}
            {/* REMARKS */}
            {plan.remarks && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                {!isEditingRemarks ? (
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-green-800 flex-1">
                      <span className="font-medium">Remarks: </span>
                      {plan.remarks || "No remarks added"}
                    </p>

                    <button
                      onClick={() => {
                        setEditedRemarks(plan.remarks || "");
                        setIsEditingRemarks(true);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
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
                        placeholder="Enter remarks..."
                        className="min-h-[80px] bg-white border-green-300 focus:border-green-500 focus:ring-green-500 text-sm resize-none"
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

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-end pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                {(plan.status === "Planning" ||
                  plan.status === "Capacity Allocated" ||
                  plan.status === "Manufacturing Assigned" ||
                  plan.status === "Process Defined" ||
                  plan.status === "Ready for Production") &&
                  onStartProduction && (
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => {
                        onStartProduction(plan);
                        onOpenChange(false);
                      }}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Start Production
                    </Button>
                  )}

                {plan.status === "In Production" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Pause Production
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* ADD PLANT DIALOG */}
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
            <Label>Plant Name *</Label>
            <Input
              value={newPlantName}
              onChange={(e) => setNewPlantName(e.target.value)}
              placeholder="e.g., Plant E - Western Unit"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newPlantName.trim()) {
                    setPlantsList([...plantsList, newPlantName]);
                    setProductionPlanningData({
                      ...productionPlanningData,
                      assignedPlant: newPlantName,
                    });
                    setAddPlantDialogOpen(false);
                    setNewPlantName("");
                    toast.success("Plant added successfully");
                  }
                }
              }}
            />
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
              onClick={() => {
                if (!newPlantName.trim()) return toast.error("Enter name");
                setPlantsList([...plantsList, newPlantName]);
                setProductionPlanningData({
                  ...productionPlanningData,
                  assignedPlant: newPlantName,
                });
                setNewPlantName("");
                setAddPlantDialogOpen(false);
                toast.success("Plant added");
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Add Plant
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD VENDOR DIALOG */}
      <Dialog open={addVendorDialogOpen} onOpenChange={setAddVendorDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Factory className="w-5 h-5 text-blue-600" />
              Add New Sole Vendor
            </DialogTitle>
            <DialogDescription>
              Enter the name of the new sole vendor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Label>Vendor Name *</Label>
            <Input
              value={newVendorName}
              onChange={(e) => setNewVendorName(e.target.value)}
              placeholder="e.g., Advanced Sole Technologies"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newVendorName.trim()) {
                    setVendorsList([...vendorsList, newVendorName]);
                    setProductionPlanningData({
                      ...productionPlanningData,
                      soleVendor: newVendorName,
                    });
                    setAddVendorDialogOpen(false);
                    setNewVendorName("");
                    toast.success("Vendor added successfully");
                  }
                }
              }}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAddVendorDialogOpen(false);
                setNewVendorName("");
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={() => {
                if (!newVendorName.trim()) return toast.error("Enter name");
                setVendorsList([...vendorsList, newVendorName]);
                setProductionPlanningData({
                  ...productionPlanningData,
                  soleVendor: newVendorName,
                });
                setNewVendorName("");
                setAddVendorDialogOpen(false);
                toast.success("Vendor added successfully");
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

export default ProductionPlanDetailsDialog;