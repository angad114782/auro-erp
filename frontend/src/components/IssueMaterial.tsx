import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search,
  Trash2,
  FileText,
  Filter,
  Package,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  RefreshCw,
} from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

import api from "../lib/api";

// Types
interface MaterialItem {
  _id: string;
  itemId: string;
  name: string;
  specification: string;
  requirement: number;
  available: number;
  issued: number;
  balance: number;
}

interface ComponentItem extends MaterialItem {}

interface Project {
  productName: string;
}

interface MaterialRequisition {
  _id: string;
  cardNumber: string;
  projectId: Project;
  requestedBy: string;
  status: "Pending to Store" | "Partially Issued" | "Issued";
  upper: MaterialItem[];
  materials: MaterialItem[];
  components: ComponentItem[];
  packaging: MaterialItem[];
  misc: MaterialItem[];
  createdAt: string;
}

interface IssueMaterialProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

// Helper Components
const Info = ({
  label,
  value,
  highlight = false,
  status,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  status?: string;
}) => (
  <div className="min-w-0">
    <p className="text-gray-500 text-xs md:text-sm mb-1 truncate">{label}</p>
    <p
      className={`font-semibold text-sm md:text-base truncate ${
        highlight
          ? status === "Issued"
            ? "text-green-600"
            : status === "Partially Issued"
            ? "text-yellow-600"
            : "text-red-600"
          : "text-gray-900"
      }`}
    >
      {value || "-"}
    </p>
  </div>
);

interface IssueRowProps {
  item: MaterialItem | ComponentItem;
  issuedQuantities: Record<string, number | string>;
  onIssueChange: (id: string, qty: number | string) => void;
}

const IssueRow = ({ item, issuedQuantities, onIssueChange }: IssueRowProps) => {
  const itemId = item.itemId || item._id;
  const req = Number(item.requirement || 0);
  const avail = Number(item.available || 0);
  const alreadyIssued = Number(item.issued || 0);
  const issuedValue = issuedQuantities[itemId] || 0;
  const newIssuedAmount =
    typeof issuedValue === "string"
      ? parseFloat(issuedValue) || 0
      : issuedValue || 0;
  const maxIssuable = Math.max(0, req - avail);
  const balanceAfter = Math.max(0, req - (avail + newIssuedAmount));

  const handleInputChange = (value: string) => {
    // Allow empty string, numbers, and decimals
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      if (value === "") {
        onIssueChange(itemId, 0);
        return;
      }

      // If the value ends with a dot, keep it for user typing
      if (value.endsWith(".")) {
        onIssueChange(itemId, value);
        return;
      }

      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        onIssueChange(itemId, 0);
        return;
      }

      // Allow decimals and don't round values
      if (numValue < 0) {
        onIssueChange(itemId, 0);
      } else if (numValue > maxIssuable) {
        onIssueChange(itemId, maxIssuable);
      } else {
        onIssueChange(itemId, numValue);
      }
    }
  };

  // Format the display value to show decimals properly
  const getDisplayValue = () => {
    const value = issuedQuantities[itemId];
    if (value === undefined || value === null) return "";

    // If it's a string (like "0."), return it as is
    if (typeof value === "string" && (value.endsWith(".") || value === "")) {
      return value;
    }

    // If it's 0, return empty string
    if (Number(value) === 0) return "";

    // Return the number as string
    const numValue = Number(value);
    return numValue.toString();
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-6 py-3 border-r">{item.name}</td>
      <td className="px-6 py-3 border-r">{item.specification || "-"}</td>
      <td className="px-6 py-3 border-r text-center font-semibold text-blue-700">
        {req}
      </td>
      <td className="px-6 py-3 border-r text-center">{avail}</td>
      <td className="px-6 py-3 border-r text-center font-semibold text-green-600">
        {alreadyIssued}
      </td>
      <td className="px-6 py-3 border-r text-center">
        <div className="flex flex-col items-center gap-1">
          <Input
            type="text"
            inputMode="decimal"
            value={getDisplayValue()}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-28 text-center text-base"
            placeholder="0"
            onBlur={(e) => {
              // When user leaves the field, clean up trailing dots
              if (e.target.value.endsWith(".")) {
                const numValue = parseFloat(e.target.value);
                if (!isNaN(numValue)) {
                  handleInputChange(numValue.toString());
                } else {
                  handleInputChange("0");
                }
              }
            }}
          />
          <div className="text-xs text-gray-500">Max: {maxIssuable}</div>
        </div>
      </td>
      <td className="px-6 py-3 text-center font-semibold">
        <div className="flex flex-col">
          <span
            className={balanceAfter === 0 ? "text-green-600" : "text-red-600"}
          >
            {balanceAfter}
          </span>
          <span className="text-xs text-gray-500">
            Will replace: {alreadyIssued} → {newIssuedAmount}
          </span>
        </div>
      </td>
    </tr>
  );
};

const MobileIssueItem = ({
  item,
  issuedQuantities,
  onIssueChange,
}: IssueRowProps) => {
  const itemId = item.itemId || item._id;
  const req = Number(item.requirement || 0);
  const avail = Number(item.available || 0);
  const alreadyIssued = Number(item.issued || 0);
  const issuedValue = issuedQuantities[itemId] || 0;
  const newIssuedAmount =
    typeof issuedValue === "string"
      ? parseFloat(issuedValue) || 0
      : issuedValue || 0;
  const maxIssuable = Math.max(0, req - avail);
  const balanceAfter = Math.max(0, req - (avail + newIssuedAmount));

  const handleInputChange = (value: string) => {
    // Allow empty string, numbers, and decimals
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      if (value === "") {
        onIssueChange(itemId, 0);
        return;
      }

      // If the value ends with a dot, keep it for user typing
      if (value.endsWith(".")) {
        onIssueChange(itemId, value);
        return;
      }

      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        onIssueChange(itemId, 0);
        return;
      }

      // Allow decimals and don't round values
      if (numValue < 0) {
        onIssueChange(itemId, 0);
      } else if (numValue > maxIssuable) {
        onIssueChange(itemId, maxIssuable);
      } else {
        onIssueChange(itemId, numValue);
      }
    }
  };

  // Format the display value to show decimals properly
  const getDisplayValue = () => {
    const value = issuedQuantities[itemId];
    if (value === undefined || value === null) return "";

    // If it's a string (like "0."), return it as is
    if (typeof value === "string" && (value.endsWith(".") || value === "")) {
      return value;
    }

    // If it's 0, return empty string
    if (Number(value) === 0) return "";

    // Return the number as string
    const numValue = Number(value);
    return numValue.toString();
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{item.name}</p>
          <p className="text-sm text-gray-600 mt-1">
            {item.specification || "No specification"}
          </p>
        </div>
        <Badge
          variant={balanceAfter === 0 ? "default" : "destructive"}
          className="ml-2 shrink-0"
        >
          {balanceAfter} left
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-xs text-gray-500 mb-1">Required</p>
          <p className="font-semibold text-blue-700">{req}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Available</p>
          <p className="font-semibold">{avail}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Currently Issued</p>
          <p className="font-semibold text-green-600">{alreadyIssued}</p>
        </div>
      </div>

      <div className="pt-2">
        <p className="text-xs text-gray-500 mb-2">Set New Issued Quantity</p>
        <div className="flex items-center gap-3">
          <Input
            type="text"
            inputMode="decimal"
            value={getDisplayValue()}
            onChange={(e) => handleInputChange(e.target.value)}
            className="flex-1 text-center"
            placeholder="0"
            onBlur={(e) => {
              // When user leaves the field, clean up trailing dots
              if (e.target.value.endsWith(".")) {
                const numValue = parseFloat(e.target.value);
                if (!isNaN(numValue)) {
                  handleInputChange(numValue.toString());
                } else {
                  handleInputChange("0");
                }
              }
            }}
          />
          <span className="text-sm text-gray-500 whitespace-nowrap shrink-0">
            Max: {maxIssuable}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2 italic">
          This will replace the current issued amount of {alreadyIssued}
        </p>
      </div>

      <div className="pt-2">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500 mb-1">New issued amount:</p>
            <p className="font-semibold text-green-700">{newIssuedAmount}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Balance remaining:</p>
            <p
              className={`font-semibold ${
                balanceAfter === 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {balanceAfter}
            </p>
          </div>
        </div>
      </div>

      <Separator className="mt-4" />
    </div>
  );
};

interface MaterialSectionsProps {
  sections: Array<{
    label: string;
    color: string;
    items: Array<MaterialItem | ComponentItem>;
  }>;
  issuedQuantities: Record<string, number | string>;
  onIssueChange: (id: string, qty: number | string) => void;
}

const MaterialSections = ({
  sections,
  issuedQuantities,
  onIssueChange,
}: MaterialSectionsProps) => {
  return (
    <div className="space-y-6">
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {sections.map((sec) => (
          <Card key={sec.label} className="overflow-hidden">
            <div
              className={`${sec.color} px-4 py-3 font-semibold flex justify-between items-center`}
            >
              <span className="text-sm">{sec.label}</span>
              <Badge variant="secondary" className="text-xs">
                {sec.items.length} items
              </Badge>
            </div>
            <CardContent className="p-0">
              {sec.items.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-400">
                  No items
                </div>
              ) : (
                <div className="divide-y">
                  {sec.items.map((item) => (
                    <MobileIssueItem
                      key={item.itemId || item._id}
                      item={item}
                      issuedQuantities={issuedQuantities}
                      onIssueChange={onIssueChange}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-xl border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse"
            style={{ minWidth: "1200px" }}
          >
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-6 py-3 border-r text-left font-semibold min-w-[200px]">
                  ITEM
                </th>
                <th className="px-6 py-3 border-r text-left font-semibold min-w-[250px]">
                  SPECIFICATION
                </th>
                <th className="px-6 py-3 border-r text-center font-semibold min-w-[120px]">
                  REQUIRED
                </th>
                <th className="px6 py-3 border-r text-center font-semibold min-w-[120px]">
                  AVAILABLE
                </th>
                <th className="px-6 py-3 border-r text-center font-semibold min-w-[140px]">
                  ALREADY ISSUED
                </th>
                <th className="px-6 py-3 border-r text-center font-semibold min-w-[180px]">
                  ISSUE NOW
                </th>
                <th className="px-6 py-3 text-center font-semibold min-w-[180px]">
                  BALANCE AFTER ISSUE
                </th>
              </tr>
            </thead>

            <tbody>
              {sections.map((sec) => (
                <React.Fragment key={sec.label}>
                  <tr className={`${sec.color} border-y`}>
                    <td colSpan={7} className="px-6 py-2 font-semibold text-sm">
                      {sec.label}
                    </td>
                  </tr>

                  {sec.items.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-400 text-sm"
                      >
                        No items in this category
                      </td>
                    </tr>
                  )}

                  {sec.items.map((item) => (
                    <IssueRow
                      key={item.itemId || item._id}
                      item={item}
                      issuedQuantities={issuedQuantities}
                      onIssueChange={onIssueChange}
                    />
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface MaterialIssueDialogProps {
  requisition: MaterialRequisition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const MaterialIssueDialog = ({
  requisition,
  open,
  onOpenChange,
  onSuccess,
}: MaterialIssueDialogProps) => {
  const [issuedQuantities, setIssuedQuantities] = useState<
    Record<string, number | string>
  >({});

  useEffect(() => {
    if (requisition) {
      const initialQuantities: Record<string, number | string> = {};

      // Process all 5 categories
      [
        ...(requisition.upper || []),
        ...(requisition.materials || []),
        ...(requisition.components || []),
        ...(requisition.packaging || []),
        ...(requisition.misc || []),
      ].forEach((item) => {
        const itemId = String(item.itemId || item._id);
        initialQuantities[itemId] = Number(item.issued || 0);
      });

      setIssuedQuantities(initialQuantities);
    }
  }, [requisition]);

  const handleIssueQuantityChange = useCallback(
    (id: string, qty: number | string) => {
      setIssuedQuantities((prev) => ({
        ...prev,
        [id]: qty,
      }));
    },
    []
  );

  const getCategorizedSections = useCallback(() => {
    if (!requisition) {
      return {
        upper: [],
        materials: [],
        components: [],
        packaging: [],
        misc: [],
      };
    }

    return {
      upper: requisition.upper || [],
      materials: requisition.materials || [],
      components: requisition.components || [],
      packaging: requisition.packaging || [],
      misc: requisition.misc || [],
    };
  }, [requisition]);

  const handleIssueMaterials = async () => {
    if (!requisition) return;

    try {
      const updateItems = (items: MaterialItem[]) => {
        return items.map((item) => {
          const itemId = item.itemId || item._id;
          const issuedValue = issuedQuantities[String(itemId)];
          const newIssuedAmount =
            typeof issuedValue === "string"
              ? parseFloat(issuedValue) || 0
              : issuedValue || 0;
          const available = Number(item.available || 0);
          const requirement = Number(item.requirement || 0);

          const balance = Math.max(
            0,
            requirement - (available + newIssuedAmount)
          );

          return {
            ...item,
            issued: newIssuedAmount,
            balance: parseFloat(balance.toFixed(4)),
          };
        });
      };

      const updatedUpper = updateItems(requisition.upper || []);
      const updatedMaterials = updateItems(requisition.materials || []);
      const updatedComponents = updateItems(requisition.components || []);
      const updatedPackaging = updateItems(requisition.packaging || []);
      const updatedMisc = updateItems(requisition.misc || []);

      // Calculate totals for all categories
      const allItems = [
        ...updatedUpper,
        ...updatedMaterials,
        ...updatedComponents,
        ...updatedPackaging,
        ...updatedMisc,
      ];

      const totalRequired = allItems.reduce(
        (sum, item) => sum + Number(item.requirement || 0),
        0
      );
      const totalIssued = allItems.reduce(
        (sum, item) => sum + Number(item.issued || 0),
        0
      );

      let newStatus = requisition.status;
      if (totalIssued >= totalRequired) {
        newStatus = "Issued";
      } else if (totalIssued > 0) {
        newStatus = "Partially Issued";
      } else {
        newStatus = "Pending to Store";
      }

      const body = {
        upper: updatedUpper,
        materials: updatedMaterials,
        components: updatedComponents,
        packaging: updatedPackaging,
        misc: updatedMisc,
        status: newStatus,
      };

      await api.put(`/material-requests/${requisition._id}`, body);
      onSuccess();
      onOpenChange(false);
      alert("Materials issued successfully!");
    } catch (err) {
      console.error("Issue material failed", err);
      alert("Failed to issue materials.");
    }
  };

  if (!requisition) return null;

  const sections = getCategorizedSections();
  const categorizedSections = [
    {
      label: "UPPER MATERIAL",
      color: "bg-cyan-100 text-cyan-900",
      items: sections.upper,
    },
    {
      label: "MATERIAL USED",
      color: "bg-cyan-200 text-cyan-900",
      items: sections.materials,
    },
    {
      label: "COMPONENT USED",
      color: "bg-purple-100 text-purple-900",
      items: sections.components,
    },
    {
      label: "PACKAGING USED",
      color: "bg-yellow-100 text-yellow-900",
      items: sections.packaging,
    },
    {
      label: "MISCELLANEOUS USED",
      color: "bg-rose-100 text-rose-900",
      items: sections.misc,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed left-1/2 top-1/2 w-[95vw] h-[90vh] -translate-x-1/2 -translate-y-1/2 p-0 flex flex-col overflow-hidden rounded-xl shadow-2xl border bg-white"
        style={{
          maxWidth: "1600px",
          maxHeight: "95vh",
          minWidth: "300px",
        }}
      >
        <div className="sticky top-0 z-50 px-6 py-4 bg-white border-b shadow-sm flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-semibold text-gray-900">
                Issue Material
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Issue materials for {requisition.cardNumber}
              </DialogDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full hover:bg-gray-100 h-10 w-10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
          <Card className="bg-gray-50 border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold">
                  Production Card Details
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Info label="Card Number" value={requisition.cardNumber} />
                <Info
                  label="Product"
                  value={requisition.projectId?.productName}
                />
                <Info label="Requested By" value={requisition.requestedBy} />
                <Info
                  label="Status"
                  value={requisition.status}
                  highlight
                  status={requisition.status}
                />
              </div>
            </CardContent>
          </Card>

          <MaterialSections
            sections={categorizedSections}
            issuedQuantities={issuedQuantities}
            onIssueChange={handleIssueQuantityChange}
          />
        </div>

        <div className="sticky bottom-0 p-4 border-t bg-white flex justify-end shrink-0">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]"
              onClick={handleIssueMaterials}
            >
              Issue Materials
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Mobile Card Component
interface MobileRequisitionCardProps {
  requisition: MaterialRequisition;
  isExpanded: boolean;
  onToggle: () => void;
  onIssue: () => void;
  onDelete: () => void;
}

const MobileRequisitionCard = ({
  requisition,
  isExpanded,
  onToggle,
  onIssue,
  onDelete,
}: MobileRequisitionCardProps) => {
  const totalItems = [
    ...(requisition.upper || []),
    ...(requisition.materials || []),
    ...(requisition.components || []),
    ...(requisition.packaging || []),
    ...(requisition.misc || []),
  ];
  const totalRequired = totalItems.reduce(
    (sum, item) => sum + Number(item.requirement || 0),
    0
  );
  const totalIssued = totalItems.reduce(
    (sum, item) => sum + Number(item.issued || 0),
    0
  );
  const progress = totalRequired > 0 ? (totalIssued / totalRequired) * 100 : 0;

  return (
    <Card key={requisition._id} className="overflow-hidden">
      <CardHeader className="pb-3 cursor-pointer" onClick={onToggle}>
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
              <FileText className="text-blue-600 w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold truncate">
                {requisition.cardNumber || "N/A"}
              </CardTitle>
              <p className="text-sm text-gray-600 truncate">
                {requisition.projectId?.productName || "-"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      progress >= 100
                        ? "bg-green-500"
                        : progress > 0
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 shrink-0">
                  {totalIssued}/{totalRequired}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                requisition.status === "Pending to Store"
                  ? "destructive"
                  : requisition.status === "Issued"
                  ? "default"
                  : requisition.status === "Partially Issued"
                  ? "secondary"
                  : "outline"
              }
              className="text-xs"
            >
              {requisition.status}
            </Badge>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Requested By</p>
                <p className="text-sm font-medium">
                  {requisition.requestedBy || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Request Date</p>
                <p className="text-sm font-medium">
                  {new Date(requisition.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Upper</p>
                <p className="text-sm font-medium">
                  {requisition.upper?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Materials</p>
                <p className="text-sm font-medium">
                  {requisition.materials?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Components</p>
                <p className="text-sm font-medium">
                  {requisition.components?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Packaging</p>
                <p className="text-sm font-medium">
                  {requisition.packaging?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Misc</p>
                <p className="text-sm font-medium">
                  {requisition.misc?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Issued</p>
                <p className="text-sm font-medium text-green-600">
                  {totalIssued}/{totalRequired}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={onIssue}
              >
                <Send className="w-4 h-4 mr-2" />
                {requisition.status === "Issued" ? "View/Update" : "Issue"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-red-600" onClick={onDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onIssue}>
                    <FileText className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Main Component
export function IssueMaterial({
  searchTerm,
  onSearchChange,
}: IssueMaterialProps) {
  const [materialRequisitions, setMaterialRequisitions] = useState<
    MaterialRequisition[]
  >([]);
  const [selectedRequisition, setSelectedRequisition] =
    useState<MaterialRequisition | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const fetchMaterialList = useCallback(async () => {
    try {
      const res = await api.get(`/material-requests`);
      setMaterialRequisitions(res.data.items || []);
    } catch (err) {
      console.error("Failed to fetch material list", err);
    }
  }, []);

  useEffect(() => {
    fetchMaterialList();
  }, [fetchMaterialList]);

  const filteredData = useMemo(() => {
    return materialRequisitions.filter((req) => {
      const card = req.cardNumber || "";
      const project = req.projectId?.productName || "";
      const search = searchTerm.toLowerCase();
      return (
        card.toLowerCase().includes(search) ||
        project.toLowerCase().includes(search)
      );
    });
  }, [materialRequisitions, searchTerm]);

  const toggleCardExpansion = useCallback((cardId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (
        window.confirm("Are you sure you want to delete this material request?")
      ) {
        try {
          await api.delete(`/material-requests/${id}`);
          fetchMaterialList();
        } catch (err) {
          console.error("Delete failed", err);
          alert("Failed to delete material request");
        }
      }
    },
    [fetchMaterialList]
  );

  // Desktop Table Component
  const DesktopTable = ({
    requisitions,
    onIssue,
    onDelete,
  }: {
    requisitions: MaterialRequisition[];
    onIssue: (req: MaterialRequisition) => void;
    onDelete: (id: string) => void;
  }) => {
    return (
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 min-w-[180px]">
                  Card Number
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 min-w-[250px]">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 min-w-[150px]">
                  Requested By
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 min-w-[200px]">
                  Material Counts
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 min-w-[200px]">
                  Issued Progress
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 min-w-[150px]">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 min-w-[200px]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {requisitions.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState />
                  </td>
                </tr>
              ) : (
                requisitions.map((req) => {
                  const totalItems = [
                    ...(req.upper || []),
                    ...(req.materials || []),
                    ...(req.components || []),
                    ...(req.packaging || []),
                    ...(req.misc || []),
                  ];
                  const totalRequired = totalItems.reduce(
                    (sum, item) => sum + Number(item.requirement || 0),
                    0
                  );
                  const totalIssued = totalItems.reduce(
                    (sum, item) => sum + Number(item.issued || 0),
                    0
                  );
                  const progress =
                    totalRequired > 0 ? (totalIssued / totalRequired) * 100 : 0;

                  return (
                    <tr key={req._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center shrink-0">
                            <FileText className="text-blue-600 w-5 h-5" />
                          </div>
                          <div className="font-medium text-gray-900">
                            {req.cardNumber}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 truncate">
                            {req.projectId?.productName || "-"}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {req.requestedBy}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">U:</span>{" "}
                            {req.upper?.length || 0} |
                            <span className="font-medium"> M:</span>{" "}
                            {req.materials?.length || 0} |
                            <span className="font-medium"> C:</span>{" "}
                            {req.components?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">P:</span>{" "}
                            {req.packaging?.length || 0} |
                            <span className="font-medium"> Misc:</span>{" "}
                            {req.misc?.length || 0}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                progress >= 100
                                  ? "bg-green-500"
                                  : progress > 0
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-700 min-w-[60px] shrink-0">
                            {totalIssued}/{totalRequired}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            req.status === "Pending to Store"
                              ? "destructive"
                              : req.status === "Issued"
                              ? "default"
                              : req.status === "Partially Issued"
                              ? "secondary"
                              : "outline"
                          }
                          className="font-semibold"
                        >
                          {req.status}
                        </Badge>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => onIssue(req)}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            {req.status === "Issued"
                              ? "View/Update"
                              : req.status === "Partially Issued"
                              ? "Issue More"
                              : "Issue"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                            onClick={() => onDelete(req._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Empty State Component
  const EmptyState = () => (
    <div className="text-center py-16 text-gray-500 bg-white rounded-lg border">
      <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
      <p className="text-lg font-medium text-gray-700 mb-2">
        No material requisitions found
      </p>
      <p className="text-gray-500">Try adjusting your search or filters</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by card number or product..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={fetchMaterialList}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {filteredData.length === 0 ? (
          <EmptyState />
        ) : (
          filteredData.map((req) => (
            <MobileRequisitionCard
              key={req._id}
              requisition={req}
              isExpanded={expandedCards.has(req._id)}
              onToggle={() => toggleCardExpansion(req._id)}
              onIssue={() => setSelectedRequisition(req)}
              onDelete={() => handleDelete(req._id)}
            />
          ))
        )}
      </div>

      <div className="hidden md:block">
        <DesktopTable
          requisitions={filteredData}
          onIssue={setSelectedRequisition}
          onDelete={handleDelete}
        />
      </div>

      <MaterialIssueDialog
        requisition={selectedRequisition}
        open={!!selectedRequisition}
        onOpenChange={(open) => !open && setSelectedRequisition(null)}
        onSuccess={fetchMaterialList}
      />
    </div>
  );
}
