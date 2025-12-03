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
import React, { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { POApprovedProjectDetailsDialog } from "./POApprovedProjectDetailsDialog";
import { POPendingProjectDetailsDialog } from "./POTargetProjectDetailsDialog";
import ProjectDetailsDialog from "./ProjectDetailsDialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

import { useProjects } from "../hooks/useProjects";
import { useMasters } from "../hooks/useMaster";

export function POTargetDate({ defaultTab = "po-pending" }) {
  // Use hooks (from your project)
  const {
    projects,
    loadProjects: reloadProjects,
    loading: projectsLoading,
    deleteProject,
  } = useProjects();

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
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [isMobile, setIsMobile] = useState(false);

  // Dialogs & selection
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [poPendingDetailsOpen, setPOPendingDetailsOpen] = useState(false);
  const [poApprovedDetailsOpen, setPOApprovedDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Adjust items per page based on screen size
      if (window.innerWidth < 640) {
        setItemsPerPage(4);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(6);
      } else {
        setItemsPerPage(8);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load masters and projects on mount (hooks expose loaders)
  React.useEffect(() => {
    loadAllMasters();
  }, [loadAllMasters]);

  React.useEffect(() => {
    reloadProjects();
  }, [reloadProjects]);

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

  // Filter and tabs logic
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects || [];
    const q = searchTerm.toLowerCase();
    return (projects || []).filter((p: any) => {
      return (
        (p.autoCode?.toLowerCase() ?? "").includes(q) ||
        (p.remarks?.toLowerCase() ?? "").includes(q) ||
        (p.company?.name?.toLowerCase() ?? "").includes(q) ||
        (p.brand?.name?.toLowerCase() ?? "").includes(q) ||
        (p.category?.name?.toLowerCase() ?? "").includes(q) ||
        (p.poNumber?.toLowerCase() ?? "").includes(q)
      );
    });
  }, [projects, searchTerm]);

  const getProjectsByTab = (tabValue: string) => {
    switch (tabValue) {
      case "po-pending":
        return filteredProjects.filter((p: any) => p.status === "po_pending");
      case "po-approved":
        return filteredProjects.filter((p: any) => p.status === "po_approved");
      default:
        return filteredProjects;
    }
  };

  const getPaginatedProjects = (list: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return list.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (totalItems: number) =>
    Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const renderPagination = (allProjects: any[]) => {
    const totalPages = getTotalPages(allProjects.length);
    const paginatedProjects = getPaginatedProjects(allProjects);

    if (allProjects.length === 0) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 space-y-4 sm:space-y-0">
        <div className="text-sm text-gray-600">
          Showing {paginatedProjects.length} of {allProjects.length} results
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = i + 1;
              if (totalPages > 5) {
                if (currentPage > 3 && pageNumber === 1) {
                  return (
                    <>
                      <Button
                        key={1}
                        size="sm"
                        className={
                          1 === currentPage
                            ? "bg-blue-500 hover:bg-blue-600"
                            : ""
                        }
                        onClick={() => setCurrentPage(1)}
                      >
                        1
                      </Button>
                      <span className="px-2">...</span>
                    </>
                  );
                }
                if (
                  pageNumber >= currentPage - 1 &&
                  pageNumber <= currentPage + 1
                ) {
                  return (
                    <Button
                      key={pageNumber}
                      size="sm"
                      className={
                        pageNumber === currentPage
                          ? "bg-blue-500 hover:bg-blue-600"
                          : ""
                      }
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                }
                if (pageNumber === totalPages && currentPage < totalPages - 2) {
                  return (
                    <>
                      <span className="px-2">...</span>
                      <Button
                        key={totalPages}
                        size="sm"
                        className={
                          totalPages === currentPage
                            ? "bg-blue-500 hover:bg-blue-600"
                            : ""
                        }
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  );
                }
                return null;
              } else {
                return (
                  <Button
                    key={pageNumber}
                    size="sm"
                    className={
                      pageNumber === currentPage
                        ? "bg-blue-500 hover:bg-blue-600"
                        : ""
                    }
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              }
            }).filter(Boolean)}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  // Click handler opens the appropriate dialog
  const handleProjectClick = (project: any) => {
    setSelectedProject(project);
    if (project?.status === "po_approved") {
      setPOApprovedDetailsOpen(true);
    } else {
      setPOPendingDetailsOpen(true);
    }
  };

  // Delete handler
  const handleDelete = async (project: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await deleteProject(project._id || project.id);
      await reloadProjects();
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
    tab,
  }: {
    project: any;
    index: number;
    tab: string;
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

    const isApproved = tab === "po-approved";
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
              {String(index + 1).padStart(2, "0")}
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
    tab,
  }: {
    projects: any[];
    tab: string;
  }) => {
    const isApproved = tab === "po-approved";

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
                        {String(index + 1).padStart(2, "0")}
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
  const EmptyState = ({ tab }: { tab: string }) => {
    const isPending = tab === "po-pending";

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
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="w-full md:w-auto">
                <Upload className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Import</span>
              </Button>
              <Button variant="outline" size="sm" className="w-full md:w-auto">
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          <Tabs
            defaultValue={defaultTabFromRedirect}
            className="w-full"
            onValueChange={() => setCurrentPage(1)}
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
                  {getProjectsByTab("po-pending").length}
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
                  {getProjectsByTab("po-approved").length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* PO Pending Tab */}
            <TabsContent value="po-pending">
              <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 mb-6">
                <div className="relative w-full sm:flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search PO pending projects..."
                    value={searchTerm}
                    onChange={(e: any) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 w-full"
                  />
                </div>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
              </div>

              {getProjectsByTab("po-pending").length > 0 ? (
                <>
                  {isMobile ? (
                    <div className="space-y-4">
                      {getPaginatedProjects(getProjectsByTab("po-pending")).map(
                        (project: any, index: number) => (
                          <MobileProjectCard
                            key={project._id || project.id}
                            project={project}
                            index={index}
                            tab="po-pending"
                          />
                        )
                      )}
                    </div>
                  ) : (
                    <DesktopTable
                      projects={getPaginatedProjects(
                        getProjectsByTab("po-pending")
                      )}
                      tab="po-pending"
                    />
                  )}
                </>
              ) : (
                <EmptyState tab="po-pending" />
              )}

              {renderPagination(getProjectsByTab("po-pending"))}
            </TabsContent>

            {/* PO Approved Tab */}
            <TabsContent value="po-approved">
              <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 mb-6">
                <div className="relative w-full sm:flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search PO approved projects..."
                    value={searchTerm}
                    onChange={(e: any) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 w-full"
                  />
                </div>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
              </div>

              {getProjectsByTab("po-approved").length > 0 ? (
                <>
                  {isMobile ? (
                    <div className="space-y-4">
                      {getPaginatedProjects(
                        getProjectsByTab("po-approved")
                      ).map((project: any, index: number) => (
                        <MobileProjectCard
                          key={project._id || project.id}
                          project={project}
                          index={index}
                          tab="po-approved"
                        />
                      ))}
                    </div>
                  ) : (
                    <DesktopTable
                      projects={getPaginatedProjects(
                        getProjectsByTab("po-approved")
                      )}
                      tab="po-approved"
                    />
                  )}
                </>
              ) : (
                <EmptyState tab="po-approved" />
              )}

              {renderPagination(getProjectsByTab("po-approved"))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ProjectDetailsDialog
        open={projectDetailsOpen}
        onOpenChange={setProjectDetailsOpen}
        project={selectedProject}
        reloadProjects={reloadProjects}
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
        reloadProjects={reloadProjects}
        companies={companies}
        setBrands={setBrands}
        assignPersons={assignPersons}
        setCategories={setCategories}
        open={poPendingDetailsOpen}
        onOpenChange={async (v: boolean) => {
          if (!v) await reloadProjects();
          setPOPendingDetailsOpen(v);
        }}
        project={selectedProject}
        brands={brands}
        categories={categories}
        types={types}
        countries={countries}
      />

      <POApprovedProjectDetailsDialog
        open={poApprovedDetailsOpen}
        onOpenChange={async (v: boolean) => {
          if (!v) await reloadProjects();
          setPOApprovedDetailsOpen(v);
        }}
        project={selectedProject}
        companies={companies}
        assignPersons={assignPersons}
        brands={brands}
        setBrands={setBrands}
        categories={categories}
        setCategories={setCategories}
        types={types}
        reloadProjects={reloadProjects}
        countries={countries}
      />
    </div>
  );
}
