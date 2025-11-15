import React, { useState } from "react";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Lightbulb,
  ImageIcon,
  Workflow,
  Calculator,
  Clock,
  User,
  IndianRupee,
  Calendar,
  FileText,
  Target,
  LayoutDashboard,
  X,
  Building,
  Users,
  AlertCircle,
  CheckCircle,
  Activity,
  Pause,
  ShoppingCart,
  CircleCheckBig,
  CircleX,
  Package,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Filter,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useERPStore } from "../lib/data-store";
import { CreateProjectDialog } from "./CreateProjectDialog";
import ProjectDetailsDialog from "./ProjectDetailsDialog";
import { POPendingProjectDetailsDialog } from "./POTargetProjectDetailsDialog";
import { POApprovedProjectDetailsDialog } from "./POApprovedProjectDetailsDialog";
import { toast } from "sonner@2.0.3";
import type { RDProject } from "../lib/data-store";

export function POTargetDate() {
  const {
    rdProjects,
    brands,
    companies,
    categories,
    types,
    colors,
    countries,
    selectRDProject,
  } = useERPStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [poPendingDetailsOpen, setPOPendingDetailsOpen] = useState(false);
  const [poApprovedDetailsOpen, setPOApprovedDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<RDProject | null>(
    null
  );

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      "Idea Submitted": "bg-blue-100 text-blue-800",
      "Costing Pending": "bg-yellow-100 text-yellow-800",
      "Costing Received": "bg-orange-100 text-orange-800",
      Prototype: "bg-purple-100 text-purple-800",
      "Red Seal": "bg-red-100 text-red-800",
      "Green Seal": "bg-green-100 text-green-800",
      "Final Approved": "bg-emerald-100 text-emerald-800",
      "PO Target": "bg-indigo-100 text-indigo-800",
      "PO Issued": "bg-gray-100 text-gray-800",
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      High: "bg-red-500 text-white",
      Medium: "bg-purple-500 text-white",
      Low: "bg-green-600 text-white",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  const getProgressValue = (stage: string) => {
    const stages = [
      "Idea Submitted",
      "Costing Pending",
      "Costing Received",
      "Prototype",
      "Red Seal",
      "Green Seal",
      "Final Approved",
      "PO Target",
      "PO Issued",
    ];
    return ((stages.indexOf(stage) + 1) / stages.length) * 100;
  };

  const getProjectsByTab = (tabValue: string) => {
    const searchFiltered = rdProjects.filter((project) => {
      const matchesSearch =
        (project.autoCode?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (project.remarks?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        );
      return matchesSearch;
    });

    switch (tabValue) {
      case "po-approved":
        return searchFiltered.filter(
          (p) =>
            (p.status === "Final Approved" && p.poReceived) ||
            p.status === "PO Issued" ||
            (p.status === "PO Target" && p.poStatus === "Approved")
        );
      case "po-pending":
        return searchFiltered.filter(
          (p) =>
            (p.status === "Final Approved" && !p.poReceived) ||
            (p.status === "PO Target" && p.poStatus === "Pending")
        );
      default:
        return searchFiltered;
    }
  };

  const getPaginatedProjects = (projects: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return projects.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  const handleProjectClick = (project: RDProject) => {
    setSelectedProject(project);
    // Open correct dialog based on project status
    const isPending =
      (project.status === "Final Approved" && !project.poReceived) ||
      (project.status === "PO Target" && project.poStatus === "Pending");
    const isApproved =
      (project.status === "Final Approved" && project.poReceived) ||
      project.status === "PO Issued" ||
      (project.status === "PO Target" && project.poStatus === "Approved");

    if (isApproved) {
      setPOApprovedDetailsOpen(true);
    } else {
      setPOPendingDetailsOpen(true);
    }
  };

  // Calculate duration between start date and PO target date
  const calculateDuration = (startDate: string, poTargetDate?: string) => {
    if (!poTargetDate) return "TBD";

    const start = new Date(startDate);
    const target = new Date(poTargetDate);

    // Calculate difference in days
    const diffTime = target.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return "Due today";
    return `${diffDays} days`;
  };

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
                className={
                  currentPage === pageNumber
                    ? "bg-blue-500 hover:bg-blue-600"
                    : ""
                }
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

  return (
    <div className="space-y-6">
      {/* Main Content Card */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
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
          {/* Tabs */}
          <Tabs
            defaultValue="po-pending"
            className="w-full"
            onValueChange={() => setCurrentPage(1)}
          >
            <TabsList className="inline-flex h-9 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground mb-6">
              <TabsTrigger
                value="po-pending"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow gap-1.5"
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
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow gap-1.5"
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

            <TabsContent value="po-pending">
              {/* Search and Filters */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search PO pending projects..."
                    value={searchTerm}
                    onChange={(e) => {
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

              {/* PO Pending Projects Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Product Code
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Image & Profile
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Company & Brand
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Category, Type & Gender
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Art & Colour
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Country
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44 min-w-[176px]"
                      >
                        PO Number
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 min-w-[192px]"
                      >
                        Timeline, Dates & Duration
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPaginatedProjects(getProjectsByTab("po-pending"))
                      .length > 0 ? (
                      getPaginatedProjects(getProjectsByTab("po-pending")).map(
                        (project, index) => {
                          const brand = brands.find(
                            (b) => b.id === project.brandId
                          );
                          const company = companies.find(
                            (c) => c.id === brand?.companyId
                          );
                          const category = categories.find(
                            (c) => c.id === project.categoryId
                          );
                          const type = types.find(
                            (t) => t.id === project.typeId
                          );
                          const color = colors.find(
                            (cl) => cl.id === project.colorId
                          );
                          const country = countries.find(
                            (co) => co.id === project.countryId
                          );

                          return (
                            <tr
                              key={project.id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleProjectClick(project)}
                            >
                              {/* Product Code */}
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

                              {/* Image & Profile */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center justify-center">
                                  {project.coverPhoto ? (
                                    <img
                                      src={project.coverPhoto}
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

                              {/* Company & Brand */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {company?.companyName || "Unknown Company"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {brand?.brandName || "Unknown Brand"}
                                  </div>
                                </div>
                              </td>

                              {/* Category, Type & Gender */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {category?.categoryName || "Unknown"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {type?.typeName || "Unknown"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Unisex
                                </div>
                              </td>

                              {/* Art & Colour */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div
                                    className="w-4 h-4 rounded border border-gray-300 mr-2"
                                    style={{
                                      backgroundColor:
                                        color?.hexCode || "#cccccc",
                                    }}
                                  ></div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {project.remarks
                                        ?.split(" ")
                                        .slice(0, 2)
                                        .join(" ") || "Product Design"}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {color?.colorName || "Unknown"}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Country */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {country?.countryName || "Unknown"}
                                </div>
                              </td>

                              {/* PO Number */}
                              <td className="px-6 py-4 whitespace-nowrap w-44 min-w-[176px]">
                                <div className="text-sm font-medium text-gray-500">
                                  Pending Assignment
                                </div>
                                <div className="text-xs text-orange-600">
                                  Not Assigned
                                </div>
                              </td>

                              {/* Timeline, Dates & Duration */}
                              <td className="px-6 py-4 whitespace-nowrap w-48 min-w-[192px]">
                                <div>
                                  <div className="flex items-center space-x-1 text-xs text-gray-700 mb-1">
                                    <Clock className="w-3 h-3 text-gray-500" />
                                    <span>
                                      Start:{" "}
                                      {new Date(
                                        project.startDate
                                      ).toLocaleDateString("en-IN")}
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
                                          project.startDate,
                                          project.poTarget
                                        ).includes("overdue")
                                          ? "text-red-600"
                                          : project.poTarget &&
                                            calculateDuration(
                                              project.startDate,
                                              project.poTarget
                                            ).includes("Due today")
                                          ? "text-orange-600"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      Duration:{" "}
                                      {calculateDuration(
                                        project.startDate,
                                        project.poTarget
                                      )}
                                    </span>
                                  </div>
                                  {project.nextUpdateDate && (
                                    <div className="text-xs text-yellow-800 font-medium">
                                      Next Update:{" "}
                                      {new Date(
                                        project.nextUpdateDate
                                      ).toLocaleDateString("en-IN")}
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Remarks */}
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                  {project.remarks || "No remarks"}
                                </div>
                              </td>
                            </tr>
                          );
                        }
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
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

            <TabsContent value="po-approved">
              {/* Search and Filters */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search PO approved projects..."
                    value={searchTerm}
                    onChange={(e) => {
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

              {/* PO Approved Projects Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Product Code
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Image & Profile
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Company & Brand
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Category, Type & Gender
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Art & Colour
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Country
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44 min-w-[176px]"
                      >
                        PO Number
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 min-w-[192px]"
                      >
                        Timeline, Dates & Duration
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPaginatedProjects(getProjectsByTab("po-approved"))
                      .length > 0 ? (
                      getPaginatedProjects(getProjectsByTab("po-approved")).map(
                        (project, index) => {
                          const brand = brands.find(
                            (b) => b.id === project.brandId
                          );
                          const company = companies.find(
                            (c) => c.id === brand?.companyId
                          );
                          const category = categories.find(
                            (c) => c.id === project.categoryId
                          );
                          const type = types.find(
                            (t) => t.id === project.typeId
                          );
                          const color = colors.find(
                            (cl) => cl.id === project.colorId
                          );
                          const country = countries.find(
                            (co) => co.id === project.countryId
                          );

                          return (
                            <tr
                              key={project.id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleProjectClick(project)}
                            >
                              {/* Product Code */}
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

                              {/* Image & Profile */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center justify-center">
                                  {project.coverPhoto ? (
                                    <img
                                      src={project.coverPhoto}
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

                              {/* Company & Brand */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {company?.companyName || "Unknown Company"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {brand?.brandName || "Unknown Brand"}
                                  </div>
                                </div>
                              </td>

                              {/* Category, Type & Gender */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {category?.categoryName || "Unknown"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {type?.typeName || "Unknown"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Unisex
                                </div>
                              </td>

                              {/* Art & Colour */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div
                                    className="w-4 h-4 rounded border border-gray-300 mr-2"
                                    style={{
                                      backgroundColor:
                                        color?.hexCode || "#cccccc",
                                    }}
                                  ></div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {project.remarks
                                        ?.split(" ")
                                        .slice(0, 2)
                                        .join(" ") || "Product Design"}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {color?.colorName || "Unknown"}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Country */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {country?.countryName || "Unknown"}
                                </div>
                              </td>

                              {/* PO Number */}
                              <td className="px-6 py-4 whitespace-nowrap w-44 min-w-[176px]">
                                {project.poNumber ? (
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      <span className="text-sm font-semibold text-gray-900 font-mono">
                                        {project.poNumber}
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

                              {/* Timeline, Dates & Duration */}
                              <td className="px-6 py-4 whitespace-nowrap w-48 min-w-[192px]">
                                <div>
                                  <div className="flex items-center space-x-1 text-xs text-gray-700 mb-1">
                                    <Clock className="w-3 h-3 text-gray-500" />
                                    <span>
                                      Start:{" "}
                                      {new Date(
                                        project.startDate
                                      ).toLocaleDateString("en-IN")}
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
                                          project.startDate,
                                          project.poTarget
                                        ).includes("overdue")
                                          ? "text-red-600"
                                          : project.poTarget &&
                                            calculateDuration(
                                              project.startDate,
                                              project.poTarget
                                            ).includes("Due today")
                                          ? "text-orange-600"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      Duration:{" "}
                                      {calculateDuration(
                                        project.startDate,
                                        project.poTarget
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Remarks */}
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                  {project.remarks || "No remarks"}
                                </div>
                              </td>
                            </tr>
                          );
                        }
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
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
      />

      {/* PO Pending Dialog */}
      <POPendingProjectDetailsDialog
        open={poPendingDetailsOpen}
        onOpenChange={setPOPendingDetailsOpen}
        project={selectedProject}
        brands={brands}
        categories={categories}
        types={types}
        colors={colors}
        countries={countries}
      />

      {/* PO Approved Dialog */}
      <POApprovedProjectDetailsDialog
        open={poApprovedDetailsOpen}
        onOpenChange={setPOApprovedDetailsOpen}
        project={selectedProject}
        brands={brands}
        categories={categories}
        types={types}
        colors={colors}
        countries={countries}
      />
    </div>
  );
}
