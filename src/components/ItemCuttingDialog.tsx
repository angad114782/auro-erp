import React, { useState } from 'react';
import { X, Scissors, Package, AlertCircle, CheckCircle, TrendingDown, Save, Clock, Activity } from 'lucide-react';
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
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';

interface CuttingItem {
  id: string;
  itemName: string;
  requiredQuantity: number;
  alreadyCut: number;
  cuttingToday: number;
  unit: string;
  status: 'pending' | 'in-progress' | 'completed';
}

interface ItemCuttingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productData: {
    id: string;
    productName: string;
    productionId: string;
    targetQuantity: number;
    brand: string;
    category: string;
  } | null;
  stage?: 'cutting' | 'printing' | 'upper' | 'upperREJ' | 'assembly' | 'packing' | 'rfd';
}

export function ItemCuttingDialog({ open, onOpenChange, productData, stage = 'cutting' }: ItemCuttingDialogProps) {
  // Get stage-specific details
  const getStageDetails = () => {
    switch (stage) {
      case 'cutting':
        return { 
          title: 'Cutting', 
          actionName: 'Cutting',
          headerBg: 'bg-gradient-to-r from-purple-50 via-white to-purple-50',
          headerBorder: 'border-purple-200',
          iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
          badgeBg: 'bg-purple-100 text-purple-800',
          buttonBg: 'bg-purple-600 hover:bg-purple-700'
        };
      case 'printing':
        return { 
          title: 'Printing', 
          actionName: 'Printing',
          headerBg: 'bg-gradient-to-r from-blue-50 via-white to-blue-50',
          headerBorder: 'border-blue-200',
          iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
          badgeBg: 'bg-blue-100 text-blue-800',
          buttonBg: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'upper':
        return { 
          title: 'Upper', 
          actionName: 'Upper',
          headerBg: 'bg-gradient-to-r from-indigo-50 via-white to-indigo-50',
          headerBorder: 'border-indigo-200',
          iconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
          badgeBg: 'bg-indigo-100 text-indigo-800',
          buttonBg: 'bg-indigo-600 hover:bg-indigo-700'
        };
      case 'upperREJ':
        return { 
          title: 'Upper Reg', 
          actionName: 'Upper Reg',
          headerBg: 'bg-gradient-to-r from-orange-50 via-white to-orange-50',
          headerBorder: 'border-orange-200',
          iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
          badgeBg: 'bg-orange-100 text-orange-800',
          buttonBg: 'bg-orange-600 hover:bg-orange-700'
        };
      case 'assembly':
        return { 
          title: 'Assembly', 
          actionName: 'Assembly',
          headerBg: 'bg-gradient-to-r from-green-50 via-white to-green-50',
          headerBorder: 'border-green-200',
          iconBg: 'bg-gradient-to-br from-green-500 to-green-600',
          badgeBg: 'bg-green-100 text-green-800',
          buttonBg: 'bg-green-600 hover:bg-green-700'
        };
      case 'packing':
        return { 
          title: 'Packing', 
          actionName: 'Packing',
          headerBg: 'bg-gradient-to-r from-teal-50 via-white to-teal-50',
          headerBorder: 'border-teal-200',
          iconBg: 'bg-gradient-to-br from-teal-500 to-teal-600',
          badgeBg: 'bg-teal-100 text-teal-800',
          buttonBg: 'bg-teal-600 hover:bg-teal-700'
        };
      case 'rfd':
        return { 
          title: 'RFD', 
          actionName: 'RFD',
          headerBg: 'bg-gradient-to-r from-emerald-50 via-white to-emerald-50',
          headerBorder: 'border-emerald-200',
          iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
          badgeBg: 'bg-emerald-100 text-emerald-800',
          buttonBg: 'bg-emerald-600 hover:bg-emerald-700'
        };
      default:
        return { 
          title: 'Cutting', 
          actionName: 'Cutting',
          headerBg: 'bg-gradient-to-r from-purple-50 via-white to-purple-50',
          headerBorder: 'border-purple-200',
          iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
          badgeBg: 'bg-purple-100 text-purple-800',
          buttonBg: 'bg-purple-600 hover:bg-purple-700'
        };
    }
  };

  const stageDetails = getStageDetails();
  // Demo data - in real app, this would come from props or store
  const [cuttingItems, setCuttingItems] = useState<CuttingItem[]>([
    {
      id: '1',
      itemName: 'Upper Leather (Premium)',
      requiredQuantity: 2000,
      alreadyCut: 1500,
      cuttingToday: 0,
      unit: 'piece',
      status: 'in-progress',
    },
    {
      id: '2',
      itemName: 'Sole Material (Rubber)',
      requiredQuantity: 2000,
      alreadyCut: 1000,
      cuttingToday: 0,
      unit: 'piece',
      status: 'in-progress',
    },
    {
      id: '3',
      itemName: 'Laces (Cotton)',
      requiredQuantity: 2000,
      alreadyCut: 1800,
      cuttingToday: 0,
      unit: 'pair',
      status: 'in-progress',
    },
    {
      id: '4',
      itemName: 'Insole Foam',
      requiredQuantity: 2000,
      alreadyCut: 1200,
      cuttingToday: 0,
      unit: 'piece',
      status: 'in-progress',
    },
  ]);

  if (!productData) return null;

  const updateCuttingQuantity = (itemId: string, value: number) => {
    setCuttingItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, cuttingToday: value }
          : item
      )
    );
  };

  // Calculate minimum available for production
  const calculateMinimumAvailable = () => {
    const availableQuantities = cuttingItems.map(item => item.alreadyCut + item.cuttingToday);
    return Math.min(...availableQuantities);
  };

  const calculateTotalAfterCutting = (item: CuttingItem) => {
    return item.alreadyCut + item.cuttingToday;
  };

  const getItemStatusBadge = (item: CuttingItem) => {
    const total = calculateTotalAfterCutting(item);
    const percentage = (total / item.requiredQuantity) * 100;

    if (percentage >= 100) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
    } else if (percentage >= 50) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
    } else {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Pending</Badge>;
    }
  };

  const getProgressPercentage = (item: CuttingItem) => {
    const total = calculateTotalAfterCutting(item);
    return Math.min((total / item.requiredQuantity) * 100, 100);
  };

  const handleSaveCutting = () => {
    const totalCutting = cuttingItems.reduce((sum, item) => sum + item.cuttingToday, 0);
    
    if (totalCutting === 0) {
      toast.error(`Please enter ${stageDetails.actionName.toLowerCase()} quantities for at least one item`);
      return;
    }

    // Update the items with new cut quantities
    setCuttingItems(prev =>
      prev.map(item => ({
        ...item,
        alreadyCut: item.alreadyCut + item.cuttingToday,
        cuttingToday: 0,
      }))
    );

    const minAvailable = calculateMinimumAvailable();
    toast.success(`${stageDetails.title} saved! ${minAvailable} units now ready for production`);
  };

  const minimumAvailable = calculateMinimumAvailable();
  const hasAnyCutting = cuttingItems.some(item => item.cuttingToday > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[85vw] !w-[85vw] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
        {/* Sticky Header */}
        <div className={`sticky top-0 z-50 px-8 py-6 ${stageDetails.headerBg} border-b-2 ${stageDetails.headerBorder} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 ${stageDetails.iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
                <Scissors className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-semibold text-gray-900 mb-1">
                  {stageDetails.title} Management
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Manage {stageDetails.actionName.toLowerCase()} for production
                </DialogDescription>
                <div className="flex items-center gap-4">
                  <span className="text-lg text-gray-600">{productData.productName}</span>
                  <Badge className={`${stageDetails.badgeBg} text-sm px-3 py-1`}>
                    {productData.productionId}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveCutting}
                className={`${stageDetails.buttonBg} text-white h-11 px-6`}
                disabled={!hasAnyCutting}
              >
                <Save className="w-4 h-4 mr-2" />
                Save {stageDetails.title}
              </Button>
              <button
                onClick={() => onOpenChange(false)}
                type="button"
                className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center border-0 bg-transparent transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-8 py-8 space-y-8">
            
            {/* Product Summary Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Product Name</Label>
                  <div className="mt-1 text-base font-semibold text-gray-900">{productData.productName}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Target Quantity</Label>
                  <div className="mt-1 text-base font-bold text-blue-600">{productData.targetQuantity} pairs</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Currently Can Produce</Label>
                  <div className="mt-1 text-base font-bold text-green-600">{minimumAvailable} pairs</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Remaining Needed</Label>
                  <div className="mt-1 text-base font-bold text-orange-600">
                    {Math.max(productData.targetQuantity - minimumAvailable, 0)} pairs
                  </div>
                </div>
              </div>
            </div>

            {/* Production Capacity Alert */}
            {minimumAvailable < productData.targetQuantity && (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-900 mb-1">Production Capacity Limited</h4>
                    <p className="text-sm text-orange-700">
                      You can currently produce <span className="font-bold">{minimumAvailable} pairs</span> based on the minimum cut quantity across all items. 
                      To reach the target of {productData.targetQuantity} pairs, you need to cut more materials.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {minimumAvailable >= productData.targetQuantity && (
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-900 mb-1">Ready for Full Production!</h4>
                    <p className="text-sm text-green-700">
                      All materials have been cut sufficiently. You can now produce the full target quantity of {productData.targetQuantity} pairs.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cutting Items Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Raw Materials & Components {stageDetails.title}</h3>
                <Badge variant="secondary" className="bg-gray-100 text-gray-700 px-3 py-1">
                  {cuttingItems.length} Items
                </Badge>
              </div>

              <div className="space-y-4">
                {cuttingItems.map((item) => {
                  const totalAfter = calculateTotalAfterCutting(item);
                  const remaining = Math.max(item.requiredQuantity - totalAfter, 0);
                  const progressPercent = getProgressPercentage(item);
                  const isBottleneck = totalAfter === minimumAvailable && minimumAvailable < productData.targetQuantity;

                  return (
                    <div
                      key={item.id}
                      className={`bg-white border-2 rounded-xl p-6 transition-all ${
                        isBottleneck
                          ? 'border-red-300 bg-red-50'
                          : item.cuttingToday > 0
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="grid grid-cols-12 gap-6 items-center">
                        {/* Item Name & Status */}
                        <div className="col-span-3">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-gray-300">
                              <Scissors className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 mb-1 truncate">{item.itemName}</div>
                              {getItemStatusBadge(item)}
                              {isBottleneck && (
                                <Badge className="bg-red-100 text-red-800 border-red-200 mt-1 flex items-center gap-1 w-fit">
                                  <TrendingDown className="w-3 h-3" />
                                  Bottleneck
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Required Quantity */}
                        <div className="col-span-2">
                          <Label className="text-xs font-medium text-gray-600">Required</Label>
                          <div className="text-base font-bold text-gray-900">
                            {item.requiredQuantity} {item.unit}
                          </div>
                        </div>

                        {/* Already Cut */}
                        <div className="col-span-2">
                          <Label className="text-xs font-medium text-gray-600">Already Cut</Label>
                          <div className="text-base font-semibold text-blue-600">
                            {item.alreadyCut} {item.unit}
                          </div>
                        </div>

                        {/* Cutting Today Input */}
                        <div className="col-span-2">
                          <Label className="text-xs font-medium text-gray-600 mb-1 block">
                            {stageDetails.title} Today
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max={remaining}
                            value={item.cuttingToday}
                            onChange={(e) => updateCuttingQuantity(item.id, parseInt(e.target.value) || 0)}
                            className="h-10 text-center font-semibold border-2 focus:border-purple-500"
                            placeholder="0"
                          />
                        </div>

                        {/* Total After */}
                        <div className="col-span-2">
                          <Label className="text-xs font-medium text-gray-600">Total After</Label>
                          <div className={`text-base font-bold ${
                            totalAfter >= item.requiredQuantity ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {totalAfter} {item.unit}
                          </div>
                        </div>

                        {/* Remaining */}
                        <div className="col-span-1 text-right">
                          <Label className="text-xs font-medium text-gray-600">Need</Label>
                          <div className="text-base font-semibold text-orange-600">
                            {remaining}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600">{stageDetails.title} Progress</span>
                          <span className="text-xs font-semibold text-gray-900">{progressPercent.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={progressPercent} 
                          className={`h-2 ${
                            progressPercent >= 100 ? 'bg-green-200' : 
                            progressPercent >= 50 ? 'bg-blue-200' : 
                            'bg-orange-200'
                          }`}
                        />
                      </div>

                      {/* Today's Update Indicator */}
                      {item.cuttingToday > 0 && (
                        <div className="mt-3 p-2 bg-purple-100 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 text-xs text-purple-800">
                            <Activity className="w-3.5 h-3.5" />
                            <span className="font-medium">
                              Adding +{item.cuttingToday} {item.unit} today
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm text-gray-600 mb-1">Total Items</div>
                  <div className="text-2xl font-bold text-gray-900">{cuttingItems.length}</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm text-gray-600 mb-1">Can Produce</div>
                  <div className="text-2xl font-bold text-green-600">{minimumAvailable} pairs</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{stageDetails.title} Today</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {cuttingItems.reduce((sum, item) => sum + item.cuttingToday, 0)} items
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
