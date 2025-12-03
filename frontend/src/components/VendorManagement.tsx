import {
  Download,
  Edit,
  Eye,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Users,
  MoreVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useERPStore } from "../lib/data-store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { VendorAddDialog } from "./VendorAddDialog";
import { VendorEditDialog } from "./VendorEditDialog";
import { VendorViewDialog } from "./VendorViewDialog";
import { useVendorStore } from "../hooks/useVendor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

interface VendorManagementProps {
  searchTerm: string;
  onSearchChange?: (term: string) => void;
}

export function VendorManagement({
  searchTerm,
  onSearchChange,
}: VendorManagementProps) {
  const { vendors, loadVendors } = useVendorStore();
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    loadVendors();
  }, []);

  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredVendors = vendors.filter(
    (vendor) =>
      (vendor.vendorName?.toLowerCase() || "").includes(
        localSearchTerm.toLowerCase()
      ) ||
      (vendor.vendorId?.toLowerCase() || "").includes(
        localSearchTerm.toLowerCase()
      ) ||
      (vendor.contactPerson?.toLowerCase() || "").includes(
        localSearchTerm.toLowerCase()
      )
  );

  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const toggleVendorExpansion = (vendorId: string) => {
    setExpandedVendors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(vendorId)) {
        newSet.delete(vendorId);
      } else {
        newSet.add(vendorId);
      }
      return newSet;
    });
  };

  const handleViewVendor = (vendor: any) => {
    setSelectedVendor(vendor);
    setShowVendorDialog(true);
  };

  const handleEditVendor = (vendor: any) => {
    setSelectedVendor(vendor);
    setShowEditDialog(true);
  };

  return (
    <div className="w-full">
      {/* Vendor Navigation Bar */}
      <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 pb-2 md:pb-4">
        {/* Top Navigation with Search and Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between w-full border-b border-gray-200 pb-3 gap-4">
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-[#0c9dcb]" />
            <div className="min-w-0">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                Vendor Directory
              </h2>
              <p className="text-xs md:text-sm text-gray-500 truncate">
                Manage supplier relationships and performance
              </p>
            </div>
          </div>

          {/* Right: Search and Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 lg:w-80">
              <Input
                value={localSearchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search vendors..."
                className="pl-10 pr-4 h-9 text-sm"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>

            {/* Total Vendors */}
            <div className="px-3 py-2 border border-[#0c9dcb] rounded-lg sm:w-auto w-full text-center">
              <span className="text-[#0c9dcb] font-semibold text-sm">
                Total Vendors:{" "}
                {filteredVendors.length.toString().padStart(2, "0")}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex-1 sm:flex-none"
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>

              <Button
                className="bg-[#0c9dcb] hover:bg-[#26b4e0] px-3 py-2 rounded-lg h-9 flex-1 sm:flex-none"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2 text-white" />
                <span className="text-white font-semibold text-sm">
                  Add Vendor
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden p-4 space-y-4">
        {filteredVendors.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No vendors found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search terms
            </p>
          </div>
        ) : (
          filteredVendors.map((vendor) => {
            const isExpanded = expandedVendors.has(vendor.id);
            return (
              <Card key={vendor.id} className="overflow-hidden">
                <CardHeader
                  className="pb-3 cursor-pointer"
                  onClick={() => toggleVendorExpansion(vendor.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 bg-linear-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {(vendor.vendorName || "N/A").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold truncate">
                          {vendor.vendorName || "No Name"}
                        </CardTitle>
                        <p className="text-sm text-gray-600 truncate">
                          {vendor.vendorId || "No Code"}
                        </p>
                        <Badge
                          variant={
                            vendor.status === "Active" ? "default" : "secondary"
                          }
                          className="mt-1 text-xs"
                        >
                          {vendor.status}
                        </Badge>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Contact Information */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500">
                          Contact Information
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3 text-gray-400" />
                            <p className="text-sm">
                              {vendor.contactPerson || "No Contact"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <p className="text-sm">
                              {vendor.phone || "No Phone"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <p className="text-sm truncate">
                              {vendor.email || "No Email"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Item Information */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500">
                          Item Information
                        </p>
                        <p className="text-sm font-medium">
                          {vendor.itemName || "No Item"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Code: {vendor.itemCode || "No Code"}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500">
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
                          <p className="text-sm font-medium text-gray-700">
                            "{vendor.brand || "No Brand"}"
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleViewVendor(vendor)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleEditVendor(vendor)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Send Email</DropdownMenuItem>
                            <DropdownMenuItem>Deactivate</DropdownMenuItem>
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
      <div className="hidden md:block mx-4 lg:mx-6 mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor Details
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Information
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                  <tr
                    className="hover:bg-gray-50 transition-colors"
                    key={vendor.id}
                  >
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-linear-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-semibold">
                            {(vendor.vendorName || "N/A")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-3 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {vendor.vendorName || "No Name"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vendor.vendorId || "No Code"}
                          </div>
                          <div className="text-xs text-gray-400">
                            Status:{" "}
                            <span
                              className={
                                vendor.status === "Active"
                                  ? "text-green-600 font-medium"
                                  : "text-gray-600"
                              }
                            >
                              {vendor.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 text-gray-400" />
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {vendor.contactPerson || "No Contact"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <div className="text-sm text-gray-500 truncate">
                            {vendor.phone || "No Phone"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <div className="text-sm text-gray-500 truncate">
                            {vendor.email || "No Email"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {vendor.itemName || "No Item"}
                        </div>
                        <div className="text-sm text-gray-500">
                          Code: {vendor.itemCode || "No Code"}
                        </div>
                        <div className="text-xs font-medium text-gray-700">
                          "{vendor.brand || "No Brand"}"
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <div className="text-xs text-gray-500">
                            {vendor.countryId === "1"
                              ? "India"
                              : vendor.countryId === "2"
                              ? "China"
                              : vendor.countryId === "3"
                              ? "Vietnam"
                              : vendor.countryId === "4"
                              ? "Indonesia"
                              : "Unknown"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 h-8 px-3"
                          onClick={() => handleViewVendor(vendor)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-200 text-green-600 hover:bg-green-50 h-8 px-3"
                          onClick={() => handleEditVendor(vendor)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Send Email</DropdownMenuItem>
                            <DropdownMenuItem>Deactivate</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">No vendors found</p>
                      {localSearchTerm && (
                        <p className="text-sm text-gray-400">
                          Try adjusting your search terms
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500 text-center sm:text-left">
              Showing {filteredVendors.length} of {filteredVendors.length}{" "}
              vendors
              {localSearchTerm && ` (filtered by "${localSearchTerm}")`}
            </p>

            <div className="flex items-center gap-2">
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

      {/* Dialogs */}
      <VendorViewDialog
        open={showVendorDialog}
        vendor={selectedVendor}
        onOpenChange={(open: boolean) => {
          setShowVendorDialog(open);
          if (!open) setSelectedVendor(null);
        }}
      />

      <VendorEditDialog
        open={showEditDialog}
        vendor={selectedVendor}
        onOpenChange={(open: boolean) => {
          setShowEditDialog(open);
          if (!open) setSelectedVendor(null);
        }}
      />

      <VendorAddDialog
        open={showAddDialog}
        onOpenChange={(open: boolean) => {
          setShowAddDialog(open);
        }}
      />
    </div>
  );
}
