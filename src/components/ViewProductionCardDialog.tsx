import React, { useState, useEffect } from 'react';
import { X, Package, Calendar, Building, FileText, Save, Plus, CheckCircle, Factory } from 'lucide-react';
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
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';

interface ProductionPlan {
  id: string;
  productName: string;
  projectCode: string;
  brand: string;
  category: string;
  type: string;
  gender: string;
  artColour: string;
  country: string;
  quantity: number;
  assignedPlant: string;
  startDate: string;
  endDate: string;
  remarks: string;
  status: string;
  priority: string;
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
    scheduleDate: '',
    assignedPlant: '',
    quantity: '',
    unit: 'Pairs',
    remarks: '',
  });

  // Plants list and dialog state
  const [plantsList, setPlantsList] = useState<string[]>([
    'Plant A - China',
    'Plant B - Bangladesh',
    'Plant C - India',
    'Plant D - Vietnam',
    'Plant E - Thailand',
  ]);
  const [addPlantDialogOpen, setAddPlantDialogOpen] = useState(false);
  const [newPlantName, setNewPlantName] = useState('');

  // Units list and dialog state
  const [unitsList, setUnitsList] = useState<string[]>([
    'Pairs',
    'Pieces',
    'Sets',
    'Units',
    'Dozens',
    'Cartons',
  ]);
  const [addUnitDialogOpen, setAddUnitDialogOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open && productionData) {
      setFormData({
        scheduleDate: productionData.startDate || '',
        assignedPlant: productionData.assignedPlant || '',
        quantity: productionData.quantity?.toString() || '',
        unit: 'Pairs',
        remarks: productionData.remarks || '',
      });
    }
  }, [open, productionData]);

  if (!productionData) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Handler to save new plant
  const saveNewPlant = () => {
    if (!newPlantName.trim()) {
      toast.error('Please enter plant name');
      return;
    }

    if (plantsList.includes(newPlantName)) {
      toast.error('Plant already exists');
      return;
    }

    setPlantsList([...plantsList, newPlantName]);
    setFormData({ ...formData, assignedPlant: newPlantName });
    setNewPlantName('');
    setAddPlantDialogOpen(false);
    toast.success('Plant added successfully');
  };

  // Handler to save new unit
  const saveNewUnit = () => {
    if (!newUnitName.trim()) {
      toast.error('Please enter unit name');
      return;
    }

    if (unitsList.includes(newUnitName)) {
      toast.error('Unit already exists');
      return;
    }

    setUnitsList([...unitsList, newUnitName]);
    setFormData({ ...formData, unit: newUnitName });
    setNewUnitName('');
    setAddUnitDialogOpen(false);
    toast.success('Unit added successfully');
  };

  const handleSave = () => {
    // Validation
    if (!formData.scheduleDate) {
      toast.error('Please select a schedule date');
      return;
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    // Create updated data
    const updatedData = {
      ...productionData,
      startDate: formData.scheduleDate,
      endDate: formData.scheduleDate,
      assignedPlant: formData.assignedPlant,
      quantity: parseInt(formData.quantity),
      remarks: formData.remarks,
    };

    // Call the onSave callback
    onSave(updatedData);

    // Show success message
    toast.success(`Production card updated successfully`);

    // Close dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl !w-5xl max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 px-8 py-6 bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b-2 border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-semibold text-gray-900 mb-1">
                  Edit Production Card
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600">
                  Scheduled for {productionData.startDate ? formatDate(productionData.startDate) : '-'}
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
          {/* Scheduling Information Section - MOVED TO TOP */}
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center shadow-md">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Scheduling Information</h3>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Schedule On - EDITABLE */}
              <div className="space-y-2">
                <Label htmlFor="scheduleDate" className="text-base font-semibold text-gray-700">
                  Schedule On *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                  <Input
                    id="scheduleDate"
                    type="date"
                    value={formData.scheduleDate}
                    onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                    className="pl-12 h-12 text-base border-2 focus:border-blue-500"
                    style={{ colorScheme: 'light' }}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Select the date for production scheduling
                </p>
              </div>

              {/* Assigned Plant - EDITABLE */}
              <div className="space-y-2">
                <Label htmlFor="assignedPlant" className="text-base font-semibold text-gray-700">
                  Assigned Plant *
                </Label>
                <Select
                  value={formData.assignedPlant}
                  onValueChange={(value) => {
                    if (value === '__add_new__') {
                      setAddPlantDialogOpen(true);
                    } else {
                      setFormData({ ...formData, assignedPlant: value });
                    }
                  }}
                >
                  <SelectTrigger className="h-12 border-2 focus:border-blue-500">
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
                <p className="text-sm text-gray-500">
                  Assign this production to a manufacturing plant
                </p>
              </div>
            </div>
          </div>

          {/* Product Information Section - READ ONLY, 6 COLUMNS */}
          <div className="space-y-4">
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Product Information</h3>
            </div>

            {/* Compact Table Layout */}
            <div className="bg-white rounded-lg">
              {/* 3x3 Grid - 9 Fields Only */}
              <div className="grid grid-cols-3 gap-6">
                {/* Product Name */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Product Name</div>
                  <div className="text-sm text-gray-900">{productionData.productName || '-'}</div>
                </div>

                {/* Product Code */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Product Code</div>
                  <div className="text-sm text-gray-900">{productionData.projectCode || '-'}</div>
                </div>

                {/* Art/Colour Name */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Art/Colour Name</div>
                  <div className="text-sm text-gray-900">{productionData.artColour || '-'}</div>
                </div>

                {/* Company */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Company</div>
                  <div className="text-sm text-gray-900">-</div>
                </div>

                {/* Brand */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Brand</div>
                  <div className="text-sm text-gray-900">{productionData.brand || '-'}</div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Category</div>
                  <div className="text-sm text-gray-900">{productionData.category || '-'}</div>
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Type</div>
                  <div className="text-sm text-gray-900">{productionData.type || '-'}</div>
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Country</div>
                  <div className="text-sm text-gray-900">{productionData.country || '-'}</div>
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Gender</div>
                  <div className="text-sm text-gray-900">{productionData.gender || '-'}</div>
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
              <h3 className="text-xl font-semibold text-gray-900">Production Details</h3>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Production Quantity - EDITABLE */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-base font-semibold text-gray-700">
                  Production Quantity *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="e.g., 1200"
                  className="h-12 text-base border-2 focus:border-blue-500"
                />
              </div>

              {/* Production Unit - EDITABLE */}
              <div className="space-y-2">
                <Label htmlFor="unit" className="text-base font-semibold text-gray-700">
                  Production Unit *
                </Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => {
                    if (value === '__add_new__') {
                      setAddUnitDialogOpen(true);
                    } else {
                      setFormData({ ...formData, unit: value });
                    }
                  }}
                >
                  <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitsList.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                    <Separator className="my-1" />
                    <div
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      onClick={() => setAddUnitDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Unit
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Information Section - EDITABLE */}
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Additional Information</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks" className="text-base font-semibold text-gray-700">
                Remarks
              </Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Enter any additional notes or remarks"
                className="min-h-[120px] text-base border-2 focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-50 px-8 py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200 flex items-center justify-end gap-4 shadow-lg">
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
            className="px-8 py-3 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
          >
            <Save className="w-5 h-5 mr-2" />
            Save Changes
          </Button>
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
                placeholder="e.g., Plant F - Indonesia"
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
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
                setNewPlantName('');
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

      {/* Add New Unit Dialog */}
      <Dialog open={addUnitDialogOpen} onOpenChange={setAddUnitDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Add New Unit
            </DialogTitle>
            <DialogDescription>
              Enter the name of the new production unit
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="unitName">Unit Name *</Label>
              <Input
                id="unitName"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="e.g., Boxes, Pallets, Containers"
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    saveNewUnit();
                  }
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAddUnitDialogOpen(false);
                setNewUnitName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveNewUnit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Add Unit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}