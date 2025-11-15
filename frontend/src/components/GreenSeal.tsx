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
  ShoppingCart,
  Package,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Filter,
  FileSpreadsheet,
  FileX,
  FileUp,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useERPStore } from "../lib/data-store";
import { CreateProjectDialog } from "./CreateProjectDialog";
import ProjectDetailsDialog from "./ProjectDetailsDialog";
import { GreenSealProjectDetailsDialog } from "./GreenSealProjectDetailsDialog";
import { ImportTemplateGenerator } from "./ImportTemplateGenerator";
import { toast } from "sonner@2.0.3";
import type { RDProject } from "../lib/data-store";

export function GreenSeal() {
  const {
    rdProjects,
    brands,
    categories,
    types,
    colors,
    countries,
    selectRDProject,
    addRDProject,
  } = useERPStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [greenSealDetailsOpen, setGreenSealDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<RDProject | null>(
    null
  );
  const getGreenSealProjects = () => {
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

    return searchFiltered.filter((p) => p.status === "Green Seal");
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
    if (project.status === "Green Seal") {
      setGreenSealDetailsOpen(true);
    } else {
      setProjectDetailsOpen(true);
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

  return (
    <div className="space-y-6">
      {/* Main Content Card */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Green Seal Management</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Review and approve designs for Green Seal certification
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
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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

          {/* Green Seal Projects Table */}
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
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Timeline, Dates & Duration
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Priority
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Task-INC
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Cost Overview
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
                {getPaginatedProjects(getGreenSealProjects()).map(
                  (project, index) => {
                    const brand = brands.find((b) => b.id === project.brandId);
                    const category = categories.find(
                      (c) => c.id === project.categoryId
                    );
                    const type = types.find((t) => t.id === project.typeId);
                    const color = colors.find(
                      (cl) => cl.id === project.colorId
                    );
                    const country = countries.find(
                      (co) => co.id === project.countryId
                    );

                    // Combined sample data from both previous tabs
                    const sampleData = [
                      {
                        code: "RND/24-25/01/102",
                        company: "SportTech International",
                        brand: "UA Sports",
                        category: "Formal",
                        type: "Leather",
                        gender: "Men",
                        product: "Chunky Mickey",
                        productColor: "Brown",
                        country: "China",
                        priority: "High",
                        taskInc: "Priyanka",
                        status: "Update Req",
                        nextDate: "08/09/2025",
                        iconColor: "green",
                      },
                      {
                        code: "RND/24-25/01/107",
                        company: "AquaTech Industries Pvt Ltd",
                        brand: "AquaTech Pro",
                        category: "Casual",
                        type: "CKD",
                        gender: "Men",
                        product: "Hydro Dipping Film",
                        productColor: "White",
                        country: "India",
                        priority: "Low",
                        taskInc: "Priyanka",
                        status: "OK",
                        nextDate: "12/09/2025",
                        iconColor: "green",
                      },
                      {
                        code: "RND/24-25/01/110",
                        company: "ZipStyle Footwear Co.",
                        brand: "ZipStyle Elite",
                        category: "Formal",
                        type: "Leather",
                        gender: "Men",
                        product: "Red zip pocket",
                        productColor: "Navy Blue",
                        country: "India",
                        priority: "Low",
                        taskInc: "Priyanka",
                        status: "Pending",
                        nextDate: "15/09/2025",
                        iconColor: "green",
                      },
                      {
                        code: "RND/24-25/01/105",
                        company: "FlexiWalk Sports Ltd",
                        brand: "FlexiWalk Pro",
                        category: "Sports",
                        type: "Running",
                        gender: "Unisex",
                        product: "Mesh Breathable",
                        productColor: "Black & Neon",
                        country: "Vietnam",
                        priority: "High",
                        taskInc: "Rajesh",
                        status: "Update Req",
                        nextDate: "10/09/2025",
                        iconColor: "orange",
                      },
                      {
                        code: "RND/24-25/01/108",
                        company: "UrbanStep Fashion House",
                        brand: "UrbanStep Casual",
                        category: "Casual",
                        type: "Sneakers",
                        gender: "Women",
                        product: "Metallic Finish",
                        productColor: "Rose Gold",
                        country: "Bangladesh",
                        priority: "Medium",
                        taskInc: "Sneha",
                        status: "Pending",
                        nextDate: "18/09/2025",
                        iconColor: "orange",
                      },
                      {
                        code: "RND/24-25/01/111",
                        company: "TechGrip Solutions",
                        brand: "TechGrip Premium",
                        category: "Formal",
                        type: "Oxford",
                        gender: "Men",
                        product: "Classic Patent",
                        productColor: "Mahogany Brown",
                        country: "India",
                        priority: "Low",
                        taskInc: "Amit",
                        status: "Review Req",
                        nextDate: "22/09/2025",
                        iconColor: "orange",
                      },
                    ];

                    const data = sampleData[index % sampleData.length];

                    return (
                      <tr
                        key={project.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleProjectClick(project)}
                      >
                        {/* Product Code */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`w-8 h-8 ${
                                data.iconColor === "green"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-orange-100 text-orange-600"
                              } rounded-full flex items-center justify-center mr-3`}
                            >
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
                              {project.companyName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {project.brandName}
                            </div>
                          </div>
                        </td>

                        {/* Category, Type & Gender */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {project.categoryName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {project.typeName}
                            </div>
                            <div className="text-xs text-gray-400">
                              {project.gender}
                            </div>
                          </div>
                        </td>

                        {/* Art & Colour */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {project.artName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {project.color}
                            </div>
                          </div>
                        </td>

                        {/* Country */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {project.countryName}
                          </div>
                        </td>

                        {/* Timeline, Dates & Duration */}
                        <td className="px-6 py-4 text-sm text-gray-500 min-w-[180px]">
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                Start:{" "}
                                {new Date(project.startDate).toLocaleDateString(
                                  "en-GB"
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <Target className="w-3 h-3" />
                              <span>
                                Target:{" "}
                                {project.poTarget
                                  ? new Date(
                                      project.poTarget
                                    ).toLocaleDateString("en-GB")
                                  : "TBD"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
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

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${
                              data.iconColor === "green"
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            Green Seal
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs leading-4 font-semibold rounded ${
                              data.priority === "High"
                                ? "bg-red-500 text-white"
                                : data.priority === "Medium"
                                ? "bg-purple-500 text-white"
                                : "bg-green-600 text-white"
                            }`}
                          >
                            {data.priority}
                          </span>
                        </td>

                        {/* Task-INC */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {project.assignPerson.name}
                          </div>
                        </td>

                        {/* Cost Overview */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="flex items-center space-x-1 text-sm font-semibold text-gray-900">
                              <IndianRupee className="w-3 h-3" />
                              <span>
                                {project.finalCost > 0
                                  ? project.finalCost.toLocaleString("en-IN")
                                  : project.targetCost.toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {project.finalCost > 0
                                ? "Final Cost"
                                : "Target Cost"}
                            </div>
                            {project.finalCost > 0 && project.targetCost && (
                              <div
                                className={`text-xs font-medium mt-1 ${
                                  project.finalCost - project.targetCost < 0
                                    ? "text-green-600"
                                    : project.finalCost - project.targetCost > 0
                                    ? "text-red-600"
                                    : "text-gray-600"
                                }`}
                              >
                                Variance:{" "}
                                {project.finalCost - project.targetCost > 0
                                  ? "+"
                                  : ""}
                                ₹
                                {Math.abs(
                                  project.finalCost - project.targetCost
                                ).toLocaleString("en-IN")}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Remarks */}
                        <td className="px-6 py-4 min-w-[120px]">
                          <div>
                            <div className="text-sm text-gray-900">
                              Next: {data.nextDate}
                            </div>
                            <div className="text-sm text-gray-500">
                              {data.status}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {getGreenSealProjects().length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No green seal projects found
              </h3>
              <p className="text-gray-600">
                Projects with green seal status will appear here.
              </p>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Showing {getPaginatedProjects(getGreenSealProjects()).length} of{" "}
              {getGreenSealProjects().length} results
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ProjectDetailsDialog
        open={projectDetailsOpen}
        onOpenChange={setProjectDetailsOpen}
        project={selectedProject}
      />

      <GreenSealProjectDetailsDialog
        open={greenSealDetailsOpen}
        onOpenChange={setGreenSealDetailsOpen}
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
