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
  Search,
  Check,
  ChevronsUpDown,
  ChevronDown,
  Trash2,
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
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import api from "../lib/api";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

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

interface ProductionPlan {
  _id?: string;
  id?: string;
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
  color?: string;
  footbed?: string;
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
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1024px)");

  const [formData, setFormData] = useState({
    scheduleDate: "",
    assignedPlant: "",
    quantity: "",
    remarks: "",
    soleFrom: "",
    soleColor: "",
    soleExpectedDate: "",
    footbed: "",
  });

  const [plants, setPlants] = useState<PlantType[]>([]);
  const [openPlantsDropdown, setOpenPlantsDropdown] = useState(false);
  const [addingNewPlant, setAddingNewPlant] = useState(false);
  const [newPlantName, setNewPlantName] = useState("");
  const [loadingPlants, setLoadingPlants] = useState(false);
const isValidObjectId = (val?: string): boolean =>
  typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val);


const extractPlantId = (val: any): string => {
  if (!val) return "";

  // case: already ObjectId string
  if (typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val)) {
    return val;
  }

  // case: populated object { _id, name }
  if (typeof val === "object" && val._id && /^[0-9a-fA-F]{24}$/.test(val._id)) {
    return val._id;
  }

  return "";
};


const selectedPlant = React.useMemo(() => {
  if (!formData.assignedPlant) return null;
  return plants.find((p) => p._id === formData.assignedPlant) || null;
}, [plants, formData.assignedPlant]);


  // Load plants when dialog opens
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

  // Handle creating new plant
  const handleCreateNewPlant = async () => {
    if (!newPlantName.trim()) return toast.error("Please enter a plant name");

    try {
      const res = await api.post("/assign-plants", {
        name: newPlantName.trim(),
      });
      const createdPlantResponse = res.data?.data || res.data;
      setPlants((prev) => [createdPlantResponse, ...prev]);
      setFormData((prev) => ({
        ...prev,
        assignedPlant: createdPlantResponse._id,
      }));
      toast.success(`Plant "${createdPlantResponse.name}" created`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create plant");
    } finally {
      setNewPlantName("");
      setAddingNewPlant(false);
    }
  };

  // Handle deleting a plant
  const handleDeletePlant = async (plantId: string, plantName: string) => {
    try {
      await api.delete(`/assign-plants/${plantId}`);
      setPlants((prev) => prev.filter((p) => p._id !== plantId));

      // Clear selection if deleting currently selected plant
      if (formData.assignedPlant === plantId) {
        setFormData((prev) => ({
          ...prev,
          assignedPlant: "",
        }));
      }

      toast.success(`Plant "${plantName}" removed`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove plant");
    }
  };

useEffect(() => {
  if (open && productionData) {
    const scheduling = productionData.raw?.scheduling ?? {};

    setFormData({
      scheduleDate: productionData.startDate ?? scheduling.scheduleDate ?? "",
      assignedPlant:
        extractPlantId(productionData.assignedPlant) ||
        extractPlantId(scheduling.assignedPlant),
      quantity: (productionData.quantity ?? "").toString(),
      remarks:
        productionData.remarks ??
        productionData.raw?.additional?.remarks ??
        "",
      soleFrom: scheduling.soleFrom ?? "",
      soleColor: scheduling.soleColor ?? "",
      soleExpectedDate: scheduling.soleExpectedDate
        ? new Date(scheduling.soleExpectedDate).toISOString().split("T")[0]
        : "",
      footbed: scheduling.footbed || "",
    });
  }
}, [open, productionData]);


  if (!productionData) return null;

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
      toast.error("Missing id for this production card");
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

    try {
      const res = await api.put(`/calendar/${docId}`, payload);
      const updated = res.data?.data ?? res.data;
      onSave(updated);
      toast.success("Production card updated successfully");
      onOpenChange(false);
    } catch (err: any) {
      console.error("update calendar error:", err);
      const serverMessage = err?.response?.data?.message || err?.message;
      toast.error(serverMessage || "Unable to update production card");
    }
  };

  const dialogWidth = isMobile ? "95vw" : isTablet ? "90vw" : "80vw";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`!max-w-[${dialogWidth}] !w-[${dialogWidth}] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col`}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b-2 border-blue-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-1 truncate">
                  Edit Calendar
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base text-gray-600 truncate">
                  Scheduled for{" "}
                  {formData.scheduleDate
                    ? new Date(formData.scheduleDate).toLocaleDateString()
                    : "-"}
                </DialogDescription>
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8">
          {/* Scheduling Information */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-violet-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                Scheduling Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Schedule On */}
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-semibold text-gray-700">
                  Schedule On *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    value={formData.scheduleDate}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduleDate: e.target.value })
                    }
                    className="pl-10 h-10 sm:h-12 text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Assigned Plant */}
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-semibold text-gray-700">
                  Assigned Plant *
                </Label>
                <Popover
                  open={openPlantsDropdown}
                  onOpenChange={setOpenPlantsDropdown}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openPlantsDropdown}
                      className="w-full h-10 sm:h-12 justify-between text-sm sm:text-base"
                    >
                      <span className="truncate">
  {selectedPlant
    ? selectedPlant.name
    : loadingPlants
    ? "Loading..."
    : "Select plant..."}
</span>

                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search plants..." />
                      <CommandList>
                        <CommandEmpty>No plant found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {plants.map((plant) => (
                            <CommandItem
                              key={plant._id}
                              value={plant.name}
                              className="flex items-center justify-between"
                              onSelect={() => {
                                setFormData({
                                  ...formData,
                                  assignedPlant: plant._id,
                                });
                                setOpenPlantsDropdown(false);
                              }}
                            >
                              <div className="flex items-center flex-1 min-w-0">
                                <Check
                                  className={`mr-2 h-4 w-4 shrink-0 ${
                                    formData.assignedPlant === plant._id
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
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeletePlant(plant._id, plant.name);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500 opacity-60 hover:opacity-100" />
                              </button>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>

                      {/* Create New Plant Section */}
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

              {/* Production Quantity */}
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-semibold text-gray-700">
                  Production Quantity *
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  className="h-10 sm:h-12 text-sm sm:text-base"
                />
              </div>

              {/* Sole From */}
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-semibold text-gray-700">
                  Sole From
                </Label>
                <Input
                  value={formData.soleFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, soleFrom: e.target.value })
                  }
                  className="h-10 sm:h-12 text-sm sm:text-base"
                />
              </div>

              {/* Sole Color */}
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-semibold text-gray-700">
                  Sole Color
                </Label>
                <Input
                  value={formData.soleColor}
                  onChange={(e) =>
                    setFormData({ ...formData, soleColor: e.target.value })
                  }
                  className="h-10 sm:h-12 text-sm sm:text-base"
                />
              </div>

              {/* Sole Expected Date */}
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-semibold text-gray-700">
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
                  className="h-10 sm:h-12 text-sm sm:text-base"
                />
              </div>
                {/* Foot Bed */}
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-semibold text-gray-700">
                  Foot Bed
                </Label>
                <Input
                  value={formData.footbed}
                  onChange={(e) =>
                    setFormData({ ...formData, footbed: e.target.value })
                  }
                  className="h-10 sm:h-12 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* Product Information - READ ONLY */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                Product Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                {
                  label: "Product Name",
                  value: productionData.productName || "-",
                },
                {
                  label: "Product Code",
                  value: productionData.projectCode || "-",
                },
                { label: "Colour", value: productionData.color || "-" },
                { label: "Brand", value: productionData.brand || "-" },
                { label: "Category", value: productionData.category || "-" }
                // { label: "Type", value: productionData.type || "-" },
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="text-xs sm:text-sm text-gray-600">
                    {item.label}
                  </div>
                  <div className="text-sm sm:text-base text-gray-900 font-medium truncate">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                Additional Information
              </h3>
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base font-semibold text-gray-700">
                Remarks
              </Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                placeholder="Enter any additional notes or remarks"
                className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base resize-none"
              />
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-50 px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              size={isMobile ? "sm" : "default"}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              size={isMobile ? "sm" : "default"}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ViewProductionCardDialog;
