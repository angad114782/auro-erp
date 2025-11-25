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
} from "lucide-react";
import React, { useMemo, useState } from "react";
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
  const [loading, setLoading] = useState(false); // page-level loader if needed
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dialogs & selection
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [poPendingDetailsOpen, setPOPendingDetailsOpen] = useState(false);
  const [poApprovedDetailsOpen, setPOApprovedDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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

  // Filter and tabs logic (same as your original)
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects || [];
    const q = searchTerm.toLowerCase();
    return (projects || []).filter((p: any) => {
      return (
        (p.autoCode?.toLowerCase() ?? "").includes(q) ||
        (p.remarks?.toLowerCase() ?? "").includes(q) ||
        (p.company?.name?.toLowerCase() ?? "").includes(q) ||
        (p.brand?.name?.toLowerCase() ?? "").includes(q) ||
        (p.category?.name?.toLowerCase() ?? "").includes(q)
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
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-600">
          Showing {paginatedProjects.length} of {allProjects.length} results
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          >
            Previous
          </Button>
          {[...Array(totalPages)].map((_, index) => {
            const pageNumber = index + 1;
            return (
              <Button
                key={pageNumber}
                size="sm"
                variant={currentPage === pageNumber ? "default" : "outline"}
                className={currentPage === pageNumber ? "bg-blue-500" : ""}
                onClick={() => setCurrentPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
          >
            Next
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

  // Delete handler uses the hook's deleteProject (keeps UI consistent)
  const handleDelete = async (project: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      // useProjects.deleteProject should accept project id (adjust if your hook signature differs)
      await deleteProject(project._id || project.id);
      // local state update is optional because hook's reloadProjects will refresh; still update for immediate UX
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
    // Try to find by id in masterList, otherwise use projectField.name
    const found = masterList.find(
      (m) =>
        m._id === projectField._id ||
        m.id === projectField._id ||
        m._id === projectField?.id
    );
    return found?.name || projectField?.name || fallback || "Unknown";
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-linear-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  PO Target Date Management
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Track and manage purchase order timelines and delivery
                  schedules
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
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
                PO Pending
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
                PO Approved
                <Badge
                  variant="secondary"
                  className="ml-1 h-4 px-1.5 text-xs font-medium"
                >
                  {getProjectsByTab("po-approved").length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* PO Pending */}
            <TabsContent value="po-pending">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search PO pending projects..."
                    value={searchTerm}
                    onChange={(e: any) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image & Profile
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company & Brand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category, Type & Gender
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Art & Colour
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44 min-w-44">
                        PO Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 min-w-48">
                        Timeline, Dates & Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remarks
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPaginatedProjects(getProjectsByTab("po-pending"))
                      .length > 0 ? (
                      getPaginatedProjects(getProjectsByTab("po-pending")).map(
                        (project: any, index: number) => {
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
                          const typeName = pickMasterName(
                            types,
                            project.type,
                            "Unknown"
                          );
                          const countryName = pickMasterName(
                            countries,
                            project.country,
                            "Unknown"
                          );

                          return (
                            <tr
                              key={project._id || project.id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleProjectClick(project)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mr-3">
                                    {String(index + 1).padStart(2, "0")}
                                  </div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {project.autoCode}
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center justify-center">
                                  {project.coverImage || project.coverPhoto ? (
                                    <img
                                      src={
                                        (
                                          project.coverImage ||
                                          project.coverPhoto
                                        )?.startsWith?.("http")
                                          ? project.coverImage ||
                                            project.coverPhoto
                                          : `${BACKEND_URL}/${
                                              project.coverImage ||
                                              project.coverPhoto
                                            }`
                                      }
                                      alt="Product"
                                      className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                      <ImageIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {companyName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {brandName}
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {categoryName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {typeName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {project?.gender || "N/A"}
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div
                                    className="w-4 h-4 rounded border border-gray-300 mr-2"
                                    style={{
                                      backgroundColor:
                                        project.color?.hexCode || "#cccccc",
                                    }}
                                  />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {(project.artName || "")
                                        .split(" ")
                                        .slice(0, 2)
                                        .join(" ") || "Product Design"}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {project.color || "Unknown"}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {countryName}
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap w-44 min-w-44">
                                <div className="text-sm font-medium text-gray-500">
                                  Pending Assignment
                                </div>
                                <div className="text-xs text-orange-600">
                                  Not Assigned
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap w-48 min-w-48">
                                <div>
                                  <div className="flex items-center space-x-1 text-xs text-gray-700 mb-1">
                                    <Clock className="w-3 h-3 text-gray-500" />
                                    <span>
                                      Start:{" "}
                                      {project.startDate
                                        ? new Date(
                                            project.startDate
                                          ).toLocaleDateString("en-IN")
                                        : project.createdAt
                                        ? new Date(
                                            project.createdAt
                                          ).toLocaleDateString("en-IN")
                                        : "TBD"}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-xs text-gray-700 mb-1">
                                    <Target className="w-3 h-3 text-gray-500" />
                                    <span>
                                      Target:{" "}
                                      {project.redSealTargetDate
                                        ? new Date(
                                            project.redSealTargetDate
                                          ).toLocaleDateString("en-IN")
                                        : "TBD"}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-xs mb-1">
                                    <Calendar className="w-3 h-3 text-gray-500" />
                                    <span
                                      className={`font-medium ${
                                        project.redSealTargetDate &&
                                        calculateDuration(
                                          project.createdAt,
                                          project.redSealTargetDate
                                        ).includes("overdue")
                                          ? "text-red-600"
                                          : project.redSealTargetDate &&
                                            calculateDuration(
                                              project.createdAt,
                                              project.redSealTargetDate
                                            ).includes("Due today")
                                          ? "text-orange-600"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      Duration:{" "}
                                      {calculateDuration(
                                        project.createdAt,
                                        project.redSealTargetDate
                                      )}
                                    </span>
                                  </div>
                                  {project.nextUpdate?.date && (
                                    <div className="text-xs text-yellow-800 font-medium">
                                      Next Update:{" "}
                                      {new Date(
                                        project.nextUpdate.date
                                      ).toLocaleDateString("en-IN")}
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                  {project.nextUpdate?.note || "No remarks"}
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-right">
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
                        }
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-6 py-16 text-center text-gray-500"
                        >
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg text-gray-700">
                                No pending PO projects found
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Projects awaiting PO assignment will appear here
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {renderPagination(getProjectsByTab("po-pending"))}
            </TabsContent>

            {/* PO Approved */}
            <TabsContent value="po-approved">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search PO approved projects..."
                    value={searchTerm}
                    onChange={(e: any) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image & Profile
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company & Brand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category, Type & Gender
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Art & Colour
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44 min-w-44">
                        PO Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 min-w-48">
                        Timeline, Dates & Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remarks
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPaginatedProjects(getProjectsByTab("po-approved"))
                      .length > 0 ? (
                      getPaginatedProjects(getProjectsByTab("po-approved")).map(
                        (project: any, index: number) => {
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
                          const typeName = pickMasterName(
                            types,
                            project.type,
                            "Unknown"
                          );
                          const countryName = pickMasterName(
                            countries,
                            project.country,
                            "Unknown"
                          );

                          return (
                            <tr
                              key={project._id || project.id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleProjectClick(project)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mr-3">
                                    {String(index + 1).padStart(2, "0")}
                                  </div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {project.autoCode}
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center justify-center">
                                  {project.coverImage || project.coverPhoto ? (
                                    <img
                                      src={
                                        (
                                          project.coverImage ||
                                          project.coverPhoto
                                        )?.startsWith?.("http")
                                          ? project.coverImage ||
                                            project.coverPhoto
                                          : `${BACKEND_URL}/${
                                              project.coverImage ||
                                              project.coverPhoto
                                            }`
                                      }
                                      alt="Product"
                                      className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                      <ImageIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {companyName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {brandName}
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {categoryName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {typeName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {project?.gender || "Unknown"}
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div
                                    className="w-4 h-4 rounded border border-gray-300 mr-2"
                                    style={{
                                      backgroundColor:
                                        project.color?.hexCode || "#cccccc",
                                    }}
                                  />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {(project.artName || "")
                                        .split(" ")
                                        .slice(0, 2)
                                        .join(" ") || "Product Design"}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {project.color || "Unknown"}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {countryName}
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap w-44 min-w-44">
                                {project.poNumber ||
                                (project.po && project.po.poNumber) ? (
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      <span className="text-sm font-semibold text-gray-900 font-mono">
                                        {project.po?.poNumber ??
                                          project.poNumber}
                                      </span>
                                    </div>
                                    <div className="text-xs text-green-600 ml-6">
                                      Approved
                                    </div>
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

                              <td className="px-6 py-4 whitespace-nowrap w-48 min-w-48">
                                <div>
                                  <div className="flex items-center space-x-1 text-xs text-gray-700 mb-1">
                                    <Clock className="w-3 h-3 text-gray-500" />
                                    <span>
                                      Start:{" "}
                                      {project.startDate
                                        ? new Date(
                                            project.startDate
                                          ).toLocaleDateString("en-IN")
                                        : project.createdAt
                                        ? new Date(
                                            project.createdAt
                                          ).toLocaleDateString("en-IN")
                                        : "TBD"}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-xs text-gray-700 mb-1">
                                    <Target className="w-3 h-3 text-gray-500" />
                                    <span>
                                      Target:{" "}
                                      {project.poTarget
                                        ? new Date(
                                            project.poTarget
                                          ).toLocaleDateString("en-IN")
                                        : "TBD"}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-xs mb-1">
                                    <Calendar className="w-3 h-3 text-gray-500" />
                                    <span
                                      className={`font-medium ${
                                        project.poTarget &&
                                        calculateDuration(
                                          project.startDate ||
                                            project.createdAt,
                                          project.poTarget
                                        ).includes("overdue")
                                          ? "text-red-600"
                                          : project.poTarget &&
                                            calculateDuration(
                                              project.startDate ||
                                                project.createdAt,
                                              project.poTarget
                                            ).includes("Due today")
                                          ? "text-orange-600"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      Duration:{" "}
                                      {calculateDuration(
                                        project.startDate || project.createdAt,
                                        project.poTarget
                                      )}
                                    </span>
                                  </div>
                                  {project.nextUpdate?.date && (
                                    <div className="text-xs text-yellow-800 font-medium">
                                      Next Update:{" "}
                                      {new Date(
                                        project.nextUpdate.date
                                      ).toLocaleDateString("en-IN")}
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                  {project.nextUpdate?.note ??
                                    project.remarks ??
                                    "No remarks"}
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-right">
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
                        }
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-6 py-16 text-center text-gray-500"
                        >
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                              <Lightbulb className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg text-gray-700">
                                No approved PO projects found
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Projects with approved PO numbers will appear
                                here
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

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
        brands={brands}
        categories={categories}
        types={types}
        reloadProjects={reloadProjects}
        countries={countries}
      />
    </div>
  );
}
