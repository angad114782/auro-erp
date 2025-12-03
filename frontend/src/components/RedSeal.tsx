import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  Filter,
  ImageIcon,
  Package,
  Search,
  Target,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

import { RedSealProjectDetailsDialog } from "./RedSealProjectDetailsDialog";

import { useProjects } from "../hooks/useProjects";
import { useMasters } from "../hooks/useMaster";
import { Project } from "./services/projectService";

export function RedSeal() {
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

  const { projects, loadProjects, loading: projectsLoading } = useProjects();

  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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

  // load masters once
  useEffect(() => {
    loadAllMasters();
  }, [loadAllMasters]);

  // load projects once
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Search filter
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;

    const q = searchTerm.toLowerCase();
    return projects.filter((p) => {
      return (
        p.autoCode?.toLowerCase()?.includes(q) ||
        p.artName?.toLowerCase()?.includes(q) ||
        p.company?.name?.toLowerCase()?.includes(q) ||
        p.brand?.name?.toLowerCase()?.includes(q) ||
        p.category?.name?.toLowerCase()?.includes(q)
      );
    });
  }, [projects, searchTerm]);

  // Only Red Seal
  const redSealProjects = filteredProjects.filter(
    (p) => p.status === "red_seal"
  );

  // Pagination helpers
  const paginated = (list: any[]) => {
    const start = (currentPage - 1) * itemsPerPage;
    return list.slice(start, start + itemsPerPage);
  };

  const totalPages = Math.max(
    1,
    Math.ceil(redSealProjects.length / itemsPerPage)
  );

  // Helpers
  const calculateDuration = (start?: string, target?: string) => {
    if (!start || !target) return "TBD";
    const s = new Date(start);
    const t = new Date(target);
    const diff = t.getTime() - s.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Due today";
    return `${days} days`;
  };

  const getStageColor = (stage?: string) => {
    const map: Record<string, string> = {
      red_seal: "bg-red-100 text-red-800",
    };
    return map[stage ?? ""] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority?: string) => {
    const map: Record<string, string> = {
      high: "bg-red-500 text-white",
      medium: "bg-purple-500 text-white",
      low: "bg-green-600 text-white",
    };
    return map[priority ?? ""] || "bg-gray-100 text-gray-800";
  };

  // Handlers
  const handleProjectClick = (p: any) => {
    setSelectedProject(p);
    setDetailsOpen(true);
  };

  const handleDelete = async (p: any) => {
    try {
      await fetch(`/api/projects/${p._id}`, { method: "DELETE" });
      await loadProjects();
      toast.success("Project removed");
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="bg-linear-to-r from-gray-50 to-gray-100 rounded-t-lg px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl">
                  Red Seal Projects
                </CardTitle>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  View all projects currently in Red Seal stage
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          {/* Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 mb-6">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search red seal projects..."
                value={searchTerm}
                onChange={(e) => {
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

          {/* Mobile Cards View */}
          {isMobile ? (
            <div className="space-y-4">
              {paginated(redSealProjects).map((p: any, index) => (
                <div
                  key={p._id}
                  className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleProjectClick(p)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 mr-3 shrink-0">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {p.autoCode}
                        </div>
                        <div className="text-xs text-gray-500">
                          {p?.company?.name || ""}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge
                            className={`text-xs px-2 py-0.5 ${getStageColor(
                              p.status
                            )}`}
                          >
                            {p.status || "N/A"}
                          </Badge>
                          <Badge
                            className={`text-xs px-2 py-0.5 ${getPriorityColor(
                              p.priority
                            )}`}
                          >
                            {p.priority || "Low"}
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
                          await handleDelete(p);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      {/* Image thumbnail */}
                      <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 overflow-hidden">
                        {p.coverImage ? (
                          <img
                            src={
                              p.coverImage.startsWith("http")
                                ? p.coverImage
                                : `${BACKEND_URL}/${p.coverImage}`
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
                        {p.artName || "N/A"}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {p?.color || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">
                        Brand & Category
                      </div>
                      <div className="text-sm font-medium truncate">
                        {p?.brand?.name || ""}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {p?.category?.name || ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Type & Gender</div>
                      <div className="text-sm font-medium truncate">
                        {p?.type?.name || ""}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {p?.gender || ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Country</div>
                      <div className="text-sm font-medium truncate">
                        {p?.country?.name || ""}
                      </div>
                    </div>
                  </div>

                  {/* Timeline information */}
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-500">Assigned To</div>
                      <div className="text-xs font-medium">
                        {p.assignPerson?.name || "N/A"}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">Start:</span>
                        </div>
                        <span className="text-xs font-medium">
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleDateString("en-GB")
                            : "TBD"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">Target:</span>
                        </div>
                        <span className="text-xs font-medium">
                          {p.redSealTargetDate
                            ? new Date(p.redSealTargetDate).toLocaleDateString(
                                "en-GB"
                              )
                            : "TBD"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs font-medium">Duration:</span>
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                          {calculateDuration(p.createdAt, p.redSealTargetDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remarks section if available */}
                  {(p.clientApproval || p?.nextUpdate?.note) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Remarks</div>
                      <div className="text-xs text-gray-700 line-clamp-2">
                        {p.clientApproval || p?.nextUpdate?.note || "N/A"}
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
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product Code
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Image
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Company & Brand
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category & Type
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Art & Colour
                    </th>
                    <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Country
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Timeline
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Priority
                    </th>
                    <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {paginated(redSealProjects).map((p, index) => (
                    <tr
                      key={p._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleProjectClick(p)}
                    >
                      {/* Product Code */}
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 mr-3">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {p.autoCode}
                          </div>
                        </div>
                      </td>

                      {/* Image */}
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 border shadow-sm flex items-center justify-center">
                            {p.coverImage ? (
                              <img
                                src={
                                  p.coverImage.startsWith("http")
                                    ? p.coverImage
                                    : `${BACKEND_URL}/${p.coverImage}`
                                }
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Company & Brand */}
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {p.company?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {p.brand?.name}
                        </div>
                      </td>

                      {/* Category, Type, Gender */}
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {p.category?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {p.type?.name}
                        </div>
                      </td>

                      {/* Art & Colour */}
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{p.artName}</div>
                        <div className="text-sm text-gray-500">{p.color}</div>
                      </td>

                      {/* Country */}
                      <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                        {p.country?.name}
                      </td>

                      {/* Timeline */}
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">
                              {p.createdAt
                                ? new Date(p.createdAt).toLocaleDateString(
                                    "en-GB"
                                  )
                                : "TBD"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="text-xs font-medium">
                              {calculateDuration(
                                p.createdAt,
                                p.redSealTargetDate
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 text-xs font-semibold rounded-full ${getStageColor(
                            p.status
                          )}`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getPriorityColor(
                            p.priority
                          )}`}
                        >
                          {p.priority || "Low"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(p);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty state */}
          {redSealProjects.length === 0 && !loading && !projectsLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Red Seal projects found
              </h3>
              <p className="text-gray-600">
                Projects will appear here when they reach the Red Seal stage.
              </p>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-600">
              Showing {paginated(redSealProjects).length} of{" "}
              {redSealProjects.length} results
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                    if (
                      pageNumber === totalPages &&
                      currentPage < totalPages - 2
                    ) {
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
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <RedSealProjectDetailsDialog
        open={detailsOpen}
        onOpenChange={async (v) => {
          if (!v) await loadProjects();
          setDetailsOpen(v);
        }}
        reloadProjects={loadProjects}
        project={selectedProject}
        companies={companies}
        setCompanies={() => {}}
        brands={brands}
        setBrands={setBrands}
        categories={categories}
        setCategories={setCategories}
        countries={countries}
        setCountries={() => {}}
        types={types}
        setTypes={() => {}}
        assignPersons={assignPersons}
      />
    </div>
  );
}
