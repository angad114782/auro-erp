import React, { useState, useMemo, useEffect } from "react";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  Calendar,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Edit2,
  Eye,
  ChevronDown,
  ChevronUp,
  Receipt,
  FileDigit,
  Truck as TruckIcon,
  FileText,
  Info,
  Tag,
  Hash,
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
  sendQuantity: number;
  status: "pending" | "parcel_delivered" | "delivered";
  agingDays: number;
  billNumber: string;
  deliveryDate: string;
  lrNumber: string;
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
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

interface DisplayDeliveryItem {
  id: string;
  projectCode: string;
  productName: string;
  brandName: string;
  categoryName: string;
  gender: string;
  poNumber: string;
  poReceivedDate: string;
  quantity: number;
  sendQuantity: number;
  deliveryStatus: "Pending" | "Parcel Delivered" | "Delivered";
  deliveryDate: string;
  expectedDeliveryDate: string;
  billNumber: string;
  lrNumber: string;
  actualDeliveryDate: string;
  aging: number;
  remarks: string;
  backendData: DeliveryItem;
}

interface EditFormData {
  billNumber: string;
  deliveryDate: string;
  lrNumber: string;
  status: string;
  remarks: string;
  sendQuantity: number;
}

export function DeliveryManagement({
  currentSubModule,
}: DeliveryManagementProps) {
  const { deliveryItems: localDeliveryItems, updateDeliveryItem } =
    useERPStore();

  const [backendDeliveries, setBackendDeliveries] = useState<DeliveryItem[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDelivery, setSelectedDelivery] =
    useState<DisplayDeliveryItem | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sortBy, setSortBy] = useState<"aging" | "poDate" | "deliveryDate">(
    "aging"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [isDateFromOpen, setIsDateFromOpen] = useState(false);
  const [isDateToOpen, setIsDateToOpen] = useState(false);

  const [editFormData, setEditFormData] = useState<EditFormData>({
    billNumber: "",
    deliveryDate: "",
    lrNumber: "",
    status: "",
    remarks: "",
    sendQuantity: 0,
  });

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

  // Convert backend data to display format
  const displayItems = useMemo(() => {
    return backendDeliveries.map((item) => ({
      id: item._id,
      projectCode: item.projectCode || "N/A",
      productName: item.productName || "N/A",
      brandName: item.brand || "N/A",
      categoryName: item.category || "N/A",
      gender: item.gender || "N/A",
      poNumber: item.poNumber || "N/A",
      poReceivedDate:
        item.poReceivedDate || new Date().toISOString().split("T")[0],
      quantity: item.orderQuantity || 0,
      sendQuantity: item.sendQuantity || 0,
      deliveryStatus:
        item.status === "pending"
          ? "Pending"
          : item.status === "parcel_delivered"
          ? "Parcel Delivered"
          : "Delivered",
      deliveryDate: item.deliveryDate || "",
      expectedDeliveryDate: item.deliveryDateExpected || "",
      billNumber: item.billNumber || "",
      lrNumber: item.lrNumber || "",
      actualDeliveryDate: item.deliveryDate || "",
      aging: item.agingDays || 0,
      remarks: item.remarks || "",
      backendData: item,
    }));
  }, [backendDeliveries]);

  // Filter deliveries
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
          item.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.lrNumber.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Calculate statistics
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

  // Handle row click
  const handleRowClick = (delivery: DisplayDeliveryItem) => {
    setSelectedDelivery(delivery);
    // Initialize edit form with only editable fields
    setEditFormData({
      billNumber: delivery.billNumber || "",
      deliveryDate: delivery.actualDeliveryDate || "",
      lrNumber: delivery.lrNumber || "",
      status: delivery.deliveryStatus,
      remarks: delivery.remarks || "",
      sendQuantity: delivery.sendQuantity || 0,
    });
    setIsEditing(false);
    setIsDetailsDialogOpen(true);
  };

  // Handle edit click
  const handleEditClick = () => {
    setIsEditing(true);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    if (selectedDelivery) {
      setEditFormData({
        billNumber: selectedDelivery.billNumber || "",
        deliveryDate: selectedDelivery.actualDeliveryDate || "",
        lrNumber: selectedDelivery.lrNumber || "",
        status: selectedDelivery.deliveryStatus,
        remarks: selectedDelivery.remarks || "",
        sendQuantity: selectedDelivery.sendQuantity || 0,
      });
    }
    setIsEditing(false);
  };

  // Handle form input change
  const handleInputChange = (
    field: keyof EditFormData,
    value: string | number
  ) => {
    // Special handling for sendQuantity to allow decimals
    if (field === "sendQuantity") {
      // If value is a string, parse it as float
      if (typeof value === "string") {
        // Allow empty string or decimal numbers
        if (value === "" || value === ".") {
          setEditFormData((prev) => ({
            ...prev,
            [field]: value as any,
          }));
        } else {
          const parsedValue = parseFloat(value);
          // Only update if it's a valid number or 0
          if (!isNaN(parsedValue)) {
            setEditFormData((prev) => ({
              ...prev,
              [field]: parsedValue,
            }));
          }
        }
      } else {
        // Value is already a number
        setEditFormData((prev) => ({
          ...prev,
          [field]: value,
        }));
      }
    } else {
      // For other fields
      setEditFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!selectedDelivery) return;

    try {
      setSaving(true);

      // Helper function to compare values (handles null/undefined)
      const hasChanged = (newValue: any, oldValue: any) => {
        // Handle null/undefined cases
        if (newValue === undefined || newValue === null) return false;
        if (oldValue === undefined || oldValue === null) oldValue = "";

        // Trim strings for comparison
        if (typeof newValue === "string" && typeof oldValue === "string") {
          return newValue.trim() !== oldValue.trim();
        }

        // For numbers comparison (with tolerance for floating point)
        if (typeof newValue === "number" && typeof oldValue === "number") {
          return Math.abs(newValue - oldValue) > 0.0001;
        }

        // For other types, use strict comparison
        return newValue !== oldValue;
      };

      // Convert frontend status to backend format
      const statusMap = {
        Pending: "pending",
        "Parcel Delivered": "parcel_delivered",
        Delivered: "delivered",
      };

      // Get current backend status
      const currentBackendStatus =
        statusMap[selectedDelivery.deliveryStatus] || "pending";
      const newBackendStatus = statusMap[editFormData.status] || "pending";

      // Prepare update data
      const updateData: any = {};
      let hasChanges = false;

      // Check each field for changes
      if (hasChanged(editFormData.billNumber, selectedDelivery.billNumber)) {
        updateData.billNumber = editFormData.billNumber || "";
        hasChanges = true;
      }

      if (
        hasChanged(
          editFormData.deliveryDate,
          selectedDelivery.actualDeliveryDate
        )
      ) {
        updateData.deliveryDate = editFormData.deliveryDate || "";
        hasChanges = true;
      }

      if (hasChanged(editFormData.lrNumber, selectedDelivery.lrNumber)) {
        updateData.lrNumber = editFormData.lrNumber || "";
        hasChanges = true;
      }

      if (hasChanged(newBackendStatus, currentBackendStatus)) {
        updateData.status = newBackendStatus;
        hasChanges = true;
      }

      if (hasChanged(editFormData.remarks, selectedDelivery.remarks)) {
        updateData.remarks = editFormData.remarks || "";
        hasChanges = true;
      }

      // Check send quantity change - only for pending and parcel delivered
      if (
        currentSubModule !== "delivered" &&
        hasChanged(editFormData.sendQuantity, selectedDelivery.sendQuantity)
      ) {
        const maxQuantity = selectedDelivery.quantity;
        const newSendQuantity = editFormData.sendQuantity || 0;

        // Validate send quantity doesn't exceed order quantity (with tolerance for floating point)
        if (newSendQuantity > maxQuantity + 0.0001) {
          // Small tolerance for floating point
          toast.error(
            `Send quantity (${newSendQuantity.toFixed(
              4
            )}) cannot exceed order quantity (${maxQuantity.toFixed(4)})`
          );
          return;
        }

        // Validate send quantity is not negative
        if (newSendQuantity < 0) {
          toast.error("Send quantity cannot be negative");
          return;
        }

        updateData.sendQuantity = newSendQuantity;
        hasChanges = true;
      }

      // If no changes, show info and exit edit mode
      if (!hasChanges) {
        toast.info("No changes made");
        setIsEditing(false);
        return;
      }

      // Add updatedBy field
      updateData.updatedBy = "user";

      console.log("Updating delivery with changes:", updateData);

      // Call update API
      const response = await api.put(
        `/delivery/update/${selectedDelivery.id}`,
        updateData
      );

      if (response.data.success) {
        toast.success("Delivery updated successfully");

        // Update local state
        const updatedDelivery = response.data.delivery;
        setBackendDeliveries((prev) =>
          prev.map((item) =>
            item._id === selectedDelivery.id ? updatedDelivery : item
          )
        );

        // Update selected delivery
        const updatedDisplayItem: DisplayDeliveryItem = {
          ...selectedDelivery,
          billNumber: updatedDelivery.billNumber || "",
          actualDeliveryDate: updatedDelivery.deliveryDate || "",
          lrNumber: updatedDelivery.lrNumber || "",
          sendQuantity: updatedDelivery.sendQuantity || 0,
          deliveryStatus:
            updatedDelivery.status === "pending"
              ? "Pending"
              : updatedDelivery.status === "parcel_delivered"
              ? "Parcel Delivered"
              : "Delivered",
          remarks: updatedDelivery.remarks || "",
          backendData: updatedDelivery,
        };

        setSelectedDelivery(updatedDisplayItem);

        // Update local storage if needed
        updateDeliveryItem(selectedDelivery.id, updatedDisplayItem);

        setIsEditing(false);
      }
    } catch (error: any) {
      console.error("Error updating delivery:", error);
      toast.error(error.response?.data?.error || "Failed to update delivery");
    } finally {
      setSaving(false);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // Get status badge
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

  // Get aging color
  const getAgingColor = (aging: number) => {
    if (aging < 30) return "text-green-600";
    if (aging < 60) return "text-orange-600";
    return "text-red-600";
  };

  // Format number with decimal support
  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    });
  };

  // Render mobile card
  const renderMobileCard = (delivery: DisplayDeliveryItem, index: number) => {
    return (
      <Card
        key={delivery.id}
        className="mb-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
      >
        <CardContent className="p-4">
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
                onClick={() => handleRowClick(delivery)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-500">PO Number</p>
              <p className="text-sm font-medium text-gray-900">
                {delivery.poNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Order Quantity</p>
              <p className="text-sm font-medium text-gray-900">
                {formatNumber(delivery.quantity)}
              </p>
            </div>
          </div>

          {/* Send Quantity Section - Only for Pending and Parcel Delivered */}
          {(currentSubModule === "delivery-pending" ||
            currentSubModule === "parcel-delivered") && (
            <div className="mb-3 p-2 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-700">
                  Send Quantity
                </span>
                <span className="text-xs text-gray-500">
                  {formatNumber(delivery.sendQuantity || 0)} /{" "}
                  {formatNumber(delivery.quantity)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      ((delivery.sendQuantity || 0) / delivery.quantity) * 100
                    )}%`,
                  }}
                ></div>
              </div>
              {delivery.sendQuantity > 0 && (
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    Sent: {formatNumber(delivery.sendQuantity || 0)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Remaining:{" "}
                    {formatNumber(
                      delivery.quantity - (delivery.sendQuantity || 0)
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

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
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
        <div>
          <h1 className="text-xl md:text-3xl font-semibold text-gray-900">
            Delivery Management
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
            Track and manage product deliveries • {stats.total} Total Deliveries
          </p>
        </div>
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
      </div>

      {/* Statistics Cards */}
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
                <Clock className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
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
            <div className="flex items-center gap-2">
              {/* Date filters */}
              <div className="hidden md:flex items-center gap-2 border border-gray-200 rounded-lg p-2 bg-white">
                <Calendar className="w-4 h-4 text-gray-500" />
                <Popover open={isDateFromOpen} onOpenChange={setIsDateFromOpen}>
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

              {/* Sort options */}
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
                  <SelectItem value="deliveryDate">Sort by Delivery</SelectItem>
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
        </CardContent>
      </Card>

      {/* Deliveries List/Table */}
      <Card className="shadow-sm border-0">
        <CardHeader className="bg-gray-50 rounded-t-lg py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
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
                <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-blue-600"></div>
                Loading...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile View */}
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

          {/* Desktop View */}
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
                    Expected Delivery
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aging
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Quantity
                  </th>
                  {/* Add Send Quantity column - only for Pending and Parcel Delivered tabs */}
                  {(currentSubModule === "delivery-pending" ||
                    currentSubModule === "parcel-delivered") && (
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Send Quantity
                    </th>
                  )}
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedDeliveries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={currentSubModule === "delivered" ? 8 : 9}
                      className="px-4 py-8 text-center"
                    >
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
                          {formatDate(delivery.expectedDeliveryDate)}
                        </div>
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
                          {formatNumber(delivery.quantity)}
                        </div>
                      </td>
                      {/* Send Quantity cell - only for Pending and Parcel Delivered tabs */}
                      {(currentSubModule === "delivery-pending" ||
                        currentSubModule === "parcel-delivered") && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {formatNumber(delivery.sendQuantity || 0)}
                            </div>
                            <div className="text-xs text-gray-500">
                              of {formatNumber(delivery.quantity)}
                            </div>
                            {delivery.sendQuantity > 0 && (
                              <div className="w-20 bg-gray-200 rounded-full h-1">
                                <div
                                  className="bg-green-500 h-1 rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      ((delivery.sendQuantity || 0) /
                                        delivery.quantity) *
                                        100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap">
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 min-w-8 text-xs ${
                          currentPage === page
                            ? "bg-blue-600 hover:bg-blue-700"
                            : ""
                        }`}
                      >
                        {page}
                      </Button>
                    )
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
                  <div className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-1 md:mb-2">
                    Delivery Details
                  </div>
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
                      disabled={saving}
                      className="bg-green-500 hover:bg-green-600 text-xs md:text-sm h-8 md:h-9"
                    >
                      <Save className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
                      {saving ? "Saving..." : "Save"}
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
                {/* Project Information - READ ONLY */}
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
                        value: (
                          <div>
                            <div className="text-sm md:text-base text-gray-900 font-medium">
                              {formatNumber(selectedDelivery.quantity)}
                            </div>
                            {/* Show constraint for send quantity if applicable */}
                            {(currentSubModule === "delivery-pending" ||
                              currentSubModule === "parcel-delivered") && (
                              <div className="text-xs text-blue-600 mt-0.5">
                                Max send quantity allowed (can be decimal)
                              </div>
                            )}
                          </div>
                        ),
                        key: "quantity",
                      },
                    ].map((item) => (
                      <div key={item.key}>
                        <Label className="text-xs md:text-sm text-gray-600">
                          {item.label}
                        </Label>
                        {typeof item.value === "string" ? (
                          <p className="text-sm md:text-base text-gray-900 mt-1">
                            {item.value || "-"}
                          </p>
                        ) : (
                          item.value
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dates Information - READ ONLY */}
                <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                    Dates & Timeline
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {[
                      {
                        label: "PO Received Date",
                        value: formatDate(selectedDelivery.poReceivedDate),
                      },
                      {
                        label: "Expected Delivery",
                        value: formatDate(
                          selectedDelivery.expectedDeliveryDate
                        ),
                      },
                      {
                        label: "Actual Delivery",
                        value: formatDate(selectedDelivery.actualDeliveryDate),
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <Label className="text-xs md:text-sm text-gray-600">
                          {item.label}
                        </Label>
                        <p className="text-sm md:text-base text-gray-900 mt-1">
                          {item.value || "-"}
                        </p>
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

                {/* Delivery & Shipping Information - EDITABLE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                      <TruckIcon className="w-4 h-4 md:w-5 md:h-5" />
                      Delivery Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Bill Number */}
                      <div>
                        <Label className="text-xs md:text-sm text-gray-600 flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5" />
                          Bill Number
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editFormData.billNumber || ""}
                            onChange={(e) =>
                              handleInputChange("billNumber", e.target.value)
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

                      {/* Delivery Date */}
                      <div>
                        <Label className="text-xs md:text-sm text-gray-600 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Delivery Date
                        </Label>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editFormData.deliveryDate || ""}
                            onChange={(e) =>
                              handleInputChange("deliveryDate", e.target.value)
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

                      {/* LR Number – full width on desktop */}
                      <div className="md:col-span-2">
                        <Label className="text-xs md:text-sm text-gray-600 flex items-center gap-1.5">
                          <FileDigit className="w-3.5 h-3.5" />
                          LR Number
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editFormData.lrNumber || ""}
                            onChange={(e) =>
                              handleInputChange("lrNumber", e.target.value)
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

                  {/* Status and Send Quantity - Editable */}
                  <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                      Delivery Status & Quantity
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {/* Status Field */}
                      <div>
                        <Label className="text-xs md:text-sm text-gray-600">
                          Delivery Status
                        </Label>
                        {isEditing ? (
                          <Select
                            value={editFormData.status}
                            onValueChange={(value) =>
                              handleInputChange("status", value)
                            }
                          >
                            <SelectTrigger className="mt-1 h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Parcel Delivered">
                                Parcel Delivered
                              </SelectItem>
                              <SelectItem value="Delivered">
                                Delivered
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-2">
                            {getStatusBadge(selectedDelivery.deliveryStatus)}
                          </div>
                        )}
                      </div>

                      {/* Send Quantity Field - Only for Pending and Parcel Delivered tabs */}
                      {(currentSubModule === "delivery-pending" ||
                        currentSubModule === "parcel-delivered") && (
                        <div>
                          <Label className="text-xs md:text-sm text-gray-600 flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5" />
                            Send Quantity
                            <Info
                              className="w-3 h-3 text-gray-400"
                              title="Can be decimal value. Cannot exceed order quantity."
                            />
                          </Label>

                          {isEditing ? (
                            <div className="space-y-2 mt-1">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.0001"
                                  min="0"
                                  max={selectedDelivery?.quantity || 0}
                                  value={editFormData.sendQuantity || ""}
                                  onChange={(e) => {
                                    handleInputChange(
                                      "sendQuantity",
                                      e.target.value
                                    );
                                  }}
                                  placeholder="Enter send quantity"
                                  className="h-9 text-sm"
                                />
                                <span className="text-sm text-gray-500">/</span>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatNumber(
                                    selectedDelivery?.quantity || 0
                                  )}
                                </div>
                              </div>

                              {/* Validation message */}
                              {editFormData.sendQuantity >
                                (selectedDelivery?.quantity || 0) && (
                                <p className="text-xs text-red-500">
                                  Send quantity cannot exceed order quantity (
                                  {formatNumber(
                                    selectedDelivery?.quantity || 0
                                  )}
                                  )
                                </p>
                              )}

                              {/* Quantity usage indicator */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-600">
                                    Quantity Usage
                                  </span>
                                  <span className="font-medium">
                                    {(
                                      ((editFormData.sendQuantity || 0) /
                                        (selectedDelivery?.quantity || 1)) *
                                      100
                                    ).toFixed(2)}
                                    %
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        ((editFormData.sendQuantity || 0) /
                                          (selectedDelivery?.quantity || 1)) *
                                          100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 mt-1">
                              <div className="flex items-baseline gap-2">
                                <p className="text-lg md:text-xl font-semibold text-gray-900">
                                  {formatNumber(
                                    selectedDelivery?.sendQuantity || 0
                                  )}
                                </p>
                                <span className="text-gray-400">/</span>
                                <p className="text-base md:text-lg text-gray-700">
                                  {formatNumber(
                                    selectedDelivery?.quantity || 0
                                  )}
                                </p>
                                <span className="text-sm text-gray-500 ml-2">
                                  (
                                  {formatNumber(
                                    selectedDelivery?.quantity -
                                      (selectedDelivery?.sendQuantity || 0)
                                  )}{" "}
                                  remaining)
                                </span>
                              </div>

                              {/* Progress bar for visualization */}
                              {selectedDelivery &&
                                selectedDelivery.quantity > 0 && (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-600">
                                        Quantity Sent
                                      </span>
                                      <span className="font-medium">
                                        {(
                                          ((selectedDelivery.sendQuantity ||
                                            0) /
                                            selectedDelivery.quantity) *
                                          100
                                        ).toFixed(2)}
                                        %
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-green-600 h-2 rounded-full"
                                        style={{
                                          width: `${Math.min(
                                            100,
                                            ((selectedDelivery.sendQuantity ||
                                              0) /
                                              selectedDelivery.quantity) *
                                              100
                                          )}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span>0</span>
                                      <span>
                                        Order Quantity:{" "}
                                        {formatNumber(
                                          selectedDelivery.quantity
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remarks - EDITABLE */}
                <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                    Remarks
                  </h3>
                  <div>
                    {isEditing ? (
                      <Textarea
                        value={editFormData.remarks || ""}
                        onChange={(e) =>
                          handleInputChange("remarks", e.target.value)
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
