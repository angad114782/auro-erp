import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Shield,
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
import { toast } from "sonner";
import {
  getStage,
  ProductDevelopment,
  Props,
  dataUrlToFile,
  getFullImageUrl,
  formatDateDisplay,
} from "./ProjectDetailsDialog";
import api from "../lib/api";
import { POTargetDialog } from "./POTargetDialog";
import { ColorMaterialsDialog } from "./ColorMaterialsDialog";

const workflowStages = [
  {
    id: "idea",
    name: "Idea Submitted",
    progress: 12,
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "prototype",
    name: "Prototype",
    progress: 30,
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "red_seal",
    name: "Red Seal",
    progress: 50,
    color: "bg-red-100 text-red-800",
  },
  {
    id: "green_seal",
    name: "Green Seal",
    progress: 70,
    color: "bg-green-100 text-green-800",
  },
  {
    id: "po_pending",
    name: "PO Pending",
    progress: 86,
    color: "bg-orange-100 text-orange-800",
  },
  {
    id: "po_approved",
    name: "PO Approved",
    progress: 100,
    color: "bg-emerald-100 text-emerald-800",
  },
];

interface Material {
  name: string;
  desc: string;
  consumption: string;
}

interface Component {
  name: string;
  desc: string;
  consumption: string;
}

interface ColorVariantData {
  materials: Material[];
  components: Component[];
  images: string[];
  updatedBy?: string | null;
  updatedAt?: Date;
}

export function GreenSealProjectDetailsDialog(props: Props) {
  const {
    open,
    onOpenChange,
    project,
    companies,
    brands,
    categories,
    types,
    countries,
    assignPersons,
    setBrands,
    setCategories,
    reloadProjects,
    setSelectedSubModule,
  } = props;

  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<ProductDevelopment | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [poTargetDialogOpen, setPOTargetDialogOpen] = useState(false);
  const [colorMaterialsDialogOpen, setColorMaterialsDialogOpen] =
    useState(false);
  const [activeColorTab, setActiveColorTab] = useState<string>("");
  const [colorVariants, setColorVariants] = useState<
    Map<string, ColorVariantData>
  >(new Map());

  // Image editing states
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [samples, setSamples] = useState<string[]>([]);
  const coverRef = React.useRef<HTMLInputElement | null>(null);
  const sampleRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Memoized values
  const currentStage = useMemo(
    () => getStage(editedProject?.status),
    [editedProject?.status]
  );

  const currentIndex = useMemo(
    () => workflowStages.findIndex((s) => s.id === editedProject?.status),
    [editedProject?.status]
  );

  const nextStage = useMemo(
    () =>
      currentIndex >= 0 && currentIndex < workflowStages.length - 1
        ? workflowStages[currentIndex + 1]
        : null,
    [currentIndex]
  );

  const coverImageUrl = useMemo(
    () => getFullImageUrl(coverPhoto),
    [coverPhoto]
  );
  const sampleImageUrls = useMemo(
    () => samples.map(getFullImageUrl),
    [samples]
  );

  // Convert MongoDB Map to JavaScript Map
  const convertColorVariants = useCallback(
    (projectData: any): Map<string, ColorVariantData> => {
      const variantsMap = new Map<string, ColorVariantData>();

      if (!projectData?.colorVariants) return variantsMap;

      // Handle different possible formats from backend
      if (projectData.colorVariants instanceof Map) {
        // Direct Map from MongoDB
        for (const [colorId, data] of projectData.colorVariants.entries()) {
          variantsMap.set(colorId, {
            materials: Array.isArray(data?.materials) ? data.materials : [],
            components: Array.isArray(data?.components) ? data.components : [],
            images: Array.isArray(data?.images) ? data.images : [],
            updatedBy: data?.updatedBy || null,
            updatedAt: data?.updatedAt ? new Date(data.updatedAt) : new Date(),
          });
        }
      } else if (typeof projectData.colorVariants === "object") {
        // Object format from API response
        for (const [colorId, data] of Object.entries(
          projectData.colorVariants
        )) {
          const variantData = data as any;
          variantsMap.set(colorId, {
            materials: Array.isArray(variantData?.materials)
              ? variantData.materials
              : [],
            components: Array.isArray(variantData?.components)
              ? variantData.components
              : [],
            images: Array.isArray(variantData?.images)
              ? variantData.images
              : [],
            updatedBy: variantData?.updatedBy || null,
            updatedAt: variantData?.updatedAt
              ? new Date(variantData.updatedAt)
              : new Date(),
          });
        }
      }

      return variantsMap;
    },
    []
  );

  // Initialize state when dialog opens
  useEffect(() => {
    if (!project || !open) return;

    setEditedProject({ ...project });
    setCoverPhoto(project.coverImage || null);
    setSamples(project.sampleImages ? [...project.sampleImages] : []);
    setIsEditing(false);

    // Load color variants from project data
    const variantsMap = convertColorVariants(project);
    setColorVariants(variantsMap);

    // Set active tab
    if (variantsMap.size > 0) {
      const firstColor = Array.from(variantsMap.keys())[0];
      setActiveColorTab(firstColor);
    } else if (project.color) {
      setActiveColorTab(project.color);
    }
  }, [project, open, convertColorVariants]);

  // Fetch brands when company changes
  useEffect(() => {
    if (!isEditing || !editedProject?.company?._id) {
      if (isEditing) setBrands([]);
      return;
    }

    const companyId = editedProject.company._id;
    let cancelled = false;

    api
      .get("/brands", { params: { company: companyId } })
      .then((res) => {
        if (cancelled) return;
        const arr = res.data?.items || res.data?.data || res.data || [];
        setBrands(arr);
      })
      .catch(() => !cancelled && setBrands([]));

    return () => {
      cancelled = true;
    };
  }, [editedProject?.company?._id, isEditing, setBrands]);

  // Fetch categories when brand changes
  useEffect(() => {
    if (
      !isEditing ||
      !editedProject?.company?._id ||
      !editedProject?.brand?._id
    ) {
      if (isEditing) setCategories([]);
      return;
    }

    const c = editedProject.company._id;
    const b = editedProject.brand._id;
    let cancelled = false;

    api
      .get(`/companies/${c}/brands/${b}/categories`)
      .then((res) => {
        if (cancelled) return;
        const arr = res.data?.items || res.data?.data || res.data || [];
        setCategories(arr);
      })
      .catch(() => !cancelled && setCategories([]));

    return () => {
      cancelled = true;
    };
  }, [
    editedProject?.company?._id,
    editedProject?.brand?._id,
    isEditing,
    setCategories,
  ]);

  // Default materials and components
  const getDefaultMaterials = (): Material[] => [
    { name: "Upper", desc: "Rexine", consumption: "26 pairs/mtr" },
    { name: "Lining", desc: "Skinfit", consumption: "25 pair @ 155/-" },
    { name: "Lining", desc: "EVA", consumption: "33/70 - 1.5mm 35pair" },
    { name: "Footbed", desc: "-", consumption: "-" },
    { name: "Mid Sole 1", desc: "-", consumption: "-" },
    { name: "Mid Sole 2", desc: "-", consumption: "-" },
    { name: "Out Sole", desc: "-", consumption: "-" },
    { name: "PU Adhesive", desc: "-", consumption: "-" },
    { name: "Print", desc: "-", consumption: "-" },
  ];

  const getDefaultComponents = (): Component[] => [
    { name: "Foam", desc: "-", consumption: "7.5grm" },
    { name: "Velcro", desc: "75mm", consumption: "1.25 pair" },
    { name: "Elastic Roop", desc: "-", consumption: "-" },
    { name: "Thread", desc: "-", consumption: "-" },
    { name: "Tafta Label", desc: "MRP", consumption: "-" },
    { name: "Buckle", desc: "-", consumption: "2pcs" },
    { name: "Heat Transfer", desc: "-", consumption: "-" },
    { name: "Trim", desc: "sticker", consumption: "10 pcs" },
    { name: "Welding", desc: "-", consumption: "-" },
  ];

  // Safe variant data getters
  const getActiveColorVariant = (): ColorVariantData | null => {
    if (!colorVariants.size || !activeColorTab) return null;
    return colorVariants.get(activeColorTab) || null;
  };

  const getActiveColorMaterials = (): Material[] => {
    const variant = getActiveColorVariant();
    if (variant && Array.isArray(variant.materials)) {
      return variant.materials;
    }
    return getDefaultMaterials();
  };

  const getActiveColorComponents = (): Component[] => {
    const variant = getActiveColorVariant();
    if (variant && Array.isArray(variant.components)) {
      return variant.components;
    }
    return getDefaultComponents();
  };

  const getColorName = (colorId: string): string => {
    return colorId || "Default Color";
  };

  // Get color variant tabs as array
  const colorVariantTabs = useMemo(() => {
    return Array.from(colorVariants.keys());
  }, [colorVariants]);

  // Image upload handlers
  const handleCoverUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be < 5MB");
        return;
      }
      const r = new FileReader();
      r.onloadend = () => setCoverPhoto(r.result as string);
      r.readAsDataURL(file);
    },
    []
  );

  const handleSampleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be < 5MB");
        return;
      }
      const r = new FileReader();
      r.onloadend = () => {
        setSamples((prev) => {
          const arr = [...prev];
          arr[i] = r.result as string;
          return arr;
        });
      };
      r.readAsDataURL(file);
    },
    []
  );

  const removeSample = useCallback((i: number) => {
    setSamples((s) => s.filter((_, idx) => idx !== i));
  }, []);

  const addSampleSlot = useCallback(() => setSamples((s) => [...s, ""]), []);

  const handleAdvanceToPOPending = useCallback(async () => {
    try {
      if (!editedProject) return;

      const companyId = editedProject.company?._id;
      const brandId = editedProject.brand?._id;
      const categoryId = editedProject.category?._id;
      const projectId = editedProject._id;

      await api.patch(
        `/companies/${companyId}/brands/${brandId}/categories/${categoryId}/projects/${projectId}/status`,
        { status: "po_pending" }
      );

      toast.success(`Moved to PO Pending stage`);
      await reloadProjects();
      setSelectedSubModule?.("po-pending");
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update project stage");
    }
  }, [editedProject, onOpenChange, reloadProjects, setSelectedSubModule]);

  const handlePOConfirm = useCallback(() => {
    toast.success("Project advanced to PO Issued stage!");
    setPOTargetDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleColorVariantsSave = useCallback(
    async (savedColorIds: string[]) => {
      try {
        // Fetch updated project data to get the latest color variants
        if (project?._id) {
          const response = await api.get(`/projects/${project._id}`);
          const updatedProject = response.data?.data;

          if (updatedProject) {
            const variantsMap = convertColorVariants(updatedProject);
            setColorVariants(variantsMap);

            if (savedColorIds.length > 0) {
              setActiveColorTab(savedColorIds[0]);
            }
          }
        }
        toast.success("Color variants saved successfully!");
      } catch (error) {
        console.error("Failed to fetch updated color variants:", error);
        toast.error("Failed to load updated color variants");
      }
    },
    [project, convertColorVariants]
  );

  const handleSave = useCallback(async () => {
    if (!editedProject) return;

    if (
      !editedProject.company?._id ||
      !editedProject.brand?._id ||
      !editedProject.category?._id
    ) {
      toast.error("Company, Brand and Category are required");
      return;
    }

    try {
      const fd = new FormData();

      fd.append("company", editedProject.company._id);
      fd.append("brand", editedProject.brand._id);
      fd.append("category", editedProject.category._id);

      if (editedProject.type) fd.append("type", String(editedProject.type._id));
      if (editedProject.country)
        fd.append("country", String(editedProject.country._id));
      if (editedProject.assignPerson)
        fd.append("assignPerson", String(editedProject.assignPerson._id));
      if (editedProject.artName) fd.append("artName", editedProject.artName);
      if (editedProject.color) fd.append("color", editedProject.color);
      if (editedProject.size) fd.append("size", editedProject.size);
      if (editedProject.gender) fd.append("gender", editedProject.gender);
      if (editedProject.priority) fd.append("priority", editedProject.priority);
      if (editedProject.productDesc)
        fd.append("productDesc", editedProject.productDesc);
      if (editedProject.redSealTargetDate)
        fd.append("redSealTargetDate", editedProject.redSealTargetDate);
      if (editedProject.clientApproval)
        fd.append("clientApproval", editedProject.clientApproval);

      // Convert Map to object for form data
      if (colorVariants.size > 0) {
        const colorVariantsObj: Record<string, any> = {};
        colorVariants.forEach((value, key) => {
          colorVariantsObj[key] = value;
        });
        fd.append("colorVariants", JSON.stringify(colorVariantsObj));
      }

      if (editedProject?.nextUpdateDate) {
        fd.append(
          "nextUpdate",
          JSON.stringify({
            date: editedProject.nextUpdateDate,
            note: editedProject?.updateNotes || "",
          })
        );
      }

      if (coverPhoto) {
        if (coverPhoto.startsWith("data:")) {
          const file = dataUrlToFile(coverPhoto, "cover.png");
          fd.append("coverImage", file);
        } else {
          fd.append("keepExistingCover", "true");
        }
      }

      const existingSamples = samples.filter(
        (s) => s && !s.startsWith("data:")
      );
      const newSamplesData = samples.filter((s) => s && s.startsWith("data:"));

      if (existingSamples.length > 0)
        fd.append("keepExistingSamples", JSON.stringify(existingSamples));
      newSamplesData.forEach((d, idx) => {
        const file = dataUrlToFile(d, `sample-${Date.now()}-${idx}.png`);
        fd.append("sampleImages", file);
      });

      const url = `/projects/${editedProject._id}`;

      await api.put(url, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Project updated");
      await reloadProjects();
      setIsEditing(false);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Update failed", err);
      toast.error(err?.response?.data?.message || "Update failed");
    }
  }, [
    editedProject,
    coverPhoto,
    samples,
    colorVariants,
    onOpenChange,
    reloadProjects,
  ]);

  const handleCancelEdit = useCallback(() => {
    if (!project) return;
    setIsEditing(false);
    setEditedProject({ ...project });
    setCoverPhoto(project.coverImage || null);
    setSamples(project.sampleImages || []);
    // Reset color variants to original state
    const variantsMap = convertColorVariants(project);
    setColorVariants(variantsMap);
  }, [project, convertColorVariants]);

  if (!project || !editedProject) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[85vw] !w-[85vw] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
          {/* Sticky Header Section */}
          <div className="sticky top-0 z-50 px-8 py-6 bg-gradient-to-r from-green-50 via-white to-green-50 border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-semibold text-gray-900 mb-2">
                    Green Seal Approval Details
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    View and manage Green Seal approval project details and
                    information
                  </DialogDescription>
                  <div className="flex items-center gap-4">
                    <span className="text-lg text-gray-600">
                      {project.autoCode}
                    </span>
                    <Badge
                      className={`${currentStage.color} text-sm px-3 py-1`}
                    >
                      {currentStage.name}
                    </Badge>
                    <Badge
                      className={`${
                        project.priority === "high"
                          ? "bg-red-500 text-white"
                          : project.priority === "medium"
                          ? "bg-purple-500 text-white"
                          : "bg-green-600 text-white"
                      } text-xs px-2 py-1`}
                    >
                      {project.priority || "N/A"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!isEditing ? (
                  <>
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Project
                    </Button>
                    {nextStage && (
                      <Button
                        onClick={() => setPOTargetDialogOpen(true)}
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Advance to {nextStage.name}
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button onClick={handleCancelEdit} variant="outline">
                      Cancel Edit
                    </Button>
                  </div>
                )}
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                </Button>
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
                    Green Seal Approval Progress
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
                      const isCompleted = currentIndex >= index;
                      const isCurrent = stage.id === editedProject.status;

                      return (
                        <div
                          key={stage.id}
                          className={`text-center p-2 rounded-lg transition-all ${
                            isCurrent
                              ? "bg-green-100 border-2 border-green-400 shadow-md"
                              : isCompleted
                              ? "bg-green-50 border border-green-200"
                              : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 mx-auto mb-1 rounded-full flex items-center justify-center text-xs ${
                              isCurrent
                                ? "bg-green-500 text-white"
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

              {/* Green Seal Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Green Seal Information
                  </h3>
                </div>

                {/* Unified Product Details Section */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Product & Brand Details
                    </h4>
                    <Badge
                      variant="secondary"
                      className="bg-purple-50 text-purple-700 border-purple-200"
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
                            src={coverImageUrl}
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

                    {/* Product Images Gallery */}
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
                            samples.filter((img) => img).length > 0) && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-50 text-blue-700 border-blue-200 text-xs h-5"
                            >
                              {
                                [coverPhoto, ...samples.filter((img) => img)]
                                  .length
                              }
                            </Badge>
                          )}
                        </div>

                        {!isEditing ? (
                          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                            {coverPhoto && (
                              <div className="group relative flex-shrink-0">
                                <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-blue-400 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                                  <img
                                    src={coverImageUrl}
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
                            {samples.map(
                              (image, i) =>
                                image && (
                                  <div
                                    key={i}
                                    className="group relative flex-shrink-0"
                                  >
                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 hover:border-blue-300 cursor-pointer bg-white">
                                      <img
                                        src={sampleImageUrls[i]}
                                        alt={`Image ${i + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                      />
                                    </div>
                                  </div>
                                )
                            )}
                            {!coverPhoto &&
                              samples.filter((img) => img).length === 0 && (
                                <div className="w-full text-center py-4">
                                  <ImageIcon className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                                  <p className="text-xs text-gray-500">
                                    No images
                                  </p>
                                </div>
                              )}
                          </div>
                        ) : (
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            <div className="flex-shrink-0">
                              <input
                                ref={coverRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={handleCoverUpload}
                              />
                              <div
                                className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer"
                                onClick={() => coverRef.current?.click()}
                              >
                                {coverPhoto ? (
                                  <img
                                    src={coverImageUrl}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Upload className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                            </div>

                            {samples.map((s, idx) => (
                              <div key={idx} className="flex-shrink-0 relative">
                                <input
                                  ref={(el) => {
                                    sampleRefs.current[idx] = el;
                                  }}
                                  type="file"
                                  accept="image/*"
                                  hidden
                                  onChange={(e) => handleSampleUpload(e, idx)}
                                />
                                <div
                                  className="w-20 h-20 border rounded-lg overflow-hidden cursor-pointer"
                                  onClick={() =>
                                    sampleRefs.current[idx]?.click()
                                  }
                                >
                                  {s ? (
                                    <img
                                      src={sampleImageUrls[idx]}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Upload className="w-5 h-5 text-gray-400 mx-auto mt-6" />
                                  )}
                                </div>
                                {s && (
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1/2 right-1/2 h-6 w-6"
                                    onClick={() => removeSample(idx)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            ))}

                            <div
                              className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer"
                              onClick={addSampleSlot}
                            >
                              <Plus className="w-5 h-5 text-blue-600" />
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
                      <div className="mt-1 font-mono font-bold text-gray-900">
                        {project.autoCode}
                      </div>
                    </div>

                    <div>
                      <Label>Company</Label>
                      {isEditing ? (
                        <Select
                          value={editedProject.company?._id}
                          onValueChange={(v) =>
                            setEditedProject({
                              ...editedProject,
                              company:
                                companies.find((c) => c._id === v) || null,
                              brand: null,
                              category: null,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {companies?.map((c) => (
                              <SelectItem key={c._id} value={c._id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {project.company?.name}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Brand</Label>
                      {isEditing ? (
                        <Select
                          value={editedProject.brand?._id}
                          onValueChange={(v) =>
                            setEditedProject({
                              ...editedProject,
                              brand: brands.find((b) => b._id === v) || null,
                              category: null,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {brands?.map((b) => (
                              <SelectItem key={b._id} value={b._id}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {project.brand?.name}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Category</Label>
                      {isEditing ? (
                        <Select
                          value={editedProject.category?._id}
                          onValueChange={(v) =>
                            setEditedProject({
                              ...editedProject,
                              category:
                                categories.find((c) => c._id === v) || null,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c._id} value={c._id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {project.category?.name}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Type</Label>
                      {isEditing ? (
                        <Select
                          value={editedProject.type?._id}
                          onValueChange={(v) =>
                            setEditedProject({
                              ...editedProject,
                              type: types.find((t) => t._id === v) || null,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {types.map((t) => (
                              <SelectItem key={t._id} value={t._id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {project.type?.name}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Gender</Label>
                      {isEditing ? (
                        <Select
                          value={editedProject.gender || ""}
                          onValueChange={(v) =>
                            setEditedProject({ ...editedProject, gender: v })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Unisex">Unisex</SelectItem>
                            <SelectItem value="Men">Men</SelectItem>
                            <SelectItem value="Women">Women</SelectItem>
                            <SelectItem value="Kids">Kids</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {project.gender || "N/A"}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Art</Label>
                      {isEditing ? (
                        <Input
                          value={editedProject.artName || ""}
                          onChange={(e) =>
                            setEditedProject({
                              ...editedProject,
                              artName: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {project.artName || "N/A"}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Colour</Label>
                      {isEditing ? (
                        <Input
                          value={editedProject.color || ""}
                          onChange={(e) =>
                            setEditedProject({
                              ...editedProject,
                              color: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {project.color || "N/A"}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Country</Label>
                      {isEditing ? (
                        <Select
                          value={editedProject.country?._id}
                          onValueChange={(v) =>
                            setEditedProject({
                              ...editedProject,
                              country:
                                countries.find((c) => c._id === v) || null,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((c) => (
                              <SelectItem key={c._id} value={c._id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {project.country?.name}
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
                          value={
                            editedProject.createdAt
                              ? editedProject.createdAt.split("T")[0]
                              : ""
                          }
                          readOnly
                          className="mt-1 bg-gray-50"
                        />
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {formatDateDisplay(project.createdAt)}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Target Date</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={
                            editedProject.redSealTargetDate
                              ? editedProject.redSealTargetDate.split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            setEditedProject({
                              ...editedProject,
                              redSealTargetDate: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {formatDateDisplay(project.redSealTargetDate)}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Priority</Label>
                      {isEditing ? (
                        <Select
                          value={editedProject.priority || "low"}
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
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1">
                          <Badge
                            className={
                              project.priority === "high"
                                ? "bg-red-500 text-white"
                                : project.priority === "medium"
                                ? "bg-amber-500 text-white"
                                : "bg-green-500 text-white"
                            }
                          >
                            {project.priority || "N/A"}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Assigned To</Label>
                      {isEditing ? (
                        <Select
                          value={editedProject.assignPerson?._id}
                          onValueChange={(v) =>
                            setEditedProject({
                              ...editedProject,
                              assignPerson:
                                assignPersons.find((p) => p._id === v) || null,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {assignPersons?.map((p) => (
                              <SelectItem key={p._id} value={p._id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {project.assignPerson?.name || "N/A"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Materials & Components Analysis */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-md">
                      <Calculator className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Materials & Components Analysis
                    </h3>
                  </div>
                </div>

                {/* Color Variant Tabs */}
                {colorVariantTabs.length > 0 && (
                  <div className="flex items-center justify-between gap-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      {colorVariantTabs.map((colorId) => (
                        <button
                          key={colorId}
                          onClick={() => setActiveColorTab(colorId)}
                          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
                            activeColorTab === colorId
                              ? "border-green-600 text-gray-900"
                              : "border-transparent text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full border border-gray-300 bg-gray-200"></div>
                          <span>
                            {getColorName(colorId)}
                            {colorId === project.color && (
                              <span className="ml-1.5 text-xs text-gray-500">
                                (Default)
                              </span>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={() => setColorMaterialsDialogOpen(true)}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 mr-2 mb-2"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Color Variant
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Components Analysis */}
                  <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-purple-900 mb-4">
                      Components Used
                    </h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-600 bg-purple-50 p-2 rounded">
                        <div>COMPONENT</div>
                        <div>DESCRIPTION</div>
                        <div>CONSUMPTION</div>
                      </div>

                      <div className="space-y-2">
                        {getActiveColorComponents().map((component, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200"
                          >
                            <div className="font-medium">{component.name}</div>
                            <div className="text-gray-600">
                              {component.desc}
                            </div>
                            <div className="text-gray-600">
                              {component.consumption}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-purple-50 p-3 rounded-lg mt-3">
                        <div className="text-sm text-purple-800">
                          <strong>Total Components:</strong>{" "}
                          {getActiveColorComponents().length} different
                          components used in production
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Materials Analysis */}
                  <div className="bg-white border-2 border-teal-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-teal-900 mb-4">
                      Materials Used
                    </h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-600 bg-teal-50 p-2 rounded">
                        <div>MATERIAL</div>
                        <div>DESCRIPTION</div>
                        <div>CONSUMPTION</div>
                      </div>

                      <div className="space-y-2">
                        {getActiveColorMaterials().map((material, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-gray-200"
                          >
                            <div className="font-medium">{material.name}</div>
                            <div className="text-gray-600">{material.desc}</div>
                            <div className="text-gray-600">
                              {material.consumption}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-teal-50 p-3 rounded-lg mt-3">
                        <div className="text-sm text-teal-800">
                          <strong>Total Materials:</strong>{" "}
                          {getActiveColorMaterials().length} different materials
                          used in production
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Analysis Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-teal-50 border-2 border-purple-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Production Analysis Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                      <div className="text-sm text-purple-600 font-medium">
                        Total Components
                      </div>
                      <div className="text-2xl font-bold text-purple-800">
                        {getActiveColorComponents().length}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Active components
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-teal-200">
                      <div className="text-sm text-teal-600 font-medium">
                        Total Materials
                      </div>
                      <div className="text-2xl font-bold text-teal-800">
                        {getActiveColorMaterials().length}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Raw materials
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-600 font-medium">
                        Production Complexity
                      </div>
                      <div className="text-2xl font-bold text-gray-800">
                        {getActiveColorComponents().length +
                          getActiveColorMaterials().length <
                        15
                          ? "Low"
                          : getActiveColorComponents().length +
                              getActiveColorMaterials().length <
                            20
                          ? "Medium"
                          : "High"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getActiveColorComponents().length +
                          getActiveColorMaterials().length}{" "}
                        total items
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-700">
                      <strong>Green Seal Analysis:</strong> Product uses
                      standard footwear materials and components. Upper
                      materials include Rexine and Skinfit lining with EVA
                      padding. Components feature standard hardware like velcro,
                      buckles, and heat transfer elements. Material consumption
                      rates are optimized for efficient production.
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
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
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
                            value={editedProject.productDesc || ""}
                            onChange={(e) =>
                              setEditedProject({
                                ...editedProject,
                                productDesc: e.target.value,
                              })
                            }
                            placeholder="Enter client feedback and remarks..."
                            className="min-h-[100px] resize-none text-sm"
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 min-h-[100px] border border-gray-200">
                            {project.productDesc || "No remarks provided"}
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
                              value={editedProject.clientApproval || "pending"}
                              onValueChange={(value) =>
                                setEditedProject({
                                  ...editedProject,
                                  clientApproval: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ok">Approved</SelectItem>
                                <SelectItem value="update_req">
                                  Update Required
                                </SelectItem>
                                <SelectItem value="pending">
                                  Pending Review
                                </SelectItem>
                                <SelectItem value="review_req">
                                  Review Required
                                </SelectItem>
                                <SelectItem value="rejected">
                                  Rejected
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant="secondary"
                              className={
                                project.clientApproval === "ok"
                                  ? "bg-green-100 text-green-700"
                                  : project.clientApproval === "update_req"
                                  ? "bg-orange-100 text-orange-700"
                                  : project.clientApproval === "pending"
                                  ? "bg-blue-100 text-blue-700"
                                  : project.clientApproval === "review_req"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-red-100 text-red-700"
                              }
                            >
                              {project.clientApproval === "ok"
                                ? "✓ Approved"
                                : project.clientApproval === "update_req"
                                ? "⚠ Update Required"
                                : project.clientApproval === "pending"
                                ? "⏳ Pending Review"
                                : project.clientApproval === "review_req"
                                ? "📝 Review Required"
                                : "❌ Rejected"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Next Update Schedule Card */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
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
                            value={
                              editedProject.nextUpdateDate
                                ? editedProject.nextUpdateDate.split("T")[0]
                                : ""
                            }
                            onChange={(e) =>
                              setEditedProject({
                                ...editedProject,
                                nextUpdateDate: e.target.value,
                              })
                            }
                            className="w-full"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-sm border border-gray-200">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-900">
                              {project?.nextUpdate && project?.nextUpdate?.date
                                ? formatDateDisplay(project?.nextUpdate?.date)
                                : "Not scheduled"}
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
                            className="min-h-[80px] resize-none text-sm"
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 min-h-[80px] border border-gray-200">
                            {project?.nextUpdate && project?.nextUpdate?.note
                              ? project.nextUpdate.note
                              : "No update notes"}
                          </div>
                        )}
                      </div>

                      {/* Days Until Next Update */}
                      {(() => {
                        const nextDate =
                          editedProject?.nextUpdateDate ||
                          project?.nextUpdate?.date;

                        if (!nextDate) {
                          return (
                            <div className="p-4 border rounded-lg bg-gray-50 text-center text-gray-600">
                              <Clock className="w-4 h-4 mx-auto mb-1" />
                              Not Scheduled
                            </div>
                          );
                        }

                        const today = new Date();
                        const updateDate = new Date(nextDate);
                        const diffDays = Math.ceil(
                          (updateDate.getTime() - today.getTime()) /
                            (1000 * 60 * 60 * 24)
                        );
                        const isOverdue = diffDays < 0;

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
                              {diffDays === 0
                                ? "Due Today"
                                : diffDays > 0
                                ? `${diffDays} days`
                                : "Overdue"}
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
                              "Schedule follow-up meeting for next week to review updated Green Seal sample",
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
                          const twoWeeks = new Date();
                          twoWeeks.setDate(twoWeeks.getDate() + 14);
                          setEditedProject({
                            ...editedProject,
                            nextUpdateDate: twoWeeks
                              .toISOString()
                              .split("T")[0],
                            updateNotes:
                              "Allow 2 weeks for Green Seal modifications and client review",
                          });
                        }}
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Schedule 2 Weeks
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditedProject({
                            ...editedProject,
                            clientApproval: "update_req",
                            updateNotes:
                              "Client requested modifications - awaiting revised Green Seal sample",
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
                            clientApproval: "ok",
                            updateNotes:
                              "Green Seal approved by client - ready to proceed to PO Pending stage",
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

      {/* PO Target Dialog */}
      <POTargetDialog
        open={poTargetDialogOpen}
        onOpenChange={setPOTargetDialogOpen}
        project={project}
        onConfirm={handlePOConfirm}
      />

      {/* Color Materials Dialog */}
      <ColorMaterialsDialog
        open={colorMaterialsDialogOpen}
        onOpenChange={setColorMaterialsDialogOpen}
        project={project}
        colors={[]} // You can pass actual colors array if available
        onSave={handleColorVariantsSave}
      />
    </>
  );
}
