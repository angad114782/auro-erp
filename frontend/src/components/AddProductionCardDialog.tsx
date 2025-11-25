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
import { toast } from "sonner@2.0.3";

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

  // Reset form when dialog opens and set the selected date
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
    }
  }, [open, selectedDate]);

  const handleSubmit = () => {
    // Validation
    if (
      !formData.productName ||
      !formData.productionQuantity ||
      !formData.productionUnit
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.productionDate) {
      toast.error("Please select a production date");
      return;
    }

    // Create production card data
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

    // Call the onSave callback to add the card
    onSave(cardData);

    // Show success message
    toast.success(
      `Production card created for ${formData.productName} on ${new Date(
        formData.productionDate
      ).toLocaleDateString("en-GB")}`
    );

    // Close dialog
    onOpenChange(false);
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
                  Add Production Card
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Create a new production card for the selected date
                </DialogDescription>
                <p className="text-lg text-gray-600">
                  Schedule:{" "}
                  {formData.productionDate
                    ? (() => {
                        const [year, month, day] =
                          formData.productionDate.split("-");
                        const date = new Date(
                          parseInt(year),
                          parseInt(month) - 1,
                          parseInt(day)
                        );
                        return date.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        });
                      })()
                    : "Not selected"}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              type="button"
              className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center border-0 bg-transparent transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-8 py-8 space-y-8">
            {/* Product Information Section */}
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
                  <Label
                    htmlFor="productName"
                    className="text-base font-semibold text-gray-700"
                  >
                    Product Name *
                  </Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) =>
                      setFormData({ ...formData, productName: e.target.value })
                    }
                    placeholder="e.g., Classic Running Shoes"
                    className="h-12 text-base border-2 focus:border-blue-500"
                  />
                </div>

                {/* Product Code */}
                <div className="space-y-2">
                  <Label
                    htmlFor="productCode"
                    className="text-base font-semibold text-gray-700"
                  >
                    Product Code
                  </Label>
                  <Input
                    id="productCode"
                    value={formData.productCode}
                    onChange={(e) =>
                      setFormData({ ...formData, productCode: e.target.value })
                    }
                    placeholder="e.g., RND/25-26/09/001"
                    className="h-12 text-base border-2 focus:border-blue-500"
                  />
                </div>

                {/* Art/Colour Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="artColour"
                    className="text-base font-semibold text-gray-700"
                  >
                    Art / Colour Name
                  </Label>
                  <Input
                    id="artColour"
                    value={formData.artColour}
                    onChange={(e) =>
                      setFormData({ ...formData, artColour: e.target.value })
                    }
                    placeholder="e.g., Milange Black, Chunky Mickey"
                    className="h-12 text-base border-2 focus:border-blue-500"
                  />
                </div>

                {/* Company */}
                <div className="space-y-2">
                  <Label
                    htmlFor="company"
                    className="text-base font-semibold text-gray-700"
                  >
                    Company
                  </Label>
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
                </div>

                {/* Brand */}
                <div className="space-y-2">
                  <Label
                    htmlFor="brand"
                    className="text-base font-semibold text-gray-700"
                  >
                    Brand
                  </Label>
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
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label
                    htmlFor="category"
                    className="text-base font-semibold text-gray-700"
                  >
                    Category
                  </Label>
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
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label
                    htmlFor="type"
                    className="text-base font-semibold text-gray-700"
                  >
                    Type
                  </Label>
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
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label
                    htmlFor="country"
                    className="text-base font-semibold text-gray-700"
                  >
                    Country
                  </Label>
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
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label
                    htmlFor="gender"
                    className="text-base font-semibold text-gray-700"
                  >
                    Gender
                  </Label>
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
                </div>
              </div>
            </div>

            {/* Scheduling Information Section */}
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
                  <Label
                    htmlFor="productionDate"
                    className="text-base font-semibold text-gray-700"
                  >
                    Schedule On *
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                    <Input
                      id="productionDate"
                      type="date"
                      value={formData.productionDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          productionDate: e.target.value,
                        })
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
                  <p className="text-sm text-gray-500">
                    Assign this production to a manufacturing plant
                  </p>
                </div>
              </div>
            </div>

            {/* Production Details Section */}
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
                  <Label
                    htmlFor="productionQuantity"
                    className="text-base font-semibold text-gray-700"
                  >
                    Production Quantity *
                  </Label>
                  <Input
                    id="productionQuantity"
                    type="number"
                    min="0"
                    value={formData.productionQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        productionQuantity: e.target.value,
                      })
                    }
                    placeholder="e.g., 1200"
                    className="h-12 text-base border-2 focus:border-blue-500"
                  />
                </div>

                {/* Production Unit */}
                <div className="space-y-2">
                  <Label
                    htmlFor="productionUnit"
                    className="text-base font-semibold text-gray-700"
                  >
                    Production Unit *
                  </Label>
                  <Select
                    value={formData.productionUnit}
                    onValueChange={(value) =>
                      setFormData({ ...formData, productionUnit: value })
                    }
                  >
                    <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pairs">Pairs</SelectItem>
                      <SelectItem value="pieces">Pieces</SelectItem>
                      <SelectItem value="units">Units</SelectItem>
                      <SelectItem value="sets">Sets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Remarks Section */}
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
                  placeholder="Add any special instructions, notes, or requirements for this production card..."
                  rows={4}
                  className="resize-none text-base border-2 focus:border-blue-500 leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
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
