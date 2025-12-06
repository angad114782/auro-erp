import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Package,
  Calendar,
  Building,
  FileText,
  Save,
  Search,
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
import { toast } from "sonner";
import api from "../lib/api";

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

interface AddProductionCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string | null;
  onSave: (cardData: any) => void;
}

export function AddProductionCardDialog({
  open,
  onOpenChange,
  selectedDate,
  onSave,
}: AddProductionCardDialogProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1024px)");

  const [formData, setFormData] = useState({
    productName: "",
    productCode: "",
    artColour: "",
    company: "",
    brand: "",
    category: "",
    type: "",
    country: "",
    gender: "",
    productionQuantity: "",
    assignedPlant: "",
    productionDate: "",
    remarks: "",
    soleFrom: "",
    soleColor: "",
    soleExpectedDate: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [selectedProjectSnapshot, setSelectedProjectSnapshot] = useState<
    any | null
  >(null);
  const [isSearching, setIsSearching] = useState(false);

  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        productionDate: selectedDate || prev.productionDate || "",
      }));

      if (!selectedProjectSnapshot) {
        setFormData((prev) => ({
          ...prev,
          productName: "",
          productCode: "",
          artColour: "",
          company: "",
          brand: "",
          category: "",
          type: "",
          country: "",
          gender: "",
          productionQuantity: "",
          assignedPlant: "",
          productionDate: selectedDate || "",
          remarks: "",
          soleFrom: "",
          soleColor: "",
          soleExpectedDate: "",
        }));
        setIsLocked(false);
      }
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [open, selectedDate]);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await api.get("/projects/search", {
          params: { query: searchQuery },
        });
        const items = res.data?.data ?? res.data?.items ?? [];
        setSearchResults(items);
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const handleSelectProduct = (p: any) => {
    const snapshot = {
      _id: p._id ?? p.id,
      autoCode: p.autoCode ?? p.projectCode,
      artName: p.artName ?? p.productName,
      productName: p.artName ?? p.productName,
      brand: p.brand?.name ?? p.brand,
      category: p.category?.name ?? p.category,
      type: p.type?.name ?? p.type,
      color: p.color ?? p.artColour,
      country: p.country?.name ?? p.country,
      coverImage: p.coverImage ?? p.image,
    };

    setSelectedProjectSnapshot(snapshot);
    setSelectedProjectId(snapshot._id ?? null);

    setFormData((prev) => ({
      ...prev,
      productName: snapshot.productName || "",
      productCode: snapshot.autoCode || "",
      artColour: snapshot.color || "",
      company: p.company?.name || prev.company || "",
      brand: snapshot.brand || "",
      category: snapshot.category || "",
      type: snapshot.type || "",
      country: snapshot.country || "",
      gender: p.gender || prev.gender || "",
    }));

    setIsLocked(true);
    setSearchQuery(snapshot.productName || "");
    setSearchResults([]);
  };

  const handleClearSelection = () => {
    setSelectedProjectId(null);
    setSelectedProjectSnapshot(null);
    setIsLocked(false);
    setSearchQuery("");
    setSearchResults([]);
    setFormData((prev) => ({
      ...prev,
      productName: "",
      productCode: "",
      artColour: "",
      brand: "",
      category: "",
      type: "",
      country: "",
      gender: "",
    }));
  };

  const handleSubmit = async () => {
    if (
      !formData.productName ||
      !formData.productionQuantity ||
      !formData.productionDate
    ) {
      toast.error("Please fill required fields: product, date and quantity");
      return;
    }

    const payload: any = {
      projectId: selectedProjectId,
      projectSnapshot: selectedProjectSnapshot || {
        autoCode: formData.productCode,
        artName: formData.productName,
        color: formData.artColour,
      },
      scheduling: {
        scheduleDate: formData.productionDate,
        assignedPlant: formData.assignedPlant || "",
        soleFrom: formData.soleFrom || "",
        soleColor: formData.soleColor || "",
        soleExpectedDate: formData.soleExpectedDate || null,
      },
      productionDetails: {
        quantity: Number(formData.productionQuantity),
      },
      additional: {
        remarks: formData.remarks || "",
      },
    };

    try {
      const res = await api.post("/calendar", payload);
      const created = res.data?.data ?? res.data;
      toast.success(`Production scheduled for ${formData.productName}`);

      if (onSave) {
        onSave(created);
      }

      handleClearSelection();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Create calendar entry failed:", err);
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "Failed to create entry";
      toast.error(msg);
    }
  };

  const dialogWidth = isMobile ? "95vw" : isTablet ? "90vw" : "85vw";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`!max-w-[${dialogWidth}] !w-[${dialogWidth}] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col`}
      >
        {/* Header */}
        <div className="sticky top-0 z-50 px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-blue-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 truncate">
                  Add Production Card
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base text-gray-600">
                  Schedule: {formData.productionDate || "Not selected"}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              {isLocked && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSelection}
                  className="text-xs sm:text-sm"
                >
                  Clear
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8">
          {/* Search */}
          <div className="space-y-2 relative">
            <Label className="text-sm sm:text-base font-semibold text-gray-700">
              Search Project (R&D)
            </Label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLocked}
              placeholder={
                isLocked
                  ? "Project locked - click Clear to change"
                  : "Search by product name or code..."
              }
              className="h-10 sm:h-12 text-sm sm:text-base"
            />

            {/* Search Results Dropdown */}
            {!isLocked && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 z-50 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.slice(0, 5).map((item) => (
                    <div
                      key={item._id ?? item.id}
                      onClick={() => handleSelectProduct(item)}
                      className="p-3 border-b hover:bg-blue-50 cursor-pointer"
                    >
                      <div className="font-medium text-sm sm:text-base truncate">
                        {item.artName ?? item.productName}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 truncate">
                        {item.autoCode ?? item.projectCode}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No projects found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                Product Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                { label: "Product Name", key: "productName" },
                { label: "Product Code", key: "productCode" },
                { label: "Art / Colour", key: "artColour" },
                { label: "Company", key: "company" },
                { label: "Brand", key: "brand" },
                { label: "Category", key: "category" },
                { label: "Type", key: "type" },
                { label: "Country", key: "country" },
                { label: "Gender", key: "gender" },
              ].map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label className="text-sm sm:text-base font-semibold text-gray-700">
                    {field.label}
                  </Label>
                  <Input
                    value={
                      formData[field.key as keyof typeof formData] as string
                    }
                    readOnly
                    className="h-10 sm:h-12 text-sm sm:text-base bg-gray-50"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Scheduling */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                Scheduling Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-semibold text-gray-700">
                  Schedule On *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    value={formData.productionDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        productionDate: e.target.value,
                      })
                    }
                    className="pl-10 h-10 sm:h-12 text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-semibold text-gray-700">
                  Assigned Plant
                </Label>
                <Input
                  value={formData.assignedPlant}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedPlant: e.target.value })
                  }
                  className="h-10 sm:h-12 text-sm sm:text-base"
                />
              </div>

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
            </div>
          </div>

          {/* Production Details */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Building className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                Production Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-semibold text-gray-700">
                  Production Quantity *
                </Label>
                <Input
                  type="number"
                  value={formData.productionQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      productionQuantity: e.target.value,
                    })
                  }
                  placeholder="e.g. 1200"
                  className="h-10 sm:h-12 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 rounded-xl flex items-center justify-center">
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
                placeholder="Add any special instructions..."
                className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
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
              onClick={handleSubmit}
              size={isMobile ? "sm" : "default"}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Create Production Card
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddProductionCardDialog;
