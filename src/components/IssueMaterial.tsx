import React, { useState } from 'react';
import { 
  Search, Edit, Trash2, FileText, Filter,
  Clock, CheckCircle, Package, Send, X, Target
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface IssueMaterialProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function IssueMaterial({ searchTerm, onSearchChange }: IssueMaterialProps) {
  const [selectedRequisition, setSelectedRequisition] = useState(null);

  const getMaterialRequisitions = () => [
    {
      id: 'REQ001',
      productionCard: 'PC-001',
      productName: 'Premium Lifestyle Sneakers',
      requestedBy: 'John Smith',
      department: 'Production Floor A',
      status: 'Pending Approval',
      priority: 'High',
      requestDate: '2024-09-15',
      requiredDate: '2024-09-18',
      totalItems: 12,
      approver: 'Sarah Johnson',
      materials: [
        { name: 'Upper', quantity: 25, unit: 'pair/vth', available: 120 },
        { name: 'Lining_Skimh', quantity: 25, unit: 'pair @ 15/-', available: 150 },
        { name: 'Lining_EVA', quantity: 35, unit: '3370 - 1.5mm 35pair', available: 40 },
        { name: 'Foam', quantity: 7.5, unit: 'gm', available: 85 },
        { name: 'Velcro', quantity: 1.25, unit: 'pair', available: 95 }
      ]
    },
    {
      id: 'REQ002',
      productionCard: 'PC-003',
      productName: 'Formal Business Shoes',
      requestedBy: 'Mike Chen',
      department: 'Production Floor B',
      status: 'Approved',
      priority: 'Medium',
      requestDate: '2024-09-14',
      requiredDate: '2024-09-17',
      totalItems: 8,
      approver: 'David Brown',
      materials: [
        { name: 'Leather Uppers', quantity: 30, unit: 'pairs', available: 45 },
        { name: 'Dress Soles', quantity: 30, unit: 'pairs', available: 35 }
      ]
    },
    {
      id: 'REQ003',
      productionCard: 'PC-005',
      productName: 'Sports Sandals',
      requestedBy: 'Lisa Wang',
      department: 'Production Floor C',
      status: 'Issued',
      priority: 'Low',
      requestDate: '2024-09-13',
      requiredDate: '2024-09-16',
      totalItems: 6,
      approver: 'Sarah Johnson',
      materials: [
        { name: 'EVA Foam', quantity: 15, unit: 'sheets', available: 20 },
        { name: 'Velcro Straps', quantity: 60, unit: 'pieces', available: 80 }
      ]
    },
    {
      id: 'REQ004',
      productionCard: 'PC-007',
      productName: 'Athletic Running Shoes',
      requestedBy: 'Tom Wilson',
      department: 'Production Floor A',
      status: 'Partial Issued',
      priority: 'High',
      requestDate: '2024-09-16',
      requiredDate: '2024-09-19',
      totalItems: 15,
      approver: 'David Brown',
      materials: [
        { name: 'Mesh Fabric', quantity: 40, unit: 'meters', available: 25 },
        { name: 'Running Soles', quantity: 50, unit: 'pairs', available: 50 },
        { name: 'Foam Padding', quantity: 20, unit: 'sheets', available: 12 }
      ]
    }
  ];

  const filteredData = () => {
    return getMaterialRequisitions().filter(req =>
      req.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Material Issue Dialog Component
  const MaterialIssueDialog = ({ requisition, open, onOpenChange }: any) => {
    const [issuedQuantities, setIssuedQuantities] = useState<Record<string, number>>({});

    if (!requisition) return null;

    const handleIssueQuantityChange = (materialName: string, quantity: number) => {
      setIssuedQuantities(prev => ({
        ...prev,
        [materialName]: quantity
      }));
    };

    const calculateBalance = (required: number, available: number, issued: number) => {
      return required - issued;
    };

    const handleIssueAll = () => {
      // Issue all materials logic
      console.log('Issuing materials:', requisition, issuedQuantities);
      onOpenChange(false);
    };

    // Sample material requirements data
    const materialRequirements = requisition.materials || [
      { name: 'Upper', quantity: 25, unit: 'pair/vth', available: 120, issued: 0 },
      { name: 'Lining_Skimh', quantity: 25, unit: 'pair @ 15/-', available: 150, issued: 0 },
      { name: 'Lining_EVA', quantity: 35, unit: '3370 - 1.5mm 35pair', available: 40, issued: 0 },
      { name: 'Foam', quantity: 7.5, unit: 'gm', available: 85, issued: 0 },
      { name: 'Velcro', quantity: 1.25, unit: 'pair', available: 95, issued: 0 },
      { name: 'Buckle', quantity: 2, unit: 'pcs', available: 180, issued: 0 },
      { name: 'Trim', quantity: 10, unit: 'pcs', available: 250, issued: 0 }
    ];

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[96vw] !w-[96vw] max-h-[95vh] overflow-hidden p-0 m-0 top-[2.5vh] translate-y-0 flex flex-col">
          {/* Sticky Header Section */}
          <div className="sticky top-0 z-50 px-12 py-8 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b-2 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-4xl font-semibold text-gray-900 mb-2">
                    Material Issue Manager
                  </DialogTitle>
                  <DialogDescription className="text-xl text-gray-600">
                    Issue materials from the store room to the production floor for this production card with real-time inventory tracking
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-6">
                
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center"
                  type="button"
                >
                  <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                </Button>
              </div>
            </div>
          </div>

          {/* Scrollable Main Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="px-12 py-10 space-y-8">
              {/* Basic Product Details Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Production Card Details
                  </h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200"></div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Card Number</p>
                      <p className="text-base font-semibold text-gray-900">
                        {requisition.productionCard || requisition.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Product Name</p>
                      <p className="text-base font-semibold text-gray-900">
                        {requisition.productName || 'Athletic Sneaker'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Art & Colour</p>
                      <p className="text-base font-semibold text-gray-900">
                        {requisition.artNumber || 'ART-2025-001'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Color</p>
                      <p className="text-base font-semibold text-blue-600">
                        {requisition.color || 'Navy Blue'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Request Date</p>
                      <p className="text-base font-semibold text-gray-900">
                        {requisition.requestDate || '2025-01-15'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Requested By</p>
                      <p className="text-base font-semibold text-gray-900">
                        {requisition.requestedBy || 'Production Team'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Department</p>
                      <p className="text-base font-semibold text-gray-900">
                        {requisition.department || 'Production Floor A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Total Materials</p>
                      <p className="text-base font-semibold text-green-600">
                        {materialRequirements.length} items
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Material Requirements & Issue Section */}
              <div className="space-y-8">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-4">
                  <Target className="w-6 h-6 text-blue-500" />
                  Material Requirements & Allocation
                </h3>
                
                {/* Material Requirements Table - Exact Same as ProductionCardFormDialog */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
                  
                  {/* Materials Requirements Table */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-100 border-b-2 border-gray-200">
                            <th className="px-6 py-4 text-left font-semibold text-gray-900 border-r border-gray-300 min-w-[120px]">ITEM</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-900 border-r border-gray-300 min-w-[200px]">SPECIFICATION</th>
                            <th className="px-6 py-4 text-center font-semibold text-gray-900 border-r border-gray-300 min-w-[120px]">REQUIREMENT</th>
                            <th className="px-6 py-4 text-center font-semibold text-gray-900 border-r border-gray-300 min-w-[120px]">AVAILABLE</th>
                            <th className="px-6 py-4 text-center font-semibold text-gray-900 border-r border-gray-300 min-w-[100px]">ISSUED</th>
                            <th className="px-6 py-4 text-center font-semibold text-gray-900 min-w-[100px]">BALANCE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Materials Section */}
                          <tr className="border-b border-gray-200 bg-cyan-100">
                            <td className="px-6 py-3 font-semibold text-cyan-800 border-r border-gray-300" colSpan={6}>
                              MATERIALS USED
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-300">Upper</td>
                            <td className="px-6 py-4 text-gray-600 border-r border-gray-300">Rexine</td>
                            <td className="px-6 py-4 text-center text-gray-900 border-r border-gray-300">
                              {requisition.cardQuantity ? `${parseInt(requisition.cardQuantity || '1') * 25} pair/vth` : "25 pair/vth"}
                            </td>
                            <td className="px-6 py-4 text-center border-r border-gray-300">
                              <span className="text-center">{materialRequirements.find(m => m.name === 'Upper')?.available || 120}</span>
                            </td>
                            <td className="px-6 py-4 text-center border-r border-gray-300">
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="w-20 h-8 text-center border-gray-300"
                                min="0"
                                step="1"
                                value={issuedQuantities['Upper'] || ''}
                                onChange={(e) => handleIssueQuantityChange('Upper', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="px-6 py-4 text-center text-gray-400">
                              {Math.max(0, (requisition.cardQuantity ? parseInt(requisition.cardQuantity || '1') * 25 : 25) - (materialRequirements.find(m => m.name === 'Upper')?.available || 120) - (issuedQuantities['Upper'] || 0))}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-300">Lining</td>
                            <td className="px-6 py-4 text-gray-600 border-r border-gray-300">Skimh</td>
                            <td className="px-6 py-4 text-center text-gray-900 border-r border-gray-300">
                              {requisition.cardQuantity ? `${parseInt(requisition.cardQuantity || '1') * 25} pair @ 15/-` : "25 pair @ 15/-"}
                            </td>
                            <td className="px-6 py-4 text-center border-r border-gray-300">
                              <span className="text-center">{materialRequirements.find(m => m.name === 'Lining_Skimh')?.available || 150}</span>
                            </td>
                            <td className="px-6 py-4 text-center border-r border-gray-300">
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="w-20 h-8 text-center border-gray-300"
                                min="0"
                                step="1"
                                value={issuedQuantities['Lining_Skimh'] || ''}
                                onChange={(e) => handleIssueQuantityChange('Lining_Skimh', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="px-6 py-4 text-center text-gray-400">
                              {Math.max(0, (requisition.cardQuantity ? parseInt(requisition.cardQuantity || '1') * 25 : 25) - (materialRequirements.find(m => m.name === 'Lining_Skimh')?.available || 150) - (issuedQuantities['Lining_Skimh'] || 0))}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-300">Lining</td>
                            <td className="px-6 py-4 text-gray-600 border-r border-gray-300">EVA</td>
                            <td className="px-6 py-4 text-center text-gray-900 border-r border-gray-300">3370 - 1.5mm 35pair</td>
                            <td className="px-6 py-4 text-center border-r border-gray-300">
                              <span className="text-center">{materialRequirements.find(m => m.name === 'Lining_EVA')?.available || 40}</span>
                            </td>
                            <td className="px-6 py-4 text-center border-r border-gray-300">
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="w-20 h-8 text-center border-gray-300"
                                min="0"
                                step="1"
                                value={issuedQuantities['Lining_EVA'] || ''}
                                onChange={(e) => handleIssueQuantityChange('Lining_EVA', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="px-6 py-4 text-center text-gray-400">
                              {Math.max(0, 35 - (materialRequirements.find(m => m.name === 'Lining_EVA')?.available || 40) - (issuedQuantities['Lining_EVA'] || 0))}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200 bg-cyan-50">
                            <td className="px-6 py-3 text-sm text-cyan-700 border-r border-gray-300 italic" colSpan={6}>
                              Total Materials: 3 different materials used in production
                            </td>
                          </tr>

                          {/* Components Section */}
                          <tr className="border-b border-gray-200 bg-purple-100">
                            <td className="px-6 py-3 font-semibold text-purple-800 border-r border-gray-300" colSpan={6}>
                              COMPONENTS USED
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-300">Foam</td>
                            <td className="px-6 py-4 text-gray-600 border-r border-gray-300">-</td>
                            <td className="px-6 py-4 text-center text-gray-900 border-r border-gray-300">
                              {requisition.cardQuantity ? `${(parseFloat(requisition.cardQuantity || '1') * 7.5).toFixed(1)} gm` : "7.5 gm"}
                            </td>
                            <td className="px-6 py-4 text-center border-r border-gray-300">
                              <span className="text-center">{materialRequirements.find(m => m.name === 'Foam')?.available || 85}</span>
                            </td>
                            <td className="px-6 py-4 text-center border-r border-gray-300">
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="w-20 h-8 text-center border-gray-300"
                                min="0"
                                step="0.1"
                                value={issuedQuantities['Foam'] || ''}
                                onChange={(e) => handleIssueQuantityChange('Foam', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="px-6 py-4 text-center text-gray-400">
                              {Math.max(0, (requisition.cardQuantity ? parseFloat(requisition.cardQuantity || '1') * 7.5 : 7.5) - (materialRequirements.find(m => m.name === 'Foam')?.available || 85) - (issuedQuantities['Foam'] || 0)).toFixed(1)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-300">Velcro</td>
                            <td className="px-6 py-4 text-gray-600 border-r border-gray-300">75mm</td>
                            <td className="px-6 py-4 text-center text-gray-900 border-r border-gray-300">
                              {requisition.cardQuantity ? `${(parseFloat(requisition.cardQuantity || '1') * 1.25).toFixed(2)} pair` : "1.25 pair"}
                            </td>
                            <td className="px-6 py-4 text-center border-r border-gray-300">
                              <span className="text-center">{materialRequirements.find(m => m.name === 'Velcro')?.available || 95}</span>
                            </td>
                            <td className="px-6 py-4 text-center border-r border-gray-300">
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="w-20 h-8 text-center border-gray-300"
                                min="0"
                                step="0.1"
                                value={issuedQuantities['Velcro'] || ''}
                                onChange={(e) => handleIssueQuantityChange('Velcro', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="px-6 py-4 text-center text-gray-400">
                              {Math.max(0, (requisition.cardQuantity ? parseFloat(requisition.cardQuantity || '1') * 1.25 : 1.25) - (materialRequirements.find(m => m.name === 'Velcro')?.available || 95) - (issuedQuantities['Velcro'] || 0)).toFixed(2)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-300">Buckle</td>
                            <td className="px-6 py-4 text-gray-600 border-r border-gray-300">-</td>
                            <td className="px-6 py-4 text-center text-gray-900 border-r border-gray-300">
                              {requisition.cardQuantity ? `${parseInt(requisition.cardQuantity || '1') * 2} pcs` : "2 pcs"}
                            </td>
                            <td className="px-6 py-4 text-center border-r border-gray-300">
                              <span className="text-center">{materialRequirements.find(m => m.name === 'Buckle')?.available || 180}</span>
                            </td>
                            <td className="px-6 py-4 text-center border-r border-gray-300">
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="w-20 h-8 text-center border-gray-300"
                                min="0"
                                step="1"
                                value={issuedQuantities['Buckle'] || ''}
                                onChange={(e) => handleIssueQuantityChange('Buckle', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="px-6 py-4 text-center text-gray-400">
                              {Math.max(0, (requisition.cardQuantity ? parseInt(requisition.cardQuantity || '1') * 2 : 2) - (materialRequirements.find(m => m.name === 'Buckle')?.available || 180) - (issuedQuantities['Buckle'] || 0))}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-300">Trim</td>
                            <td className="px-6 py-4 text-gray-600 border-r border-gray-300">sticker</td>
                            <td className="px-6 py-4 text-center text-gray-900 border-r border-gray-300">
                              {requisition.cardQuantity ? `${parseInt(requisition.cardQuantity || '1') * 10} pcs` : "10 pcs"}
                            </td>
                            <td className="px-6 py-4 text-center border-r border-gray-300">
                              <span className="text-center">{materialRequirements.find(m => m.name === 'Trim')?.available || 250}</span>
                            </td>
                            <td className="px-6 py-4 text-center border-r border-gray-300">
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="w-20 h-8 text-center border-gray-300"
                                min="0"
                                step="1"
                                value={issuedQuantities['Trim'] || ''}
                                onChange={(e) => handleIssueQuantityChange('Trim', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="px-6 py-4 text-center text-gray-400">
                              {Math.max(0, (requisition.cardQuantity ? parseInt(requisition.cardQuantity || '1') * 10 : 10) - (materialRequirements.find(m => m.name === 'Trim')?.available || 250) - (issuedQuantities['Trim'] || 0))}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200 bg-purple-50">
                            <td className="px-6 py-3 text-sm text-purple-700 border-r border-gray-300 italic" colSpan={6}>
                              Total Components: 4 different components used in production
                            </td>
                          </tr>

                          {/* Summary Row */}
                          <tr className="border-t-2 border-gray-300 bg-blue-100">
                            <td className="px-6 py-4 font-bold text-blue-900 border-r border-gray-300" colSpan={2}>
                              TOTAL ITEMS FOR PRODUCTION
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-blue-900 border-r border-gray-300">
                              {requisition.cardQuantity || "1"} units
                            </td>
                            <td className="px-6 py-4 text-center font-semibold text-blue-700 border-r border-gray-300">
                              Available
                            </td>
                            <td className="px-6 py-4 text-center font-semibold text-blue-700 border-r border-gray-300">
                              Pending
                            </td>
                            <td className="px-6 py-4 text-center font-semibold text-blue-700">
                              Remaining
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Issue Summary Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900">Issue Summary</h3>
                        <p className="text-sm text-blue-700">
                          Total Items: {Object.keys(issuedQuantities).length} | 
                          Total Quantity Issued: {Object.values(issuedQuantities).reduce((sum, qty) => sum + qty, 0)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-600 font-semibold">
                        Issue Status
                      </p>
                      <p className="text-xl font-mono font-bold text-blue-800">
                        {Object.values(issuedQuantities).reduce((sum, qty) => sum + qty, 0) > 0 ? 'Ready' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sticky Action Buttons */}
                <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200/80 shadow-2xl shadow-gray-900/10 z-50">
                  <div className="px-12 py-6 flex justify-end gap-4">
                    <Button
                      onClick={() => onOpenChange(false)}
                      variant="outline"
                      size="lg"
                      className="px-8 py-3 h-12 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleIssueAll}
                      size="lg"
                      className="px-8 py-3 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      Issue Materials
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search issue material..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Material Requisitions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Card Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Art and Colour
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Create Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData().map((req: any) => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => setSelectedRequisition(req)}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{req.productionCard || req.id}</div>
                        <div className="text-sm text-gray-500">Production Card</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{req.productName || 'Athletic Sneaker'}</div>
                    <div className="text-sm text-gray-500">Size: {req.size || '7-11'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{req.artNumber || 'ART-2025-001'}</div>
                    <div className="text-sm text-gray-500">Color: {req.color || 'Navy Blue'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{req.requestDate || '2025-01-15'}</div>
                    <div className="text-gray-500">{req.requestTime || '10:30 AM'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setSelectedRequisition(req)}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Issue
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Material Issue Dialog */}
      <MaterialIssueDialog 
        requisition={selectedRequisition}
        open={!!selectedRequisition}
        onOpenChange={(open: boolean) => !open && setSelectedRequisition(null)}
      />
    </div>
  );
}