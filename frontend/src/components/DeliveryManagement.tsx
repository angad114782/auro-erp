import React, { useState, useMemo } from "react";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  Calendar,
  IndianRupee,
  MapPin,
  Phone,
  User,
  Edit,
  Edit2,
  Eye,
  Search,
  Filter,
  Download,
  Plus,
  TrendingUp,
  AlertCircle,
  FileText,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./ui/dialog";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Separator } from "./ui/separator";
import { useERPStore } from "../lib/data-store";
import { toast } from "sonner@2.0.3";
import { format } from "date-fns";

interface DeliveryManagementProps {
  currentSubModule: string;
}

export function DeliveryManagement({
  currentSubModule,
}: DeliveryManagementProps) {
  const {
    deliveryItems,
    updateDeliveryItem,
    addDeliveryItem,
    deleteDeliveryItem,
  } = useERPStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"aging" | "poDate" | "deliveryDate">(
    "aging"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [isDateFromOpen, setIsDateFromOpen] = useState(false);
  const [isDateToOpen, setIsDateToOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form state for editing
  const [editedData, setEditedData] = useState<any>({});

  // Form state for adding
  const [formData, setFormData] = useState<any>({
    projectCode: "",
    productName: "",
    brandName: "",
    categoryName: "",
    poNumber: "",
    poReceivedDate: "",
    quantity: 0,
    deliveryStatus: "Pending",
    deliveryDate: "",
    expectedDeliveryDate: "",
    totalAmount: 0,
    advance: 0,
    advancePercentage: 0,
    trackingNumber: "",
    courierService: "",
    deliveryAddress: "",
    customerName: "",
    customerContact: "",
    remarks: "",
  });

  // Filter deliveries based on current sub-module
  const filteredDeliveries = useMemo(() => {
    let filtered = deliveryItems;

    // Filter by sub-module
    if (currentSubModule === "delivery-pending") {
      filtered = filtered.filter((item) => item.deliveryStatus === "Pending");
    } else if (currentSubModule === "parcel-delivered") {
      filtered = filtered.filter(
        (item) => item.deliveryStatus === "Parcel Delivered"
      );
    } else if (currentSubModule === "delivered") {
      filtered = filtered.filter((item) => item.deliveryStatus === "Delivered");
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter((item) => {
        let dateField = "";
        if (sortBy === "poDate") {
          dateField = item.poReceivedDate;
        } else if (sortBy === "deliveryDate") {
          dateField = item.deliveryDate || item.expectedDeliveryDate;
        } else {
          dateField = item.poReceivedDate;
        }

        if (!dateField) return false;

        const itemDate = new Date(dateField);
        itemDate.setHours(0, 0, 0, 0);

        if (dateFrom && dateTo) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          return itemDate >= fromDate && itemDate <= toDate;
        } else if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          return itemDate >= fromDate;
        } else if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          return itemDate <= toDate;
        }
        return true;
      });
    }

    // Sort
    return filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === "aging") {
        aVal = a.aging;
        bVal = b.aging;
      } else if (sortBy === "poDate") {
        aVal = new Date(a.poReceivedDate).getTime();
        bVal = new Date(b.poReceivedDate).getTime();
      } else {
        aVal = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
        bVal = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [
    deliveryItems,
    currentSubModule,
    searchTerm,
    sortBy,
    sortOrder,
    dateFrom,
    dateTo,
  ]);

  // Paginate deliveries
  const paginatedDeliveries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDeliveries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDeliveries, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);

  // Calculate statistics
  const stats = useMemo(() => {
    const pending = deliveryItems.filter(
      (item) => item.deliveryStatus === "Pending"
    );
    const parcelDelivered = deliveryItems.filter(
      (item) => item.deliveryStatus === "Parcel Delivered"
    );
    const delivered = deliveryItems.filter(
      (item) => item.deliveryStatus === "Delivered"
    );

    const totalRevenue = deliveryItems.reduce(
      (sum, item) => sum + (item.totalAmount || 0),
      0
    );
    const advanceCollected = deliveryItems.reduce(
      (sum, item) => sum + (item.advance || 0),
      0
    );
    const balancePending = deliveryItems.reduce(
      (sum, item) => sum + (item.balance || 0),
      0
    );
    const avgAging =
      deliveryItems.length > 0
        ? Math.round(
            deliveryItems.reduce((sum, item) => sum + item.aging, 0) /
              deliveryItems.length
          )
        : 0;

    return {
      pending: pending.length,
      parcelDelivered: parcelDelivered.length,
      delivered: delivered.length,
      total: deliveryItems.length,
      totalRevenue,
      advanceCollected,
      balancePending,
      avgAging,
    };
  }, [deliveryItems]);

  const handleRowClick = (delivery: any) => {
    setSelectedDelivery(delivery);
    setEditedData(delivery);
    setIsEditing(false);
    setIsDetailsDialogOpen(true);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedData(selectedDelivery);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (!selectedDelivery) return;

    // Calculate aging if delivery date is set
    const aging =
      editedData.deliveryDate && editedData.poReceivedDate
        ? Math.floor(
            (new Date(editedData.deliveryDate).getTime() -
              new Date(editedData.poReceivedDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : editedData.aging;

    // Calculate balance
    const balance = (editedData.totalAmount || 0) - (editedData.advance || 0);

    updateDeliveryItem(selectedDelivery.id, {
      ...editedData,
      aging,
      balance,
    });

    toast.success("Delivery updated successfully");
    setIsEditing(false);
    setSelectedDelivery({ ...editedData, aging, balance });
  };

  const handleAddDelivery = () => {
    // Calculate advance percentage if not provided
    const advancePercentage =
      formData.totalAmount > 0 && formData.advance > 0
        ? Math.round((formData.advance / formData.totalAmount) * 100)
        : formData.advancePercentage;

    // Calculate balance
    const balance = (formData.totalAmount || 0) - (formData.advance || 0);

    addDeliveryItem({
      ...formData,
      projectId: Date.now().toString(),
      advancePercentage,
      balance,
    });

    toast.success("Delivery added successfully");
    setIsAddDialogOpen(false);
    setFormData({
      projectCode: "",
      productName: "",
      brandName: "",
      categoryName: "",
      poNumber: "",
      poReceivedDate: "",
      quantity: 0,
      deliveryStatus: "Pending",
      deliveryDate: "",
      expectedDeliveryDate: "",
      totalAmount: 0,
      advance: 0,
      advancePercentage: 0,
      trackingNumber: "",
      courierService: "",
      deliveryAddress: "",
      customerName: "",
      customerContact: "",
      remarks: "",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            Pending
          </Badge>
        );
      case "Parcel Delivered":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Parcel Delivered
          </Badge>
        );
      case "Delivered":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Delivered
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAgingColor = (aging: number) => {
    if (aging < 30) return "text-green-600";
    if (aging < 60) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">Delivery Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage product deliveries • {stats.total} Total Deliveries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            className="bg-[#0c9dcb] hover:bg-[#0a8bb5] text-white"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Delivery
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-linear-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Delivery Pending</p>
                <h3 className="text-2xl text-orange-900 mt-1">
                  {stats.pending}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-linear-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Parcel Delivered</p>
                <h3 className="text-2xl text-blue-900 mt-1">
                  {stats.parcelDelivered}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-linear-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Delivered</p>
                <h3 className="text-2xl text-green-900 mt-1">
                  {stats.delivered}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-linear-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Avg. Aging</p>
                <h3 className="text-2xl text-purple-900 mt-1">
                  {stats.avgAging} days
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by project code, PO number, product name, brand, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-2 bg-white">
                <Calendar className="w-4 h-4 text-gray-500" />
                <Popover open={isDateFromOpen} onOpenChange={setIsDateFromOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-36 justify-start text-left font-normal border-0 p-0 h-auto hover:bg-transparent"
                    >
                      {dateFrom ? (
                        format(dateFrom, "dd MMM yyyy")
                      ) : (
                        <span className="text-gray-500">From Date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={(date) => {
                        setDateFrom(date);
                        setIsDateFromOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-gray-400">—</span>
                <Popover open={isDateToOpen} onOpenChange={setIsDateToOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-36 justify-start text-left font-normal border-0 p-0 h-auto hover:bg-transparent"
                    >
                      {dateTo ? (
                        format(dateTo, "dd MMM yyyy")
                      ) : (
                        <span className="text-gray-500">To Date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={(date) => {
                        setDateTo(date);
                        setIsDateToOpen(false);
                      }}
                      initialFocus
                      disabled={(date) => (dateFrom ? date < dateFrom : false)}
                    />
                  </PopoverContent>
                </Popover>
                {(dateFrom || dateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateFrom(undefined);
                      setDateTo(undefined);
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <Select
                value={sortBy}
                onValueChange={(value: any) => setSortBy(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aging">Sort by Aging</SelectItem>
                  <SelectItem value="poDate">Sort by PO Date</SelectItem>
                  <SelectItem value="deliveryDate">Sort by Delivery</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries Table - Green Seal Style */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-linear-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#0c9dcb] rounded-lg flex items-center justify-center text-white">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {currentSubModule === "delivery-pending" &&
                    "Delivery Pending"}
                  {currentSubModule === "parcel-delivered" &&
                    "Parcel Delivered"}
                  {currentSubModule === "delivered" && "Delivered"}
                  {!currentSubModule && "All Deliveries"}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  View and manage delivery records • {filteredDeliveries.length}{" "}
                  Total Records
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Project Code
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Product Details
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    PO Number
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    PO Received
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Delivery Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Aging
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Quantity
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No deliveries found
                      </h3>
                      <p className="text-gray-600">
                        Try adjusting your search or filters
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedDeliveries.map((delivery, index) => (
                    <tr
                      key={delivery.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(delivery)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                            {String(
                              (currentPage - 1) * itemsPerPage + index + 1
                            ).padStart(2, "0")}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {delivery.projectCode}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {delivery.productName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {delivery.brandName} • {delivery.categoryName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {delivery.poNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(delivery.poReceivedDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {delivery.deliveryDate
                            ? formatDate(delivery.deliveryDate)
                            : formatDate(delivery.expectedDeliveryDate)}
                        </div>
                        {!delivery.deliveryDate &&
                          delivery.expectedDeliveryDate && (
                            <div className="text-xs text-gray-500">
                              Expected
                            </div>
                          )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${getAgingColor(
                            delivery.aging
                          )}`}
                        >
                          {delivery.aging} days
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {delivery.quantity.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(delivery.deliveryStatus)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredDeliveries.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredDeliveries.length
                )}{" "}
                of {filteredDeliveries.length} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={
                        currentPage === page
                          ? "bg-[#0c9dcb] hover:bg-[#0a8bb5]"
                          : ""
                      }
                    >
                      {page}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="!max-w-[85vw] !w-[85vw] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
          {/* Sticky Header */}
          <div className="sticky top-0 z-50 px-8 py-6 bg-linear-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-linear-to-br from-[#0c9dcb] to-[#0a8bb5] rounded-xl flex items-center justify-center shadow-lg">
                  <Truck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-semibold text-gray-900 mb-2">
                    Delivery Details
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    View and manage delivery information
                  </DialogDescription>
                  <div className="flex items-center gap-4">
                    <span className="text-lg text-gray-600">
                      {selectedDelivery?.projectCode}
                    </span>
                    {selectedDelivery &&
                      getStatusBadge(selectedDelivery.deliveryStatus)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!isEditing ? (
                  <>
                    <Button
                      onClick={handleEditClick}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Delivery
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailsDialogOpen(false)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Close
                    </Button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveEdit}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 px-8 py-6">
            {selectedDelivery && (
              <div className="space-y-6">
                {/* Project Information */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Project Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label className="text-sm text-gray-600">
                        Project Code
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedData.projectCode}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              projectCode: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedDelivery.projectCode}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">PO Number</Label>
                      {isEditing ? (
                        <Input
                          value={editedData.poNumber}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              poNumber: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedDelivery.poNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">
                        Product Name
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedData.productName}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              productName: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedDelivery.productName}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Brand</Label>
                      {isEditing ? (
                        <Input
                          value={editedData.brandName}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              brandName: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedDelivery.brandName}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Category</Label>
                      {isEditing ? (
                        <Input
                          value={editedData.categoryName}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              categoryName: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedDelivery.categoryName}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Quantity</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editedData.quantity}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              quantity: parseInt(e.target.value) || 0,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedDelivery.quantity.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dates Information */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Dates & Timeline
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label className="text-sm text-gray-600">
                        PO Received Date
                      </Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedData.poReceivedDate}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              poReceivedDate: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {formatDate(selectedDelivery.poReceivedDate)}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">
                        Expected Delivery
                      </Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedData.expectedDeliveryDate}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              expectedDeliveryDate: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {formatDate(selectedDelivery.expectedDeliveryDate)}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">
                        Actual Delivery
                      </Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedData.deliveryDate || ""}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              deliveryDate: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {formatDate(selectedDelivery.deliveryDate) || "-"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Aging:</span>
                      <span
                        className={`text-sm font-medium ${getAgingColor(
                          selectedDelivery.aging
                        )}`}
                      >
                        {selectedDelivery.aging} days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status & Financial Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Delivery Status
                    </h3>
                    <div>
                      <Label className="text-sm text-gray-600">
                        Current Status
                      </Label>
                      {isEditing ? (
                        <Select
                          value={editedData.deliveryStatus}
                          onValueChange={(value) =>
                            setEditedData({
                              ...editedData,
                              deliveryStatus: value,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Parcel Delivered">
                              Parcel Delivered
                            </SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-2">
                          {getStatusBadge(selectedDelivery.deliveryStatus)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Financial Details
                    </h3>
                    <div>
                      <Label className="text-sm text-gray-600">
                        Total Amount
                      </Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editedData.totalAmount}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              totalAmount: parseInt(e.target.value) || 0,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-lg text-gray-900 mt-1">
                          {formatCurrency(selectedDelivery.totalAmount || 0)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shipping & Customer Details */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Shipping & Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm text-gray-600">
                        Tracking Number
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedData.trackingNumber || ""}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              trackingNumber: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedDelivery.trackingNumber || "-"}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">
                        Courier Service
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedData.courierService || ""}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              courierService: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedDelivery.courierService || "-"}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">
                        Customer Name
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedData.customerName || ""}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              customerName: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedDelivery.customerName || "-"}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">
                        Customer Contact
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedData.customerContact || ""}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              customerContact: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedDelivery.customerContact || "-"}
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm text-gray-600">
                        Delivery Address
                      </Label>
                      {isEditing ? (
                        <Textarea
                          value={editedData.deliveryAddress || ""}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              deliveryAddress: e.target.value,
                            })
                          }
                          className="mt-1"
                          rows={2}
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedDelivery.deliveryAddress || "-"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Remarks
                  </h3>
                  <div>
                    {isEditing ? (
                      <Textarea
                        value={editedData.remarks || ""}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            remarks: e.target.value,
                          })
                        }
                        rows={3}
                        placeholder="Add any additional notes or remarks..."
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {selectedDelivery.remarks || "No remarks"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Delivery Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#0c9dcb]" />
              Add New Delivery
            </DialogTitle>
            <DialogDescription>Create a new delivery record</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Project Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Project Code *</Label>
                <Input
                  value={formData.projectCode}
                  onChange={(e) =>
                    setFormData({ ...formData, projectCode: e.target.value })
                  }
                  placeholder="e.g., RND/24-25/01/102"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>PO Number *</Label>
                <Input
                  value={formData.poNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, poNumber: e.target.value })
                  }
                  placeholder="e.g., PO-2024-001"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Product Name *</Label>
                <Input
                  value={formData.productName}
                  onChange={(e) =>
                    setFormData({ ...formData, productName: e.target.value })
                  }
                  placeholder="Enter product name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Brand *</Label>
                <Input
                  value={formData.brandName}
                  onChange={(e) =>
                    setFormData({ ...formData, brandName: e.target.value })
                  }
                  placeholder="Enter brand name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Category *</Label>
                <Input
                  value={formData.categoryName}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryName: e.target.value })
                  }
                  placeholder="e.g., Casual, Formal"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Enter quantity"
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>PO Received Date *</Label>
                <Input
                  type="date"
                  value={formData.poReceivedDate}
                  onChange={(e) =>
                    setFormData({ ...formData, poReceivedDate: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Expected Delivery Date</Label>
                <Input
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedDeliveryDate: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Delivery Status</Label>
                <Select
                  value={formData.deliveryStatus}
                  onValueChange={(value) =>
                    setFormData({ ...formData, deliveryStatus: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Parcel Delivered">
                      Parcel Delivered
                    </SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Financial & Shipping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Total Amount</Label>
                <Input
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalAmount: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Enter total amount"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tracking Number</Label>
                <Input
                  value={formData.trackingNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, trackingNumber: e.target.value })
                  }
                  placeholder="Enter tracking number"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Courier Service</Label>
                <Input
                  value={formData.courierService}
                  onChange={(e) =>
                    setFormData({ ...formData, courierService: e.target.value })
                  }
                  placeholder="e.g., DHL, FedEx"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Customer Name</Label>
                <Input
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  placeholder="Enter customer name"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Delivery Address</Label>
              <Textarea
                value={formData.deliveryAddress}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryAddress: e.target.value })
                }
                placeholder="Enter delivery address"
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Remarks</Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                placeholder="Add any additional notes..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddDelivery}
              className="bg-[#0c9dcb] hover:bg-[#0a8bb5]"
            >
              Add Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
