import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Minus,
  X,
  AlertCircle,
  FileText,
  Truck,
  Barcode,
  Paperclip,
  CheckCircle,
  Calendar,
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
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { useERPStore } from '../lib/data-store';

interface UpdateStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: any;
}

export function UpdateStockDialog({ open, onOpenChange, selectedItem }: UpdateStockDialogProps) {
  const [activeTab, setActiveTab] = useState('add-stock');
  const [stockUpdate, setStockUpdate] = useState({
    additionalQuantity: '',
    vendorId: '',
    notes: '',
    billNumber: '',
    billDate: '',
    billAttachment: null as File | null,
  });

  const { updateInventoryItem, vendors, addInventoryTransaction } = useERPStore();

  // Reset form when dialog opens
  useEffect(() => {
    if (open && selectedItem) {
      setStockUpdate({
        additionalQuantity: '',
        subtractQuantity: '',
        vendorId: selectedItem.vendorId || '',
        notes: '',
        billNumber: '',
        billDate: '',
        billAttachment: null,
      });
    }
  }, [open, selectedItem]);

  const handleUpdateStock = () => {
    // Validation - must have either add or subtract quantity
    if (!stockUpdate.additionalQuantity && !stockUpdate.subtractQuantity) {
      toast.error('Please enter either add or reduce stock quantity');
      return;
    }

    const currentQuantity = selectedItem.quantity || 0;
    let newTotalQuantity = currentQuantity;
    let transactionType = '';
    let quantity = 0;
    let reason = '';

    // Handle Add Stock
    if (stockUpdate.additionalQuantity) {
      const additionalQuantity = parseInt(stockUpdate.additionalQuantity);
      if (isNaN(additionalQuantity) || additionalQuantity < 0) {
        toast.error('Please enter a valid quantity to add (0 or greater)');
        return;
      }
      newTotalQuantity = currentQuantity + additionalQuantity;
      transactionType = 'Stock In';
      quantity = additionalQuantity;
      reason = 'Stock Added';
    }
    // Handle Subtract Stock
    else if (stockUpdate.subtractQuantity) {
      const subtractQuantity = parseInt(stockUpdate.subtractQuantity);
      if (isNaN(subtractQuantity) || subtractQuantity < 0) {
        toast.error('Please enter a valid quantity to reduce (0 or greater)');
        return;
      }
      if (subtractQuantity > currentQuantity) {
        toast.error('Reduction quantity cannot exceed current stock');
        return;
      }
      newTotalQuantity = currentQuantity - subtractQuantity;
      transactionType = 'Stock Out';
      quantity = subtractQuantity;
      reason = stockUpdate.notes || 'Stock Reduced';
    }

    // Update the inventory item
    updateInventoryItem(selectedItem.id, {
      quantity: newTotalQuantity,
      vendorId: stockUpdate.vendorId || selectedItem.vendorId,
      lastUpdate: new Date().toLocaleDateString(),
      lastUpdateTime: new Date().toLocaleTimeString(),
    });

    // Add inventory transaction record
    addInventoryTransaction({
      itemId: selectedItem.id,
      transactionType,
      quantity,
      previousStock: currentQuantity,
      newStock: newTotalQuantity,
      billNumber: stockUpdate.billNumber || undefined,
      vendorId: stockUpdate.vendorId || selectedItem.vendorId,
      reason,
      remarks: stockUpdate.notes || undefined,
      transactionDate: new Date().toISOString(),
      createdBy: 'Current User',
    });

    const action = stockUpdate.additionalQuantity ? 'Added' : 'Reduced';
    const actionQuantity = stockUpdate.additionalQuantity || stockUpdate.subtractQuantity;
    toast.success(`Stock updated successfully! ${action} ${actionQuantity} ${selectedItem.quantityUnit}. New total: ${newTotalQuantity} ${selectedItem.quantityUnit}`);

    // Reset form and close dialog
    setStockUpdate({
      additionalQuantity: '',
      subtractQuantity: '',
      vendorId: '',
      notes: '',
      billNumber: '',
      billDate: '',
      billAttachment: null,
    });

    onOpenChange(false);
  };

  const calculateNewTotal = () => {
    const currentQuantity = selectedItem?.quantity || 0;
    const additionalQuantity = parseInt(stockUpdate.additionalQuantity) || 0;
    const subtractQuantity = parseInt(stockUpdate.subtractQuantity) || 0;
    if (additionalQuantity) {
      return currentQuantity + additionalQuantity;
    } else if (subtractQuantity) {
      return currentQuantity - subtractQuantity;
    }
    return currentQuantity;
  };

  if (!selectedItem) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onOpenChange(false);
      }}
    >
      <DialogContent className="!max-w-2xl !w-2xl max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
        {/* Header Section */}
        <div className="sticky top-0 z-50 px-8 py-6 bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b-2 border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-semibold text-gray-900 mb-1">
                  Update Stock
                </DialogTitle>
                <DialogDescription className="text-lg text-gray-600">
                  Add or reduce stock for {selectedItem.itemName}
                </DialogDescription>
              </div>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </Button>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Item Information Card */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedItem.itemName}</h3>
                  <p className="text-sm text-gray-600">{selectedItem.code} • {selectedItem.category}</p>
                  <p className="text-xs text-gray-500">{selectedItem.subCategory}</p>
                  {(selectedItem.brand || selectedItem.color) && (
                    <p className="text-xs text-blue-600">
                      {selectedItem.brand && `Brand: ${selectedItem.brand}`}
                      {selectedItem.brand && selectedItem.color && ' • '}
                      {selectedItem.color && `Color: ${selectedItem.color}`}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Stock</p>
                <p className="text-2xl font-bold text-gray-900">{selectedItem.quantity} <span className="text-lg font-normal text-gray-600">{selectedItem.quantityUnit}</span></p>
              </div>
            </div>
          </div>

          {/* Stock Update Form with Tabs */}
          <Tabs defaultValue="add-stock" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 h-14 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger 
                value="add-stock" 
                className="h-full data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Stock
              </TabsTrigger>
              <TabsTrigger 
                value="reduce-stock"
                className="h-full data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <Minus className="w-4 h-4 mr-2" />
                Reduce Stock
              </TabsTrigger>
            </TabsList>

            {/* Add Stock Tab Content */}
            <TabsContent value="add-stock" className="space-y-6 mt-6">
              {/* New Stock Input - Highlighted */}
              <div className="space-y-4">
                <Label htmlFor="additionalQuantity" className="text-base font-semibold text-gray-700">
                  Add Stock Quantity
                </Label>
                <div className="relative">
                  <Plus className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
                  <Input
                    id="additionalQuantity"
                    type="number"
                    min="0"
                    value={stockUpdate.additionalQuantity}
                    onChange={(e) => setStockUpdate({ ...stockUpdate, additionalQuantity: e.target.value, subtractQuantity: '' })}
                    placeholder="Enter quantity to add"
                    className="pl-12 h-16 text-lg border-3 border-blue-200 focus:border-blue-500 bg-blue-50 focus:bg-white font-semibold text-blue-900 placeholder:text-blue-400"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-600 font-semibold">
                    {selectedItem.quantityUnit}
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Enter the quantity of new stock you want to add to the existing inventory
                </p>
              </div>

              {/* Stock Calculation Summary - Add */}
              {stockUpdate.additionalQuantity && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Plus className="w-4 h-4 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-green-900">Stock Update Summary</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-gray-600 mb-1">Current Stock</p>
                      <p className="text-xl font-bold text-gray-900">{selectedItem.quantity}</p>
                      <p className="text-xs text-gray-500">{selectedItem.quantityUnit}</p>
                    </div>
                    <div className="bg-green-100 rounded-lg p-4 border border-green-300">
                      <p className="text-sm text-green-700 mb-1">Adding</p>
                      <p className="text-xl font-bold text-green-900">+{stockUpdate.additionalQuantity}</p>
                      <p className="text-xs text-green-600">{selectedItem.quantityUnit}</p>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-4 border border-blue-300">
                      <p className="text-sm text-blue-700 mb-1">New Total</p>
                      <p className="text-xl font-bold text-blue-900">{calculateNewTotal()}</p>
                      <p className="text-xs text-blue-600">{selectedItem.quantityUnit}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Vendor Selection */}
              <div className="space-y-4">
                <Label htmlFor="vendorId" className="text-base font-semibold text-gray-700">
                  Vendor / Supplier
                </Label>
                <Select
                  value={stockUpdate.vendorId}
                  onValueChange={(value) => setStockUpdate({ ...stockUpdate, vendorId: value })}
                >
                  <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.vendorName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600">
                  Select the vendor who supplied this stock
                </p>
              </div>

              {/* Bill Number */}
              <div className="space-y-4">
                <Label htmlFor="billNumber" className="text-base font-semibold text-gray-700">
                  Bill Number
                </Label>
                <div className="relative">
                  <Barcode className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="billNumber"
                    value={stockUpdate.billNumber}
                    onChange={(e) => setStockUpdate({ ...stockUpdate, billNumber: e.target.value })}
                    placeholder="e.g., INV-2024-001, BILL-12345"
                    className="pl-12 h-12 text-base border-2 focus:border-blue-500"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Enter the bill or invoice number for this stock shipment
                </p>
              </div>

              {/* Bill Date */}
              <div className="space-y-4">
                <Label htmlFor="billDate" className="text-base font-semibold text-gray-700">
                  Bill Date
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                  <Input
                    id="billDate"
                    type="date"
                    value={stockUpdate.billDate}
                    onChange={(e) => setStockUpdate({ ...stockUpdate, billDate: e.target.value })}
                    className="pl-12 h-12 text-base border-2 focus:border-blue-500"
                    style={{
                      colorScheme: 'light',
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Select the date of the bill or invoice
                </p>
              </div>

              {/* Bill Attachment */}
              <div className="space-y-4">
                <Label htmlFor="billAttachment" className="text-base font-semibold text-gray-700">
                  Bill Attachment
                </Label>
                <div className="relative">
                  <input
                    id="billAttachment"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setStockUpdate({ ...stockUpdate, billAttachment: file });
                      if (file) {
                        toast.success(`File "${file.name}" attached`);
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('billAttachment')?.click()}
                    className="w-full h-12 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all text-base"
                  >
                    <Paperclip className="w-5 h-5 mr-2 text-gray-500" />
                    <span className="flex-1 text-left truncate">
                      {stockUpdate.billAttachment 
                        ? stockUpdate.billAttachment.name 
                        : 'Choose file (PDF, Image, Doc)'}
                    </span>
                    {stockUpdate.billAttachment && (
                      <X
                        className="w-4 h-4 ml-2 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStockUpdate({ ...stockUpdate, billAttachment: null });
                          const fileInput = document.getElementById('billAttachment') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                          toast.success('File removed');
                        }}
                      />
                    )}
                  </Button>
                </div>
                {stockUpdate.billAttachment && (
                  <p className="text-sm text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    File attached: {(stockUpdate.billAttachment.size / 1024).toFixed(1)} KB
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  Upload bill or invoice document (PDF, Image, or Doc)
                </p>
              </div>

              {/* Notes Section */}
              <div className="space-y-4">
                <Label htmlFor="notes" className="text-base font-semibold text-gray-700">
                  Notes & Comments
                </Label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                  <Textarea
                    id="notes"
                    value={stockUpdate.notes}
                    onChange={(e) => setStockUpdate({ ...stockUpdate, notes: e.target.value })}
                    placeholder="Add notes about this stock update (supplier, batch number, quality notes, etc.)"
                    rows={4}
                    className="pl-12 pt-4 text-base border-2 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Reduce Stock Tab Content */}
            <TabsContent value="reduce-stock" className="space-y-6 mt-6">
              {/* Minus Stock Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold text-gray-700">
                  Reduce Stock Quantity
                </Label>
                <div className="relative">
                  <AlertCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-600 w-5 h-5" />
                  <Input
                    id="subtractQuantity"
                    type="number"
                    min="0"
                    max={selectedItem.quantity}
                    value={stockUpdate.subtractQuantity || ''}
                    onChange={(e) => setStockUpdate({ ...stockUpdate, subtractQuantity: e.target.value, additionalQuantity: '' })}
                    placeholder="Enter quantity to reduce"
                    className="pl-12 h-16 text-lg border-3 border-orange-200 focus:border-orange-500 bg-orange-50 focus:bg-white font-semibold text-orange-900 placeholder:text-orange-400"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-orange-600 font-semibold">
                    {selectedItem.quantityUnit}
                  </div>
                </div>
                <p className="text-sm text-orange-600 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Use this to reduce stock (e.g., damaged, returned, or written off items)
                </p>
              </div>

              {/* Stock Calculation Summary - Subtract */}
              {stockUpdate.subtractQuantity && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    </div>
                    <h4 className="font-semibold text-orange-900">Stock Reduction Summary</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <p className="text-sm text-gray-600 mb-1">Current Stock</p>
                      <p className="text-xl font-bold text-gray-900">{selectedItem.quantity}</p>
                      <p className="text-xs text-gray-500">{selectedItem.quantityUnit}</p>
                    </div>
                    <div className="bg-red-100 rounded-lg p-4 border border-red-300">
                      <p className="text-sm text-red-700 mb-1">Reducing</p>
                      <p className="text-xl font-bold text-red-900">-{stockUpdate.subtractQuantity}</p>
                      <p className="text-xs text-red-600">{selectedItem.quantityUnit}</p>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-4 border border-blue-300">
                      <p className="text-sm text-blue-700 mb-1">New Total</p>
                      <p className="text-xl font-bold text-blue-900">
                        {Number(selectedItem.quantity) - Number(stockUpdate.subtractQuantity)}
                      </p>
                      <p className="text-xs text-blue-600">{selectedItem.quantityUnit}</p>
                    </div>
                  </div>
                  {Number(stockUpdate.subtractQuantity) > Number(selectedItem.quantity) && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                      <p className="text-sm text-red-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <strong>Warning:</strong> Reduction quantity exceeds current stock!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Remarks for Stock Reduction */}
              <div className="space-y-4">
                <Label htmlFor="reduction-remarks" className="text-base font-semibold text-gray-700">
                  Remarks
                </Label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                  <Textarea
                    id="reduction-remarks"
                    value={stockUpdate.notes}
                    onChange={(e) => setStockUpdate({ ...stockUpdate, notes: e.target.value })}
                    placeholder="Add remarks about this stock reduction (reason: damaged, returned, written off, etc.)"
                    rows={4}
                    className="pl-12 pt-3 text-base border-2 focus:border-blue-500 resize-none"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Provide the reason for reducing this stock (required for tracking purposes)
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 px-8 py-6 flex justify-between items-center shadow-lg">
          

          <div className="flex items-center gap-4 ml-auto">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
              className="px-8 py-3 text-base border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStock}
              size="lg"
              className={`px-8 py-3 text-base ${
                activeTab === 'reduce-stock' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={!stockUpdate.additionalQuantity && !stockUpdate.subtractQuantity}
            >
              {activeTab === 'reduce-stock' ? (
                <Minus className="w-5 h-5 mr-2" />
              ) : (
                <Plus className="w-5 h-5 mr-2" />
              )}
              Update Stock
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}