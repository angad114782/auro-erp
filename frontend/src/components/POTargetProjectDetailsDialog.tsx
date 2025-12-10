// src/components/POPendingProjectDetailsDialog.tsx
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle,
  Edit2,
  Factory,
  ImageIcon,
  IndianRupee,
  MessageSquare,
  Package,
  Plus,
  Save,
  ShoppingCart,
  Target,
  Trash2,
  Upload,
  Workflow,
  X,
  Download,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import api from "../lib/api";
import { workflowStages } from "./GreenSealProjectDetailsDialog";
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
import { Separator } from "./ui/separator";
import { generateProjectPDF } from "../utils/pdfDownload";

function dataUrlToFile(dataUrl: string, filename: string) {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

function formatDateDisplay(d?: string | null) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("en-IN");
  } catch {
    return String(d);
  }
}

function getFullImageUrl(path?: string | null) {
  if (!path) return "";
  try {
    if (path.startsWith("http")) return path;
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
    return `${BACKEND_URL}/${path}`;
  } catch {
    return String(path);
  }
}

function getStage(status?: string | null) {
  const s = workflowStages.find((w) => w.id === status) || workflowStages[2];
  return s;
}

interface MasterItem {
  _id: string;
  name: string;
}

interface NextUpdate {
  date?: string;
  note?: string;
}

interface ProductDevelopment {
  _id?: string;
  autoCode?: string;
  company?: MasterItem | null;
  brand?: MasterItem | null;
  category?: MasterItem | null;
  type?: MasterItem | null;
  country?: MasterItem | null;
  assignPerson?: MasterItem | null;
  artName?: string;
  color?: string;
  colorHex?: string;
  gender?: string;
  size?: string;
  priority?: string;
  productDesc?: string;
  status?: string;
  redSealTargetDate?: string;
  coverImage?: string | null;
  sampleImages?: string[];
  updateNotes?: string;
  nextUpdateDate?: string;
  clientApproval?: string;
  clientFinalCost?: string;
  createdAt?: string;
  updatedAt?: string;
  components?: any[];
  materials?: any[];
  orderQuantity?: number;
  unitPrice?: number;
  poNumber?: string;
  poStatus?: string;
  poValue?: number;
  nextUpdate?: NextUpdate;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: ProductDevelopment | null;
  companies: MasterItem[];
  brands: MasterItem[];
  categories: MasterItem[];
  types: MasterItem[];
  countries: MasterItem[];
  assignPersons: MasterItem[];
  setBrands?: (b: MasterItem[]) => void;
  setCategories?: (c: MasterItem[]) => void;
  reloadProjects?: () => Promise<void>;
  setSelectedSubModule?: (s: string) => void;
}

export function POPendingProjectDetailsDialog(props: Props) {
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

  useEffect(() => {
    if (!project || !open) return;
    setEditedProject({ ...project });
    setCoverPhoto(project.coverImage || null);
    setAdditionalImages(project.sampleImages ? [...project.sampleImages] : []);
    setDynamicImages([]);
    setIsEditing(false);
    setPONumber(project.poNumber || "");
  }, [project, open]);

  const currentStage = useMemo(
    () => getStage(editedProject?.status || project?.status),
    [editedProject?.status, project?.status]
  );

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
  const removeDynamicImage = useCallback(
    (index: number) =>
      setDynamicImages((prev) => prev.filter((_, i) => i !== index)),
    []
  );
  const handleAddImageSlot = useCallback(
    () => setDynamicImages((s) => [...s, ""]),
    []
  );

  const handleSaveImages = useCallback(() => {
    if (!editedProject) return;
    toast.success("Images saved (local logic kept).");
  }, [editedProject]);

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
      const existingAdditional = additionalImages.filter(
        (s) => s && !s.startsWith("data:")
      );
      const newAdditional = additionalImages.filter(
        (s) => s && s.startsWith("data:")
      );
      if (existingAdditional.length > 0)
        fd.append("keepExistingSamples", JSON.stringify(existingAdditional));
      newAdditional.forEach((d, idx) =>
        fd.append(
          "sampleImages",
          dataUrlToFile(d, `sample-${Date.now()}-${idx}.png`)
        )
      );
      dynamicImages.forEach((d, idx) => {
        if (d && d.startsWith("data:"))
          fd.append(
            "sampleImages",
            dataUrlToFile(d, `dynamic-${Date.now()}-${idx}.png`)
          );
      });
      if ((editedProject as any).poNumber)
        fd.append("poNumber", (editedProject as any).poNumber);
      if ((editedProject as any).poStatus)
        fd.append("poStatus", (editedProject as any).poStatus);
      if ((editedProject as any).orderQuantity != null)
        fd.append(
          "orderQuantity",
          String((editedProject as any).orderQuantity)
        );
      if ((editedProject as any).poValue != null)
        fd.append("poValue", String((editedProject as any).poValue));
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

  const handleAddPONumber = useCallback(() => {
    if (!editedProject) return;
    const value = poNumber.trim();
    if (!value) return toast.error("Please enter a valid PO number.");
    setEditedProject({ ...editedProject, poNumber: value });
    (async () => {
      try {
        await api.patch(`/projects/${editedProject._id}/po`, {
          poNumber: value,
          orderQuantity: editedProject.orderQuantity ?? null,
          unitPrice: editedProject.unitPrice ?? null,
        });
        toast.success("PO Number added successfully!");
        await reloadProjects?.();
      } catch (error) {
        console.error(error);
        toast.error("Failed to save PO Number");
      }
    })();
    setIsAddingPO(false);
  }, [editedProject, poNumber, reloadProjects]);

  const handleEditPONumber = useCallback(() => {
    if (!editedProject) return;
    if (!poNumber.trim()) return toast.error("Please enter a valid PO number.");
    const updatedProject = { ...editedProject, poNumber: poNumber.trim() };
    setEditedProject(updatedProject);
    (async () => {
      try {
        await api.patch(`/projects/${updatedProject._id}/po`, {
          poNumber: updatedProject.poNumber,
        });
        toast.success("PO Number updated successfully!");
        await reloadProjects?.();
      } catch (error) {
        console.error(error);
        toast.error("Failed to update PO Number");
      }
    })();
    setPONumber("");
    setIsAddingPO(false);
  }, [editedProject, poNumber, reloadProjects]);

  const handleAdvanceToPOApproved = useCallback(async () => {
    if (!editedProject?.poNumber)
      return toast.error("PO Number is required to advance");
    try {
      await api.patch(`/projects/${editedProject._id}/po`, {
        poNumber: editedProject.poNumber,
        orderQuantity: editedProject.orderQuantity,
        unitPrice: editedProject.unitPrice,
      });
      toast.success("Project advanced to PO Approved!");
      await reloadProjects?.();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to advance project");
    }
  }, [editedProject, reloadProjects, onOpenChange]);

  const handleApproveAndAdvanceToProduction = useCallback(async () => {
    if (!editedProject?.poNumber)
      return toast.error("PO Number is required to advance to Production");
    try {
      await api.patch(
        `/companies/${editedProject.company?._id}/brands/${editedProject.brand?._id}/categories/${editedProject.category?._id}/projects/${editedProject._id}/status`,
        { status: "production" }
      );
      toast.success("Project approved and advanced to Production!");
      await reloadProjects?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to advance project to production");
    }
  }, [editedProject, onOpenChange, reloadProjects]);

  const isPOPending = useCallback(() => {
    return (
      !(project as any)?.poNumber &&
      ((project as any)?.poStatus === "Pending" || !(project as any)?.poStatus)
    );
  }, [project]);

  const isPOApproved = useCallback(() => {
    return (
      (project as any)?.poNumber && (project as any)?.poStatus === "Approved"
    );
  }, [project]);

  // PDF Download Handler
  const handleDownloadPDF = async () => {
    try {
      if (!project) return;

      // Fetch cost data for PDF
      let costData = null;
      try {
        const [summaryRes, materialsRes, componentsRes] = await Promise.all([
          api.get(`/projects/${project._id}/costs`),
          api.get(`/projects/${project._id}/costs/material`),
          api.get(`/projects/${project._id}/costs/component`),
        ]);

        costData = {
          material: materialsRes.data.rows || [],
          component: componentsRes.data.rows || [],
          summary: summaryRes.data.hasCostData ? summaryRes.data.summary : null,
        };
      } catch (error) {
        console.warn("Could not load cost data for PDF:", error);
        costData = {
          material: project.materials || [],
          component: project.components || [],
          summary: null,
        };
      }

      // Prepare PO details
      const poDetails = {
        poNumber:
          (project as any)?.poNumber ||
          project.poNumber ||
          "" ||
          project?.po?.poNumber,
        orderQuantity:
          (project as any)?.orderQuantity ||
          project.orderQuantity ||
          0 ||
          project?.po?.orderQuantity,
        unitPrice:
          (project as any)?.unitPrice ||
          project.unitPrice ||
          0 ||
          project?.po?.unitPrice,
        totalAmount:
          (project as any)?.poValue ||
          project.poValue ||
          0 ||
          project?.po?.totalAmount,
        deliveryDate: project.redSealTargetDate || "",
        paymentTerms: "Standard 30 days",
      };

      const pdfProject = {
        ...project,
        po: poDetails,
        costData: {
          material: costData.material,
          component: costData.component,
          summary: costData.summary || {
            materialTotal:
              costData.material.reduce(
                (sum: number, m: any) => sum + (m.cost || 0),
                0
              ) || 0,
            componentTotal:
              costData.component.reduce(
                (sum: number, c: any) => sum + (c.cost || 0),
                0
              ) || 0,
            tentativeCost: (project as any)?.poValue || 0,
          },
        },
        // Ensure images are full URLs
        coverImage: project.coverImage
          ? getFullImageUrl(project.coverImage)
          : null,
        sampleImages: (project.sampleImages || []).map(getFullImageUrl),
      };
      console.log(pdfProject, "pdfProject");
      await generateProjectPDF({
        project: pdfProject,
        costData: pdfProject.costData,
        activeTab: "po_pending",
        colorVariants: {}, // No color variants for PO Pending
      });

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  // Responsive grid classes
  const responsiveGridClass = isMobile
    ? "grid grid-cols-2 gap-3"
    : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-3 gap-y-3";

  // Responsive image grid
  const imageGridClass = isMobile
    ? "grid grid-cols-4 gap-2"
    : "flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1";

  // Responsive materials grid
  const materialsGridClass = isMobile
    ? "grid grid-cols-1 gap-4"
    : "grid grid-cols-1 lg:grid-cols-2 gap-6";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`!max-w-[95vw] !w-[95vw] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col ${
          isMobile ? "!max-w-full !w-full mx-0 my-0" : ""
        }`}
      >
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-50 px-4 md:px-8 py-4 md:py-6 bg-linear-to-r from-orange-50 via-white to-orange-50 border-b border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl md:text-3xl font-semibold text-gray-900 mb-1 md:mb-2">
                  PO Pending Details
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm md:text-lg text-gray-600">
                    {project?.autoCode}
                  </span>
                  <Badge className={`${currentStage.color} text-xs px-2 py-1`}>
                    {currentStage.name}
                  </Badge>
                  <Badge
                    className={`${
                      project?.priority === "high"
                        ? "bg-red-500 text-white"
                        : project?.priority === "medium"
                        ? "bg-purple-500 text-white"
                        : "bg-green-600 text-white"
                    } text-xs px-2 py-1`}
                  >
                    {project?.priority}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* PDF Download Button */}
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="bg-white hover:bg-gray-50 text-xs md:text-sm border-2"
                size={isMobile ? "sm" : "default"}
              >
                <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                {isMobile ? "PDF" : "Download PDF"}
              </Button>

              <Button
                onClick={handleAdvanceToPOApproved}
                disabled={!editedProject?.poNumber}
                className={`bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-xs md:text-sm ${
                  !editedProject?.poNumber
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                size={isMobile ? "sm" : "default"}
              >
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                {isMobile ? "To Approved" : "Advance to PO Approved"}
              </Button>

              <Button
                onClick={handleApproveAndAdvanceToProduction}
                disabled={!editedProject?.poNumber}
                className={`bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-xs md:text-sm ${
                  !editedProject?.poNumber
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                size={isMobile ? "sm" : "default"}
              >
                <Factory className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                {isMobile ? "To Production" : "Approve & To Production"}
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
                  PO Target Progress
                </h3>
              </div>
              <div className="bg-white border border-gray-200 md:border-2 rounded-xl p-4 md:p-6">
                <div className="mb-3 md:mb-5">
                  <div className="flex justify-between items-center mb-1 md:mb-2">
                    <span className="text-xs md:text-sm font-medium text-gray-600">
                      Overall Progress
                    </span>
                    <span className="text-xs md:text-sm font-bold text-gray-900">
                      {currentStage.progress}%
                    </span>
                  </div>
                  <Progress
                    value={currentStage.progress}
                    className="h-1 md:h-2"
                  />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 md:gap-2">
                  {workflowStages.map((stage, index) => {
                    const isCompleted =
                      workflowStages.findIndex((s) => s.id === "PO Pending") >=
                      index;
                    const isCurrent = stage.id === "PO Pending";
                    return (
                      <div
                        key={stage.id}
                        className={`text-center p-1 md:p-2 rounded-lg transition-all ${
                          isCurrent
                            ? "bg-orange-100 border border-orange-400 md:border-2 shadow-sm md:shadow-md"
                            : isCompleted
                            ? "bg-green-50 border border-green-200"
                            : "bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 md:w-6 md:h-6 mx-auto mb-0.5 md:mb-1 rounded-full flex items-center justify-center text-xs ${
                            isCurrent
                              ? "bg-orange-500 text-white"
                              : isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-2 h-2 md:w-3 md:h-3" />
                          ) : (
                            index + 1
                          )}
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

            {/* PO Target Information */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3 md:gap-5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  PO Target Information
                </h3>
              </div>

              {/* Unified Product Details Section */}
              <div className="bg-white border border-gray-200 md:border-2 rounded-xl p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-5">
                  <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-2 sm:mb-0">
                    Product & Brand Details
                  </h4>
                  <Badge
                    variant="secondary"
                    className="bg-orange-50 text-orange-700 border-orange-200 text-xs"
                  >
                    PO Pending
                  </Badge>
                </div>

                {/* Horizontal Layout for desktop, stacked for mobile */}
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
                            coverPhoto || (project as any)?.coverImage
                          )}
                          alt={(project as any)?.autoCode || ""}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs font-medium text-gray-900 text-center truncate">
                        {(project as any)?.autoCode ||
                          (project as any)?.productCode}
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
                      {(project as any)?.autoCode ||
                        (project as any)?.productCode}
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
                        {project?.company?.name || "N/A"}
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
                        {project?.brand?.name || "N/A"}
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
                        {project?.category?.name || "N/A"}
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
                        {project?.type?.name || "N/A"}
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
                        {project?.gender || "N/A"}
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
                        {(project as any)?.artName || "N/A"}
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
                            backgroundColor:
                              (project as any)?.colorHex || "#cccccc",
                          }}
                        ></div>
                        <span className="text-gray-900 text-sm">
                          {(project as any)?.color || "N/A"}
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
                        {project?.country?.name || "N/A"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm">Status</Label>
                    <div className="mt-1">
                      <Badge className={`${currentStage.color} text-xs`}>
                        {currentStage.name}
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
                        {formatDateDisplay((project as any)?.createdAt)}
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
                            ...editedProject!,
                            redSealTargetDate: e.target.value,
                          } as ProductDevelopment)
                        }
                        className="mt-1 h-8 md:h-10 text-sm"
                      />
                    ) : (
                      <div className="mt-1 text-gray-900 text-sm">
                        {formatDateDisplay((project as any)?.redSealTargetDate)}
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
                            ...editedProject!,
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
                            (project as any)?.priority === "high"
                              ? "bg-red-500 text-white text-xs"
                              : (project as any)?.priority === "medium"
                              ? "bg-amber-500 text-white text-xs"
                              : "bg-green-500 text-white text-xs"
                          }
                        >
                          {(project as any)?.priority || "N/A"}
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
                            ...editedProject!,
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
                        {project?.assignPerson?.name || "N/A"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Materials & Components Analysis */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3 md:gap-5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-md">
                  <Calculator className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  Materials & Components Analysis
                </h3>
              </div>

              <div className={materialsGridClass}>
                {/* Components Analysis */}
                <div className="bg-white border border-purple-200 md:border-2 rounded-xl p-4 md:p-6">
                  <h4 className="text-base md:text-lg font-semibold text-purple-900 mb-3 md:mb-4">
                    Components Used
                  </h4>
                  <div className="space-y-2 md:space-y-3">
                    <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs font-medium text-gray-600 bg-purple-50 p-2 rounded">
                      <div>COMPONENT</div>
                      <div>DESCRIPTION</div>
                      <div>CONSUMPTION</div>
                    </div>

                    <div className="space-y-1 md:space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
                      {(
                        (editedProject && (editedProject as any).components) ||
                        (project && (project as any).components) ||
                        []
                      ).length > 0 ? (
                        (
                          (editedProject &&
                            (editedProject as any).components) ||
                          (project && (project as any).components) ||
                          []
                        ).map((component: any, idx: number) => (
                          <div
                            key={idx}
                            className="grid grid-cols-3 gap-1 md:gap-2 text-xs md:text-sm py-1 md:py-2 border-b border-gray-200"
                          >
                            <div className="font-medium truncate">
                              {component.name}
                            </div>
                            <div className="text-gray-600 truncate">
                              {component.desc || "-"}
                            </div>
                            <div className="text-gray-600 truncate">
                              {component.consumption || "-"}
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs md:text-sm py-1 md:py-2 border-b border-gray-200">
                            <div className="font-medium">Foam</div>
                            <div className="text-gray-600">-</div>
                            <div className="text-gray-600">7.5grm</div>
                          </div>
                          <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs md:text-sm py-1 md:py-2 border-b border-gray-200">
                            <div className="font-medium">Velcro</div>
                            <div className="text-gray-600">75mm</div>
                            <div className="text-gray-600">1.25 pair</div>
                          </div>
                          {/* Add more rows as needed */}
                        </>
                      )}
                    </div>

                    <div className="bg-purple-50 p-2 md:p-3 rounded-lg mt-2 md:mt-3">
                      <div className="text-xs md:text-sm text-purple-800">
                        <strong>Total Components:</strong>{" "}
                        {(
                          (editedProject &&
                            (editedProject as any).components) ||
                          (project && (project as any).components) ||
                          []
                        ).length || 9}{" "}
                        different components
                      </div>
                    </div>
                  </div>
                </div>

                {/* Materials Analysis */}
                <div className="bg-white border border-teal-200 md:border-2 rounded-xl p-4 md:p-6">
                  <h4 className="text-base md:text-lg font-semibold text-teal-900 mb-3 md:mb-4">
                    Materials Used
                  </h4>
                  <div className="space-y-2 md:space-y-3">
                    <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs font-medium text-gray-600 bg-teal-50 p-2 rounded">
                      <div>MATERIAL</div>
                      <div>DESCRIPTION</div>
                      <div>CONSUMPTION</div>
                    </div>

                    <div className="space-y-1 md:space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
                      {(
                        (editedProject && (editedProject as any).materials) ||
                        (project && (project as any).materials) ||
                        []
                      ).length > 0 ? (
                        (
                          (editedProject && (editedProject as any).materials) ||
                          (project && (project as any).materials) ||
                          []
                        ).map((material: any, idx: number) => (
                          <div
                            key={idx}
                            className="grid grid-cols-3 gap-1 md:gap-2 text-xs md:text-sm py-1 md:py-2 border-b border-gray-200"
                          >
                            <div className="font-medium truncate">
                              {material.name}
                            </div>
                            <div className="text-gray-600 truncate">
                              {material.desc || "-"}
                            </div>
                            <div className="text-gray-600 truncate">
                              {material.consumption || "-"}
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs md:text-sm py-1 md:py-2 border-b border-gray-200">
                            <div className="font-medium">Upper</div>
                            <div className="text-gray-600">Rexine</div>
                            <div className="text-gray-600">26 pairs/mtr</div>
                          </div>
                          <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs md:text-sm py-1 md:py-2 border-b border-gray-200">
                            <div className="font-medium">Lining</div>
                            <div className="text-gray-600">Skinfit</div>
                            <div className="text-gray-600">25 pair @ 155/-</div>
                          </div>
                          {/* Add more rows as needed */}
                        </>
                      )}
                    </div>

                    <div className="bg-teal-50 p-2 md:p-3 rounded-lg mt-2 md:mt-3">
                      <div className="text-xs md:text-sm text-teal-800">
                        <strong>Total Materials:</strong>{" "}
                        {(
                          (editedProject && (editedProject as any).materials) ||
                          (project && (project as any).materials) ||
                          []
                        ).length || 9}{" "}
                        different materials
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Analysis Summary */}
              <div className="bg-linear-to-r from-purple-50 to-teal-50 border border-purple-200 md:border-2 rounded-xl p-4 md:p-6">
                <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                  Production Analysis Summary
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                  <div className="text-center p-3 md:p-4 bg-white rounded-lg border border-purple-200">
                    <div className="text-xs md:text-sm text-purple-600 font-medium">
                      Total Components
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-purple-800">
                      {(
                        (editedProject && (editedProject as any).components) ||
                        (project && (project as any).components) ||
                        []
                      ).length || 9}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 md:mt-1">
                      Active components
                    </div>
                  </div>
                  <div className="text-center p-3 md:p-4 bg-white rounded-lg border border-teal-200">
                    <div className="text-xs md:text-sm text-teal-600 font-medium">
                      Total Materials
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-teal-800">
                      {(
                        (editedProject && (editedProject as any).materials) ||
                        (project && (project as any).materials) ||
                        []
                      ).length || 9}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 md:mt-1">
                      Raw materials
                    </div>
                  </div>
                  <div className="text-center p-3 md:p-4 bg-white rounded-lg border border-gray-200">
                    <div className="text-xs md:text-sm text-gray-600 font-medium">
                      Production Complexity
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-gray-800">
                      {(project && (project as any).productionComplexity) ||
                        "Medium"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 md:mt-1">
                      {(project && (project as any).totalItems) ||
                        "18 total items"}
                    </div>
                  </div>
                </div>
                <div className="mt-3 md:mt-4 p-2 md:p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="text-xs md:text-sm text-gray-700">
                    <strong>PO Target Analysis:</strong>{" "}
                    {(project && (project as any).poAnalysis) ||
                      "Product ready for production order with standardized materials and components."}
                  </div>
                </div>
              </div>
            </div>

            {/* PO Number Management Section - For Pending Projects Only */}
            {isPOPending() && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-3 md:gap-5">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
                    <Package className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                    Add PO Number
                  </h3>
                </div>

                <div className="bg-linear-to-br from-orange-50 to-orange-100 border border-orange-300 md:border-2 rounded-xl p-4 md:p-8 shadow-lg">
                  <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                    <div className="w-8 h-8 md:w-12 md:h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                      {(editedProject as any)?.poNumber ? (
                        <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-white" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 md:w-6 md:h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-base md:text-xl font-semibold text-orange-900 mb-1 md:mb-2">
                        {(editedProject as any)?.poNumber
                          ? "PO Number Added - Buttons Activated"
                          : "PO Number Required to Proceed"}
                      </h4>
                      <p className="text-xs md:text-sm text-orange-800">
                        {(editedProject as any)?.poNumber
                          ? "PO Number has been saved. The advance buttons at the top are now active."
                          : "Enter the Purchase Order number below to unlock the advance buttons."}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 md:p-6 border border-orange-200 md:border-2 shadow-md">
                    <div className="space-y-2 md:space-y-3">
                      <Label className="text-sm md:text-base font-semibold text-gray-800 flex items-center gap-1 md:gap-2">
                        <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 text-orange-600" />
                        Purchase Order Number
                      </Label>

                      <div className="flex flex-col sm:flex-row gap-2 md:gap-3 items-start">
                        <div className="flex-1">
                          <Input
                            value={
                              poNumber || (editedProject as any)?.poNumber || ""
                            }
                            onChange={(e) => setPONumber(e.target.value)}
                            placeholder="Enter PO number (e.g., PO-2024-001)"
                            className="h-10 md:h-12 text-sm md:text-base border border-gray-300 md:border-2 focus:border-orange-500 focus:ring-orange-500"
                          />
                          <p className="text-xs text-gray-600 mt-1 md:mt-2 flex items-center gap-1">
                            {(editedProject as any)?.poNumber ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                <span className="text-green-700 font-medium">
                                  Saved: {(editedProject as any).poNumber}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                Enter the official purchase order number
                              </>
                            )}
                          </p>
                        </div>

                        <Button
                          onClick={handleAddPONumber}
                          disabled={!poNumber.trim()}
                          className="h-10 md:h-12 px-4 md:px-6 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold shadow-lg whitespace-nowrap w-full sm:w-auto"
                          size={isMobile ? "sm" : "default"}
                        >
                          <Save className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                          {(editedProject as any)?.poNumber
                            ? "Update PO Number"
                            : poNumber.trim()
                            ? "Save PO Number"
                            : "Enter to Continue"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PO Number Added - Ready to Advance Section */}
            {(project as any)?.poNumber && !isPOApproved() && (
              <div className="space-y-4 md:space-y-6">
                <div className="bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 md:border-2 rounded-xl p-4 md:p-6">
                  <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                    <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="text-base md:text-lg font-semibold text-green-800 mb-1 md:mb-2">
                        PO Number Added Successfully!
                      </h4>
                      <p className="text-xs md:text-sm text-green-700 mb-2 md:mb-3">
                        PO Number{" "}
                        <span className="font-mono font-bold">
                          {(project as any)?.poNumber}
                        </span>{" "}
                        has been added.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mt-3 md:mt-4">
                    <div className="bg-white p-3 md:p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                        <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                        <span className="text-xs md:text-sm font-semibold text-green-800">
                          Option 1
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        <strong>Advance to PO Approved:</strong> Move project to
                        PO Approved section
                      </p>
                    </div>
                    <div className="bg-white p-3 md:p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                        <Factory className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                        <span className="text-xs md:text-sm font-semibold text-blue-800">
                          Option 2
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        <strong>Approve & Advance to Production:</strong> Skip
                        PO Approved and go directly to Production
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PO Number Display & Edit Section - For Approved Projects Only */}
            {isPOApproved() && (
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
                        This project has been approved and has an assigned PO
                        number.
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
                                {(project as any).poNumber || "PO-2024-001"}
                              </Badge>
                              <span className="text-xs md:text-sm text-gray-600">
                                Approved PO Number
                              </span>
                            </div>
                            <Button
                              onClick={() => {
                                setIsAddingPO(true);
                                setPONumber((project as any).poNumber || "");
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
                              className="mt-1 h-10 md:h-12"
                            />
                            <p className="text-xs text-gray-500">
                              Update the purchase order number
                            </p>
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
                                  setPONumber("");
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
            )}

            {/* Client Feedback & Updates */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3 md:gap-5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
                  <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  Client Feedback & Updates
                </h3>
              </div>

              <div className="bg-white border border-gray-200 md:border-2 rounded-xl p-4 md:p-6">
                <div className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <Label className="text-xs md:text-sm font-medium text-gray-600">
                        Client Feedback Status
                      </Label>
                      <div className="mt-1 md:mt-2">
                        <Badge
                          className={
                            (project as any)?.clientApproval === "ok"
                              ? "bg-green-100 text-green-800 text-xs px-2 py-1 md:px-3 md:py-2"
                              : (project as any)?.clientApproval ===
                                "update_req"
                              ? "bg-orange-100 text-orange-800 text-xs px-2 py-1 md:px-3 md:py-2"
                              : (project as any)?.clientApproval === "pending"
                              ? "bg-blue-100 text-blue-800 text-xs px-2 py-1 md:px-3 md:py-2"
                              : "bg-orange-100 text-orange-800 text-xs px-2 py-1 md:px-3 md:py-2"
                          }
                        >
                          {(project as any)?.clientApproval === "ok"
                            ? "✅ Client Approved"
                            : (project as any)?.clientApproval === "update_req"
                            ? "⚠ Update Required"
                            : (project as any)?.clientApproval === "pending"
                            ? "📋 Ready for PO"
                            : "⏳ Awaiting Approval"}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs md:text-sm font-medium text-gray-600">
                        Next Action Date
                      </Label>
                      <div className="mt-1 md:mt-2 text-sm md:text-base text-gray-900">
                        {formatDateDisplay(
                          (project as any)?.nextUpdate?.date ||
                            (project as any)?.nextDate ||
                            ""
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-600 mb-2 md:mb-3 block">
                      PO Target Summary
                    </Label>
                    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 text-xs md:text-sm">
                        <div>
                          <span className="font-medium text-gray-600">
                            Product:
                          </span>
                          <div className="text-gray-900 truncate">
                            {(project as any)?.artName ||
                              (project as any)?.artColour ||
                              ""}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Quantity:
                          </span>
                          <div className="text-gray-900">
                            {(project as any)?.po?.orderQuantity != null
                              ? Number(
                                  (project as any)?.po?.orderQuantity
                                ).toLocaleString("en-IN")
                              : (editedProject as any)?.orderQuantity != null
                              ? Number(
                                  (editedProject as any)?.orderQuantity
                                ).toLocaleString("en-IN")
                              : "0"}{" "}
                            units
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Total Value:
                          </span>
                          <div className="text-gray-900 flex items-center">
                            <IndianRupee className="w-2 h-2 md:w-3 md:h-3 mr-1" />
                            {(project as any)?.po?.totalAmount != null
                              ? Number(
                                  (project as any)?.po?.totalAmount
                                ).toLocaleString("en-IN")
                              : (editedProject as any)?.poValue != null
                              ? Number(
                                  (editedProject as any)?.poValue
                                ).toLocaleString("en-IN")
                              : "0"}
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
  );
}
