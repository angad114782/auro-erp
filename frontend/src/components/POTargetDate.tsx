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
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import api from "../lib/api";
import { POApprovedProjectDetailsDialog } from "./POApprovedProjectDetailsDialog";
import { POPendingProjectDetailsDialog } from "./POTargetProjectDetailsDialog";
import ProjectDetailsDialog from "./ProjectDetailsDialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function POTargetDate() {
  // Master data
  const [brands, setBrands] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [assignPersons, setAssignPersons] = useState<any[]>([]);

  // Projects
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dialogs & selection
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [poPendingDetailsOpen, setPOPendingDetailsOpen] = useState(false);
  const [poApprovedDetailsOpen, setPOApprovedDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Load master data (same endpoints as RedSeal)
  useEffect(() => {
    let cancel = false;

    async function loadMasters() {
      try {
        const [cRes, bRes, tRes, coRes, apRes] = await Promise.all([
          api.get("/companies"),
          api.get("/brands"),
          api.get("/types"),
          api.get("/countries"),
          api.get("/assign-persons"),
        ]);

        if (cancel) return;

        const pick = (r: any) =>
          r?.data?.data ??
          r?.data?.items ??
          (Array.isArray(r?.data) ? r.data : []);

        setCompanies(pick(cRes));
        setBrands(pick(bRes));
        setTypes(pick(tRes));
        setCountries(pick(coRes));
        setAssignPersons(pick(apRes));

        setCategories([]);
      } catch (e) {
        console.error("Masters load error", e);
      }
    }

    loadMasters();
    return () => {
      cancel = true;
    };
  }, []);

  // Load projects from backend
  const reloadProjects = async () => {
    setLoading(true);
    try {
      const r = await api.get("/projects");
      const data = r.data?.data ?? r.data?.items ?? r.data ?? [];
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects", err);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadProjects();
  }, []);

  // Search filter (applied before tab filtering)
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    const q = searchTerm.toLowerCase();
    return projects.filter((p) => {
      return (
        (p.autoCode?.toLowerCase() ?? "").includes(q) ||
        (p.remarks?.toLowerCase() ?? "").includes(q) ||
        (p.company?.name?.toLowerCase() ?? "").includes(q) ||
        (p.brand?.name?.toLowerCase() ?? "").includes(q) ||
        (p.category?.name?.toLowerCase() ?? "").includes(q)
      );
    });
  }, [projects, searchTerm]);

  // Tabs filter: status keys as you confirmed
  const getProjectsByTab = (tabValue: string) => {
    switch (tabValue) {
      case "po-pending":
        return filteredProjects.filter((p) => p.status === "po_pending");
      case "po-approved":
        return filteredProjects.filter((p) => p.status === "po_approved");
      default:
        return filteredProjects;
    }
  };

  // Pagination helpers
  const getPaginatedProjects = (list: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return list.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (totalItems: number) =>
    Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Duration calculator reused from RedSeal style
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

  // Click handler - opens correct dialog depending on status
  const handleProjectClick = (project: any) => {
    setSelectedProject(project);

    // Determine which dialog to open
    if (project.status === "po_approved") {
      setPOApprovedDetailsOpen(true);
    } else {
      // defaults to pending dialog for po_pending (and anything else)
      setPOPendingDetailsOpen(true);
    }
  };

  // Render pagination UI (keeps same look & feel)
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

  // Delete handler (keeps similar behavior to RedSeal if you want delete)
  const handleDelete = async (project: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/projects/${project._id || project.id}`);
      setProjects((prev) =>
        prev.filter((p) => (p._id || p.id) !== (project._id || project.id))
      );
      toast.success("Project removed");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Delete failed");
    }
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

            {/* PO Pending Tab Content */}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44 min-w-[176px]">
                        PO Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 min-w-[192px]">
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
                        (project, index) => {
                          const brand = brands.find(
                            (b) =>
                              b.id === project.brandId ||
                              b._id === project.brandId ||
                              b.id === project.brand?.id
                          );
                          const company = companies.find(
                            (c) =>
                              c.id === project.companyId ||
                              c._id === project.companyId ||
                              c.id === project.company?.id
                          );
                          const category = categories.find(
                            (c) =>
                              c.id === project.categoryId ||
                              c._id === project.categoryId ||
                              c.id === project.category?.id
                          );
                          const type = types.find(
                            (t) =>
                              t.id === project.typeId ||
                              t._id === project.typeId ||
                              t.id === project.type?.id
                          );
                          const color = colors.find(
                            (cl) =>
                              cl.id === project.colorId ||
                              cl._id === project.colorId ||
                              cl.id === project.color?.id
                          );
                          const country = countries.find(
                            (co) =>
                              co.id === project.countryId ||
                              co._id === project.countryId ||
                              co.id === project.country?.id
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
                                        ).startsWith?.("http")
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
                                    {company?.companyName ||
                                      project.company?.name ||
                                      "Unknown Company"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {brand?.brandName ||
                                      project.brand?.name ||
                                      "Unknown Brand"}
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {category?.categoryName ||
                                    project.category?.name ||
                                    "Unknown"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {type?.typeName ||
                                    project.type?.name ||
                                    "Unknown"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Unisex
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div
                                    className="w-4 h-4 rounded border border-gray-300 mr-2"
                                    style={{
                                      backgroundColor:
                                        color?.hexCode ||
                                        project.color?.hexCode ||
                                        "#cccccc",
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
                                      {color?.colorName ||
                                        project.color ||
                                        "Unknown"}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {country?.countryName ||
                                    project.country?.name ||
                                    "Unknown"}
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap w-44 min-w-[176px]">
                                <div className="text-sm font-medium text-gray-500">
                                  Pending Assignment
                                </div>
                                <div className="text-xs text-orange-600">
                                  Not Assigned
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap w-48 min-w-[192px]">
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
                                  onClick={(e) => handleDelete(project, e)}
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

            {/* PO Approved Tab Content */}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44 min-w-[176px]">
                        PO Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 min-w-[192px]">
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
                        (project, index) => {
                          const brand = brands.find(
                            (b) =>
                              b.id === project.brandId ||
                              b._id === project.brandId ||
                              b.id === project.brand?.id
                          );
                          const company = companies.find(
                            (c) =>
                              c.id === project.companyId ||
                              c._id === project.companyId ||
                              c.id === project.company?.id
                          );
                          const category = categories.find(
                            (c) =>
                              c.id === project.categoryId ||
                              c._id === project.categoryId ||
                              c.id === project.category?.id
                          );
                          const type = types.find(
                            (t) =>
                              t.id === project.typeId ||
                              t._id === project.typeId ||
                              t.id === project.type?.id
                          );
                          const color = colors.find(
                            (cl) =>
                              cl.id === project.colorId ||
                              cl._id === project.colorId ||
                              cl.id === project.color?.id
                          );
                          const country = countries.find(
                            (co) =>
                              co.id === project.countryId ||
                              co._id === project.countryId ||
                              co.id === project.country?.id
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
                                        ).startsWith?.("http")
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
                                    {company?.companyName ||
                                      project.company?.name ||
                                      "Unknown Company"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {brand?.brandName ||
                                      project.brand?.name ||
                                      "Unknown Brand"}
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {category?.categoryName ||
                                    project.category?.name ||
                                    "Unknown"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {type?.typeName ||
                                    project.type?.name ||
                                    "Unknown"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Unisex
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div
                                    className="w-4 h-4 rounded border border-gray-300 mr-2"
                                    style={{
                                      backgroundColor:
                                        color?.hexCode ||
                                        project.color?.hexCode ||
                                        "#cccccc",
                                    }}
                                  />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {(project.remarks || "")
                                        .split(" ")
                                        .slice(0, 2)
                                        .join(" ") || "Product Design"}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {color?.colorName ||
                                        project.color?.name ||
                                        "Unknown"}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {country?.countryName ||
                                    project.country?.name ||
                                    "Unknown"}
                                </div>
                              </td>

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

                              <td className="px-6 py-4 whitespace-nowrap w-48 min-w-[192px]">
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
                                  onClick={(e) => handleDelete(project, e)}
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
        // setSelectedSubModule={setse}
      />

      <POPendingProjectDetailsDialog
        open={poPendingDetailsOpen}
        onOpenChange={async (v: boolean) => {
          if (!v) await reloadProjects();
          setPOPendingDetailsOpen(v);
        }}
        project={selectedProject}
        brands={brands}
        categories={categories}
        types={types}
        colors={colors}
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
        colors={colors}
        countries={countries}
      />
    </div>
  );
}
