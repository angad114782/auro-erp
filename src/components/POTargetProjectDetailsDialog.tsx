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
  Award,
  ShoppingCart,
  Factory,
  ImageIcon,
  Upload,
  Trash2,
  Plus,
  Package,
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

interface POPendingProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: RDProject | null;
  brands?: any[];
  categories?: any[];
  types?: any[];
  colors?: any[];
  countries?: any[];
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

export function POPendingProjectDetailsDialog({
  open,
  onOpenChange,
  project,
  brands,
  categories,
  types,
  colors,
  countries,
}: POPendingProjectDetailsDialogProps) {
  const { updateRDProject } = useERPStore();

  // PO Target Development table data - matching the POTargetDate component data
  const poTargetDevelopmentData = [
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
      poTargetDate: "20/09/2025",
      deliveryDate: "15/11/2025",
      status: "PO Confirmed",
      nextDate: "25/09/2025",
      remarks: "PO Confirmed",
      priority: "High",
      taskInc: "Priyanka",
      finalCost: 1250,
      targetCost: 1200,
      orderQty: 1500,
      poValue: 1875000,
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
      poTargetDate: "25/09/2025",
      deliveryDate: "20/11/2025",
      status: "PO Ready",
      nextDate: "28/09/2025",
      remarks: "PO Ready",
      priority: "Low",
      taskInc: "Priyanka",
      finalCost: 890,
      targetCost: 850,
      orderQty: 2000,
      poValue: 1780000,
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
      poTargetDate: "30/09/2025",
      deliveryDate: "25/11/2025",
      status: "Client Approval",
      nextDate: "30/09/2025",
      remarks: "Client Approval",
      priority: "Medium",
      taskInc: "Priyanka",
      finalCost: 1100,
      targetCost: 1050,
      orderQty: 1200,
      poValue: 1320000,
    },
    {
      productCode: "RND/24-25/01/105",
      brand: "FlexiWalk",
      brandCode: "FLW01",
      category: "Sports",
      type: "Running",
      gender: "Unisex",
      artColour: "Mesh Breathable",
      color: "Black & Neon",
      country: "Vietnam",
      startDate: "15/02/2024",
      poTargetDate: "26/09/2025",
      deliveryDate: "20/11/2025",
      status: "PO Confirmed",
      nextDate: "26/09/2025",
      remarks: "PO Confirmed",
      priority: "High",
      taskInc: "Rajesh",
      finalCost: 1450,
      targetCost: 1400,
      orderQty: 3000,
      poValue: 4350000,
    },
    {
      productCode: "RND/24-25/01/108",
      brand: "UrbanStep",
      brandCode: "UST04",
      category: "Casual",
      type: "Sneakers",
      gender: "Women",
      artColour: "Metallic Finish",
      color: "Rose Gold",
      country: "Bangladesh",
      startDate: "22/02/2024",
      poTargetDate: "02/10/2025",
      deliveryDate: "30/11/2025",
      status: "PO Ready",
      nextDate: "02/10/2025",
      remarks: "PO Ready",
      priority: "Medium",
      taskInc: "Sneha",
      finalCost: 1320,
      targetCost: 1280,
      orderQty: 1800,
      poValue: 2376000,
    },
    {
      productCode: "RND/24-25/01/111",
      brand: "TechGrip",
      brandCode: "TGR05",
      category: "Formal",
      type: "Oxford",
      gender: "Men",
      artColour: "Classic Patent",
      color: "Mahogany Brown",
      country: "India",
      startDate: "01/03/2024",
      poTargetDate: "05/10/2025",
      deliveryDate: "05/12/2025",
      status: "Client Approval",
      nextDate: "05/10/2025",
      remarks: "Client Approval",
      priority: "Low",
      taskInc: "Amit",
      finalCost: 1180,
      targetCost: 1150,
      orderQty: 1000,
      poValue: 1180000,
    },
  ];

  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] =
    useState<RDProject | null>(null);
  const [poNumber, setPONumber] = useState("");
  const [isAddingPO, setIsAddingPO] = useState(false);

  // Image editing states
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
    const projectData = poTargetDevelopmentData.find(
      (p) => p.productCode === project.autoCode,
    );
    return projectData || poTargetDevelopmentData[0]; // fallback to first item
  };

  const projectData = getProjectData();

  const getBrandName = (brandId: string) => {
    if (!brands || brands.length === 0)
      return projectData.brand;
    const brand = brands.find((b) => b.id === brandId);
    return brand?.brandName || projectData.brand;
  };

  const getBrandCode = (brandId: string) => {
    if (!brands || brands.length === 0)
      return projectData.brandCode;
    const brand = brands.find((b) => b.id === brandId);
    return brand?.brandCode || projectData.brandCode;
  };

  const getCategoryName = (categoryId: string) => {
    if (!categories || categories.length === 0)
      return projectData.category;
    const category = categories.find(
      (c) => c.id === categoryId,
    );
    return category?.categoryName || projectData.category;
  };

  const getTypeName = (typeId: string) => {
    if (!types || types.length === 0) return projectData.type;
    const type = types.find((t) => t.id === typeId);
    return type?.typeName || projectData.type;
  };

  const getColorName = (colorId: string) => {
    if (!colors || colors.length === 0)
      return projectData.color;
    const color = colors.find((c) => c.id === colorId);
    return color?.colorName || projectData.color;
  };

  const getCountryName = (countryId: string) => {
    if (!countries || countries.length === 0)
      return projectData.country;
    const country = countries.find((c) => c.id === countryId);
    return country?.countryName || projectData.country;
  };

  const getDesignerName = (designerId: string) => {
    const designerNames: { [key: string]: string } = {
      '1': 'Rahul Sharma',
      '2': 'Priyanka Patel',
      '3': 'Amit Kumar',
      '4': 'Sneha Reddy',
      '5': 'Vikram Singh'
    };
    return designerNames[designerId] || 'Designer ' + designerId;
  };

  // Image upload handlers
  const handleCoverPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImages = [...additionalImages];
        newImages[index] = reader.result as string;
        setAdditionalImages(newImages);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDynamicImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImages = [...dynamicImages];
        newImages[index] = reader.result as string;
        setDynamicImages(newImages);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCoverPhoto = () => {
    setCoverPhoto(null);
  };

  const removeAdditionalImage = (index: number) => {
    const newImages = [...additionalImages];
    newImages[index] = '';
    setAdditionalImages(newImages);
  };

  const removeDynamicImage = (index: number) => {
    const newImages = dynamicImages.filter((_, i) => i !== index);
    setDynamicImages(newImages);
  };

  const handleAddImageSlot = () => {
    setDynamicImages([...dynamicImages, '']);
  };

  const handleSaveImages = () => {
    if (editedProject) {
      const updatedProject = {
        ...editedProject,
        coverPhoto,
        additionalImages,
        dynamicImages
      };
      updateRDProject(project.id, updatedProject as RDProject);
      toast.success('Images saved successfully!');
    }
  };

  const getCurrentStage = () => {
    // For PO Pending dialog, we're at the PO Pending stage
    return (
      workflowStages.find(
        (stage) => stage.id === "PO Pending",
      ) || workflowStages[4] // Default to "PO Pending" (5th stage)
    );
  };

  const getNextStage = () => {
    // PO Issued is the final stage, so no next stage
    return null;
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
      toast.success("PO Target project updated successfully!");
      setIsEditing(false);
    }
  };

  const handleAddPONumber = () => {
    if (poNumber.trim() && editedProject) {
      const updatedProject = {
        ...editedProject,
        poNumber: poNumber.trim(),
        // Keep status as PO Pending, don't auto-advance
      };
      updateRDProject(editedProject.id, updatedProject);
      setEditedProject(updatedProject);
      // Don't clear poNumber - keep it to show in input
      setIsAddingPO(false);
      toast.success(
        "PO Number added successfully! You can now advance the project.",
      );
    } else {
      toast.error("Please enter a valid PO number.");
    }
  };

  const handleEditPONumber = () => {
    if (poNumber.trim() && editedProject) {
      const updatedProject = {
        ...editedProject,
        poNumber: poNumber.trim(),
      };
      updateRDProject(editedProject.id, updatedProject);
      setEditedProject(updatedProject);
      setPONumber("");
      setIsAddingPO(false);
      toast.success("PO Number updated successfully!");
    } else {
      toast.error("Please enter a valid PO number.");
    }
  };

  const handleAdvanceToPOApproved = () => {
    if (!editedProject?.poNumber) {
      toast.error("PO Number is required to advance to PO Approved");
      return;
    }
    if (editedProject) {
      const updatedProject = {
        ...editedProject,
        poStatus: "Approved",
        status: "PO Target",
      };
      updateRDProject(editedProject.id, updatedProject);
      toast.success("Project advanced to PO Approved!");
      onOpenChange(false);
    }
  };

  const handleApproveAndAdvanceToProduction = () => {
    if (editedProject && editedProject.poNumber) {
      const updatedProject = {
        ...editedProject,
        poStatus: "Approved",
        status: "Production",
      };
      updateRDProject(editedProject.id, updatedProject);
      toast.success("Project approved and advanced to Production!");
      onOpenChange(false);
    } else {
      toast.error("PO Number is required to advance to Production");
    }
  };

  // Check if project is pending (no PO or pending status)
  const isPOPending = () => {
    return (
      !project.poNumber &&
      (project.poStatus === "Pending" || !project.poStatus)
    );
  };

  // Check if project is approved (has PO number)
  const isPOApproved = () => {
    return project.poNumber && project.poStatus === "Approved";
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
      "Rose Gold": "bg-pink-400",
      "Mahogany Brown": "bg-yellow-800",
      "Black & Neon":
        "bg-gradient-to-r from-gray-900 to-green-400",
    };
    return (
      colorMap[colorName] ||
      colorMap[projectData.color] ||
      "bg-gray-400"
    );
  };

  // Calculate cost variance
  const getCostVariance = () => {
    const variance =
      projectData.finalCost - projectData.targetCost;
    return {
      amount: Math.abs(variance),
      isOverBudget: variance > 0,
      percentage: (
        (variance / projectData.targetCost) *
        100
      ).toFixed(1),
    };
  };

  const costVariance = getCostVariance();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[85vw] !w-[85vw] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
          {/* Sticky Header Section */}
          <div className="sticky top-0 z-50 px-8 py-6 bg-gradient-to-r from-orange-50 via-white to-orange-50 border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-semibold text-gray-900 mb-2">
                    PO Pending Details
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    View and manage PO Pending project details
                    and information
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
                    <Badge
                      className={`${projectData.priority === "High" ? "bg-red-500 text-white" : projectData.priority === "Medium" ? "bg-purple-500 text-white" : "bg-green-600 text-white"} text-xs px-2 py-1`}
                    >
                      {projectData.priority}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Advance to PO Approved Button - Only enabled if PO number exists */}
                <Button
                  onClick={handleAdvanceToPOApproved}
                  disabled={!editedProject?.poNumber}
                  className={`bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 ${!editedProject?.poNumber ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={!editedProject?.poNumber ? "PO Number required to advance to PO Approved" : "Advance to PO Approved"}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Advance to PO Approved
                </Button>

                {/* Approve & Advance to Production Button - Only enabled if PO number exists */}
                <Button
                  onClick={handleApproveAndAdvanceToProduction}
                  disabled={!editedProject?.poNumber}
                  className={`bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 ${!editedProject?.poNumber ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={!editedProject?.poNumber ? "PO Number required to advance to Production" : "Advance directly to Production"}
                >
                  <Factory className="w-4 h-4 mr-2" />
                  Approve & Advance to Production
                </Button>

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
                <button
                  onClick={() => onOpenChange(false)}
                  type="button"
                  className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center border-0 bg-transparent transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Main Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="px-8 py-8 space-y-10">
              {/* Approval Progress */}
              <div className="space-y-5">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                    <Workflow className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    PO Target Progress
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
                    <Progress
                      value={currentStage.progress}
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {workflowStages.map((stage, index) => {
                      const isCompleted =
                        workflowStages.findIndex(
                          (s) => s.id === "PO Pending",
                        ) >= index;
                      const isCurrent =
                        stage.id === "PO Pending";

                      return (
                        <div
                          key={stage.id}
                          className={`text-center p-2 rounded-lg transition-all ${
                            isCurrent
                              ? "bg-orange-100 border-2 border-orange-400 shadow-md"
                              : isCompleted
                                ? "bg-green-50 border border-green-200"
                                : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 mx-auto mb-1 rounded-full flex items-center justify-center text-xs ${
                              isCurrent
                                ? "bg-orange-500 text-white"
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

              {/* PO Target Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    PO Target Information
                  </h3>
                </div>

                {/* Unified Product Details Section */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="text-lg font-semibold text-gray-900">Product & Brand Details</h4>
                    <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                      PO Pending
                    </Badge>
                  </div>
                    
                  {/* Horizontal Layout: Preview + Images */}
                  <div className="flex gap-4 mb-5">
                    {/* Product Preview - Compact */}
                    <div className="flex-shrink-0 w-44">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 h-full">
                        <Label className="text-xs font-medium text-gray-600 mb-2 block">Preview</Label>
                        <div className="w-20 h-20 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mx-auto mb-2">
                          <img 
                            src={coverPhoto || (projectData.category === "Sports" ? "https://images.unsplash.com/photo-1542291026-7eec264c27ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBzaG9lJTIwcHJvZHVjdHxlbnwxfHx8fDE3NTY3MzU5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080" : projectData.category === "Casual" ? "https://images.unsplash.com/photo-1549298916-b41d501d3772?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBzaG9lJTIwcHJvZHVjdHxlbnwxfHx8fDE3NTY3MzU5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080" : "https://images.unsplash.com/photo-1533158628620-7e35717d36e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBzaG9lJTIwcHJvZHVjdHxlbnwxfHx8fDE3NTY3MzU5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080")}
                            alt={projectData.productCode}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-xs font-medium text-gray-900 text-center">{projectData.productCode}</div>
                        <div className="text-xs text-gray-500 text-center mt-0.5">Sample</div>
                      </div>
                    </div>

                    {/* Product Images Gallery (same as other dialogs) */}
                    <div className="flex-1 min-w-0">
                      <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg border border-gray-200/80 shadow-sm h-full">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <Label className="text-xs font-semibold text-gray-800">Images</Label>
                          </div>
                          {(coverPhoto || additionalImages.filter(img => img).length > 0 || dynamicImages.length > 0) && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs h-5">
                              {[coverPhoto, ...additionalImages.filter(img => img), ...dynamicImages].length}
                            </Badge>
                          )}
                        </div>
                        
                        {!isEditing ? (
                          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                            {coverPhoto && (
                              <div className="group relative flex-shrink-0">
                                <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-blue-400 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                                  <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                </div>
                              </div>
                            )}
                            {additionalImages.filter(img => img).map((image, i) => (
                              <div key={i} className="group relative flex-shrink-0">
                                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 hover:border-blue-300 cursor-pointer bg-white">
                                  <img src={image} alt={`Image ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                </div>
                              </div>
                            ))}
                            {dynamicImages.map((image, i) => (
                              <div key={`dynamic-${i}`} className="group relative flex-shrink-0">
                                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 hover:border-blue-300 cursor-pointer bg-white">
                                  <img src={image} alt={`Image ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                </div>
                              </div>
                            ))}
                            {(!coverPhoto && additionalImages.filter(img => img).length === 0 && dynamicImages.length === 0) && (
                              <div className="w-full text-center py-4">
                                <ImageIcon className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                                <p className="text-xs text-gray-500">No images</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                              <div className="flex-shrink-0">
                                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverPhotoUpload} />
                                {coverPhoto ? (
                                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-blue-400 shadow-md group">
                                    <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                                      <Button type="button" variant="destructive" size="sm" onClick={removeCoverPhoto} className="h-6 w-6 p-0 shadow-lg">
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div onClick={() => coverInputRef.current?.click()} className="w-20 h-20 border-2 border-dashed border-blue-400 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 transition-all duration-200 cursor-pointer group flex flex-col items-center justify-center shadow-sm hover:shadow-md">
                                    <ImageIcon className="w-5 h-5 text-blue-600" />
                                    <span className="text-xs text-blue-700 mt-0.5">Cover</span>
                                  </div>
                                )}
                              </div>

                              {[0, 1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex-shrink-0">
                                  <input ref={(el) => { if (additionalInputRefs.current) { additionalInputRefs.current[i] = el; }}} type="file" accept="image/*" className="hidden" onChange={(e) => handleAdditionalImageUpload(e, i)} />
                                  {additionalImages[i] ? (
                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm group">
                                      <img src={additionalImages[i]} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                                        <Button type="button" variant="destructive" size="sm" onClick={() => removeAdditionalImage(i)} className="h-6 w-6 p-0 shadow-lg">
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div onClick={() => additionalInputRefs.current[i]?.click()} className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:bg-gray-50 hover:border-blue-400 transition-all duration-200 cursor-pointer flex items-center justify-center group shadow-sm hover:shadow-md">
                                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-all duration-200" />
                                    </div>
                                  )}
                                </div>
                              ))}

                              {dynamicImages.map((image, i) => (
                                <div key={`dynamic-${i}`} className="flex-shrink-0">
                                  <input ref={(el) => { if (dynamicInputRefs.current) { dynamicInputRefs.current[i] = el; }}} type="file" accept="image/*" className="hidden" onChange={(e) => handleDynamicImageUpload(e, i)} />
                                  {image ? (
                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm group">
                                      <img src={image} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                                        <Button type="button" variant="destructive" size="sm" onClick={() => removeDynamicImage(i)} className="h-6 w-6 p-0 shadow-lg">
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div onClick={() => dynamicInputRefs.current[i]?.click()} className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:bg-gray-50 hover:border-blue-400 transition-all duration-200 cursor-pointer flex items-center justify-center group shadow-sm hover:shadow-md">
                                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-all duration-200" />
                                    </div>
                                  )}
                                </div>
                              ))}

                              <div onClick={handleAddImageSlot} className="w-20 h-20 flex-shrink-0 border-2 border-dashed border-blue-400 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center group shadow-sm hover:shadow-md">
                                <Plus className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-all duration-200" />
                              </div>
                            </div>

                            <div className="flex justify-end pt-2 border-t border-gray-200">
                              <Button onClick={handleSaveImages} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all h-7 text-xs" size="sm">
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
                    <div>
                      <Label>Product Code</Label>
                      <div className="mt-1 font-mono font-bold text-gray-900">{projectData.productCode}</div>
                    </div>
                    
                    <div>
                      <Label>Company</Label>
                      {isEditing ? (
                        <Select defaultValue="1">
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Phoenix Footwear</SelectItem>
                            <SelectItem value="2">Urban Sole</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">Phoenix Footwear</div>
                      )}
                    </div>

                    <div>
                      <Label>Brand</Label>
                      {isEditing ? (
                        <Select value={editedProject.brandId} onValueChange={(value) => setEditedProject({...editedProject, brandId: value})}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(brands || []).map(brand => (
                              <SelectItem key={brand.id} value={brand.id}>{brand.brandName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">{projectData.brand}</div>
                      )}
                    </div>

                    <div>
                      <Label>Category</Label>
                      {isEditing ? (
                        <Select value={editedProject.categoryId} onValueChange={(value) => setEditedProject({...editedProject, categoryId: value})}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(categories || []).map(category => (
                              <SelectItem key={category.id} value={category.id}>{category.categoryName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">{projectData.category}</div>
                      )}
                    </div>

                    <div>
                      <Label>Type</Label>
                      {isEditing ? (
                        <Select value={editedProject.typeId} onValueChange={(value) => setEditedProject({...editedProject, typeId: value})}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(types || []).map(type => (
                              <SelectItem key={type.id} value={type.id}>{type.typeName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">{projectData.type}</div>
                      )}
                    </div>

                    <div>
                      <Label>Gender</Label>
                      {isEditing ? (
                        <Select defaultValue={projectData.gender.toLowerCase()}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="unisex">Unisex</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">{projectData.gender}</div>
                      )}
                    </div>

                    <div>
                      <Label>Art</Label>
                      {isEditing ? (
                        <Input type="text" defaultValue={projectData.artColour} className="mt-1" />
                      ) : (
                        <div className="mt-1 text-gray-900">{projectData.artColour}</div>
                      )}
                    </div>

                    <div>
                      <Label>Colour</Label>
                      {isEditing ? (
                        <Select value={editedProject.colorId} onValueChange={(value) => setEditedProject({...editedProject, colorId: value})}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(colors || []).map(color => (
                              <SelectItem key={color.id} value={color.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.hexCode }}></div>
                                  {color.colorName}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${getColorDisplay()}`}></div>
                          <span className="text-gray-900">{projectData.color}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Country</Label>
                      {isEditing ? (
                        <Select value={editedProject.countryId} onValueChange={(value) => setEditedProject({...editedProject, countryId: value})}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(countries || []).map(country => (
                              <SelectItem key={country.id} value={country.id}>{country.countryName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">{projectData.country}</div>
                      )}
                    </div>

                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">
                        <Badge className="bg-orange-100 text-orange-800">
                          PO Pending
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label>Start Date</Label>
                      {isEditing ? (
                        <Input type="date" value={editedProject.startDate} onChange={(e) => setEditedProject({...editedProject, startDate: e.target.value})} className="mt-1" />
                      ) : (
                        <div className="mt-1 text-gray-900">{projectData.startDate}</div>
                      )}
                    </div>

                    <div>
                      <Label>Target Date</Label>
                      {isEditing ? (
                        <Input type="date" value={editedProject.endDate} onChange={(e) => setEditedProject({...editedProject, endDate: e.target.value})} className="mt-1" />
                      ) : (
                        <div className="mt-1 text-gray-900">{projectData.poTargetDate}</div>
                      )}
                    </div>

                    <div>
                      <Label>Priority</Label>
                      {isEditing ? (
                        <Select value={editedProject.priority || 'Low'} onValueChange={(value) => setEditedProject({...editedProject, priority: value})}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1">
                          <Badge className={
                            projectData.priority === 'High' ? 'bg-red-500 text-white' :
                            projectData.priority === 'Medium' ? 'bg-amber-500 text-white' :
                            'bg-green-500 text-white'
                          }>
                            {projectData.priority}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Assigned To</Label>
                      {isEditing ? (
                        <Input type="text" value={editedProject.taskInc} onChange={(e) => setEditedProject({...editedProject, taskInc: e.target.value})} className="mt-1" placeholder="Person name" />
                      ) : (
                        <div className="mt-1 text-gray-900">{projectData.taskInc}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Materials & Components Analysis */}
              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-md">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Materials & Components Analysis</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Components Analysis */}
                  <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-purple-900 mb-4">Components Used</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-600 bg-purple-50 p-2 rounded">
                        <div>COMPONENT</div>
                        <div>DESCRIPTION</div>
                        <div>CONSUMPTION</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">Foam</div>
                          <div className="text-gray-600">-</div>
                          <div className="text-gray-600">7.5grm</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">Velcro</div>
                          <div className="text-gray-600">75mm</div>
                          <div className="text-gray-600">1.25 pair</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">Elastic Roop</div>
                          <div className="text-gray-600">-</div>
                          <div className="text-gray-600">-</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">Thread</div>
                          <div className="text-gray-600">-</div>
                          <div className="text-gray-600">-</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">Tafta Label</div>
                          <div className="text-gray-600">MRP</div>
                          <div className="text-gray-600">-</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">Buckle</div>
                          <div className="text-gray-600">-</div>
                          <div className="text-gray-600">2pcs</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">Heat Transfer</div>
                          <div className="text-gray-600">-</div>
                          <div className="text-gray-600">-</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">Trim</div>
                          <div className="text-gray-600">sticker</div>
                          <div className="text-gray-600">10 pcs</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">Welding</div>
                          <div className="text-gray-600">-</div>
                          <div className="text-gray-600">-</div>
                        </div>
                      </div>

                      <div className="bg-purple-50 p-3 rounded-lg mt-3">
                        <div className="text-sm text-purple-800">
                          <strong>Total Components:</strong> 9 different components used in production
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Materials Analysis */}
                  <div className="bg-white border-2 border-teal-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-teal-900 mb-4">Materials Used</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-600 bg-teal-50 p-2 rounded">
                        <div>MATERIAL</div>
                        <div>DESCRIPTION</div>
                        <div>CONSUMPTION</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">Upper</div>
                          <div className="text-gray-600">Rexine</div>
                          <div className="text-gray-600">26 pairs/mtr</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">Lining</div>
                          <div className="text-gray-600">Skinfit</div>
                          <div className="text-gray-600">25 pair @ 155/-</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">Lining</div>
                          <div className="text-gray-600">EVA</div>
                          <div className="text-gray-600">33/70 - 1.5mm 35pair</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">Footbed</div>
                          <div className="text-gray-600">-</div>
                          <div className="text-gray-600">-</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">Mid Sole 1</div>
                          <div className="text-gray-600">-</div>
                          <div className="text-gray-600">-</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">Mid Sole 2</div>
                          <div className="text-gray-600">-</div>
                          <div className="text-gray-600">-</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">Out Sole</div>
                          <div className="text-gray-600">-</div>
                          <div className="text-gray-600">-</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">PU Adhesive</div>
                          <div className="text-gray-600">-</div>
                          <div className="text-gray-600">-</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200">
                          <div className="font-medium">Print</div>
                          <div className="text-gray-600">-</div>
                          <div className="text-gray-600">-</div>
                        </div>
                      </div>

                      <div className="bg-teal-50 p-3 rounded-lg mt-3">
                        <div className="text-sm text-teal-800">
                          <strong>Total Materials:</strong> 9 different materials used in production
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Analysis Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-teal-50 border-2 border-purple-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Production Analysis Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                      <div className="text-sm text-purple-600 font-medium">Total Components</div>
                      <div className="text-2xl font-bold text-purple-800">9</div>
                      <div className="text-xs text-gray-500 mt-1">Active components</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-teal-200">
                      <div className="text-sm text-teal-600 font-medium">Total Materials</div>
                      <div className="text-2xl font-bold text-teal-800">9</div>
                      <div className="text-xs text-gray-500 mt-1">Raw materials</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-600 font-medium">Production Complexity</div>
                      <div className="text-2xl font-bold text-gray-800">Medium</div>
                      <div className="text-xs text-gray-500 mt-1">18 total items</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-700">
                      <strong>PO Target Analysis:</strong> Product ready for production order with standardized materials and components. 
                      Upper materials include Rexine and Skinfit lining with EVA padding. Component specifications finalized with 
                      velcro, buckles, and heat transfer elements. All material consumption rates have been validated for efficient 
                      production and cost optimization.
                    </div>
                  </div>
                </div>
              </div>

              {/* PO Number Management Section - For Pending Projects Only */}
              {isPOPending() && (
                <div className="space-y-6">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Add PO Number
                    </h3>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-8 shadow-lg">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                        {editedProject?.poNumber ? (
                          <CheckCircle className="w-6 h-6 text-white" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-orange-900 mb-2">
                          {editedProject?.poNumber ? "PO Number Added - Buttons Activated" : "PO Number Required to Proceed"}
                        </h4>
                        <p className="text-sm text-orange-800">
                          {editedProject?.poNumber 
                            ? "PO Number has been saved. The advance buttons at the top are now active. You can edit the PO number below if needed."
                            : "Enter the Purchase Order number below to unlock the advance buttons. Once added, you can advance this project to PO Approved or directly to Production."
                          }
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border-2 border-orange-200 shadow-md">
                      <div className="space-y-3">
                        <Label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-orange-600" />
                          Purchase Order Number
                        </Label>
                        
                        <div className="flex gap-3 items-start">
                          <div className="flex-1">
                            <Input
                              value={poNumber || editedProject?.poNumber || ""}
                              onChange={(e) => setPONumber(e.target.value)}
                              placeholder="Enter PO number (e.g., PO-2024-001)"
                              className="h-12 text-base border-2 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            />
                            <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                              {editedProject?.poNumber ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  <span className="text-green-700 font-medium">
                                    Saved: {editedProject.poNumber}
                                  </span>
                                  <span className="text-gray-500 ml-1">- You can edit and save again if needed</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                  Enter the official purchase order number provided by the client
                                </>
                              )}
                            </p>
                          </div>
                          
                          <Button
                            onClick={handleAddPONumber}
                            disabled={!poNumber.trim()}
                            className="h-12 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold shadow-lg whitespace-nowrap"
                          >
                            <Save className="w-5 h-5 mr-2" />
                            {editedProject?.poNumber ? "Update PO Number" : poNumber.trim() ? "Save PO Number" : "Enter to Continue"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PO Number Added - Ready to Advance Section */}
              {project.poNumber && !isPOApproved() && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="text-lg font-semibold text-green-800 mb-2">
                          PO Number Added Successfully!
                        </h4>
                        <p className="text-sm text-green-700 mb-3">
                          PO Number <span className="font-mono font-bold">{project.poNumber}</span> has been added to this project.
                        </p>
                        <p className="text-sm text-green-700">
                          You can now use the buttons at the top to:
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-white p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowRight className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-800">Option 1</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          <strong>Advance to PO Approved:</strong> Move project to PO Approved section for review before production
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Factory className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-800">Option 2</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          <strong>Approve & Advance to Production:</strong> Skip PO Approved and go directly to Production
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PO Number Display & Edit Section - For Approved Projects Only */}
              {isPOApproved() && (
                <div className="space-y-6">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      PO Number Information
                    </h3>
                  </div>

                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="text-lg font-semibold text-green-800 mb-2">
                          PO Number Approved
                        </h4>
                        <p className="text-sm text-green-700">
                          This project has been approved and has
                          an assigned PO number. You can edit
                          the PO number if needed.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Current PO Number
                          </Label>
                          {!isAddingPO ? (
                            <div className="mt-1 flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-3">
                                <Badge className="bg-green-100 text-green-800 px-3 py-1 text-base font-mono">
                                  {project.poNumber ||
                                    "PO-2024-001"}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  Approved PO Number
                                </span>
                              </div>
                              <Button
                                onClick={() => {
                                  setIsAddingPO(true);
                                  setPONumber(
                                    project.poNumber || "",
                                  );
                                }}
                                variant="outline"
                                size="sm"
                                className="hover:bg-blue-50 hover:border-blue-300"
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          ) : (
                            <div className="mt-1 space-y-3">
                              <Input
                                value={poNumber}
                                onChange={(e) =>
                                  setPONumber(e.target.value)
                                }
                                placeholder="Enter new PO number (e.g., PO-2024-001)"
                                className="mt-1"
                              />
                              <p className="text-xs text-gray-500">
                                Update the purchase order number
                                for this project
                              </p>
                              <div className="flex gap-3">
                                <Button
                                  onClick={handleEditPONumber}
                                  className="bg-green-500 hover:bg-green-600"
                                  disabled={!poNumber.trim()}
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  Update PO Number
                                </Button>
                                <Button
                                  onClick={() => {
                                    setIsAddingPO(false);
                                    setPONumber("");
                                  }}
                                  variant="outline"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Project Status:
                        </span>
                      </div>
                      <ul className="text-xs text-blue-700 ml-6 space-y-1">
                        <li>
                          • This project is in the "PO Approved"
                          section
                        </li>
                        <li>
                          • Project status: "PO Issued" (100%
                          complete)
                        </li>
                        <li>• PO status: "Approved"</li>
                        <li>
                          • You can edit the PO number without
                          changing the project status
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Client Feedback & Updates */}
              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Client Feedback & Updates
                  </h3>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Client Feedback Status
                        </Label>
                        <div className="mt-2">
                          <Badge
                            className={
                              projectData.status ===
                              "PO Confirmed"
                                ? "bg-green-100 text-green-800 text-sm px-3 py-2"
                                : projectData.status ===
                                    "PO Ready"
                                  ? "bg-blue-100 text-blue-800 text-sm px-3 py-2"
                                  : "bg-orange-100 text-orange-800 text-sm px-3 py-2"
                            }
                          >
                            {projectData.status ===
                            "PO Confirmed"
                              ? "✅ Client Approved & PO Confirmed"
                              : projectData.status ===
                                  "PO Ready"
                                ? "📋 Ready for PO Generation"
                                : "⏳ Awaiting Client Approval"}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Next Action Date
                        </Label>
                        <div className="mt-2 text-base text-gray-900">
                          {projectData.nextDate}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-sm font-medium text-gray-600 mb-3 block">
                        PO Target Summary
                      </Label>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">
                              Product:
                            </span>
                            <div className="text-gray-900">
                              {projectData.artColour}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">
                              Quantity:
                            </span>
                            <div className="text-gray-900">
                              {projectData.orderQty.toLocaleString(
                                "en-IN",
                              )}{" "}
                              units
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">
                              Total Value:
                            </span>
                            <div className="text-gray-900 flex items-center">
                              <IndianRupee className="w-3 h-3 mr-1" />
                              {projectData.poValue.toLocaleString(
                                "en-IN",
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}