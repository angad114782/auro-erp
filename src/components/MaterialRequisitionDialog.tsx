import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  ShoppingCart, Plus, Trash2, Package, AlertTriangle, 
  CheckCircle, IndianRupee, Calendar, User, Building 
} from 'lucide-react';
import { useERPStore } from '../lib/data-store';

interface MaterialRequisitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionCardId?: string;
  productName?: string;
}

interface MaterialItem {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  availableStock: number;
  estimatedCost: number;
  priority: string;
  notes?: string;
}

export function MaterialRequisitionDialog({ 
  open, 
  onOpenChange, 
  productionCardId = '', 
  productName = '' 
}: MaterialRequisitionDialogProps) {
  const { rawMaterials } = useERPStore();
  const [formData, setFormData] = useState({
    productionCardId: productionCardId,
    productName: productName,
    requestedBy: 'John Smith',
    department: 'Production Floor A',
    priority: 'Medium',
    requiredDate: '',
    notes: '',
  });

  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([
    {
      id: '1',
      materialName: '',
      quantity: 0,
      unit: 'pieces',
      availableStock: 0,
      estimatedCost: 0,
      priority: 'Medium',
      notes: ''
    }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMaterialChange = (index: number, field: keyof MaterialItem, value: any) => {
    setMaterialItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Auto-populate available stock when material is selected
      if (field === 'materialName') {
        const selectedMaterial = rawMaterials.find(m => m.materialName === value);
        if (selectedMaterial) {
          updated[index].availableStock = selectedMaterial.stockQuantity || 0;
          updated[index].estimatedCost = selectedMaterial.unitPrice || 0;
        }
      }
      
      return updated;
    });
  };

  const addMaterialItem = () => {
    setMaterialItems(prev => [...prev, {
      id: Date.now().toString(),
      materialName: '',
      quantity: 0,
      unit: 'pieces',
      availableStock: 0,
      estimatedCost: 0,
      priority: 'Medium',
      notes: ''
    }]);
  };

  const removeMaterialItem = (index: number) => {
    if (materialItems.length > 1) {
      setMaterialItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.productionCardId.trim()) {
      newErrors.productionCardId = 'Production Card ID is required';
    }
    if (!formData.productName.trim()) {
      newErrors.productName = 'Product Name is required';
    }
    if (!formData.requiredDate) {
      newErrors.requiredDate = 'Required Date is required';
    }

    // Validate material items
    materialItems.forEach((item, index) => {
      if (!item.materialName) {
        newErrors[`material_${index}`] = 'Material name is required';
      }
      if (item.quantity <= 0) {
        newErrors[`quantity_${index}`] = 'Quantity must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Here you would typically save to your data store
      console.log('Material Requisition Data:', {
        formData,
        materialItems,
        totalItems: materialItems.length,
        totalEstimatedCost: materialItems.reduce((sum, item) => sum + (item.quantity * item.estimatedCost), 0)
      });
      
      // Reset form and close dialog
      setFormData({
        productionCardId: '',
        productName: '',
        requestedBy: 'John Smith',
        department: 'Production Floor A',
        priority: 'Medium',
        requiredDate: '',
        notes: '',
      });
      setMaterialItems([{
        id: '1',
        materialName: '',
        quantity: 0,
        unit: 'pieces',
        availableStock: 0,
        estimatedCost: 0,
        priority: 'Medium',
        notes: ''
      }]);
      setErrors({});
      onOpenChange(false);
    }
  };

  const getTotalEstimatedCost = () => {
    return materialItems.reduce((sum, item) => sum + (item.quantity * item.estimatedCost), 0);
  };

  const getStockStatus = (requested: number, available: number) => {
    if (available >= requested) return { status: 'Available', color: 'text-green-600' };
    if (available > 0) return { status: 'Partial', color: 'text-yellow-600' };
    return { status: 'Out of Stock', color: 'text-red-600' };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            Create Material Requisition
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-4 h-4" />
                Requisition Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productionCardId">Production Card ID *</Label>
                <Input
                  id="productionCardId"
                  value={formData.productionCardId}
                  onChange={(e) => handleFormChange('productionCardId', e.target.value)}
                  placeholder="PC-001"
                  className={errors.productionCardId ? 'border-red-500' : ''}
                />
                {errors.productionCardId && (
                  <p className="text-sm text-red-600">{errors.productionCardId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  value={formData.productName}
                  onChange={(e) => handleFormChange('productName', e.target.value)}
                  placeholder="Premium Lifestyle Sneakers"
                  className={errors.productName ? 'border-red-500' : ''}
                />
                {errors.productName && (
                  <p className="text-sm text-red-600">{errors.productName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestedBy">Requested By</Label>
                <Input
                  id="requestedBy"
                  value={formData.requestedBy}
                  onChange={(e) => handleFormChange('requestedBy', e.target.value)}
                  placeholder="John Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department} onValueChange={(value) => handleFormChange('department', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Production Floor A">Production Floor A</SelectItem>
                    <SelectItem value="Production Floor B">Production Floor B</SelectItem>
                    <SelectItem value="Production Floor C">Production Floor C</SelectItem>
                    <SelectItem value="Quality Control">Quality Control</SelectItem>
                    <SelectItem value="Finishing Department">Finishing Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleFormChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredDate">Required Date *</Label>
                <Input
                  id="requiredDate"
                  type="date"
                  value={formData.requiredDate}
                  onChange={(e) => handleFormChange('requiredDate', e.target.value)}
                  className={errors.requiredDate ? 'border-red-500' : ''}
                />
                {errors.requiredDate && (
                  <p className="text-sm text-red-600">{errors.requiredDate}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Material Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Material Requirements
                </CardTitle>
                <Button onClick={addMaterialItem} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Material
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {materialItems.map((item, index) => (
                <Card key={item.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label>Material Name *</Label>
                        <Select 
                          value={item.materialName} 
                          onValueChange={(value) => handleMaterialChange(index, 'materialName', value)}
                        >
                          <SelectTrigger className={errors[`material_${index}`] ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {rawMaterials.map((material) => (
                              <SelectItem key={material.id} value={material.materialName || ''}>
                                {material.materialName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[`material_${index}`] && (
                          <p className="text-sm text-red-600">{errors[`material_${index}`]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleMaterialChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className={errors[`quantity_${index}`] ? 'border-red-500' : ''}
                        />
                        {errors[`quantity_${index}`] && (
                          <p className="text-sm text-red-600">{errors[`quantity_${index}`]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Select 
                          value={item.unit} 
                          onValueChange={(value) => handleMaterialChange(index, 'unit', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pieces">Pieces</SelectItem>
                            <SelectItem value="pairs">Pairs</SelectItem>
                            <SelectItem value="meters">Meters</SelectItem>
                            <SelectItem value="sqft">Sq Ft</SelectItem>
                            <SelectItem value="kg">Kg</SelectItem>
                            <SelectItem value="sheets">Sheets</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Available Stock</Label>
                        <div className="flex items-center gap-2">
                          <Input value={item.availableStock} readOnly className="bg-gray-50" />
                          <div className={getStockStatus(item.quantity, item.availableStock).color}>
                            {item.quantity > item.availableStock ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                        <p className={`text-xs ${getStockStatus(item.quantity, item.availableStock).color}`}>
                          {getStockStatus(item.quantity, item.availableStock).status}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Est. Cost (₹)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={(item.quantity * item.estimatedCost).toLocaleString('en-IN')}
                            readOnly
                            className="bg-gray-50"
                          />
                          {materialItems.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMaterialItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Total Cost Summary */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Materials: {materialItems.length}</p>
                      <p className="text-sm text-gray-600">
                        Total Quantity: {materialItems.reduce((sum, item) => sum + item.quantity, 0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Estimated Cost</p>
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-4 h-4 text-blue-600" />
                        <span className="text-xl font-bold text-blue-600">
                          {getTotalEstimatedCost().toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Special Instructions</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Any special instructions or notes for the store room..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Submit Requisition
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}