import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  Image as ImageIcon,
  Package,
  Search,
  Target,
  Trash2,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";

import { GreenSealProjectDetailsDialog } from "./GreenSealProjectDetailsDialog";
import { ImportTemplateGenerator } from "./ImportTemplateGenerator";

import { useMasters } from "../hooks/useMaster";
import { useProjects } from "../hooks/useProjects";
import { Project } from "./services/projectService";

export function GreenSeal() {
  // Centralized Master Data (from useMasters)
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

  // Central Project Loader
  const {
    projects,
    loadProjects,
    loading: projectsLoading,
    deleteProject,
  } = useProjects();

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Load master data ONCE
  useEffect(() => {
    loadAllMasters();
  }, [loadAllMasters]);

  // Load projects ONCE
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Search
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

  // Only Green Seal items
  const greenSealProjects = filteredProjects.filter(
    (p) => p.status === "green_seal"
  );

  // Pagination helpers
  const paginated = (list: Project[]) => {
    const start = (currentPage - 1) * itemsPerPage;
    return list.slice(start, start + itemsPerPage);
  };

  const totalPages = Math.max(
    1,
    Math.ceil(greenSealProjects.length / itemsPerPage)
  );

  // Helpers
  const calculateDuration = (start?: string, target?: string) => {
    if (!start || !target) return "TBD";
    const s = new Date(start);
    const t = new Date(target);
    const diff = t.getTime() - s.getTime();
    const days = Math.ceil(diff / 86400000);
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Due today";
    return `${days} days`;
  };

  const getStageColor = () => "bg-green-100 text-green-800";

  const getPriorityColor = (priority?: string) => {
    const map: any = {
      high: "bg-red-500 text-white",
      medium: "bg-purple-500 text-white",
      low: "bg-green-600 text-white",
    };
    return map[priority ?? ""] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="bg-linear-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Green Seal Projects</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  View all projects currently in Green Seal stage
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                    Export to Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ImportTemplateGenerator moduleType="GreenSeal" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search green seal projects..."
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

          {/* TABLE */}
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
                {paginated(greenSealProjects).map((p, index) => (
                  <tr
                    key={p._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedProject(p);
                      setDetailsOpen(true);
                    }}
                  >
                    {/* Product Code */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
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

                    {/* Company/Brand */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {p.company?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {p.brand?.name}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {p.category?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {p.type?.name}
                      </div>
                      <div className="text-xs text-gray-400">{p.gender}</div>
                    </td>

                    {/* Art */}
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
                          {p.greenSealTargetDate
                            ? new Date(
                                p.greenSealTargetDate
                              ).toLocaleDateString("en-GB")
                            : "TBD"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span
                          className={`font-medium ${
                            calculateDuration(
                              p.createdAt,
                              p.greenSealTargetDate
                            ).includes("overdue")
                              ? "text-red-600"
                              : calculateDuration(
                                  p.createdAt,
                                  p.greenSealTargetDate
                                ).includes("Due today")
                              ? "text-orange-600"
                              : "text-gray-700"
                          }`}
                        >
                          Duration:{" "}
                          {calculateDuration(
                            p.createdAt,
                            p.greenSealTargetDate
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 text-xs font-semibold rounded-full ${getStageColor()}`}
                      >
                        Green Seal
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

                    {/* Task */}
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
                        onClick={async (e: any) => {
                          e.stopPropagation();

                          await deleteProject(p._id);
                          toast.success("Project removed successfully!");
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
          {greenSealProjects.length === 0 && !projectsLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Green Seal projects found
              </h3>
              <p className="text-gray-600">
                Projects appear here when they reach Green Seal stage.
              </p>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Showing {paginated(greenSealProjects).length} of{" "}
              {greenSealProjects.length} results
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
                  variant={i + 1 === currentPage ? "default" : "outline"}
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

      {/* DETAILS DIALOG */}
      <GreenSealProjectDetailsDialog
        open={detailsOpen}
        onOpenChange={async (v) => {
          if (!v) await loadProjects();
          setDetailsOpen(v);
        }}
        reloadProjects={loadProjects}
        project={selectedProject}
        companies={companies}
        brands={brands}
        setBrands={setBrands}
        categories={categories}
        setCategories={setCategories}
        countries={countries}
        types={types}
        assignPersons={assignPersons}
      />
    </div>
  );
}
