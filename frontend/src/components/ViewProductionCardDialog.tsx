import React, { useState, useEffect } from "react";
import {
  X,
  Package,
  Calendar,
  Building,
  FileText,
  Save,
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
import { toast } from "sonner@2.0.3";
import api from "../lib/api";
interface ProductionPlan {
  _id?: string; // Mongo id (optional)
  id?: string; // possible alternative id
  productName?: string;
  projectCode?: string;
  brand?: string;
  category?: string;
  type?: string;
  gender?: string;
  artColour?: string;
  country?: string;
  quantity?: number;
  assignedPlant?: string;
  startDate?: string;
  endDate?: string;
  remarks?: string;
  status?: string;
  priority?: string;
  raw?: any;
}

interface ViewProductionCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionData: ProductionPlan | null;
  onSave: (updatedData: any) => void;
}

export function ViewProductionCardDialog({
  open,
  onOpenChange,
  productionData,
  onSave,
}: ViewProductionCardDialogProps) {
  const [formData, setFormData] = useState({
    scheduleDate: "",
    assignedPlant: "",
    quantity: "",
    remarks: "",
    // removed unit
    // sole fields
    soleFrom: "",
    soleColor: "",
    soleExpectedDate: "",
  });

  // Plants list and dialog state
  const [plantsList, setPlantsList] = useState<string[]>([
    "Plant A - China",
    "Plant B - Bangladesh",
    "Plant C - India",
    "Plant D - Vietnam",
    "Plant E - Thailand",
  ]);
  const [addPlantDialogOpen, setAddPlantDialogOpen] = useState(false);
  const [newPlantName, setNewPlantName] = useState("");

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open && productionData) {
      // try multiple fallbacks: productionData fields, then productionData.raw.scheduling
      const scheduling = productionData.raw?.scheduling ?? {};
      setFormData({
        scheduleDate:
          productionData.startDate ??
          scheduling.scheduleDate ??
          productionData.startDate ??
          "",
        assignedPlant:
          productionData.assignedPlant ?? scheduling.assignedPlant ?? "",
        quantity: (productionData.quantity ?? "").toString(),
        remarks:
          productionData.remarks ??
          productionData.raw?.additional?.remarks ??
          "",
        soleFrom: scheduling.soleFrom ?? "",
        soleColor: scheduling.soleColor ?? "",
        soleExpectedDate: scheduling.soleExpectedDate
          ? // normalize to yyyy-mm-dd
            new Date(scheduling.soleExpectedDate).toISOString().split("T")[0]
          : "",
      });
    }
  }, [open, productionData]);

  if (!productionData) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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
    setFormData({ ...formData, assignedPlant: newPlantName });
    setNewPlantName("");
    setAddPlantDialogOpen(false);
    toast.success("Plant added successfully");
  };
  // assume: import api from '~/lib/api'  // your axios instance
  // or const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_BASE });

  const handleSave = async () => {
    if (!formData.scheduleDate) {
      toast.error("Please select a schedule date");
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const docId = productionData?._id ?? productionData?.id;
    if (!docId) {
      toast.error("Missing id for this production card — cannot update.");
      console.error("Missing id for productionData:", productionData);
      return;
    }

    const payload = {
      scheduling: {
        scheduleDate: formData.scheduleDate,
        assignedPlant: formData.assignedPlant || "",
        soleFrom: formData.soleFrom || "",
        soleColor: formData.soleColor || "",
        soleExpectedDate: formData.soleExpectedDate
          ? formData.soleExpectedDate
          : null,
      },
      productionDetails: { quantity: Number(formData.quantity) },
      additional: { remarks: formData.remarks ?? "" },
    };

    // optional saving flag
    // setIsSaving(true);

    try {
      // If your `api` instance already attaches Authorization header (via interceptor),
      // you can simply call:
      const res = await api.put(`/calendar/${docId}`, payload);
      // If you need to pass headers explicitly (not usual), use:
      // const token = localStorage.getItem("token");
      // const res = await api.put(`/calendar/${docId}`, payload, {
      //   headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      // });

      // axios response shape: res.data -> { message, data }
      const updated = res.data?.data ?? res.data;
      console.log("calendar update response:", res.data);

      // call parent to update local list/state
      onSave(updated);

      toast.success("Production card updated successfully");
      onOpenChange(false);
    } catch (err: any) {
      console.error("update calendar error:", err);
      // prefer server error message if present
      const serverMessage = err?.response?.data?.message || err?.message;
      toast.error(
        serverMessage || "Unable to update production card. Try again."
      );
    } finally {
      // setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl !w-5xl max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 px-8 py-6 bg-linear-to-r from-blue-50 via-white to-blue-50 border-b-2 border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-semibold text-gray-900 mb-1">
                  Edit Production Card
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600">
                  Scheduled for{" "}
                  {formData.scheduleDate
                    ? formatDate(formData.scheduleDate)
                    : "-"}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-10 w-10 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          {/* Scheduling Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center shadow-md">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Scheduling Information
              </h3>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Schedule On */}
              <div className="space-y-2">
                <Label
                  htmlFor="scheduleDate"
                  className="text-base font-semibold text-gray-700"
                >
                  Schedule On *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                  <Input
                    id="scheduleDate"
                    type="date"
                    value={formData.scheduleDate}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduleDate: e.target.value })
                    }
                    className="pl-12 h-12 text-base border-2 focus:border-blue-500"
                    style={{ colorScheme: "light" }}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Select the date for production scheduling
                </p>
              </div>

              {/* Assigned Plant */}
              <div className="space-y-2">
                <Label
                  htmlFor="assignedPlant"
                  className="text-base font-semibold text-gray-700"
                >
                  Assigned Plant *
                </Label>
                <Input
                  value={formData.assignedPlant}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedPlant: e.target.value })
                  }
                  className="h-12 text-base border-2 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500">
                  Assign this production to a manufacturing plant
                </p>
              </div>

              {/* Sole From */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Sole From
                </Label>
                <Input
                  value={formData.soleFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, soleFrom: e.target.value })
                  }
                  className="h-12 text-base border-2 focus:border-blue-500"
                />
              </div>

              {/* Sole Color */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Sole Color
                </Label>
                <Input
                  value={formData.soleColor}
                  onChange={(e) =>
                    setFormData({ ...formData, soleColor: e.target.value })
                  }
                  className="h-12 text-base border-2 focus:border-blue-500"
                />
              </div>

              {/* Sole Expected Date */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Sole Expected Date
                </Label>
                <Input
                  type="date"
                  value={formData.soleExpectedDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      soleExpectedDate: e.target.value,
                    })
                  }
                  className="h-12 text-base border-2 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Product Information Section - READ ONLY */}
          <div className="space-y-4">
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Product Information
              </h3>
            </div>

            {/* Compact Table Layout */}
            <div className="bg-white rounded-lg">
              {/* 3x3 Grid */}
              <div className="grid grid-cols-3 gap-6">
                {/* Product Name */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Product Name</div>
                  <div className="text-sm text-gray-900">
                    {productionData.productName ||
                      productionData.raw?.projectSnapshot?.artName ||
                      productionData.raw?.project?.artName ||
                      productionData.raw?.projectSnapshot?.productName ||
                      "-"}
                  </div>
                </div>

                {/* Product Code */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Product Code</div>
                  <div className="text-sm text-gray-900">
                    {productionData.projectCode ||
                      productionData.raw?.projectSnapshot?.autoCode ||
                      productionData.raw?.project?.autoCode ||
                      productionData.raw?.projectSnapshot?.projectCode ||
                      "-"}
                  </div>
                </div>

                {/* Art/Colour Name */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Colour</div>
                  <div className="text-sm text-gray-900">
                    {productionData.artColour ||
                      productionData.raw?.projectSnapshot?.color ||
                      productionData.raw?.project?.color ||
                      productionData.raw?.projectSnapshot?.color ||
                      "-"}
                  </div>
                </div>

                {/* Company */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Company</div>
                  <div className="text-sm text-gray-900">
                    {productionData.raw?.projectSnapshot?.companyName ||
                      productionData.raw?.project?.company?.name ||
                      productionData.raw?.project?.company ||
                      "-"}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Brand</div>
                  <div className="text-sm text-gray-900">
                    {productionData.brand ||
                      productionData.raw?.projectSnapshot?.brandName ||
                      productionData.raw?.project?.brand?.name ||
                      productionData.raw?.project?.brand ||
                      "-"}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Category</div>
                  <div className="text-sm text-gray-900">
                    {productionData.category ||
                      productionData.raw?.projectSnapshot?.categoryName ||
                      productionData.raw?.project?.category?.name ||
                      productionData.raw?.project?.category ||
                      "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Production Details Section - EDITABLE */}
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                <Building className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Production Details
              </h3>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Production Quantity - EDITABLE */}
              <div className="space-y-2">
                <Label
                  htmlFor="quantity"
                  className="text-base font-semibold text-gray-700"
                >
                  Production Quantity *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  placeholder="e.g., 1200"
                  className="h-12 text-base border-2 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Additional Information
              </h3>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="remarks"
                className="text-base font-semibold text-gray-700"
              >
                Remarks
              </Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                placeholder="Enter any additional notes or remarks"
                className="min-h-[120px] text-base border-2 focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-50 px-8 py-5 bg-linear-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200 flex items-center justify-end gap-4 shadow-lg">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            size="lg"
            className="px-8 py-3 h-12 border-2 hover:bg-gray-100 transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            size="lg"
            className="px-8 py-3 h-12 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
          >
            <Save className="w-5 h-5 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>

      {/* Add New Plant Dialog */}
      <Dialog open={addPlantDialogOpen} onOpenChange={setAddPlantDialogOpen}>
        <DialogContent className="max-w-md">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Factory className="w-5 h-5 text-blue-600" />
              <DialogTitle className="text-xl">Add New Plant</DialogTitle>
            </div>
            <div className="space-y-4 py-2">
              <Label htmlFor="plantName">Plant Name *</Label>
              <Input
                id="plantName"
                value={newPlantName}
                onChange={(e) => setNewPlantName(e.target.value)}
                placeholder="e.g., Plant F - Indonesia"
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNewPlant();
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
                onClick={saveNewPlant}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Add Plant
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

export default ViewProductionCardDialog;
