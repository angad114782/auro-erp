import React, { useEffect, useState } from "react";
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
  ChevronLeft,
  ChevronRight,
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
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { VendorEditDialog } from "./VendorEditDialog";
import api from "../lib/api";

interface VendorViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: any;
}

/* =========================
   ORIGINAL HELPERS (UNCHANGED)
========================= */
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
  const [supplyHistory, setSupplyHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!vendor?._id) return;

    const fetchSupplyHistory = async () => {
      try {
        const res = await api.get(`/inventory/vendor/${vendor._id}`);
        setSupplyHistory(
          (res.data.items || []).map((tx: any) => ({
            id: tx._id,
            date: tx.transactionDate || tx.createdAt,
            billNumber: tx.billNumber || "—",
            itemName: tx.itemId?.itemName || "N/A",
            itemCode: tx.itemId?.code || "—",
            quantity: tx.quantity,
            unit: tx.itemId?.quantityUnit || "",
            status: tx.transactionType === "Stock In" ? "Delivered" : "Pending",
            orderValue: "₹0",
            deliveryTime: "—",
            quality: "Good",
          }))
        );
      } catch (err) {
        console.error(err);
      }
    };

    fetchSupplyHistory();
  }, [vendor?._id]);

  if (!vendor) return;
  const isOpen = Boolean(vendor && open);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] md:max-w-6xl w-[95vw] md:w-full max-h-[95vh] md:max-h-[85vh] p-0 md:rounded-lg flex flex-col overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-50 px-4 md:px-8 py-4 md:py-6 bg-linear-to-r from-cyan-50 via-white to-cyan-50 border-b-2 border-gray-200 shadow-sm flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-linear-to-br from-cyan-500 to-cyan-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-lg md:text-xl flex-shrink-0">
                  {(vendor?.vendorName || "N/A").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-lg md:text-2xl lg:text-3xl font-semibold text-gray-900 truncate">
                    {vendor?.vendorName || "Unknown Vendor"}
                  </DialogTitle>
                  <DialogDescription className="text-sm md:text-base lg:text-lg text-gray-600 truncate">
                    Complete vendor profile and supply history
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 md:h-10 md:w-10 p-0 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                </Button>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6">
            {/* Vendor Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-cyan-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">
                  Vendor Information
                </h3>
              </div>

              {/* Vendor Details Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Basic Details Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 md:w-5 md:h-5 text-cyan-600" />
                      <CardTitle className="text-base md:text-lg">
                        Basic Details
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">
                        Vendor Name
                      </p>
                      <p className="text-base font-medium text-gray-900">
                        {vendor.vendorName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">
                        Vendor Code
                      </p>
                      <p className="text-base font-medium text-gray-900">
                        {vendor.vendorId || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">
                        Status
                      </p>
                      <Badge
                        variant={
                          vendor.status === "Active" ? "default" : "secondary"
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
                    <div>
                      <p className="text-sm font-semibold text-gray-600">
                        Location
                      </p>
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
                  </CardContent>
                </Card>

                {/* Contact Information Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 md:w-5 md:h-5 text-cyan-600" />
                      <CardTitle className="text-base md:text-lg">
                        Contact Information
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">
                        Contact Person
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <p className="text-base font-medium text-gray-900">
                          {vendor.contactPerson || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">
                        Phone Number
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="text-base text-gray-900">
                          {vendor.phone || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">
                        Email Address
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="text-base text-gray-900">
                          {vendor.email || "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Supply History */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                      <Package className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">
                      Supply History
                    </h3>
                  </div>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {supplyHistory.length} transactions
                  </Badge>
                </div>

                {/* Mobile Supply History Cards */}
                <div className="md:hidden space-y-4">
                  {supplyHistory.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {new Date(order.date).toLocaleDateString(
                                    "en-GB"
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {order.billNumber}
                                </p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {order.itemName}
                            </p>
                            <p className="text-sm text-gray-500">
                              Code: {order.itemCode}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Quantity</p>
                              <p className="text-sm font-medium">
                                {order.quantity.toLocaleString()} {order.unit}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 border-t">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                {getQualityIcon(order.quality)}
                                <span className="text-sm text-gray-900">
                                  {order.quality}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                Delivered in {order.deliveryTime}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Supply History Table */}
                <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-900">
                            Order Date
                          </th>
                          <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-900">
                            Bill Number
                          </th>
                          <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-900">
                            Item Details
                          </th>
                          <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-900">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {supplyHistory.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {new Date(order.date).toLocaleDateString(
                                      "en-GB"
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(order.date).toLocaleDateString(
                                      "en-GB",
                                      { weekday: "short" }
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {order.billNumber}
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {order.itemName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Code: {order.itemCode}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {order.quantity.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                  {order.unit}
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

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              <div>
                <p className="text-sm md:text-base font-semibold text-gray-900">
                  Vendor Profile Complete
                </p>
                <p className="text-xs md:text-sm text-gray-600 hidden md:block">
                  All vendor information and supply history is up to date
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse md:flex-row gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full md:w-auto"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-700"
                onClick={() => setShowEditDialog(true)}
              >
                <Users className="w-4 h-4 mr-2" />
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
