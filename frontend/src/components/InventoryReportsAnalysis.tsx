import {
  Activity,
  AlertCircle,
  BarChart4,
  CalendarRange,
  Download,
  Eye,
  FileDown,
  FileSpreadsheet,
  FileText,
  IndianRupee,
  MoreHorizontal,
  Package,
  Search,
  TrendingDown,
  TrendingUp,
  Warehouse,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useInventory } from "../hooks/useInventory";
import { useVendorStore } from "../hooks/useVendor";
import { Button } from "./ui/button";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { exportInventoryReportToPDF } from "../hooks/pdf-export-ra";

interface DateRange {
  from: Date;
  to: Date;
}

export function InventoryReportsAnalysis() {
  const {
    items: inventoryItems,
    transactions: inventoryTransactions,
    loadItems,
    loadTransactions,
    loading: loadingInventory,
  } = useInventory();

  const { vendors, loadVendors, loading: loadingVendors } = useVendorStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [reportType, setReportType] = useState<string>("daily");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange>(dateRange);
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(
    new Set()
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    loadItems();
    loadTransactions();
    loadVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper to normalize id or populated object for vendor/item references
  const normalizeRefId = (ref: any) => {
    if (!ref) return "";
    if (typeof ref === "string") return ref;
    if (typeof ref === "object" && (ref._id || ref.$oid)) {
      return ref._id ? String(ref._id) : String(ref.$oid);
    }
    return "";
  };

  const getVendor = (vendorRef: any) => {
    const id = normalizeRefId(vendorRef);
    return vendors.find((v) => String(v._id) === id) || null;
  };

  const getVendorName = (vendorRefOrId: any) =>
    getVendor(vendorRefOrId)?.vendorName || "Unknown";

  const getItem = (itemRef: any) => {
    const id = normalizeRefId(itemRef);
    return inventoryItems.find((i) => String(i._id) === id) || null;
  };

  const getItemName = (itemRefOrId: any) =>
    getItem(itemRefOrId)?.itemName || "Unknown";

  const getItemDetails = (itemRefOrId: any) => getItem(itemRefOrId);

  // Filter transactions based on date range and report type
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(inventoryTransactions)) return [];

    let transactions = inventoryTransactions.filter((transaction: any) => {
      const dateStr =
        transaction.transactionDate ||
        transaction.createdAt ||
        transaction.updatedAt;
      const transactionDate = dateStr ? new Date(dateStr) : null;
      const matchesDateRange =
        transactionDate &&
        transactionDate >= dateRange.from &&
        transactionDate <= dateRange.to;

      if (!matchesDateRange) return false;

      const item = getItemDetails(transaction.itemId);
      const vendorName = getVendorName(
        transaction.vendorId || transaction.vendor
      );

      const matchesSearch =
        !searchTerm ||
        getItemName(transaction.itemId)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (vendorName || "unknown")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (transaction.billNumber &&
          transaction.billNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });

    // Apply report type filtering
    if (reportType && reportType !== "daily") {
      const now = new Date();
      let filterDate = new Date();

      switch (reportType) {
        case "weekly":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "monthly":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "yearly":
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          filterDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
      }

      transactions = transactions.filter((transaction: any) => {
        const dateStr =
          transaction.transactionDate ||
          transaction.createdAt ||
          transaction.updatedAt;
        const transactionDate = dateStr ? new Date(dateStr) : null;
        return transactionDate && transactionDate >= filterDate;
      });
    }

    return transactions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    inventoryTransactions,
    dateRange,
    searchTerm,
    reportType,
    inventoryItems,
    vendors,
  ]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalTransactions = filteredTransactions.length;

    const stockInTransactions = filteredTransactions.filter(
      (t: any) => t.transactionType === "Stock In"
    );
    const stockOutTransactions = filteredTransactions.filter(
      (t: any) => t.transactionType === "Stock Out"
    );

    const totalStockIn = stockInTransactions.reduce(
      (sum: number, t: any) => sum + (Number(t.quantity) || 0),
      0
    );
    const totalStockOut = stockOutTransactions.reduce(
      (sum: number, t: any) => sum + (Number(t.quantity) || 0),
      0
    );
    const totalOrderValue = stockInTransactions.reduce(
      (sum: number, t: any) => sum + (Number(t.orderValue) || 0),
      0
    );

    const currentTotalStock = (
      Array.isArray(inventoryItems) ? inventoryItems : []
    ).reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
    const lowStockItems = (
      Array.isArray(inventoryItems) ? inventoryItems : []
    ).filter((item: any) => Number(item.quantity) < 50).length;

    return {
      totalTransactions,
      totalStockIn,
      totalStockOut,
      totalOrderValue,
      currentTotalStock,
      lowStockItems,
      stockInCount: stockInTransactions.length,
      stockOutCount: stockOutTransactions.length,
    };
  }, [filteredTransactions, inventoryItems]);

  const toggleTransactionExpansion = (transactionId: string) => {
    setExpandedTransactions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  const handleExportData = (format: string) => {
    // Export logic remains the same
    console.log(`Exporting as ${format}`);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!tempDateRange.from || (tempDateRange.from && tempDateRange.to)) {
      setTempDateRange({ from: date, to: date });
    } else if (tempDateRange.from && !tempDateRange.to) {
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

  const handleDatePickerOpen = (open: boolean) => {
    if (open) {
      setTempDateRange(dateRange);
    }
    setIsDatePickerOpen(open);
  };

  // Sample transactions for empty state
  const dummyTransactions = [
    {
      id: "dummy-1",
      transactionDate: new Date("2024-12-18T09:30:00"),
      itemId: "dummy-item-1",
      vendorId: "dummy-vendor-1",
      transactionType: "Stock In",
      quantity: 500,
      previousStock: 1200,
      newStock: 1700,
      billNumber: "INV-2024-001",
      reason: "New Purchase Order",
      remarks: "Quality checked and approved",
      orderValue: 45000,
      item: {
        itemName: "Premium Leather Sole",
        code: "PLS-001",
        category: "Raw Materials",
        brand: "LeatherCraft",
        color: "Brown",
        iconColor: "amber",
        quantityUnit: "Pieces",
      },
      vendor: {
        vendorName: "Delhi Leather Industries",
        contactPerson: "Rajesh Kumar",
        email: "rajesh@delhileather.com",
      },
    },
  ];

  const displayTransactions =
    filteredTransactions.length > 0
      ? filteredTransactions.slice(0, 10) // Limit for mobile
      : !loadingInventory &&
        !loadingVendors &&
        inventoryTransactions.length === 0 &&
        searchTerm === ""
      ? dummyTransactions
      : [];

  const handleExport = () => {
    console.log("Exporting with data...");
    exportInventoryReportToPDF(
      filteredTransactions.length > 0
        ? filteredTransactions
        : displayTransactions,
      statistics,
      dateRange,
      reportType,
      searchTerm,
      getItemDetails, // Pass the helper functions
      getVendor
    );
  };
  return (
    <div className="w-full space-y-4 md:space-y-8 p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <BarChart4 className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                Inventory Reports & Analysis
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1 truncate">
                Comprehensive inventory tracking and reporting system
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex"
                onClick={handleExport}
              >
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="md:hidden">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {showMobileFilters ? "Hide Filters" : "Show Filters"}
            {showMobileFilters ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>
        </div>

        {/* Filters Section */}
        {(showMobileFilters || window.innerWidth >= 768) && (
          <Card className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search items, vendors, bills..."
                  className="pl-10 text-sm"
                />
              </div>

              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Report</SelectItem>
                  <SelectItem value="weekly">Weekly Report</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="yearly">Yearly Report</SelectItem>
                </SelectContent>
              </Select>
              {/* Mobile Floating Export Button */}
              <div className="md:hidden fixed bottom-6 right-6 z-10">
                <Button
                  size="lg"
                  className="rounded-full shadow-lg h-14 w-14"
                  onClick={() =>
                    exportInventoryReportToPDF(
                      filteredTransactions.length > 0
                        ? filteredTransactions
                        : displayTransactions,
                      statistics,
                      dateRange,
                      reportType,
                      searchTerm
                    )
                  }
                >
                  <Download className="w-6 h-6" />
                </Button>
              </div>
              <Popover
                open={isDatePickerOpen}
                onOpenChange={handleDatePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 justify-start text-sm"
                  >
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 truncate">
                      {dateRange.from.toLocaleDateString()} -{" "}
                      {dateRange.to.toLocaleDateString()}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[90vw] md:w-auto p-0"
                  align="start"
                >
                  <div className="p-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">
                          Select Date Range
                        </h4>
                        <p className="text-xs text-gray-500">
                          {tempDateRange.from && tempDateRange.to
                            ? `${tempDateRange.from.toLocaleDateString()} - ${tempDateRange.to.toLocaleDateString()}`
                            : tempDateRange.from
                            ? `From: ${tempDateRange.from.toLocaleDateString()}`
                            : "Click start date"}
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
                            const lastWeek = new Date(
                              today.getTime() - 7 * 24 * 60 * 60 * 1000
                            );
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
                            const lastMonth = new Date(
                              today.getTime() - 30 * 24 * 60 * 60 * 1000
                            );
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
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600 mb-1 truncate">
                    Total Transactions
                  </p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                    {statistics.totalTransactions}
                  </p>
                </div>
                <Activity className="w-6 h-6 md:w-8 md:h-8 text-blue-500 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600 mb-1 truncate">
                    Stock In
                  </p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                    {statistics.totalStockIn.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-green-500 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600 mb-1 truncate">
                    Stock Out
                  </p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                    {statistics.totalStockOut.toLocaleString()}
                  </p>
                </div>
                <TrendingDown className="w-6 h-6 md:w-8 md:h-8 text-orange-500 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600 mb-1 truncate">
                    Order Value
                  </p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                    ₹{statistics.totalOrderValue.toLocaleString()}
                  </p>
                </div>
                <IndianRupee className="w-6 h-6 md:w-8 md:h-8 text-purple-500 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-cyan-500">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600 mb-1 truncate">
                    Current Stock
                  </p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                    {statistics.currentTotalStock.toLocaleString()}
                  </p>
                </div>
                <Warehouse className="w-6 h-6 md:w-8 md:h-8 text-cyan-500 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600 mb-1 truncate">
                    Low Stock Items
                  </p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                    {statistics.lowStockItems}
                  </p>
                </div>
                <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-red-500 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4">
        {displayTransactions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <BarChart4 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No transactions found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your filters
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          displayTransactions.map((transaction: any) => {
            const item =
              transaction.item || getItemDetails(transaction.itemId) || {};
            const vendorObj =
              transaction.vendor || getVendor(transaction.vendorId) || null;
            const key = transaction._id || transaction.id || Math.random();
            const isExpanded = expandedTransactions.has(key);

            return (
              <Card key={key} className="overflow-hidden">
                <CardHeader
                  className="pb-3 cursor-pointer"
                  onClick={() => toggleTransactionExpansion(key)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          item?.iconColor === "amber"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold truncate">
                          {item?.itemName || "Unknown Item"}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              transaction.transactionType === "Stock In"
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {transaction.transactionType}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {transaction.billNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Item Details */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500">
                          Item Details
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Code</span>
                            <span className="text-sm font-medium">
                              {item?.code}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Category
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {item?.category}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Brand</span>
                            <span className="text-sm font-medium">
                              {item?.brand}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Vendor Details */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500">
                          Vendor
                        </p>
                        {vendorObj ? (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Name
                              </span>
                              <span className="text-sm font-medium truncate ml-2 text-right">
                                {vendorObj.vendorName}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Contact
                              </span>
                              <span className="text-sm">
                                {vendorObj.contactPerson}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">N/A</p>
                        )}
                      </div>

                      <Separator />

                      {/* Transaction Details */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Current Stock
                            </p>
                            <p className="text-sm font-medium">
                              {(transaction.newStock || 0).toLocaleString()}{" "}
                              {item?.quantityUnit}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Quantity Updated
                            </p>
                            <p
                              className={`text-sm font-medium ${
                                transaction.transactionType === "Stock In"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.transactionType === "Stock In"
                                ? "+"
                                : "-"}
                              {(transaction.quantity || 0).toLocaleString()}{" "}
                              {item?.quantityUnit}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Date</p>
                            <p className="text-sm">
                              {transaction.transactionDate
                                ? new Date(
                                    transaction.transactionDate
                                  ).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Order Value
                            </p>
                            <p className="text-sm font-semibold text-green-600">
                              {transaction.orderValue
                                ? `₹${Number(
                                    transaction.orderValue
                                  ).toLocaleString()}`
                                : "N/A"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 mb-1">Reason</p>
                          <p className="text-sm">{transaction.reason}</p>
                        </div>
                      </div>

                      <Separator />

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            console.log("View details", transaction)
                          }
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              Edit Transaction
                            </DropdownMenuItem>
                            <DropdownMenuItem>Print Receipt</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor Information
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity Updated
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Movement
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Value (₹)
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayTransactions.map((transaction: any) => {
                const item =
                  transaction.item || getItemDetails(transaction.itemId) || {};
                const vendorObj =
                  transaction.vendor || getVendor(transaction.vendorId) || null;
                const key = transaction._id || transaction.id || Math.random();

                return (
                  <tr key={key} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10">
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                              item?.iconColor === "amber"
                                ? "bg-amber-100 text-amber-600"
                                : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            <Package className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="ml-3 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {item?.itemName}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {item?.code}
                          </div>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {item?.category}
                            </span>
                            {item?.brand && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {item.brand}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      {vendorObj ? (
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {vendorObj.vendorName}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {vendorObj.contactPerson}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>

                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {(transaction.newStock || 0).toLocaleString()}{" "}
                          {item?.quantityUnit}
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaction.transactionDate
                            ? new Date(
                                transaction.transactionDate
                              ).toLocaleDateString()
                            : ""}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div
                          className={`text-sm font-medium ${
                            transaction.transactionType === "Stock In"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.transactionType === "Stock In"
                            ? "+"
                            : "-"}
                          {(transaction.quantity || 0).toLocaleString()}{" "}
                          {item?.quantityUnit}
                        </div>
                        <div className="text-xs text-gray-500">
                          Prev:{" "}
                          {(transaction.previousStock || 0).toLocaleString()}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          transaction.transactionType === "Stock In"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.transactionType === "Stock In" ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {transaction.transactionType}
                      </span>
                    </td>

                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        {transaction.orderValue
                          ? `₹${Number(
                              transaction.orderValue
                            ).toLocaleString()}`
                          : "N/A"}
                      </div>
                    </td>

                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 lg:px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-gray-500 text-center sm:text-left">
              Showing {displayTransactions.length} of{" "}
              {displayTransactions.length} transactions
              {reportType !== "daily" && ` (${reportType} report)`}
              {searchTerm && ` (filtered by search)`}
              {filteredTransactions.length === 0 && ` (showing sample data)`}
            </p>

            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-gray-600 hover:bg-gray-100"
                disabled
              >
                Previous
              </Button>
              <div className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-medium">
                1
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-gray-600 hover:bg-gray-100"
                disabled
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
