import React, { useState, useEffect } from "react";
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Building,
  X,
  Save,
  User,
  Package,
  Tag,
  Award,
  ChevronDown,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { useVendorStore } from "../hooks/useVendor";

interface VendorAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VendorAddDialog({ open, onOpenChange }: VendorAddDialogProps) {
  const { vendors, addVendor } = useVendorStore();
  const [formData, setFormData] = useState({
    vendorName: "",
    vendorId: "",
    contactPerson: "",
    phone: "",
    email: "",
    countryId: "1",
    status: "Active" as const,
    itemName: "",
    itemCode: "",
    brand: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      const maxVendorNum =
        vendors.length > 0
          ? Math.max(
              ...vendors.map((v) => {
                const match = v.vendorId.match(/VND(\d+)/);
                return match ? parseInt(match[1]) : 0;
              })
            )
          : 0;
      const nextVendorId = `VND${(maxVendorNum + 1)
        .toString()
        .padStart(3, "0")}`;

      setFormData({
        vendorName: "",
        vendorId: nextVendorId,
        contactPerson: "",
        phone: "",
        email: "",
        countryId: "1",
        status: "Active",
        itemName: "",
        itemCode: "",
        brand: "",
      });
      setErrors({});
    }
  }, [open, vendors]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.vendorName.trim()) {
      newErrors.vendorName = "Vendor name is required";
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = "Contact person is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.itemName.trim()) {
      newErrors.itemName = "Item name is required";
    }

    if (!formData.itemCode.trim()) {
      newErrors.itemCode = "Item code is required";
    }

    if (!formData.brand.trim()) {
      newErrors.brand = "Brand is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      await addVendor(formData);
      toast.success(`Vendor "${formData.vendorName}" added successfully!`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding vendor:", error);
      toast.error("Failed to add vendor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      vendorName: "",
      vendorId: "",
      contactPerson: "",
      phone: "",
      email: "",
      countryId: "1",
      status: "Active",
      itemName: "",
      itemCode: "",
      brand: "",
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-6xl w-[95vw] md:w-full max-h-[95vh] md:max-h-[85vh] p-0 md:rounded-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-50 px-4 md:px-8 py-4 md:py-6 bg-linear-to-r from-green-50 via-white to-green-50 border-b-2 border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-green-500 to-green-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg text-white font-bold flex-shrink-0">
                <Users className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg md:text-2xl font-semibold text-gray-900 truncate">
                  Add New Vendor
                </DialogTitle>
                <DialogDescription className="text-sm md:text-base text-gray-600 mt-1 truncate">
                  Create a new vendor profile
                </DialogDescription>
              </div>
            </div>
            <Button
              onClick={handleCancel}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="space-y-6 md:space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  Basic Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendorName" className="text-sm font-medium">
                    Vendor Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="vendorName"
                    value={formData.vendorName}
                    onChange={(e) =>
                      handleInputChange("vendorName", e.target.value)
                    }
                    placeholder="Enter vendor name"
                    className={`h-10 ${
                      errors.vendorName ? "border-red-500" : ""
                    }`}
                  />
                  {errors.vendorName && (
                    <p className="text-sm text-red-600">{errors.vendorName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendorId" className="text-sm font-medium">
                    Vendor ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="vendorId"
                    value={formData.vendorId}
                    readOnly
                    className="h-10 bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleInputChange("status", value)
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">
                    Location
                  </Label>
                  <Select
                    value={formData.countryId}
                    onValueChange={(value) =>
                      handleInputChange("countryId", value)
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">India</SelectItem>
                      <SelectItem value="2">China</SelectItem>
                      <SelectItem value="3">Vietnam</SelectItem>
                      <SelectItem value="4">Indonesia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  Contact Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="contactPerson"
                    className="text-sm font-medium"
                  >
                    Contact Person <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) =>
                        handleInputChange("contactPerson", e.target.value)
                      }
                      placeholder="Enter contact person name"
                      className={`h-10 pl-10 ${
                        errors.contactPerson ? "border-red-500" : ""
                      }`}
                    />
                  </div>
                  {errors.contactPerson && (
                    <p className="text-sm text-red-600">
                      {errors.contactPerson}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="Enter phone number"
                      className={`h-10 pl-10 ${
                        errors.phone ? "border-red-500" : ""
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="Enter email address"
                      className={`h-10 pl-10 ${
                        errors.email ? "border-red-500" : ""
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Item Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  Item Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemName" className="text-sm font-medium">
                    Item Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="itemName"
                    value={formData.itemName}
                    onChange={(e) =>
                      handleInputChange("itemName", e.target.value)
                    }
                    placeholder="Enter item name"
                    className={`h-10 ${
                      errors.itemName ? "border-red-500" : ""
                    }`}
                  />
                  {errors.itemName && (
                    <p className="text-sm text-red-600">{errors.itemName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemCode" className="text-sm font-medium">
                    Item Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="itemCode"
                    value={formData.itemCode}
                    onChange={(e) =>
                      handleInputChange("itemCode", e.target.value)
                    }
                    placeholder="Enter item code"
                    className={`h-10 ${
                      errors.itemCode ? "border-red-500" : ""
                    }`}
                  />
                  {errors.itemCode && (
                    <p className="text-sm text-red-600">{errors.itemCode}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="brand" className="text-sm font-medium">
                    Brand <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) =>
                        handleInputChange("brand", e.target.value)
                      }
                      placeholder="Enter brand name"
                      className={`h-10 pl-10 ${
                        errors.brand ? "border-red-500" : ""
                      }`}
                    />
                  </div>
                  {errors.brand && (
                    <p className="text-sm text-red-600">{errors.brand}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 px-4 md:px-8 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-sm text-gray-600">
            <span className="text-red-500">*</span> Required fields
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Add Vendor
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
