// POTargetDate.tsx
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Filter,
  ImageIcon,
  Lightbulb,
  Package,
  Search,
  ShoppingCart,
  Target,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { POApprovedProjectDetailsDialog } from "./POApprovedProjectDetailsDialog";
import { POPendingProjectDetailsDialog } from "./POTargetProjectDetailsDialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useMasters } from "../hooks/useMaster";
import { useProjectQuery } from "./NewHooks/useProjectQuery";
import ProjectDetailsDialog from "./ProjectDetailsDialog";
import { useProjects } from "../hooks/useProjects";
import { useDebounce } from "./NewHooks/useDebounce";
import { MobileSkeleton, TableSkeleton } from "./Skeletons";
import { ProjectFilters } from "./ProjectFilters";
import Pagination from "./Pagination";
import { useImagePreview } from "../lib/stores/useImagePreview";
import { getFullImageUrl, formatLabel } from "../lib/utils";

export function POTargetDate() {
  const {
    companies,
    brands,
    categories,
    types,
    countries,
    assignPersons,
    loadAllMasters,
    setBrands,
    setCategories,
  } = useMasters();

  const extra = (window as any).erpExtra;
  const defaultTabFromRedirect = extra?.tab ?? "po-pending";

  // Local UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isMobile, setIsMobile] = useState(false);
  const { deleteProject } = useProjects();
  // Dialogs & selection
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [poPendingDetailsOpen, setPOPendingDetailsOpen] = useState(false);
  const [poApprovedDetailsOpen, setPOApprovedDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState(defaultTabFromRedirect);
  // Instead of one shared filter state, use separate states:
  const [pendingFilters, setPendingFilters] = useState({
    country: "",
    priority: "",
    company: "",
    brand: "",
    category: "",
    type: "",
  });

  const [approvedFilters, setApprovedFilters] = useState({
    country: "",
    priority: "",
    company: "",
    brand: "",
    category: "",
    type: "",
  });
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const debouncedSearchTerm = useDebounce(searchTerm, 600);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  // Load masters on mount
  useEffect(() => {
    loadAllMasters();
  }, [loadAllMasters]);

  // Helpers
  const calculateDuration = (startDate?: string, targetDate?: string) => {
    if (!startDate || !targetDate) return "TBD";
    const s = new Date(startDate);
    const t = new Date(targetDate);
    const diff = t.getTime() - s.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Due today";
    return `${days} days`;
  };
  const openImagePreview = useImagePreview((s) => s.openPreview);

  // PO Pending Query - uses pendingFilters
  const {
    data: poPendingProjects,
    total: pendingTotal,
    pages: pendingPages,
    loading: pendingLoading,
    reload: reloadPending,
  } = useProjectQuery({
    status: "po_pending",
    search: debouncedSearchTerm,
    page: currentPage,
    limit: itemsPerPage,
    country: pendingFilters.country,
    priority: pendingFilters.priority,
    company: pendingFilters.company,
    brand: pendingFilters.brand,
    category: pendingFilters.category,
    type: pendingFilters.type,
  });

  // PO Approved Query - uses approvedFilters
  const {
    data: poApprovedProjects,
    total: approvedTotal,
    pages: approvedPages,
    loading: approvedLoading,
    reload: reloadApproved,
  } = useProjectQuery({
    status: "po_approved",
    search: debouncedSearchTerm,
    page: currentPage,
    limit: itemsPerPage,
    country: approvedFilters.country,
    priority: approvedFilters.priority,
    company: approvedFilters.company,
    brand: approvedFilters.brand,
    category: approvedFilters.category,
    type: approvedFilters.type,
  });

  // Pending tab handlers
  const handlePendingFiltersChange = useCallback((newFilters: any) => {
    setPendingFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePendingClearFilters = useCallback(() => {
    setPendingFilters({
      country: "",
      priority: "",
      company: "",
      brand: "",
      category: "",
      type: "",
    });
    setCurrentPage(1);
  }, []);

  // Approved tab handlers
  const handleApprovedFiltersChange = useCallback((newFilters: any) => {
    setApprovedFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handleApprovedClearFilters = useCallback(() => {
    setApprovedFilters({
      country: "",
      priority: "",
      company: "",
      brand: "",
      category: "",
      type: "",
    });
    setCurrentPage(1);
  }, []);

  // Handlers
  const handleProjectClick = (project: any) => {
    setSelectedProject(project);
    if (project?.status === "po_approved") {
      setPOApprovedDetailsOpen(true);
    } else {
      setPOPendingDetailsOpen(true);
    }
  };

  const handleDelete = async (project: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      // Implement your delete API call
      await deleteProject(project._id);
      const reloadFunction =
        (window as any).erpExtra?.tab === "po-approved"
          ? reloadApproved
          : reloadPending;
      await reloadFunction();
      toast.success("Project removed");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Delete failed");
    }
  };

  // Small helper to safely pick a field from masters
  const pickMasterName = (
    masterList: any[],
    projectField: any,
    fallback?: string
  ) => {
    if (!projectField) return fallback || "Unknown";
    const found = masterList.find(
      (m) =>
        m._id === projectField._id ||
        m.id === projectField._id ||
        m._id === projectField?.id
    );
    return found?.name || projectField?.name || fallback || "Unknown";
  };

  // Mobile Card View Component
  const MobileProjectCard = ({
    project,
    index,
    isApproved,
  }: {
    project: any;
    index: number;
    isApproved: boolean;
  }) => {
    const companyName = pickMasterName(
      companies,
      project.company,
      "Unknown Company"
    );
    const brandName = pickMasterName(brands, project.brand, "Unknown Brand");
    const categoryName = pickMasterName(
      categories,
      project.category,
      "Unknown"
    );
    const typeName = pickMasterName(types, project.type, "Unknown");
    const countryName = pickMasterName(countries, project.country, "Unknown");

    const poNumber = project.poNumber || (project.po && project.po.poNumber);
    const hasPO = !!poNumber;

    return (
      <div
        key={project._id || project.id}
        className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 cursor-pointer"
        onClick={() => handleProjectClick(project)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mr-3 shrink-0">
              {String((currentPage - 1) * itemsPerPage + index + 1)
                .toString()
                .padStart(2, "0")}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {project.autoCode}
              </div>
              <div className="text-xs text-gray-500">{companyName}</div>
              <div className="flex items-center gap-1 mt-1">
                <Badge
                  className={`text-xs px-2 py-0.5 ${
                    isApproved
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {isApproved ? "PO Approved" : "PO Pending"}
                </Badge>
                {hasPO && isApproved && (
                  <Badge className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800">
                    {poNumber}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 p-1 h-7 w-7 mb-2"
              onMouseDown={(e: any) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={async (e: any) => {
                e.preventDefault();
                e.stopPropagation();
                await handleDelete(project, e);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            {/* Image thumbnail */}
            <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 overflow-hidden">
              {project.coverImage || project.coverPhoto ? (
                <img
                  onClick={(e) => {
                    e.stopPropagation(); // 🔥 critical
                    openImagePreview(
                      getFullImageUrl(project.coverImage),
                      project.artName
                    );
                  }}
                  src={
                    (project.coverImage || project.coverPhoto)?.startsWith?.(
                      "http"
                    )
                      ? project.coverImage || project.coverPhoto
                      : `${BACKEND_URL}/${
                          project.coverImage || project.coverPhoto
                        }`
                  }
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product details in a compact grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-xs text-gray-500">Art & Colour</div>
            <div className="text-sm font-medium truncate">
              {project.artName || "Product Design"}
            </div>
            <div className="text-xs text-gray-600 truncate">
              {project?.color || "Unknown"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Brand & Category</div>
            <div className="text-sm font-medium truncate">{brandName}</div>
            <div className="text-xs text-gray-600 truncate">{categoryName}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Type & Gender</div>
            <div className="text-sm font-medium truncate">{typeName}</div>
            <div className="text-xs text-gray-600 truncate">
              {project?.gender || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Country</div>
            <div className="text-sm font-medium truncate">{countryName}</div>
          </div>
        </div>

        {/* PO Number Section */}
        <div className="mb-3 p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-500 mb-1">PO Status</div>
          {hasPO ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              <span className="text-sm font-semibold text-gray-900">
                {poNumber}
              </span>
            </div>
          ) : (
            <div className="text-sm text-gray-600">Pending Assignment</div>
          )}
        </div>

        {/* Timeline information */}
        <div className="border-t border-gray-100 pt-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">Start:</span>
              </div>
              <span className="text-xs font-medium">
                {project.startDate || project.createdAt
                  ? new Date(
                      project.startDate || project.createdAt
                    ).toLocaleDateString("en-IN")
                  : "TBD"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">Target:</span>
              </div>
              <span className="text-xs font-medium">
                {project.poTarget
                  ? new Date(project.poTarget).toLocaleDateString("en-IN")
                  : project.redSealTargetDate
                  ? new Date(project.redSealTargetDate).toLocaleDateString(
                      "en-IN"
                    )
                  : "TBD"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="text-xs font-medium">Duration:</span>
              </div>
              <span
                className={`text-xs font-medium ${
                  calculateDuration(
                    project.startDate || project.createdAt,
                    project.poTarget || project.redSealTargetDate
                  ).includes("overdue")
                    ? "text-red-600"
                    : calculateDuration(
                        project.startDate || project.createdAt,
                        project.poTarget || project.redSealTargetDate
                      ).includes("Due today")
                    ? "text-orange-600"
                    : "text-gray-700"
                }`}
              >
                {calculateDuration(
                  project.startDate || project.createdAt,
                  project.poTarget || project.redSealTargetDate
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Remarks section if available */}
        {(project.nextUpdate?.note || project.remarks) && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Remarks</div>
            <div className="text-xs text-gray-700 line-clamp-2">
              {project.nextUpdate?.note || project.remarks || "No remarks"}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Table for Desktop
  const DesktopTable = ({
    projects,
    isApproved,
  }: {
    projects: any[];
    isApproved: boolean;
  }) => {
    return (
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product Code
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company & Brand
              </th>
              <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category & Type
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Art & Colour
              </th>
              <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Country
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PO Number
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timeline
              </th>
              <th className="hidden 2xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remarks
              </th>
              <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map((project: any, index: number) => {
              const companyName = pickMasterName(
                companies,
                project.company,
                "Unknown Company"
              );
              const brandName = pickMasterName(
                brands,
                project.brand,
                "Unknown Brand"
              );
              const categoryName = pickMasterName(
                categories,
                project.category,
                "Unknown"
              );
              const typeName = pickMasterName(types, project.type, "Unknown");
              const countryName = pickMasterName(
                countries,
                project.country,
                "Unknown"
              );
              const poNumber =
                project.poNumber || (project.po && project.po.poNumber);

              return (
                <tr
                  key={project._id || project.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleProjectClick(project)}
                >
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mr-3">
                        {String((currentPage - 1) * itemsPerPage + index + 1)
                          .toString()
                          .padStart(2, "0")}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {project.autoCode}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      {project.coverImage || project.coverPhoto ? (
                        <img
                          onClick={(e) => {
                            e.stopPropagation(); // 🔥 critical
                            openImagePreview(
                              getFullImageUrl(project.coverImage),
                              project.artName
                            );
                          }}
                          src={
                            (
                              project.coverImage || project.coverPhoto
                            )?.startsWith?.("http")
                              ? project.coverImage || project.coverPhoto
                              : `${BACKEND_URL}/${
                                  project.coverImage || project.coverPhoto
                                }`
                          }
                          alt="Product"
                          className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {companyName}
                      </div>
                      <div className="text-sm text-gray-500">{brandName}</div>
                    </div>
                  </td>

                  <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{categoryName}</div>
                    <div className="text-sm text-gray-500">{typeName}</div>
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 md:w-4 md:h-4 rounded border border-gray-300 mr-2"
                        style={{
                          backgroundColor: project.color?.hexCode || "#cccccc",
                        }}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[100px]">
                          {project.artName || "Product Design"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {project.color || "Unknown"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{countryName}</div>
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    {poNumber ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-gray-900 font-mono truncate max-w-[120px]">
                            {poNumber}
                          </span>
                        </div>
                        <div className="text-xs text-green-600">Approved</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-500">
                          Pending Assignment
                        </div>
                        <div className="text-xs text-orange-600">
                          Not Assigned
                        </div>
                      </div>
                    )}
                  </td>

                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">
                          {project.startDate || project.createdAt
                            ? new Date(
                                project.startDate || project.createdAt
                              ).toLocaleDateString("en-IN")
                            : "TBD"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs font-medium">
                          {calculateDuration(
                            project.startDate || project.createdAt,
                            project.poTarget || project.redSealTargetDate
                          )}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="hidden 2xl:table-cell px-6 py-4">
                    <div className="text-sm text-gray-900 truncate max-w-[200px]">
                      {project.nextUpdate?.note ||
                        project.remarks ||
                        "No remarks"}
                    </div>
                  </td>

                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={(e: any) => handleDelete(project, e)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Empty state component
  const EmptyState = ({ isPending }: { isPending: boolean }) => {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {isPending ? (
            <Package className="w-8 h-8 text-gray-400" />
          ) : (
            <Lightbulb className="w-8 h-8 text-gray-400" />
          )}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isPending
            ? "No pending PO projects found"
            : "No approved PO projects found"}
        </h3>
        <p className="text-gray-600">
          {isPending
            ? "Projects awaiting PO assignment will appear here"
            : "Projects with approved PO numbers will appear here"}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-linear-to-r from-gray-50 to-gray-100 rounded-t-lg px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white shrink-0">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl">
                  PO Target Date Management
                </CardTitle>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  Track and manage purchase order timelines and delivery
                  schedules
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          <Tabs
            defaultValue={defaultTabFromRedirect}
            className="w-full"
            value={activeTab}
            onValueChange={(tab) => {
              setActiveTab(tab);
              (window as any).erpExtra = { tab };
              setCurrentPage(1);
            }}
          >
            <TabsList className="inline-flex h-9 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground mb-6">
              <TabsTrigger
                value="po-pending"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium gap-1.5"
              >
                <Package className="w-3.5 h-3.5 text-orange-600" />
                <span className="hidden sm:inline">PO Pending</span>
                <Badge
                  variant="secondary"
                  className="ml-1 h-4 px-1.5 text-xs font-medium"
                >
                  {pendingTotal}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="po-approved"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-green-600" />
                <span className="hidden sm:inline">PO Approved</span>
                <Badge
                  variant="secondary"
                  className="ml-1 h-4 px-1.5 text-xs font-medium"
                >
                  {approvedTotal}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="po-pending">
              <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 mb-6">
                <div className="relative w-full sm:flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10 w-full"
                  />
                </div>
                {/* <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Filters</span>
                </Button> */}
                <ProjectFilters
                  countries={countries}
                  companies={companies}
                  brands={brands}
                  categories={categories}
                  types={types}
                  filters={pendingFilters}
                  onFiltersChange={handlePendingFiltersChange}
                  onClearFilters={handlePendingClearFilters}
                  availableFilters={["country", "priority", "company", "brand"]}
                  isMobile={isMobile}
                />
              </div>

              {/* 🔥 ADD SKELETON HERE */}
              {pendingLoading ? (
                isMobile ? (
                  <MobileSkeleton />
                ) : (
                  <TableSkeleton />
                )
              ) : poPendingProjects.length > 0 ? (
                <>
                  {isMobile ? (
                    <div className="space-y-4">
                      {poPendingProjects.map((project: any, index: number) => (
                        <MobileProjectCard
                          key={project._id || project.id}
                          project={project}
                          index={index}
                          isApproved={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <DesktopTable
                      projects={poPendingProjects}
                      isApproved={false}
                    />
                  )}
                </>
              ) : (
                <EmptyState isPending={true} />
              )}

              {!pendingLoading && pendingTotal > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={pendingPages}
                  totalItems={pendingTotal}
                  pageSize={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="po-approved">
              <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 mb-6">
                <div className="relative w-full sm:flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10 w-full"
                  />
                </div>
                {/* <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Filters</span>
                </Button> */}
                <ProjectFilters
                  countries={countries}
                  companies={companies}
                  brands={brands}
                  categories={categories}
                  types={types}
                  filters={approvedFilters}
                  onFiltersChange={handleApprovedFiltersChange}
                  onClearFilters={handleApprovedClearFilters}
                  availableFilters={["country", "priority", "company", "brand"]}
                  isMobile={isMobile}
                />
              </div>

              {/* 🔥 ADD SKELETON HERE */}
              {approvedLoading ? (
                isMobile ? (
                  <MobileSkeleton />
                ) : (
                  <TableSkeleton />
                )
              ) : poApprovedProjects.length > 0 ? (
                <>
                  {isMobile ? (
                    <div className="space-y-4">
                      {poApprovedProjects.map((project: any, index: number) => (
                        <MobileProjectCard
                          key={project._id || project.id}
                          project={project}
                          index={index}
                          isApproved={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <DesktopTable
                      projects={poApprovedProjects}
                      isApproved={true}
                    />
                  )}
                </>
              ) : (
                <EmptyState isPending={false} />
              )}

              {!approvedLoading && approvedTotal > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={approvedPages}
                  totalItems={approvedTotal}
                  pageSize={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ProjectDetailsDialog
        open={projectDetailsOpen}
        onOpenChange={setProjectDetailsOpen}
        project={selectedProject}
        reloadProjects={() => {
          const extra = (window as any).erpExtra;
          if (extra?.tab === "po-approved") {
            reloadApproved();
          } else {
            reloadPending();
          }
        }}
        categories={categories}
        companies={companies}
        brands={brands}
        types={types}
        countries={countries}
        assignPersons={assignPersons}
        setBrands={setBrands}
        setCategories={setCategories}
      />

      <POPendingProjectDetailsDialog
        reloadProjects={reloadPending}
        companies={companies}
        setBrands={setBrands}
        assignPersons={assignPersons}
        setCategories={setCategories}
        open={poPendingDetailsOpen}
        onOpenChange={(v) => setPOPendingDetailsOpen(v)}
        project={selectedProject}
        brands={brands}
        categories={categories}
        types={types}
        countries={countries}
      />

      <POApprovedProjectDetailsDialog
        open={poApprovedDetailsOpen}
        onOpenChange={(v) => setPOApprovedDetailsOpen(v)}
        project={selectedProject}
        companies={companies}
        assignPersons={assignPersons}
        brands={brands}
        setBrands={setBrands}
        categories={categories}
        setCategories={setCategories}
        types={types}
        reloadProjects={reloadApproved}
        countries={countries}
      />
    </div>
  );
}
