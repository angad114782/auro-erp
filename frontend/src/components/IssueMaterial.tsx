import React, { useEffect, useState, useCallback, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Calendar,
  User,
  Hash,
  CheckCircle,
  AlertCircle,
  Clock,
  Ban,
  Loader2,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Skeleton } from "./ui/skeleton";

import api from "../lib/api";
import { toast } from "sonner";
import { ConfirmActionDialog } from "./ConfirmActionDialog";
import { normalizeToFixed, sanitizeDecimalInput } from "../utils/sanitizeInput";

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
  _id: string;
  productName: string;
  artName?: string;
}

interface MaterialRequisition {
  _id: string;
  cardNumber: string;
  projectId: Project;
  requestedBy: string;
  status:
    | "Pending to Store"
    | "Partially Issued"
    | "Issued"
    | "Pending Availability Check"
    | "Cancelled";
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

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

interface FilterState {
  status?: string;
}

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    "Pending to Store": {
      variant: "destructive" as const,
      icon: Clock,
      className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50",
      shortLabel: "Pending",
    },
    "Partially Issued": {
      variant: "secondary" as const,
      icon: AlertCircle,
      className:
        "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50",
      shortLabel: "Partial",
    },
    Issued: {
      variant: "default" as const,
      icon: CheckCircle,
      className:
        "bg-green-50 text-green-700 border-green-200 hover:bg-green-50",
      shortLabel: "Issued",
    },
    "Pending Availability Check": {
      variant: "destructive" as const,
      icon: AlertCircle,
      className:
        "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50",
      shortLabel: "Checking",
    },
    Cancelled: {
      variant: "outline" as const,
      icon: Ban,
      className: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50",
      shortLabel: "Cancelled",
    },
  };

  const {
    variant,
    icon: Icon,
    className,
    shortLabel,
  } = config[status as keyof typeof config] || config["Pending to Store"];

  return (
    <>
      {/* Desktop - Full label */}
      <Badge
        variant={variant}
        className={`hidden sm:flex font-medium py-1 px-3 gap-1.5 ${className}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {status}
      </Badge>

      {/* Mobile - Short label */}
      <Badge
        variant={variant}
        className={`sm:hidden font-medium py-1 px-2.5 gap-1 text-xs ${className}`}
      >
        <Icon className="w-3 h-3" />
        {shortLabel}
      </Badge>
    </>
  );
};

// Helper Components
const Info = ({
  label,
  value,
  highlight = false,
  status,
  icon: Icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  status?: string;
  icon?: React.ElementType;
}) => (
  <div className="flex items-start gap-3 min-w-0">
    {Icon && (
      <div className="mt-1 p-1.5 rounded-lg bg-gray-50">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="text-gray-500 text-xs mb-1 truncate">{label}</p>
      <p
        className={`font-semibold text-sm truncate ${
          highlight
            ? status === "Issued"
              ? "text-green-600"
              : status === "Partially Issued"
              ? "text-yellow-600"
              : status === "Cancelled"
              ? "text-gray-600"
              : "text-red-600"
            : "text-gray-900"
        }`}
      >
        {value || "-"}
      </p>
    </div>
  </div>
);

// Loading Skeletons
const DesktopRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-4 w-32" />
      </div>
    </td>
    <td className="px-6 py-4">
      <Skeleton className="h-4 w-48" />
    </td>
    <td className="px-6 py-4">
      <Skeleton className="h-4 w-24" />
    </td>
    <td className="px-6 py-4">
      <Skeleton className="h-4 w-32" />
    </td>
    <td className="px-6 py-4">
      <Skeleton className="h-2 w-full" />
    </td>
    <td className="px-6 py-4">
      <Skeleton className="h-6 w-24 rounded-full" />
    </td>
    <td className="px-6 py-4">
      <Skeleton className="h-9 w-28 ml-auto" />
    </td>
  </tr>
);

const MobileCardSkeleton = () => (
  <Card className="overflow-hidden animate-pulse">
    <CardHeader className="pb-3">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-3">
            {/* Card number and status row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            {/* Product name */}
            <Skeleton className="h-4 w-48" />
            {/* Progress bar */}
            <div className="space-y-2">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
        <Skeleton className="h-5 w-5" />
      </div>
    </CardHeader>
  </Card>
);
// IssueRow Component (optimized for mobile)
const IssueRow = ({
  item,
  issuedQuantities,
  onIssueChange,
}: {
  item: MaterialItem | ComponentItem;
  issuedQuantities: Record<string, number | string>;
  onIssueChange: (id: string, qty: number | string) => void;
}) => {
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
  const balanceAfterRaw = Math.max(0, req - (avail + newIssuedAmount));

  const balanceAfter = Number(balanceAfterRaw.toFixed(4));

  const handleInputChange = (value: string) => {
    const sanitized = sanitizeDecimalInput(value, 4);
    if (sanitized === null) return;

    const numValue = Number(sanitized);
    if (!isNaN(numValue) && numValue > maxIssuable) {
      onIssueChange(itemId, maxIssuable.toFixed(4));
    } else {
      onIssueChange(itemId, sanitized);
    }
  };

  const getDisplayValue = () => {
    const value = issuedQuantities[itemId];
    if (value === undefined || value === null) return "";

    if (typeof value === "string") return value;
    if (Number(value) === 0) return "";

    return value.toString();
  };

  return (
    <tr className="border-b hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 border-r">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{item.name}</p>
          <p className="text-sm text-gray-500 truncate">
            {item.specification || "-"}
          </p>
        </div>
      </td>
      <td className="px-4 py-3 border-r text-center">
        <div className="flex flex-col items-center">
          <span className="font-semibold text-blue-700">{req}</span>
          <span className="text-xs text-gray-500">Required</span>
        </div>
      </td>
      <td className="px-4 py-3 border-r text-center">
        <div className="flex flex-col items-center">
          <span className="font-semibold">{avail}</span>
          <span className="text-xs text-gray-500">Available</span>
        </div>
      </td>
      <td className="px-4 py-3 border-r text-center">
        <div className="flex flex-col items-center">
          <span className="font-semibold text-green-600">{alreadyIssued}</span>
          <span className="text-xs text-gray-500">Issued</span>
        </div>
      </td>
      <td className="px-4 py-3 border-r">
        <div className="flex flex-col items-center gap-2">
          <Input
            type="text"
            inputMode="decimal"
            value={getDisplayValue()}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="0"
            onBlur={(e) => {
              const v = e.target.value;
              if (v === "" || v === ".") {
                onIssueChange(itemId, "0.0000");
              } else {
                onIssueChange(itemId, normalizeToFixed(v, 4));
              }
            }}
            className={`
    w-24 text-center font-semibold
    border-2
    rounded-md
    transition-all

    ${
      newIssuedAmount > 0
        ? "border-green-500 bg-green-50 text-green-700"
        : "border-blue-400 bg-blue-50"
    }

    focus:border-blue-600
    focus:ring-2 focus:ring-blue-200
  `}
          />

          <div className="text-xs text-gray-500">Max: {maxIssuable}</div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex flex-col items-center">
          <span
            className={`font-semibold ${
              balanceAfter === 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {balanceAfter}
          </span>
          <span className="text-xs text-gray-500">Balance</span>
        </div>
      </td>
    </tr>
  );
};

const MobileIssueItem = ({
  item,
  issuedQuantities,
  onIssueChange,
}: {
  item: MaterialItem | ComponentItem;
  issuedQuantities: Record<string, number | string>;
  onIssueChange: (id: string, qty: number | string) => void;
}) => {
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
  const balanceAfterRaw = Math.max(0, req - (avail + newIssuedAmount));

  const balanceAfter = Number(balanceAfterRaw.toFixed(4));

  const handleInputChange = (value: string) => {
    const sanitized = sanitizeDecimalInput(value, 4);
    if (sanitized === null) return;

    const numValue = Number(sanitized);
    if (!isNaN(numValue) && numValue > maxIssuable) {
      onIssueChange(itemId, maxIssuable.toFixed(4));
    } else {
      onIssueChange(itemId, sanitized);
    }
  };

  const getDisplayValue = () => {
    const value = issuedQuantities[itemId];

    if (value === undefined || value === null) return "";

    if (typeof value === "string") return value;

    return value === 0 ? "" : value.toString();
  };

  return (
    <div className="p-3 space-y-3 bg-white rounded-lg border">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {item.name}
          </p>
          <p className="text-xs text-gray-600 mt-1 truncate">
            {item.specification || "No specification"}
          </p>
        </div>
        <Badge
          variant={balanceAfter === 0 ? "default" : "destructive"}
          className="ml-2 shrink-0 text-xs"
        >
          {balanceAfter} left
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 bg-blue-50 rounded">
          <p className="text-xs text-blue-600 mb-1">Req</p>
          <p className="font-bold text-blue-700 text-sm">{req}</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Avail</p>
          <p className="font-bold text-sm">{avail}</p>
        </div>
        <div className="text-center p-2 bg-green-50 rounded">
          <p className="text-xs text-green-600 mb-1">Issued</p>
          <p className="font-bold text-green-700 text-sm">{alreadyIssued}</p>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded">
          <p className="text-xs text-purple-600 mb-1">Max</p>
          <p className="font-bold text-purple-700 text-sm">{maxIssuable}</p>
        </div>
      </div>

      <div className="pt-2">
        <p className="text-xs font-medium text-gray-700 mb-2">
          Set Issued Quantity
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]*"
            value={getDisplayValue()}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="0"
            onBlur={(e) => {
              const v = e.target.value;
              if (v === "" || v === ".") {
                onIssueChange(itemId, "0.0000");
              } else {
                onIssueChange(itemId, normalizeToFixed(v, 4));
              }
            }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <div>
            <p className="text-xs text-gray-500">Current:</p>
            <p className="font-semibold text-xs">{alreadyIssued}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">New total:</p>
            <p className="font-semibold text-green-700 text-xs">
              {newIssuedAmount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const MaterialSections = ({
  sections,
  issuedQuantities,
  onIssueChange,
}: {
  sections: Array<{
    label: string;
    color: string;
    items: Array<MaterialItem | ComponentItem>;
  }>;
  issuedQuantities: Record<string, number | string>;
  onIssueChange: (id: string, qty: number | string) => void;
}) => {
  return (
    <div className="space-y-4">
      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-xl border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[250px]">
                  ITEM DETAILS
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700 min-w-[100px]">
                  REQUIRED
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700 min-w-[100px]">
                  AVAILABLE
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700 min-w-[100px]">
                  ISSUED
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700 min-w-[150px]">
                  ISSUE NOW
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700 min-w-[120px]">
                  BALANCE
                </th>
              </tr>
            </thead>

            <tbody>
              {sections.map((sec) => (
                <React.Fragment key={sec.label}>
                  <tr className={`${sec.color} border-y`}>
                    <td colSpan={6} className="px-4 py-2 font-semibold text-sm">
                      {sec.label}
                      <Badge variant="outline" className="ml-2">
                        {sec.items.length} items
                      </Badge>
                    </td>
                  </tr>

                  {sec.items.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-gray-400 text-sm"
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

const MaterialIssueDialog = ({
  requisition,
  open,
  onOpenChange,
  onSuccess,
}: {
  requisition: MaterialRequisition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) => {
  const [issuedQuantities, setIssuedQuantities] = useState<
    Record<string, number | string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    if (requisition) {
      const initialQuantities: Record<string, number | string> = {};
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

      // Set initial active section
      const sections = getCategorizedSections();
      const firstNonEmptySection = [
        { label: "UPPER MATERIAL", items: sections.upper },
        { label: "MATERIAL USED", items: sections.materials },
        { label: "COMPONENT USED", items: sections.components },
        { label: "PACKAGING USED", items: sections.packaging },
        { label: "MISCELLANEOUS USED", items: sections.misc },
      ].find((sec) => sec.items.length > 0);

      if (firstNonEmptySection) {
        setActiveSection(firstNonEmptySection.label);
      }
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

    setIsSubmitting(true);
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
    } catch (err) {
      console.error("Issue material failed", err);
      alert("Failed to issue materials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!requisition) return null;

  const sections = getCategorizedSections();
  const categorizedSections = [
    {
      label: "UPPER MATERIAL",
      shortLabel: "UPPER",
      color: "bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-800",
      items: sections.upper || [],
    },
    {
      label: "MATERIAL USED",
      shortLabel: "MATERIAL",
      color: "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800",
      items: sections.materials || [],
    },
    {
      label: "COMPONENT USED",
      shortLabel: "COMPONENT",
      color: "bg-gradient-to-r from-purple-50 to-pink-50 text-purple-800",
      items: sections.components || [],
    },
    {
      label: "PACKAGING USED",
      shortLabel: "PACKAGING",
      color: "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-800",
      items: sections.packaging || [],
    },
    {
      label: "MISCELLANEOUS USED",
      shortLabel: "MISC",
      color: "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-800",
      items: sections.misc || [],
    },
  ];

  const totalItems = categorizedSections.reduce(
    (sum, sec) => sum + sec.items.length,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
    fixed inset-0
    w-full h-full
    p-0
    flex flex-col
    overflow-hidden
    bg-white
    border-0
    rounded-none

    /* ⬇️ IMPORTANT: reset radix defaults on mobile */
    top-0 left-0 translate-x-0 translate-y-0

    /* ⬇️ Desktop only */
    md:inset-auto
    md:left-1/2 md:top-1/2
    md:-translate-x-1/2 md:-translate-y-1/2
    md:w-[95vw] md:h-[90vh]
    md:max-w-[95vw] md:max-h-[90vh]
    md:rounded-xl
    md:border
    md:shadow-2xl
  "
      >
        {/* Header - Sticky */}
        <div className="sticky top-0 z-50 px-4 md:px-6 py-4 bg-white border-b flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-md shrink-0">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg md:text-2xl font-semibold text-gray-900 truncate">
                Issue Material
              </DialogTitle>
              <DialogDescription className="text-xs md:text-sm text-gray-600 flex items-center gap-2 truncate">
                <span className="flex items-center gap-1 shrink-0">
                  <Hash className="w-3 h-3" />
                  {requisition.cardNumber}
                </span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:flex items-center gap-1 shrink-0">
                  <Package className="w-3 h-3" />
                  {totalItems} items
                </span>
              </DialogDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full hover:bg-gray-100 h-8 w-8 md:h-10 md:w-10 shrink-0 ml-2"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
          {/* Requisition Summary */}
          <Card className="bg-gradient-to-r from-gray-50 to-white border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-base md:text-lg font-semibold">
                    Production Card Details
                  </CardTitle>
                </div>
                <StatusBadge status={requisition.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <Info
                  label="Card Number"
                  value={requisition.cardNumber}
                  icon={Hash}
                />
                <Info
                  label="Product"
                  value={
                    requisition.projectId?.artName ||
                    requisition.projectId?.productName ||
                    "-"
                  }
                  icon={Package}
                />
                <Info
                  label="Requested By"
                  value={requisition.requestedBy}
                  icon={User}
                />
                <Info
                  label="Request Date"
                  value={new Date(requisition.createdAt).toLocaleDateString()}
                  icon={Calendar}
                />
              </div>
            </CardContent>
          </Card>

          {/* Materials Section - Mobile Tabs - FIXED */}
          <div className="md:hidden">
            <Tabs value={activeSection} onValueChange={setActiveSection}>
              <div className="sticky top-0 z-10 bg-white pb-2">
                <div className="px-1">
                  <TabsList
                    className="
            flex
            w-full
            gap-1
            overflow-x-auto
            rounded-lg
            bg-gray-100
            p-1
            h-auto
            scrollbar-hide
          "
                  >
                    {categorizedSections.map((sec) => (
                      <TabsTrigger
                        key={sec.label}
                        value={sec.label}
                        className="
                flex flex-col items-center gap-0.5
                px-2 py-1.5
                text-[10px] font-medium
                whitespace-nowrap
                rounded-md
                data-[state=active]:bg-white
                data-[state=active]:shadow-sm
                data-[state=active]:text-blue-600
                data-[state=active]:font-semibold
                flex-shrink-0
                min-w-[60px]
              "
                      >
                        <span>{sec.shortLabel}</span>
                        <Badge
                          variant="secondary"
                          className="text-[8px] px-1 py-0 h-4"
                        >
                          {sec.items.length}
                        </Badge>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </div>

              {categorizedSections.map((sec) => (
                <TabsContent
                  key={sec.label}
                  value={sec.label}
                  className="mt-2 space-y-3"
                >
                  <div
                    className={`${sec.color} px-4 py-3 rounded-lg flex justify-between items-center`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
                      <span className="text-sm font-semibold">{sec.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {sec.items.length} items
                    </Badge>
                  </div>

                  {sec.items.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-white rounded-lg border">
                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No items in this category</p>
                    </div>
                  ) : (
                    sec.items.map((item) => (
                      <MobileIssueItem
                        key={item.itemId || item._id}
                        item={item}
                        issuedQuantities={issuedQuantities}
                        onIssueChange={handleIssueQuantityChange}
                      />
                    ))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Desktop View */}
          <div className="hidden md:block">
            <MaterialSections
              sections={categorizedSections}
              issuedQuantities={issuedQuantities}
              onIssueChange={handleIssueQuantityChange}
            />
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="sticky bottom-0 p-4 border-t bg-white/95 backdrop-blur-sm flex flex-col sm:flex-row justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Package className="w-4 h-4" />
            <span>
              Total items: <span className="font-semibold">{totalItems}</span>
            </span>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none min-w-[100px]"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white flex-1 sm:flex-none min-w-[150px]"
              onClick={handleIssueMaterials}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Issue Materials
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MobileRequisitionCard = ({
  requisition,
  isExpanded,
  onToggle,
  onIssue,
  onDelete,
  isDeleting = false,
}: {
  requisition: MaterialRequisition;
  isExpanded: boolean;
  onToggle: () => void;
  onIssue: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}) => {
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
  const progressRaw =
    totalRequired > 0 ? (totalIssued / totalRequired) * 100 : 0;

  const progress = Number(progressRaw.toFixed(2)); // UI %

  return (
    <Card
      key={requisition._id}
      className={`
        overflow-hidden hover:shadow-md transition-all duration-300 relative
        ${isDeleting ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      {/* Delete Button - Positioned absolutely */}
      <div className="absolute top-3 right-3 z-10">
        {isDeleting ? (
          <div className="flex items-center justify-center h-8 w-8">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        ) : (
          <ConfirmActionDialog
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
            title="Delete Requisition"
            description={`Are you sure you want to delete ${requisition.cardNumber}? This action cannot be undone.`}
            onConfirm={onDelete}
            disabled={isDeleting}
          />
        )}
      </div>

      <CardHeader
        onClick={isDeleting ? undefined : onIssue}
        className={`
          pb-3 cursor-pointer hover:bg-gray-50 transition-colors
          ${isDeleting ? "cursor-not-allowed" : ""}
          pr-16
        `}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          {/* Icon and Main Content */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={`
              h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0
              ${
                isDeleting
                  ? "bg-gray-200"
                  : "bg-gradient-to-br from-blue-100 to-blue-200"
              }
            `}
            >
              <FileText
                className={`w-5 h-5 ${
                  isDeleting ? "text-gray-400" : "text-blue-600"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              {/* Top Row: Card Number and Status */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <CardTitle
                  className={`text-base font-semibold truncate ${
                    isDeleting ? "text-gray-400" : ""
                  }`}
                >
                  {requisition.cardNumber || "N/A"}
                </CardTitle>
                <div className="sm:ml-2">
                  <StatusBadge status={requisition.status} />
                </div>
              </div>

              {/* Product Name */}
              <p
                className={`text-sm text-gray-600 truncate mb-3 ${
                  isDeleting ? "text-gray-400" : ""
                }`}
              >
                {requisition.projectId?.artName ||
                  requisition.projectId?.productName ||
                  "-"}
              </p>

              {/* Progress Bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      progress >= 100
                        ? "bg-green-500"
                        : progress > 0
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <span
                  className={`text-xs ${
                    isDeleting ? "text-gray-400" : "text-gray-500"
                  } shrink-0`}
                >
                  {totalIssued}/{totalRequired}
                </span>
              </div>
            </div>
          </div>

          {/* Chevron Icon */}
          <div
            className={`
            self-start sm:self-center rounded-full p-2 transition-colors
            ${
              isDeleting
                ? "bg-gray-100 cursor-not-allowed"
                : "bg-gray-100 hover:bg-gray-200"
            }
          `}
          >
            {isExpanded ? (
              <ChevronUp
                className={`w-5 h-5 ${
                  isDeleting ? "text-gray-300" : "text-gray-400"
                }`}
                onClick={
                  isDeleting
                    ? undefined
                    : (e) => {
                        e.stopPropagation();
                        onToggle();
                      }
                }
              />
            ) : (
              <ChevronDown
                className={`w-5 h-5 ${
                  isDeleting ? "text-gray-300" : "text-gray-400"
                }`}
                onClick={
                  isDeleting
                    ? undefined
                    : (e) => {
                        e.stopPropagation();
                        onToggle();
                      }
                }
              />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && !isDeleting && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Requester and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-gray-500" />
                  <p className="text-xs text-gray-500">Requested By</p>
                </div>
                <p className="text-sm font-semibold">
                  {requisition.requestedBy || "N/A"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <p className="text-xs text-gray-500">Request Date</p>
                </div>
                <p className="text-sm font-semibold">
                  {new Date(requisition.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Material Counts */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Material Counts</p>
              <div className="grid grid-cols-5 gap-2">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="text-xs text-blue-600 mb-1">Upper</p>
                  <p className="text-sm font-bold">
                    {requisition.upper?.length || 0}
                  </p>
                </div>
                <div className="text-center p-2 bg-indigo-50 rounded">
                  <p className="text-xs text-indigo-600 mb-1">Material</p>
                  <p className="text-sm font-bold">
                    {requisition.materials?.length || 0}
                  </p>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded">
                  <p className="text-xs text-purple-600 mb-1">Comp</p>
                  <p className="text-sm font-bold">
                    {requisition.components?.length || 0}
                  </p>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <p className="text-xs text-yellow-600 mb-1">Pack</p>
                  <p className="text-sm font-bold">
                    {requisition.packaging?.length || 0}
                  </p>
                </div>
                <div className="text-center p-2 bg-rose-50 rounded">
                  <p className="text-xs text-rose-600 mb-1">Misc</p>
                  <p className="text-sm font-bold">
                    {requisition.misc?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            <Separator />
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const StatusFilterDropdown = ({
  value,
  onChange,
}: {
  value?: string;
  onChange: (status?: string) => void;
}) => {
  const statuses = [
    "Pending Availability Check",
    "Pending to Store",
    "Partially Issued",
    "Issued",
    "Cancelled",
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Status</span>
          {value && (
            <Badge variant="secondary" className="ml-1">
              {value.split(" ")[0]}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {statuses.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => onChange(s)}
            className="flex items-center justify-between"
          >
            <span className={value === s ? "font-semibold text-blue-600" : ""}>
              {s}
            </span>
            {value === s && <CheckCircle className="w-4 h-4 text-blue-600" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-red-600 justify-center"
          onClick={() => onChange(undefined)}
        >
          Clear Filter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10,
  });
  const [filters, setFilters] = useState<FilterState>({});
  const [searchInput, setSearchInput] = useState(searchTerm);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const debouncedSearch = useCallback(
    (value: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        onSearchChange(value);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
      }, 500);
    },
    [onSearchChange]
  );

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSearch(value);
  };

  const fetchMaterialList = useCallback(async () => {
    setLoading(true);
    try {
      const apiFilters = {
        status: filters.status === "all" ? undefined : filters.status,
      };

      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(apiFilters.status && { status: apiFilters.status }),
      });

      const res = await api.get(`/material-requests?${params}`);
      const data = res.data || {};

      if (data.success) {
        const items = data.items || [];
        const total = data.total || 0;

        setMaterialRequisitions(Array.isArray(items) ? items : []);
        setPagination((prev) => ({
          ...prev,
          totalItems: total,
          totalPages: Math.ceil(total / pagination.pageSize) || 1,
        }));
      } else {
        const items = data.items || data.data || data || [];
        const total = data.total || data.count || items.length || 0;

        setMaterialRequisitions(Array.isArray(items) ? items : []);
        setPagination((prev) => ({
          ...prev,
          totalItems: total,
          totalPages: Math.ceil(total / pagination.pageSize) || 1,
        }));
      }
    } catch (err: any) {
      console.error("Failed to fetch material list", err);
      if (err.response?.status === 400) {
        console.error("API error details:", err.response.data);
      }
      alert("Failed to load material requisitions");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, searchTerm, filters]);

  useEffect(() => {
    fetchMaterialList();
  }, [fetchMaterialList]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, pageSize: size, currentPage: 1 }));
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

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

  const handleRemoveInventory = async (id: string) => {
    setDeletingId(id);

    // Store the current list for potential rollback
    const previousList = [...materialRequisitions];
    const previousPagination = { ...pagination };

    // Optimistically remove from UI
    setMaterialRequisitions((prev) => prev.filter((req) => req._id !== id));
    setPagination((prev) => ({
      ...prev,
      totalItems: Math.max(0, prev.totalItems - 1),
      totalPages:
        Math.ceil(Math.max(0, prev.totalItems - 1) / prev.pageSize) || 1,
    }));

    try {
      await api.delete(`/material-requests/${id}`);
      toast.success("Requisition deleted successfully");

      // Refresh the list to ensure data consistency
      // await fetchMaterialList();
    } catch (err: any) {
      // Rollback on error
      setMaterialRequisitions(previousList);
      setPagination(previousPagination);
      console.error("Delete failed", err);
      toast.error(
        err?.response?.data?.message || "Failed to delete requisition"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const Pagination = ({
    pagination,
    onPageChange,
    onPageSizeChange,
  }: {
    pagination: PaginationState;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  }) => {
    const { currentPage, totalPages, totalItems, pageSize } = pagination;

    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const pages: (number | string)[] = [];
      const maxVisible = 5;

      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
        return pages;
      }

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        start = 2;
        end = 4;
      }

      if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      pages.push(1);

      if (start > 2) pages.push("...");

      for (let i = start; i <= end; i++) pages.push(i);

      if (end < totalPages - 1) pages.push("...");

      pages.push(totalPages);

      return pages;
    };

    const visiblePages = getVisiblePages();

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
        {/* Page Size */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">entries</span>
        </div>

        {/* Info */}
        <div className="text-sm text-gray-600 text-center">
          Showing{" "}
          <span className="font-semibold">
            {(currentPage - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold">
            {Math.min(currentPage * pageSize, totalItems)}
          </span>{" "}
          of <span className="font-semibold">{totalItems}</span> entries
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="flex items-center gap-1">
            {visiblePages.map((page, idx) =>
              page === "..." ? (
                <span key={`dots-${idx}`} className="px-2 text-gray-500">
                  ...
                </span>
              ) : (
                <Button
                  key={`page-${page}`}
                  size="sm"
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => onPageChange(page as number)}
                  className="min-w-8 h-8 sm:min-w-10 sm:h-10"
                >
                  {page}
                </Button>
              )
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="gap-1"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const DesktopTable = ({
    requisitions,
    onIssue,
    onDelete,
  }: {
    requisitions: MaterialRequisition[];
    onIssue: (req: MaterialRequisition) => void;
    onDelete: (id: string) => void;
  }) => {
    if (loading) {
      return (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="px-6 py-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Loading material requisitions...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow border overflow-hidden transition-opacity duration-200">
        {requisitions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 min-w-[180px]">
                    Card Details
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 min-w-[200px]">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 min-w-[150px]">
                    Requester
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 min-w-[180px]">
                    Material Summary
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 min-w-[180px]">
                    Issued Progress
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 min-w-[150px]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 min-w-[200px]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {requisitions.map((req) => {
                  const isItemDeleting = deletingId === req._id;
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
                  const progressRaw =
                    totalRequired > 0 ? (totalIssued / totalRequired) * 100 : 0;

                  const progress = Number(progressRaw.toFixed(2)); // UI %

                  return (
                    <tr
                      key={req._id}
                      className={`
                        hover:bg-gray-50 transition-all duration-300 relative
                        ${
                          isItemDeleting ? "opacity-50 pointer-events-none" : ""
                        }
                      `}
                    >
                      {/* Clickable cells */}
                      <td
                        className="px-4 py-4 cursor-pointer"
                        onClick={
                          isItemDeleting ? undefined : () => onIssue(req)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`
                            h-10 w-10 rounded-lg flex items-center justify-center shrink-0
                            ${
                              isItemDeleting
                                ? "bg-gray-200"
                                : "bg-gradient-to-br from-blue-100 to-blue-200"
                            }
                          `}
                          >
                            <FileText
                              className={`w-5 h-5 ${
                                isItemDeleting
                                  ? "text-gray-400"
                                  : "text-blue-600"
                              }`}
                            />
                          </div>
                          <div>
                            <div
                              className={`font-semibold ${
                                isItemDeleting
                                  ? "text-gray-400"
                                  : "text-gray-900"
                              }`}
                            >
                              {req.cardNumber}
                            </div>
                            <div
                              className={`text-sm ${
                                isItemDeleting
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {new Date(req.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td
                        className="px-4 py-4 cursor-pointer"
                        onClick={
                          isItemDeleting ? undefined : () => onIssue(req)
                        }
                      >
                        <div className="max-w-xs">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p
                                  className={`font-medium truncate ${
                                    isItemDeleting
                                      ? "text-gray-400"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {req.projectId?.artName ||
                                    req.projectId?.productName ||
                                    "-"}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent>
                                {req.projectId?.artName ||
                                  req.projectId?.productName ||
                                  "-"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </td>

                      <td
                        className="px-4 py-4 cursor-pointer"
                        onClick={
                          isItemDeleting ? undefined : () => onIssue(req)
                        }
                      >
                        <div className="flex items-center gap-2">
                          <User
                            className={`w-4 h-4 ${
                              isItemDeleting ? "text-gray-300" : "text-gray-400"
                            }`}
                          />
                          <p
                            className={`font-medium ${
                              isItemDeleting ? "text-gray-400" : "text-gray-900"
                            }`}
                          >
                            {req.requestedBy}
                          </p>
                        </div>
                      </td>

                      <td
                        className="px-4 py-4 cursor-pointer"
                        onClick={
                          isItemDeleting ? undefined : () => onIssue(req)
                        }
                      >
                        <div className="flex flex-wrap gap-2">
                          {req.upper?.length > 0 && (
                            <Badge
                              variant="outline"
                              className={`${
                                isItemDeleting
                                  ? "bg-gray-100 text-gray-400"
                                  : "bg-blue-50"
                              }`}
                            >
                              U: {req.upper.length}
                            </Badge>
                          )}
                          {req.materials?.length > 0 && (
                            <Badge
                              variant="outline"
                              className={`${
                                isItemDeleting
                                  ? "bg-gray-100 text-gray-400"
                                  : "bg-indigo-50"
                              }`}
                            >
                              M: {req.materials.length}
                            </Badge>
                          )}
                          {req.components?.length > 0 && (
                            <Badge
                              variant="outline"
                              className={`${
                                isItemDeleting
                                  ? "bg-gray-100 text-gray-400"
                                  : "bg-purple-50"
                              }`}
                            >
                              C: {req.components.length}
                            </Badge>
                          )}
                          {req.packaging?.length > 0 && (
                            <Badge
                              variant="outline"
                              className={`${
                                isItemDeleting
                                  ? "bg-gray-100 text-gray-400"
                                  : "bg-yellow-50"
                              }`}
                            >
                              P: {req.packaging.length}
                            </Badge>
                          )}
                          {req.misc?.length > 0 && (
                            <Badge
                              variant="outline"
                              className={`${
                                isItemDeleting
                                  ? "bg-gray-100 text-gray-400"
                                  : "bg-rose-50"
                              }`}
                            >
                              Misc: {req.misc.length}
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td
                        className="px-4 py-4 cursor-pointer"
                        onClick={
                          isItemDeleting ? undefined : () => onIssue(req)
                        }
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-sm ${
                                isItemDeleting
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }`}
                            >
                              Progress
                            </span>
                            <span
                              className={`text-sm font-semibold ${
                                isItemDeleting ? "text-gray-400" : ""
                              }`}
                            >
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <Progress
                            value={progress}
                            className={`h-2 ${
                              isItemDeleting ? "bg-gray-200" : ""
                            }`}
                          />
                          <div
                            className={`text-xs text-center ${
                              isItemDeleting ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {totalIssued.toFixed(4)} /{" "}
                            {totalRequired.toFixed(4)} issued
                          </div>
                        </div>
                      </td>

                      <td
                        className="px-4 py-4 cursor-pointer"
                        onClick={
                          isItemDeleting ? undefined : () => onIssue(req)
                        }
                      >
                        <StatusBadge status={req.status} />
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {isItemDeleting ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Deleting...
                            </div>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <ConfirmActionDialog
                                    title="Delete Requisition"
                                    description={`Are you sure you want to delete ${req.cardNumber}? This action cannot be undone.`}
                                    onConfirm={() => onDelete(req._id)}
                                    disabled={!!deletingId}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Delete Requisition
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const EmptyState = () => (
    <div className="text-center py-12 md:py-16 text-gray-500 bg-white rounded-lg border">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <Package className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-lg font-medium text-gray-700 mb-2">
        No material requisitions found
      </p>
      <p className="text-gray-500 max-w-sm mx-auto">
        Try adjusting your search or filters to find what you're looking for.
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Issue Materials
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and issue material requisitions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {pagination.totalItems} total
            </Badge>
            <Button
              variant="outline"
              onClick={fetchMaterialList}
              className="gap-2"
              disabled={loading || !!deletingId}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by card number, product, or requester..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
              disabled={!!deletingId}
            />
          </div>
          <div className="flex gap-2">
            <StatusFilterDropdown
              value={filters.status}
              onChange={(status) => {
                handleFilterChange({ status });
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <MobileCardSkeleton key={i} />
            ))}
          </>
        ) : materialRequisitions.length === 0 ? (
          <EmptyState />
        ) : (
          materialRequisitions.map((req) => (
            <MobileRequisitionCard
              key={req._id}
              requisition={req}
              isExpanded={expandedCards.has(req._id)}
              onToggle={() => toggleCardExpansion(req._id)}
              onIssue={() => setSelectedRequisition(req)}
              onDelete={() => handleRemoveInventory(req._id)}
              isDeleting={deletingId === req._id}
            />
          ))
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        {loading && materialRequisitions.length === 0 ? (
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="px-6 py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Loading material requisitions...</p>
            </div>
          </div>
        ) : (
          <DesktopTable
            requisitions={materialRequisitions}
            onIssue={setSelectedRequisition}
            onDelete={handleRemoveInventory}
          />
        )}
      </div>

      {/* Pagination */}
      {materialRequisitions.length > 0 && !loading && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Issue Dialog */}
      <MaterialIssueDialog
        requisition={selectedRequisition}
        open={!!selectedRequisition}
        onOpenChange={(open) => !open && setSelectedRequisition(null)}
        onSuccess={fetchMaterialList}
      />
    </div>
  );
}
