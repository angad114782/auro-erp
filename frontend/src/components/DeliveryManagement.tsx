import React, { useState, useMemo, useEffect } from "react";
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
  RefreshCw,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Receipt,
  FileDigit,
  Truck as TruckIcon,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useERPStore } from "../lib/data-store";
import { toast } from "sonner";
import { format } from "date-fns";
import api from "../lib/api";

interface DeliveryManagementProps {
  currentSubModule: string;
}

interface DeliveryItem {
  _id: string;
  projectCode: string;
  productName: string;
  category: string;
  brand: string;
  gender: string;
  poNumber: string;
  poReceivedDate: string;
  deliveryDateExpected: string;
  orderQuantity: number;
  status: "pending" | "parcel_delivered" | "delivered";
  agingDays: number;
  project?: {
    _id: string;
    autoCode: string;
    artName: string;
    brand: { name: string };
    category: { name: string };
    country: { name: string };
    gender: string;
  };
  poDetails?: {
    poNumber: string;
    deliveryDate: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function DeliveryManagement({
  currentSubModule,
}: DeliveryManagementProps) {
  const {
    deliveryItems: localDeliveryItems,
    updateDeliveryItem,
    addDeliveryItem,
    deleteDeliveryItem,
  } = useERPStore();

  const [backendDeliveries, setBackendDeliveries] = useState<DeliveryItem[]>(
    []
  );
  const [loading, setLoading] = useState(false);
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
  const [editStatus, setEditStatus] = useState<string>("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Fetch data from backend
  const fetchBackendData = async () => {
    try {
      setLoading(true);
      let endpoint = "";

      if (currentSubModule === "delivery-pending") {
        endpoint = "/delivery/pending";
      } else if (currentSubModule === "parcel-delivered") {
        endpoint = "/delivery/parcel-delivered";
      } else if (currentSubModule === "delivered") {
        endpoint = "/delivery/delivered";
      }

      if (endpoint) {
        const res = await api.get(endpoint);
        console.log("Backend response:", res.data);
        if (res.data.success) {
          setBackendDeliveries(res.data.items || []);
        } else {
          setBackendDeliveries([]);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data from server");
      setBackendDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendData();
  }, [currentSubModule]);

  // Convert backend data to display format for the list
  const displayItems = useMemo(() => {
    return backendDeliveries.map((item) => ({
      id: item._id,
      projectCode: item.projectCode || "N/A",
      productName: item.productName || "N/A",
      brandName: item.brand || "N/A",
      categoryName: item.category || "N/A",
      poNumber: item.poNumber || "N/A",
      poReceivedDate:
        item.poReceivedDate || new Date().toISOString().split("T")[0],
      quantity: item.orderQuantity || 0,
      deliveryStatus:
        item.status === "pending"
          ? "Pending"
          : item.status === "parcel_delivered"
          ? "Parcel Delivered"
          : "Delivered",
      deliveryDate: item.deliveryDateExpected || "",
      expectedDeliveryDate: item.deliveryDateExpected || "",
      aging: item.agingDays || 0,
      // Additional fields for the new inputs
      billNumber: "", // New field
      lrNumber: "", // New field
      actualDeliveryDate: "", // New field
      // Store original backend data for details
      backendData: item,
    }));
  }, [backendDeliveries]);

  // Filter deliveries based on current sub-module
  const filteredDeliveries = useMemo(() => {
    let filtered = displayItems;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.billNumber &&
            item.billNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.lrNumber &&
            item.lrNumber.toLowerCase().includes(searchTerm.toLowerCase()))
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
  }, [displayItems, searchTerm, sortBy, sortOrder, dateFrom, dateTo]);

  // Paginate deliveries
  const paginatedDeliveries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDeliveries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDeliveries, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);

  // Calculate statistics based on backend data
  const stats = useMemo(() => {
    const pending = backendDeliveries.filter(
      (item) => item.status === "pending"
    );
    const parcelDelivered = backendDeliveries.filter(
      (item) => item.status === "parcel_delivered"
    );
    const delivered = backendDeliveries.filter(
      (item) => item.status === "delivered"
    );

    const avgAging =
      backendDeliveries.length > 0
        ? Math.round(
            backendDeliveries.reduce(
              (sum, item) => sum + (item.agingDays || 0),
              0
            ) / backendDeliveries.length
          )
        : 0;

    return {
      pending: pending.length,
      parcelDelivered: parcelDelivered.length,
      delivered: delivered.length,
      total: backendDeliveries.length,
      avgAging,
    };
  }, [backendDeliveries]);

  const handleRowClick = (delivery: any) => {
    setSelectedDelivery(delivery);
    // Initialize editedData with default values for new fields
    setEditedData({
      ...delivery,
      billNumber: delivery.billNumber || "",
      lrNumber: delivery.lrNumber || "",
      actualDeliveryDate: delivery.actualDeliveryDate || "",
    });
    setEditStatus(delivery.deliveryStatus);
    setIsEditing(false);
    setIsDetailsDialogOpen(true);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedData({
      ...selectedDelivery,
      billNumber: selectedDelivery.billNumber || "",
      lrNumber: selectedDelivery.lrNumber || "",
      actualDeliveryDate: selectedDelivery.actualDeliveryDate || "",
    });
    setEditStatus(selectedDelivery?.deliveryStatus || "");
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedDelivery) return;

    try {
      // Prepare the data to save
      const updatedData = {
        ...editedData,
        // Include the new fields
        billNumber: editedData.billNumber || "",
        lrNumber: editedData.lrNumber || "",
        actualDeliveryDate: editedData.actualDeliveryDate || "",
      };

      // If editing status, call the API
      if (editStatus !== selectedDelivery.deliveryStatus) {
        const endpoint =
          editStatus === "Parcel Delivered"
            ? `/delivery/parcel/${selectedDelivery.id}`
            : editStatus === "Delivered"
            ? `/delivery/final/${selectedDelivery.id}`
            : null;

        if (endpoint) {
          const res = await api.put(endpoint);
          if (res.data.success) {
            toast.success(res.data.message);
            // Refresh data after status update
            fetchBackendData();
          }
        }
      }

      // Update local storage with new fields
      updateDeliveryItem(selectedDelivery.id, updatedData);

      toast.success("Delivery updated successfully");
      setIsEditing(false);
      setIsDetailsDialogOpen(false);
    } catch (error: any) {
      console.error("Error updating:", error);
      toast.error(error.response?.data?.error || "Failed to update delivery");
    }
  };

  const handleAddDelivery = () => {
    // Add new delivery with all fields
    const newDelivery = {
      ...formData,
      projectId: Date.now().toString(),
      billNumber: formData.billNumber || "",
      lrNumber: formData.lrNumber || "",
      actualDeliveryDate: formData.actualDeliveryDate || "",
    };

    addDeliveryItem(newDelivery);

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
      billNumber: "",
      lrNumber: "",
      actualDeliveryDate: "",
      trackingNumber: "",
      courierService: "",
      deliveryAddress: "",
      customerName: "",
      customerContact: "",
      remarks: "",
    });
  };

  // Form state for editing
  const [editedData, setEditedData] = useState<any>({
    billNumber: "",
    lrNumber: "",
    actualDeliveryDate: "",
  });

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
    billNumber: "",
    lrNumber: "",
    actualDeliveryDate: "",
    trackingNumber: "",
    courierService: "",
    deliveryAddress: "",
    customerName: "",
    customerContact: "",
    remarks: "",
  });

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
            className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-2 py-0.5"
          >
            Pending
          </Badge>
        );
      case "Parcel Delivered":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-0.5"
          >
            Parcel Delivered
          </Badge>
        );
      case "Delivered":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-0.5"
          >
            Delivered
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {status}
          </Badge>
        );
    }
  };

  const getAgingColor = (aging: number) => {
    if (aging < 30) return "text-green-600";
    if (aging < 60) return "text-orange-600";
    return "text-red-600";
  };

  // Mobile Responsive Functions
  const toggleCardExpansion = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  // Mobile view renderer
  const renderMobileCard = (delivery: any, index: number) => {
    const isExpanded = expandedCard === delivery.id;
    return (
      <Card
        key={delivery.id}
        className="mb-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
      >
        <CardContent className="p-4">
          {/* Card Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                {String((currentPage - 1) * itemsPerPage + index + 1).padStart(
                  2,
                  "0"
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {delivery.projectCode}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {delivery.productName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(delivery.deliveryStatus)}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCardExpansion(delivery.id);
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Basic Info Row */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-500">PO Number</p>
              <p className="text-sm font-medium text-gray-900">
                {delivery.poNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Quantity</p>
              <p className="text-sm font-medium text-gray-900">
                {delivery.quantity.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Collapsible Content */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Brand</p>
                  <p className="text-sm text-gray-900">{delivery.brandName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="text-sm text-gray-900">
                    {delivery.categoryName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">PO Date</p>
                  <p className="text-sm text-gray-900">
                    {formatDate(delivery.poReceivedDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Delivery Date</p>
                  <p className="text-sm text-gray-900">
                    {delivery.deliveryDate
                      ? formatDate(delivery.deliveryDate)
                      : formatDate(delivery.expectedDeliveryDate)}
                  </p>
                </div>
                {delivery.billNumber && (
                  <div>
                    <p className="text-xs text-gray-500">Bill No.</p>
                    <p className="text-sm text-gray-900">
                      {delivery.billNumber}
                    </p>
                  </div>
                )}
                {delivery.lrNumber && (
                  <div>
                    <p className="text-xs text-gray-500">LR No.</p>
                    <p className="text-sm text-gray-900">{delivery.lrNumber}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Aging</p>
                  <p
                    className={`text-sm font-medium ${getAgingColor(
                      delivery.aging
                    )}`}
                  >
                    {delivery.aging} days
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleRowClick(delivery)}
                  className="text-xs px-3"
                >
                  <Eye className="w-3 h-3 mr-1.5" />
                  View Details
                </Button>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {!isExpanded && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center">
                <Clock className="w-3 h-3 text-gray-400 mr-1.5" />
                <span
                  className={`text-xs font-medium ${getAgingColor(
                    delivery.aging
                  )}`}
                >
                  {delivery.aging} days
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRowClick(delivery)}
                className="text-xs h-7"
              >
                View
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
        <div>
          <h1 className="text-xl md:text-3xl font-semibold text-gray-900">
            Delivery Management
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
            Track and manage product deliveries • {stats.total} Total Deliveries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBackendData}
            disabled={loading}
            className="text-xs md:text-sm h-8 md:h-9"
          >
            <RefreshCw
              className={`w-3 h-3 md:w-4 md:h-4 mr-1.5 ${
                loading ? "animate-spin" : ""
              }`}
            />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>

          <Button
            size="icon"
            className="bg-[#0c9dcb] hover:bg-[#0a8bb5] md:hidden h-8 w-8"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Statistics Cards - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-orange-700">Pending</p>
                <h3 className="text-lg md:text-2xl text-orange-900 mt-0.5 md:mt-1">
                  {stats.pending}
                </h3>
              </div>
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                <Clock className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-blue-700">
                  Parcel Delivered
                </p>
                <h3 className="text-lg md:text-2xl text-blue-900 mt-0.5 md:mt-1">
                  {stats.parcelDelivered}
                </h3>
              </div>
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                <Package className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-green-700">Delivered</p>
                <h3 className="text-lg md:text-2xl text-green-900 mt-0.5 md:mt-1">
                  {stats.delivered}
                </h3>
              </div>
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg bg-green-500 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-purple-700">Avg. Aging</p>
                <h3 className="text-lg md:text-2xl text-purple-900 mt-0.5 md:mt-1">
                  {stats.avgAging} days
                </h3>
              </div>
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter - Mobile Optimized */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-3 h-3 md:w-4 md:h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search deliveries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 md:pl-10 text-sm h-9 md:h-10"
              />
            </div>
            <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
              {/* Mobile Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden h-9">
                    <Filter className="w-3 h-3 mr-1.5" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2">
                    <Label className="text-xs font-medium">Date Range</Label>
                    <div className="flex flex-col gap-2 mt-2">
                      <Popover
                        open={isDateFromOpen}
                        onOpenChange={setIsDateFromOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="justify-start"
                          >
                            <Calendar className="w-3 h-3 mr-2" />
                            {dateFrom
                              ? format(dateFrom, "dd/MM/yy")
                              : "From Date"}
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
                      <Popover
                        open={isDateToOpen}
                        onOpenChange={setIsDateToOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="justify-start"
                          >
                            <Calendar className="w-3 h-3 mr-2" />
                            {dateTo ? format(dateTo, "dd/MM/yy") : "To Date"}
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
                            disabled={(date) =>
                              dateFrom ? date < dateFrom : false
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Separator className="my-2" />
                    <Label className="text-xs font-medium">Sort By</Label>
                    <Select
                      value={sortBy}
                      onValueChange={(value: any) => setSortBy(value)}
                    >
                      <SelectTrigger className="mt-1 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aging">Sort by Aging</SelectItem>
                        <SelectItem value="poDate">Sort by PO Date</SelectItem>
                        <SelectItem value="deliveryDate">
                          Sort by Delivery
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center justify-between mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                        }
                        className="h-8"
                      >
                        <ArrowUpDown className="w-3 h-3" />
                        {sortOrder === "asc" ? "Asc" : "Desc"}
                      </Button>
                      {(dateFrom || dateTo) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDateFrom(undefined);
                            setDateTo(undefined);
                          }}
                          className="h-8 text-xs"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Desktop Filters */}
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-2 bg-white">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <Popover
                    open={isDateFromOpen}
                    onOpenChange={setIsDateFromOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-32 justify-start text-left font-normal border-0 p-0 h-auto hover:bg-transparent text-sm"
                      >
                        {dateFrom ? (
                          format(dateFrom, "dd MMM yy")
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
                        className="w-32 justify-start text-left font-normal border-0 p-0 h-auto hover:bg-transparent text-sm"
                      >
                        {dateTo ? (
                          format(dateTo, "dd MMM yy")
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
                        disabled={(date) =>
                          dateFrom ? date < dateFrom : false
                        }
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
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aging">Sort by Aging</SelectItem>
                    <SelectItem value="poDate">Sort by PO Date</SelectItem>
                    <SelectItem value="deliveryDate">
                      Sort by Delivery
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="h-9 w-9"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries List/Table - Responsive */}
      <Card className="shadow-sm border-0">
        <CardHeader className="bg-gray-50 rounded-t-lg py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-[#0c9dcb] rounded-lg flex items-center justify-center text-white">
                <Truck className="w-3 h-3 md:w-5 md:h-5" />
              </div>
              <div>
                <CardTitle className="text-base md:text-xl">
                  {currentSubModule === "delivery-pending" &&
                    "Delivery Pending"}
                  {currentSubModule === "parcel-delivered" &&
                    "Parcel Delivered"}
                  {currentSubModule === "delivered" && "Delivered"}
                  {!currentSubModule && "All Deliveries"}
                </CardTitle>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                  {filteredDeliveries.length} Total Records
                </p>
              </div>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-[#0c9dcb]"></div>
                Loading...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile View - Cards */}
          <div className="md:hidden p-3">
            {paginatedDeliveries.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  {loading ? "Loading deliveries..." : "No deliveries found"}
                </h3>
                <p className="text-xs text-gray-600">
                  {loading
                    ? "Please wait..."
                    : "Try adjusting your search or filters"}
                </p>
              </div>
            ) : (
              paginatedDeliveries.map((delivery, index) =>
                renderMobileCard(delivery, index)
              )
            )}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Code
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Details
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Received
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Date
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aging
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        {loading
                          ? "Loading deliveries..."
                          : "No deliveries found"}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {loading
                          ? "Please wait..."
                          : "Try adjusting your search or filters"}
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
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs mr-2.5">
                            {String(
                              (currentPage - 1) * itemsPerPage + index + 1
                            ).padStart(2, "0")}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {delivery.projectCode}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {delivery.productName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {delivery.brandName} • {delivery.categoryName}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {delivery.poNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(delivery.poReceivedDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
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
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${getAgingColor(
                            delivery.aging
                          )}`}
                        >
                          {delivery.aging} days
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {delivery.quantity.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(delivery.deliveryStatus)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Responsive */}
          {filteredDeliveries.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-3 md:px-4 py-3 border-t border-gray-200">
              <div className="text-xs md:text-sm text-gray-600 mb-2 sm:mb-0">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredDeliveries.length
                )}{" "}
                of {filteredDeliveries.length} results
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="h-8 text-xs"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="flex items-center gap-1">
                  {totalPages <= 5 ? (
                    Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 min-w-8 text-xs ${
                            currentPage === page
                              ? "bg-[#0c9dcb] hover:bg-[#0a8bb5]"
                              : ""
                          }`}
                        >
                          {page}
                        </Button>
                      )
                    )
                  ) : (
                    <>
                      {currentPage > 3 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            className="h-8 min-w-8 text-xs"
                          >
                            1
                          </Button>
                          <span className="px-2">...</span>
                        </>
                      )}
                      {Array.from(
                        { length: Math.min(3, totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (currentPage <= 3) pageNum = i + 1;
                          else if (currentPage >= totalPages - 2)
                            pageNum = totalPages - 3 + i + 1;
                          else pageNum = currentPage - 1 + i;
                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`h-8 min-w-8 text-xs ${
                                currentPage === pageNum
                                  ? "bg-[#0c9dcb] hover:bg-[#0a8bb5]"
                                  : ""
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                      {currentPage < totalPages - 2 && (
                        <>
                          <span className="px-2">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            className="h-8 min-w-8 text-xs"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-8 text-xs"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Details Dialog - Responsive */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-[85vw] w-[95vw] md:w-[85vw] max-h-[90vh] p-0 m-0 flex flex-col">
          {/* Sticky Header - Updated for mobile */}
          <div className="sticky top-0 z-50 px-4 md:px-8 py-4 md:py-6 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
              <div className="flex items-center gap-3 md:gap-6">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-linear-to-br from-[#0c9dcb] to-[#0a8bb5] rounded-lg md:rounded-xl flex items-center justify-center shadow">
                  <Truck className="w-5 h-5 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-1 md:mb-2">
                    Delivery Details
                  </DialogTitle>
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                    <span className="text-sm md:text-lg text-gray-600">
                      {selectedDelivery?.projectCode}
                    </span>
                    {selectedDelivery &&
                      getStatusBadge(selectedDelivery.deliveryStatus)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <>
                    <Button
                      onClick={handleEditClick}
                      className="bg-blue-500 hover:bg-blue-600 text-xs md:text-sm h-8 md:h-9"
                    >
                      <Edit2 className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailsDialogOpen(false)}
                      className="text-xs md:text-sm h-8 md:h-9"
                    >
                      <X className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
                      Close
                    </Button>
                  </>
                ) : (
                  <div className="flex gap-1.5 md:gap-2">
                    <Button
                      onClick={handleSaveEdit}
                      className="bg-green-500 hover:bg-green-600 text-xs md:text-sm h-8 md:h-9"
                    >
                      <Save className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="text-xs md:text-sm h-8 md:h-9"
                    >
                      <X className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 px-4 md:px-8 py-4 md:py-6">
            {selectedDelivery && selectedDelivery.backendData && (
              <div className="space-y-4 md:space-y-6">
                {/* Project Information */}
                <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                    Project Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {[
                      {
                        label: "Project Code",
                        value: selectedDelivery.projectCode,
                        key: "projectCode",
                      },
                      {
                        label: "PO Number",
                        value: selectedDelivery.poNumber,
                        key: "poNumber",
                      },
                      {
                        label: "Product Name",
                        value: selectedDelivery.productName,
                        key: "productName",
                      },
                      {
                        label: "Brand",
                        value: selectedDelivery.brandName,
                        key: "brandName",
                      },
                      {
                        label: "Category",
                        value: selectedDelivery.categoryName,
                        key: "categoryName",
                      },
                      {
                        label: "Quantity",
                        value: selectedDelivery.quantity.toLocaleString(),
                        key: "quantity",
                      },
                    ].map((item) => (
                      <div key={item.key}>
                        <Label className="text-xs md:text-sm text-gray-600">
                          {item.label}
                        </Label>
                        {isEditing && item.key !== "quantity" ? (
                          <Input
                            value={editedData[item.key] || ""}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                [item.key]: e.target.value,
                              })
                            }
                            className="mt-1 h-8 md:h-9 text-sm"
                          />
                        ) : isEditing && item.key === "quantity" ? (
                          <Input
                            type="number"
                            value={editedData.quantity || 0}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                quantity: parseInt(e.target.value) || 0,
                              })
                            }
                            className="mt-1 h-8 md:h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm md:text-base text-gray-900 mt-1">
                            {item.value || "-"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dates Information */}
                <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                    Dates & Timeline
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {[
                      {
                        label: "PO Received Date",
                        value: formatDate(selectedDelivery.poReceivedDate),
                        key: "poReceivedDate",
                        type: "date",
                      },
                      {
                        label: "Expected Delivery",
                        value: formatDate(
                          selectedDelivery.expectedDeliveryDate
                        ),
                        key: "expectedDeliveryDate",
                        type: "date",
                      },
                      {
                        label: "Actual Delivery",
                        value: formatDate(selectedDelivery.deliveryDate),
                        key: "deliveryDate",
                        type: "date",
                      },
                    ].map((item) => (
                      <div key={item.key}>
                        <Label className="text-xs md:text-sm text-gray-600">
                          {item.label}
                        </Label>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editedData[item.key] || ""}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                [item.key]: e.target.value,
                              })
                            }
                            className="mt-1 h-8 md:h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm md:text-base text-gray-900 mt-1">
                            {item.value || "-"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 md:mt-4 p-3 md:p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Aging:</span>
                      <span
                        className={`text-sm font-medium ${getAgingColor(
                          selectedDelivery.aging
                        )}`}
                      >
                        {selectedDelivery.aging || 0} days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery & Shipping Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                      <TruckIcon className="w-4 h-4 md:w-5 md:h-5" />
                      Delivery Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs md:text-sm text-gray-600 flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5" />
                          Bill Number
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editedData.billNumber || ""}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                billNumber: e.target.value,
                              })
                            }
                            placeholder="Enter bill number"
                            className="mt-1 h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm md:text-base text-gray-900 mt-1">
                            {selectedDelivery.billNumber || "-"}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs md:text-sm text-gray-600 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Delivery Date
                        </Label>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editedData.actualDeliveryDate || ""}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                actualDeliveryDate: e.target.value,
                              })
                            }
                            className="mt-1 h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm md:text-base text-gray-900 mt-1">
                            {formatDate(selectedDelivery.actualDeliveryDate) ||
                              "-"}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs md:text-sm text-gray-600 flex items-center gap-1.5">
                          <FileDigit className="w-3.5 h-3.5" />
                          LR Number
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editedData.lrNumber || ""}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                lrNumber: e.target.value,
                              })
                            }
                            placeholder="Enter LR number"
                            className="mt-1 h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm md:text-base text-gray-900 mt-1">
                            {selectedDelivery.lrNumber || "-"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                      Delivery Status
                    </h3>
                    <div>
                      <Label className="text-xs md:text-sm text-gray-600">
                        Current Status
                      </Label>
                      {isEditing ? (
                        <Select
                          value={editStatus}
                          onValueChange={(value: any) => setEditStatus(value)}
                        >
                          <SelectTrigger className="mt-1 h-9 text-sm">
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
                </div>

                {/* Remarks */}
                <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
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
                        className="text-sm"
                      />
                    ) : (
                      <p className="text-sm md:text-base text-gray-900">
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
    </div>
  );
}
