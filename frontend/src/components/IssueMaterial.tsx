// IssueMaterial.tsx
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
        <DialogContent
          className="
            !max-w-[95vw]
            !w-[95vw]
            !h-[95vh]
            overflow-hidden
            p-0
            m-0
            top-[2vh]
            translate-y-0
            flex flex-col
          "
        >
          {/* HEADER */}
          <div className="sticky top-0 z-50 px-10 py-6 bg-white border-b shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Package className="w-8 h-8 text-white" />
              </div>

              <div>
                <DialogTitle className="text-3xl font-semibold">
                  Issue Material
                </DialogTitle>
                <DialogDescription className="text-gray-600 text-lg">
                  Issue materials for this production card
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-12 w-12 rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6 text-gray-600" />
            </Button>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto px-10 py-8 space-y-10">
            <div className="bg-gray-50 p-6 rounded-xl border">
              <h3 className="text-xl font-semibold flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                Production Card Details
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Info
                  label="Card Number"
                  value={requisition?.productionCardId?.cardNumber}
                />
                <Info
                  label="Product"
                  value={requisition?.productionCardId?.productName}
                />
                <Info label="Requested By" value={requisition?.requestedBy} />
                <Info label="Status" value={requisition?.status} highlight />
              </div>
            </div>

            {/* Material sections */}
            <MaterialSectionTable
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

          {/* FOOTER */}
          <div className="sticky bottom-0 p-6 border-t bg-white flex justify-end gap-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleIssueMaterials}
            >
              Issue Materials
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  /* ----------------------
     Small subcomponents
  ------------------------*/
  const Info = ({ label, value, highlight = false }: any) => (
    <div>
      <p className="text-gray-500 text-sm mb-1">{label}</p>
      <p
        className={`font-semibold ${
          highlight ? "text-blue-600" : "text-gray-900"
        }`}
      >
        {value ?? "-"}
      </p>
    </div>
  );

  const MaterialSectionTable = ({
    sections,
    issuedQuantities,
    onIssueChange,
    loadingCosts,
  }: any) => {
    return (
      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-6 py-3 border-r text-left">ITEM</th>
              <th className="px-6 py-3 border-r text-left">SPECIFICATION</th>
              <th className="px-6 py-3 border-r text-center">REQUIRED</th>
              <th className="px-6 py-3 border-r text-center">AVAILABLE</th>
              <th className="px-6 py-3 border-r text-center">ISSUE NOW</th>
              <th className="px-6 py-3 text-center">BALANCE</th>
            </tr>
          </thead>

          <tbody>
            {loadingCosts && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Loading cost mapping...
                </td>
              </tr>
            )}

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
    );
  };

  const IssueRow = ({ item, issuedQuantities, onIssueChange }: any) => {
    const id = item.id || item._id;
    const req = Number(item.requirement || 0);
    const avail = Number(item.available || 0);
    const issued = Number(issuedQuantities[id] || 0);
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
            onChange={(e) => onIssueChange(id, parseFloat(e.target.value) || 0)}
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
    <div className="space-y-6">
      {/* SEARCH BAR */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search issue material..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" /> Filters
        </Button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow border overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">Card Number</th>
              <th className="px-6 py-3 text-left">Product Name</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredData().map((req) => (
              <tr key={req._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center">
                      <FileText className="text-blue-600 w-5 h-5" />
                    </div>
                    <div>{req.productionCardId?.cardNumber}</div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  {req.productionCardId?.productName || "-"}
                </td>

                <td className="px-6 py-4 font-semibold">{req.status}</td>

                <td className="px-6 py-4 text-right">
                  <Button
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700 mr-2"
                    onClick={() => setSelectedRequisition(req)}
                  >
                    <Send className="w-4 h-4 mr-1" /> Issue
                  </Button>

                  <Button size="sm" variant="outline" className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
