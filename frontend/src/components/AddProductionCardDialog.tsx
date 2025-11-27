import React, { useState, useEffect } from "react";
import {
  X,
  Package,
  Calendar,
  Building,
  FileText,
  Save,
  User,
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
import { toast } from "sonner";

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
  });

  // SEARCH STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  // --------------------------
  // RESET FORM ON OPEN
  // --------------------------
  useEffect(() => {
    if (open && selectedDate) {
      setFormData({
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
        productionDate: selectedDate,
        remarks: "",
      });

      setIsLocked(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [open, selectedDate]);

  // --------------------------
  // SEARCH API
  // --------------------------
  const fetchProductList = async (query: string) => {
    if (!query.trim()) return setSearchResults([]);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/projects/search?query=${query}`
      );
      const json = await res.json();

      if (json.success) setSearchResults(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  // --------------------------
  // SELECT PRODUCT → AUTOFILL
  // --------------------------
  const handleSelectProduct = (p: any) => {
    setFormData({
      ...formData,
      productName: p.artName,
      productCode: p.autoCode,
      artColour: p.color,
      company: p.company?.name || "",
      brand: p.brand?.name || "",
      category: p.category?.name || "",
      type: p.type?.name || "",
      country: p.country?.name || "",
      gender: p.gender || "",
    });

    setIsLocked(true);
    setSearchQuery(p.artName);
    setSearchResults([]);
  };

  // --------------------------
  // SUBMIT
  // --------------------------
  const handleSubmit = () => {
    if (!formData.productName || !formData.productionQuantity) {
      toast.error("Please fill all required fields");
      return;
    }

    const cardData = {
      productName: formData.productName,
      productCode: formData.productCode,
      artColour: formData.artColour,
      company: formData.company,
      brand: formData.brand,
      category: formData.category,
      type: formData.type,
      country: formData.country,
      gender: formData.gender,
      quantity: parseInt(formData.productionQuantity),
      unit: formData.productionUnit,
      assignedPlant: formData.assignedPlant,
      startDate: formData.productionDate,
      endDate: formData.productionDate,
      remarks: formData.remarks,
      status: "scheduled",
      progress: 0,
    };

    onSave(cardData);
    toast.success(`Production card created for ${formData.productName}`);
    onOpenChange(false);
  };

  // --------------------------
  // UI START
  // --------------------------

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

          <button
            onClick={() => onOpenChange(false)}
            className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 scrollbar-hide">
          {/* ---------------- SEARCH BAR ---------------- */}
          <div className="space-y-2 relative">
            <Label className="text-base font-semibold text-gray-700">
              Search Product
            </Label>

            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                fetchProductList(e.target.value);
              }}
              placeholder="Search by product name or auto code..."
              className="h-12 text-base border-2 focus:border-blue-500"
            />

            {searchResults.length > 0 && (
              <div className="absolute w-full bg-white border rounded-md shadow-xl max-h-56 overflow-auto z-[999]">
                {searchResults.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => handleSelectProduct(item)}
                    className="px-4 py-2 cursor-pointer hover:bg-blue-50 border-b"
                  >
                    <p className="font-medium">{item.artName}</p>
                    <p className="text-sm text-gray-600">{item.autoCode}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* ---------------- PRODUCT INFORMATION ---------------- */}
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
              {/* Product Name */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Product Name *
                </Label>
                <Input
                  value={formData.productName}
                  readOnly={isLocked}
                  onChange={(e) =>
                    setFormData({ ...formData, productName: e.target.value })
                  }
                  placeholder="Product name"
                  className={`h-12 text-base border-2 ${
                    isLocked
                      ? "bg-gray-100 cursor-not-allowed"
                      : "focus:border-blue-500"
                  }`}
                />
              </div>

              {/* Product Code */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Product Code
                </Label>
                <Input
                  value={formData.productCode}
                  readOnly={isLocked}
                  onChange={(e) =>
                    setFormData({ ...formData, productCode: e.target.value })
                  }
                  placeholder="Product code"
                  className={`h-12 text-base border-2 ${
                    isLocked
                      ? "bg-gray-100 cursor-not-allowed"
                      : "focus:border-blue-500"
                  }`}
                />
              </div>

              {/* Art Colour */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Art / Colour Name
                </Label>
                <Input
                  value={formData.artColour}
                  readOnly={isLocked}
                  onChange={(e) =>
                    setFormData({ ...formData, artColour: e.target.value })
                  }
                  placeholder="Art / Colour"
                  className={`h-12 text-base border-2 ${
                    isLocked
                      ? "bg-gray-100 cursor-not-allowed"
                      : "focus:border-blue-500"
                  }`}
                />
              </div>

              {/* Company */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Company
                </Label>

                {isLocked ? (
                  <Input
                    value={formData.company}
                    readOnly
                    className="h-12 border-2 bg-gray-100 cursor-not-allowed"
                  />
                ) : (
                  <Select
                    value={formData.company}
                    onValueChange={(value) =>
                      setFormData({ ...formData, company: value })
                    }
                  >
                    <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aura">Aura</SelectItem>
                      <SelectItem value="Zenith">Zenith</SelectItem>
                      <SelectItem value="Peak Manufacturing">
                        Peak Manufacturing
                      </SelectItem>
                      <SelectItem value="Global Footwear">
                        Global Footwear
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Brand
                </Label>

                {isLocked ? (
                  <Input
                    value={formData.brand}
                    readOnly
                    className="h-12 border-2 bg-gray-100 cursor-not-allowed"
                  />
                ) : (
                  <Select
                    value={formData.brand}
                    onValueChange={(value) =>
                      setFormData({ ...formData, brand: value })
                    }
                  >
                    <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UA Sports">UA Sports</SelectItem>
                      <SelectItem value="AquaTech">AquaTech</SelectItem>
                      <SelectItem value="KAPPA">KAPPA</SelectItem>
                      <SelectItem value="FlexiWalk">FlexiWalk</SelectItem>
                      <SelectItem value="ZipStyle">ZipStyle</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Category
                </Label>

                {isLocked ? (
                  <Input
                    value={formData.category}
                    readOnly
                    className="h-12 border-2 bg-gray-100 cursor-not-allowed"
                  />
                ) : (
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sports">Sports</SelectItem>
                      <SelectItem value="Formal">Formal</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Kids">Kids</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Type
                </Label>

                {isLocked ? (
                  <Input
                    value={formData.type}
                    readOnly
                    className="h-12 border-2 bg-gray-100 cursor-not-allowed"
                  />
                ) : (
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Running">Running</SelectItem>
                      <SelectItem value="Leather">Leather</SelectItem>
                      <SelectItem value="Canvas">Canvas</SelectItem>
                      <SelectItem value="Pyskin">Pyskin</SelectItem>
                      <SelectItem value="CKD">CKD</SelectItem>
                      <SelectItem value="Sandals">Sandals</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Country
                </Label>

                {isLocked ? (
                  <Input
                    value={formData.country}
                    readOnly
                    className="h-12 border-2 bg-gray-100 cursor-not-allowed"
                  />
                ) : (
                  <Select
                    value={formData.country}
                    onValueChange={(value) =>
                      setFormData({ ...formData, country: value })
                    }
                  >
                    <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="China">China</SelectItem>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                      <SelectItem value="Vietnam">Vietnam</SelectItem>
                      <SelectItem value="Indonesia">Indonesia</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Gender
                </Label>

                {isLocked ? (
                  <Input
                    value={formData.gender}
                    readOnly
                    className="h-12 border-2 bg-gray-100 cursor-not-allowed"
                  />
                ) : (
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Men">Men</SelectItem>
                      <SelectItem value="Women">Women</SelectItem>
                      <SelectItem value="Kids">Kids</SelectItem>
                      <SelectItem value="Unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* ---------------- SCHEDULING ---------------- */}
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
              {/* Schedule On */}
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

              {/* Assigned Plant */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  Assigned Plant
                </Label>

                <Select
                  value={formData.assignedPlant}
                  onValueChange={(value) =>
                    setFormData({ ...formData, assignedPlant: value })
                  }
                >
                  <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                    <SelectValue placeholder="Select plant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plant A - China">
                      Plant A - China
                    </SelectItem>
                    <SelectItem value="Plant B - Bangladesh">
                      Plant B - Bangladesh
                    </SelectItem>
                    <SelectItem value="Plant C - India">
                      Plant C - India
                    </SelectItem>
                    <SelectItem value="Plant D - Vietnam">
                      Plant D - Vietnam
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ---------------- PRODUCTION DETAILS ---------------- */}
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
              {/* Production Quantity */}
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

          {/* ---------------- REMARKS ---------------- */}
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
        {/* end of scroll container */}
        {/* ---------------- FOOTER (unchanged UI) ---------------- */}
        <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t-2 border-gray-200 shadow-2xl shadow-gray-900/10 z-50">
          <div className="px-8 py-6 flex justify-end gap-4">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              size="lg"
              className="px-8 py-3 h-12 border-2 border-gray-300 text-gray-700 
              hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              size="lg"
              className="px-8 py-3 h-12 bg-linear-to-r from-blue-500 to-blue-600 
              hover:from-blue-600 hover:to-blue-700 text-white shadow-lg 
              hover:shadow-xl transition-all duration-200 border-0"
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
