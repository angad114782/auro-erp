import React, { useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, AlertTriangle, IndianRupee, FileText, Filter,
  Warehouse, Layers, Users, Clock, CheckCircle, 
  ArrowUp, ArrowDown, MapPin, Phone, Mail, Package, 
  ShoppingCart, Calendar, TrendingUp, Building, Archive,
  Send, Eye, Download, RefreshCw, BarChart3, X, Target, MoreHorizontal,
  ChevronLeft, ChevronRight, Settings, BarChart4
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useERPStore } from '../lib/data-store';
import { IssueMaterial } from './IssueMaterial';
import { Inventory } from './Inventory';
import { VendorManagement } from './VendorManagement';
import { InventoryReportsAnalysis } from './InventoryReportsAnalysis';
import svgPaths from '../imports/svg-gixm2ll7zv';

interface InventoryManagementProps {
  currentSubModule?: string;
}

export function InventoryManagement({ currentSubModule }: InventoryManagementProps) {
  const { vendors, productionCards, inventoryItems, materialRequests } = useERPStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubModule, setSelectedSubModule] = useState(currentSubModule || 'inventory');

  const subModules = [
    {
      id: 'inventory',
      name: 'Inventory',
      icon: <Layers className="w-5 h-5" />,
      description: 'AI-powered warehouse space and layout optimization',
      color: 'bg-indigo-500',
      count: 12,
      badge: 'Pro'
    },
    {
      id: 'material-requisition',
      name: 'Issue Material',
      icon: <ShoppingCart className="w-5 h-5" />,
      description: 'Production material requests and store room management',
      color: 'bg-blue-500',
      count: 45,
      badge: 'New'
    },
    {
      id: 'vendor-management',
      name: 'Vendor Management',
      icon: <Users className="w-5 h-5" />,
      description: 'Comprehensive supplier relationship and performance management',
      color: 'bg-cyan-500',
      count: vendors.length,
      badge: '15'
    },
    {
      id: 'reports-analysis',
      name: 'Inventory Reports Analysis',
      icon: <BarChart4 className="w-5 h-5" />,
      description: 'Detailed analysis of inventory reports',
      color: 'bg-gray-500',
      count: 10,
      badge: '10'
    }
  ];

  React.useEffect(() => {
    if (currentSubModule) {
      setSelectedSubModule(currentSubModule);
    }
  }, [currentSubModule]);

  const filteredData = () => {
    // No longer needed - vendor filtering is handled in VendorManagement component
    return [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Issued': return 'bg-blue-100 text-blue-800';
      case 'Partial Issued': return 'bg-yellow-100 text-yellow-800';
      case 'Pending Approval': return 'bg-orange-100 text-orange-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCurrentModule = () => {
    switch (selectedSubModule) {
      case 'inventory':
        return <Inventory searchTerm={searchTerm} />;
      case 'material-requisition':
        return <IssueMaterial searchTerm={searchTerm} />;
      case 'vendor-management':
        return <VendorManagement searchTerm={searchTerm} onSearchChange={setSearchTerm} />;
      case 'reports-analysis':
        return <InventoryReportsAnalysis />;
      default:
        return <Inventory searchTerm={searchTerm} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="hidden items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#0c9dcb] to-[#26b4e0] rounded-xl flex items-center justify-center shadow-lg">
            <Warehouse className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory & Storage</h1>
            <p className="text-gray-600">Advanced inventory management and storage optimization system</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync
          </Button>
        </div>
      </div>

      {/* Sub-module Navigation */}
      <div className="hidden items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        {subModules.map((module) => (
          <button
            key={module.id}
            onClick={() => setSelectedSubModule(module.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              selectedSubModule === module.id
                ? 'bg-white text-[#0c9dcb] shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              {module.icon}
              <span>{module.name}</span>
              {module.badge && (
                <Badge variant="secondary" className="text-xs">
                  {module.badge}
                </Badge>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Overview Cards for Material Requisition - Outside Main Card */}
      {selectedSubModule === 'material-requisition' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Requests Today</p>
                  <p className="text-xl font-bold text-gray-900">{materialRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Today</p>
                  <p className="text-xl font-bold text-gray-900">{materialRequests.filter(req => req.status === 'Pending Availability Check' || req.status === 'Pending to Store').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Approved Today</p>
                  <p className="text-xl font-bold text-gray-900">{materialRequests.filter(req => req.status === 'Issued' || req.status === 'Partially Issued').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          {/* Content Based on Selected Module */}
          {selectedSubModule === 'material-requisition' ? (
            <div className="p-6">
              <IssueMaterial 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </div>
          ) : (
            <div className="">
             

              {renderCurrentModule()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}