// AddProductionCardDialog.tsx  (UPDATED)
// Replace your existing file with this.

import React, { useState, useEffect, useRef } from "react";
import { X, Package, Calendar, Building, FileText, Save } from "lucide-react";
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
import api from "../lib/api"; // adjust path if needed

interface AddProductionCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string | null;
  onSave: (cardData: any) => void; // parent will receive created calendar entry
}

export function AddProductionCardDialog({
  open,
  onOpenChange,
  selectedDate,
  onSave,
}: AddProductionCardDialogProps) {
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
    productionUnit: "",
    assignedPlant: "",
    productionDate: "",
    remarks: "",

    // NEW: sole inputs (you requested them)
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

  // debounce ref
  const debounceRef = useRef<number | null>(null);

  // Reset form on open or selectedDate change
  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        productionDate: selectedDate || prev.productionDate || "",
      }));

      if (!selectedProjectSnapshot) {
        // if no project selected, clear fields
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
          productionUnit: "",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedDate]);

  // Debounced search effect (calls your /api/projects/search)
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
        // Using api axios instance so auth header is included if present
        const res = await api.get("/projects/search", {
          params: { query: searchQuery },
        });

        // debug: show response in console
        console.log("projects/search response:", res.data);

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

  // When user selects a project from results - autofill & lock
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

  // Clear selection (unlock)
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

  // Submit handler: posts to /calendar (matches backend service keys)
  const handleSubmit = async () => {
    if (
      !formData.productName ||
      !formData.productionQuantity ||
      !formData.productionDate
    ) {
      toast.error("Please fill required fields: product, date and quantity");
      return;
    }

    // Build payload exactly matching service expectation
    const payload: any = {
      projectId: selectedProjectId, // REQUIRED by service (must be valid ObjectId). If null, service will error.
      // We still include a snapshot as fallback
      projectSnapshot: selectedProjectSnapshot || {
        autoCode: formData.productCode,
        artName: formData.productName,
        productDesc: "",
        color: formData.artColour,
        size: "",
        brand: null,
        category: null,
        poNumber: "",
        poRef: null,
      },
      scheduling: {
        // IMPORTANT: backend expects scheduling.scheduleDate
        scheduleDate: formData.productionDate, // ISO date string e.g. "2025-09-01"
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
      console.log("POST /calendar payload:", payload);
      const res = await api.post("/calendar", payload);
      console.log("POST /calendar response:", res.data);
      const created = res.data?.data ?? res.data;
      toast.success(`Production scheduled for ${formData.productName}`);
      onSave && onSave(created);
      // reset
      handleClearSelection();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Create calendar entry failed:", err);
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        "Failed to create entry";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl !w-5xl max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-50 px-8 py-6 bg-linear-to-r from-blue-50 via-white to-blue-50 border-b shadow-sm flex justify-between">
          <div className="flex gap-6 items-center">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-7 h-7 text-white" />
            </div>

            <div>
              <DialogTitle className="text-3xl font-semibold">
                Add Production Card
              </DialogTitle>
              <DialogDescription className="sr-only">
                Create a new production card
              </DialogDescription>
              <p className="text-lg text-gray-600">
                Schedule: {formData.productionDate || "Not selected"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLocked && (
              <button
                onClick={handleClearSelection}
                className="px-3 py-2 rounded-md border hover:bg-white"
                title="Clear selected project"
              >
                Clear selection
              </button>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 scrollbar-hide">
          {/* Search */}
          <div className="space-y-2 relative">
            <Label className="text-base font-semibold text-gray-700">
              Search Project (R&D)
            </Label>

            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              disabled={isLocked}
              placeholder={
                isLocked
                  ? "Project locked - click Clear selection to change"
                  : "Search by product name or auto code (min 2 chars)..."
              }
              className="h-12 text-base border-2 focus:border-blue-500"
            />

            {/* Dropdown */}
            {!isLocked && (
              <div className="absolute left-0 right-0 z-999">
                {isSearching && searchQuery.trim().length >= 2 && (
                  <div className="bg-white border rounded-md shadow-xl p-3">
                    Searching...
                  </div>
                )}

                {!isSearching && searchQuery.trim().length >= 2 && (
                  <div className="bg-white border rounded-md shadow-xl max-h-56 overflow-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((item) => (
                        <div
                          key={item._id ?? item.id}
                          onClick={() => handleSelectProduct(item)}
                          className="px-4 py-2 cursor-pointer hover:bg-blue-50 border-b"
                        >
                          <p className="font-medium">
                            {item.artName ?? item.productName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.autoCode ?? item.projectCode}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No projects found
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Information (READONLY as requested) */}
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Product Information
              </h3>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Product Name
                </Label>
                <Input
                  value={formData.productName}
                  readOnly
                  className="h-12 text-base border-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Product Code
                </Label>
                <Input
                  value={formData.productCode}
                  readOnly
                  className="h-12 text-base border-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Art / Colour
                </Label>
                <Input
                  value={formData.artColour}
                  readOnly
                  className="h-12 text-base border-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Company
                </Label>
                <Input
                  value={formData.company}
                  readOnly
                  className="h-12 text-base border-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Brand
                </Label>
                <Input
                  value={formData.brand}
                  readOnly
                  className="h-12 text-base border-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Category
                </Label>
                <Input
                  value={formData.category}
                  readOnly
                  className="h-12 text-base border-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Type
                </Label>
                <Input
                  value={formData.type}
                  readOnly
                  className="h-12 text-base border-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Country
                </Label>
                <Input
                  value={formData.country}
                  readOnly
                  className="h-12 text-base border-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Gender
                </Label>
                <Input
                  value={formData.gender}
                  readOnly
                  className="h-12 text-base border-2 bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Scheduling Information
              </h3>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Schedule On *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                  <Input
                    type="date"
                    value={formData.productionDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        productionDate: e.target.value,
                      })
                    }
                    className="pl-12 h-12 text-base border-2 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Assigned Plant
                </Label>
                <Input
                  value={formData.assignedPlant}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedPlant: e.target.value })
                  }
                  className="h-12 text-base border-2 focus:border-blue-500"
                />
              </div>

              {/* NEW sole inputs */}
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

          {/* Production Details */}
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
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
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
                  className="h-12 text-base border-2 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Additional Information
              </h3>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold text-gray-700">
                Remarks
              </Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                placeholder="Add any special instructions…"
                rows={4}
                className="resize-none text-base border-2 focus:border-blue-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t-2 border-gray-200 shadow-2xl shadow-gray-900/10 z-50">
          <div className="px-8 py-6 flex justify-end gap-4">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              size="lg"
              className="px-8 py-3 h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              size="lg"
              className="px-8 py-3 h-12 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
            >
              <Save className="w-5 h-5 mr-2" />
              Create Production Card
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddProductionCardDialog;
