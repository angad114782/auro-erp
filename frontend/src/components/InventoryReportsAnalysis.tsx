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
import api from "../lib/api";
import Pagination from "./Pagination";

interface DateRange {
  from: Date;
  to: Date;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

export function InventoryReportsAnalysis() {
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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const isEmpty = !loading && transactions.length === 0;

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10,
  });

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [debouncedReportType, setDebouncedReportType] = useState(reportType);

  // Debounce search term and report type
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedReportType(reportType);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [reportType]);

  // Helper functions
  const getItemDetails = (itemRef: any) => {
    if (!itemRef) return null;
    if (typeof itemRef === "object" && itemRef.itemName) {
      return itemRef;
    }
    return null;
  };

  const getItemName = (itemRef: any) => {
    const item = getItemDetails(itemRef);
    return item?.itemName || "Unknown Item";
  };

  const getVendor = (vendorRef: any) => {
    if (!vendorRef) return null;
    if (typeof vendorRef === "object" && vendorRef.vendorName) {
      return vendorRef;
    }
    return null;
  };

  const getVendorName = (vendorRef: any) => {
    const vendor = getVendor(vendorRef);
    return vendor?.vendorName || "Unknown Vendor";
  };

  // Fetch all inventory items for statistics
  const fetchInventoryItems = async () => {
    try {
      const res = await api.get("/inventory/items");
      if (res.data && Array.isArray(res.data.items)) {
        setInventoryItems(res.data.items);
      }
    } catch (error) {
      console.error("Error fetching inventory items:", error);
    }
  };

  // Fetch transactions with pagination
  const fetchTransactions = async (
    page = 1,
    pageSize = pagination.pageSize
  ) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pageSize,
      };

      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (dateRange.from) params.from = dateRange.from.toISOString();
      if (dateRange.to) params.to = dateRange.to.toISOString();
      if (debouncedReportType !== "daily")
        params.reportType = debouncedReportType;

      const res = await api.get("/inventory/history-all", { params });

      if (res.data?.success) {
        setTransactions(res.data.data.transactions);
        setPagination(res.data.data.pagination);
        setStats(res.data.data.stats);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when dependencies change
  useEffect(() => {
    fetchTransactions(pagination.currentPage, pagination.pageSize);
  }, [debouncedSearchTerm, dateRange, debouncedReportType]);

  // Fetch inventory items on mount
  useEffect(() => {
    fetchInventoryItems();
  }, []);

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
    fetchTransactions(page, pagination.pageSize);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, pageSize: size, currentPage: 1 }));
    fetchTransactions(1, size);
  };

  // Calculate statistics
  const statistics = {
    totalTransactions: pagination.totalItems,
    totalStockIn: stats?.totalStockIn || 0,
    totalStockOut: stats?.totalStockOut || 0,
    totalOrderValue: stats?.totalOrderValue || 0,
    // currentTotalStock,
    // lowStockItems,
    stockInCount: stats?.stockInCount || 0,
    stockOutCount: stats?.stockOutCount || 0,
  };

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

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!tempDateRange.from || (tempDateRange.from && tempDateRange.to)) {
      setTempDateRange({ from: date, to: date });
    } else if (tempDateRange.from && !tempDateRange.to) {
      const from = tempDateRange.from;
      const to = date;
      setTempDateRange({
        from: from <= to ? from : to,
        to: from <= to ? to : from,
      });
    }
  };

  const applyDateRange = () => {
    setDateRange(tempDateRange);
    setIsDatePickerOpen(false);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
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

  const displayTransactions = transactions;

  const handleExport = () => {
    if (transactions.length === 0) return;

    exportInventoryReportToPDF(
      transactions,
      statistics,
      dateRange,
      reportType,
      searchTerm
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
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
                disabled={transactions.length === 0}
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
                      {formatDate(dateRange.from.toISOString())} -{" "}
                      {formatDate(dateRange.to.toISOString())}
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
                            ? `${formatDate(
                                tempDateRange.from.toISOString()
                              )} - ${formatDate(
                                tempDateRange.to.toISOString()
                              )}`
                            : tempDateRange.from
                            ? `From: ${formatDate(
                                tempDateRange.from.toISOString()
                              )}`
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

        {/* Mobile Floating Export Button */}
        <div className="md:hidden fixed bottom-6 right-6 z-10">
          <Button
            size="lg"
            className="rounded-full shadow-lg h-14 w-14"
            onClick={handleExport}
            disabled={transactions.length === 0}
          >
            <Download className="w-6 h-6" />
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600 mb-1 truncate">
                    Total Transactions
                  </p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                    {statistics.totalTransactions.toLocaleString()}
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

          <Card className="border-l-4 border-l-cyan-500">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600 mb-1 truncate">
                    Current Stock
                  </p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                    {
                      // statistics.currentTotalStock.toLocaleString()
                      0
                    }
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
                    {0}
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
        {displayTransactions.length === 0 && !loading ? (
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
        ) : loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
                <p className="text-gray-500">Loading transactions...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          displayTransactions.map((transaction: any) => {
            const item = transaction.itemId || {};
            const vendorObj = transaction.vendorId || null;
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
                        className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
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
                            {transaction.billNumber || "No bill"}
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
                              {item?.code || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Category
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {item?.category || "N/A"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Brand</span>
                            <span className="text-sm font-medium">
                              {item?.brand || "N/A"}
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
                                {vendorObj.contactPerson || "N/A"}
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
                              {item?.quantityUnit || "units"}
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
                              {item?.quantityUnit || "units"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Date</p>
                            <p className="text-sm">
                              {formatDate(
                                transaction.transactionDate ||
                                  transaction.createdAt ||
                                  transaction.updatedAt
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Bill Date
                            </p>
                            <p className="text-sm">
                              {transaction.billDate
                                ? formatDate(transaction.billDate)
                                : "N/A"}
                            </p>
                          </div>
                        </div>

                        {transaction.reason && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Reason</p>
                            <p className="text-sm">{transaction.reason}</p>
                          </div>
                        )}

                        {transaction.remarks && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Remarks
                            </p>
                            <p className="text-sm">{transaction.remarks}</p>
                          </div>
                        )}
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
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 lg:px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                      <p className="text-gray-500">Loading transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : displayTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 lg:px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <BarChart4 className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-gray-500">No transactions found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Try adjusting your filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayTransactions.map((transaction: any) => {
                  const item = transaction.itemId || {};
                  const vendorObj = transaction.vendorId || null;
                  const key =
                    transaction._id || transaction.id || Math.random();

                  return (
                    <tr
                      key={key}
                      className="hover:bg-gray-50 transition-colors"
                    >
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
                              {item?.itemName || "Unknown Item"}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {item?.code || "No code"}
                            </div>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {item?.category || "No category"}
                              </Badge>
                              {item?.brand && (
                                <Badge variant="outline" className="text-xs">
                                  {item.brand}
                                </Badge>
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
                              {vendorObj.contactPerson || "No contact"}
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
                            {item?.quantityUnit || "units"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Prev:{" "}
                            {(transaction.previousStock || 0).toLocaleString()}
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
                            {item?.quantityUnit || "units"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Bill: {transaction.billNumber || "No bill"}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            transaction.transactionType === "Stock In"
                              ? "default"
                              : "destructive"
                          }
                          className="text-sm"
                        >
                          {transaction.transactionType === "Stock In" ? (
                            <TrendingUp className="w-4 h-4 mr-1 inline" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1 inline" />
                          )}
                          {transaction.transactionType}
                        </Badge>
                      </td>

                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(
                              transaction.transactionDate ||
                                transaction.createdAt ||
                                transaction.updatedAt
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {transaction.billDate &&
                              `Bill: ${formatDate(transaction.billDate)}`}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Updated Table Footer with Pagination */}
        <div className="px-4 lg:px-6 py-4 border-t border-gray-200 bg-gray-50">
          {!loading &&
            pagination.totalPages > 0 &&
            pagination.totalItems > 0 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[10, 20, 30, 50]}
              />
            )}

          {/* Show loading or empty state */}
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading transactions...</p>
            </div>
          )}

          {/* {!loading && pagination.totalItems === 0 && (
            <div className="text-center py-4">
              <BarChart4 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No transactions found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your filters or date range
              </p>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center">
      <BarChart4 className="w-12 h-12 text-gray-300 mb-3" />
      <p className="text-gray-500">No transactions found</p>
      <p className="text-sm text-gray-400">
        Try adjusting your filters or date range
      </p>
    </div>
  );
}
