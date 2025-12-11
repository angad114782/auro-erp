// GreenSeal.tsx – rewritten using exact RedSeal skeleton

import React, { useCallback, useEffect, useState } from "react";
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
import { Badge } from "./ui/badge";

import { GreenSealProjectDetailsDialog } from "./GreenSealProjectDetailsDialog";
import { useMasters } from "../hooks/useMaster";
import { useProjectQuery } from "./NewHooks/useProjectQuery";
import Pagination from "./PrototypeProject/Pagination";
import { useProjects } from "../hooks/useProjects";
import { useDebounce } from "./NewHooks/useDebounce";

import { TableSkeleton, MobileSkeleton } from "./Skeletons";

export function GreenSeal() {
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

  const [isMobile, setIsMobile] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const debouncedSearch = useDebounce((value: string) => {
    setDebouncedSearchTerm(value);
    setCurrentPage(1);
  }, 300);

  const {
    data: greenSealProjects,
    total,
    pages,
    loading,
    reload,
  } = useProjectQuery({
    status: "green_seal",
    search: debouncedSearchTerm,
    page: currentPage,
    limit: itemsPerPage,
  });

  const { deleteProject } = useProjects();

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  // device detection & pagination page size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 640) setItemsPerPage(4);
      else if (window.innerWidth < 1024) setItemsPerPage(6);
      else setItemsPerPage(8);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadAllMasters();
  }, [loadAllMasters]);

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

  const handleProjectClick = (p: any) => {
    setSelectedProject(p);
    setDetailsOpen(true);
  };

  const handleDelete = async (p: any) => {
    try {
      await deleteProject(p._id);
      await reload();
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
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl">
                  Green Seal Projects
                </CardTitle>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  View all projects currently in Green Seal stage
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
                placeholder="Search projects..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 w-full"
              />
            </div>

            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>

          {/* Loading State */}
          {loading ? (
            isMobile ? (
              <MobileSkeleton />
            ) : (
              <TableSkeleton />
            )
          ) : (
            <>
              {/* MOBILE VIEW */}
              {isMobile ? (
                <div className="space-y-4">
                  {greenSealProjects.map((p: any, index) => (
                    <div
                      key={p._id}
                      className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleProjectClick(p)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3 shrink-0">
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
                                className={`text-xs px-2 py-0.5 ${getStageColor()}`}
                              >
                                Green Seal
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

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 p-1 h-7 w-7 mb-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(p);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Image */}
                      <div className="w-10 h-10 rounded-md bg-gray-100 border overflow-hidden mb-3">
                        {p.coverImage ? (
                          <img
                            src={
                              p.coverImage.startsWith("http")
                                ? p.coverImage
                                : `${BACKEND_URL}/${p.coverImage}`
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 m-auto text-gray-400" />
                        )}
                      </div>

                      {/* Product Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Art & Colour</p>
                          <p className="text-sm font-medium truncate">
                            {p.artName}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {p.color}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Brand & Category
                          </p>
                          <p className="text-sm font-medium truncate">
                            {p.brand?.name}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {p.category?.name}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Type</p>
                          <p className="text-sm">{p.type?.name}</p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Country</p>
                          <p className="text-sm">{p.country?.name}</p>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="border-t border-gray-100 pt-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs">Start:</span>
                            </div>
                            <span className="text-xs font-medium">
                              {new Date(p.createdAt).toLocaleDateString(
                                "en-GB"
                              )}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3 text-gray-400" />
                              <span className="text-xs">Target:</span>
                            </div>
                            <span className="text-xs font-medium">
                              {p.greenSealTargetDate
                                ? new Date(
                                    p.greenSealTargetDate
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
                                p.createdAt,
                                p.greenSealTargetDate
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {p?.nextUpdate?.note && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Remarks</p>
                          <p className="text-xs text-gray-700 line-clamp-2">
                            {p.nextUpdate.note}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // DESKTOP TABLE VIEW
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Product Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Image
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Company & Brand
                        </th>
                        <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Category & Type
                        </th>
                        <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Country
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Timeline
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Priority
                        </th>
                        <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      {greenSealProjects.map((p, index) => (
                        <tr
                          key={p._id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleProjectClick(p)}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                                {String(index + 1).padStart(2, "0")}
                              </div>
                              <div className="text-sm font-medium">
                                {p.autoCode}
                              </div>
                            </div>
                          </td>

                          {/* Image */}
                          <td className="px-4 py-4">
                            <div className="w-12 h-12 rounded-lg border bg-gray-50 shadow-sm overflow-hidden">
                              {p.coverImage ? (
                                <img
                                  src={
                                    p.coverImage.startsWith("http")
                                      ? p.coverImage
                                      : `${BACKEND_URL}/${p.coverImage}`
                                  }
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-6 h-6 m-auto text-gray-400" />
                              )}
                            </div>
                          </td>

                          {/* Company & Brand */}
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium">
                              {p.company?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {p.brand?.name}
                            </div>
                          </td>

                          {/* Category & Type */}
                          <td className="hidden lg:table-cell px-4 py-4">
                            <div className="text-sm font-medium">
                              {p.category?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {p.type?.name}
                            </div>
                          </td>

                          {/* Country */}
                          <td className="hidden xl:table-cell px-4 py-4">
                            {p.country?.name}
                          </td>

                          {/* Timeline */}
                          <td className="px-4 py-4 text-sm text-gray-500">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs">
                                  {new Date(p.createdAt).toLocaleDateString(
                                    "en-GB"
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span className="text-xs font-medium">
                                  {calculateDuration(
                                    p.createdAt,
                                    p.greenSealTargetDate
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Priority */}
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getPriorityColor(
                                p.priority
                              )}`}
                            >
                              {p.priority || "Low"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="hidden xl:table-cell px-4 py-4 text-right">
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

              {/* Empty */}
              {greenSealProjects.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">
                    No Green Seal Projects
                  </h3>
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {!loading && greenSealProjects.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {greenSealProjects.length} of {total} results
              </div>

              <Pagination
                page={currentPage}
                pages={pages}
                onChange={(p: number) => setCurrentPage(p)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <GreenSealProjectDetailsDialog
        open={detailsOpen}
        onOpenChange={(v) => setDetailsOpen(v)}
        reloadProjects={reload}
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
