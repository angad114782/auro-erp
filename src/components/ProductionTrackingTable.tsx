import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Edit,
  Eye,
  MoreHorizontal,
  ArrowUpDown,
  CheckCircle,
  AlertTriangle,
  Clock,
  Scissors,
  Printer,
  ShirtIcon,
  X,
  Wrench,
  Package,
  FileCheck,
  MessageSquare,
  Target,
  Building,
  Workflow,
  Calendar,
  Plus,
  Save,
  RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { ItemCuttingDialog } from './ItemCuttingDialog';
import { useERPStore } from '../lib/data-store';

interface ProductionRecord {
  id: string;
  productionId: string;
  brand: string;
  category: string;
  type: string;
  gender: string;
  articleName: string;
  poNumber: string;
  poItems: number;
  monthPlan: number;
  manufacturingCompany: string;
  country: string;
  color: string;
  size: string;
  unitPstId: string;
  cutting: {
    status: 'Pending' | 'In Progress' | 'Completed';
    quantity: number;
    planned: number;
  };
  printing: {
    status: 'Pending' | 'In Progress' | 'Completed';
    quantity: number;
    planned: number;
  };
  upper: {
    status: 'Pending' | 'In Progress' | 'Completed';
    quantity: number;
    planned: number;
  };
  upperREJ: {
    status: 'Pending' | 'Rejected' | 'Approved';
    quantity: number;
    planned: number;
  };
  assembly: {
    status: 'Pending' | 'In Progress' | 'Completed';
    quantity: number;
    planned: number;
  };
  packing: {
    status: 'Pending' | 'In Progress' | 'Completed';
    quantity: number;
    planned: number;
  };
  rfd: {
    status: 'Pending' | 'Ready' | 'Dispatched';
    quantity: number;
    planned: number;
  };
  rfdRemarks: string;
}

interface DailyProduction {
  [key: string]: number; // key format: "YYYY-MM-DD"
}

interface ProductionData {
  record: ProductionRecord;
  dailyProduction: DailyProduction;
}

type ProductionStage = 'cutting' | 'printing' | 'upper' | 'upperREJ' | 'assembly' | 'packing' | 'rfd';

export function ProductionTrackingTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('09'); // Default to September
  const [selectedYear, setSelectedYear] = useState('2025'); // Default to 2025
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeStage, setActiveStage] = useState<ProductionStage>('cutting'); // Default to cutting
  const [selectedProductionRecord, setSelectedProductionRecord] = useState<ProductionRecord | null>(null);
  const [stageUpdateDialogOpen, setStageUpdateDialogOpen] = useState(false);
  const [stageUpdateSearchTerm, setStageUpdateSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [updateEntries, setUpdateEntries] = useState<{[key: string]: {quantity: number, remarks: string, advanceTo?: string}}>({});
  const [itemCuttingDialogOpen, setItemCuttingDialogOpen] = useState(false);
  const [selectedProductForCutting, setSelectedProductForCutting] = useState<any>(null);
  
  // Get production cards from store
  const { productionCards } = useERPStore();

  // Define stages first to avoid initialization errors
  const stages = [
    { key: 'cutting' as ProductionStage, name: 'Cutting', color: 'text-red-600' },
    { key: 'printing' as ProductionStage, name: 'Printing', color: 'text-purple-600' },
    { key: 'upper' as ProductionStage, name: 'Upper', color: 'text-blue-600' },
    { key: 'upperREJ' as ProductionStage, name: 'Upper REJ', color: 'text-orange-600' },
    { key: 'assembly' as ProductionStage, name: 'Assembly', color: 'text-green-600' },
    { key: 'packing' as ProductionStage, name: 'Packing', color: 'text-indigo-600' },
    { key: 'rfd' as ProductionStage, name: 'RFD', color: 'text-teal-600' }
  ];

  // Consistent dummy data that works across all months
  const baseProductionData: ProductionRecord[] = [
    {
      id: '1',
      productionId: 'PRD/25-26/09/001',
      brand: 'YoBu',
      category: 'Shoes',
      type: 'Pyskin',
      gender: 'Men',
      articleName: 'Classic Double Strap Canvas',
      poNumber: 'PO/AVEXT/TM',
      poItems: 1760,
      monthPlan: 1176,
      manufacturingCompany: 'Aura',
      country: 'India',
      color: 'Maroon Blue',
      size: '6-11',
      unitPstId: 'PSI-AVEXT/TM/01',
      cutting: { status: 'Completed', quantity: 1760, planned: 1760 },
      printing: { status: 'Completed', quantity: 1760, planned: 1760 },
      upper: { status: 'In Progress', quantity: 1200, planned: 1760 },
      upperREJ: { status: 'Pending', quantity: 0, planned: 1760 },
      assembly: { status: 'Pending', quantity: 0, planned: 1760 },
      packing: { status: 'Pending', quantity: 0, planned: 1760 },
      rfd: { status: 'Pending', quantity: 0, planned: 1760 },
      rfdRemarks: ''
    },
    {
      id: '2',
      productionId: 'PRD/25-26/09/002',
      brand: 'YoBu',
      category: 'Shoes',
      type: 'Pyskin',
      gender: 'Men',
      articleName: 'Premium Leather Boot',
      poNumber: 'PO/AVEXT/LB',
      poItems: 1200,
      monthPlan: 800,
      manufacturingCompany: 'Zenith',
      country: 'Gujarat',
      color: 'Dark Brown',
      size: '7-12',
      unitPstId: 'PSI-AVEXT/LB/02',
      cutting: { status: 'Completed', quantity: 1200, planned: 1200 },
      printing: { status: 'Completed', quantity: 1200, planned: 1200 },
      upper: { status: 'Completed', quantity: 1200, planned: 1200 },
      upperREJ: { status: 'Approved', quantity: 1200, planned: 1200 },
      assembly: { status: 'In Progress', quantity: 800, planned: 1200 },
      packing: { status: 'Pending', quantity: 0, planned: 1200 },
      rfd: { status: 'Pending', quantity: 0, planned: 1200 },
      rfdRemarks: ''
    },
    {
      id: '3',
      productionId: 'PRD/25-26/09/003',
      brand: 'YoBu',
      category: 'Shoes',
      type: 'Canvas',
      gender: 'Women',
      articleName: 'Floral Summer Collection',
      poNumber: 'REVAVEXT/FL',
      poItems: 2400,
      monthPlan: 1600,
      manufacturingCompany: 'Prime Footwear',
      country: 'Y.Naya',
      color: 'Floral Mix',
      size: '4-9',
      unitPstId: 'ALPAVA17704',
      cutting: { status: 'Completed', quantity: 2400, planned: 2400 },
      printing: { status: 'Completed', quantity: 2400, planned: 2400 },
      upper: { status: 'Completed', quantity: 2400, planned: 2400 },
      upperREJ: { status: 'Approved', quantity: 2400, planned: 2400 },
      assembly: { status: 'Completed', quantity: 2400, planned: 2400 },
      packing: { status: 'Completed', quantity: 2400, planned: 2400 },
      rfd: { status: 'Dispatched', quantity: 2400, planned: 2400 },
      rfdRemarks: 'Completed and dispatched'
    },
    {
      id: '4',
      productionId: 'PRD/25-26/09/004',
      brand: 'Nike',
      category: 'Shoes',
      type: 'Sports',
      gender: 'Unisex',
      articleName: 'Athletic Runner Pro',
      poNumber: 'PO/NIKE/AR',
      poItems: 1800,
      monthPlan: 1200,
      manufacturingCompany: 'Elite Manufacturing',
      country: 'Karnataka',
      color: 'Black White',
      size: '6-12',
      unitPstId: 'PSI-NIKE/AR/03',
      cutting: { status: 'In Progress', quantity: 1500, planned: 1800 },
      printing: { status: 'In Progress', quantity: 1200, planned: 1800 },
      upper: { status: 'Pending', quantity: 0, planned: 1800 },
      upperREJ: { status: 'Pending', quantity: 0, planned: 1800 },
      assembly: { status: 'Pending', quantity: 0, planned: 1800 },
      packing: { status: 'Pending', quantity: 0, planned: 1800 },
      rfd: { status: 'Pending', quantity: 0, planned: 1800 },
      rfdRemarks: 'New order in progress'
    },
    {
      id: '5',
      productionId: 'PRD/25-26/09/005',
      brand: 'Adidas',
      category: 'Shoes',
      type: 'Sports',
      gender: 'Men',
      articleName: 'Performance Basketball',
      poNumber: 'PO/ADIDAS/PB',
      poItems: 960,
      monthPlan: 640,
      manufacturingCompany: 'Stellar Shoes',
      country: 'Tamil Nadu',
      color: 'Red Black',
      size: '8-13',
      unitPstId: 'PSI-ADIDAS/PB/04',
      cutting: { status: 'Completed', quantity: 960, planned: 960 },
      printing: { status: 'Completed', quantity: 960, planned: 960 },
      upper: { status: 'Completed', quantity: 960, planned: 960 },
      upperREJ: { status: 'Approved', quantity: 960, planned: 960 },
      assembly: { status: 'Completed', quantity: 960, planned: 960 },
      packing: { status: 'In Progress', quantity: 600, planned: 960 },
      rfd: { status: 'Pending', quantity: 0, planned: 960 },
      rfdRemarks: 'Packing in progress'
    }
  ];

  // Function to get number of days in a month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // Function to get month name
  const getMonthName = (monthNum: string) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[parseInt(monthNum) - 1];
  };

  // Function to generate stage-specific daily production data
  const generateStageProductionData = (record: ProductionRecord, stage: ProductionStage, year: number, month: number): DailyProduction => {
    const daysInMonth = getDaysInMonth(year, month);
    const dailyData: DailyProduction = {};
    
    // Get stage-specific planned quantity
    const stageData = record[stage];
    const stagePlanned = stageData.planned;
    const stageCompleted = stageData.quantity;
    
    // Base daily production rate for this stage
    const baseDailyRate = Math.floor(stagePlanned / 25); // Spread over 25 working days
    const variance = Math.floor(baseDailyRate * 0.4); // 40% variance
    
    // Track cumulative production to not exceed stage quantity
    let cumulativeProduction = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      // No production on weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        dailyData[dateKey] = 0;
      } else {
        // Generate stage-specific production based on stage status and completion
        const seed = parseInt(record.id) * day * month * (stages.findIndex(s => s.key === stage) + 1);
        const randomFactor = (seed % 100) / 100;
        
        let dailyProduction = 0;
        
        // Production logic based on stage status
        if (stageData.status === 'Completed') {
          // If completed, distribute the completed quantity across the month
          const targetDaily = Math.floor(stageCompleted / 20); // Spread over 20 working days
          dailyProduction = Math.floor(targetDaily + (variance * randomFactor));
        } else if (stageData.status === 'In Progress') {
          // If in progress, produce up to the current quantity
          const targetDaily = Math.floor(stageCompleted / 15); // More concentrated
          dailyProduction = Math.floor(targetDaily + (variance * randomFactor * 0.7));
        } else {
          // If pending, minimal or no production
          dailyProduction = Math.floor(baseDailyRate * 0.1 * randomFactor);
        }
        
        // Ensure we don't exceed the stage's actual quantity
        if (cumulativeProduction + dailyProduction > stageCompleted) {
          dailyProduction = Math.max(0, stageCompleted - cumulativeProduction);
        }
        
        dailyData[dateKey] = Math.max(0, dailyProduction);
        cumulativeProduction += dailyProduction;
      }
    }
    
    return dailyData;
  };

  // Function to generate week data for selected month/year
  const generateWeekData = () => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const daysInMonth = getDaysInMonth(year, month);
    const monthName = getMonthName(selectedMonth);

    const weeks = [];
    let currentDay = 1;
    let weekNumber = 1;

    while (currentDay <= daysInMonth) {
      const weekStart = currentDay;
      const weekEnd = Math.min(currentDay + 6, daysInMonth);
      const weekDays = [];

      for (let day = weekStart; day <= weekEnd; day++) {
        weekDays.push(day);
      }

      weeks.push({
        weekNumber,
        weekStart,
        weekEnd,
        days: weekDays,
        label: `Week ${weekNumber} (${weekStart}-${weekEnd} ${monthName})`
      });

      currentDay = weekEnd + 1;
      weekNumber++;
    }

    return weeks;
  };

  const weekData = generateWeekData();

  // Generate production data with stage-specific daily details
  const productionData: ProductionData[] = baseProductionData.map(record => ({
    record,
    dailyProduction: generateStageProductionData(record, activeStage, parseInt(selectedYear), parseInt(selectedMonth))
  }));

  const getStatusBadge = (status: string, type: 'production' | 'upperREJ' | 'rfd') => {
    if (type === 'upperREJ') {
      switch (status) {
        case 'Approved':
          return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
        case 'Rejected':
          return <Badge className="bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
        case 'Pending':
          return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
        default:
          return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
      }
    }
    
    if (type === 'rfd') {
      switch (status) {
        case 'Dispatched':
          return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Dispatched</Badge>;
        case 'Ready':
          return <Badge className="bg-blue-100 text-blue-800"><FileCheck className="w-3 h-3 mr-1" />Ready</Badge>;
        case 'Pending':
          return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
        default:
          return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
      }
    }

    switch (status) {
      case 'Completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'In Progress':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'cutting':
        return <Scissors className="w-4 h-4" />;
      case 'printing':
        return <Printer className="w-4 h-4" />;
      case 'upper':
        return <ShirtIcon className="w-4 h-4" />;
      case 'upperREJ':
        return <X className="w-4 h-4" />;
      case 'assembly':
        return <Wrench className="w-4 h-4" />;
      case 'packing':
        return <Package className="w-4 h-4" />;
      case 'rfd':
        return <FileCheck className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Calculate production cards by counting actual cards created in Production Planning
  // Cards are linked by productionId (record.id matches card.projectId)
  const calculateProductionCards = (productionId: string): number => {
    if (!productionCards || productionCards.length === 0) {
      return 0;
    }
    
    // Count cards that match this production record
    // Filter out demo cards (IDs '1' and '2' and cards starting with 'PROD/25-26/09/00')
    const validCards = productionCards.filter(card => 
      card.projectId === productionId &&
      !['1', '2'].includes(card.id) &&
      !card.cardNumber?.startsWith('PROD/25-26/09/00')
    );
    
    return validCards.length;
  };

  const filteredData = productionData.filter(({ record }) => {
    const matchesSearch = 
      record.articleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.color.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Get current stage name for display
  const getCurrentStageName = () => {
    return stages.find(s => s.key === activeStage)?.name || 'Production';
  };

  // Calculate totals
  const calculateDailyTotals = () => {
    const dailyTotals: { [key: string]: number } = {};
    
    filteredData.forEach(({ dailyProduction }) => {
      Object.entries(dailyProduction).forEach(([date, production]) => {
        dailyTotals[date] = (dailyTotals[date] || 0) + production;
      });
    });
    
    return dailyTotals;
  };

  const dailyTotals = calculateDailyTotals();

  // Function to update production data
  const updateProductionData = (productId: string, stage: ProductionStage, quantity: number, remarks: string) => {
    // In a real application, this would update the database
    // For now, we'll simulate the update and show a success message
    const productName = baseProductionData.find(p => p.id === productId)?.articleName || 'Product';
    toast.success(`Updated ${getCurrentStageName()} for ${productName}: +${quantity} units`);
    
    // Reset the entry for this product
    setUpdateEntries(prev => ({
      ...prev,
      [productId]: { quantity: 0, remarks: '' }
    }));
  };

  // Function to handle batch update
  const handleBatchUpdate = () => {
    let updatesCount = 0;
    Object.entries(updateEntries).forEach(([productId, entry]) => {
      if (entry.quantity > 0) {
        updateProductionData(productId, activeStage, entry.quantity, entry.remarks);
        updatesCount++;
      }
    });
    
    if (updatesCount > 0) {
      toast.success(`Successfully updated ${updatesCount} product(s) for ${getCurrentStageName()}`);
      setStageUpdateDialogOpen(false);
    } else {
      toast.error('Please enter quantities to update');
    }
  };

  // Filtered products for stage update dialog
  const filteredProductsForUpdate = baseProductionData.filter(record => 
    record.articleName.toLowerCase().includes(stageUpdateSearchTerm.toLowerCase()) ||
    record.productionId.toLowerCase().includes(stageUpdateSearchTerm.toLowerCase()) ||
    record.brand.toLowerCase().includes(stageUpdateSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-gray-900">{getCurrentStageName()} Production Tracking</h2>
          <p className="text-sm text-gray-600">Monitor {getCurrentStageName().toLowerCase()} production progress across all manufacturing orders</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={() => setStageUpdateDialogOpen(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Update {getCurrentStageName()}
          </Button>
        </div>
      </div>

      {/* Process Flow Tabs */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-gray-100">
       
        <CardContent>
          <div className="flex items-center justify-between">
            {stages.map((stage, index) => (
              <div key={stage.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setActiveStage(stage.key)}
                    className={`w-12 h-12 border-2 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 hover:scale-105 ${
                      activeStage === stage.key
                        ? 'bg-[#0c9dcb] border-[#0c9dcb] text-white shadow-lg'
                        : `bg-white border-gray-300 ${stage.color} hover:border-[#0c9dcb]`
                    }`}
                  >
                    {getStageIcon(stage.key)}
                  </button>
                  <span className={`text-xs font-medium mt-2 text-center transition-colors duration-200 ${
                    activeStage === stage.key ? 'text-[#0c9dcb]' : 'text-gray-700'
                  }`}>
                    {stage.name}
                  </span>
                </div>
                {index < stages.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 transition-colors duration-200 ${
                    activeStage === stage.key || (index < stages.findIndex(s => s.key === activeStage))
                      ? 'bg-[#0c9dcb]'
                      : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by article, PO number, brand, or color..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="01">January</SelectItem>
                <SelectItem value="02">February</SelectItem>
                <SelectItem value="03">March</SelectItem>
                <SelectItem value="04">April</SelectItem>
                <SelectItem value="05">May</SelectItem>
                <SelectItem value="06">June</SelectItem>
                <SelectItem value="07">July</SelectItem>
                <SelectItem value="08">August</SelectItem>
                <SelectItem value="09">September</SelectItem>
                <SelectItem value="10">October</SelectItem>
                <SelectItem value="11">November</SelectItem>
                <SelectItem value="12">December</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Production Table */}
      <Card className="shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-900 sticky left-0 bg-gray-50 z-20 border-r border-gray-200 shadow-sm">
                  <button 
                    onClick={() => handleSort('articleName')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Product Details
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">
                  PO Info
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">
                  Month Plan
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">
                  MNFC
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">
                  {getCurrentStageName()} Status
                </th>
                {/* Dynamic Week Headers */}
                {weekData.map((week, index) => (
                  <React.Fragment key={`week-${week.weekNumber}`}>
                    <th className="px-2 py-3 text-center font-medium text-gray-900 border-l border-gray-200" colSpan={week.days.length}>
                      {week.label}
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-900 bg-green-50 border border-green-200">
                      W{week.weekNumber} Total
                    </th>
                  </React.Fragment>
                ))}
                <th className="px-3 py-3 text-center font-medium text-gray-900 bg-blue-50 border border-blue-200 sticky right-0 z-20 shadow-lg">
                  Monthly Total
                </th>
              </tr>
              <tr className="border-b border-gray-200 bg-gray-100">
                <th className="px-4 py-2 text-xs font-medium text-gray-600 sticky left-0 bg-gray-100 z-20 border-r border-gray-200 shadow-sm"></th>
                <th className="px-4 py-2 text-xs font-medium text-gray-600"></th>
                <th className="px-4 py-2 text-xs font-medium text-gray-600"></th>
                <th className="px-4 py-2 text-xs font-medium text-gray-600"></th>
                <th className="px-4 py-2 text-xs font-medium text-gray-600"></th>
                {/* Dynamic Day Headers */}
                {weekData.map((week) => (
                  <React.Fragment key={`week-days-${week.weekNumber}`}>
                    {week.days.map((day) => (
                      <th key={`w${week.weekNumber}-${day}`} className="px-1.5 py-2 text-xs font-medium text-gray-600 text-center min-w-[30px] border-r border-gray-100">
                        {day}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-xs font-medium text-green-700 text-center min-w-[45px] bg-green-50 border border-green-200">
                      W{week.weekNumber}
                    </th>
                  </React.Fragment>
                ))}
                <th className="px-2 py-2 text-xs font-medium text-blue-700 text-center min-w-[45px] bg-blue-50 border border-blue-200 sticky right-0 z-20 shadow-lg">
                  Month
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Daily Totals Row - At Top */}
              <tr className="bg-orange-50 border-t-2 border-orange-200">
                <td className="px-4 py-2.5 sticky left-0 bg-orange-50 z-10 border-r border-gray-200 font-semibold text-orange-800 shadow-sm">
                  Daily Totals
                </td>
                <td className="px-4 py-2.5"></td>
                <td className="px-4 py-2.5"></td>
                <td className="px-4 py-2.5"></td>
                <td className="px-4 py-2.5 border-r border-gray-200"></td>

                {/* Dynamic Daily Totals */}
                {weekData.map((week) => (
                  <React.Fragment key={`totals-week-${week.weekNumber}`}>
                    {week.days.map((day) => {
                      const year = parseInt(selectedYear);
                      const month = parseInt(selectedMonth);
                      const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                      const dailyTotal = dailyTotals[dateKey] || 0;
                      
                      return (
                        <td key={`total-w${week.weekNumber}-${day}`} className="px-1.5 py-2.5 text-center border-r border-gray-100 bg-orange-50">
                          {dailyTotal > 0 ? (
                            <span className="text-orange-800 font-semibold text-xs">{dailyTotal}</span>
                          ) : (
                            <span className="text-orange-400 text-xs">-</span>
                          )}
                        </td>
                      );
                    })}
                    {/* Week Total */}
                    <td className="px-2 py-2.5 text-center bg-green-50 border border-green-200">
                      <span className="text-green-800 font-semibold text-xs">
                        {week.days.reduce((sum, day) => {
                          const year = parseInt(selectedYear);
                          const month = parseInt(selectedMonth);
                          const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                          return sum + (dailyTotals[dateKey] || 0);
                        }, 0)}
                      </span>
                    </td>
                  </React.Fragment>
                ))}
                {/* Monthly Total */}
                <td className="px-2 py-2.5 text-center bg-blue-50 border border-blue-200 sticky right-0 z-10 shadow-lg">
                  <span className="text-blue-800 font-bold text-xs">
                    {Object.values(dailyTotals).reduce((sum, total) => sum + total, 0)}
                  </span>
                </td>
              </tr>

              {filteredData.map(({ record, dailyProduction }, index) => {
                // Calculate weekly totals for this record
                const weekTotals = weekData.map((week) => 
                  week.days.reduce((sum, day) => {
                    const year = parseInt(selectedYear);
                    const month = parseInt(selectedMonth);
                    const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    return sum + (dailyProduction[dateKey] || 0);
                  }, 0)
                );
                const monthlyTotal = Object.values(dailyProduction).reduce((sum, daily) => sum + daily, 0);
                const stageData = record[activeStage];

                return (
                  <tr key={record.id} className="hover:bg-gray-50 group">
                    {/* Product Details - Sticky Column */}
                    <td 
                      className="px-4 py-2.5 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-200 shadow-sm cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                      onClick={() => setSelectedProductionRecord(record)}
                    >
                      <div className="min-w-[260px]">
                        <div className="font-medium text-gray-900 text-sm">{record.articleName}</div>
                        <div className="text-xs text-gray-600 mt-0.5">{record.brand} • {record.category}</div>
                        <div className="text-xs text-gray-500">{record.type} • {record.gender}</div>
                        <div className="text-xs text-[#0c9dcb] font-medium mt-1 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                          {record.productionId}
                        </div>
                      </div>
                    </td>

                    {/* PO Info */}
                    <td className="px-4 py-2.5">
                      <div className="min-w-[140px]">
                        <div className="font-medium text-gray-900 text-sm">{record.poNumber}</div>
                        <div className="text-xs text-gray-600 mt-0.5">{record.poItems} items</div>
                        <div className="text-xs text-blue-600 font-semibold mt-0.5">{calculateProductionCards(record.id)} cards</div>
                        <div className="text-xs text-gray-500">{getMonthName(selectedMonth)} {selectedYear}</div>
                      </div>
                    </td>

                    {/* Month Plan */}
                    <td className="px-4 py-2.5">
                      <div className="min-w-[100px]">
                        <div className="font-medium text-gray-900 text-sm">{record.monthPlan}</div>
                        <div className="text-xs text-gray-600 mt-0.5">units</div>
                        <div className="text-xs text-gray-500">Monthly Plan</div>
                      </div>
                    </td>

                    {/* MNFC (Manufacturing Company) */}
                    <td className="px-4 py-2.5">
                      <div className="min-w-[120px]">
                        <div className="font-medium text-gray-900 text-sm">{record.manufacturingCompany}</div>
                        <div className="text-xs text-gray-600 mt-0.5">Manufacturing</div>
                        <div className="text-xs text-gray-500">{record.country}</div>
                      </div>
                    </td>

                    {/* Stage Status */}
                    <td className="px-4 py-2.5 border-r border-gray-200">
                      <div className="min-w-[110px]">
                        <div className="mb-1">
                          {getStatusBadge(stageData.status, activeStage === 'upperREJ' ? 'upperREJ' : activeStage === 'rfd' ? 'rfd' : 'production')}
                        </div>
                        <div className="text-xs text-gray-600">
                          {stageData.quantity}/{stageData.planned} units
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-[#0c9dcb] h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, (stageData.quantity / stageData.planned) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Dynamic Daily Data */}
                    {weekData.map((week, weekIndex) => (
                      <React.Fragment key={`week-data-${week.weekNumber}`}>
                        {week.days.map((day) => {
                          const year = parseInt(selectedYear);
                          const month = parseInt(selectedMonth);
                          const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                          const quantity = dailyProduction[dateKey] || 0;
                          
                          return (
                            <td key={`w${week.weekNumber}-${day}`} className="px-1.5 py-2.5 text-center border-r border-gray-100">
                              <div className="min-w-[25px]">
                                {quantity > 0 ? (
                                  <span className="text-gray-900 font-medium text-xs">{quantity}</span>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        {/* Week Total */}
                        <td className="px-2 py-2.5 text-center bg-green-50 border border-green-200">
                          <span className="text-green-800 font-semibold text-xs">{weekTotals[weekIndex]}</span>
                        </td>
                      </React.Fragment>
                    ))}
                    
                    {/* Monthly Total */}
                    <td className="px-2 py-2.5 text-center bg-blue-50 border border-blue-200 sticky right-0 z-10 shadow-lg">
                      <span className="text-blue-800 font-bold text-xs">{monthlyTotal}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredData.length}</span> of <span className="font-medium">{filteredData.length}</span> results for {getCurrentStageName()}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled className="text-gray-400">
                Previous
              </Button>
              <div className="flex items-center gap-1">
                <Button size="sm" className="bg-[#0c9dcb] text-white hover:bg-[#0a87a5]">
                  1
                </Button>
              </div>
              <Button variant="outline" size="sm" disabled className="text-gray-400">
                Next
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Stage Update Dialog */}
      <Dialog open={stageUpdateDialogOpen} onOpenChange={setStageUpdateDialogOpen}>
        <DialogContent className="!max-w-[85vw] !w-[85vw] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
          <div className="sticky top-0 z-50 px-8 py-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#0c9dcb] to-[#26b4e0] rounded-xl flex items-center justify-center shadow-lg">
                  {getStageIcon(activeStage)}
                </div>
                <div>
                  <DialogTitle className="text-3xl font-semibold text-gray-900 mb-2">
                    Update {getCurrentStageName()} Production
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Update daily production quantities for {getCurrentStageName().toLowerCase()} stage
                  </DialogDescription>
                  <div className="flex items-center gap-4">
                    <span className="text-lg text-gray-600">Date: {new Date(selectedDate).toLocaleDateString('en-GB')}</span>
                    <Badge className="bg-[#0c9dcb] text-white text-sm px-3 py-1">
                      {getCurrentStageName()} Stage
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={handleBatchUpdate} className="bg-green-500 hover:bg-green-600">
                  <Save className="w-4 h-4 mr-2" />
                  Save Updates
                </Button>
                <Button 
                  onClick={() => setStageUpdateDialogOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="px-8 py-8 space-y-8">
              
              {/* Date and Search Controls */}


              {/* Quick Entry Instructions */}


              {/* Products List for Update */}
              <div className="space-y-6">
                <Tabs defaultValue="item-details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="item-details">Item Details</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="item-details" className="mt-6">
                    <div className="grid grid-cols-1 gap-4">
                  {filteredProductsForUpdate.map((record) => {
                    const stageData = record[activeStage];
                    const currentEntry = updateEntries[record.id] || { quantity: 0, remarks: '' };
                    
                    return (
                      <div key={record.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-all">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                          
                          {/* Product Info */}
                          <div className="lg:col-span-4">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                                <img 
                                  src="https://images.unsplash.com/photo-1648501570189-0359dab185e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzbmVha2VyJTIwc2hvZSUyMHByb2R1Y3R8ZW58MXx8fHwxNzU2NzM1OTMwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                                  alt={record.articleName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{record.articleName}</div>
                                <div className="text-sm text-gray-500">{record.brand} • {record.category}</div>
                                <div className="text-xs text-[#0c9dcb] font-mono">{record.productionId}</div>
                              </div>
                            </div>
                          </div>

                          {/* Current Stage Status */}
                          <div className="lg:col-span-3">
                            <div className="text-sm text-gray-600 mb-1">Current {getCurrentStageName()} Status</div>
                            <div className="space-y-1">
                              {getStatusBadge(stageData.status, activeStage === 'upperREJ' ? 'upperREJ' : activeStage === 'rfd' ? 'rfd' : 'production')}
                              <div className="text-xs text-gray-500">
                                Completed: {stageData.quantity} / {stageData.planned}
                              </div>
                              <div className="text-xs text-gray-500">
                                Remaining: {stageData.planned - stageData.quantity}
                              </div>
                            </div>
                          </div>

                          {/* Quantity Input */}
                          <div className="lg:col-span-2">
                            <Label className="text-sm font-medium text-gray-600">Today's Quantity</Label>
                            <Input
                              type="number"
                              min="0"
                              max={stageData.planned - stageData.quantity}
                              value={currentEntry.quantity}
                              onChange={(e) => setUpdateEntries(prev => ({
                                ...prev,
                                [record.id]: { ...currentEntry, quantity: parseInt(e.target.value) || 0 }
                              }))}
                              className="mt-1 h-10"
                              placeholder="0"
                            />
                          </div>

                          {/* Actions Column - Item Cutting Button & Advance To Dropdown */}
                          <div className="lg:col-span-3 space-y-3">
                            <div>
                              <Label className="text-sm font-medium text-gray-600 mb-2 block">Item Cutting</Label>
                              <Button
                                variant="outline"
                                className={`w-full h-10 border-2 transition-all font-semibold shadow-sm ${
                                  activeStage === 'cutting' ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 hover:from-purple-100 hover:to-purple-200 hover:border-purple-400' :
                                  activeStage === 'printing' ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 hover:border-blue-400' :
                                  activeStage === 'upper' ? 'border-indigo-300 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 hover:from-indigo-100 hover:to-indigo-200 hover:border-indigo-400' :
                                  activeStage === 'upperREJ' ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 hover:from-orange-100 hover:to-orange-200 hover:border-orange-400' :
                                  activeStage === 'assembly' ? 'border-green-300 bg-gradient-to-r from-green-50 to-green-100 text-green-700 hover:from-green-100 hover:to-green-200 hover:border-green-400' :
                                  activeStage === 'packing' ? 'border-teal-300 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 hover:from-teal-100 hover:to-teal-200 hover:border-teal-400' :
                                  activeStage === 'rfd' ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 hover:from-emerald-100 hover:to-emerald-200 hover:border-emerald-400' :
                                  'border-purple-300 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 hover:from-purple-100 hover:to-purple-200 hover:border-purple-400'
                                }`}
                                onClick={() => {
                                  setSelectedProductForCutting({
                                    id: record.id,
                                    productName: record.articleName,
                                    productionId: record.productionId,
                                    targetQuantity: stageData.planned,
                                    brand: record.brand,
                                    category: record.category,
                                  });
                                  setItemCuttingDialogOpen(true);
                                }}
                              >
                                {activeStage === 'cutting' && <Scissors className="w-4 h-4 mr-2" />}
                                {activeStage === 'printing' && <Printer className="w-4 h-4 mr-2" />}
                                {activeStage === 'upper' && <ShirtIcon className="w-4 h-4 mr-2" />}
                                {activeStage === 'upperREJ' && <AlertTriangle className="w-4 h-4 mr-2" />}
                                {activeStage === 'assembly' && <Wrench className="w-4 h-4 mr-2" />}
                                {activeStage === 'packing' && <Package className="w-4 h-4 mr-2" />}
                                {activeStage === 'rfd' && <FileCheck className="w-4 h-4 mr-2" />}
                                {activeStage === 'cutting' ? 'Item Cutting' :
                                 activeStage === 'printing' ? 'Item Printing' :
                                 activeStage === 'upper' ? 'Item Upper' :
                                 activeStage === 'upperREJ' ? 'Item Upper Reg' :
                                 activeStage === 'assembly' ? 'Item Assembly' :
                                 activeStage === 'packing' ? 'Item Packing' :
                                 activeStage === 'rfd' ? 'Item RFD' :
                                 'Item Cutting'}
                              </Button>
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-gray-600 mb-2 block">Advance To</Label>
                              <Select
                                value={currentEntry.advanceTo || ''}
                                onValueChange={(value) => setUpdateEntries(prev => ({
                                  ...prev,
                                  [record.id]: { ...currentEntry, advanceTo: value }
                                }))}
                              >
                                <SelectTrigger className="h-10 border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 focus:border-emerald-500 transition-all">
                                  <SelectValue placeholder="Select next stage..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cutting">
                                    <div className="flex items-center gap-2">
                                      <Scissors className="w-4 h-4 text-purple-600" />
                                      <span>Cutting</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="printing">
                                    <div className="flex items-center gap-2">
                                      <Printer className="w-4 h-4 text-blue-600" />
                                      <span>Printing</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="stitching">
                                    <div className="flex items-center gap-2">
                                      <ShirtIcon className="w-4 h-4 text-indigo-600" />
                                      <span>Stitching</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="lasting">
                                    <div className="flex items-center gap-2">
                                      <Wrench className="w-4 h-4 text-orange-600" />
                                      <span>Lasting</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="packing">
                                    <div className="flex items-center gap-2">
                                      <Package className="w-4 h-4 text-green-600" />
                                      <span>Packing</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="quality">
                                    <div className="flex items-center gap-2">
                                      <FileCheck className="w-4 h-4 text-emerald-600" />
                                      <span>Quality Check</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                        </div>

                        {/* Advancement Confirmation */}
                        {currentEntry.advanceTo && (
                          <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border-2 border-emerald-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                                  <Workflow className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-emerald-900">
                                    Ready to advance to: <span className="capitalize">{currentEntry.advanceTo}</span>
                                  </div>
                                  <div className="text-xs text-emerald-700">
                                    Product will be moved to the next production stage
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 shadow-sm"
                                onClick={() => {
                                  toast.success(`${record.articleName} will advance to ${currentEntry.advanceTo}!`);
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-1.5" />
                                Confirm
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Progress Indicator */}
                        {currentEntry.quantity > 0 && (
                          <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-green-700 font-medium">
                                Will update: +{currentEntry.quantity} units for {getCurrentStageName()}
                              </span>
                              <span className="text-green-600 font-semibold">
                                New total: {stageData.quantity + currentEntry.quantity} / {stageData.planned}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                      {/* No Products Found */}
                      {filteredProductsForUpdate.length === 0 && (
                        <div className="text-center py-12">
                          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                          <div className="text-lg font-medium text-gray-500 mb-2">No Products Found</div>
                          <div className="text-sm text-gray-400">
                            Try adjusting your search terms to find products to update
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="mt-6">
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product Code
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity Updated on that day
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {/* Mock history data - this would come from actual tracking in production */}
                          {[
                            { productName: 'Premium Running Shoe - Blue', productCode: 'PROD-001', quantity: 150, date: '2025-10-11' },
                            { productName: 'Classic Leather Boot - Brown', productCode: 'PROD-002', quantity: 200, date: '2025-10-11' },
                            { productName: 'Sports Sneaker - White', productCode: 'PROD-003', quantity: 175, date: '2025-10-10' },
                            { productName: 'Casual Loafer - Black', productCode: 'PROD-004', quantity: 125, date: '2025-10-10' },
                            { productName: 'High-Top Basketball - Red', productCode: 'PROD-005', quantity: 100, date: '2025-10-09' },
                            { productName: 'Trail Running Shoe - Green', productCode: 'PROD-006', quantity: 180, date: '2025-10-09' },
                            { productName: 'Formal Oxford - Navy', productCode: 'PROD-007', quantity: 90, date: '2025-10-08' },
                            { productName: 'Canvas Sneaker - Gray', productCode: 'PROD-008', quantity: 160, date: '2025-10-08' },
                          ].map((historyItem, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{historyItem.productName}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{historyItem.productCode}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{historyItem.quantity} units</div>
                                  <div className="text-xs text-gray-500">{new Date(historyItem.date).toLocaleDateString('en-GB')}</div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Summary Card */}
              {Object.values(updateEntries).some(entry => entry.quantity > 0) && (
                <div className="bg-white border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold text-gray-900 mb-2">Update Summary</div>
                      <div className="text-sm text-gray-600">
                        {Object.values(updateEntries).filter(entry => entry.quantity > 0).length} product(s) will be updated for {getCurrentStageName()}
                      </div>
                      <div className="text-sm text-gray-600">
                        Total quantity: {Object.values(updateEntries).reduce((sum, entry) => sum + entry.quantity, 0)} units
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        onClick={() => setUpdateEntries({})}
                        variant="outline"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                      <Button onClick={handleBatchUpdate} className="bg-green-500 hover:bg-green-600">
                        <Save className="w-4 h-4 mr-2" />
                        Confirm Updates
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </DialogContent>  
      </Dialog>

      {/* Production Detail Dialog */}
      <Dialog open={!!selectedProductionRecord} onOpenChange={() => setSelectedProductionRecord(null)}>
        <DialogContent className="!max-w-[90vw] !w-[90vw] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
          {selectedProductionRecord && (
            <>
              {/* Sticky Header Section */}
              <div className="sticky top-0 z-50 px-8 py-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#0c9dcb] to-[#26b4e0] rounded-xl flex items-center justify-center shadow-lg">
                      <Package className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-3xl font-semibold text-gray-900 mb-2">
                        Production Details
                      </DialogTitle>
                      <DialogDescription className="sr-only">
                        View comprehensive production details and progress information
                      </DialogDescription>
                      <div className="flex items-center gap-4">
                        <span className="text-lg text-gray-600">{selectedProductionRecord.productionId}</span>
                        <Badge className="bg-[#0c9dcb] text-white text-sm px-3 py-1">
                          {selectedProductionRecord.articleName}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button className="bg-blue-500 hover:bg-blue-600">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Production
                    </Button>
                    <Button variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Comments
                    </Button>
                    <Button 
                      onClick={() => setSelectedProductionRecord(null)}
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center"
                    >
                      <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Scrollable Main Content */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="px-8 py-8 space-y-10">
                  
                  {/* Production Progress Overview */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">Production Progress Overview</h3>
                    </div>
                    
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Overall Progress */}
                        <div>
                          <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-600">Overall Production Progress</span>
                              <span className="text-sm font-bold text-gray-900">
                                {Math.round((stages.filter(stage => 
                                  selectedProductionRecord[stage.key].status === 'Completed'
                                ).length / 7) * 100)}%
                              </span>
                            </div>
                            <Progress value={Math.round((stages.filter(stage => 
                              selectedProductionRecord[stage.key].status === 'Completed'
                            ).length / 7) * 100)} className="h-3" />
                          </div>

                          {/* Monthly Plan Analysis */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <div className="text-2xl font-bold text-blue-600">{selectedProductionRecord.monthPlan}</div>
                              <div className="text-sm text-blue-700">Monthly Plan</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                              <div className="text-2xl font-bold text-green-600">{selectedProductionRecord.poItems}</div>
                              <div className="text-sm text-green-700">Total PO Items</div>
                            </div>
                          </div>
                        </div>

                        {/* Stage Progress Grid */}
                        <div className="grid grid-cols-7 gap-2">
                          {stages.map((stage, index) => {
                            const stageData = selectedProductionRecord[stage.key];
                            const progress = (stageData.quantity / stageData.planned) * 100;
                            const isCompleted = stageData.status === 'Completed';
                            const inProgress = stageData.status === 'In Progress';
                            
                            return (
                              <div 
                                key={stage.key}
                                className={`text-center p-3 rounded-lg border-2 transition-all ${
                                  isCompleted 
                                    ? 'bg-green-50 border-green-200' 
                                    : inProgress 
                                      ? 'bg-blue-50 border-blue-200' 
                                      : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center text-xs ${
                                  isCompleted 
                                    ? 'bg-green-500 text-white' 
                                    : inProgress 
                                      ? 'bg-blue-500 text-white' 
                                      : 'bg-gray-300 text-gray-600'
                                }`}>
                                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : getStageIcon(stage.key)}
                                </div>
                                <div className="text-xs font-medium text-gray-700 mb-1">{stage.name}</div>
                                <div className="text-xs text-gray-500">{Math.round(progress)}%</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Information and Manufacturing Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Product & R&D Information */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">Product Information</h3>
                      </div>

                      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                        {/* Product Image Preview */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-4">
                            <div className="w-24 h-24 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                              <img 
                                src="https://images.unsplash.com/photo-1648501570189-0359dab185e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzbmVha2VyJTIwc2hvZSUyMHByb2R1Y3R8ZW58MXx8fHwxNzU2NzM1OTMwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                                alt={selectedProductionRecord.articleName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="text-base font-medium text-gray-900">{selectedProductionRecord.articleName}</div>
                              <div className="text-sm text-gray-500 mt-1">Production Sample</div>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                                <span className="text-xs text-gray-400">{selectedProductionRecord.color}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="text-sm font-medium text-gray-600">Production ID</div>
                            <div className="mt-1 text-base font-mono font-bold text-gray-900">{selectedProductionRecord.productionId}</div>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium text-gray-600">Brand & Category</div>
                            <div className="mt-1">
                              <div className="text-base font-medium text-gray-900">{selectedProductionRecord.brand}</div>
                              <div className="text-sm text-gray-500">{selectedProductionRecord.category} • {selectedProductionRecord.type}</div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium text-gray-600">Specifications</div>
                            <div className="mt-1">
                              <div className="text-base font-medium text-gray-900">{selectedProductionRecord.gender} • {selectedProductionRecord.size}</div>
                              <div className="text-sm text-gray-500">{selectedProductionRecord.color}</div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium text-gray-600">Manufacturing Location</div>
                            <div className="mt-1 text-base text-gray-900">{selectedProductionRecord.country}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Manufacturing & PO Details */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                          <Building className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">Manufacturing Details</h3>
                      </div>

                      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 space-y-6">
                        <div>
                          <div className="text-sm font-medium text-gray-600">Manufacturing Company</div>
                          <div className="mt-1">
                            <div className="text-lg font-semibold text-gray-900">{selectedProductionRecord.manufacturingCompany}</div>
                            <div className="text-sm text-gray-500">Primary Manufacturing Partner</div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <div className="text-sm font-medium text-gray-600">Purchase Order Information</div>
                          <div className="mt-1">
                            <div className="text-base font-medium text-gray-900">{selectedProductionRecord.poNumber}</div>
                            <div className="text-sm text-gray-500">{selectedProductionRecord.poItems} units ordered</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-yellow-50 rounded-lg p-4">
                            <div className="text-lg font-bold text-yellow-600">{selectedProductionRecord.monthPlan}</div>
                            <div className="text-xs text-yellow-700">Monthly Target</div>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-4">
                            <div className="text-lg font-bold text-purple-600">{selectedProductionRecord.unitPstId}</div>
                            <div className="text-xs text-purple-700">Unit PST ID</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stage-by-Stage Production Progress */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                        <Workflow className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">Stage-by-Stage Production Progress</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {stages.map((stage) => {
                        const stageData = selectedProductionRecord[stage.key];
                        const progress = (stageData.quantity / stageData.planned) * 100;
                        const remaining = stageData.planned - stageData.quantity;
                        
                        return (
                          <div key={stage.key} className="bg-white border-2 border-gray-200 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  stageData.status === 'Completed' ? 'bg-green-100 text-green-600' :
                                  stageData.status === 'In Progress' ? 'bg-blue-100 text-blue-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {getStageIcon(stage.key)}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">{stage.name}</div>
                                  <div className="text-xs text-gray-500">{stageData.status}</div>
                                </div>
                              </div>
                              {getStatusBadge(stageData.status, stage.key === 'upperREJ' ? 'upperREJ' : stage.key === 'rfd' ? 'rfd' : 'production')}
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-medium">{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                              
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Completed</span>
                                <span className="font-medium text-green-600">{stageData.quantity}</span>
                              </div>
                              
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Planned</span>
                                <span className="font-medium">{stageData.planned}</span>
                              </div>
                              
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Remaining</span>
                                <span className="font-medium text-orange-600">{remaining}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Materials & Components Analysis */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">Materials & Components Analysis</h3>
                    </div>

                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Material Usage */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Raw Materials Used</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">Upper Material</div>
                                <div className="text-sm text-gray-500">{selectedProductionRecord.type} - Premium Grade</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">2.5 sq ft</div>
                                <div className="text-xs text-gray-500">per unit</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">Sole Material</div>
                                <div className="text-sm text-gray-500">Rubber Compound</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">180g</div>
                                <div className="text-xs text-gray-500">per unit</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">Thread & Adhesives</div>
                                <div className="text-sm text-gray-500">Industrial Grade</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">15g</div>
                                <div className="text-xs text-gray-500">per unit</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Component Analysis */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Component Breakdown</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">Eyelets & Hardware</div>
                                <div className="text-sm text-gray-500">Metal Components</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-blue-600">₹12</div>
                                <div className="text-xs text-gray-500">per unit</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">Insole & Padding</div>
                                <div className="text-sm text-gray-500">Comfort Layer</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-green-600">₹25</div>
                                <div className="text-xs text-gray-500">per unit</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">Laces & Accessories</div>
                                <div className="text-sm text-gray-500">Finishing Components</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-purple-600">₹8</div>
                                <div className="text-xs text-gray-500">per unit</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-6" />

                      {/* Cost Analysis */}
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <div className="text-lg font-bold text-gray-900">₹145</div>
                          <div className="text-sm text-gray-600">Material Cost/Unit</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <div className="text-lg font-bold text-blue-600">₹65</div>
                          <div className="text-sm text-gray-600">Labor Cost/Unit</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 text-center">
                          <div className="text-lg font-bold text-orange-600">₹35</div>
                          <div className="text-sm text-gray-600">Overhead/Unit</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <div className="text-lg font-bold text-green-600">₹245</div>
                          <div className="text-sm text-gray-600">Total Cost/Unit</div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Item Cutting Dialog */}
      <ItemCuttingDialog
        open={itemCuttingDialogOpen}
        onOpenChange={setItemCuttingDialogOpen}
        productData={selectedProductForCutting}
        stage={activeStage}
      />
    </div>
  );
}