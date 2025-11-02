import React from 'react';
import { X, Package, Calendar, Clock, FileText, Download, History, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { useERPStore } from '../lib/data-store';
import type { InventoryItem } from '../lib/data-store';

interface ItemHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
}

export function ItemHistoryDialog({ open, onOpenChange, item }: ItemHistoryDialogProps) {
  const { getInventoryTransactionsByItem, vendors } = useERPStore();
  
  if (!item) return null;

  const transactions = getInventoryTransactionsByItem(item.id);
  const vendor = vendors.find(v => v.id === item.vendorId);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getStockBadgeColor = (type: string) => {
    switch (type) {
      case 'Stock In':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Stock Out':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStockIcon = (type: string) => {
    switch (type) {
      case 'Stock In':
        return <TrendingUp className="w-4 h-4" />;
      case 'Stock Out':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[85vw] !w-[85vw] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-50 px-8 py-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-semibold text-gray-900 mb-2">
                  Item Stock History
                </DialogTitle>
                <DialogDescription className="sr-only">
                  View item details and stock update history
                </DialogDescription>
                <div className="flex items-center gap-4">
                  <span className="text-lg text-gray-600">{item.itemName}</span>
                  <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
                    {item.code}
                  </Badge>
                </div>
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
            
            {/* Item Details Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Item Information</h3>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Item Name</Label>
                    <div className="mt-1 text-base font-semibold text-gray-900">{item.itemName}</div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Item Code</Label>
                    <div className="mt-1 text-base font-mono font-bold text-gray-900">{item.code}</div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Category</Label>
                    <div className="mt-1 text-base text-gray-900">{item.category}</div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Sub Category</Label>
                    <div className="mt-1 text-base text-gray-900">{item.subCategory || 'N/A'}</div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Brand</Label>
                    <div className="mt-1 text-base text-gray-900">{item.brand || 'N/A'}</div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Color</Label>
                    <div className="mt-1 text-base text-gray-900">{item.color || 'N/A'}</div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Current Stock</Label>
                    <div className="mt-1 text-base font-bold text-blue-600">
                      {item.quantity} {item.quantityUnit}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Vendor</Label>
                    <div className="mt-1 text-base text-gray-900">{vendor?.vendorName || 'N/A'}</div>
                  </div>

                  {item.expiryDate && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-gray-600">Expiry Date</Label>
                      <div className="mt-1 text-base text-gray-900">{formatDate(item.expiryDate)}</div>
                    </div>
                  )}

                  {item.description && (
                    <div className="col-span-4">
                      <Label className="text-sm font-medium text-gray-600">Description</Label>
                      <div className="mt-1 text-base text-gray-700 leading-relaxed">{item.description}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stock Update History Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <History className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Stock Update History</h3>
                <Badge variant="secondary" className="bg-gray-100 text-gray-700 px-3 py-1">
                  {transactions.length} {transactions.length === 1 ? 'Transaction' : 'Transactions'}
                </Badge>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                {transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Balance After
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bill Number
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vendor
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Attachment
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction, index) => {
                          const transactionVendor = vendors.find(v => v.id === transaction.vendorId);
                          return (
                            <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {formatDate(transaction.transactionDate)}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatTime(transaction.transactionDate)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className={`${getStockBadgeColor(transaction.transactionType)} flex items-center gap-1 w-fit`}>
                                  {getStockIcon(transaction.transactionType)}
                                  {transaction.transactionType}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-bold ${
                                  transaction.transactionType === 'Stock In' ? 'text-green-600' : 
                                  transaction.transactionType === 'Stock Out' ? 'text-red-600' : 
                                  'text-blue-600'
                                }`}>
                                  {transaction.transactionType === 'Stock In' ? '+' : transaction.transactionType === 'Stock Out' ? '-' : '±'}
                                  {transaction.quantity} {item.quantityUnit}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">
                                  {transaction.newStock} {item.quantityUnit}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {transaction.billNumber ? (
                                  <div className="text-sm font-mono text-gray-900">{transaction.billNumber}</div>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {transactionVendor?.vendorName || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {transaction.billNumber ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                    onClick={() => {
                                      // For demo purposes, show an alert. In real implementation, this would open the actual file
                                      alert(`Opening attachment for Bill: ${transaction.billNumber}\n\nIn production, this would display the actual bill document.`);
                                    }}
                                  >
                                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                                    View
                                  </Button>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-16 text-center">
                    <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-base font-medium text-gray-700">No stock history available</p>
                    <p className="text-sm text-gray-500 mt-1">Stock updates will appear here once recorded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
