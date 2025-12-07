// ProjectListCard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useProjects } from "../hooks/useProjects";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function ProjectListCard() {
  const { projects, loading, loadProjects } = useProjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [isMobile, setIsMobile] = useState(false);

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";

  // Check screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Status options
  const statusOptions = [
    {
      value: "all",
      label: "All Projects",
      color: "bg-gray-100 text-gray-700",
      count: projects.length,
    },
    {
      value: "prototype",
      label: "Prototype",
      color: "bg-purple-100 text-purple-700",
      count: projects.filter((p: any) => p.status === "prototype").length,
    },
    {
      value: "red_seal",
      label: "Red Seal",
      color: "bg-red-100 text-red-700",
      count: projects.filter((p: any) => p.status === "red_seal").length,
    },
    {
      value: "green_seal",
      label: "Green Seal",
      color: "bg-green-100 text-green-700",
      count: projects.filter((p: any) => p.status === "green_seal").length,
    },
    {
      value: "po_pending",
      label: "PO Pending",
      color: "bg-orange-100 text-orange-700",
      count: projects.filter((p: any) => p.status === "po_pending").length,
    },
    {
      value: "po_approved",
      label: "PO Approved",
      color: "bg-blue-100 text-blue-700",
      count: projects.filter((p: any) => p.status === "po_approved").length,
    },
  ];

  // Filter projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Status filter
    if (selectedStatus !== "all") {
      result = result.filter(
        (project: any) => project.status === selectedStatus
      );
    }

    // Priority filter
    if (selectedPriority !== "all") {
      result = result.filter(
        (project: any) => project.priority === selectedPriority
      );
    }

    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((project: any) => {
        return (
          project.autoCode?.toLowerCase().includes(q) ||
          project.artName?.toLowerCase().includes(q) ||
          project?.company?.name?.toLowerCase().includes(q) ||
          project?.brand?.name?.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [projects, selectedStatus, selectedPriority, searchTerm]);

  // Get status color
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      idea: "bg-blue-100 text-blue-800",
      costing_pending: "bg-yellow-100 text-yellow-800",
      costing_received: "bg-orange-100 text-orange-800",
      prototype: "bg-purple-100 text-purple-800",
      red_seal: "bg-red-100 text-red-800",
      green_seal: "bg-green-100 text-green-800",
      final_approved: "bg-emerald-100 text-emerald-800",
      po_issued: "bg-gray-100 text-gray-800",
      po_pending: "bg-orange-100 text-orange-800",
      po_approved: "bg-blue-100 text-blue-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-100 text-red-700 border-red-200",
      medium: "bg-purple-100 text-purple-700 border-purple-200",
      low: "bg-green-100 text-green-700 border-green-200",
    };
    return colors[priority] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedPriority("all");
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedStatus !== "all") count++;
    if (selectedPriority !== "all") count++;
    if (searchTerm) count++;
    return count;
  };

  // Handle image loading
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = "none";
    const parent = e.currentTarget.parentElement;
    if (parent) {
      const placeholder = document.createElement("div");
      placeholder.className =
        "w-full h-full flex items-center justify-center bg-gray-100";
      placeholder.innerHTML = `
        <div class="text-center">
          <svg class="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span class="text-xs text-gray-500 mt-1 block">No image</span>
        </div>
      `;
      parent.appendChild(placeholder);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Projects List</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {projects.length} total projects
              </p>
            </div>

            {/* Quick Status Filter - Mobile */}
            {isMobile ? (
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center justify-between">
                        <span>{status.label}</span>
                        <Badge variant="outline" className="ml-2">
                          {status.count}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2">
                {statusOptions.map((status) => (
                  <Button
                    key={status.value}
                    variant={
                      selectedStatus === status.value ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedStatus(status.value)}
                    className={`text-xs ${
                      selectedStatus === status.value ? status.color : ""
                    }`}
                  >
                    {status.label}
                    <Badge
                      variant={
                        selectedStatus === status.value
                          ? "secondary"
                          : "outline"
                      }
                      className="ml-1 text-xs"
                    >
                      {status.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Select
                value={selectedPriority}
                onValueChange={setSelectedPriority}
              >
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              {getActiveFilterCount() > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-9"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Filter Summary */}
          {(selectedStatus !== "all" ||
            selectedPriority !== "all" ||
            searchTerm) && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">
                  Showing {filteredProjects.length} projects
                  {selectedStatus !== "all" &&
                    ` • Status: ${
                      statusOptions.find((s) => s.value === selectedStatus)
                        ?.label
                    }`}
                  {selectedPriority !== "all" &&
                    ` • Priority: ${selectedPriority}`}
                  {searchTerm && ` • Search: "${searchTerm}"`}
                </span>
              </div>
            </div>
          )}

          {/* Projects List - Compact Table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-gray-600 text-sm">Loading...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Filter className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No projects found
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Try adjusting your filters
              </p>
              {getActiveFilterCount() > 0 && (
                <Button size="sm" onClick={clearAllFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-xs text-gray-600 border-b">
                  <tr>
                    <th className="text-left py-3 px-2 font-medium">Project</th>
                    <th className="text-left py-3 px-2 font-medium hidden sm:table-cell">
                      Company
                    </th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium hidden md:table-cell">
                      Timeline
                    </th>
                    <th className="text-left py-3 px-2 font-medium">
                      Priority
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project: any) => (
                    <tr
                      key={project._id}
                      className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        // Handle project click - you can open details dialog here
                        console.log("Clicked project:", project);
                      }}
                    >
                      {/* Project Column */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          {/* Image/Icon */}
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border overflow-hidden flex items-center justify-center shrink-0">
                            {project.coverImage ? (
                              <img
                                src={
                                  project.coverImage.startsWith("http")
                                    ? project.coverImage
                                    : `${BACKEND_URL}/${project.coverImage}`
                                }
                                alt="Cover"
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                              />
                            ) : (
                              <div className="text-gray-400">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                          </div>

                          {/* Project Info */}
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate max-w-[180px]">
                              {project.autoCode}
                            </div>
                            <div className="text-sm text-gray-600 truncate max-w-[180px]">
                              {project.artName || "Untitled"}
                            </div>
                            <div className="text-xs text-gray-500 sm:hidden">
                              {project?.company?.name || "-"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Company Column - Hidden on mobile */}
                      <td className="py-3 px-2 hidden sm:table-cell">
                        <div className="text-sm text-gray-700">
                          {project?.company?.name || "-"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {project?.brand?.name || "-"}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-3 px-2">
                        <Badge
                          className={`text-xs px-2 py-1 ${getStatusColor(
                            project.status
                          )}`}
                        >
                          {project.status?.replace("_", " ") || "-"}
                        </Badge>
                      </td>

                      {/* Timeline Column - Hidden on mobile */}
                      <td className="py-3 px-2 hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{formatDate(project.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{formatDate(project.redSealTargetDate)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Priority Column */}
                      <td className="py-3 px-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getPriorityColor(
                            project.priority
                          )}`}
                        >
                          {project.priority || "low"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Quick Info for Mobile */}
              {isMobile && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>{filteredProjects.length} projects</span>
                    <span>Tap row for details</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Simple Footer */}
          {filteredProjects.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                <div className="text-gray-600">
                  Showing {filteredProjects.length} of {projects.length}{" "}
                  projects
                </div>
                <div className="text-gray-500 text-xs">
                  Last updated:{" "}
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
