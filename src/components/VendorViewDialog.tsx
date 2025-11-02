import React, { useState } from "react";
import {
  Users,
  Package,
  Calendar,
  MapPin,
  Phone,
  Mail,
  IndianRupee,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Building,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { VendorEditDialog } from "./VendorEditDialog";

interface VendorViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: any;
}

// Mock supply history data
const getSupplyHistory = (vendorId: string) => [
  {
    id: "1",
    date: "2024-09-15",
    billNumber: "BILL-2024-001",
    itemName: "Premium Leather Sheets",
    itemCode: "PLS-001",
    quantity: 500,
    unit: "piece",
    status: "Delivered",
    orderValue: "₹1,25,000",
    deliveryTime: "3 days",
    quality: "Excellent",
  },
  {
    id: "2",
    date: "2024-09-08",
    billNumber: "BILL-2024-002",
    itemName: "Rubber Soles - Size 8",
    itemCode: "RS-008",
    quantity: 200,
    unit: "pair",
    status: "Delivered",
    orderValue: "₹45,000",
    deliveryTime: "2 days",
    quality: "Good",
  },
  {
    id: "3",
    date: "2024-09-01",
    billNumber: "BILL-2024-003",
    itemName: "Cotton Shoe Laces",
    itemCode: "CSL-001",
    quantity: 1000,
    unit: "piece",
    status: "In Transit",
    orderValue: "₹8,500",
    deliveryTime: "1 day",
    quality: "Pending",
  },
  {
    id: "4",
    date: "2024-08-28",
    billNumber: "BILL-2024-004",
    itemName: "Metal Eyelets",
    itemCode: "ME-001",
    quantity: 2000,
    unit: "piece",
    status: "Delivered",
    orderValue: "₹12,000",
    deliveryTime: "4 days",
    quality: "Excellent",
  },
  {
    id: "5",
    date: "2024-08-20",
    billNumber: "BILL-2024-005",
    itemName: "Leather Polish",
    itemCode: "LP-001",
    quantity: 50,
    unit: "bottle",
    status: "Delivered",
    orderValue: "₹3,500",
    deliveryTime: "2 days",
    quality: "Good",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-800 border-green-200";
    case "In Transit":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Delayed":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getQualityIcon = (quality: string) => {
  switch (quality) {
    case "Excellent":
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case "Good":
      return <TrendingUp className="w-4 h-4 text-blue-600" />;
    case "Pending":
      return <Clock className="w-4 h-4 text-yellow-600" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-gray-600" />;
  }
};

export function VendorViewDialog({
  open,
  onOpenChange,
  vendor,
}: VendorViewDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Debug logging
  console.log("VendorViewDialog rendered with:", {
    open,
    vendor,
  });

  if (!vendor) {
    console.log("No vendor provided to VendorViewDialog");
    return null;
  }

  const supplyHistory = getSupplyHistory(vendor.id);
  const totalOrders = supplyHistory.length;
  const completedOrders = supplyHistory.filter(
    (order) => order.status === "Delivered",
  ).length;
  const totalValue = supplyHistory.reduce((sum, order) => {
    const value = parseInt(
      order.orderValue.replace(/[₹,]/g, ""),
    );
    return sum + value;
  }, 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[96vw] !w-[96vw] max-h-[95vh] overflow-hidden p-0 m-0 top-[2.5vh] translate-y-0 flex flex-col">
          {/* Sticky Header Section */}
          <div className="sticky top-0 z-50 px-12 py-8 bg-gradient-to-r from-cyan-50 via-white to-cyan-50 border-b-2 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-xl">
                  {(vendor.vendorName || "N/A")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <DialogTitle className="text-4xl font-semibold text-gray-900 mb-2">
                    {vendor.vendorName || "Unknown Vendor"}
                  </DialogTitle>
                  <DialogDescription className="text-xl text-gray-600">
                    Complete vendor profile and supply history
                    management
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 border-cyan-200 text-cyan-600 hover:bg-cyan-50"
                  type="button"
                  onClick={() => {
                    // Export functionality - can be extended to generate CSV/Excel
                    console.log('Exporting vendor data for:', vendor.vendorName);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
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
            <div className="px-12 py-10">
              {/* Vendor Information Section */}
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Vendor Information
                  </h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200"></div>
                </div>

                {/* Vendor Details Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                  {/* Basic Details */}
                  <div className="xl:col-span-2 space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Building className="w-5 h-5 text-cyan-600" />
                        Basic Details
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-semibold text-gray-600">
                            Vendor Name
                          </label>
                          <p className="text-base font-medium text-gray-900">
                            {vendor.vendorName || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-600">
                            Vendor Code
                          </label>
                          <p className="text-base font-medium text-gray-900">
                            {vendor.vendorId || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-600">
                            Status
                          </label>
                          <div className="mt-1">
                            <Badge
                              variant={
                                vendor.status === "Active"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                vendor.status === "Active"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {vendor.status}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-600">
                            Location
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <p className="text-base text-gray-900">
                              {vendor.countryId === "1"
                                ? "India"
                                : vendor.countryId === "2"
                                  ? "China"
                                  : vendor.countryId === "3"
                                    ? "Vietnam"
                                    : vendor.countryId === "4"
                                      ? "Indonesia"
                                      : "Unknown"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="xl:col-span-2 space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-cyan-600" />
                        Contact Information
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-semibold text-gray-600">
                            Contact Person
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <p className="text-base font-medium text-gray-900">
                              {vendor.contactPerson || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-600">
                            Phone Number
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <p className="text-base text-gray-900">
                              {vendor.phone || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-600">
                            Email Address
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <p className="text-base text-gray-900">
                              {vendor.email || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supply Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center gap-3">
                      <Package className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-blue-600">
                          Total Orders
                        </p>
                        <p className="text-2xl font-bold text-blue-900">
                          {totalOrders}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm font-semibold text-green-600">
                          Completed
                        </p>
                        <p className="text-2xl font-bold text-green-900">
                          {completedOrders}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-sm font-semibold text-purple-600">
                          Success Rate
                        </p>
                        <p className="text-2xl font-bold text-purple-900">
                          {Math.round(
                            (completedOrders / totalOrders) * 100,
                          )}
                          %
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-6 border border-cyan-200">
                    <div className="flex items-center gap-3">
                      <IndianRupee className="w-8 h-8 text-cyan-600" />
                      <div>
                        <p className="text-sm font-semibold text-cyan-600">
                          Total Value
                        </p>
                        <p className="text-2xl font-bold text-cyan-900">
                          ₹{(totalValue / 100000).toFixed(1)}L
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              {/* Supply History Section */}
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Supply History
                  </h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200"></div>
                  <Badge
                    variant="secondary"
                    className="text-base px-3 py-1"
                  >
                    {supplyHistory.length} transactions
                  </Badge>
                </div>

                {/* Supply History Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            Order Date
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            Bill Number
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            Item Details
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            Quantity & Unit
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            Order Value
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            Quality & Delivery
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {supplyHistory.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {new Date(
                                      order.date,
                                    ).toLocaleDateString("en-GB")}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(
                                      order.date,
                                    ).toLocaleDateString(
                                      "en-GB",
                                      {
                                        weekday: "short",
                                      },
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {order.billNumber}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Invoice Ref
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {order.itemName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Code: {order.itemCode}
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {order.quantity.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                  {order.unit}
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <IndianRupee className="w-4 h-4 text-green-600" />
                                <div className="text-sm font-medium text-gray-900">
                                  {order.orderValue}
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  {getQualityIcon(order.quality)}
                                  <span className="text-sm text-gray-900">
                                    {order.quality}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  Delivered in{" "}
                                  {order.deliveryTime}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 px-12 py-8 flex justify-between items-center shadow-lg z-50">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-base font-semibold text-gray-900">
                  Vendor Profile Complete
                </p>
                <p className="text-sm text-gray-600">
                  All vendor information and supply history is up
                  to date
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-3 text-base border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => onOpenChange(false)}
                type="button"
              >
                Close
              </Button>
              <Button
                size="lg"
                className="px-8 py-3 text-base bg-cyan-600 hover:bg-cyan-700"
                type="button"
                onClick={() => setShowEditDialog(true)}
              >
                <Users className="w-5 h-5 mr-3" />
                Edit Vendor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <VendorEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        vendor={vendor}
      />
    </>
  );
}