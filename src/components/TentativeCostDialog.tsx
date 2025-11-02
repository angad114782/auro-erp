import React, { useState, useEffect } from 'react';
import { Calculator, IndianRupee, CheckCircle, AlertTriangle, TrendingUp, DollarSign, Percent, Save, X, ArrowRight, Plus, Trash2, Scissors, Printer, Shirt, Wrench, Package, FileCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { useERPStore } from '../lib/data-store';
import type { RDProject } from '../lib/data-store';

interface TentativeCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: RDProject | null;
  onApproved: () => void;
}

// Add New Item Dialog Component - moved outside to prevent re-creation on render
const AddNewItemDialog = ({ 
  category, 
  isOpen, 
  onClose, 
  formData, 
  onFormChange, 
  onAddItem 
}: { 
  category: string;
  isOpen: boolean;
  onClose: () => void;
  formData: { item: string; description: string; consumption: string; cost: number };
  onFormChange: (field: string, value: string | number) => void;
  onAddItem: () => void;
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New {category.charAt(0).toUpperCase() + category.slice(1)} Item
        </DialogTitle>
        <DialogDescription>
          Add a new item to the {category} cost breakdown
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor={`item-${category}`}>Item Name *</Label>
          <Input
            id={`item-${category}`}
            value={formData.item}
            onChange={(e) => onFormChange('item', e.target.value)}
            placeholder="Enter item name"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`description-${category}`}>Description</Label>
          <Input
            id={`description-${category}`}
            value={formData.description}
            onChange={(e) => onFormChange('description', e.target.value)}
            placeholder="Enter description (optional)"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`consumption-${category}`}>Consumption</Label>
          <Input
            id={`consumption-${category}`}
            value={formData.consumption}
            onChange={(e) => onFormChange('consumption', e.target.value)}
            placeholder="Enter consumption details (optional)"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`cost-${category}`}>Cost *</Label>
          <div className="relative mt-1">
            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id={`cost-${category}`}
              type="number"
              value={formData.cost || ''}
              onChange={(e) => onFormChange('cost', Number(e.target.value) || 0)}
              placeholder="0.00"
              className="pl-10"
              min="0"
              step="0.01"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onAddItem}>
            Add Item
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

// Stage Selector Component - inline dropdown for row-level stage advancement
const StageSelector = ({ itemKey, category }: { itemKey: string; category: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  const stages = [
    { value: 'cutting', label: 'Cutting', icon: Scissors, color: 'text-purple-600' },
    { value: 'printing', label: 'Printing', icon: Printer, color: 'text-blue-600' },
    { value: 'stitching', label: 'Stitching', icon: Shirt, color: 'text-indigo-600' },
    { value: 'lasting', label: 'Lasting', icon: Wrench, color: 'text-orange-600' },
    { value: 'packing', label: 'Packing', icon: Package, color: 'text-green-600' },
    { value: 'quality', label: 'Quality Check', icon: FileCheck, color: 'text-emerald-600' },
  ];

  const handleStageSelect = (stage: string, label: string) => {
    setIsOpen(false);
    toast.success(`${itemKey} will advance to ${label}`);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 p-0 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
        title="Advance to stage"
      >
        <Plus className="w-4 h-4" />
      </Button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
            {stages.map((stage) => {
              const Icon = stage.icon;
              return (
                <button
                  key={stage.value}
                  onClick={() => handleStageSelect(stage.value, stage.label)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <Icon className={`w-4 h-4 ${stage.color}`} />
                  <span className="text-sm">{stage.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export function TentativeCostDialog({ open, onOpenChange, project, onApproved }: TentativeCostDialogProps) {
  const { updateRDProject } = useERPStore();
  
  const [productionCost, setProductionCost] = useState<number>(0);
  const [profitMargin, setProfitMargin] = useState<number>(25); // Default 25%
  const [additionalCosts, setAdditionalCosts] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>('');
  const [isApproved, setIsApproved] = useState<boolean>(false);

  // Cost breakdown state
  const [materialCost, setMaterialCost] = useState<number>(0);
  const [laborCost, setLaborCost] = useState<number>(0);
  const [overheadCost, setOverheadCost] = useState<number>(0);
  const [toolingCost, setToolingCost] = useState<number>(0);

  // Upper Cost state
  const [upperCosts, setUpperCosts] = useState<{[key: string]: number}>({
    upper: 0,
    lining1: 6.20,
    lining2: 0
  });

  // Component Cost state
  const [componentCosts, setComponentCosts] = useState<{[key: string]: number}>({
    foam: 0,
    velcro: 0,
    elasticRoop: 0,
    thread: 1.00,
    taftaLabel: 1.00,
    buckle: 0,
    heatTransfer: 1.00,
    trim: 0,
    welding: 1.00
  });

  // Material Cost state
  const [materialCosts, setMaterialCosts] = useState<{[key: string]: number}>({
    footbed1: 0,
    footbed2: 0,
    midSole1: 0,
    midSole2: 0,
    taperHeel: 0,
    arch: 0,
    outSole: 98.00,
    thread: 0,
    adhesive: 0,
    puAdhesive: 7.00,
    reinforcement: 0,
    embossBuff: 0,
    print: 4.00,
    lazer: 0,
    lazer2: 0
  });

  // Packaging Cost state
  const [packagingCosts, setPackagingCosts] = useState<{[key: string]: number}>({
    inner: 22.00,
    outer: 0,
    toeFit: 0,
    tissue: 0,
    wrappingPaper: 0,
    barCode: 0,
    brandTag: 0,
    tagPin: 0,
    outerLabel: 0,
    tapeStrapping: 0
  });

  // Labour + OH Cost state
  const [labourCosts, setLabourCosts] = useState<{[key: string]: number}>({
    upper: 0,
    assembly: 0,
    printing: 0,
    packing: 0
  });

  // Total Labour Cost (directly editable)
  const [totalLabourCost, setTotalLabourCost] = useState<number>(62.00);

  // Miscellaneous Cost state
  const [miscellaneousCosts, setMiscellaneousCosts] = useState<{[key: string]: number}>({
    consumables: 0,
    secondsPercent: 4.064,
    factoryExp: 0,
    freight: 2
  });

  // Dialog states for adding new items
  const [addItemDialogs, setAddItemDialogs] = useState({
    upper: false,
    component: false,
    material: false,
    packaging: false,
    miscellaneous: false
  });

  // Custom items state
  const [customItems, setCustomItems] = useState<{[key: string]: Array<{id: string, item: string, description: string, consumption: string, cost: number}>}>({
    upper: [],
    component: [],
    material: [],
    packaging: [],
    miscellaneous: []
  });

  // Form states for each dialog category - separate to prevent conflicts
  const [dialogForms, setDialogForms] = useState({
    upper: { item: '', description: '', consumption: '', cost: 0 },
    component: { item: '', description: '', consumption: '', cost: 0 },
    material: { item: '', description: '', consumption: '', cost: 0 },
    packaging: { item: '', description: '', consumption: '', cost: 0 },
    miscellaneous: { item: '', description: '', consumption: '', cost: 0 }
  });

  useEffect(() => {
    if (project && open) {
      // Initialize with project data or defaults
      const baseCost = project.targetCost || 10000;
      setMaterialCost(Math.round(baseCost * 0.4)); // 40% material
      setLaborCost(Math.round(baseCost * 0.3)); // 30% labor
      setOverheadCost(Math.round(baseCost * 0.2)); // 20% overhead
      setToolingCost(Math.round(baseCost * 0.1)); // 10% tooling
      setProductionCost(baseCost);
      setRemarks('Tentative cost calculation for Red Seal approval process.');
    }
  }, [project, open]);

  // Calculate upper cost total
  const calculateUpperTotal = () => {
    return Object.values(upperCosts).reduce((sum, cost) => sum + (cost || 0), 0);
  };

  // Calculate component cost total
  const calculateComponentTotal = () => {
    return Object.values(componentCosts).reduce((sum, cost) => sum + (cost || 0), 0);
  };

  // Calculate material cost total
  const calculateMaterialTotal = () => {
    return Object.values(materialCosts).reduce((sum, cost) => sum + (cost || 0), 0);
  };

  // Calculate packaging cost total
  const calculatePackagingTotal = () => {
    return Object.values(packagingCosts).reduce((sum, cost) => sum + (cost || 0), 0);
  };

  // Calculate labour cost total (from individual items)
  const calculateLabourTotal = () => {
    return Object.values(labourCosts).reduce((sum, cost) => sum + (cost || 0), 0);
  };

  // Update upper cost
  const updateUpperCost = (key: string, value: number) => {
    setUpperCosts(prev => ({
      ...prev,
      [key]: value || 0
    }));
  };

  // Update component cost
  const updateComponentCost = (key: string, value: number) => {
    setComponentCosts(prev => ({
      ...prev,
      [key]: value || 0
    }));
  };

  // Update material cost
  const updateMaterialCost = (key: string, value: number) => {
    setMaterialCosts(prev => ({
      ...prev,
      [key]: value || 0
    }));
  };

  // Update packaging cost
  const updatePackagingCost = (key: string, value: number) => {
    setPackagingCosts(prev => ({
      ...prev,
      [key]: value || 0
    }));
  };

  // Update labour cost
  const updateLabourCost = (key: string, value: number) => {
    setLabourCosts(prev => ({
      ...prev,
      [key]: value || 0
    }));
  };

  // Update miscellaneous cost
  const updateMiscellaneousCost = (key: string, value: number) => {
    setMiscellaneousCosts(prev => ({
      ...prev,
      [key]: value || 0
    }));
  };

  // Delete default item function
  const deleteDefaultItem = (category: string, key: string) => {
    const categoryMap: {[key: string]: any} = {
      'upper': setUpperCosts,
      'component': setComponentCosts,
      'material': setMaterialCosts,
      'packaging': setPackagingCosts,
      'miscellaneous': setMiscellaneousCosts
    };

    const setter = categoryMap[category];
    if (setter) {
      setter((prev: any) => {
        const newCosts = { ...prev };
        delete newCosts[key];
        return newCosts;
      });
      toast.success('Item deleted successfully');
    }
  };

  // Delete custom item function
  const deleteCustomItem = (category: string, itemId: string) => {
    setCustomItems(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.id !== itemId)
    }));
    
    // Also remove the cost entry for this custom item
    const categoryMap: {[key: string]: any} = {
      'upper': setUpperCosts,
      'component': setComponentCosts,
      'material': setMaterialCosts,
      'packaging': setPackagingCosts
    };
    
    const setter = categoryMap[category];
    if (setter) {
      setter((prev: any) => {
        const newCosts = { ...prev };
        delete newCosts[itemId];
        return newCosts;
      });
    }
    
    toast.success('Item deleted successfully');
  };

  // Calculate miscellaneous cost total
  const calculateMiscellaneousTotal = () => {
    return Object.values(miscellaneousCosts).reduce((sum, cost) => sum + (cost || 0), 0);
  };

  // Dialog management functions
  const openAddItemDialog = (category: string) => {
    setAddItemDialogs(prev => ({ ...prev, [category]: true }));
    // Reset the form for this specific category
    setDialogForms(prev => ({
      ...prev,
      [category]: { item: '', description: '', consumption: '', cost: 0 }
    }));
  };

  const closeAddItemDialog = (category: string) => {
    setAddItemDialogs(prev => ({ ...prev, [category]: false }));
    // Reset the form for this specific category
    setDialogForms(prev => ({
      ...prev,
      [category]: { item: '', description: '', consumption: '', cost: 0 }
    }));
  };

  // Update form field for specific category
  const updateDialogForm = (category: string, field: string, value: string | number) => {
    setDialogForms(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value
      }
    }));
  };

  // Add new item function
  const handleAddNewItem = (category: string) => {
    const currentForm = dialogForms[category as keyof typeof dialogForms];
    if (!currentForm.item.trim()) {
      toast.error('Please enter an item name');
      return;
    }

    const newItem = {
      id: `custom_${Date.now()}`,
      item: currentForm.item,
      description: currentForm.description,
      consumption: currentForm.consumption,
      cost: currentForm.cost
    };

    setCustomItems(prev => ({
      ...prev,
      [category]: [...prev[category], newItem]
    }));

    // Update respective cost state based on category
    switch (category) {
      case 'upper':
        setUpperCosts(prev => ({ ...prev, [newItem.id]: newItem.cost }));
        break;
      case 'component':
        setComponentCosts(prev => ({ ...prev, [newItem.id]: newItem.cost }));
        break;
      case 'material':
        setMaterialCosts(prev => ({ ...prev, [newItem.id]: newItem.cost }));
        break;
      case 'packaging':
        setPackagingCosts(prev => ({ ...prev, [newItem.id]: newItem.cost }));
        break;
      case 'miscellaneous':
        setMiscellaneousCosts(prev => ({ ...prev, [newItem.id]: newItem.cost }));
        break;
    }

    closeAddItemDialog(category);
    toast.success(`New ${category} item added successfully!`);
  };

  // Delete custom item function
  const handleDeleteCustomItem = (category: string, itemId: string) => {
    setCustomItems(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.id !== itemId)
    }));

    // Remove from respective cost state
    switch (category) {
      case 'upper':
        setUpperCosts(prev => {
          const newCosts = { ...prev };
          delete newCosts[itemId];
          return newCosts;
        });
        break;
      case 'component':
        setComponentCosts(prev => {
          const newCosts = { ...prev };
          delete newCosts[itemId];
          return newCosts;
        });
        break;
      case 'material':
        setMaterialCosts(prev => {
          const newCosts = { ...prev };
          delete newCosts[itemId];
          return newCosts;
        });
        break;
      case 'packaging':
        setPackagingCosts(prev => {
          const newCosts = { ...prev };
          delete newCosts[itemId];
          return newCosts;
        });
        break;
      case 'miscellaneous':
        setMiscellaneousCosts(prev => {
          const newCosts = { ...prev };
          delete newCosts[itemId];
          return newCosts;
        });
        break;
    }

    toast.success(`${category} item deleted successfully!`);
  };

  // Update custom item cost
  const updateCustomItemCost = (category: string, itemId: string, cost: number) => {
    switch (category) {
      case 'upper':
        updateUpperCost(itemId, cost);
        break;
      case 'component':
        updateComponentCost(itemId, cost);
        break;
      case 'material':
        updateMaterialCost(itemId, cost);
        break;
      case 'packaging':
        updatePackagingCost(itemId, cost);
        break;
      case 'miscellaneous':
        updateMiscellaneousCost(itemId, cost);
        break;
    }
  };

  // Calculate total production cost
  const totalProductionCost = materialCost + laborCost + overheadCost + toolingCost;

  // Calculate sum of all cost cards
  const totalAllCosts = calculateUpperTotal() + calculateComponentTotal() + calculateMaterialTotal() + calculatePackagingTotal() + calculateMiscellaneousTotal() + totalLabourCost;

  // Calculate subtotal before profit
  const subtotalBeforeProfit = totalAllCosts + additionalCosts;

  // Calculate profit amount based on subtotal
  const profitAmount = Math.round((subtotalBeforeProfit * profitMargin) / 100);

  // Calculate tentative cost (with profit)
  const tentativeCost = subtotalBeforeProfit + profitAmount;

  // Calculate margin percentage
  const marginPercentage = totalAllCosts > 0 ? ((profitAmount / totalAllCosts) * 100).toFixed(1) : '0';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSave = () => {
    if (!project) return;

    const updatedProject = {
      ...project,
      finalCost: tentativeCost,
      remarks: remarks || `Tentative cost calculated: ${formatCurrency(tentativeCost)}. Total Cost: ${formatCurrency(totalAllCosts)}, Profit: ${formatCurrency(profitAmount)} (${marginPercentage}%)`
    };

    updateRDProject(project.id, updatedProject);
    toast.success('Tentative cost saved successfully!');
  };

  const handleApprove = () => {
    if (tentativeCost === 0) {
      toast.error('Please calculate tentative cost before approving');
      return;
    }

    handleSave();
    setIsApproved(true);
    toast.success('Tentative cost approved! Ready to advance to Red Seal.');
    
    // Call the onApproved callback to advance the stage
    setTimeout(() => {
      onApproved();
      onOpenChange(false);
    }, 1000);
  };

  // Helper function to get current form data for a category
  const getCurrentFormData = (category: string) => {
    return dialogForms[category as keyof typeof dialogForms] || { item: '', description: '', consumption: '', cost: 0 };
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[75vw] !w-[75vw] max-h-[85vh] overflow-hidden p-0 m-0 top-[7.5vh] translate-y-0 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 px-6 py-4 bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-semibold text-gray-900">
                  Tentative Cost Calculation
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  Calculate production cost and profit margin for {project.autoCode}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleSave}
                variant="outline"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button 
                onClick={handleApprove}
                className="bg-[rgba(0,188,125,1)] hover:bg-green-600"
                disabled={tentativeCost === 0}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve & Proceed
              </Button>
              <Button 
                onClick={() => onOpenChange(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-6 space-y-6">
            {/* Cost Analysis & Comparison */}


            {/* Cost Breakdown Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upper Cost Breakdown */}
              <Card className="border-2 border-orange-200 h-148">
                <CardHeader className="bg-orange-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-orange-600" />
                    Upper Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Fixed Table Header */}
                    <div className="grid grid-cols-12 gap-2 bg-yellow-100 p-2 rounded text-sm font-medium">
                      <div className="col-span-2 text-center">ITEM</div>
                      <div className="col-span-4 text-center">DESCRIPTION</div>
                      <div className="col-span-2 text-center">CONSUMPTION</div>
                      <div className="col-span-2 text-center">COST</div>
                      <div className="col-span-2"></div>
                    </div>

                    {/* Scrollable Table Content */}
                    <div className="h-64 overflow-y-auto scrollbar-hide space-y-4">
                      {/* Upper Row */}
                      <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                        <div className="col-span-2">
                          <Input
                            defaultValue="Upper"
                            className="text-center text-sm"
                            placeholder="Item"
                          />
                        </div>
                        <div className="col-span-4">
                          <Input
                            defaultValue="Rexine"
                            className="text-sm"
                            placeholder="Description"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            defaultValue="26 pairs/mtr @/-"
                            className="text-sm"
                            placeholder="Consumption"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input
                              type="number"
                              value={upperCosts.upper || ''}
                              onChange={(e) => updateUpperCost('upper', Number(e.target.value))}
                              className="pl-6 text-sm"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDefaultItem('upper', 'upper')}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <StageSelector itemKey="upper" category="upper" />
                        </div>
                      </div>

                      {/* Lining Row 1 */}
                      <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                        <div className="col-span-2">
                          <Input
                            defaultValue="Lining"
                            className="text-center text-sm"
                            placeholder="Item"
                          />
                        </div>
                        <div className="col-span-4">
                          <Input
                            defaultValue="Skinfit"
                            className="text-sm"
                            placeholder="Description"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            defaultValue="25 pair @ 155/-"
                            className="text-sm"
                            placeholder="Consumption"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input
                              type="number"
                              value={upperCosts.lining1 || ''}
                              onChange={(e) => updateUpperCost('lining1', Number(e.target.value))}
                              className="pl-6 text-sm"
                            />
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDefaultItem('upper', 'lining1')}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <StageSelector itemKey="lining1" category="upper" />
                        </div>
                      </div>

                      {/* Lining Row 2 */}
                      <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                        <div className="col-span-2">
                          <Input
                            defaultValue="Lining"
                            className="text-center text-sm"
                            placeholder="Item"
                          />
                        </div>
                        <div className="col-span-4">
                          <Input
                            defaultValue="EVA"
                            className="text-sm"
                            placeholder="Description"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            defaultValue="33/70 - 1.5mm 35pair"
                            className="text-sm"
                            placeholder="Consumption"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input
                              type="number"
                              value={upperCosts.lining2 || ''}
                              onChange={(e) => updateUpperCost('lining2', Number(e.target.value))}
                              className="pl-6 text-sm"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDefaultItem('upper', 'lining2')}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <StageSelector itemKey="lining2" category="upper" />
                        </div>
                      </div>

                      {/* Custom Upper Items */}
                      {customItems.upper.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                          <div className="col-span-2">
                            <Input value={item.item} readOnly className="text-center text-sm bg-gray-50" />
                          </div>
                          <div className="col-span-4">
                            <Input value={item.description} readOnly className="text-sm bg-gray-50" />
                          </div>
                          <div className="col-span-2">
                            <Input value={item.consumption} readOnly className="text-sm bg-gray-50" />
                          </div>
                          <div className="col-span-2">
                            <div className="relative">
                              <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                              <Input
                                type="number"
                                value={upperCosts[item.id] || ''}
                                onChange={(e) => {
                                  setUpperCosts(prev => ({
                                    ...prev,
                                    [item.id]: Number(e.target.value) || 0
                                  }));
                                }}
                                className="pl-6 text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          <div className="col-span-2 flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCustomItem('upper', item.id)}
                              className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <StageSelector itemKey={item.item} category="upper" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Fixed Add New Row Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                      onClick={() => openAddItemDialog('upper')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Item
                    </Button>

                    <Separator />

                    {/* Fixed Total Upper Cost */}
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-orange-900">Total Upper Cost:</span>
                        <span className="text-lg font-bold text-orange-900">₹{calculateUpperTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Component Cost Breakdown */}
              <Card className="border-2 border-purple-200 h-148">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-purple-600" />
                    Component Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Fixed Table Header */}
                    <div className="grid grid-cols-12 gap-2 bg-blue-100 p-2 rounded text-sm font-medium">
                      <div className="col-span-2 text-center">COMPONENT</div>
                      <div className="col-span-3 text-center">DESCRIPTION</div>
                      <div className="col-span-2 text-center">CONSUMPTION</div>
                      <div className="col-span-2 text-center">COST</div>
                      <div className="col-span-3"></div>
                    </div>

                    {/* Scrollable Table Content */}
                    <div className="h-64 overflow-y-auto scrollbar-hide space-y-4">
                      {/* Component Rows */}
                      <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                        <div className="col-span-2">
                          <Input defaultValue="Foam" className="text-center text-sm" placeholder="Component" />
                        </div>
                        <div className="col-span-3">
                          <Input className="text-sm" placeholder="Description" />
                        </div>
                        <div className="col-span-2">
                          <Input defaultValue="7.5grm" className="text-sm" placeholder="Consumption" />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input type="number" value={componentCosts.foam || ''} onChange={(e) => updateComponentCost('foam', Number(e.target.value))} className="pl-6 text-sm" placeholder="0.00" />
                          </div>
                        </div>
                        <div className="col-span-3 flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDefaultItem('component', 'foam')}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <StageSelector itemKey="foam" category="component" />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                        <div className="col-span-2">
                          <Input defaultValue="Velcro" className="text-center text-sm" placeholder="Component" />
                        </div>
                        <div className="col-span-3">
                          <Input defaultValue="75mm" className="text-sm" placeholder="Description" />
                        </div>
                        <div className="col-span-2">
                          <Input defaultValue="1.25 pair" className="text-sm" placeholder="Consumption" />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input type="number" value={componentCosts.velcro || ''} onChange={(e) => updateComponentCost('velcro', Number(e.target.value))} className="pl-6 text-sm" placeholder="0.00" />
                          </div>
                        </div>
                        <div className="col-span-3 flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDefaultItem('component', 'velcro')}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <StageSelector itemKey="velcro" category="component" />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                        <div className="col-span-2">
                          <Input defaultValue="Elastic Roop" className="text-center text-sm" placeholder="Component" />
                        </div>
                        <div className="col-span-3">
                          <Input className="text-sm" placeholder="Description" />
                        </div>
                        <div className="col-span-2">
                          <Input className="text-sm" placeholder="Consumption" />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input type="number" value={componentCosts.elasticRoop || ''} onChange={(e) => updateComponentCost('elasticRoop', Number(e.target.value))} className="pl-6 text-sm" placeholder="0.00" />
                          </div>
                        </div>
                        <div className="col-span-3 flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDefaultItem('component', 'elasticRoop')}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <StageSelector itemKey="elasticRoop" category="component" />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                        <div className="col-span-2">
                          <Input defaultValue="Thread" className="text-center text-sm" placeholder="Component" />
                        </div>
                        <div className="col-span-3">
                          <Input className="text-sm" placeholder="Description" />
                        </div>
                        <div className="col-span-2">
                          <Input className="text-sm" placeholder="Consumption" />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input type="number" value={componentCosts.thread || ''} onChange={(e) => updateComponentCost('thread', Number(e.target.value))} className="pl-6 text-sm" />
                          </div>
                        </div>
                        <div className="col-span-3 flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDefaultItem('component', 'thread')}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <StageSelector itemKey="thread" category="component" />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                        <div className="col-span-2">
                          <Input defaultValue="Tafta Label" className="text-center text-sm" placeholder="Component" />
                        </div>
                        <div className="col-span-3">
                          <Input defaultValue="MRP" className="text-sm" placeholder="Description" />
                        </div>
                        <div className="col-span-2">
                          <Input className="text-sm" placeholder="Consumption" />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input type="number" value={componentCosts.taftaLabel || ''} onChange={(e) => updateComponentCost('taftaLabel', Number(e.target.value))} className="pl-6 text-sm" />
                          </div>
                        </div>
                        <div className="col-span-3 flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDefaultItem('component', 'taftaLabel')}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <StageSelector itemKey="taftaLabel" category="component" />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                        <div className="col-span-2">
                          <Input defaultValue="Buckle" className="text-center text-sm" placeholder="Component" />
                        </div>
                        <div className="col-span-3">
                          <Input className="text-sm" placeholder="Description" />
                        </div>
                        <div className="col-span-2">
                          <Input defaultValue="2pcs" className="text-sm" placeholder="Consumption" />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input type="number" value={componentCosts.buckle || ''} onChange={(e) => updateComponentCost('buckle', Number(e.target.value))} className="pl-6 text-sm" placeholder="0.00" />
                          </div>
                        </div>
                        <div className="col-span-3 flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDefaultItem('component', 'buckle')}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <StageSelector itemKey="buckle" category="component" />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                        <div className="col-span-2">
                          <Input defaultValue="Heat Transfer" className="text-center text-sm" placeholder="Component" />
                        </div>
                        <div className="col-span-3">
                          <Input className="text-sm" placeholder="Description" />
                        </div>
                        <div className="col-span-2">
                          <Input className="text-sm" placeholder="Consumption" />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input type="number" value={componentCosts.heatTransfer || ''} onChange={(e) => updateComponentCost('heatTransfer', Number(e.target.value))} className="pl-6 text-sm" />
                          </div>
                        </div>
                        <div className="col-span-3 flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDefaultItem('component', 'heatTransfer')}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <StageSelector itemKey="heatTransfer" category="component" />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                        <div className="col-span-2">
                          <Input defaultValue="Trim" className="text-center text-sm" placeholder="Component" />
                        </div>
                        <div className="col-span-3">
                          <Input defaultValue="sticker" className="text-sm" placeholder="Description" />
                        </div>
                        <div className="col-span-2">
                          <Input defaultValue="10 pcs" className="text-sm" placeholder="Consumption" />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input type="number" value={componentCosts.trim || ''} onChange={(e) => updateComponentCost('trim', Number(e.target.value))} className="pl-6 text-sm" placeholder="0.00" />
                          </div>
                        </div>
                        <div className="col-span-3 flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDefaultItem('component', 'trim')}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <StageSelector itemKey="trim" category="component" />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                        <div className="col-span-2">
                          <Input defaultValue="Welding" className="text-center text-sm" placeholder="Component" />
                        </div>
                        <div className="col-span-3">
                          <Input className="text-sm" placeholder="Description" />
                        </div>
                        <div className="col-span-2">
                          <Input className="text-sm" placeholder="Consumption" />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input type="number" value={componentCosts.welding || ''} onChange={(e) => updateComponentCost('welding', Number(e.target.value))} className="pl-6 text-sm" />
                          </div>
                        </div>
                        <div className="col-span-3 flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDefaultItem('component', 'welding')}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <StageSelector itemKey="welding" category="component" />
                        </div>
                      </div>

                      {/* Custom Component Items */}
                      {customItems.component.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                          <div className="col-span-2">
                            <Input value={item.item} readOnly className="text-center text-sm bg-gray-50" />
                          </div>
                          <div className="col-span-3">
                            <Input value={item.description} readOnly className="text-sm bg-gray-50" />
                          </div>
                          <div className="col-span-2">
                            <Input value={item.consumption} readOnly className="text-sm bg-gray-50" />
                          </div>
                          <div className="col-span-2">
                            <div className="relative">
                              <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                              <Input
                                type="number"
                                value={componentCosts[item.id] || ''}
                                onChange={(e) => updateCustomItemCost('component', item.id, Number(e.target.value))}
                                className="pl-6 text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          <div className="col-span-3 flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCustomItem('component', item.id)}
                              className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <StageSelector itemKey={item.item} category="component" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add New Component Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
                      onClick={() => openAddItemDialog('component')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Component
                    </Button>

                    <Separator />

                    {/* Fixed Total Component Cost */}
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-purple-900">Total Component Cost:</span>
                        <span className="text-lg font-bold text-purple-900">₹{calculateComponentTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Material Cost Breakdown */}
              <Card className="border-2 border-teal-200 h-148">
                <CardHeader className="bg-teal-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-teal-600" />
                    Material Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Fixed Table Header */}
                    <div className="grid grid-cols-12 gap-2 bg-teal-100 p-2 rounded text-sm font-medium">
                      <div className="col-span-3 text-center">MATERIAL</div>
                      <div className="col-span-3 text-center">DESCRIPTION</div>
                      <div className="col-span-3 text-center">CONSUMPTION</div>
                      <div className="col-span-2 text-center">COST</div>
                      <div className="col-span-1 text-center">  </div>
                    </div>

                    {/* Scrollable Table Content */}
                    <div className="h-64 overflow-y-auto scrollbar-hide space-y-4">

                    {/* Footbed Row 1 */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Footbed" className="text-center text-sm" placeholder="Material" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={materialCosts.footbed1 || ''}
                            onChange={(e) => updateMaterialCost('footbed1', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('material', 'footbed1')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Footbed Row 2 */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Footbed" className="text-center text-sm" placeholder="Material" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={materialCosts.footbed2 || ''}
                            onChange={(e) => updateMaterialCost('footbed2', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('material', 'footbed2')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Mid Sole 1 */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Mid Sole 1" className="text-center text-sm" placeholder="Material" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={materialCosts.midSole1 || ''}
                            onChange={(e) => updateMaterialCost('midSole1', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('material', 'midSole1')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Mid Sole 2 */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Mid Sole 2" className="text-center text-sm" placeholder="Material" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={materialCosts.midSole2 || ''}
                            onChange={(e) => updateMaterialCost('midSole2', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('material', 'midSole2')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Taper/Heel */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Taper/Heel" className="text-center text-sm" placeholder="Material" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={materialCosts.taperHeel || ''}
                            onChange={(e) => updateMaterialCost('taperHeel', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('material', 'taperHeel')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Arch */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Arch" className="text-center text-sm" placeholder="Material" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={materialCosts.arch || ''}
                            onChange={(e) => updateMaterialCost('arch', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('material', 'arch')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Out Sole */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Out Sole" className="text-center text-sm" placeholder="Material" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={materialCosts.outSole || ''}
                            onChange={(e) => updateMaterialCost('outSole', Number(e.target.value))}
                            className="pl-6 text-sm" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('material', 'outSole')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Thread */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Thread" className="text-center text-sm" placeholder="Material" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={materialCosts.thread || ''}
                            onChange={(e) => updateMaterialCost('thread', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('material', 'thread')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Adhesive */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Adhesive" className="text-center text-sm" placeholder="Material" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={materialCosts.adhesive || ''}
                            onChange={(e) => updateMaterialCost('adhesive', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('material', 'adhesive')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* PU Adhesive */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="PU Adhesive" className="text-center text-sm" placeholder="Material" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={materialCosts.puAdhesive || ''}
                            onChange={(e) => updateMaterialCost('puAdhesive', Number(e.target.value))}
                            className="pl-6 text-sm" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('material', 'puAdhesive')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Reinforcement */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Reinforcement" className="text-center text-sm" placeholder="Material" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={materialCosts.reinforcement || ''}
                            onChange={(e) => updateMaterialCost('reinforcement', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('material', 'reinforcement')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Emboss/Buff */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Emboss/Buff" className="text-center text-sm" placeholder="Material" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={materialCosts.embossBuff || ''}
                            onChange={(e) => updateMaterialCost('embossBuff', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('material', 'embossBuff')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Print */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Print" className="text-center text-sm" placeholder="Material" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={materialCosts.print || ''}
                            onChange={(e) => updateMaterialCost('print', Number(e.target.value))}
                            className="pl-6 text-sm" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('material', 'print')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Lazer */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Lazer" className="text-center text-sm" placeholder="Material" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={materialCosts.lazer || ''}
                            onChange={(e) => updateMaterialCost('lazer', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('material', 'lazer')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Lazer 2 */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Lazer 2" className="text-center text-sm" placeholder="Material" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={materialCosts.lazer2 || ''}
                            onChange={(e) => updateMaterialCost('lazer2', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('material', 'lazer2')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Custom Material Items */}
                    {customItems.material.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                        <div className="col-span-3">
                          <Input value={item.item} readOnly className="text-center text-sm bg-gray-50" />
                        </div>
                        <div className="col-span-3">
                          <Input value={item.description} readOnly className="text-sm bg-gray-50" />
                        </div>
                        <div className="col-span-3">
                          <Input value={item.consumption} readOnly className="text-sm bg-gray-50" />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input
                              type="number"
                              value={materialCosts[item.id] || ''}
                              onChange={(e) => updateCustomItemCost('material', item.id, Number(e.target.value))}
                              className="pl-6 text-sm"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCustomItem('material', item.id)}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    </div>

                    {/* Add New Item Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-teal-600 border-teal-200 hover:bg-teal-50"
                      onClick={() => openAddItemDialog('material')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Material
                    </Button>

                    <Separator />

                    {/* Fixed Total Material Cost */}
                    <div className="bg-teal-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-teal-900">Total Material Cost:</span>
                        <span className="text-lg font-bold text-teal-900">₹{calculateMaterialTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Packaging Cost Breakdown */}
              <Card className="border-2 border-rose-200 h-148">
                <CardHeader className="bg-rose-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-rose-600" />
                    Packaging Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Fixed Table Header */}
                    <div className="grid grid-cols-12 gap-2 bg-rose-100 p-2 rounded text-sm font-medium">
                      <div className="col-span-3 text-center">PACKING</div>
                      <div className="col-span-3 text-center">DESCRIPTION</div>
                      <div className="col-span-3 text-center">CONSUMPTION</div>
                      <div className="col-span-2 text-center">COST</div>
                      <div className="col-span-1 text-center">  </div>
                    </div>

                    {/* Scrollable Table Content */}
                    <div className="h-64 overflow-y-auto scrollbar-hide space-y-4">

                    {/* Inner */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Inner" className="text-center text-sm" placeholder="Packing" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={packagingCosts.inner || ''}
                            onChange={(e) => updatePackagingCost('inner', Number(e.target.value))}
                            className="pl-6 text-sm" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('packaging', 'inner')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Outer */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Outer" className="text-center text-sm" placeholder="Packing" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={packagingCosts.outer || ''}
                            onChange={(e) => updatePackagingCost('outer', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('packaging', 'outer')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Toe Fit */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Toe Fit" className="text-center text-sm" placeholder="Packing" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={packagingCosts.toeFit || ''}
                            onChange={(e) => updatePackagingCost('toeFit', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('packaging', 'toeFit')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Tissue */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Tissue" className="text-center text-sm" placeholder="Packing" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={packagingCosts.tissue || ''}
                            onChange={(e) => updatePackagingCost('tissue', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('packaging', 'tissue')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Wrapping paper */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Wrapping paper" className="text-center text-sm" placeholder="Packing" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={packagingCosts.wrappingPaper || ''}
                            onChange={(e) => updatePackagingCost('wrappingPaper', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('packaging', 'wrappingPaper')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Bar Code */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Bar Code" className="text-center text-sm" placeholder="Packing" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={packagingCosts.barCode || ''}
                            onChange={(e) => updatePackagingCost('barCode', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('packaging', 'barCode')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Brand Tag */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Brand Tag" className="text-center text-sm" placeholder="Packing" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={packagingCosts.brandTag || ''}
                            onChange={(e) => updatePackagingCost('brandTag', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('packaging', 'brandTag')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Tag Pin */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Tag Pin" className="text-center text-sm" placeholder="Packing" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={packagingCosts.tagPin || ''}
                            onChange={(e) => updatePackagingCost('tagPin', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('packaging', 'tagPin')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Outer Label */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Outer Label" className="text-center text-sm" placeholder="Packing" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={packagingCosts.outerLabel || ''}
                            onChange={(e) => updatePackagingCost('outerLabel', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('packaging', 'outerLabel')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Tape/Strapping */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Tape/Strapping" className="text-center text-sm" placeholder="Packing" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={packagingCosts.tapeStrapping || ''}
                            onChange={(e) => updatePackagingCost('tapeStrapping', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('packaging', 'tapeStrapping')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Custom Packaging Items */}
                    {customItems.packaging.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                        <div className="col-span-3">
                          <Input value={item.item} readOnly className="text-center text-sm bg-gray-50" />
                        </div>
                        <div className="col-span-3">
                          <Input value={item.description} readOnly className="text-sm bg-gray-50" />
                        </div>
                        <div className="col-span-3">
                          <Input value={item.consumption} readOnly className="text-sm bg-gray-50" />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input
                              type="number"
                              value={packagingCosts[item.id] || ''}
                              onChange={(e) => updateCustomItemCost('packaging', item.id, Number(e.target.value))}
                              className="pl-6 text-sm"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCustomItem('packaging', item.id)}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    </div>

                    {/* Add New Item Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-rose-600 border-rose-200 hover:bg-rose-50"
                      onClick={() => openAddItemDialog('packaging')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Packaging Item
                    </Button>

                    <Separator />

                    {/* Fixed Total Packaging Cost */}
                    <div className="bg-rose-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-rose-900">Total Packaging Cost:</span>
                        <span className="text-lg font-bold text-rose-900">₹{calculatePackagingTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Miscellaneous Cost Breakdown */}
              <Card className="border-2 border-gray-200 h-148">
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-gray-600" />
                    Miscellaneous Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Fixed Table Header */}
                    <div className="grid grid-cols-12 gap-2 bg-gray-100 p-2 rounded text-sm font-medium">
                      <div className="col-span-3 text-center">ITEM</div>
                      <div className="col-span-3 text-center">DESCRIPTION</div>
                      <div className="col-span-3 text-center">CONSUMPTION</div>
                      <div className="col-span-2 text-center">COST</div>
                      <div className="col-span-1 text-center">  </div>
                    </div>

                    {/* Scrollable Table Content */}
                    <div className="h-64 overflow-y-auto scrollbar-hide space-y-4">

                    {/* Consumables */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Consumables" className="text-center text-sm" placeholder="Item" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={miscellaneousCosts.consumables || ''}
                            onChange={(e) => updateMiscellaneousCost('consumables', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('miscellaneous', 'consumables')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 2%seconds */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="2%seconds" className="text-center text-sm" placeholder="Item" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={miscellaneousCosts.secondsPercent || ''}
                            onChange={(e) => updateMiscellaneousCost('secondsPercent', Number(e.target.value))}
                            className="pl-6 text-sm" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('miscellaneous', 'secondsPercent')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Factory Exp. */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Factory Exp." className="text-center text-sm" placeholder="Item" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={miscellaneousCosts.factoryExp || ''}
                            onChange={(e) => updateMiscellaneousCost('factoryExp', Number(e.target.value))}
                            className="pl-6 text-sm" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('miscellaneous', 'factoryExp')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Freight */}
                    <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                      <div className="col-span-3">
                        <Input defaultValue="Freight" className="text-center text-sm" placeholder="Item" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Description" />
                      </div>
                      <div className="col-span-3">
                        <Input className="text-sm" placeholder="Consumption" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                          <Input 
                            type="number" 
                            value={miscellaneousCosts.freight || ''}
                            onChange={(e) => updateMiscellaneousCost('freight', Number(e.target.value))}
                            className="pl-6 text-sm" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDefaultItem('miscellaneous', 'freight')}
                          className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Custom Miscellaneous Items */}
                    {customItems.miscellaneous.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-center border-b pb-2 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                        <div className="col-span-3">
                          <Input value={item.item} readOnly className="text-center text-sm bg-gray-50" />
                        </div>
                        <div className="col-span-3">
                          <Input value={item.description} readOnly className="text-sm bg-gray-50" />
                        </div>
                        <div className="col-span-3">
                          <Input value={item.consumption} readOnly className="text-sm bg-gray-50" />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input
                              type="number"
                              value={miscellaneousCosts[item.id] || ''}
                              onChange={(e) => updateCustomItemCost('miscellaneous', item.id, Number(e.target.value))}
                              className="pl-6 text-sm"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCustomItem('miscellaneous', item.id)}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    </div>

                    {/* Add New Item Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-gray-600 border-gray-200 hover:bg-gray-50"
                      onClick={() => openAddItemDialog('miscellaneous')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Miscellaneous Item
                    </Button>

                    <Separator />

                    {/* Fixed Total Miscellaneous Cost */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Total Miscellaneous Cost:</span>
                        <span className="text-lg font-bold text-gray-900">₹{calculateMiscellaneousTotal().toFixed(2)}</span>
      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Labour Cost + OH Breakdown */}
              <Card className="border-2 border-amber-200 h-148">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-amber-600" />
                    Labour Cost + OH Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Direct Total Labour Cost Input */}
                    <div className="bg-amber-100 p-4 rounded-lg border-2 border-amber-300">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-amber-900">Labour + OH Cost:</span>
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
                          <Input 
                            type="number" 
                            value={totalLabourCost || ''}
                            onChange={(e) => setTotalLabourCost(Number(e.target.value))}
                            className="pl-8 text-lg font-bold text-amber-900 bg-white border-amber-300 w-32" 
                          />
                        </div>
                      </div>
                    </div>

                    <h4 className="font-medium text-amber-900">Individual Labour Components:</h4>

                    {/* Scrollable Labour Items */}
                    <div className="h-32 overflow-y-auto scrollbar-hide space-y-3">
                        {/* Upper */}
                        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-center border-b border-amber-100 pb-2 group hover:bg-amber-50/50 px-2 -mx-2 rounded transition-colors">
                          <div>
                            <Label className="text-amber-800">Upper</Label>
                          </div>
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input 
                              type="number" 
                              value={labourCosts.upper || ''}
                              onChange={(e) => updateLabourCost('upper', Number(e.target.value))}
                              className="pl-6 text-sm" 
                              placeholder="0.00" 
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDefaultItem('labour', 'upper')}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Assembly */}
                        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-center border-b border-amber-100 pb-2 group hover:bg-amber-50/50 px-2 -mx-2 rounded transition-colors">
                          <div>
                            <Label className="text-amber-800">Assembly</Label>
                          </div>
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input 
                              type="number" 
                              value={labourCosts.assembly || ''}
                              onChange={(e) => updateLabourCost('assembly', Number(e.target.value))}
                              className="pl-6 text-sm" 
                              placeholder="0.00" 
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDefaultItem('labour', 'assembly')}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Printing */}
                        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-center border-b border-amber-100 pb-2 group hover:bg-amber-50/50 px-2 -mx-2 rounded transition-colors">
                          <div>
                            <Label className="text-amber-800">Printing</Label>
                          </div>
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input 
                              type="number" 
                              value={labourCosts.printing || ''}
                              onChange={(e) => updateLabourCost('printing', Number(e.target.value))}
                              className="pl-6 text-sm" 
                              placeholder="0.00" 
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDefaultItem('labour', 'printing')}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Packing */}
                        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-center border-b border-amber-100 pb-2 group hover:bg-amber-50/50 px-2 -mx-2 rounded transition-colors">
                          <div>
                            <Label className="text-amber-800">Packing</Label>
                          </div>
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <Input 
                              type="number" 
                              value={labourCosts.packing || ''}
                              onChange={(e) => updateLabourCost('packing', Number(e.target.value))}
                              className="pl-6 text-sm" 
                              placeholder="0.00" 
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDefaultItem('labour', 'packing')}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Custom Labour Items */}
                        {customItems.labour && customItems.labour.map((item) => (
                          <div key={item.id} className="grid grid-cols-[1fr_2fr_auto] gap-4 items-center border-b border-amber-100 pb-2 group hover:bg-amber-50/50 px-2 -mx-2 rounded transition-colors">
                            <div>
                              <Label className="text-amber-800">{item.item}</Label>
                            </div>
                            <div className="relative">
                              <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                              <Input 
                                type="number" 
                                value={labourCosts[item.id] || ''}
                                onChange={(e) => {
                                  setLabourCosts(prev => ({
                                    ...prev,
                                    [item.id]: Number(e.target.value) || 0
                                  }));
                                }}
                                className="pl-6 text-sm" 
                                placeholder="0.00" 
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCustomItem('labour', item.id)}
                              className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                    {/* Fixed Add New Labour Component Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-amber-600 border-amber-200 hover:bg-amber-50"
                      onClick={() => openAddItemDialog('labour')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Labour Component
                    </Button>

                    <Separator />

                    {/* Fixed Total Labour Cost */}
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-amber-900">Total Labour Cost:</span>
                        <span className="text-lg font-bold text-amber-900">₹{totalLabourCost.toFixed(2)}</span>
                      </div>
                    </div>

                   
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fourth row for Profit & Final Calculation */}
            <div className="grid grid-cols-1">
              {/* Profit & Final Calculation */}
              <Card className="border-2 border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-green-600" />
                    Final Cost Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Additional Costs</Label>
                    <div className="relative mt-1">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="number"
                        value={additionalCosts}
                        onChange={(e) => setAdditionalCosts(Number(e.target.value))}
                        className="pl-10"
                        placeholder="Additional costs (optional)"
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Shipping, packaging, misc costs
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Profit Margin (%)</Label>
                    <div className="relative mt-1">
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="number"
                        value={profitMargin}
                        onChange={(e) => setProfitMargin(Number(e.target.value))}
                        className="pl-10"
                        placeholder="Enter profit margin %"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Profit percentage on total costs
                    </div>
                  </div>

                  <Separator />

                  {/* Cost Summary */}
                  <div className="space-y-2">

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Upper Cost:</span>
                      <span className="font-medium">{formatCurrency(calculateUpperTotal())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Component Cost:</span>
                      <span className="font-medium">{formatCurrency(calculateComponentTotal())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Material Cost:</span>
                      <span className="font-medium">{formatCurrency(calculateMaterialTotal())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Packaging Cost:</span>
                      <span className="font-medium">{formatCurrency(calculatePackagingTotal())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Miscellaneous Cost:</span>
                      <span className="font-medium">{formatCurrency(calculateMiscellaneousTotal())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Labour + OH Cost:</span>
                      <span className="font-medium">{formatCurrency(totalLabourCost)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-medium bg-blue-50 p-2 rounded">
                      <span className="text-blue-900">Total All Costs:</span>
                      <span className="text-blue-900">{formatCurrency(calculateUpperTotal() + calculateComponentTotal() + calculateMaterialTotal() + calculatePackagingTotal() + calculateMiscellaneousTotal() + totalLabourCost)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Additional Costs:</span>
                      <span className="font-medium">+{formatCurrency(additionalCosts)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Profit ({profitMargin}%):</span>
                      <span className="font-medium">+{formatCurrency(profitAmount)}</span>
                    </div>
                    <Separator />
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-green-900">Tentative Cost:</span>
                        <span className="text-xl font-bold text-green-900">{formatCurrency(tentativeCost)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>



            {/* Remarks Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Label className="text-sm font-medium text-gray-600">Remarks & Justification</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="mt-2"
                  rows={3}
                  placeholder="Add notes about cost calculation methodology, assumptions, or special considerations..."
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-40 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-t-2 border-gray-200 shadow-lg">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Project: {project.autoCode}
            </Badge>
            <div className="text-sm text-gray-600">
              Ready for Red Seal Approval
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              Total: <span className="font-bold text-green-600">{formatCurrency(tentativeCost)}</span>
            </div>
            <Button 
              onClick={handleApprove}
              className="bg-[rgba(0,188,125,1)] hover:bg-green-600"
              disabled={tentativeCost === 0}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Approve & Advance to Red Seal
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Add New Item Dialogs */}
      <AddNewItemDialog 
        category="upper" 
        isOpen={addItemDialogs.upper} 
        onClose={() => closeAddItemDialog('upper')}
        formData={getCurrentFormData('upper')}
        onFormChange={(field, value) => updateDialogForm('upper', field, value)}
        onAddItem={() => handleAddNewItem('upper')}
      />
      <AddNewItemDialog 
        category="component" 
        isOpen={addItemDialogs.component} 
        onClose={() => closeAddItemDialog('component')}
        formData={getCurrentFormData('component')}
        onFormChange={(field, value) => updateDialogForm('component', field, value)}
        onAddItem={() => handleAddNewItem('component')}
      />
      <AddNewItemDialog 
        category="material" 
        isOpen={addItemDialogs.material} 
        onClose={() => closeAddItemDialog('material')}
        formData={getCurrentFormData('material')}
        onFormChange={(field, value) => updateDialogForm('material', field, value)}
        onAddItem={() => handleAddNewItem('material')}
      />
      <AddNewItemDialog 
        category="packaging" 
        isOpen={addItemDialogs.packaging} 
        onClose={() => closeAddItemDialog('packaging')}
        formData={getCurrentFormData('packaging')}
        onFormChange={(field, value) => updateDialogForm('packaging', field, value)}
        onAddItem={() => handleAddNewItem('packaging')}
      />
      <AddNewItemDialog 
        category="miscellaneous" 
        isOpen={addItemDialogs.miscellaneous} 
        onClose={() => closeAddItemDialog('miscellaneous')}
        formData={getCurrentFormData('miscellaneous')}
        onFormChange={(field, value) => updateDialogForm('miscellaneous', field, value)}
        onAddItem={() => handleAddNewItem('miscellaneous')}
      />
    </Dialog>
  );
}