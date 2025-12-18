import {
  Download,
  Edit,
  Mail,
  MapPin,
  Plus,
  Search,
  Users,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { VendorAddDialog } from "./VendorAddDialog";
import { VendorEditDialog } from "./VendorEditDialog";
import { VendorViewDialog } from "./VendorViewDialog";
import { useVendorStore } from "../hooks/useVendor";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { exportVendorsToPDF } from "../hooks/pdf-export-vendor";
import api from "../lib/api";
import { ConfirmActionDialog } from "./ConfirmActionDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner";

interface VendorManagementProps {
  searchTerm: string;
  onSearchChange?: (term: string) => void;
}

export function VendorManagement({
  searchTerm,
  onSearchChange,
}: VendorManagementProps) {
  const { vendors, loadVendors } = useVendorStore();

  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  useEffect(() => {
    loadVendors();
  }, []);

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
    onSearchChange?.(value);
  };

  const handleRemoveVendor = async (vendorId: string) => {
    try {
      await api.delete(`/vendors/${vendorId}`);
      await loadVendors();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to deactivate vendor"
      );
    }
  };

  const handleAction = (vendor: any, action: "view" | "edit") => {
    setSelectedVendor(vendor);
    if (action === "view") setShowVendorDialog(true);
    if (action === "edit") setShowEditDialog(true);
  };

  const getCountryName = (id: string) =>
    ({
      "1": "India",
      "2": "China",
      "3": "Vietnam",
      "4": "Indonesia",
    }[id] || "Global");

  const getStatusStyles = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "active")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "inactive" || s === "deactivated")
      return "bg-red-50 text-red-700 border-red-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* HEADER */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 md:px-8">
        <div className="max-w-full mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-600 rounded-lg shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Vendor Directory
              </h1>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                {filteredVendors.length} Suppliers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={localSearchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search..."
                className="pl-9 h-9 bg-white border-slate-200 focus-visible:ring-cyan-500"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-slate-200 hidden sm:flex"
              onClick={() =>
                exportVendorsToPDF(filteredVendors, localSearchTerm)
              }
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button
              size="sm"
              className="h-9 bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Add Vendor</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto w-full p-4 md:p-8">
        {/* MOBILE VIEW */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filteredVendors.map((vendor) => (
            <Card
              key={vendor._id}
              className="p-4 border-slate-200 hover:border-cyan-300 transition-all cursor-pointer shadow-sm relative"
              onClick={() => handleAction(vendor, "view")}
            >
              <div className="flex justify-between items-start pr-8">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-cyan-700 font-bold border border-slate-200">
                    {vendor.vendorName?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">
                      {vendor.vendorName}
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {vendor.vendorId}
                    </p>
                  </div>
                </div>
              </div>

              {/* MOBILE ACTION DROPDOWN */}
              <div
                className="absolute top-3 right-2"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={() => handleAction(vendor, "edit")}
                    >
                      <Edit className="w-4 h-4 mr-2" /> Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => handleRemoveVendor(vendor._id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Deactivate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 flex flex-wrap gap-y-2 justify-between items-center border-t border-slate-50 pt-3">
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1.5 py-0 uppercase font-bold ${getStatusStyles(
                    vendor.status
                  )}`}
                >
                  {vendor.status}
                </Badge>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="w-3 h-3" />{" "}
                    {getCountryName(vendor.countryId)}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Users className="w-3 h-3" />{" "}
                    {vendor.contactPerson || "N/A"}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* DESKTOP VIEW */}
        <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Vendor & ID
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Contact
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Location
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVendors.map((vendor) => (
                <tr
                  key={vendor._id}
                  className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => handleAction(vendor, "view")}
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 text-sm">
                      {vendor.vendorName}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {vendor.vendorId}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-semibold text-slate-700">
                      {vendor.contactPerson || "—"}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                      {vendor.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-300" />
                      {getCountryName(vendor.countryId)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 font-bold uppercase ${getStatusStyles(
                        vendor.status
                      )}`}
                    >
                      {vendor.status}
                    </Badge>
                  </td>
                  <td
                    className="px-6 py-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-cyan-600 transition-colors"
                        onClick={() => handleAction(vendor, "edit")}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <ConfirmActionDialog
                        title="Deactivate Vendor"
                        description={`Archive ${vendor.vendorName}?`}
                        onConfirm={() => handleRemoveVendor(vendor._id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* DIALOGS */}
      <VendorViewDialog
        open={showVendorDialog}
        vendor={selectedVendor}
        onOpenChange={setShowVendorDialog}
      />
      <VendorEditDialog
        open={showEditDialog}
        vendor={selectedVendor}
        onOpenChange={setShowEditDialog}
      />
      <VendorAddDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  );
}
