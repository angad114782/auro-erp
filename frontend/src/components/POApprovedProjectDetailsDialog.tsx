// src/components/POApprovedProjectDetailsDialog.tsx
import {
  CheckCircle,
  Edit2,
  Factory,
  ImageIcon,
  IndianRupee,
  Plus,
  Save,
  ShoppingCart,
  Target,
  Trash2,
  Upload,
  Workflow,
  X,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { toast } from "sonner";
import api from "../lib/api";
import { workflowStages } from "./GreenSealProjectDetailsDialog";
import {
  dataUrlToFile,
  getFullImageUrl,
  formatDateDisplay,
  getStage,
} from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type ProductDevelopment = {
  _id?: string;
  autoCode?: string;
  company?: { _id?: string; name?: string };
  brand?: { _id?: string; name?: string };
  category?: { _id?: string; name?: string };
  type?: { _id?: string; name?: string };
  country?: { _id?: string; name?: string };
  assignPerson?: { _id?: string; name?: string };
  artName?: string;
  color?: string;
  colorHex?: string;
  size?: string;
  priority?: string;
  productDesc?: string;
  status?: string;
  createdAt?: string;
  redSealTargetDate?: string;
  coverImage?: string | null;
  sampleImages?: string[];
  po?: {
    poNumber?: string;
    orderQuantity?: number;
    unitPrice?: number;
    totalAmount?: number;
  };
  poNumber?: string;
  orderQuantity?: number;
  unitPrice?: number;
  poTarget?: string;
  nextUpdate?: { date?: string; note?: string };
  productionComplexity?: string;
  totalItems?: string;
  components?: any[];
  materials?: any[];
  poValue?: number;
  [k: string]: any;
};

interface POApprovedProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  brands?: any[];
  categories?: any[];
  types?: any[];
  countries?: any[];
  assignPersons?: any[];
  companies?: any[];
  setBrands?: (brands: any[]) => void;
  setCategories?: (categories: any[]) => void;
  reloadProjects?: () => Promise<void>;
}

export function POApprovedProjectDetailsDialog({
  open,
  onOpenChange,
  project,
  brands = [],
  categories = [],
  types = [],
  countries = [],
  assignPersons = [],
  companies = [],
  setBrands,
  setCategories,
  reloadProjects,
}: POApprovedProjectDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<ProductDevelopment | null>(
    null
  );
  const [poNumber, setPONumber] = useState("");
  const [isAddingPO, setIsAddingPO] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [dynamicImages, setDynamicImages] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const additionalInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const dynamicInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initialize local edit state
  useEffect(() => {
    if (!project || !open) return;
    setEditedProject({ ...project } as ProductDevelopment);
    setCoverPhoto(project.coverImage || null);
    setAdditionalImages(project.sampleImages ? [...project.sampleImages] : []);
    setDynamicImages([]);
    setIsEditing(false);
    setPONumber(project.po?.poNumber || "");
  }, [project, open]);

  const currentStage = useMemo(
    () => getStage(editedProject?.status || project?.status),
    [editedProject?.status, project?.status]
  );

  // Fetch brands when company changes
  useEffect(() => {
    if (!isEditing || !editedProject?.company?._id) {
      if (isEditing) setBrands && setBrands([]);
      return;
    }
    const companyId = editedProject.company._id;
    let cancelled = false;
    api
      .get("/brands", { params: { company: companyId } })
      .then((res) => {
        if (cancelled) return;
        const arr = res.data?.items || res.data?.data || res.data || [];
        setBrands && setBrands(arr);
      })
      .catch(() => !cancelled && setBrands && setBrands([]));
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
      if (isEditing) setCategories && setCategories([]);
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
        setCategories && setCategories(arr);
      })
      .catch(() => !cancelled && setCategories && setCategories([]));
    return () => {
      cancelled = true;
    };
  }, [
    editedProject?.company?._id,
    editedProject?.brand?._id,
    isEditing,
    setCategories,
  ]);

  // Image handlers
  const handleCoverPhotoUpload = useCallback(
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

  const handleAdditionalImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be < 5MB");
        return;
      }
      const r = new FileReader();
      r.onloadend = () => {
        setAdditionalImages((prev) => {
          const arr = [...prev];
          arr[index] = r.result as string;
          return arr;
        });
      };
      r.readAsDataURL(file);
    },
    []
  );

  const handleDynamicImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be < 5MB");
        return;
      }
      const r = new FileReader();
      r.onloadend = () => {
        setDynamicImages((prev) => {
          const arr = [...prev];
          arr[index] = r.result as string;
          return arr;
        });
      };
      r.readAsDataURL(file);
    },
    []
  );

  const removeCoverPhoto = useCallback(() => setCoverPhoto(null), []);
  const removeAdditionalImage = useCallback((index: number) => {
    setAdditionalImages((prev) => {
      const arr = [...prev];
      arr[index] = "";
      return arr;
    });
  }, []);
  const removeDynamicImage = useCallback((index: number) => {
    setDynamicImages((prev) => prev.filter((_, i) => i !== index));
  }, []);
  const handleAddImageSlot = useCallback(
    () => setDynamicImages((s) => [...s, ""]),
    []
  );

  const handleSaveImages = useCallback(() => {
    if (!editedProject) return;
    toast.success("Images saved (local logic kept).");
  }, [editedProject]);

  // Save product details
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
      if (editedProject.size) fd.append("size", editedProject.size || "");
      if (editedProject.gender) fd.append("gender", editedProject.gender);
      if (editedProject.priority) fd.append("priority", editedProject.priority);
      if (editedProject.productDesc)
        fd.append("productDesc", editedProject.productDesc);
      if (editedProject.createdAt)
        fd.append("createdAt", editedProject.createdAt);
      if (editedProject.redSealTargetDate)
        fd.append("redSealTargetDate", editedProject.redSealTargetDate);
      if (editedProject.clientApproval)
        fd.append("clientApproval", editedProject.clientApproval);
      if (editedProject?.nextUpdate?.date) {
        fd.append(
          "nextUpdate",
          JSON.stringify({
            date: editedProject.nextUpdate.date,
            note: editedProject.nextUpdate.note || "",
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
      const existingAdditional = additionalImages.filter(
        (s) => s && !s.startsWith("data:")
      );
      const newAdditional = additionalImages.filter(
        (s) => s && s.startsWith("data:")
      );
      if (existingAdditional.length > 0) {
        fd.append("keepExistingSamples", JSON.stringify(existingAdditional));
      }
      newAdditional.forEach((d, idx) => {
        const file = dataUrlToFile(d, `sample-${Date.now()}-${idx}.png`);
        fd.append("sampleImages", file);
      });
      dynamicImages.forEach((d, idx) => {
        if (d && d.startsWith("data:")) {
          const file = dataUrlToFile(d, `dynamic-${Date.now()}-${idx}.png`);
          fd.append("sampleImages", file);
        }
      });
      if (editedProject.po?.poNumber) {
        fd.append("poNumber", editedProject.po.poNumber);
      }
      const url = `/projects/${editedProject._id}`;
      await api.put(url, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Project updated");
      await reloadProjects?.();
      setIsEditing(false);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Update failed", err);
      toast.error(err?.response?.data?.message || "Update failed");
    }
  }, [
    editedProject,
    coverPhoto,
    additionalImages,
    dynamicImages,
    onOpenChange,
    reloadProjects,
  ]);

  // PO number edit handler
  const handleEditPONumber = useCallback(async () => {
    if (!editedProject) return;
    const value = poNumber.trim();
    if (!value) {
      toast.error("Please enter a valid PO number.");
      return;
    }
    try {
      const res = await api.patch(`/projects/${editedProject._id}/po`, {
        poNumber: value,
      });
      const updatedPo =
        res.data?.data?.po ?? res.data?.po ?? res.data?.data ?? null;
      setEditedProject((prev) =>
        prev
          ? {
              ...prev,
              po: {
                ...(prev.po || {}),
                ...(updatedPo || { poNumber: value }),
                poNumber:
                  (updatedPo && (updatedPo.poNumber || updatedPo)) || value,
              },
            }
          : prev
      );
      toast.success("PO Number updated!");
      setIsAddingPO(false);
      setPONumber("");
      await reloadProjects?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update PO Number");
    }
  }, [editedProject, poNumber, reloadProjects]);

  const handleAdvanceToProduction = useCallback(async () => {
    if (!editedProject) return;
    try {
      const initialPlan = {
        startDate: editedProject.createdAt
          ? new Date(editedProject.createdAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        targetCompletionDate: editedProject.redSealTargetDate
          ? new Date(editedProject.redSealTargetDate)
              .toISOString()
              .split("T")[0]
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
        quantity: editedProject.po?.orderQuantity || 0,
        notes:
          editedProject.productDesc ||
          editedProject.artName ||
          "Production from PO Approved",
      };
      const response = await api.post(
        `/projects/${editedProject._id}/move-to-production`,
        {
          initialPlan,
          force: false,
        }
      );
      if (response.data?.data?.production) {
        toast.success("Project moved to production successfully!");
        onOpenChange(false);
        setTimeout(() => {
          reloadProjects?.();
        }, 300);
      } else {
        toast.error("Failed to create production record");
      }
    } catch (error: any) {
      console.error("Move to production error:", error);
      const message =
        error?.response?.data?.message ||
        "Failed to advance to production. Ensure PO is approved.";
      toast.error(message);
    }
  }, [editedProject, onOpenChange, reloadProjects]);

  if (!project) return null;

  // Responsive grid classes
  const responsiveGridClass = isMobile
    ? "grid grid-cols-2 gap-3"
    : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-3 gap-y-3";

  // Responsive image grid
  const imageGridClass = isMobile
    ? "grid grid-cols-4 gap-2"
    : "flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`!max-w-[95vw] !w-[95vw] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col ${
          isMobile ? "!max-w-full !w-full mx-0 my-0" : ""
        }`}
      >
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-50 px-4 md:px-8 py-4 md:py-6 bg-linear-to-r from-emerald-50 via-white to-emerald-50 border-b border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl md:text-3xl font-semibold text-gray-900 mb-1 md:mb-2">
                  PO Approved Details
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm md:text-lg text-gray-600">
                    {project.autoCode}
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800 px-2 py-1 text-xs">
                    PO Approved
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
                    {project.priority}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleAdvanceToProduction}
                className="bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-xs md:text-sm"
                size={isMobile ? "sm" : "default"}
              >
                <Factory className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                {isMobile ? "To Production" : "Advance to Production"}
              </Button>
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-xs md:text-sm"
                  size={isMobile ? "sm" : "default"}
                >
                  <Edit2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  {isMobile ? "Edit" : "Edit Project"}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    className="bg-green-500 hover:bg-green-600 text-xs"
                    size="sm"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedProject({ ...project });
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}
              <button
                onClick={() => onOpenChange(false)}
                type="button"
                className="h-8 w-8 md:h-10 md:w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center border-0 bg-transparent transition-colors"
              >
                <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-4 md:px-8 py-4 md:py-8 space-y-6 md:space-y-10">
            {/* Approval Progress */}
            <div className="space-y-3 md:space-y-5">
              <div className="flex items-center gap-3 md:gap-5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                  <Workflow className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  PO Approval Progress
                </h3>
              </div>
              <div className="bg-white border border-gray-200 md:border-2 rounded-xl p-4 md:p-6">
                <div className="mb-3 md:mb-5">
                  <div className="flex justify-between items-center mb-1 md:mb-2">
                    <span className="text-xs md:text-sm font-medium text-gray-600">
                      Overall Progress
                    </span>
                    <span className="text-xs md:text-sm font-bold text-gray-900">
                      100%
                    </span>
                  </div>
                  <Progress value={100} className="h-1 md:h-2" />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 md:gap-2">
                  {workflowStages.map((stage) => {
                    const isCurrent = stage.id === "PO Approved";
                    return (
                      <div
                        key={stage.id}
                        className={`text-center p-1 md:p-2 rounded-lg transition-all ${
                          isCurrent
                            ? "bg-emerald-100 border border-emerald-400 md:border-2 shadow-sm md:shadow-md"
                            : "bg-green-50 border border-green-200"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 md:w-6 md:h-6 mx-auto mb-0.5 md:mb-1 rounded-full flex items-center justify-center text-xs ${
                            isCurrent
                              ? "bg-emerald-500 text-white"
                              : "bg-green-500 text-white"
                          }`}
                        >
                          <CheckCircle className="w-2 h-2 md:w-3 md:h-3" />
                        </div>
                        <div className="text-xs font-medium text-gray-700 truncate">
                          {isMobile
                            ? stage.shortName || stage.name
                            : stage.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Product Basic Details Section */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3 md:gap-5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  Product Information
                </h3>
              </div>
              <div className="bg-white border border-gray-200 md:border-2 rounded-xl p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-5">
                  <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-2 sm:mb-0">
                    Product & Brand Details
                  </h4>
                  <Badge
                    variant="secondary"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                  >
                    PO Approved
                  </Badge>
                </div>

                {/* Horizontal Layout: Preview + Images for desktop, stacked for mobile */}
                <div className="flex flex-col lg:flex-row gap-4 mb-4 md:mb-5">
                  {/* Product Preview */}
                  <div className={`${isMobile ? "w-full" : "shrink-0 w-44"}`}>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 h-full">
                      <Label className="text-xs font-medium text-gray-600 mb-2 block">
                        Preview
                      </Label>
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mx-auto mb-2">
                        <img
                          src={getFullImageUrl(
                            coverPhoto || project.coverImage
                          )}
                          alt={project.autoCode}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs font-medium text-gray-900 text-center truncate">
                        {project.autoCode}
                      </div>
                      <div className="text-xs text-gray-500 text-center mt-0.5">
                        Sample
                      </div>
                    </div>
                  </div>

                  {/* Product Images Gallery */}
                  <div className="flex-1 min-w-0">
                    <div className="p-3 bg-linear-to-br from-gray-50 to-gray-100/50 rounded-lg border border-gray-200/80 shadow-sm h-full">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-100 rounded-md flex items-center justify-center">
                            <ImageIcon className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-600" />
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
                            className="bg-blue-50 text-blue-700 border-blue-200 text-xs h-4 md:h-5"
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
                        <div className={imageGridClass}>
                          {coverPhoto && (
                            <div className="group relative shrink-0">
                              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 border-blue-400 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                                <img
                                  src={getFullImageUrl(coverPhoto)}
                                  alt="Cover"
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                              </div>
                            </div>
                          )}
                          {additionalImages
                            .filter((img) => img)
                            .map((image, i) => (
                              <div key={i} className="group relative shrink-0">
                                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 hover:border-blue-300 cursor-pointer bg-white">
                                  <img
                                    src={getFullImageUrl(image)}
                                    alt={`Image ${i + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                  />
                                </div>
                              </div>
                            ))}
                          {dynamicImages.map((image, i) => (
                            <div
                              key={`dynamic-${i}`}
                              className="group relative shrink-0"
                            >
                              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 hover:border-blue-300 cursor-pointer bg-white">
                                <img
                                  src={getFullImageUrl(image)}
                                  alt={`Image ${i + 1}`}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                              </div>
                            </div>
                          ))}
                          {!coverPhoto &&
                            additionalImages.filter((img) => img).length ===
                              0 &&
                            dynamicImages.length === 0 && (
                              <div className="w-full text-center py-3 md:py-4">
                                <ImageIcon className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 text-gray-400" />
                                <p className="text-xs text-gray-500">
                                  No images
                                </p>
                              </div>
                            )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className={imageGridClass}>
                            <div className="shrink-0">
                              <input
                                ref={coverInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleCoverPhotoUpload}
                              />
                              {coverPhoto ? (
                                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 border-blue-400 shadow-md group">
                                  <img
                                    src={getFullImageUrl(coverPhoto)}
                                    alt="Cover"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={removeCoverPhoto}
                                      className="h-5 w-5 md:h-6 md:w-6 p-0 shadow-lg"
                                    >
                                      <Trash2 className="w-2 h-2 md:w-3 md:h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  onClick={() => coverInputRef.current?.click()}
                                  className="w-16 h-16 md:w-20 md:h-20 border-2 border-dashed border-blue-400 rounded-lg bg-linear-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 transition-all duration-200 cursor-pointer group flex flex-col items-center justify-center shadow-sm hover:shadow-md"
                                >
                                  <ImageIcon className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                                  <span className="text-xs text-blue-700 mt-0.5">
                                    Cover
                                  </span>
                                </div>
                              )}
                            </div>

                            {[0, 1, 2, 3, 4].map((i) => (
                              <div key={i} className="shrink-0">
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
                                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm group">
                                    <img
                                      src={getFullImageUrl(additionalImages[i])}
                                      alt={`Image ${i + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => removeAdditionalImage(i)}
                                        className="h-5 w-5 md:h-6 md:w-6 p-0 shadow-lg"
                                      >
                                        <Trash2 className="w-2 h-2 md:w-3 md:h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() =>
                                      additionalInputRefs.current[i]?.click()
                                    }
                                    className="w-16 h-16 md:w-20 md:h-20 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:bg-gray-50 hover:border-blue-400 transition-all duration-200 cursor-pointer flex items-center justify-center group shadow-sm hover:shadow-md"
                                  >
                                    <Upload className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-blue-500 transition-all duration-200" />
                                  </div>
                                )}
                              </div>
                            ))}

                            {dynamicImages.map((image, i) => (
                              <div key={`dynamic-${i}`} className="shrink-0">
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
                                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm group">
                                    <img
                                      src={getFullImageUrl(image)}
                                      alt={`Image ${i + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => removeDynamicImage(i)}
                                        className="h-5 w-5 md:h-6 md:w-6 p-0 shadow-lg"
                                      >
                                        <Trash2 className="w-2 h-2 md:w-3 md:h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() =>
                                      dynamicInputRefs.current[i]?.click()
                                    }
                                    className="w-16 h-16 md:w-20 md:h-20 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:bg-gray-50 hover:border-blue-400 transition-all duration-200 cursor-pointer flex items-center justify-center group shadow-sm hover:shadow-md"
                                  >
                                    <Upload className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-blue-500 transition-all duration-200" />
                                  </div>
                                )}
                              </div>
                            ))}

                            <div
                              onClick={handleAddImageSlot}
                              className="w-16 h-16 md:w-20 md:h-20 shrink-0 border-2 border-dashed border-blue-400 rounded-lg bg-linear-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center group shadow-sm hover:shadow-md"
                            >
                              <Plus className="w-4 h-4 md:w-5 md:h-5 text-blue-600 group-hover:scale-110 transition-all duration-200" />
                            </div>
                          </div>
                          <div className="flex justify-end pt-2 border-t border-gray-200">
                            <Button
                              onClick={handleSaveImages}
                              className="bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all h-6 md:h-7 text-xs"
                              size="sm"
                            >
                              <Save className="w-2 h-2 md:w-3 md:h-3 mr-1.5" />
                              Save
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* All Fields in Responsive Grid */}
                <div className={responsiveGridClass}>
                  <div>
                    <Label className="text-xs md:text-sm">Product Code</Label>
                    <div className="mt-1 font-mono font-bold text-gray-900 text-sm">
                      {project.autoCode}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm">Company</Label>
                    {isEditing ? (
                      <Select
                        value={editedProject?.company?._id || ""}
                        onValueChange={(v) =>
                          setEditedProject({
                            ...editedProject!,
                            company: companies.find((c) => c._id === v) || null,
                            brand: null,
                            category: null,
                          } as ProductDevelopment)
                        }
                      >
                        <SelectTrigger className="mt-1 h-8 md:h-10">
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
                      <div className="mt-1 text-gray-900 text-sm">
                        {project.company?.name || "N/A"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm">Brand</Label>
                    {isEditing ? (
                      <Select
                        value={editedProject?.brand?._id || ""}
                        onValueChange={(v) =>
                          setEditedProject({
                            ...editedProject!,
                            brand: brands.find((b) => b._id === v) || null,
                            category: null,
                          } as ProductDevelopment)
                        }
                      >
                        <SelectTrigger className="mt-1 h-8 md:h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(brands || []).map((b) => (
                            <SelectItem key={b._id} value={b._id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1 text-gray-900 text-sm">
                        {project.brand?.name || "N/A"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm">Category</Label>
                    {isEditing ? (
                      <Select
                        value={editedProject?.category?._id || ""}
                        onValueChange={(v) =>
                          setEditedProject({
                            ...editedProject!,
                            category:
                              categories.find((c) => c._id === v) || null,
                          } as ProductDevelopment)
                        }
                      >
                        <SelectTrigger className="mt-1 h-8 md:h-10">
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
                      <div className="mt-1 text-gray-900 text-sm">
                        {project.category?.name || "N/A"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm">Type</Label>
                    {isEditing ? (
                      <Select
                        value={editedProject?.type?._id || ""}
                        onValueChange={(v) =>
                          setEditedProject({
                            ...editedProject!,
                            type: types.find((t) => t._id === v) || null,
                          } as ProductDevelopment)
                        }
                      >
                        <SelectTrigger className="mt-1 h-8 md:h-10">
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
                      <div className="mt-1 text-gray-900 text-sm">
                        {project.type?.name || "N/A"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm">Gender</Label>
                    {isEditing ? (
                      <Select
                        value={editedProject?.gender || ""}
                        onValueChange={(v) =>
                          setEditedProject({
                            ...editedProject!,
                            gender: v,
                          } as ProductDevelopment)
                        }
                      >
                        <SelectTrigger className="mt-1 h-8 md:h-10">
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
                      <div className="mt-1 text-gray-900 text-sm">
                        {project.gender || "N/A"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm">Art</Label>
                    {isEditing ? (
                      <Input
                        value={editedProject?.artName || ""}
                        onChange={(e) =>
                          setEditedProject({
                            ...editedProject!,
                            artName: e.target.value,
                          } as ProductDevelopment)
                        }
                        className="mt-1 h-8 md:h-10 text-sm"
                      />
                    ) : (
                      <div className="mt-1 text-gray-900 text-sm">
                        {project.artName || "N/A"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm">Colour</Label>
                    {isEditing ? (
                      <Input
                        value={editedProject?.color || ""}
                        onChange={(e) =>
                          setEditedProject({
                            ...editedProject!,
                            color: e.target.value,
                          } as ProductDevelopment)
                        }
                        className="mt-1 h-8 md:h-10 text-sm"
                      />
                    ) : (
                      <div className="mt-1 flex items-center gap-2">
                        <div
                          className={`w-3 h-3 md:w-4 md:h-4 rounded-full`}
                          style={{
                            backgroundColor: project.colorHex || "#cccccc",
                          }}
                        ></div>
                        <span className="text-gray-900 text-sm">
                          {project.color || "N/A"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm">Country</Label>
                    {isEditing ? (
                      <Select
                        value={editedProject?.country?._id || ""}
                        onValueChange={(v) =>
                          setEditedProject({
                            ...editedProject!,
                            country: countries.find((c) => c._id === v) || null,
                          } as ProductDevelopment)
                        }
                      >
                        <SelectTrigger className="mt-1 h-8 md:h-10">
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
                      <div className="mt-1 text-gray-900 text-sm">
                        {project.country?.name || "N/A"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm">Status</Label>
                    <div className="mt-1">
                      <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                        PO Approved
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm">Start Date</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={
                          editedProject?.createdAt
                            ? (editedProject.createdAt as string).split("T")[0]
                            : ""
                        }
                        readOnly
                        className="mt-1 h-8 md:h-10 text-sm bg-gray-50"
                      />
                    ) : (
                      <div className="mt-1 text-gray-900 text-sm">
                        {formatDateDisplay(project.createdAt)}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm">Target Date</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={
                          editedProject?.redSealTargetDate
                            ? (editedProject.redSealTargetDate as string).split(
                                "T"
                              )[0]
                            : ""
                        }
                        onChange={(e) =>
                          setEditedProject({
                            ...(editedProject || {}),
                            redSealTargetDate: e.target.value,
                          } as ProductDevelopment)
                        }
                        className="mt-1 h-8 md:h-10 text-sm"
                      />
                    ) : (
                      <div className="mt-1 text-gray-900 text-sm">
                        {formatDateDisplay(project.redSealTargetDate)}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm">Priority</Label>
                    {isEditing ? (
                      <Select
                        value={editedProject?.priority || "low"}
                        onValueChange={(value) =>
                          setEditedProject({
                            ...(editedProject || {}),
                            priority: value,
                          } as ProductDevelopment)
                        }
                      >
                        <SelectTrigger className="mt-1 h-8 md:h-10">
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
                              ? "bg-red-500 text-white text-xs"
                              : project.priority === "medium"
                              ? "bg-amber-500 text-white text-xs"
                              : "bg-green-500 text-white text-xs"
                          }
                        >
                          {project.priority || "N/A"}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm">Assigned To</Label>
                    {isEditing ? (
                      <Select
                        value={editedProject?.assignPerson?._id || ""}
                        onValueChange={(v) =>
                          setEditedProject({
                            ...(editedProject || {}),
                            assignPerson:
                              assignPersons.find((p) => p._id === v) || null,
                          } as ProductDevelopment)
                        }
                      >
                        <SelectTrigger className="mt-1 h-8 md:h-10">
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
                      <div className="mt-1 text-gray-900 text-sm">
                        {project.assignPerson?.name || "N/A"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* PO Number Display & Edit Section */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3 md:gap-5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  PO Number Information
                </h3>
              </div>
              <div className="bg-green-50 border border-green-200 md:border-2 rounded-xl p-4 md:p-6">
                <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="text-base md:text-lg font-semibold text-green-800 mb-1 md:mb-2">
                      PO Number Approved
                    </h4>
                    <p className="text-xs md:text-sm text-green-700">
                      This project has an approved PO Number. You can update it
                      anytime.
                    </p>
                  </div>
                </div>
                <div className="mt-4 md:mt-6 p-3 md:p-4 bg-white rounded-lg border border-green-200">
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <Label className="text-xs md:text-sm font-medium text-gray-700">
                        Current PO Number
                      </Label>
                      {!isAddingPO ? (
                        <div className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 gap-2">
                          <div className="flex items-center gap-2 md:gap-3">
                            <Badge className="bg-green-100 text-green-800 px-2 py-1 md:px-3 md:py-1 text-sm md:text-base font-mono">
                              {project?.po?.poNumber || "N/A"}
                            </Badge>
                            <span className="text-xs md:text-sm text-gray-600">
                              Approved PO Number
                            </span>
                          </div>
                          <Button
                            onClick={() => {
                              setIsAddingPO(true);
                              setPONumber(project?.po?.poNumber || "");
                            }}
                            variant="outline"
                            size="sm"
                            className="hover:bg-blue-50 hover:border-blue-300 w-full sm:w-auto"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-1 space-y-2 md:space-y-3">
                          <Input
                            value={poNumber}
                            onChange={(e) => setPONumber(e.target.value)}
                            placeholder="Enter new PO number"
                            className="h-10 md:h-12"
                          />
                          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                            <Button
                              onClick={handleEditPONumber}
                              className="bg-green-500 hover:bg-green-600 w-full sm:w-auto"
                              disabled={!poNumber.trim()}
                              size={isMobile ? "sm" : "default"}
                            >
                              <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                              Update PO Number
                            </Button>
                            <Button
                              onClick={() => {
                                setIsAddingPO(false);
                                setPONumber(project?.po?.poNumber || "");
                              }}
                              variant="outline"
                              className="w-full sm:w-auto"
                              size={isMobile ? "sm" : "default"}
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

            {/* Success Summary Section */}
            <div className="bg-linear-to-r from-emerald-50 to-green-50 border border-emerald-200 md:border-2 rounded-xl p-4 md:p-6">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-emerald-600" />
                <h3 className="text-xl md:text-2xl font-bold text-emerald-900 mb-1 md:mb-2">
                  PO Successfully Approved!
                </h3>
                <p className="text-xs md:text-sm text-emerald-700 mb-3 md:mb-4">
                  This project has completed the PO approval process and is
                  ready for production.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-4 md:mt-6">
                  <div className="bg-white p-3 md:p-4 rounded-lg border border-emerald-200">
                    <div className="text-xs md:text-sm text-emerald-600 font-medium">
                      PO Number
                    </div>
                    <div className="text-lg md:text-xl font-bold text-emerald-800 truncate">
                      {project.po?.poNumber || "PO-2024-001"}
                    </div>
                  </div>
                  <div className="bg-white p-3 md:p-4 rounded-lg border border-emerald-200">
                    <div className="text-xs md:text-sm text-emerald-600 font-medium">
                      Order Quantity
                    </div>
                    <div className="text-lg md:text-xl font-bold text-emerald-800">
                      {project.po?.orderQuantity?.toLocaleString() || "0"}
                    </div>
                  </div>
                  <div className="bg-white p-3 md:p-4 rounded-lg border border-emerald-200">
                    <div className="text-xs md:text-sm text-emerald-600 font-medium">
                      Total PO Value
                    </div>
                    <div className="text-lg md:text-xl font-bold text-emerald-800 flex items-center justify-center">
                      <IndianRupee className="w-3 h-3 md:w-4 md:h-4" />
                      {project.po?.totalAmount?.toLocaleString() || "0"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
