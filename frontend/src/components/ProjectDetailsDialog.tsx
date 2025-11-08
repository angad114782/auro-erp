import React, { useState, useEffect } from "react";
import {
  Eye,
  Edit2,
  ArrowRight,
  Calendar,
  User,
  IndianRupee,
  Clock,
  CheckCircle,
  AlertTriangle,
  Workflow,
  Target,
  Building,
  Users,
  X,
  Save,
  RefreshCw,
  Calculator,
  MessageSquare,
  ImageIcon,
  Upload,
  Trash2,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { toast } from "sonner@2.0.3";
import { useERPStore } from "../lib/data-store";
import type { RDProject } from "../lib/data-store";
import { TentativeCostDialog } from "./TentativeCostDialog";

interface ProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: RDProject | null;
  brands: any[];
  categories: any[];
  types: any[];
  colors: any[];
  countries: any[];
}

const workflowStages = [
  {
    id: "Idea Submitted",
    name: "Idea Submitted",
    color: "bg-blue-100 text-blue-800",
    progress: 17,
  },
  {
    id: "Prototype",
    name: "Prototype",
    color: "bg-purple-100 text-purple-800",
    progress: 33,
  },
  {
    id: "Red Seal",
    name: "Red Seal",
    color: "bg-red-100 text-red-800",
    progress: 50,
  },
  {
    id: "Green Seal",
    name: "Green Seal",
    color: "bg-green-100 text-green-800",
    progress: 67,
  },
  {
    id: "PO Pending",
    name: "PO Pending",
    color: "bg-orange-100 text-orange-800",
    progress: 83,
  },
  {
    id: "PO Approved",
    name: "PO Approved",
    color: "bg-emerald-100 text-emerald-800",
    progress: 100,
  },
];

export function ProjectDetailsDialog({
  open,
  onOpenChange,
  project,
  brands,
  categories,
  types,
  colors,
  countries,
}: ProjectDetailsDialogProps) {
  const { updateRDProject } = useERPStore();

  // Add safe defaults at the top
  const safeBrands = brands || [];
  const safeCategories = categories || [];
  const safeTypes = types || [];
  const safeColors = colors || [];
  const safeCountries = countries || [];

  const handleCloseDialog = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  // Red Seal Development table data - matching exact table content
  const redSealDevelopmentData = [
    {
      productCode: "RND/24-25/01/102",
      brand: "UA Sports",
      brandCode: "UAS01",
      category: "Formal",
      type: "Leather",
      gender: "Men",
      artColour: "Chunky Mickey",
      color: "Brown",
      country: "China",
      startDate: "05/01/2024",
      targetDate: "20/04/2024",
      status: "Prototype",
      nextDate: "08/09/2025",
      remarks: "Update Required",
    },
    {
      productCode: "RND/24-25/01/107",
      brand: "AquaTech",
      brandCode: "AQT02",
      category: "Casual",
      type: "CKD",
      gender: "Men",
      artColour: "Hydro Dipping Film",
      color: "White",
      country: "India",
      startDate: "12/01/2024",
      targetDate: "30/04/2024",
      status: "Costing Received",
      nextDate: "08/09/2025",
      remarks: "OK",
    },
    {
      productCode: "RND/24-25/01/110",
      brand: "ZipStyle",
      brandCode: "ZPS03",
      category: "Formal",
      type: "Leather",
      gender: "Men",
      artColour: "Red zip pocket",
      color: "Navy Blue",
      country: "India",
      startDate: "18/01/2024",
      targetDate: "05/05/2024",
      status: "Prototype",
      nextDate: "08/09/2025",
      remarks: "Pending",
    },
  ];

  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<RDProject | null>(null);
  const [tentativeCostOpen, setTentativeCostOpen] = useState(false);

  // Image editing states
  const [editingImages, setEditingImages] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [dynamicImages, setDynamicImages] = useState<string[]>([]);
  const coverInputRef = React.useRef<HTMLInputElement>(null);
  const additionalInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const dynamicInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (project) {
      setEditedProject({ ...project });
      // Load existing images
      setCoverPhoto(project.coverPhoto || null);
      setAdditionalImages(project.additionalImages || []);
      setDynamicImages(project.dynamicImages || []);
    }
  }, [project]);

  if (!project || !editedProject) return null;

  // Get project data based on project code
  const getProjectData = () => {
    const projectData = redSealDevelopmentData.find(
      (p) => p.productCode === project.autoCode
    );
    return projectData || redSealDevelopmentData[0]; // fallback to first item
  };

  const projectData = getProjectData();

  const getBrandName = (brandId: string) => {
    if (!brands || brands.length === 0) return projectData.brand;
    const brand = brands.find((b) => b.id === brandId);
    return brand?.brandName || projectData.brand;
  };

  const getBrandCode = (brandId: string) => {
    if (!brands || brands.length === 0) return projectData.brandCode;
    const brand = brands.find((b) => b.id === brandId);
    return brand?.brandCode || projectData.brandCode;
  };

  const getCategoryName = (categoryId: string) => {
    if (!categories || categories.length === 0) return projectData.category;
    const category = categories.find((c) => c.id === categoryId);
    return category?.categoryName || projectData.category;
  };

  const getTypeName = (typeId: string) => {
    if (!types || types.length === 0) return projectData.type;
    const type = types.find((t) => t.id === typeId);
    return type?.typeName || projectData.type;
  };

  const getColorName = (colorId: string) => {
    if (!colors || colors.length === 0) return projectData.color;
    const color = colors.find((c) => c.id === colorId);
    return color?.colorName || projectData.color;
  };

  const getCountryName = (countryId: string) => {
    if (!countries || countries.length === 0) return projectData.country;
    const country = countries.find((c) => c.id === countryId);
    return country?.countryName || projectData.country;
  };

  const getDesignerName = (designerId: string) => {
    // For now, return the designer ID or a default value
    // In future, this can be connected to a designers master data
    const designerNames: { [key: string]: string } = {
      "1": "Rahul Sharma",
      "2": "Priyanka Patel",
      "3": "Amit Kumar",
      "4": "Sneha Reddy",
      "5": "Vikram Singh",
    };
    return designerNames[designerId] || "Designer " + designerId;
  };

  const getCurrentStage = () => {
    return (
      workflowStages.find((stage) => stage.id === project.status) ||
      workflowStages.find((stage) => stage.id === projectData.status) ||
      workflowStages[0]
    );
  };

  const getNextStage = () => {
    const currentIndex = workflowStages.findIndex(
      (stage) => stage.id === project.status
    );
    return currentIndex < workflowStages.length - 1
      ? workflowStages[currentIndex + 1]
      : null;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return projectData.startDate;
    // If it's already in DD/MM/YYYY format, return as is
    if (dateString.includes("/")) return dateString;
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleSave = () => {
    if (editedProject) {
      updateRDProject(editedProject.id, editedProject);
      toast.success("Project updated successfully!");
      setIsEditing(false);
    }
  };

  const handleAdvanceStage = () => {
    const nextStage = getNextStage();
    if (nextStage && editedProject) {
      const updatedProject = { ...editedProject, status: nextStage.id };
      setEditedProject(updatedProject);
      updateRDProject(editedProject.id, updatedProject);
      toast.success(`Project advanced to ${nextStage.name}!`);
    }
  };

  const handleTentativeCostCalculation = () => {
    setTentativeCostOpen(true);
  };

  const handleTentativeCostApproved = () => {
    // Advance to Red Seal stage after tentative cost approval
    handleAdvanceStage();
  };

  // Image upload handlers
  const handleCoverPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPhoto(reader.result as string);
        toast.success("Cover photo uploaded");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImages = [...additionalImages];
        while (newImages.length <= index) {
          newImages.push("");
        }
        newImages[index] = reader.result as string;
        setAdditionalImages(newImages);
        toast.success("Image uploaded");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDynamicImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImages = [...dynamicImages];
        newImages[index] = reader.result as string;
        setDynamicImages(newImages);
        toast.success("Image uploaded");
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCoverPhoto = () => {
    setCoverPhoto(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

  const removeAdditionalImage = (index: number) => {
    const newImages = [...additionalImages];
    newImages[index] = "";
    setAdditionalImages(newImages);
    if (additionalInputRefs.current[index]) {
      additionalInputRefs.current[index]!.value = "";
    }
  };

  const removeDynamicImage = (index: number) => {
    const newImages = dynamicImages.filter((_, i) => i !== index);
    setDynamicImages(newImages);
  };

  const handleAddImageSlot = () => {
    setDynamicImages([...dynamicImages, ""]);
  };

  const handleSaveImages = () => {
    if (editedProject) {
      const updatedProject = {
        ...editedProject,
        coverPhoto: coverPhoto || undefined,
        additionalImages: additionalImages.filter((img) => img !== ""),
        dynamicImages: dynamicImages.filter((img) => img !== ""),
      };
      setEditedProject(updatedProject);
      updateRDProject(editedProject.id, updatedProject);
      toast.success("Images updated successfully!");
      setEditingImages(false);
    }
  };

  const currentStage = getCurrentStage();
  const nextStage = getNextStage();

  // Get color based on project color
  const getColorDisplay = () => {
    const colorName = getColorName(project.colorId);
    const colorMap: Record<string, string> = {
      Black: "bg-gray-900",
      White: "bg-gray-100 border border-gray-300",
      Brown: "bg-yellow-600",
      "Navy Blue": "bg-blue-900",
      Red: "bg-red-600",
    };
    return colorMap[colorName] || colorMap[projectData.color] || "bg-gray-400";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[85vw] !w-[85vw] max-h-[90vh] overflow-hidden p-0 m-0 flex flex-col">
          {/* Sticky Header Section */}
          <div className="sticky top-0 z-50 px-8 py-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#0c9dcb] to-[#26b4e0] rounded-xl flex items-center justify-center shadow-lg">
                  <Eye className="w-7 h-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-semibold text-gray-900 mb-2">
                    Project Development Details
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    View and manage Project Development details and information
                  </DialogDescription>
                  <div className="flex items-center gap-4">
                    <span className="text-lg text-gray-600">
                      {projectData.productCode}
                    </span>
                    <Badge
                      className={`${currentStage.color} text-sm px-3 py-1`}
                    >
                      {currentStage.name}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Project
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedProject({ ...project });
                      }}
                      variant="outline"
                    >
                      Cancel Edit
                    </Button>
                  </div>
                )}
                {nextStage && (
                  <>
                    {project.status === "Prototype" &&
                    nextStage.id === "Red Seal" ? (
                      <Button
                        onClick={handleTentativeCostCalculation}
                        className="bg-[rgba(0,188,125,1)] hover:bg-blue-600"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Advance to Red Seal
                      </Button>
                    ) : (
                      <Button
                        onClick={handleAdvanceStage}
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Advance to {nextStage.name}
                      </Button>
                    )}
                  </>
                )}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onOpenChange(false);
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center"
                  type="button"
                >
                  <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                </Button>
              </div>
            </div>
          </div>

          {/* Scrollable Main Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="px-8 py-8 space-y-10">
              {/* Workflow Progress */}
              <div className="space-y-5">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                    <Workflow className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Development Progress
                  </h3>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Overall Progress
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {currentStage.progress}%
                      </span>
                    </div>
                    <Progress value={currentStage.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {workflowStages.map((stage, index) => {
                      const isCompleted =
                        workflowStages.findIndex(
                          (s) => s.id === project.status
                        ) >= index;
                      const isCurrent = stage.id === project.status;

                      return (
                        <div
                          key={stage.id}
                          className={`text-center p-2 rounded-lg transition-all ${
                            isCurrent
                              ? "bg-blue-100 border-2 border-blue-400 shadow-md"
                              : isCompleted
                              ? "bg-green-50 border border-green-200"
                              : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 mx-auto mb-1 rounded-full flex items-center justify-center text-xs ${
                              isCurrent
                                ? "bg-blue-500 text-white"
                                : isCompleted
                                ? "bg-green-500 text-white"
                                : "bg-gray-300 text-gray-600"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div className="text-xs font-medium text-gray-700">
                            {stage.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Project Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Development Information
                  </h3>
                </div>

                {/* Combined Horizontal Layout */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-gray-900">
                      Product & Brand Details
                    </h4>
                    <Badge
                      variant="secondary"
                      className="bg-purple-50 text-purple-700 border-purple-200 text-xs"
                    >
                      {currentStage.name}
                    </Badge>
                  </div>

                  {/* Horizontal Layout: Preview + Images */}
                  <div className="flex gap-4 mb-5">
                    {/* Product Preview - Compact */}
                    <div className="flex-shrink-0 w-44">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 h-full">
                        <Label className="text-xs font-medium text-gray-600 mb-2 block">
                          Preview
                        </Label>
                        <div className="w-20 h-20 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mx-auto mb-2">
                          <img
                            src={
                              coverPhoto ||
                              "https://images.unsplash.com/photo-1648501570189-0359dab185e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzbmVha2VyJTIwc2hvZSUyMHByb2R1Y3R8ZW58MXx8fHwxNzU2NzM1OTMwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                            }
                            alt={project.autoCode}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-xs font-medium text-gray-900 text-center">
                          {project.autoCode}
                        </div>
                        <div className="text-xs text-gray-500 text-center mt-0.5">
                          Sample
                        </div>
                      </div>
                    </div>

                    {/* Product Images Gallery - Horizontal Scroll */}
                    <div className="flex-1 min-w-0">
                      <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg border border-gray-200/80 shadow-sm h-full">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <Label className="text-xs font-semibold text-gray-800">
                              Images
                            </Label>
                          </div>
                          {(coverPhoto ||
                            additionalImages.filter((img) => img).length > 0 ||
                            dynamicImages.length > 0) && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-50 text-blue-700 border-blue-200 text-xs h-5"
                            >
                              {
                                [
                                  coverPhoto,
                                  ...additionalImages.filter((img) => img),
                                  ...dynamicImages,
                                ].length
                              }
                            </Badge>
                          )}
                        </div>

                        {!isEditing ? (
                          // View Mode - Horizontal scrollable gallery
                          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                            {coverPhoto && (
                              <div className="group relative flex-shrink-0">
                                <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-blue-400 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                                  <img
                                    src={coverPhoto}
                                    alt="Cover"
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="absolute bottom-1 left-1 right-1">
                                      <span className="text-xs font-semibold text-white">
                                        Cover
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            {additionalImages
                              .filter((img) => img)
                              .map((image, i) => (
                                <div
                                  key={i}
                                  className="group relative flex-shrink-0"
                                >
                                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 hover:border-blue-300 cursor-pointer bg-white">
                                    <img
                                      src={image}
                                      alt={`Image ${i + 1}`}
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                      <div className="absolute bottom-1 left-1">
                                        <Eye className="w-3 h-3 text-white" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            {dynamicImages.map((image, i) => (
                              <div
                                key={`dynamic-${i}`}
                                className="group relative flex-shrink-0"
                              >
                                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 hover:border-blue-300 cursor-pointer bg-white">
                                  <img
                                    src={image}
                                    alt={`Image ${i + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="absolute bottom-1 left-1">
                                      <Eye className="w-3 h-3 text-white" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {!coverPhoto &&
                              additionalImages.filter((img) => img).length ===
                                0 &&
                              dynamicImages.length === 0 && (
                                <div className="w-full text-center py-4">
                                  <ImageIcon className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                                  <p className="text-xs text-gray-500">
                                    No images
                                  </p>
                                </div>
                              )}
                          </div>
                        ) : (
                          // Edit Mode - Horizontal scrollable upload
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                              {/* Cover Photo */}
                              <div className="flex-shrink-0">
                                <input
                                  ref={coverInputRef}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleCoverPhotoUpload}
                                />
                                {coverPhoto ? (
                                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-blue-400 shadow-md group">
                                    <img
                                      src={coverPhoto}
                                      alt="Cover"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={removeCoverPhoto}
                                        className="h-6 w-6 p-0 shadow-lg"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() =>
                                      coverInputRef.current?.click()
                                    }
                                    className="w-20 h-20 border-2 border-dashed border-blue-400 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 transition-all duration-200 cursor-pointer group flex flex-col items-center justify-center shadow-sm hover:shadow-md"
                                  >
                                    <ImageIcon className="w-5 h-5 text-blue-600" />
                                    <span className="text-xs text-blue-700 mt-0.5">
                                      Cover
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Additional Images (5 fixed slots) */}
                              {[0, 1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex-shrink-0">
                                  <input
                                    ref={(el) => {
                                      if (additionalInputRefs.current) {
                                        additionalInputRefs.current[i] = el;
                                      }
                                    }}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleAdditionalImageUpload(e, i)
                                    }
                                  />
                                  {additionalImages[i] ? (
                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm group">
                                      <img
                                        src={additionalImages[i]}
                                        alt={`Image ${i + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="sm"
                                          onClick={() =>
                                            removeAdditionalImage(i)
                                          }
                                          className="h-6 w-6 p-0 shadow-lg"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() =>
                                        additionalInputRefs.current[i]?.click()
                                      }
                                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:bg-gray-50 hover:border-blue-400 transition-all duration-200 cursor-pointer flex items-center justify-center group shadow-sm hover:shadow-md"
                                    >
                                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-all duration-200" />
                                    </div>
                                  )}
                                </div>
                              ))}

                              {/* Dynamic Images */}
                              {dynamicImages.map((image, i) => (
                                <div
                                  key={`dynamic-${i}`}
                                  className="flex-shrink-0"
                                >
                                  <input
                                    ref={(el) => {
                                      if (dynamicInputRefs.current) {
                                        dynamicInputRefs.current[i] = el;
                                      }
                                    }}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleDynamicImageUpload(e, i)
                                    }
                                  />
                                  {image ? (
                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm group">
                                      <img
                                        src={image}
                                        alt={`Image ${i + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => removeDynamicImage(i)}
                                          className="h-6 w-6 p-0 shadow-lg"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() =>
                                        dynamicInputRefs.current[i]?.click()
                                      }
                                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:bg-gray-50 hover:border-blue-400 transition-all duration-200 cursor-pointer flex items-center justify-center group shadow-sm hover:shadow-md"
                                    >
                                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-all duration-200" />
                                    </div>
                                  )}
                                </div>
                              ))}

                              {/* Add More Button */}
                              <div
                                onClick={handleAddImageSlot}
                                className="w-20 h-20 flex-shrink-0 border-2 border-dashed border-blue-400 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center group shadow-sm hover:shadow-md"
                              >
                                <Plus className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-all duration-200" />
                              </div>
                            </div>

                            <div className="flex justify-end pt-2 border-t border-gray-200">
                              <Button
                                onClick={handleSaveImages}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all h-7 text-xs"
                                size="sm"
                              >
                                <Save className="w-3 h-3 mr-1.5" />
                                Save
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* All Fields in Horizontal Grid - 6 columns */}
                  <div className="grid grid-cols-6 gap-x-3 gap-y-3">
                    {/* Row 1 */}
                    <div>
                      <Label>Product Code</Label>
                      <div className="mt-1 font-mono font-bold text-gray-900">
                        {project.autoCode}
                      </div>
                    </div>

                    <div>
                      <Label>Company</Label>
                      {isEditing ? (
                        <Select
                          value={editedProject.companyId}
                          onValueChange={(value) =>
                            setEditedProject({
                              ...editedProject,
                              companyId: value,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Phoenix Footwear</SelectItem>
                            <SelectItem value="2">Urban Sole</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">
                          Phoenix Footwear
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Brand</Label>
                      {isEditing ? (
                        <Select
                          value={editedProject.brandId}
                          onValueChange={(value) =>
                            setEditedProject({
                              ...editedProject,
                              brandId: value,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(brands || []).map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.brandName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {getBrandName(project.brandId)}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Category</Label>
                      {isEditing ? (
                        <Select
                          value={editedProject.categoryId}
                          onValueChange={(value) =>
                            setEditedProject({
                              ...editedProject,
                              categoryId: value,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {(categories || []).map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.categoryName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {getCategoryName(project.categoryId)}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Type</Label>
                      {isEditing ? (
                        <Select
                          value={editedProject.typeId}
                          onValueChange={(value) =>
                            setEditedProject({
                              ...editedProject,
                              typeId: value,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {(types || []).map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.typeName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {getTypeName(project.typeId)}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Gender</Label>
                      {isEditing ? (
                        <Select defaultValue="unisex">
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="unisex">Unisex</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">Unisex</div>
                      )}
                    </div>

                    {/* Row 2 */}
                    <div>
                      <Label>Art</Label>
                      {isEditing ? (
                        <Input
                          type="text"
                          defaultValue="Modern Design"
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 text-gray-900">Modern Design</div>
                      )}
                    </div>

                    <div>
                      <Label>Colour</Label>
                      {isEditing ? (
                        <Select
                          value={editedProject.colorId}
                          onValueChange={(value) =>
                            setEditedProject({
                              ...editedProject,
                              colorId: value,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(colors || []).map((color) => (
                              <SelectItem key={color.id} value={color.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: color.hexCode }}
                                  ></div>
                                  {color.colorName}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full ${getColorDisplay()}`}
                          ></div>
                          <span className="text-gray-900">
                            {getColorName(project.colorId)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Country</Label>
                      {isEditing ? (
                        <Select
                          value={editedProject.countryId}
                          onValueChange={(value) =>
                            setEditedProject({
                              ...editedProject,
                              countryId: value,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(countries || []).map((country) => (
                              <SelectItem key={country.id} value={country.id}>
                                {country.countryName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {getCountryName(project.countryId)}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">
                        <Badge className={currentStage.color}>
                          {currentStage.name}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label>Start Date</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedProject.startDate}
                          onChange={(e) =>
                            setEditedProject({
                              ...editedProject,
                              startDate: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {formatDate(project.startDate)}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Target Date</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedProject.endDate}
                          onChange={(e) =>
                            setEditedProject({
                              ...editedProject,
                              endDate: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {formatDate(project.endDate)}
                        </div>
                      )}
                    </div>

                    {/* Row 3 */}
                    <div>
                      <Label>Priority</Label>
                      {isEditing ? (
                        <Select
                          value={editedProject.priority || "Low"}
                          onValueChange={(value) =>
                            setEditedProject({
                              ...editedProject,
                              priority: value,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1">
                          <Badge
                            className={
                              project.priority === "High"
                                ? "bg-red-500 text-white"
                                : project.priority === "Medium"
                                ? "bg-amber-500 text-white"
                                : "bg-green-500 text-white"
                            }
                          >
                            {project.priority}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Assigned To</Label>
                      {isEditing ? (
                        <Input
                          type="text"
                          value={editedProject.taskInc}
                          onChange={(e) =>
                            setEditedProject({
                              ...editedProject,
                              taskInc: e.target.value,
                            })
                          }
                          className="mt-1"
                          placeholder="Person name"
                        />
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {project.taskInc}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Feedback & Updates Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Client Feedback & Updates
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Client Feedback Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Client Feedback
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block">
                          Client Remarks
                        </Label>
                        {isEditing ? (
                          <Textarea
                            value={editedProject.remarks || ""}
                            onChange={(e) =>
                              setEditedProject({
                                ...editedProject,
                                remarks: e.target.value,
                              })
                            }
                            placeholder="Enter client feedback and remarks..."
                            className="min-h-[80px] resize-none text-sm"
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 min-h-[80px]">
                            {editedProject.remarks ||
                              projectData.remarks ||
                              "Elegant formal shoes for business professionals"}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block">
                          Client Approval Status
                        </Label>
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <Select
                              value={editedProject.clientFeedback}
                              onValueChange={(value) =>
                                setEditedProject({
                                  ...editedProject,
                                  clientFeedback: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OK">Approved</SelectItem>
                                <SelectItem value="Update Required">
                                  Update Required
                                </SelectItem>
                                <SelectItem value="Pending">
                                  Pending Review
                                </SelectItem>
                                <SelectItem value="Rejected">
                                  Rejected
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant="secondary"
                              className={
                                (editedProject.clientFeedback ||
                                  projectData.remarks) === "OK"
                                  ? "bg-green-100 text-green-700"
                                  : (editedProject.clientFeedback ||
                                      projectData.remarks) === "Update Required"
                                  ? "bg-orange-100 text-orange-700"
                                  : (editedProject.clientFeedback ||
                                      projectData.remarks) === "Pending"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-red-100 text-red-700"
                              }
                            >
                              {(editedProject.clientFeedback ||
                                projectData.remarks) === "OK"
                                ? "✓ Approved"
                                : (editedProject.clientFeedback ||
                                    projectData.remarks) === "Update Required"
                                ? "⚠ Update Required"
                                : (editedProject.clientFeedback ||
                                    projectData.remarks) === "Pending"
                                ? "⏳ Pending Review"
                                : "⚠ Update Required"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Next Update Schedule Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Next Update Schedule
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block">
                          Next Update Date
                        </Label>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editedProject.nextUpdateDate || ""}
                            onChange={(e) =>
                              setEditedProject({
                                ...editedProject,
                                nextUpdateDate: e.target.value,
                              })
                            }
                            className="w-full"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-900">
                              {editedProject.nextUpdateDate
                                ? formatDate(editedProject.nextUpdateDate)
                                : projectData.nextDate || "30/01/2024"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block">
                          Update Notes
                        </Label>
                        {isEditing ? (
                          <Textarea
                            value={editedProject.updateNotes || ""}
                            onChange={(e) =>
                              setEditedProject({
                                ...editedProject,
                                updateNotes: e.target.value,
                              })
                            }
                            placeholder="Enter notes for next update meeting..."
                            className="min-h-[60px] resize-none text-sm"
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 min-h-[60px]">
                            {editedProject.updateNotes ||
                              "Client requested changes to heel design - revisions needed"}
                          </div>
                        )}
                      </div>

                      {/* Days Until Next Update */}
                      {(() => {
                        const nextDate =
                          editedProject.nextUpdateDate ||
                          projectData.nextDate ||
                          "2024-01-30";
                        const today = new Date();
                        const updateDate = new Date(nextDate);
                        const diffTime = updateDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(
                          diffTime / (1000 * 60 * 60 * 24)
                        );
                        const isOverdue = diffDays <= 0;

                        return (
                          <div
                            className={`${
                              isOverdue
                                ? "bg-red-50 border-red-200"
                                : "bg-blue-50 border-blue-200"
                            } border rounded-lg p-4`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Clock
                                className={`w-4 h-4 ${
                                  isOverdue ? "text-red-600" : "text-blue-600"
                                }`}
                              />
                              <span
                                className={`text-sm ${
                                  isOverdue ? "text-red-700" : "text-blue-700"
                                }`}
                              >
                                Days Until Next Update
                              </span>
                            </div>
                            <div
                              className={`text-xl font-bold ${
                                isOverdue ? "text-red-600" : "text-blue-600"
                              }`}
                            >
                              {diffDays > 0 ? `${diffDays} days` : "Overdue"}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Quick Actions for Client Feedback */}
                {isEditing && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Quick Update Actions
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const nextWeek = new Date();
                          nextWeek.setDate(nextWeek.getDate() + 7);
                          setEditedProject({
                            ...editedProject,
                            nextUpdateDate: nextWeek
                              .toISOString()
                              .split("T")[0],
                            updateNotes:
                              "Schedule follow-up meeting for next week",
                          });
                        }}
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Schedule Next Week
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditedProject({
                            ...editedProject,
                            clientFeedback: "Update Required",
                            updateNotes:
                              "Client requested modifications - awaiting detailed feedback",
                          });
                        }}
                      >
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Mark Update Required
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditedProject({
                            ...editedProject,
                            clientFeedback: "OK",
                            updateNotes:
                              "Client approved - ready to proceed to next stage",
                          });
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Approved
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tentative Cost Dialog */}
      <TentativeCostDialog
        open={tentativeCostOpen}
        onOpenChange={setTentativeCostOpen}
        project={project}
        onApproved={handleTentativeCostApproved}
      />
    </>
  );
}
