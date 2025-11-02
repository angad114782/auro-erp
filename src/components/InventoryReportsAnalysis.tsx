import React, { useState, useMemo } from 'react';
import { 
  BarChart4, Calendar, Download, FileText, Filter, RefreshCw, Search, TrendingUp,
  Package, IndianRupee, Building, User, ShoppingCart, FileDown, ArrowUpDown,
  Eye, MoreHorizontal, CalendarRange, PieChart, Activity, Warehouse, TrendingDown,
  AlertCircle, Clock, CheckCircle, Target, FileSpreadsheet, FileX
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Progress } from './ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { useERPStore } from '../lib/data-store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line, Pie } from 'recharts';

interface DateRange {
  from: Date;
  to: Date;
}

export function InventoryReportsAnalysis() {
  const { inventoryItems, inventoryTransactions, vendors, users } = useERPStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [reportType, setReportType] = useState<string>('daily');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange>(dateRange);

  // Helper functions
  const getVendorName = (vendorId: string) => vendors.find(v => v.id === vendorId)?.vendorName || 'Unknown';
  const getItemName = (itemId: string) => inventoryItems.find(i => i.id === itemId)?.itemName || 'Unknown';
  const getItemDetails = (itemId: string) => inventoryItems.find(i => i.id === itemId);

  // Filter transactions based on date range and report type
  const filteredTransactions = useMemo(() => {
    let transactions = inventoryTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.transactionDate);
      const matchesDateRange = transactionDate >= dateRange.from && transactionDate <= dateRange.to;
      
      if (!matchesDateRange) return false;
      
      const item = getItemDetails(transaction.itemId);
      const matchesSearch = !searchTerm || 
        getItemName(transaction.itemId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getVendorName(transaction.vendorId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.billNumber && transaction.billNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });

    // Apply report type filtering
    if (reportType !== 'daily') {
      const now = new Date();
      let filterDate = new Date();
      
      switch (reportType) {
        case 'weekly':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'yearly':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }
      
      transactions = transactions.filter(transaction => 
        new Date(transaction.transactionDate) >= filterDate
      );
    }

    return transactions;
  }, [inventoryTransactions, dateRange, searchTerm, reportType]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalTransactions = filteredTransactions.length;
    const stockInTransactions = filteredTransactions.filter(t => t.transactionType === 'Stock In');
    const stockOutTransactions = filteredTransactions.filter(t => t.transactionType === 'Stock Out');
    
    const totalStockIn = stockInTransactions.reduce((sum, t) => sum + t.quantity, 0);
    const totalStockOut = stockOutTransactions.reduce((sum, t) => sum + t.quantity, 0);
    const totalOrderValue = stockInTransactions.reduce((sum, t) => sum + (t.orderValue || 0), 0);
    
    const currentTotalStock = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = inventoryItems.filter(item => item.quantity < 50).length;
    
    return {
      totalTransactions,
      totalStockIn,
      totalStockOut,
      totalOrderValue,
      currentTotalStock,
      lowStockItems,
      stockInCount: stockInTransactions.length,
      stockOutCount: stockOutTransactions.length
    };
  }, [filteredTransactions, inventoryItems]);

  // Chart data
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(month => ({
      month,
      stockIn: Math.floor(Math.random() * 1000) + 200,
      stockOut: Math.floor(Math.random() * 800) + 100,
      value: Math.floor(Math.random() * 50000) + 10000
    }));
    return data;
  }, []);

  const categoryData = useMemo(() => {
    const categories = ['Raw Materials', 'Components & Parts', 'Finished Footwear', 'Accessories & Hardware'];
    return categories.map(category => {
      const items = inventoryItems.filter(item => item.category === category);
      const totalStock = items.reduce((sum, item) => sum + item.quantity, 0);
      const transactions = filteredTransactions.filter(t => {
        const item = getItemDetails(t.itemId);
        return item?.category === category;
      });
      const totalValue = transactions.reduce((sum, t) => sum + (t.orderValue || 0), 0);
      
      return {
        name: category,
        stock: totalStock,
        value: totalValue,
        items: items.length
      };
    });
  }, [inventoryItems, filteredTransactions]);

  const handleExportData = (format: string) => {
    // Create dummy data when no transactions exist
    const dummyTransactions = [
      {
        id: 'dummy-1',
        transactionDate: new Date('2024-12-18T09:30:00'),
        itemId: 'dummy-item-1',
        vendorId: 'dummy-vendor-1',
        transactionType: 'Stock In',
        quantity: 500,
        previousStock: 1200,
        newStock: 1700,
        billNumber: 'INV-2024-001',
        reason: 'New Purchase Order',
        remarks: 'Quality checked and approved',
        orderValue: 45000,
        item: {
          itemName: 'Premium Leather Sole',
          code: 'PLS-001',
          category: 'Raw Materials',
          brand: 'LeatherCraft',
          color: 'Brown',
          iconColor: 'amber',
          quantityUnit: 'Pieces'
        },
        vendor: {
          vendorName: 'Delhi Leather Industries',
          contactPerson: 'Rajesh Kumar',
          email: 'rajesh@delhileather.com'
        }
      }
      // ... other dummy transactions would be here
    ];

    // Get current data to export
    const dataToExport = filteredTransactions.length > 0 ? filteredTransactions : dummyTransactions;
    
    if (format === 'excel' || format === 'csv') {
      // Convert data to CSV format
      const headers = ['Item Name', 'Category', 'Brand', 'Color', 'Vendor', 'Current Stock', 'Quantity Updated', 'Stock Movement', 'Bill Number', 'Order Value', 'Date', 'Time'];
      
      const csvData = dataToExport.map(transaction => {
        const item = transaction.item || getItemDetails(transaction.itemId);
        const vendor = transaction.vendor || vendors.find(v => v.id === transaction.vendorId);
        
        return [
          item?.itemName || '',
          item?.category || '',
          item?.brand || '',
          item?.color || '',
          vendor?.vendorName || '',
          `${transaction.newStock} ${item?.quantityUnit || ''}`,
          `${transaction.transactionType === 'Stock In' ? '+' : '-'}${transaction.quantity} ${item?.quantityUnit || ''}`,
          transaction.transactionType,
          transaction.billNumber || '',
          transaction.orderValue ? `₹${transaction.orderValue.toLocaleString()}` : 'N/A',
          new Date(transaction.transactionDate).toLocaleDateString(),
          new Date(transaction.transactionDate).toLocaleTimeString()
        ];
      });
      
      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log(`Successfully exported ${dataToExport.length} records as ${format.toUpperCase()}`);
    } else if (format === 'pdf') {
      // For PDF, we'll create a simple text-based export
      const reportContent = `
INVENTORY REPORTS & ANALYSIS
Generated on: ${new Date().toLocaleString()}
Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}
Date Range: ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}
Total Transactions: ${dataToExport.length}

${dataToExport.map((transaction, index) => {
  const item = transaction.item || getItemDetails(transaction.itemId);
  const vendor = transaction.vendor || vendors.find(v => v.id === transaction.vendorId);
  
  return `
Transaction ${index + 1}:
- Item: ${item?.itemName} (${item?.code})
- Category: ${item?.category}
- Brand: ${item?.brand} | Color: ${item?.color}
- Vendor: ${vendor?.vendorName}
- Current Stock: ${transaction.newStock} ${item?.quantityUnit}
- Quantity Updated: ${transaction.transactionType === 'Stock In' ? '+' : '-'}${transaction.quantity} ${item?.quantityUnit}
- Stock Movement: ${transaction.transactionType}
- Bill Number: ${transaction.billNumber || 'N/A'}
- Order Value: ${transaction.orderValue ? `₹${transaction.orderValue.toLocaleString()}` : 'N/A'}
- Date: ${new Date(transaction.transactionDate).toLocaleString()}
`;
}).join('\n')}
      `.trim();
      
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log(`Successfully exported ${dataToExport.length} records as PDF (text format)`);
    }
  };

  const handleGenerateReport = () => {
    // Generate detailed report
    console.log('Generating detailed report');
  };

  const COLORS = ['#0c9dcb', '#26b4e0', '#4cc9f0', '#20c997'];

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    if (!tempDateRange.from || (tempDateRange.from && tempDateRange.to)) {
      // Start new range
      setTempDateRange({ from: date, to: date });
    } else if (tempDateRange.from && !tempDateRange.to) {
      // Complete the range
      const from = tempDateRange.from;
      const to = date;
      
      if (from <= to) {
        setTempDateRange({ from, to });
      } else {
        setTempDateRange({ from: to, to: from });
      }
    }
  };

  const applyDateRange = () => {
    setDateRange(tempDateRange);
    setIsDatePickerOpen(false);
  };

  const cancelDateSelection = () => {
    setTempDateRange(dateRange);
    setIsDatePickerOpen(false);
  };

  const resetDateRange = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const newRange = { from: firstDayOfMonth, to: today };
    setTempDateRange(newRange);
  };

  // Update temp date range when date picker opens
  const handleDatePickerOpen = (open: boolean) => {
    if (open) {
      setTempDateRange(dateRange);
    }
    setIsDatePickerOpen(open);
  };

  return (
    <div className="w-full space-y-8 p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart4 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Reports & Analysis</h1>
              <p className="text-gray-600 mt-1">Comprehensive inventory tracking and reporting system</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleGenerateReport}>
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportData('excel')}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportData('pdf')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export to PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportData('csv')}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Export to CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
          </div>
        </div>

        {/* Filters Section */}
        <Card className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search items, vendors, bills..."
                className="pl-10"
              />
            </div>

            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Report</SelectItem>
                <SelectItem value="weekly">Weekly Report</SelectItem>
                <SelectItem value="monthly">Monthly Report</SelectItem>
                <SelectItem value="yearly">Yearly Report</SelectItem>
              </SelectContent>
            </Select>

            <Popover open={isDatePickerOpen} onOpenChange={handleDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 justify-start"
                >
                  <CalendarRange className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Select Date Range</h4>
                      <p className="text-xs text-gray-500">
                        {tempDateRange.from && tempDateRange.to 
                          ? `${tempDateRange.from.toLocaleDateString()} - ${tempDateRange.to.toLocaleDateString()}`
                          : tempDateRange.from 
                          ? `From: ${tempDateRange.from.toLocaleDateString()} (click end date)`
                          : 'Click start date'
                        }
                      </p>
                    </div>
                    
                    {/* Quick Select Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          const today = new Date();
                          setTempDateRange({ from: today, to: today });
                        }}
                        className="text-xs"
                      >
                        Today
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          const today = new Date();
                          const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                          setTempDateRange({ from: lastWeek, to: today });
                        }}
                        className="text-xs"
                      >
                        Last 7 days
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          const today = new Date();
                          const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                          setTempDateRange({ from: lastMonth, to: today });
                        }}
                        className="text-xs"
                      >
                        Last 30 days
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={resetDateRange}
                        className="text-xs"
                      >
                        This month
                      </Button>
                    </div>
                    
                    <CalendarComponent
                      mode="single"
                      selected={tempDateRange.from}
                      onSelect={handleDateSelect}
                      className="rounded-md border"
                      numberOfMonths={1}
                    />
                    <div className="flex items-center gap-2 pt-2">
                      <Button 
                        size="sm" 
                        onClick={applyDateRange}
                        disabled={!tempDateRange.from || !tempDateRange.to}
                        className="flex-1"
                      >
                        Apply
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={cancelDateSelection}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalTransactions}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Stock In</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalStockIn.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Stock Out</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalStockOut.toLocaleString()}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">₹{statistics.totalOrderValue.toLocaleString()}</p>
                </div>
                <IndianRupee className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-cyan-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Current Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.currentTotalStock.toLocaleString()}</p>
                </div>
                <Warehouse className="w-8 h-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Low Stock Items</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.lowStockItems}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>



        {/* Main Content - Transaction History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor Information
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Movement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Value (₹)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  // Create dummy data when no transactions exist
                  const dummyTransactions = [
                    {
                      id: 'dummy-1',
                      transactionDate: new Date('2024-12-18T09:30:00'),
                      itemId: 'dummy-item-1',
                      vendorId: 'dummy-vendor-1',
                      transactionType: 'Stock In',
                      quantity: 500,
                      previousStock: 1200,
                      newStock: 1700,
                      billNumber: 'INV-2024-001',
                      reason: 'New Purchase Order',
                      remarks: 'Quality checked and approved',
                      orderValue: 45000,
                      item: {
                        itemName: 'Premium Leather Sole',
                        code: 'PLS-001',
                        category: 'Raw Materials',
                        brand: 'LeatherCraft',
                        color: 'Brown',
                        iconColor: 'amber',
                        quantityUnit: 'Pieces'
                      },
                      vendor: {
                        vendorName: 'Delhi Leather Industries',
                        contactPerson: 'Rajesh Kumar',
                        email: 'rajesh@delhileather.com'
                      }
                    },
                    {
                      id: 'dummy-2',
                      transactionDate: new Date('2024-12-18T11:15:00'),
                      itemId: 'dummy-item-2',
                      vendorId: 'dummy-vendor-2',
                      transactionType: 'Stock Out',
                      quantity: 150,
                      previousStock: 800,
                      newStock: 650,
                      billNumber: 'OUT-2024-012',
                      reason: 'Production Allocation',
                      remarks: 'Allocated to Production Line A',
                      orderValue: null,
                      item: {
                        itemName: 'Metal Eyelets - 6mm',
                        code: 'ME-6MM-001',
                        category: 'Components & Parts',
                        brand: 'MetalWorks',
                        color: 'Silver',
                        iconColor: 'blue',
                        quantityUnit: 'Pieces'
                      },
                      vendor: {
                        vendorName: 'Mumbai Metal Works',
                        contactPerson: 'Suresh Patel',
                        email: 'suresh@mumbaimetals.com'
                      }
                    },
                    {
                      id: 'dummy-3',
                      transactionDate: new Date('2024-12-18T14:20:00'),
                      itemId: 'dummy-item-3',
                      vendorId: 'dummy-vendor-3',
                      transactionType: 'Stock In',
                      quantity: 200,
                      previousStock: 350,
                      newStock: 550,
                      billNumber: 'INV-2024-089',
                      reason: 'Replenishment Stock',
                      remarks: 'Emergency order processed',
                      orderValue: 28500,
                      item: {
                        itemName: 'Canvas Upper Material',
                        code: 'CUM-001',
                        category: 'Raw Materials',
                        brand: 'TextilePlus',
                        color: 'Navy Blue',
                        iconColor: 'green',
                        quantityUnit: 'Meters'
                      },
                      vendor: {
                        vendorName: 'Gujarat Textile Mills',
                        contactPerson: 'Priya Shah',
                        email: 'priya@gujarattextiles.com'
                      }
                    },
                    {
                      id: 'dummy-4',
                      transactionDate: new Date('2024-12-17T16:45:00'),
                      itemId: 'dummy-item-4',
                      vendorId: 'dummy-vendor-4',
                      transactionType: 'Stock In',
                      quantity: 1000,
                      previousStock: 2500,
                      newStock: 3500,
                      billNumber: 'INV-2024-076',
                      reason: 'Bulk Purchase',
                      remarks: 'Volume discount applied',
                      orderValue: 85000,
                      item: {
                        itemName: 'Rubber Sole - Sports',
                        code: 'RSS-001',
                        category: 'Components & Parts',
                        brand: 'RubberTech',
                        color: 'White',
                        iconColor: 'purple',
                        quantityUnit: 'Pairs'
                      },
                      vendor: {
                        vendorName: 'Chennai Rubber Co.',
                        contactPerson: 'Arjun Nair',
                        email: 'arjun@chennairubber.com'
                      }
                    },
                    {
                      id: 'dummy-5',
                      transactionDate: new Date('2024-12-17T10:30:00'),
                      itemId: 'dummy-item-5',
                      vendorId: 'dummy-vendor-5',
                      transactionType: 'Stock Out',
                      quantity: 75,
                      previousStock: 420,
                      newStock: 345,
                      billNumber: 'OUT-2024-087',
                      reason: 'Quality Control Testing',
                      remarks: 'Sample taken for lab testing',
                      orderValue: null,
                      item: {
                        itemName: 'Shoe Laces - Cotton',
                        code: 'SLC-001',
                        category: 'Accessories & Hardware',
                        brand: 'LaceMaster',
                        color: 'Black',
                        iconColor: 'orange',
                        quantityUnit: 'Pairs'
                      },
                      vendor: {
                        vendorName: 'Karnataka Accessories',
                        contactPerson: 'Deepika Reddy',
                        email: 'deepika@karnatakaacc.com'
                      }
                    },
                    {
                      id: 'dummy-6',
                      transactionDate: new Date('2024-12-16T13:15:00'),
                      itemId: 'dummy-item-6',
                      vendorId: 'dummy-vendor-6',
                      transactionType: 'Stock In',
                      quantity: 300,
                      previousStock: 180,
                      newStock: 480,
                      billNumber: 'INV-2024-064',
                      reason: 'New Stock Arrival',
                      remarks: 'Premium quality batch',
                      orderValue: 52000,
                      item: {
                        itemName: 'Leather Polish & Care Kit',
                        code: 'LPCK-001',
                        category: 'Finished Footwear',
                        brand: 'CareMax',
                        color: 'Clear',
                        iconColor: 'red',
                        quantityUnit: 'Kits'
                      },
                      vendor: {
                        vendorName: 'Pune Care Products',
                        contactPerson: 'Vikash Singh',
                        email: 'vikash@punecare.com'
                      }
                    },
                    {
                      id: 'dummy-7',
                      transactionDate: new Date('2024-12-16T08:45:00'),
                      itemId: 'dummy-item-7',
                      vendorId: 'dummy-vendor-7',
                      transactionType: 'Stock Out',
                      quantity: 250,
                      previousStock: 900,
                      newStock: 650,
                      billNumber: 'OUT-2024-093',
                      reason: 'Production Line B',
                      remarks: 'Rush order processing',
                      orderValue: null,
                      item: {
                        itemName: 'Adhesive Glue - Industrial',
                        code: 'AGI-001',
                        category: 'Raw Materials',
                        brand: 'StickFast',
                        color: 'Transparent',
                        iconColor: 'indigo',
                        quantityUnit: 'Liters'
                      },
                      vendor: {
                        vendorName: 'Hyderabad Chemicals',
                        contactPerson: 'Ravi Teja',
                        email: 'ravi@hyderabadchem.com'
                      }
                    },
                    {
                      id: 'dummy-8',
                      transactionDate: new Date('2024-12-15T15:30:00'),
                      itemId: 'dummy-item-8',
                      vendorId: 'dummy-vendor-8',
                      transactionType: 'Stock In',
                      quantity: 800,
                      previousStock: 1500,
                      newStock: 2300,
                      billNumber: 'INV-2024-048',
                      reason: 'Weekly Replenishment',
                      remarks: 'Standard order cycle',
                      orderValue: 96000,
                      item: {
                        itemName: 'Foam Padding - Comfort',
                        code: 'FPC-001',
                        category: 'Components & Parts',
                        brand: 'ComfortFoam',
                        color: 'White',
                        iconColor: 'pink',
                        quantityUnit: 'Sheets'
                      },
                      vendor: {
                        vendorName: 'Kolkata Foam Industries',
                        contactPerson: 'Ananya Banerjee',
                        email: 'ananya@kolkatafoam.com'
                      }
                    },
                    {
                      id: 'dummy-9',
                      transactionDate: new Date('2024-12-15T12:00:00'),
                      itemId: 'dummy-item-9',
                      vendorId: 'dummy-vendor-9',
                      transactionType: 'Stock In',
                      quantity: 450,
                      previousStock: 320,
                      newStock: 770,
                      billNumber: 'INV-2024-035',
                      reason: 'Special Order',
                      remarks: 'Custom specification met',
                      orderValue: 67500,
                      item: {
                        itemName: 'Thread - Polyester Strong',
                        code: 'TPS-001',
                        category: 'Raw Materials',
                        brand: 'ThreadMax',
                        color: 'Multi-Color',
                        iconColor: 'cyan',
                        quantityUnit: 'Spools'
                      },
                      vendor: {
                        vendorName: 'Ahmedabad Thread Co.',
                        contactPerson: 'Kiran Modi',
                        email: 'kiran@ahmedabadthread.com'
                      }
                    },
                    {
                      id: 'dummy-10',
                      transactionDate: new Date('2024-12-14T14:15:00'),
                      itemId: 'dummy-item-10',
                      vendorId: 'dummy-vendor-10',
                      transactionType: 'Stock Out',
                      quantity: 120,
                      previousStock: 560,
                      newStock: 440,
                      billNumber: 'OUT-2024-102',
                      reason: 'Customer Return Processing',
                      remarks: 'Defective items segregated',
                      orderValue: null,
                      item: {
                        itemName: 'Buckles & Straps Kit',
                        code: 'BSK-001',
                        category: 'Accessories & Hardware',
                        brand: 'BuckleWorks',
                        color: 'Brass',
                        iconColor: 'gray',
                        quantityUnit: 'Sets'
                      },
                      vendor: {
                        vendorName: 'Rajasthan Hardware',
                        contactPerson: 'Mahesh Agarwal',
                        email: 'mahesh@rajasthanhw.com'
                      }
                    }
                  ];

                  const displayTransactions = filteredTransactions.length > 0 ? filteredTransactions : dummyTransactions;
                  
                  return displayTransactions.map((transaction) => {
                    const item = transaction.item || getItemDetails(transaction.itemId);
                    const vendor = transaction.vendor || vendors.find(v => v.id === transaction.vendorId);
                    
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                item?.iconColor === 'amber' ? 'bg-amber-100 text-amber-600' :
                                item?.iconColor === 'blue' ? 'bg-blue-100 text-blue-600' :
                                item?.iconColor === 'green' ? 'bg-green-100 text-green-600' :
                                item?.iconColor === 'purple' ? 'bg-purple-100 text-purple-600' :
                                item?.iconColor === 'orange' ? 'bg-orange-100 text-orange-600' :
                                item?.iconColor === 'red' ? 'bg-red-100 text-red-600' :
                                item?.iconColor === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
                                item?.iconColor === 'pink' ? 'bg-pink-100 text-pink-600' :
                                item?.iconColor === 'cyan' ? 'bg-cyan-100 text-cyan-600' :
                                item?.iconColor === 'gray' ? 'bg-gray-100 text-gray-600' :
                                'bg-blue-100 text-blue-600'
                              }`}>
                                <Package className="w-5 h-5" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item?.itemName}</div>
                              <div className="text-sm text-gray-500">{item?.code}</div>
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {item?.category}
                                </span>
                                {item?.brand && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {item.brand}
                                  </span>
                                )}
                                {item?.color && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {item.color}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          {vendor ? (
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900">{vendor.vendorName}</div>
                              <div className="text-sm text-gray-500">{vendor.contactPerson}</div>
                              <div className="text-sm text-gray-500">{vendor.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.newStock.toLocaleString()} {item?.quantityUnit}
                            </div>
                            <div className="text-sm text-gray-500">
                              on {new Date(transaction.transactionDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(transaction.transactionDate).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className={`text-sm font-medium ${
                              transaction.transactionType === 'Stock In' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.transactionType === 'Stock In' ? '+' : '-'}
                              {transaction.quantity.toLocaleString()} {item?.quantityUnit}
                            </div>
                            <div className="text-xs text-gray-500">
                              Previous: {transaction.previousStock.toLocaleString()}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            transaction.transactionType === 'Stock In' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.transactionType === 'Stock In' ? (
                              <TrendingUp className="w-4 h-4 mr-1" />
                            ) : (
                              <TrendingDown className="w-4 h-4 mr-1" />
                            )}
                            {transaction.transactionType}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {transaction.billNumber && (
                              <div className="text-sm font-medium text-blue-600 font-mono">
                                {transaction.billNumber}
                              </div>
                            )}
                            <div className="text-sm text-gray-500">
                              {transaction.reason}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            {transaction.orderValue ? `₹${transaction.orderValue.toLocaleString()}` : 'N/A'}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:bg-gray-50">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                Showing {filteredTransactions.length > 0 ? filteredTransactions.length : 10} of {filteredTransactions.length > 0 ? inventoryTransactions.length : 10} transactions
                {reportType !== 'daily' && ` (${reportType} report)`}
                {searchTerm && ` (filtered by search)`}
                {filteredTransactions.length === 0 && ` (showing sample data)`}
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
    </div>
  );
}