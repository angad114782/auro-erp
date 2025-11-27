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
  taskInc: string;
  status: string;
  priority: string;
  remarks?: string;
}

interface ProductionPlanDetailsDialogProps {
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
}: ProductionPlanDetailsDialogProps) {
  const [productionPlanningData, setProductionPlanningData] = useState({
    assignedPlant: "Plant A - Main Factory",
    sendDate: "2025-01-15",
    receivedDate: "2025-01-18",
    soleVendor: "Rubber Solutions Ltd.",
    soleColor: "Black",
    soleReceivedDate: "2025-01-20",
  });

  // Lists for dropdowns
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

  // Dialog states for adding new items
  const [addPlantDialogOpen, setAddPlantDialogOpen] = useState(false);
  const [addVendorDialogOpen, setAddVendorDialogOpen] = useState(false);

  // Form fields
  const [newPlantName, setNewPlantName] = useState("");
  const [newVendorName, setNewVendorName] = useState("");

  // Remarks editing state
  const [isEditingRemarks, setIsEditingRemarks] = useState(false);
  const [editedRemarks, setEditedRemarks] = useState("");

  useEffect(() => {
    // Reset state when dialog opens with new plan
    if (open && plan) {
      setProductionPlanningData({
        assignedPlant: "Plant A - Main Factory",
        sendDate: "2025-01-15",
        receivedDate: "2025-01-18",
        soleVendor: "Rubber Solutions Ltd.",
        soleColor: "Black",
        soleReceivedDate: "2025-01-20",
      });
    }
  }, [open, plan]);

  // Handler to save new plant
  const saveNewPlant = () => {
    if (!newPlantName.trim()) {
      toast.error("Please enter plant name");
      return;
    }

    if (plantsList.includes(newPlantName)) {
      toast.error("Plant already exists");
      return;
    }

    setPlantsList([...plantsList, newPlantName]);
    setProductionPlanningData({
      ...productionPlanningData,
      assignedPlant: newPlantName,
    });
    setNewPlantName("");
    setAddPlantDialogOpen(false);
    toast.success("Plant added successfully");
  };

  // Handler to save new vendor
  const saveNewVendor = () => {
    if (!newVendorName.trim()) {
      toast.error("Please enter vendor name");
      return;
    }

    if (vendorsList.includes(newVendorName)) {
      toast.error("Vendor already exists");
      return;
    }

    setVendorsList([...vendorsList, newVendorName]);
    setProductionPlanningData({
      ...productionPlanningData,
      soleVendor: newVendorName,
    });
    setNewVendorName("");
    setAddVendorDialogOpen(false);
    toast.success("Vendor added successfully");
  };

  // Handler to start editing remarks
  const handleEditRemarks = () => {
    setEditedRemarks(plan?.remarks || "");
    setIsEditingRemarks(true);
  };

  // Handler to save edited remarks
  const handleSaveRemarks = () => {
    if (!plan) return;

    // Here you would typically update the plan in your store/database
    // For now, we'll just show a success message
    plan.remarks = editedRemarks;
    setIsEditingRemarks(false);
    toast.success("Remarks updated successfully");
  };

  // Handler to cancel editing remarks
  const handleCancelEditRemarks = () => {
    setIsEditingRemarks(false);
    setEditedRemarks("");
  };

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
        {/* Sticky Header */}
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
                <DialogDescription className="sr-only">
                  View detailed production plan information
                </DialogDescription>
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenChange(false)}
                type="button"
                className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center border-0 bg-transparent transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-8 py-8 space-y-5">
            {/* Product Information & Manufacturing Assignment */}
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
                      {plan?.artNameSnapshot! || "N/A"}
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
                      {plan.colorSnapshot || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Manufacturing Assignment */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h4 className="text-sm font-semibold text-orange-800 mb-3">
                  Manufacturing Assignment
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-green-600 mb-1">Quantity</p>
                    <p className="text-sm font-medium text-green-900">
                      {plan?.quantity?.toLocaleString("en-IN") || "N/A"} units
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-orange-600 mb-1">
                      Production Team
                    </p>
                    <p className="text-sm font-medium text-orange-900">
                      {plan.assignedTeam}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-orange-600 mb-1">
                      Task Coordinator
                    </p>
                    <p className="text-sm font-medium text-orange-900">
                      {plan?.taskInc || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Production Planning */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-3">
                Production Planning
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-blue-600 mb-1">Assigned Plant</p>
                  <Select
                    value={productionPlanningData.assignedPlant}
                    onValueChange={(value) => {
                      if (value === "__add_new__") {
                        setAddPlantDialogOpen(true);
                      } else {
                        setProductionPlanningData({
                          ...productionPlanningData,
                          assignedPlant: value,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm border-blue-200 focus:border-blue-500 bg-white">
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
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setAddPlantDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Plant
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-blue-600 mb-1">Send Date</p>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
                    <Input
                      type="date"
                      value={productionPlanningData.sendDate}
                      onChange={(e) =>
                        setProductionPlanningData({
                          ...productionPlanningData,
                          sendDate: e.target.value,
                        })
                      }
                      className="h-9 text-sm border-blue-200 focus:border-blue-500 bg-white pl-9"
                      style={{ colorScheme: "light" }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-blue-600 mb-1">Received Date</p>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
                    <Input
                      type="date"
                      value={productionPlanningData.receivedDate}
                      onChange={(e) =>
                        setProductionPlanningData({
                          ...productionPlanningData,
                          receivedDate: e.target.value,
                        })
                      }
                      className="h-9 text-sm border-blue-200 focus:border-blue-500 bg-white pl-9"
                      style={{ colorScheme: "light" }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-blue-600 mb-1">Sole Vendor</p>
                  <Select
                    value={productionPlanningData.soleVendor}
                    onValueChange={(value) => {
                      if (value === "__add_new__") {
                        setAddVendorDialogOpen(true);
                      } else {
                        setProductionPlanningData({
                          ...productionPlanningData,
                          soleVendor: value,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm border-blue-200 focus:border-blue-500 bg-white">
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorsList.map((vendor) => (
                        <SelectItem key={vendor} value={vendor}>
                          {vendor}
                        </SelectItem>
                      ))}
                      <Separator className="my-1" />
                      <div
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setAddVendorDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Vendor
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-blue-600 mb-1">Sole Color</p>
                  <Input
                    value={productionPlanningData.soleColor}
                    readOnly
                    className="h-9 text-sm border-0 bg-transparent cursor-not-allowed"
                  />
                </div>
                <div>
                  <p className="text-xs text-blue-600 mb-1">
                    Sole Received Date
                  </p>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
                    <Input
                      type="date"
                      value={productionPlanningData.soleReceivedDate}
                      onChange={(e) =>
                        setProductionPlanningData({
                          ...productionPlanningData,
                          soleReceivedDate: e.target.value,
                        })
                      }
                      className="h-9 text-sm border-blue-200 focus:border-blue-500 bg-white pl-9"
                      style={{ colorScheme: "light" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Material Availability */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Components Used */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="text-sm font-semibold text-purple-800 mb-4">
                  Components Used
                </h4>
                <div className="space-y-1">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-purple-700 border-b border-purple-200 pb-2">
                    <div className="col-span-4">COMPONENT</div>
                    <div className="col-span-4">DESCRIPTION</div>
                    <div className="col-span-4">CONSUMPTION</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 text-xs py-1">
                    <div className="col-span-4 text-gray-800">Foam</div>
                    <div className="col-span-4 text-gray-600">-</div>
                    <div className="col-span-4 text-gray-800">7.5grm</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 text-xs py-1">
                    <div className="col-span-4 text-gray-800">Velcro</div>
                    <div className="col-span-4 text-gray-600">75mm</div>
                    <div className="col-span-4 text-gray-800">1.25 pair</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 text-xs py-1">
                    <div className="col-span-4 text-gray-800">Buckle</div>
                    <div className="col-span-4 text-gray-600">-</div>
                    <div className="col-span-4 text-gray-800">2pcs</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 text-xs py-1">
                    <div className="col-span-4 text-gray-800">Trim</div>
                    <div className="col-span-4 text-gray-600">sticker</div>
                    <div className="col-span-4 text-gray-800">10 pcs</div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-purple-200">
                  <p className="text-xs text-purple-700 font-medium">
                    Total Components: 4 different components used in production
                  </p>
                </div>
              </div>

              {/* Materials Used */}
              <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                <h4 className="text-sm font-semibold text-cyan-800 mb-4">
                  Materials Used
                </h4>
                <div className="space-y-1">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-cyan-700 border-b border-cyan-200 pb-2">
                    <div className="col-span-4">MATERIAL</div>
                    <div className="col-span-4">DESCRIPTION</div>
                    <div className="col-span-4">CONSUMPTION</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 text-xs py-1">
                    <div className="col-span-4 text-gray-800">Upper</div>
                    <div className="col-span-4 text-gray-600">Rexine</div>
                    <div className="col-span-4 text-gray-800">26 pairs/mtr</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 text-xs py-1">
                    <div className="col-span-4 text-gray-800">Lining</div>
                    <div className="col-span-4 text-gray-600">Skinfit</div>
                    <div className="col-span-4 text-gray-800">
                      25 pair @ 15/-
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 text-xs py-1">
                    <div className="col-span-4 text-gray-800">Lining</div>
                    <div className="col-span-4 text-gray-600">EVA</div>
                    <div className="col-span-4 text-gray-800">
                      33/70 - 1.5mm 35pair
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-cyan-200">
                  <p className="text-xs text-cyan-700 font-medium">
                    Total Materials: 3 different materials used in production
                  </p>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {plan.remarks && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                {!isEditingRemarks ? (
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-green-800 flex-1">
                      <span className="font-medium">Remarks: </span>
                      {plan.remarks || "No remarks added"}
                    </p>
                    <button
                      onClick={handleEditRemarks}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors"
                      title="Edit remarks"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label
                        htmlFor="remarks-edit"
                        className="text-sm font-medium text-green-800 mb-2 block"
                      >
                        Edit Remarks
                      </Label>
                      <Textarea
                        id="remarks-edit"
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
                        onClick={handleCancelEditRemarks}
                        className="h-8 px-3 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveRemarks}
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

            {/* Action Buttons */}
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
                placeholder="e.g., Plant E - Western Unit"
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

      {/* Add New Vendor Dialog */}
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
            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor Name *</Label>
              <Input
                id="vendorName"
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                placeholder="e.g., Advanced Sole Technologies"
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNewVendor();
                  }
                }}
              />
            </div>
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
              onClick={saveNewVendor}
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
