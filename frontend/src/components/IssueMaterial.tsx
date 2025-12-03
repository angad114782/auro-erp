import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Trash2,
  FileText,
  Filter,
  Package,
  Send,
  X,
  Target,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  AlertCircle,
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
      const res = await api.get(`/material-requests/all`);
      setMaterialRequisitions(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch material list", err);
    }
  };

  useEffect(() => {
    fetchMaterialList();
  }, []);

  const filteredData = () => {
    return materialRequisitions.filter((req) => {
      const card = req.productionCardId?.cardNumber || "";
      const product = req.productionCardId?.productName || "";
      return (
        card.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.toLowerCase().includes(searchTerm.toLowerCase())
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
   - fetches project's cost sections and maps items into the 5
     sections by matching IDs against those cost rows.
  ======================================================*/
  const MaterialIssueDialog = ({ requisition, open, onOpenChange }: any) => {
    const [issuedQuantities, setIssuedQuantities] = useState<
      Record<string, number>
    >({});
    const [costLists, setCostLists] = useState<any>({
      upper: [],
      material: [],
      component: [],
      packaging: [],
      miscellaneous: [],
    });
    const [loadingCosts, setLoadingCosts] = useState(false);

    useEffect(() => {
      // reset when different requisition opens
      setIssuedQuantities({});
      setCostLists({
        upper: [],
        material: [],
        component: [],
        packaging: [],
        miscellaneous: [],
      });
      if (open && requisition) {
        loadCostsForProject(requisition);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, requisition]);

    const loadCostsForProject = async (req: any) => {
      if (!req) return;
      const projectId =
        req.projectId?._id ||
        req.projectId ||
        (req.productionCardId?.projectId ?? null);

      if (!projectId) {
        console.warn(
          "No projectId found on requisition; cannot load cost rows"
        );
        return;
      }

      try {
        setLoadingCosts(true);
        // fetch five sections in parallel
        const [upperRes, componentRes, materialRes, packagingRes, miscRes] =
          await Promise.all([
            api
              .get(`/projects/${projectId}/costs/upper`)
              .catch(() => ({ data: { rows: [] } })),
            api
              .get(`/projects/${projectId}/costs/component`)
              .catch(() => ({ data: { rows: [] } })),
            api
              .get(`/projects/${projectId}/costs/material`)
              .catch(() => ({ data: { rows: [] } })),
            api
              .get(`/projects/${projectId}/costs/packaging`)
              .catch(() => ({ data: { rows: [] } })),
            api
              .get(`/projects/${projectId}/costs/miscellaneous`)
              .catch(() => ({ data: { rows: [] } })),
          ]);

        setCostLists({
          upper: upperRes?.data?.rows || [],
          component: componentRes?.data?.rows || [],
          material: materialRes?.data?.rows || [],
          packaging: packagingRes?.data?.rows || [],
          miscellaneous: miscRes?.data?.rows || [],
        });
      } catch (err) {
        console.error("Failed to load project costs", err);
      } finally {
        setLoadingCosts(false);
      }
    };

    const handleIssueQuantityChange = (id: string, qty: number) => {
      setIssuedQuantities((prev) => ({
        ...prev,
        [id]: qty,
      }));
    };

    // Build lists by matching IDs (preferred) — fallback to name heuristics if missing
    const sections = useMemo(() => {
      if (!requisition) {
        return {
          upper: [],
          material: [],
          component: [],
          packaging: [],
          miscellaneous: [],
        };
      }

      const mats: any[] = requisition.materials || [];
      const comps: any[] = requisition.components || [];

      // create sets of cost ids for quick matching
      const upperIds = new Set(
        (costLists.upper || []).map((r: any) => String(r._id))
      );
      const materialIds = new Set(
        (costLists.material || []).map((r: any) => String(r._id))
      );
      const componentIds = new Set(
        (costLists.component || []).map((r: any) => String(r._id))
      );
      const packagingIds = new Set(
        (costLists.packaging || []).map((r: any) => String(r._id))
      );
      const miscIds = new Set(
        (costLists.miscellaneous || []).map((r: any) => String(r._id))
      );

      // map function: try to match by id string, else fallback to name heuristics
      const classifyMaterial = (m: any) => {
        const idStr = String(m.id || m._id || m.idStr || "");
        if (upperIds.has(idStr)) return "upper";
        if (materialIds.has(idStr)) return "material";
        // fallback: if name contains "upper" treat as upper
        if ((m.name || "").toLowerCase().includes("upper")) return "upper";
        // else default to material
        return "material";
      };

      const classifyComponent = (c: any) => {
        const idStr = String(c.id || c._id || c.idStr || "");
        if (componentIds.has(idStr)) return "component";
        if (packagingIds.has(idStr)) return "packaging";
        if (miscIds.has(idStr)) return "miscellaneous";
        // fallback heuristics
        const name = (c.name || "").toLowerCase();
        if (name.startsWith("c ")) return "component";
        if (name.includes("pack")) return "packaging";
        return "miscellaneous";
      };

      const outUpper: any[] = [];
      const outMaterial: any[] = [];
      const outComponent: any[] = [];
      const outPackaging: any[] = [];
      const outMisc: any[] = [];

      mats.forEach((m) => {
        const bucket = classifyMaterial(m);
        if (bucket === "upper") outUpper.push(m);
        else outMaterial.push(m);
      });

      comps.forEach((c) => {
        const bucket = classifyComponent(c);
        if (bucket === "component") outComponent.push(c);
        else if (bucket === "packaging") outPackaging.push(c);
        else outMisc.push(c);
      });

      return {
        upper: outUpper,
        material: outMaterial,
        component: outComponent,
        packaging: outPackaging,
        miscellaneous: outMisc,
      };
    }, [requisition, costLists]);

    // Issue materials: compute updated arrays and call API
    const handleIssueMaterials = async () => {
      if (!requisition) return;
      try {
        const reqId = requisition._id;
        const projectId =
          requisition.projectId?._id ||
          requisition.projectId ||
          (requisition.productionCardId?.projectId ?? null);

        if (!projectId) {
          throw new Error("projectId missing on requisition");
        }

        const updatedMaterials = (requisition.materials || []).map(
          (item: any) => {
            const issued = Number(issuedQuantities[String(item.id)] || 0);

            const available = Number(item.available || 0);
            const requirement = Number(item.requirement || 0);
            return {
              ...item,
              issued,
              available,
              balance: Math.max(0, requirement - (available + issued)),
            };
          }
        );

        const updatedComponents = (requisition.components || []).map(
          (item: any) => {
            const issued = Number(issuedQuantities[item.id] || 0);
            const available = Number(item.available || 0);
            const requirement = Number(item.requirement || 0);
            return {
              ...item,
              issued,
              available,
              balance: Math.max(0, requirement - (available + issued)),
            };
          }
        );

        // decide status
        const allIssued = [...updatedMaterials, ...updatedComponents].every(
          (i) => Number(i.issued || 0) >= Number(i.requirement || 0)
        );
        const newStatus = allIssued ? "Issued" : "Partially Issued";

        const body = {
          materials: updatedMaterials,
          components: updatedComponents,
          status: newStatus,
        };

        await api.put(
          `/projects/${projectId}/material-requests/${reqId}`,
          body
        );

        // refresh list and close
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
                  Issue materials for this production card
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
                  <Info
                    label="Card Number"
                    value={requisition?.productionCardId?.cardNumber}
                  />
                  <Info
                    label="Product"
                    value={requisition?.projectId?.artName || "-"}
                  />
                  <Info label="Requested By" value={requisition?.requestedBy} />
                  <Info label="Status" value={requisition?.status} highlight />
                </div>
              </CardContent>
            </Card>

            {/* Material sections - Mobile cards, Desktop table */}
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
              loadingCosts={loadingCosts}
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
  const Info = ({ label, value, highlight = false }: any) => (
    <div className="min-w-0">
      <p className="text-gray-500 text-xs md:text-sm mb-1 truncate">{label}</p>
      <p
        className={`font-semibold text-sm md:text-base truncate ${
          highlight ? "text-blue-600" : "text-gray-900"
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
    loadingCosts,
  }: any) => {
    return (
      <div className="space-y-6">
        {loadingCosts && (
          <div className="text-center py-8 text-gray-500">
            Loading cost mapping...
          </div>
        )}

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
                        key={item.id || item._id}
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
                  <th className="px-6 py-3 border-r text-center">ISSUE NOW</th>
                  <th className="px-6 py-3 text-center">BALANCE</th>
                </tr>
              </thead>

              <tbody>
                {sections.map((sec: any) => (
                  <React.Fragment key={sec.label}>
                    <tr className={`${sec.color} border-y`}>
                      <td colSpan={6} className="px-6 py-2 font-semibold">
                        {sec.label}
                      </td>
                    </tr>

                    {sec.items.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-3 text-center text-gray-400"
                        >
                          No items
                        </td>
                      </tr>
                    )}

                    {sec.items.map((item: any) => (
                      <IssueRow
                        key={item.id || item._id}
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
    const id = String(item.id || item._id);
    const req = Number(item.requirement || 0);
    const avail = Number(item.available || 0);
    const issued = Number(issuedQuantities[id] || 0);
    const balance = Math.max(0, req - (avail + issued));

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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Required</p>
            <p className="font-semibold text-blue-700">{req}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Available</p>
            <p className="font-semibold">{avail}</p>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-xs text-gray-500 mb-2">Issue Quantity</p>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              max={req}
              value={issued}
              onChange={(e) => onIssueChange(id, Number(e.target.value) || 0)}
              className="flex-1 text-center"
            />
            <span className="text-sm text-gray-500 whitespace-nowrap">
              Max: {req}
            </span>
          </div>
        </div>

        <Separator className="mt-4" />
      </div>
    );
  };

  const IssueRow = ({ item, issuedQuantities, onIssueChange }: any) => {
    const id = String(item.id || item._id); // ✅ MUST STRINGIFY
    const req = Number(item.requirement || 0);
    const avail = Number(item.available || 0);

    // 🔥 FIX: ensure correct quantity is read
    const issued = Number(issuedQuantities[id] || 0);

    // 🔥 FIX: correct live balance calculation
    const balance = Math.max(0, req - (avail + issued));

    return (
      <tr className="border-b hover:bg-gray-50">
        <td className="px-6 py-3 border-r">{item.name}</td>
        <td className="px-6 py-3 border-r">{item.specification}</td>

        <td className="px-6 py-3 border-r text-center font-semibold text-blue-700">
          {req}
        </td>

        <td className="px-6 py-3 border-r text-center">{avail}</td>

        <td className="px-6 py-3 border-r text-center">
          <Input
            type="number"
            min={0}
            value={issued}
            className="w-20 text-center"
            onChange={
              (e) => onIssueChange(id, Number(e.target.value) || 0) // 🔥 ID FIXED
            }
          />
        </td>

        <td className="px-6 py-3 text-center font-semibold">{balance}</td>
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
                          {req.productionCardId?.cardNumber || "N/A"}
                        </CardTitle>
                        <p className="text-sm text-gray-600 truncate">
                          {req.projectId?.artName || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          req.status === "Pending"
                            ? "destructive"
                            : req.status === "Issued"
                            ? "default"
                            : "secondary"
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

                      <Separator />

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => setSelectedRequisition(req)}
                        >
                          <Send className="w-4 h-4 mr-2" /> Issue
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
                              onClick={() => {
                                // Handle delete
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
                  <td colSpan={5} className="px-6 py-12 text-center">
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
                filteredData().map((req) => (
                  <tr
                    key={req._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                          <FileText className="text-blue-600 w-5 h-5" />
                        </div>
                        <div className="font-medium">
                          {req.productionCardId?.cardNumber}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="font-medium truncate">
                          {req.projectId?.artName || "-"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {req.productionCardId?.productName || ""}
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
                      <Badge
                        variant={
                          req.status === "Pending"
                            ? "destructive"
                            : req.status === "Issued"
                            ? "default"
                            : "secondary"
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
                          <Send className="w-4 h-4 mr-1" /> Issue
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            // Handle delete
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
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
