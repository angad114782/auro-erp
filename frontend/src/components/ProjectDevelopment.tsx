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
import api from "../lib/api";
import { CreateProjectDialog, NewProject } from "./CreateProjectDialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import ProjectDetailsDialog, {
  ProductDevelopment,
} from "./ProjectDetailsDialog";

type Generic = {
  _id: string;
  name: string;
};

export interface ProductDevelopmentResponseProps {
  _id: string;
  autoCode: string;
  gender?: string;
  company?: Generic;
  brand?: Generic;
  category?: Generic;
  type?: Generic;
  country?: Generic;
  color?: string;
  assignPerson?: Generic;
  artName?: string;
  status?: string;
  createdAt?: string;
  redSealTargetDate?: string;
  priority?: "high" | "medium" | "low" | string;
  productDesc?: string;
  coverImage?: string; // relative path returned by backend
  sampleImages?: string[]; // array of paths
  startDate?: string; // optional
  endDate?: string; // optional
  clientApproval?: string | null;
}

export function ProjectDevelopment() {
  // loading
  const [loading, setLoading] = useState(false);

  // data lists (masters)
  const [companies, setCompanies] = useState<Generic[]>([]);
  const [brands, setBrands] = useState<Generic[]>([]);
  const [categories, setCategories] = useState<Generic[]>([]);
  const [types, setTypes] = useState<Generic[]>([]);
  const [countries, setCountries] = useState<Generic[]>([]);
  const [assignPersons, setAssignPersons] = useState<Generic[]>([]);

  // projects
  const [projects, setProjects] = useState<ProductDevelopment[]>([]);

  // pagination & UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] =
    useState<ProductDevelopmentResponseProps | null>(null);

  // --- helper: backend base url for images (if you use VITE_BACKEND_URL) ---
  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";

  // ---- load masters (companies, brands, categories, types, countries, assign persons)
  useEffect(() => {
    let cancelled = false;
    async function loadMasters() {
      try {
        const [cRes, bRes, tRes, coRes, apRes] = await Promise.all([
          api.get("/companies"),
          api.get("/brands"),
          api.get("/types"),
          api.get("/countries"),
          api.get("/assign-persons"),
        ]);

        if (cancelled) return;

        const pickArr = (r: any) =>
          Array.isArray(r?.data?.data)
            ? r.data.data
            : Array.isArray(r?.data?.items)
            ? r.data.items
            : Array.isArray(r?.data)
            ? r.data
            : [];

        setCompanies(pickArr(cRes));
        setBrands(pickArr(bRes));
        setTypes(pickArr(tRes));
        setCountries(pickArr(coRes));
        setAssignPersons(pickArr(apRes));

        // ❗ IMPORTANT:
        // categories depend on company + brand, so keep empty here
        setCategories([]);
      } catch (err) {
        console.error("Failed to load masters", err);
      }
    }

    loadMasters();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- load projects
  const reloadProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get("/projects");
      // try multiple shapes
      const data =
        res.data?.data ??
        res.data?.items ??
        (Array.isArray(res.data) ? res.data : []);
      setProjects(data);
    } catch (err: any) {
      console.error("Projects load error", err);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadProjects();
  }, []);

  // ---- filtering & pagination
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    const q = searchTerm.toLowerCase();
    return projects.filter((p) => {
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

  const getPaginatedProjects = (list: ProductDevelopment[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return list.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (totalItems: number) =>
    Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // ---- helpers
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
      "Idea Submitted": "bg-blue-100 text-blue-800",
      "Costing Pending": "bg-yellow-100 text-yellow-800",
      "Costing Received": "bg-orange-100 text-orange-800",
      Prototype: "bg-purple-100 text-purple-800",
      "Red Seal": "bg-red-100 text-red-800",
      "Green Seal": "bg-green-100 text-green-800",
      "Final Approved": "bg-emerald-100 text-emerald-800",
      "PO Issued": "bg-gray-100 text-gray-800",
    };
    return colors[stage ?? ""] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority?: string) => {
    const colors: Record<string, string> = {
      High: "bg-red-500 text-white",
      high: "bg-red-500 text-white",
      Medium: "bg-purple-500 text-white",
      medium: "bg-purple-500 text-white",
      Low: "bg-green-600 text-white",
      low: "bg-green-600 text-white",
    };
    return colors[priority ?? ""] || "bg-gray-100 text-gray-800";
  };

  // ---- actions
  const handleProjectClick = (project: ProductDevelopmentResponseProps) => {
    setSelectedProject(project);
    setProjectDetailsOpen(true);
  };

  const handleDeleteProject = async (
    project: ProductDevelopmentResponseProps
  ) => {
    if (!project || !project._id) return;
    try {
      await api.delete(`/projects/${project._id}`);
      setProjects((prev) => prev.filter((p) => p._id !== project._id));
      toast.success("Project removed");
    } catch (err: any) {
      console.error("Project remove failed", err);
      toast.error(err?.response?.data?.message || "Project remove failed");
    }
  };

  // ---- render
  const developmentProjects = filteredProjects.filter(
    (project) => project.status === "prototype"
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
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
          {/* Search and Filters */}
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

          {/* Projects Table */}
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
                  (project: any, index) => {
                    return (
                      <tr
                        key={project._id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleProjectClick(project)}
                      >
                        {/* Product Code */}
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

                        {/* Image & Profile */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center">
                              {project.coverImage ? (
                                // show image using backend url (if present)
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

                        {/* Company & Brand */}
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

                        {/* Category, Type & Gender */}
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

                        {/* Art & Colour */}
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

                        {/* Country */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {project?.country?.name || ""}
                          </div>
                        </td>

                        {/* Timeline, Dates & Duration */}
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

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${getStageColor(
                              project.status
                            )}`}
                          >
                            {project.status || "N/A"}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs leading-4 font-semibold rounded ${getPriorityColor(
                              project.priority
                            )}`}
                          >
                            {project.priority || "Low"}
                          </span>
                        </td>

                        {/* Task-INC */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {project.assignPerson?.name || "N/A"}
                          </div>
                        </td>

                        {/* Remarks */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              Next: {"N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {project.clientApproval?.status || "N/A"}
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onMouseDown={(e: any) => {
                                // prevent row click
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
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {developmentProjects.length === 0 && !loading && (
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

          {/* Pagination */}
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

      {/* Dialogs */}
      <CreateProjectDialog
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onCreated={() => reloadProjects()}
      />

      <ProjectDetailsDialog
        open={projectDetailsOpen}
        onOpenChange={async (v) => {
          if (!v) await reloadProjects(); // 🟩 FIX: refresh when dialog closes
          setProjectDetailsOpen(v);
        }}
        reloadProjects={reloadProjects} // 🔥 pass it to dialog
        project={selectedProject}
        companies={companies}
        setCompanies={setCompanies}
        brands={brands}
        setBrands={setBrands}
        categories={categories}
        setCategories={setCategories}
        countries={countries}
        setCountries={setCountries}
        types={types}
        setTypes={setTypes}
        assignPersons={assignPersons}
      />
    </div>
  );
}
