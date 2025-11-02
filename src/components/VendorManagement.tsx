import React, { useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, AlertTriangle, IndianRupee, FileText, Filter,
  Users, Clock, CheckCircle, ArrowUp, ArrowDown, MapPin, Phone, Mail, 
  Package, Calendar, TrendingUp, Building, Archive, Send, Eye, Download, 
  RefreshCw, BarChart3, X, Target, MoreHorizontal, Settings
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useERPStore } from '../lib/data-store';
import { VendorViewDialog } from './VendorViewDialog';
import { VendorEditDialog } from './VendorEditDialog';
import { VendorAddDialog } from './VendorAddDialog';

interface VendorManagementProps {
  searchTerm: string;
  onSearchChange?: (term: string) => void;
}

export function VendorManagement({ searchTerm, onSearchChange }: VendorManagementProps) {
  const { vendors } = useERPStore();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredVendors = vendors.filter(vendor => 
    (vendor.vendorName?.toLowerCase() || '').includes(localSearchTerm.toLowerCase()) ||
    (vendor.vendorId?.toLowerCase() || '').includes(localSearchTerm.toLowerCase()) ||
    (vendor.contactPerson?.toLowerCase() || '').includes(localSearchTerm.toLowerCase())
  );

  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const getVendorPerformanceScore = () => {
    const scores = [92, 95, 88, 91, 94, 89];
    return scores[Math.floor(Math.random() * scores.length)];
  };

  const getTotalSpend = () => {
    const spends = ['₹2.4M', '₹1.8M', '₹3.2M', '₹2.1M'];
    return spends[Math.floor(Math.random() * spends.length)];
  };

  const getRiskLevel = () => {
    const risks = ['Low', 'Medium', 'Low', 'Low'];
    return risks[Math.floor(Math.random() * risks.length)];
  };

  const handleViewVendor = (vendor: any) => {
    console.log('handleViewVendor called with vendor:', vendor);
    setSelectedVendor(vendor);
    setShowVendorDialog(true);
    console.log('State should be updated - showVendorDialog: true, selectedVendor:', vendor);
  };

  const handleEditVendor = (vendor: any) => {
    console.log('handleEditVendor called with vendor:', vendor);
    setSelectedVendor(vendor);
    setShowEditDialog(true);
    console.log('State should be updated - showEditDialog: true, selectedVendor:', vendor);
  };

  return (
    <div className="w-full">
      {/* Vendor Navigation Bar */}
      <div className="flex flex-col gap-6 p-6 pb-4">
        {/* Top Navigation with Search and Actions */}
        <div className="flex items-center justify-between w-full border-b border-gray-200 pb-2">
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#0c9dcb]" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Vendor Directory</h2>
              <p className="text-sm text-gray-500">Manage supplier relationships and performance</p>
            </div>
          </div>
          
          {/* Right: Search and Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-80">
              <Input
                value={localSearchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search vendors by name, code, or contact person..."
                className="pl-10 pr-4 h-9"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            
            {/* Total Vendors */}
            <div className="px-3 py-2 border border-[#0c9dcb] rounded-lg">
              <span className="text-[#0c9dcb] font-semibold text-sm">Total Vendors : {filteredVendors.length.toString().padStart(2, '0')}</span>
            </div>
            
           
            {/* Export Button */}
            <Button variant="outline" size="sm" className="h-9">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            {/* Add Vendor */}
            <Button 
              className="bg-[#0c9dcb] hover:bg-[#26b4e0] px-3 py-2 rounded-lg h-9"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2 text-white" />
              <span className="text-white font-semibold text-sm">Add Vendor</span>
            </Button>
          </div>
        </div>
        
      </div>

      {/* Vendors Table */}
      <div className="mx-6 mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Information
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name & Item Code "Brand"
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                  <tr className="hover:bg-gray-50 transition-colors" key={vendor.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-semibold">
                            {(vendor.vendorName || 'N/A').slice(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{vendor.vendorName || 'No Name'}</div>
                          <div className="text-sm text-gray-500">{vendor.vendorId || 'No Code'}</div>
                          <div className="text-xs text-gray-400">
                            Status: <span className={vendor.status === 'Active' ? 'text-green-600 font-medium' : 'text-gray-600'}>{vendor.status}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 text-gray-400" />
                          <div className="text-sm font-medium text-gray-900">{vendor.contactPerson || 'No Contact'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <div className="text-sm text-gray-500">{vendor.phone || 'No Phone'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <div className="text-sm text-gray-500">{vendor.email || 'No Email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-900">{vendor.itemName || 'No Item'}</div>
                        <div className="text-sm text-gray-500">Item Code: {vendor.itemCode || 'No Code'}</div>
                        <div className="text-xs font-medium text-gray-700">"{vendor.brand || 'No Brand'}"</div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <div className="text-xs text-gray-500">
                            {vendor.countryId === '1' ? 'India' : 
                             vendor.countryId === '2' ? 'China' : 
                             vendor.countryId === '3' ? 'Vietnam' : 
                             vendor.countryId === '4' ? 'Indonesia' : 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50 h-8 px-3" onClick={() => handleViewVendor(vendor)}>
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-green-200 text-green-600 hover:bg-green-50 h-8 px-3"
                          onClick={() => handleEditVendor(vendor)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">No vendors found</p>
                      {localSearchTerm && (
                        <p className="text-sm text-gray-400">
                          Try adjusting your search terms
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {filteredVendors.length} of {filteredVendors.length} vendors
              {localSearchTerm && ` (filtered by "${localSearchTerm}")`}
            </p>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 px-3 text-gray-600 hover:bg-gray-100" disabled>
                Previous
              </Button>
              <div className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-medium">
                1
              </div>
              <Button variant="outline" size="sm" className="h-8 px-3 text-gray-600 hover:bg-gray-100" disabled>
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Vendor View Dialog */}
      <VendorViewDialog
        open={showVendorDialog}
        vendor={selectedVendor}
        onOpenChange={(open: boolean) => {
          setShowVendorDialog(open);
          if (!open) setSelectedVendor(null);
        }}
      />
      
      {/* Vendor Edit Dialog */}
      <VendorEditDialog
        open={showEditDialog}
        vendor={selectedVendor}
        onOpenChange={(open: boolean) => {
          setShowEditDialog(open);
          if (!open) setSelectedVendor(null);
        }}
      />
      
      {/* Add Vendor Dialog */}
      <VendorAddDialog
        open={showAddDialog}
        onOpenChange={(open: boolean) => {
          setShowAddDialog(open);
        }}
      />
    </div>
  );
}