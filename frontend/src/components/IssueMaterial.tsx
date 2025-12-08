import React, { useEffect, useState } from "react";
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

interface IssueMaterialProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function IssueMaterial({
  searchTerm,
  onSearchChange,
}: IssueMaterialProps) {
  const [materialRequisitions, setMaterialRequisitions] = useState<any[]>([]);
  const [selectedRequisition, setSelectedRequisition] = useState<any | null>(
    null
  );
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Fetch all material requests
  const fetchMaterialList = async () => {
    try {
      const res = await api.get(`/material-requests`);
      console.log("Fetched material requisitions:", res.data);
      setMaterialRequisitions(res.data.items || []);
    } catch (err) {
      console.error("Failed to fetch material list", err);
    }
  };

  useEffect(() => {
    fetchMaterialList();
  }, []);

  const filteredData = () => {
    return materialRequisitions.filter((req) => {
      const card = req.cardNumber || "";
      const project = req.projectId?.productName || "";
      return (
        card.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  /* =====================================================
   MaterialIssueDialog - opens for a single requisition
   ======================================================*/
  const MaterialIssueDialog = ({ requisition, open, onOpenChange }: any) => {
    const [issuedQuantities, setIssuedQuantities] = useState<
      Record<string, number>
    >({});

    useEffect(() => {
      // Initialize issued quantities from existing issued values
      if (requisition) {
        const initialQuantities: Record<string, number> = {};

        // Initialize from materials
        (requisition.materials || []).forEach((item: any) => {
          const itemId = String(item.itemId || item._id);
          initialQuantities[itemId] = Number(item.issued || 0);
        });

        // Initialize from components
        (requisition.components || []).forEach((item: any) => {
          const itemId = String(item.itemId || item._id);
          initialQuantities[itemId] = Number(item.issued || 0);
        });

        setIssuedQuantities(initialQuantities);
      }
    }, [requisition]);

    const handleIssueQuantityChange = (id: string, qty: number) => {
      setIssuedQuantities((prev) => ({
        ...prev,
        [id]: qty,
      }));
    };

    // Organize items into 5 sections based on name heuristics
    const getCategorizedSections = () => {
      if (!requisition) {
        return {
          upper: [],
          material: [],
          component: [],
          packaging: [],
          miscellaneous: [],
        };
      }

      const upper: any[] = [];
      const material: any[] = [];
      const component: any[] = [];
      const packaging: any[] = [];
      const miscellaneous: any[] = [];

      // Categorize materials
      (requisition.materials || []).forEach((item: any) => {
        const name = (item.name || "").toLowerCase();
        if (name.includes("upper")) {
          upper.push(item);
        } else {
          material.push(item);
        }
      });

      // Categorize components
      (requisition.components || []).forEach((item: any) => {
        const name = (item.name || "").toLowerCase();
        if (name.includes("pack") || name.includes("packaging")) {
          packaging.push(item);
        } else if (name.includes("component") || name.startsWith("c ")) {
          component.push(item);
        } else {
          miscellaneous.push(item);
        }
      });

      return { upper, material, component, packaging, miscellaneous };
    };

    // Issue materials: compute updated arrays and call API
    const handleIssueMaterials = async () => {
      if (!requisition) return;
      try {
        const reqId = requisition._id;

        // Update materials with issued quantities
        const updatedMaterials = (requisition.materials || []).map(
          (item: any) => {
            const itemId = item.itemId || item._id;
            const issued = Number(issuedQuantities[String(itemId)] || 0);
            const available = Number(item.available || 0);
            const requirement = Number(item.requirement || 0);
            const balance = Math.max(0, requirement - (available + issued));

            return {
              ...item,
              issued,
              balance,
            };
          }
        );

        // Update components with issued quantities
        const updatedComponents = (requisition.components || []).map(
          (item: any) => {
            const itemId = item.itemId || item._id;
            const issued = Number(issuedQuantities[String(itemId)] || 0);
            const available = Number(item.available || 0);
            const requirement = Number(item.requirement || 0);
            const balance = Math.max(0, requirement - (available + issued));

            return {
              ...item,
              issued,
              balance,
            };
          }
        );

        // Determine new status
        const allItems = [...updatedMaterials, ...updatedComponents];
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
        }

        const body = {
          materials: updatedMaterials,
          components: updatedComponents,
          status: newStatus,
        };

        await api.put(`/material-requests/${reqId}`, body);

        // Refresh list and close
        await fetchMaterialList();
        onOpenChange(false);
        setSelectedRequisition(null);
        alert("Materials issued successfully!");
      } catch (err) {
        console.error("Issue material failed", err);
        alert("Failed to issue materials.");
      }
    };

    if (!requisition) return null;

    const sections = getCategorizedSections();

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] md:max-w-6xl w-[95vw] md:w-full max-h-[95vh] md:max-h-[85vh] p-0 md:rounded-lg flex flex-col overflow-hidden">
          {/* HEADER - Fixed at top */}
          <div className="sticky top-0 z-50 px-4 md:px-8 py-4 md:py-6 bg-white border-b shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-md">
                <Package className="w-5 h-5 md:w-8 md:h-8 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl md:text-3xl font-semibold truncate">
                  Issue Material
                </DialogTitle>
                <DialogDescription className="text-gray-600 text-sm md:text-lg line-clamp-1">
                  Issue materials for {requisition.cardNumber}
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 md:relative md:top-0 md:right-0 h-8 w-8 md:h-12 md:w-12 rounded-full hover:bg-gray-100 flex-shrink-0"
            >
              <X className="w-4 h-4 md:w-6 md:h-6 text-gray-600" />
            </Button>
          </div>

          {/* SCROLLABLE CONTENT AREA */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-8 space-y-6 md:space-y-10">
            <Card className="bg-gray-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                  <CardTitle className="text-lg md:text-xl">
                    Production Card Details
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  <Info label="Card Number" value={requisition?.cardNumber} />
                  <Info
                    label="Product"
                    value={requisition?.projectId?.productName || "-"}
                  />
                  <Info label="Requested By" value={requisition?.requestedBy} />
                  <Info
                    label="Status"
                    value={requisition?.status}
                    highlight
                    status={requisition?.status}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Material sections - 5 categories */}
            <MaterialSections
              sections={[
                {
                  label: "UPPER MATERIAL",
                  color: "bg-cyan-100 text-cyan-900",
                  items: sections.upper,
                },
                {
                  label: "MATERIAL USED",
                  color: "bg-cyan-200 text-cyan-900",
                  items: sections.material,
                },
                {
                  label: "COMPONENT USED",
                  color: "bg-purple-100 text-purple-900",
                  items: sections.component,
                },
                {
                  label: "PACKAGING USED",
                  color: "bg-yellow-100 text-yellow-900",
                  items: sections.packaging,
                },
                {
                  label: "MISCELLANEOUS USED",
                  color: "bg-rose-100 text-rose-900",
                  items: sections.miscellaneous,
                },
              ]}
              issuedQuantities={issuedQuantities}
              onIssueChange={handleIssueQuantityChange}
            />
          </div>

          {/* FOOTER - Fixed at bottom */}
          <div className="sticky bottom-0 p-4 md:p-6 border-t bg-white flex justify-end flex-shrink-0">
            <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
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

  /* ----------------------
     Small subcomponents
  ------------------------*/
  const Info = ({ label, value, highlight = false, status }: any) => (
    <div className="min-w-0">
      <p className="text-gray-500 text-xs md:text-sm mb-1 truncate">{label}</p>
      <p
        className={`font-semibold text-sm md:text-base truncate ${
          highlight
            ? status === "Issued"
              ? "text-green-600"
              : status === "Partially Issued"
              ? "text-yellow-600"
              : status === "Pending to Store"
              ? "text-red-600"
              : "text-blue-600"
            : "text-gray-900"
        }`}
      >
        {value ?? "-"}
      </p>
    </div>
  );

  const MaterialSections = ({
    sections,
    issuedQuantities,
    onIssueChange,
  }: any) => {
    return (
      <div className="space-y-6">
        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-4">
          {sections.map((sec: any) => (
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
                    {sec.items.map((item: any) => (
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

        {/* Desktop View - Table */}
        <div className="hidden md:block bg-white rounded-xl border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-6 py-3 border-r text-left">ITEM</th>
                  <th className="px-6 py-3 border-r text-left">
                    SPECIFICATION
                  </th>
                  <th className="px-6 py-3 border-r text-center">REQUIRED</th>
                  <th className="px-6 py-3 border-r text-center">AVAILABLE</th>
                  <th className="px-6 py-3 border-r text-center">
                    ALREADY ISSUED
                  </th>
                  <th className="px-6 py-3 border-r text-center">ISSUE NOW</th>
                  <th className="px-6 py-3 text-center">BALANCE AFTER ISSUE</th>
                </tr>
              </thead>

              <tbody>
                {sections.map((sec: any) => (
                  <React.Fragment key={sec.label}>
                    <tr className={`${sec.color} border-y`}>
                      <td colSpan={7} className="px-6 py-2 font-semibold">
                        {sec.label}
                      </td>
                    </tr>

                    {sec.items.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-3 text-center text-gray-400"
                        >
                          No items
                        </td>
                      </tr>
                    )}

                    {sec.items.map((item: any) => (
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

  const MobileIssueItem = ({ item, issuedQuantities, onIssueChange }: any) => {
    const itemId = String(item.itemId || item._id);
    const req = Number(item.requirement || 0);
    const avail = Number(item.available || 0);
    const alreadyIssued = Number(item.issued || 0);
    const issueNow = Number(issuedQuantities[itemId] || 0);
    const totalIssued = alreadyIssued + issueNow;
    const balance = Math.max(0, req - (avail + totalIssued));

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
            variant={balance === 0 ? "default" : "destructive"}
            className="ml-2"
          >
            {balance} left
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
            <p className="text-xs text-gray-500 mb-1">Already Issued</p>
            <p className="font-semibold text-green-600">{alreadyIssued}</p>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-xs text-gray-500 mb-2">
            Issue Additional Quantity
          </p>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              max={req - alreadyIssued}
              value={issueNow === 0 ? "" : issueNow}
              onChange={(e) =>
                onIssueChange(itemId, Number(e.target.value) || 0)
              }
              className="flex-1 text-center"
            />
            <span className="text-sm text-gray-500 whitespace-nowrap">
              Max: {req - alreadyIssued}
            </span>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-xs text-gray-500 mb-1">Total Issued After This</p>
          <p className="font-semibold text-green-700">{totalIssued}</p>
        </div>

        <Separator className="mt-4" />
      </div>
    );
  };

  const IssueRow = ({ item, issuedQuantities, onIssueChange }: any) => {
    const itemId = String(item.itemId || item._id);
    const req = Number(item.requirement || 0);
    const avail = Number(item.available || 0);
    const alreadyIssued = Number(item.issued || 0);
    const issueNow = Number(issuedQuantities[itemId] || 0);
    const totalIssued = alreadyIssued + issueNow;
    const balance = Math.max(0, req - (avail + totalIssued));

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
          <Input
            type="number"
            min={0}
            max={req - alreadyIssued}
            value={issueNow === 0 ? "" : issueNow}
            className="w-20 text-center"
            onChange={(e) => onIssueChange(itemId, Number(e.target.value) || 0)}
          />
        </td>

        <td className="px-6 py-3 text-center font-semibold">
          <span className={balance === 0 ? "text-green-600" : "text-red-600"}>
            {balance}
          </span>
        </td>
      </tr>
    );
  };

  /* ----------------------
     Main render: list & dialog
  ------------------------*/
  return (
    <div className="space-y-4 md:space-y-6">
      {/* SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by card number or product..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 text-sm md:text-base"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMaterialList}
            className="flex-1 sm:flex-none"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* MOBILE CARDS VIEW */}
      <div className="md:hidden space-y-4">
        {filteredData().length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No material requisitions found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          filteredData().map((req) => {
            const isExpanded = expandedCards.has(req._id);

            // Calculate total issued for summary
            const totalItems = [
              ...(req.materials || []),
              ...(req.components || []),
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
              <Card key={req._id} className="overflow-hidden">
                <CardHeader
                  className="pb-3 cursor-pointer"
                  onClick={() => toggleCardExpansion(req._id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                        <FileText className="text-blue-600 w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold truncate">
                          {req.cardNumber || "N/A"}
                        </CardTitle>
                        <p className="text-sm text-gray-600 truncate">
                          {req.projectId?.productName || "-"}
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
                          <span className="text-xs text-gray-500">
                            {totalIssued}/{totalRequired}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                        className="text-xs"
                      >
                        {req.status}
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
                          <p className="text-xs text-gray-500 mb-1">
                            Requested By
                          </p>
                          <p className="text-sm font-medium">
                            {req.requestedBy || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Request Date
                          </p>
                          <p className="text-sm font-medium">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Materials
                          </p>
                          <p className="text-sm font-medium">
                            {req.materials?.length || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Components
                          </p>
                          <p className="text-sm font-medium">
                            {req.components?.length || 0}
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
                          onClick={() => setSelectedRequisition(req)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {req.status === "Issued" ? "View/Update" : "Issue"}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={async () => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this material request?"
                                  )
                                ) {
                                  try {
                                    await api.delete(
                                      `/material-requests/${req._id}`
                                    );
                                    fetchMaterialList();
                                  } catch (err) {
                                    console.error("Delete failed", err);
                                  }
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem>
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
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Card Number
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Requested By
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Issued Progress
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {filteredData().length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500">
                        No material requisitions found
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData().map((req) => {
                  // Calculate progress
                  const totalItems = [
                    ...(req.materials || []),
                    ...(req.components || []),
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
                    <tr
                      key={req._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                            <FileText className="text-blue-600 w-5 h-5" />
                          </div>
                          <div className="font-medium">{req.cardNumber}</div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="font-medium truncate">
                            {req.projectId?.productName || "-"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {req.materials?.length || 0} materials,{" "}
                            {req.components?.length || 0} components
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium">{req.requestedBy}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                progress >= 100
                                  ? "bg-green-500"
                                  : progress > 0
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-700 min-w-[60px]">
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
                        <div className="flex justify-end items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 text-white hover:bg-green-700"
                            onClick={() => setSelectedRequisition(req)}
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
                            className="text-red-600 hover:text-red-700"
                            onClick={async () => {
                              if (
                                window.confirm(
                                  "Are you sure you want to delete this material request?"
                                )
                              ) {
                                try {
                                  await api.delete(
                                    `/material-requests/${req._id}`
                                  );
                                  fetchMaterialList();
                                } catch (err) {
                                  console.error("Delete failed", err);
                                }
                              }
                            }}
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

      {/* ISSUE DIALOG */}
      <MaterialIssueDialog
        requisition={selectedRequisition}
        open={!!selectedRequisition}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setSelectedRequisition(null);
          }
        }}
      />
    </div>
  );
}
