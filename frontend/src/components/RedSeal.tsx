// RedSeal.tsx
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
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

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

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // load masters once
  useEffect(() => {
    loadAllMasters();
  }, [loadAllMasters]);

  // load projects once (useProjects exposes loadProjects)
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
      // useProjects hook exposes deleteProject in your hook; if not, fallback to API
      // Here we call loadProjects after deletion to keep things simple
      await fetch(`/api/projects/${p._id}`, { method: "DELETE" }); // fallback; ideally use projectService or useProjects.deleteProject
      await loadProjects();
      toast.success("Project removed");
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="bg-linear-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Red Seal Projects</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  View all projects currently in Red Seal stage
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search red seal projects..."
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

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Product Code",
                    "Image & Profile",
                    "Company & Brand",
                    "Category, Type & Gender",
                    "Art & Colour",
                    "Country",
                    "Timeline, Dates & Duration",
                    "Status",
                    "Priority",
                    "Task-INC",
                    "Remarks",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
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
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border shadow-sm flex items-center justify-center">
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
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Company & Brand */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {p.company?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {p.brand?.name}
                      </div>
                    </td>

                    {/* Category, Type, Gender */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {p.category?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {p.type?.name}
                      </div>
                      <div className="text-xs text-gray-400">{p.gender}</div>
                    </td>

                    {/* Art & Colour */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{p.artName}</div>
                      <div className="text-sm text-gray-500">{p.color}</div>
                    </td>

                    {/* Country */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.country?.name}
                    </td>

                    {/* Timeline */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          Start:{" "}
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleDateString("en-GB")
                            : "TBD"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mb-1">
                        <Target className="w-3 h-3" />
                        <span>
                          Target:{" "}
                          {p.redSealTargetDate
                            ? new Date(p.redSealTargetDate).toLocaleDateString(
                                "en-GB"
                              )
                            : "TBD"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="font-medium text-gray-700">
                          Duration:{" "}
                          {calculateDuration(p.createdAt, p.redSealTargetDate)}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 text-xs font-semibold rounded-full ${getStageColor(
                          p.status
                        )}`}
                      >
                        {p.status}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getPriorityColor(
                          p.priority
                        )}`}
                      >
                        {p.priority || "Low"}
                      </span>
                    </td>

                    {/* Task INC */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.assignPerson?.name || "N/A"}
                    </td>

                    {/* Remarks */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Next:{" "}
                        {p?.nextUpdate?.date
                          ? new Date(p.nextUpdate.date).toLocaleDateString(
                              "en-GB"
                            )
                          : "TBD"}
                      </div>

                      <div className="text-sm text-gray-500">
                        {p?.nextUpdate?.note ?? "N/A"}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
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
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Showing {paginated(redSealProjects).length} of{" "}
              {redSealProjects.length} results
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>

              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  size="sm"
                  className={i + 1 === currentPage ? "bg-blue-500" : ""}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                Next
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
