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

interface POApprovedProjectDetailsDialogProps {
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

export function POApprovedProjectDetailsDialog({
  open,
  onOpenChange,
  project,
  brands,
  categories,
  types,
  colors,
  countries,
}: POApprovedProjectDetailsDialogProps) {
  const { updateRDProject } = useERPStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Partial<RDProject>>({});
  const [isAddingPO, setIsAddingPO] = useState(false);
  const [poNumber, setPONumber] = useState("");

  // Image editing states
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [dynamicImages, setDynamicImages] = useState<string[]>([]);
  const coverInputRef = React.useRef<HTMLInputElement>(null);
  const additionalInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const dynamicInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (project) {
      setEditedProject(project);
      setCoverPhoto(project.coverPhoto || null);
      setAdditionalImages(project.additionalImages || []);
      setDynamicImages(project.dynamicImages || []);
      setPONumber(project.poNumber || "");
    }
  }, [project]);

  if (!project) return null;

  const currentStage = workflowStages.find(s => s.id === "PO Approved") || workflowStages[5];

  const projectData = {
    productCode: project.autoCode,
    brand: "UA Sports",
    category: "Sports",
    type: "Running",
    gender: "Unisex",
    artColour: "Boots - Black",
    color: "Black",
    country: "Vietnam",
    startDate: new Date(project.startDate).toLocaleDateString("en-GB"),
    poTargetDate: project.poTargetDate ? new Date(project.poTargetDate).toLocaleDateString("en-GB") : "TBD",
    nextDate: project.nextUpdateDate ? new Date(project.nextUpdateDate).toLocaleDateString("en-GB") : "TBD",
    priority: project.priority || "High",
    taskInc: project.taskInc || "John Doe",
    targetCost: project.targetCost || 12500,
    finalCost: 15247,
    orderQty: 5000,
    poValue: 76235000,
    status: project.status,
  };

  const handleSave = () => {
    if (editedProject.id) {
      updateRDProject(editedProject.id, editedProject);
      toast.success("PO Approved project updated successfully");
      setIsEditing(false);
    }
  };

  const handleAdvanceToProduction = () => {
    if (project && project.id) {
      updateRDProject(project.id, {
        ...project,
        status: "Production"
      });
      toast.success("Project successfully advanced to Production!");
      onOpenChange(false);
    }
  };

  const handleEditPONumber = () => {
    if (project && project.id && poNumber.trim()) {
      updateRDProject(project.id, {
        ...project,
        poNumber: poNumber.trim()
      });
      toast.success("PO Number updated successfully!");
      setIsAddingPO(false);
    }
  };

  // Image handlers
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

  const removeCoverPhoto = () => setCoverPhoto(null);
  const removeAdditionalImage = (index: number) => {
    const newImages = [...additionalImages];
    newImages[index] = '';
    setAdditionalImages(newImages);
  };
  const removeDynamicImage = (index: number) => {
    const newImages = dynamicImages.filter((_, i) => i !== index);
    setDynamicImages(newImages);
  };
  const handleAddImageSlot = () => setDynamicImages([...dynamicImages, '']);
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

  const getColorDisplay = () => {
    const colorName = colors?.find(c => c.id === project.colorId)?.colorName || projectData.color;
    const colorMap: Record<string, string> = {
      Black: "bg-gray-900",
      White: "bg-gray-100 border border-gray-300",
      Brown: "bg-yellow-600",
      "Navy Blue": "bg-blue-900",
      Red: "bg-red-600",
      "Rose Gold": "bg-pink-400",
      "Mahogany Brown": "bg-yellow-800",
      "Black & Neon": "bg-gradient-to-r from-gray-900 to-green-400",
    };
    return colorMap[colorName] || "bg-gray-400";
  };

  const getCostVariance = () => {
    const variance = projectData.finalCost - projectData.targetCost;
    return {
      amount: Math.abs(variance),
      percentage: ((variance / projectData.targetCost) * 100).toFixed(2),
      isOverBudget: variance > 0
    };
  };

  const costVariance = getCostVariance();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[85vw] !w-[85vw] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
          {/* Sticky Header Section - Emerald/Green Theme */}
          <div className="sticky top-0 z-50 px-8 py-6 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ShoppingCart className="w-7 h-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-semibold text-gray-900 mb-2">
                    PO Approved Details
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    View and manage PO Approved project details
                    and information
                  </DialogDescription>
                  <div className="flex items-center gap-4">
                    <span className="text-lg text-gray-600">
                      {projectData.productCode}
                    </span>
                    <Badge className="bg-emerald-100 text-emerald-800 px-3 py-1">
                      PO Approved
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
                <Button
                  onClick={handleAdvanceToProduction}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <Factory className="w-4 h-4 mr-2" />
                  Advance to Production
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
                      Cancel
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
                    PO Approval Progress
                  </h3>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Overall Progress
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        100%
                      </span>
                    </div>
                    <Progress
                      value={100}
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {workflowStages.map((stage, index) => {
                      const isCompleted = true; // All stages completed
                      const isCurrent = stage.id === "PO Approved";

                      return (
                        <div
                          key={stage.id}
                          className={`text-center p-2 rounded-lg transition-all ${
                            isCurrent
                              ? "bg-emerald-100 border-2 border-emerald-400 shadow-md"
                              : "bg-green-50 border border-green-200"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 mx-auto mb-1 rounded-full flex items-center justify-center text-xs ${
                              isCurrent
                                ? "bg-emerald-500 text-white"
                                : "bg-green-500 text-white"
                            }`}
                          >
                            <CheckCircle className="w-3 h-3" />
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

              {/* Product Basic Details Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Product Information
                  </h3>
                </div>

                {/* Unified Product Details Section */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="text-lg font-semibold text-gray-900">Product & Brand Details</h4>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      PO Approved
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
                        <Badge className="bg-emerald-100 text-emerald-800">
                          PO Approved
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

              {/* PO Number Display & Edit Section */}
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
                        This project has been approved and has an assigned PO number. You can edit the PO number if needed.
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
                                {poNumber || "PO-2024-001"}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                Approved PO Number
                              </span>
                            </div>
                            <Button
                              onClick={() => setIsAddingPO(true)}
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
                              onChange={(e) => setPONumber(e.target.value)}
                              placeholder="Enter new PO number (e.g., PO-2024-001)"
                              className="mt-1"
                            />
                            <p className="text-xs text-gray-500">
                              Update the purchase order number for this project
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
                                  setPONumber(project.poNumber || "");
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

                  
                </div>
              </div>

              {/* Rest of content similar to POPendingProjectDetailsDialog but read-only focus */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-6">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-600" />
                  <h3 className="text-2xl font-bold text-emerald-900 mb-2">
                    PO Successfully Approved!
                  </h3>
                  <p className="text-emerald-700 mb-4">
                    This project has completed the PO approval process and is ready for production.
                  </p>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-white p-4 rounded-lg border border-emerald-200">
                      <div className="text-sm text-emerald-600 font-medium">PO Number</div>
                      <div className="text-xl font-bold text-emerald-800">{poNumber || "PO-2024-001"}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-emerald-200">
                      <div className="text-sm text-emerald-600 font-medium">Order Quantity</div>
                      <div className="text-xl font-bold text-emerald-800">{projectData.orderQty.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-emerald-200">
                      <div className="text-sm text-emerald-600 font-medium">Total PO Value</div>
                      <div className="text-xl font-bold text-emerald-800 flex items-center justify-center">
                        <IndianRupee className="w-4 h-4" />
                        {projectData.poValue.toLocaleString()}
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
