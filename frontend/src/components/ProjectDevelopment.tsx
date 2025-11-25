// ProjectDevelopment.tsx
import React, { useEffect, useMemo, useState } from "react";
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
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import ProjectDetailsDialog from "./ProjectDetailsDialog";
import { useProjects } from "../hooks/useProjects";
import { useMasters } from "../hooks/useMaster";

export default function ProjectDevelopment() {
  // hooks
  const {
    companies,
    brands,
    categories,
    types,
    countries,
    assignPersons,
    loading,
    loadAllMasters,
    loadBrandsByCompany,
    loadCategoriesByBrand,
    setBrands,
    setCategories,
  } = useMasters();

  const {
    projects,
    loading: projectsLoading,
    loadProjects,
    createProject,
    deleteProject,
  } = useProjects();

  // UI / local
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";

  // load on mount
  useEffect(() => {
    loadAllMasters();
    loadProjects();
  }, []);

  // filtering & pagination
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    const q = searchTerm.toLowerCase();
    return projects.filter((p: any) => {
      const code = p.autoCode?.toLowerCase() ?? "";
      const art = p.artName?.toLowerCase() ?? "";
      const company = p.company?.name?.toLowerCase() ?? "";
      const brand = p.brand?.name?.toLowerCase() ?? "";
      const cat = p.category?.name?.toLowerCase() ?? "";
      return (
        code.includes(q) ||
        art.includes(q) ||
        company.includes(q) ||
        brand.includes(q) ||
        cat.includes(q)
      );
    });
  }, [projects, searchTerm]);

  const getPaginatedProjects = (list: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return list.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (totalItems: number) =>
    Math.max(1, Math.ceil(totalItems / itemsPerPage));

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
      await deleteProject(project._id);
      toast.success("Project removed");
    } catch (err: any) {
      console.error("Project remove failed", err);
      toast.error(err?.response?.data?.message || "Project remove failed");
    }
  };

  // filter for development (example)
  const developmentProjects = filteredProjects.filter(
    (project: any) => project.status === "prototype"
  );

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="bg-linear-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Project Development</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Manage development projects and track progress
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Import functionality coming soon")}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button
                className="bg-[#0c9dcb] hover:bg-[#0c9dcb]/90"
                onClick={() => setNewProjectOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Project
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search development projects..."
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeline, Dates & Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task-INC
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
                {getPaginatedProjects(developmentProjects).map(
                  (project: any, index) => (
                    <tr
                      key={project._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleProjectClick(project)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {project.autoCode}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center">
                            {project.coverImage ? (
                              <img
                                src={
                                  project.coverImage.startsWith("http")
                                    ? project.coverImage
                                    : `${BACKEND_URL}/${project.coverImage}`
                                }
                                alt="Cover"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {project?.company?.name || ""}
                          </div>
                          <div className="text-sm text-gray-500">
                            {project?.brand?.name || ""}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {project?.category?.name || ""}
                          </div>
                          <div className="text-sm text-gray-500">
                            {project?.type?.name || ""}
                          </div>
                          <div className="text-xs text-gray-400">
                            {project?.gender || ""}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {project.artName || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {project?.color || "N/A"}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {project?.country?.name || ""}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              Start:{" "}
                              {project.createdAt
                                ? new Date(
                                    project.createdAt
                                  ).toLocaleDateString("en-GB")
                                : "TBD"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mb-1">
                            <Target className="w-3 h-3" />
                            <span>
                              Target:{" "}
                              {project.redSealTargetDate
                                ? new Date(
                                    project.redSealTargetDate
                                  ).toLocaleDateString("en-GB")
                                : "TBD"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="font-medium text-gray-700">
                              Duration:{" "}
                              {calculateDuration(
                                project.createdAt,
                                project.redSealTargetDate
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${getStageColor(
                            project.status
                          )}`}
                        >
                          {project.status || "N/A"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs leading-4 font-semibold rounded ${getPriorityColor(
                            project.priority
                          )}`}
                        >
                          {project.priority || "Low"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {project.assignPerson?.name || "N/A"}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            Next:{" "}
                            {project.redSealTargetDate
                              ? new Date(
                                  project.redSealTargetDate
                                ).toLocaleDateString("en-GB")
                              : "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {project.clientApproval || "N/A"}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                  )
                )}
              </tbody>
            </table>
          </div>

          {developmentProjects.length === 0 && !projectsLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No development projects found
              </h3>
              <p className="text-gray-600">
                Start by creating a new project or adjust your search filters.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Showing {getPaginatedProjects(developmentProjects).length} of{" "}
              {developmentProjects.length} results
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

              {Array.from(
                { length: getTotalPages(developmentProjects.length) },
                (_, i) => (
                  <Button
                    key={i}
                    size="sm"
                    className={
                      i + 1 === currentPage
                        ? "bg-blue-500 hover:bg-blue-600"
                        : ""
                    }
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="sm"
                disabled={
                  currentPage >= getTotalPages(developmentProjects.length)
                }
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(getTotalPages(developmentProjects.length), p + 1)
                  )
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateProjectDialog
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onCreated={async () => {
          await loadProjects();
          setNewProjectOpen(false);
        }}
      />

      <ProjectDetailsDialog
        open={projectDetailsOpen}
        onOpenChange={async (v) => {
          if (!v) await loadProjects();
          setProjectDetailsOpen(v);
        }}
        reloadProjects={loadProjects}
        project={selectedProject}
        companies={companies}
        brands={brands}
        categories={categories}
        types={types}
        countries={countries}
        assignPersons={assignPersons}
        // pass master helpers to dialog (so dialog uses them instead of projectService)
        loadBrandsByCompany={loadBrandsByCompany}
        loadCategoriesByBrand={loadCategoriesByBrand}
        setBrands={setBrands}
        setCategories={setCategories}
      />
    </div>
  );
}
