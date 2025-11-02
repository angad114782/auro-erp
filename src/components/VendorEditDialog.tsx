import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { useERPStore } from '../lib/data-store';
import { toast } from 'sonner';

interface VendorEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: any;
}

export function VendorEditDialog({ open, onOpenChange, vendor }: VendorEditDialogProps) {
  const { updateVendor } = useERPStore();
  const [formData, setFormData] = useState({
    vendorName: '',
    vendorId: '',
    contactPerson: '',
    phone: '',
    email: '',
    countryId: '',
    status: 'Active',
    itemName: '',
    itemCode: '',
    brand: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when vendor changes
  useEffect(() => {
    if (vendor) {
      setFormData({
        vendorName: vendor.vendorName || '',
        vendorId: vendor.vendorId || '',
        contactPerson: vendor.contactPerson || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        countryId: vendor.countryId || '1',
        status: vendor.status || 'Active',
        itemName: vendor.itemName || '',
        itemCode: vendor.itemCode || '',
        brand: vendor.brand || ''
      });
      setErrors({});
    }
  }, [vendor]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.vendorName.trim()) {
      newErrors.vendorName = 'Vendor name is required';
    }
    
    if (!formData.vendorId.trim()) {
      newErrors.vendorId = 'Vendor ID is required';
    }
    
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Item validation
    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Item name is required';
    }
    
    if (!formData.itemCode.trim()) {
      newErrors.itemCode = 'Item code is required';
    }
    
    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Update vendor in the store
      updateVendor(vendor.id, formData);
      
      toast.success(`Vendor "${formData.vendorName}" updated successfully!`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast.error('Failed to update vendor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (vendor) {
      setFormData({
        vendorName: vendor.vendorName || '',
        vendorId: vendor.vendorId || '',
        contactPerson: vendor.contactPerson || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        countryId: vendor.countryId || '1',
        status: vendor.status || 'Active',
        itemName: vendor.itemName || '',
        itemCode: vendor.itemCode || '',
        brand: vendor.brand || ''
      });
    }
    setErrors({});
    onOpenChange(false);
  };

  if (!vendor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl !w-4xl max-h-[90vh] overflow-hidden p-0 m-0 flex flex-col [&>button]:hidden">
        {/* Header Section */}
        <div className="px-8 py-6 bg-gradient-to-r from-cyan-50 via-white to-cyan-50 border-b-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg text-white font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-semibold text-gray-900">
                  Edit Vendor Information
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600 mt-1">
                  Update vendor details and contact information
                </DialogDescription>
              </div>
            </div>
            <Button
              onClick={handleCancel}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
            >
              <X className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                  <Building className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="vendorName" className="text-sm font-medium text-gray-700">
                    Vendor Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="vendorName"
                    value={formData.vendorName}
                    onChange={(e) => handleInputChange('vendorName', e.target.value)}
                    placeholder="Enter vendor name"
                    className={`h-10 ${errors.vendorName ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {errors.vendorName && (
                    <p className="text-sm text-red-600">{errors.vendorName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendorId" className="text-sm font-medium text-gray-700">
                    Vendor ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="vendorId"
                    value={formData.vendorId}
                    onChange={(e) => handleInputChange('vendorId', e.target.value)}
                    placeholder="Enter vendor ID"
                    className={`h-10 ${errors.vendorId ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {errors.vendorId && (
                    <p className="text-sm text-red-600">{errors.vendorId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                    Status
                  </Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                    Location
                  </Label>
                  <Select value={formData.countryId} onValueChange={(value) => handleInputChange('countryId', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select location" />
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

            {/* Contact Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson" className="text-sm font-medium text-gray-700">
                    Contact Person <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      placeholder="Enter contact person name"
                      className={`h-10 pl-10 ${errors.contactPerson ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                  </div>
                  {errors.contactPerson && (
                    <p className="text-sm text-red-600">{errors.contactPerson}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      className={`h-10 pl-10 ${errors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      className={`h-10 pl-10 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Item Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Item Information</h3>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="itemName" className="text-sm font-medium text-gray-700">
                    Item Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="itemName"
                    value={formData.itemName}
                    onChange={(e) => handleInputChange('itemName', e.target.value)}
                    placeholder="Enter item name"
                    className={`h-10 ${errors.itemName ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {errors.itemName && (
                    <p className="text-sm text-red-600">{errors.itemName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemCode" className="text-sm font-medium text-gray-700">
                    Item Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="itemCode"
                    value={formData.itemCode}
                    onChange={(e) => handleInputChange('itemCode', e.target.value)}
                    placeholder="Enter item code"
                    className={`h-10 ${errors.itemCode ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {errors.itemCode && (
                    <p className="text-sm text-red-600">{errors.itemCode}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="brand" className="text-sm font-medium text-gray-700">
                    Brand <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      placeholder="Enter brand name"
                      className={`h-10 pl-10 ${errors.brand ? 'border-red-500 focus:border-red-500' : ''}`}
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
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-red-500">*</span>
            <span>Required fields</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-6 bg-cyan-600 hover:bg-cyan-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}