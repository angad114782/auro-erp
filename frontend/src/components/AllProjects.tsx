import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  X,
  Image as ImageIcon,
  Download,
  Palette,
  Calculator,
  Plus,
  Trash2,
  Upload,
  Save,
} from "lucide-react";
import { useProjects } from "../hooks/useProjects";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import CostTable from "./CostTable";
import LabourTable from "./LabourTable";
import { ColorMaterialsDialog } from "./ColorMaterialsDialog";
import { generateProjectPDF } from "../utils/pdfDownload";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";

const getFullImageUrl = (path?: string | null) => {
  if (!path) return "";
  try {
    if (path.startsWith("http")) return path;
    return `${BACKEND_URL}/${path}`;
  } catch {
    return String(path);
  }
};

const formatDateDisplay = (d?: string | null) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("en-IN");
  } catch {
    return String(d);
  }
};

function getEmptySummary() {
  return {
    upperTotal: 0,
    componentTotal: 0,
    materialTotal: 0,
    packagingTotal: 0,
    miscTotal: 0,
    labourTotal: 0,
    additionalCosts: 0,
    profitMargin: 0,
    profitAmount: 0,
    tentativeCost: 0,
  };
}

function convertColorVariants(projectData: any): Map<string, any> {
  const variantsMap = new Map<string, any>();
  if (!projectData?.colorVariants) return variantsMap;

  const getEmptyCosting = () => ({
    upper: [],
    material: [],
    component: [],
    packaging: [],
    misc: [],
    labour: { items: [], directTotal: 0 },
    summary: getEmptySummary(),
  });

  if (projectData.colorVariants instanceof Map) {
    for (const [k, v] of projectData.colorVariants.entries()) {
      variantsMap.set(k, {
        materials: Array.isArray(v?.materials) ? v.materials : [],
        components: Array.isArray(v?.components) ? v.components : [],
        images: Array.isArray(v?.images) ? v.images : [],
        costing: v?.costing || getEmptyCosting(),
        updatedBy: v?.updatedBy || null,
        updatedAt: v?.updatedAt ? new Date(v.updatedAt) : new Date(),
      });
    }
    return variantsMap;
  }

  for (const [k, v] of Object.entries(projectData.colorVariants || {})) {
    const val: any = v;
    variantsMap.set(k, {
      materials: Array.isArray(val?.materials) ? val.materials : [],
      components: Array.isArray(val?.components) ? val.components : [],
      images: Array.isArray(val?.images) ? val.images : [],
      costing: val?.costing || getEmptyCosting(),
      updatedBy: val?.updatedBy || null,
      updatedAt: val?.updatedAt ? new Date(val.updatedAt) : new Date(),
    });
  }
  return variantsMap;
}

export default function ProjectListCard() {
  const { projects, loading, loadProjects } = useProjects();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [isMobile, setIsMobile] = useState(false);

  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [openDetails, setOpenDetails] = useState(false);

  // Color variant states
  const [activeColorTab, setActiveColorTab] = useState<string>("");
  const [colorVariants, setColorVariants] = useState<Map<string, any>>(
    new Map()
  );
  const [localColorVariants, setLocalColorVariants] = useState<
    Map<string, any>
  >(new Map());
  const [colorMaterialsDialogOpen, setColorMaterialsDialogOpen] =
    useState(false);
  const [isLoadingCost, setIsLoadingCost] = useState(false);
  const [costData, setCostData] = useState({
    upper: [] as any[],
    component: [] as any[],
    material: [] as any[],
    packaging: [] as any[],
    misc: [] as any[],
    labour: { items: [] as any[], directTotal: 0 },
    summary: {} as any,
  });

  const Info = ({ label, value }: { label: string; value?: any }) => (
    <div className="flex justify-between gap-2 border-b pb-1 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value || "-"}</span>
    </div>
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadProjects();
  }, []);

  // Load color variants when project is selected
  useEffect(() => {
    if (selectedProject && openDetails) {
      const variants = convertColorVariants(selectedProject);
      setColorVariants(variants);
      setLocalColorVariants(variants);

      // Set active color tab
      if (selectedProject.color) {
        setActiveColorTab(selectedProject.color);
      } else if (variants.size > 0) {
        setActiveColorTab(Array.from(variants.keys())[0]);
      }
    }
  }, [selectedProject, openDetails]);
  // Add this useEffect to load cost data when color tab changes
  useEffect(() => {
    const loadCostDataForColor = async () => {
      if (!selectedProject?._id || !activeColorTab) return;

      setIsLoadingCost(true);
      try {
        // First check if we have the data in localColorVariants
        if (localColorVariants.has(activeColorTab)) {
          const variant = localColorVariants.get(activeColorTab);
          if (variant?.costing) {
            setCostData({
              upper: variant.costing.upper || [],
              component: variant.costing.component || [],
              material: variant.costing.material || [],
              packaging: variant.costing.packaging || [],
              misc: variant.costing.misc || [],
              labour: variant.costing.labour || { items: [], directTotal: 0 },
              summary: variant.costing.summary || getEmptySummary(),
            });
            return;
          }
        }

        // If it's the default color or no variant data, fetch from API
        if (
          activeColorTab === selectedProject.color ||
          !localColorVariants.has(activeColorTab)
        ) {
          const [
            summaryRes,
            upperRes,
            componentRes,
            materialRes,
            packagingRes,
            miscRes,
            labourRes,
          ] = await Promise.all([
            fetch(
              `${BACKEND_URL}/api/projects/${selectedProject._id}/costs`
            ).then((r) => r.json()),
            fetch(
              `${BACKEND_URL}/api/projects/${selectedProject._id}/costs/upper`
            ).then((r) => r.json()),
            fetch(
              `${BACKEND_URL}/api/projects/${selectedProject._id}/costs/component`
            ).then((r) => r.json()),
            fetch(
              `${BACKEND_URL}/api/projects/${selectedProject._id}/costs/material`
            ).then((r) => r.json()),
            fetch(
              `${BACKEND_URL}/api/projects/${selectedProject._id}/costs/packaging`
            ).then((r) => r.json()),
            fetch(
              `${BACKEND_URL}/api/projects/${selectedProject._id}/costs/miscellaneous`
            ).then((r) => r.json()),
            fetch(
              `${BACKEND_URL}/api/projects/${selectedProject._id}/costs/labour`
            ).then((r) => r.json()),
          ]);

          setCostData({
            upper: upperRes.rows || [],
            component: componentRes.rows || [],
            material: materialRes.rows || [],
            packaging: packagingRes.rows || [],
            misc: miscRes.rows || [],
            labour: labourRes.labour || { items: [], directTotal: 0 },
            summary: summaryRes.hasCostData ? summaryRes.summary : null,
          });
        }
      } catch (error) {
        console.error("Error loading cost data:", error);
        toast.error("Failed to load cost data");

        // Fallback to project data if API fails
        setCostData({
          upper: [],
          component: selectedProject.components || [],
          material: selectedProject.materials || [],
          packaging: [],
          misc: [],
          labour: { items: [], directTotal: 0 },
          summary: {
            materialTotal:
              selectedProject.materials?.reduce(
                (sum: number, m: any) => sum + (m.cost || 0),
                0
              ) || 0,
            componentTotal:
              selectedProject.components?.reduce(
                (sum: number, c: any) => sum + (c.cost || 0),
                0
              ) || 0,
            tentativeCost: selectedProject.clientFinalCost || 0,
          },
        });
      } finally {
        setIsLoadingCost(false);
      }
    };

    loadCostDataForColor();
  }, [selectedProject, activeColorTab, localColorVariants]);

  // Also load cost data when the dialog first opens
  useEffect(() => {
    if (openDetails && selectedProject) {
      // Reset and load initial data
      setCostData({
        upper: [],
        component: [],
        material: [],
        packaging: [],
        misc: [],
        labour: { items: [], directTotal: 0 },
        summary: {},
      });

      // Trigger load for default color
      if (selectedProject.color) {
        setActiveColorTab(selectedProject.color);
      }
    }
  }, [openDetails, selectedProject]);
  // Memoized color variant tabs
  const colorVariantTabs = useMemo(() => {
    const keys = Array.from(localColorVariants.keys());
    if (selectedProject?.color) {
      const filtered = keys.filter((k) => k !== selectedProject.color);
      return [selectedProject.color, ...filtered];
    }
    return keys.length > 0 ? keys : [];
  }, [localColorVariants, selectedProject?.color]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (selectedStatus !== "all") {
      result = result.filter(
        (project: any) => project.status === selectedStatus
      );
    }

    if (selectedPriority !== "all") {
      result = result.filter(
        (project: any) => project.priority === selectedPriority
      );
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((project: any) => {
        return (
          project.autoCode?.toLowerCase().includes(q) ||
          project.artName?.toLowerCase().includes(q) ||
          project?.company?.name?.toLowerCase().includes(q) ||
          project?.brand?.name?.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [projects, selectedStatus, selectedPriority, searchTerm]);

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      prototype: "bg-purple-100 text-purple-800",
      red_seal: "bg-red-100 text-red-800",
      green_seal: "bg-green-100 text-green-800",
      po_pending: "bg-orange-100 text-orange-800",
      po_approved: "bg-blue-100 text-blue-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  // PDF Download Handler
  // PDF Download Handler
  const handleDownloadPDF = async () => {
    try {
      if (!selectedProject) return;

      // Fetch cost data for PDF
      let costData = null;
      try {
        const [
          summaryRes,
          upperRes,
          componentRes,
          materialRes,
          packagingRes,
          miscRes,
          labourRes,
        ] = await Promise.all([
          fetch(
            `${BACKEND_URL}/api/projects/${selectedProject._id}/costs`
          ).then((r) => r.json()),
          fetch(
            `${BACKEND_URL}/api/projects/${selectedProject._id}/costs/upper`
          ).then((r) => r.json()),
          fetch(
            `${BACKEND_URL}/api/projects/${selectedProject._id}/costs/component`
          ).then((r) => r.json()),
          fetch(
            `${BACKEND_URL}/api/projects/${selectedProject._id}/costs/material`
          ).then((r) => r.json()),
          fetch(
            `${BACKEND_URL}/api/projects/${selectedProject._id}/costs/packaging`
          ).then((r) => r.json()),
          fetch(
            `${BACKEND_URL}/api/projects/${selectedProject._id}/costs/miscellaneous`
          ).then((r) => r.json()),
          fetch(
            `${BACKEND_URL}/api/projects/${selectedProject._id}/costs/labour`
          ).then((r) => r.json()),
        ]);

        costData = {
          upper: upperRes.rows || [],
          component: componentRes.rows || [],
          material: materialRes.rows || [],
          packaging: packagingRes.rows || [],
          misc: miscRes.rows || [],
          labour: labourRes.labour || { items: [], directTotal: 0 },
          summary: summaryRes.hasCostData ? summaryRes.summary : null,
        };
      } catch (error) {
        console.warn("Could not load cost data for PDF:", error);
        costData = {
          upper: [],
          component: selectedProject.components || [],
          material: selectedProject.materials || [],
          packaging: [],
          misc: [],
          labour: { items: [], directTotal: 0 },
          summary: null,
        };
      }

      // Convert Map to Object for PDF
      const colorVariantsObj = {};
      localColorVariants.forEach((value, key) => {
        colorVariantsObj[key] = value;
      });

      const pdfProject = {
        ...selectedProject,
        po: selectedProject.po || {
          poNumber: selectedProject.poNumber,
          orderQuantity: selectedProject.orderQuantity,
          unitPrice: selectedProject.unitPrice,
          totalAmount: selectedProject.poValue,
          deliveryDate: selectedProject.redSealTargetDate,
        },
        // Ensure images are full URLs
        coverImage: getFullImageUrl(selectedProject.coverImage),
        sampleImages: (selectedProject.sampleImages || []).map(getFullImageUrl),
      };

      // Determine active tab for PDF

      await generateProjectPDF({
        project: pdfProject,
        costData: costData,
        activeTab: "all_projects",
        colorVariants: colorVariantsObj,
      });

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };
  // In your component, add:

  // Update handleColorVariantsSave:
  const handleColorVariantsSave = useCallback(
    async (savedColorIds: string[]) => {
      try {
        if (!selectedProject?._id) return;

        // Fetch the updated project data
        const response = await fetch(
          `${BACKEND_URL}/api/projects/${selectedProject._id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch updated project");
        }

        const updatedProject = await response.json();

        console.log(updatedProject, "sdfsdsd");
        // Update the selected project with new data
        setSelectedProject(updatedProject?.data);

        // Convert and update color variants
        const variants = convertColorVariants(updatedProject);
        setColorVariants(variants);
        setLocalColorVariants(variants);

        // Set active tab
        if (savedColorIds && savedColorIds.length > 0) {
          setActiveColorTab(savedColorIds[0]);
        } else if (updatedProject.color) {
          setActiveColorTab(updatedProject.color);
        }

        toast.success("Color variants saved successfully!");
      } catch (error) {
        console.error("Failed to refresh color variants:", error);
        toast.error("Failed to load updated color variants");
      } finally {
        console.log("saved ");
      }
    },
    [selectedProject, loadProjects]
  );
  const renderColorVariantSection = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Color Variant Tabs Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-5">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
            <Calculator className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">
            Color Variants Analysis
          </h3>
        </div>
      </div>

      <div className="space-y-4">
        {/* Color Variant Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-200">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {colorVariantTabs.length > 0 ? (
              colorVariantTabs.map((colorId) => (
                <button
                  key={colorId}
                  onClick={() => setActiveColorTab(colorId)}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 border-b-2 transition-colors shrink-0 ${
                    activeColorTab === colorId
                      ? "border-orange-600 text-gray-900"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <div
                    className="w-3 h-3 md:w-4 md:h-4 rounded-full border border-gray-300"
                    style={{
                      backgroundColor: (colorId || "")
                        .toLowerCase()
                        .includes("#")
                        ? colorId
                        : undefined,
                    }}
                  ></div>
                  <span className="text-xs md:text-sm">
                    {colorId}
                    {selectedProject?.color &&
                      colorId === selectedProject.color && (
                        <span className="ml-1 md:ml-1.5 text-xs text-gray-500 hidden md:inline">
                          (Default)
                        </span>
                      )}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-2.5 text-gray-500 text-sm">
                No color variants configured
              </div>
            )}
          </div>

          <Button
            onClick={() => setColorMaterialsDialogOpen(true)}
            className="bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 mr-2 mb-2 text-xs md:text-sm"
            size={isMobile ? "sm" : "default"}
          >
            <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            {isMobile ? "Variant" : "Color Variant"}
          </Button>
        </div>

        {colorVariantTabs.length === 0 && selectedProject?.color && (
          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
            <Palette className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">
              No color variants configured. Using default color.
            </p>
            <p className="text-xs md:text-sm mt-1">
              Click "Color Variant" to add new color options.
            </p>
          </div>
        )}

        {/* Cost Tables Section */}
        {(colorVariantTabs.length > 0 ||
          (selectedProject?.color &&
            activeColorTab === selectedProject.color)) &&
          (() => {
            if (isLoadingCost) {
              return (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  <p className="text-sm text-gray-600 mt-2">
                    Loading cost data...
                  </p>
                </div>
              );
            }

            // Count how many cost tables have data
            const costTableCount = [
              costData.upper,
              costData.component,
              costData.material,
              costData.packaging,
              costData.misc,
            ].filter((table) => table.length > 0).length;

            const hasLabour =
              costData.labour.items && costData.labour.items.length > 0;
            const totalItems = costTableCount + (hasLabour ? 1 : 0);

            // No data at all
            if (totalItems === 0) {
              return (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  <Calculator className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-base font-medium text-gray-600">
                    No costing data available
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Add cost details for this color variant
                  </p>
                </div>
              );
            }

            // Use two columns layout for desktop
            const useTwoColumns = !isMobile;

            return (
              <div
                className={`grid gap-4 md:gap-6 ${
                  useTwoColumns ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {/* Left Column - Cost Tables */}
                {costTableCount > 0 && (
                  <div className="space-y-4 md:space-y-6">
                    {costData.upper.length > 0 && (
                      <CostTable title="Upper Cost" rows={costData.upper} />
                    )}
                    {costData.component.length > 0 && (
                      <CostTable
                        title="Component Cost"
                        rows={costData.component}
                      />
                    )}
                    {costData.material.length > 0 && (
                      <CostTable
                        title="Material Cost"
                        rows={costData.material}
                      />
                    )}
                    {costData.packaging.length > 0 && (
                      <CostTable
                        title="Packaging Cost"
                        rows={costData.packaging}
                      />
                    )}
                    {costData.misc.length > 0 && (
                      <CostTable
                        title="Miscellaneous Cost"
                        rows={costData.misc}
                      />
                    )}
                  </div>
                )}

                {/* Right Column - Labour Table and Summary */}
                <div className="space-y-4 md:space-y-6">
                  {hasLabour && <LabourTable labour={costData.labour} />}

                  {/* Cost Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h4 className="text-base md:text-lg font-semibold text-blue-900 mb-4">
                      Cost Summary
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-600">
                            Material Total
                          </Label>
                          <div className="text-lg font-bold text-gray-900">
                            ₹
                            {costData.summary?.materialTotal?.toLocaleString(
                              "en-IN"
                            ) || "0"}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">
                            Component Total
                          </Label>
                          <div className="text-lg font-bold text-gray-900">
                            ₹
                            {costData.summary?.componentTotal?.toLocaleString(
                              "en-IN"
                            ) || "0"}
                          </div>
                        </div>
                      </div>
                      {costData.summary?.tentativeCost && (
                        <div className="border-t border-blue-200 pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">
                              Tentative Cost
                            </span>
                            <span className="text-xl font-bold text-blue-700">
                              ₹
                              {costData.summary?.tentativeCost?.toLocaleString(
                                "en-IN"
                              ) || "0"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Projects List</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Select
              value={selectedPriority}
              onValueChange={setSelectedPriority}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Project</th>
                <th className="p-2 hidden sm:table-cell">Company</th>
                <th className="p-2">Status</th>
                <th className="p-2 hidden md:table-cell">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project: any) => (
                <tr
                  key={project._id}
                  onClick={() => {
                    setSelectedProject(project);
                    setOpenDetails(true);
                  }}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-gray-100 border overflow-hidden flex items-center justify-center">
                      {project.coverImage ? (
                        <img
                          src={getFullImageUrl(project.coverImage)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{project.autoCode}</div>
                      <div className="text-xs text-gray-500">
                        {project.artName}
                      </div>
                    </div>
                  </td>

                  <td className="p-2 hidden sm:table-cell">
                    {project.company?.name}
                  </td>

                  <td className="p-2">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </td>

                  <td className="p-2 hidden md:table-cell">
                    {formatDate(project.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {selectedProject && (
        <>
          <Dialog open={openDetails} onOpenChange={setOpenDetails}>
            <DialogContent className="!w-[98vw] !max-w-[1400px] max-h-[95vh] rounded-2xl p-0 overflow-hidden bg-white">
              {/* ================= STICKY HEADER ================= */}
              <div className="sticky top-0 z-50 bg-white border-b px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedProject.autoCode}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedProject.artName}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* PDF Download Button */}
                    <Button
                      onClick={handleDownloadPDF}
                      variant="outline"
                      className="bg-white hover:bg-gray-50 text-xs md:text-sm border-2"
                      size={isMobile ? "sm" : "default"}
                    >
                      <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                      {isMobile ? "PDF" : "Download PDF"}
                    </Button>

                    <Badge className={getStatusColor(selectedProject.status)}>
                      {selectedProject.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setOpenDetails(false)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              </div>

              {/* ================= SCROLL BODY ================= */}
              <div className="overflow-y-auto max-h-[calc(95vh-84px)] px-6 py-6 space-y-8">
                {/* ================= IMAGES (NO CROP, SQUARE) ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* COVER IMAGE */}
                  <div>
                    <p className="font-semibold mb-2">Cover Image</p>
                    <div className="border rounded-xl p-3 bg-gray-50 flex justify-center">
                      {selectedProject.coverImage ? (
                        <img
                          src={getFullImageUrl(selectedProject.coverImage)}
                          className="max-h-[320px] w-auto object-contain rounded-lg"
                        />
                      ) : (
                        <p className="text-sm text-gray-400">No cover image</p>
                      )}
                    </div>
                  </div>

                  {/* SAMPLE IMAGES */}
                  <div>
                    <p className="font-semibold mb-2">Sample Images</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedProject.sampleImages?.length ? (
                        selectedProject.sampleImages.map(
                          (img: string, i: number) => (
                            <div
                              key={i}
                              className="border rounded-lg p-2 bg-gray-50 flex justify-center"
                            >
                              <img
                                src={getFullImageUrl(img)}
                                className="max-h-[140px] w-auto object-contain"
                              />
                            </div>
                          )
                        )
                      ) : (
                        <p className="text-sm text-gray-400">
                          No sample images
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ================= MAIN INFO GRID ================= */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* ================= PROJECT DETAILS ================= */}
                  <div className="border rounded-xl p-5 space-y-3">
                    <h3 className="font-semibold text-lg mb-2">
                      Project Details
                    </h3>

                    <Info
                      label="Company"
                      value={selectedProject.company?.name}
                    />
                    <Info label="Brand" value={selectedProject.brand?.name} />
                    <Info
                      label="Category"
                      value={selectedProject.category?.name}
                    />
                    <Info label="Type" value={selectedProject.type?.name} />
                    <Info
                      label="Assigned To"
                      value={selectedProject.assignPerson?.name}
                    />
                    <Info
                      label="Country"
                      value={selectedProject.country?.name}
                    />

                    <Info label="Status" value={selectedProject.status} />
                    <Info label="Priority" value={selectedProject.priority} />
                    <Info label="Gender" value={selectedProject.gender} />
                    <Info label="Size" value={selectedProject.size} />
                    <Info label="Color" value={selectedProject.color} />

                    <Info
                      label="Client Approval"
                      value={selectedProject.clientApproval}
                    />
                    <Info
                      label="Client Final Cost"
                      value={`₹ ${selectedProject.clientFinalCost || "0"}`}
                    />

                    <Info
                      label="Created At"
                      value={formatDate(selectedProject.createdAt)}
                    />
                    <Info
                      label="Red Seal Target"
                      value={formatDate(selectedProject.redSealTargetDate)}
                    />

                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Product Description
                      </p>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        {selectedProject.productDesc || "-"}
                      </div>
                    </div>
                  </div>

                  {/* ================= PO DETAILS ================= */}
                  <div className="border rounded-xl p-5 space-y-3">
                    <h3 className="font-semibold text-lg mb-2">PO Details</h3>

                    {selectedProject.po ? (
                      <>
                        <Info
                          label="PO Number"
                          value={selectedProject.po.poNumber}
                        />
                        <Info
                          label="Order Quantity"
                          value={selectedProject.po.orderQuantity}
                        />
                        <Info
                          label="Unit Price"
                          value={`₹ ${selectedProject.po.unitPrice || "0"}`}
                        />
                        <Info
                          label="Total Amount"
                          value={`₹ ${selectedProject.po.totalAmount || "0"}`}
                        />
                        <Info
                          label="Delivery Date"
                          value={formatDate(selectedProject.po.deliveryDate)}
                        />
                        <Info
                          label="Payment Terms"
                          value={selectedProject.po.paymentTerms}
                        />
                        <Info
                          label="Urgency Level"
                          value={selectedProject.po.urgencyLevel}
                        />
                        <Info
                          label="PO Status"
                          value={selectedProject.po.status}
                        />

                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Client Feedback
                          </p>
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            {selectedProject.po.clientFeedback || "-"}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Quality Requirements
                          </p>
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            {selectedProject.po.qualityRequirements || "-"}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Special Instructions
                          </p>
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            {selectedProject.po.specialInstructions || "-"}
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">No PO created yet</p>
                    )}
                  </div>
                </div>

                {/* ================= COLOR VARIANT SECTION ================= */}
                <div className="border rounded-xl p-6">
                  {renderColorVariantSection()}
                </div>

                {/* ================= FOOTER ================= */}
                <div className="flex justify-end border-t pt-5">
                  <Button
                    variant="outline"
                    onClick={() => setOpenDetails(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Color Materials Dialog */}
          <ColorMaterialsDialog
            open={colorMaterialsDialogOpen}
            onOpenChange={setColorMaterialsDialogOpen}
            project={selectedProject}
            colors={Array.from(localColorVariants.keys())}
            onSave={handleColorVariantsSave}
          />
        </>
      )}
    </div>
  );
}
