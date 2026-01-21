// ProjectDevelopment.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  Filter,
  ImageIcon,
  Package,
  Plus,
  Search,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { useMasters } from "../hooks/useMaster";
import { Badge } from "./ui/badge";
import { useProjectQuery } from "./NewHooks/useProjectQuery";
import { useDebounce } from "./NewHooks/useDebounce";
import { useProjects } from "../hooks/useProjects";
import ProjectDetailsDialog from "./ProjectDetailsDialog";
import { ProjectFilters } from "./ProjectFilters";
import Pagination from "./Pagination";
import { useImagePreview } from "../lib/stores/useImagePreview";
import { getFullImageUrl, formatLabel } from "../lib/utils";

export default function ProjectDevelopment() {
  const {
    companies,
    brands,
    categories,
    types,
    countries,
    assignPersons,
    loadAllMasters,
    loadBrandsByCompany,
    loadCategoriesByBrand,
    setBrands,
    setCategories,
  } = useMasters();
  const openImagePreview = useImagePreview((s) => s.openPreview);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { deleteProject } = useProjects();
  const [filters, setFilters] = useState({
    country: "",
    priority: "",
    company: "",
    brand: "",
    category: "",
    type: "",
  });
  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";

  const debouncedSearchTerm = useDebounce(searchTerm, 600);
  const {
    data: projects,
    total,
    pages,
    loading: projectsLoading,
    reload,
  } = useProjectQuery({
    status: "prototype",
    search: debouncedSearchTerm,
    page: currentPage,
    limit: itemsPerPage,
    // NEW: Pass filters to the query
    country: filters.country,
    priority: filters.priority,
    company: filters.company,
    brand: filters.brand,
    category: filters.category,
    type: filters.type,
  });

  const handleFiltersChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      country: "",
      priority: "",
      company: "",
      brand: "",
      category: "",
      type: "",
    });
    setCurrentPage(1);
  }, []);
  // Check screen size on mount and resize
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

  // load masters on mount
  useEffect(() => {
    loadAllMasters();
  }, [loadAllMasters]);

  // helpers
  const calculateDuration = (start?: string, target?: string) => {
    if (!start || !target) return "TBD";
    const s = new Date(start);
    const t = new Date(target);
    if (isNaN(s.getTime()) || isNaN(t.getTime())) return "TBD";
    const diffTime = t.getTime() - s.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return "Due today";
    return `${diffDays} days`;
  };

  const getStageColor = (stage?: string) => {
    const colors: Record<string, string> = {
      idea: "bg-blue-100 text-blue-800",
      costing_pending: "bg-yellow-100 text-yellow-800",
      costing_received: "bg-orange-100 text-orange-800",
      prototype: "bg-purple-100 text-purple-800",
      red_seal: "bg-red-100 text-red-800",
      green_seal: "bg-green-100 text-green-800",
      final_approved: "bg-emerald-100 text-emerald-800",
      po_issued: "bg-gray-100 text-gray-800",
    };
    return colors[stage ?? ""] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority?: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-500 text-white",
      medium: "bg-purple-500 text-white",
      low: "bg-green-600 text-white",
    };
    return (
      colors[(priority || "").toLowerCase()] || "bg-gray-100 text-gray-800"
    );
  };

  // actions
  const handleProjectClick = (project: any) => {
    setSelectedProject(project);
    setProjectDetailsOpen(true);
  };

  const handleDeleteProject = async (project: any) => {
    if (!project?._id) return;
    try {
      // You'll need to implement deleteProject in your API service
      await deleteProject(project._id);
      await reload();
      toast.success("Project removed");
    } catch (err: any) {
      console.error("Project remove failed", err);
      toast.error(err?.response?.data?.message || "Project remove failed");
    }
  };

  // Loading skeleton for table
  const TableSkeleton = () => (
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
              Timeline
            </th>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Priority
            </th>
            <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {[...Array(6)].map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-4 md:px-6 py-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </td>
              <td className="px-4 md:px-6 py-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </td>
              <td className="px-4 md:px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </td>
              <td className="hidden lg:table-cell px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </td>
              <td className="px-4 md:px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </td>
              <td className="hidden xl:table-cell px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </td>
              <td className="px-4 md:px-6 py-4">
                <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </td>
              <td className="px-4 md:px-6 py-4">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </td>
              <td className="px-4 md:px-6 py-4">
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </td>
              <td className="hidden xl:table-cell px-6 py-4">
                <div className="h-8 bg-gray-200 rounded w-8"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Loading skeleton for mobile cards
  const MobileSkeleton = () => (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="border border-gray-200 rounded-lg p-4 bg-white animate-pulse"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="flex gap-2">
                  <div className="h-5 bg-gray-200 rounded w-12"></div>
                  <div className="h-5 bg-gray-200 rounded w-10"></div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="w-7 h-7 bg-gray-200 rounded mb-2"></div>
              <div className="w-10 h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[...Array(4)].map((_, j) => (
              <div key={j}>
                <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-14"></div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="space-y-2">
              {[...Array(3)].map((_, k) => (
                <div key={k} className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="bg-linear-to-r from-gray-50 to-gray-100 rounded-t-lg px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl">
                  Project Development
                </CardTitle>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  Manage development projects and track progress
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                className="bg-[#0c9dcb] hover:bg-[#0c9dcb]/90 w-full md:w-auto"
                onClick={() => setNewProjectOpen(true)}
                size={isMobile ? "default" : "default"}
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Add New Project</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
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
            <ProjectFilters
              countries={countries}
              companies={companies}
              brands={brands}
              categories={categories}
              types={types}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              availableFilters={["country", "priority", "company", "brand"]}
              isMobile={isMobile}
            />
            {/* <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Filters</span>
            </Button> */}
          </div>

          {/* Loading State */}
          {projectsLoading ? (
            isMobile ? (
              <MobileSkeleton />
            ) : (
              <TableSkeleton />
            )
          ) : (
            <>
              {/* Mobile Cards View */}
              {isMobile ? (
                <div className="space-y-4">
                  {projects.map((project: any, index) => (
                    <div
                      key={project._id}
                      className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleProjectClick(project)}
                    >
                      {/* Header with serial number and basic info */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3 shrink-0">
                            {String(
                              (currentPage - 1) * itemsPerPage + index + 1
                            )
                              .toString()
                              .padStart(2, "0")}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {project.autoCode}
                            </div>
                            <div className="text-xs text-gray-500">
                              {project?.company?.name || ""}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge
                                className={`text-xs px-2 py-0.5 ${getStageColor(
                                  project.status
                                )}`}
                              >
                                {formatLabel(project.status) || "N/A"}
                              </Badge>
                              <Badge
                                className={`text-xs px-2 py-0.5 ${getPriorityColor(
                                  project.priority
                                )}`}
                              >
                                {formatLabel(project.priority) || "Low"}
                              </Badge>
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
                              await handleDeleteProject(project);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                          {/* Image thumbnail */}
                          <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 overflow-hidden">
                            {project.coverImage ? (
                              <img
                                src={
                                  project.coverImage.startsWith("http")
                                    ? project.coverImage
                                    : `${BACKEND_URL}/${project.coverImage}`
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openImagePreview(
                                    getFullImageUrl(project.coverImage),
                                    project.artName
                                  );
                                }}
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
                          <div className="text-xs text-gray-500">
                            Art & Colour
                          </div>
                          <div className="text-sm font-medium truncate">
                            {project.artName || "N/A"}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {project?.color || "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">
                            Brand & Category
                          </div>
                          <div className="text-sm font-medium truncate">
                            {project?.brand?.name || ""}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {project?.category?.name || ""}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">
                            Type & Gender
                          </div>
                          <div className="text-sm font-medium truncate">
                            {project?.type?.name || ""}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {project?.gender || ""}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Country</div>
                          <div className="text-sm font-medium truncate">
                            {project?.country?.name || ""}
                          </div>
                        </div>
                      </div>

                      {/* Timeline information */}
                      <div className="border-t border-gray-100 pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-gray-500">
                            Assigned To
                          </div>
                          <div className="text-xs font-medium">
                            {project.assignPerson?.name || "N/A"}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-600">
                                Start:
                              </span>
                            </div>
                            <span className="text-xs font-medium">
                              {project.createdAt
                                ? new Date(
                                    project.createdAt
                                  ).toLocaleDateString("en-GB")
                                : "TBD"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-600">
                                Target:
                              </span>
                            </div>
                            <span className="text-xs font-medium">
                              {project.redSealTargetDate
                                ? new Date(
                                    project.redSealTargetDate
                                  ).toLocaleDateString("en-GB")
                                : "TBD"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-xs font-medium">
                                Duration:
                              </span>
                            </div>
                            <span className="text-xs font-medium text-gray-700">
                              {calculateDuration(
                                project.createdAt,
                                project.redSealTargetDate
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Remarks section if available */}
                      {(project.clientApproval ||
                        project?.nextUpdate?.note) && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500 mb-1">
                            Remarks
                          </div>
                          <div className="text-xs text-gray-700 line-clamp-2">
                            {project.clientApproval ||
                              project?.nextUpdate?.note ||
                              "N/A"}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop Table View */
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
                          Timeline
                        </th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.map((project: any, index) => (
                        <tr
                          key={project._id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleProjectClick(project)}
                        >
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                                {String(
                                  (currentPage - 1) * itemsPerPage + index + 1
                                )
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
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center">
                                {project.coverImage ? (
                                  <img
                                    src={
                                      project.coverImage.startsWith("http")
                                        ? project.coverImage
                                        : `${BACKEND_URL}/${project.coverImage}`
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openImagePreview(
                                        getFullImageUrl(project.coverImage),
                                        project.artName
                                      );
                                    }}
                                    alt="Cover"
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <ImageIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {project?.company?.name || ""}
                              </div>
                              <div className="text-sm text-gray-500">
                                {project?.brand?.name || ""}
                              </div>
                            </div>
                          </td>

                          <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {project?.category?.name || ""}
                              </div>
                              <div className="text-sm text-gray-500">
                                {project?.type?.name || ""}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {project.artName || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {project?.color || "N/A"}
                              </div>
                            </div>
                          </td>

                          <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {project?.country?.name || ""}
                            </div>
                          </td>

                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs">
                                  {project.createdAt
                                    ? new Date(
                                        project.createdAt
                                      ).toLocaleDateString("en-GB")
                                    : "TBD"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span className="text-xs font-medium">
                                  {calculateDuration(
                                    project.createdAt,
                                    project.redSealTargetDate
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${getStageColor(
                                project.status
                              )}`}
                            >
                               {formatLabel(project.status) || "N/A"}
                            </span>
                          </td>

                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs leading-4 font-semibold rounded ${getPriorityColor(
                                project.priority
                              )}`}
                            >
                               {formatLabel(project.priority) || "Low"}
                            </span>
                          </td>

                          <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onMouseDown={(e: any) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={async (e: any) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  await handleDeleteProject(project);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Empty state */}
              {projects.length === 0 && !projectsLoading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No development projects found
                  </h3>
                  <p className="text-gray-600">
                    Start by creating a new project or adjust your search
                    filters.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Pagination */}

          <Pagination
            currentPage={currentPage}
            totalPages={pages}
            totalItems={total}
            pageSize={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
          />
        </CardContent>
      </Card>

      <CreateProjectDialog
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onCreated={async () => {
          await reload();
          setNewProjectOpen(false);
        }}
      />

      <ProjectDetailsDialog
        open={projectDetailsOpen}
        onOpenChange={(v) => setProjectDetailsOpen(v)}
        reloadProjects={reload}
        project={selectedProject}
        companies={companies}
        brands={brands}
        categories={categories}
        types={types}
        countries={countries}
        assignPersons={assignPersons}
        loadBrandsByCompany={loadBrandsByCompany}
        loadCategoriesByBrand={loadCategoriesByBrand}
        setBrands={setBrands}
        setCategories={setCategories}
      />
    </div>
  );
}
