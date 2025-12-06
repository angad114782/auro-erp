// GreenSealProjectDetailsDialog.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  Calendar,
  CheckCircle,
  Clock,
  Edit2,
  Image as ImageIcon,
  MessageSquare,
  Plus,
  Save,
  Shield,
  Target,
  Trash2,
  Upload,
  Workflow,
  X,
  Palette,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
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
import { Textarea } from "./ui/textarea";

import { ColorMaterialsDialog } from "./ColorMaterialsDialog";
import { POTargetDialog } from "./POTargetDialog";

import {
  Project as ProductDevelopment,
  Material,
  Component as CompType,
  ColorVariantData as ColorVariantDataType,
  projectService,
} from "./services/projectService";

import {
  getFullImageUrl,
  dataUrlToFile,
  formatDateDisplay,
  getStage,
} from "../lib/utils";
import api from "../lib/api";
import CostTable from "./CostTable";
import LabourTable from "./LabourTable";
import SummaryTable from "./SummaryTable";
import { generateProjectPDF } from "../utils/pdfDownload";

export type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProductDevelopment | null;
  companies: any[];
  brands: any[];
  categories: any[];
  types: any[];
  countries: any[];
  assignPersons: any[];
  setBrands: (b: any[]) => void;
  setCategories: (c: any[]) => void;
  reloadProjects?: () => Promise<void> | void;
  setSelectedSubModule?: (s: string) => void;
};

export const workflowStages = [
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

  const [costData, setCostData] = useState({
    upper: [],
    component: [],
    material: [],
    packaging: [],
    misc: [],
    labour: { items: [], directTotal: 0 },
    summary: {},
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const [poTargetDialogOpen, setPOTargetDialogOpen] = useState(false);
  const [colorMaterialsDialogOpen, setColorMaterialsDialogOpen] =
    useState(false);

  const [activeColorTab, setActiveColorTab] = useState<string>("");

  // color variants maps
  const [colorVariants, setColorVariants] = useState<
    Map<string, ColorVariantDataType>
  >(new Map());
  const [localColorVariants, setLocalColorVariants] = useState<
    Map<string, ColorVariantDataType>
  >(new Map());

  // images
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [samples, setSamples] = useState<string[]>([]);
  const [sampleFiles, setSampleFiles] = useState<(File | null)[]>([]);

  const coverRef = useRef<HTMLInputElement | null>(null);
  const sampleRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Memoized computed values
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

  const colorVariantTabs = useMemo(() => {
    const keys = Array.from(localColorVariants.keys());
    if (project?.color) {
      const filtered = keys.filter((k) => k !== project.color);
      return [project.color, ...filtered];
    }
    return keys.length > 0 ? keys : [];
  }, [localColorVariants, project?.color]);

  // Initialize dialog on open
  useEffect(() => {
    if (!project || !open) return;

    setEditedProject({
      ...project,
      clientFinalCost: project.clientFinalCost || project.clientFinalCost,
      nextUpdateDate: project?.nextUpdate?.date || project.nextUpdateDate || "",
      updateNotes: project?.nextUpdate?.note || project.updateNotes || "",
    } as ProductDevelopment);

    setCoverPhoto(project.coverImage || null);
    setCoverFile(null);
    setSamples(
      Array.isArray(project.sampleImages) ? [...project.sampleImages] : []
    );
    setSampleFiles(
      Array.isArray(project.sampleImages)
        ? new Array(project.sampleImages.length).fill(null)
        : []
    );

    const variants = convertColorVariants(project);
    setColorVariants(variants);
    setLocalColorVariants(variants);

    setActiveColorTab((prev) => {
      if (prev && variants.has(prev)) return prev;
      if (project.color) return project.color;
      return variants.size > 0 ? Array.from(variants.keys())[0] : "";
    });

    setIsEditing(false);
  }, [project, open]);

  // Fetch brands/categories
  useEffect(() => {
    if (!isEditing || !editedProject?.company?._id) {
      if (isEditing) setBrands([]);
      return;
    }
    let canceled = false;
    const companyId = editedProject.company._id;
    projectService
      .getBrands(companyId)
      .then((arr) => {
        if (canceled) return;
        setBrands(arr);
      })
      .catch(() => !canceled && setBrands([]));
    return () => {
      canceled = true;
    };
  }, [editedProject?.company?._id, isEditing, setBrands]);

  useEffect(() => {
    if (
      !isEditing ||
      !editedProject?.company?._id ||
      !editedProject?.brand?._id
    ) {
      if (isEditing) setCategories([]);
      return;
    }
    let canceled = false;
    const c = editedProject.company._id;
    const b = editedProject.brand._id;
    projectService
      .getCategories(c, b)
      .then((arr) => {
        if (canceled) return;
        setCategories(arr);
      })
      .catch(() => !canceled && setCategories([]));
    return () => {
      canceled = true;
    };
  }, [
    editedProject?.company?._id,
    editedProject?.brand?._id,
    isEditing,
    setCategories,
  ]);

  const handleCoverUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      if (f.size > 5 * 1024 * 1024) {
        toast.error("Image must be < 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPhoto(reader.result as string);
        setCoverFile(f);
      };
      reader.readAsDataURL(f);
    },
    []
  );

  const handleSampleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
      const f = e.target.files?.[0];
      if (!f) return;
      if (f.size > 5 * 1024 * 1024) {
        toast.error("Image must be < 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSamples((prev) => {
          const arr = [...prev];
          arr[idx] = reader.result as string;
          return arr;
        });
        setSampleFiles((prev) => {
          const arr = [...prev];
          arr[idx] = f;
          return arr;
        });
      };
      reader.readAsDataURL(f);
    },
    []
  );

  const addSampleSlot = useCallback(() => {
    setSamples((s) => [...s, ""]);
    setSampleFiles((s) => [...s, null]);
  }, []);

  const removeSample = useCallback((i: number) => {
    setSamples((s) => s.filter((_, idx) => idx !== i));
    setSampleFiles((s) => s.filter((_, idx) => idx !== i));
  }, []);

  // const getActiveColorVariant = useCallback((): ColorVariantDataType | null => {
  //   if (!localColorVariants || localColorVariants.size === 0) return null;
  //   if (!activeColorTab) return null;
  //   return localColorVariants.get(activeColorTab) || null;
  // }, [localColorVariants, activeColorTab]);

  // const getActiveColorMaterials = useCallback((): Material[] => {
  //   const v = getActiveColorVariant();
  //   if (v && Array.isArray(v.materials) && v.materials.length > 0)
  //     return v.materials;
  //   if (project?.color && activeColorTab === project.color)
  //     return DEFAULT_MATERIALS();
  //   return [];
  // }, [getActiveColorVariant, project?.color, activeColorTab]);

  // const getActiveColorComponents = useCallback((): CompType[] => {
  //   const v = getActiveColorVariant();
  //   if (v && Array.isArray(v.components) && v.components.length > 0)
  //     return v.components;
  //   if (project?.color && activeColorTab === project.color)
  //     return DEFAULT_COMPONENTS();
  //   return [];
  // }, [getActiveColorVariant, project?.color, activeColorTab]);

  const shouldShowDefaultData = useCallback(() => {
    return (
      localColorVariants.size === 0 &&
      project?.color &&
      activeColorTab === project.color
    );
  }, [localColorVariants.size, project?.color, activeColorTab]);

  const handleAdvanceToPOPending = useCallback(async () => {
    try {
      if (!editedProject) return;
      await projectService.updateProjectStatus(editedProject._id, "po_pending");
      toast.success("Moved to PO Pending stage");
      if (reloadProjects) await reloadProjects();
      setSelectedSubModule?.("po-pending");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update project stage");
    }
  }, [editedProject, reloadProjects, onOpenChange, setSelectedSubModule]);

  const handlePOConfirm = useCallback(() => {
    toast.success("Project advanced to PO Issued stage!");
    setPOTargetDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleColorVariantsSave = useCallback(
    async (savedColorIds: string[]) => {
      try {
        if (!project?._id) return;
        const updated = await projectService.getProjects();
        const p =
          (await projectService.getProjects()).find(
            (x) => x._id === project._id
          ) || null;
        if (p) {
          setEditedProject({ ...p });
          const vm = convertColorVariants(p);
          setColorVariants(vm);
          setLocalColorVariants(vm);
          if (savedColorIds && savedColorIds.length > 0)
            setActiveColorTab(savedColorIds[0]);
          else if (p.color) setActiveColorTab(p.color);
        }
        if (reloadProjects) await reloadProjects();
        toast.success("Color variants saved successfully!");
      } catch (error) {
        console.error("Failed to refresh color variants:", error);
        toast.error("Failed to load updated color variants");
      }
    },
    [project, reloadProjects]
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

    setIsLoading(true);
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

      if (editedProject.nextUpdateDate) {
        fd.append(
          "nextUpdate",
          JSON.stringify({
            date: editedProject.nextUpdateDate,
            note: editedProject.updateNotes || "",
          })
        );
      }

      if (localColorVariants && localColorVariants.size > 0) {
        const obj: Record<string, any> = {};
        localColorVariants.forEach((val, key) => {
          obj[key] = val;
        });
        fd.append("colorVariants", JSON.stringify(obj));
      }

      if (coverFile) {
        fd.append("coverImage", coverFile);
      } else if (coverPhoto && !coverPhoto.startsWith("data:")) {
        fd.append("keepExistingCover", "true");
      }

      const existingSampleUrls = samples.filter(
        (s) => s && !s.startsWith("data:")
      );
      const newSampleDataUrls = samples.filter(
        (s) => s && s.startsWith("data:")
      );

      if (existingSampleUrls.length > 0) {
        fd.append("keepExistingSamples", JSON.stringify(existingSampleUrls));
      }

      newSampleDataUrls.forEach((d, idx) => {
        const file = dataUrlToFile(d, `sample-${Date.now()}-${idx}.png`);
        fd.append("sampleImages", file);
      });

      await projectService.updateProject(editedProject._id, fd);

      toast.success("Project updated");
      if (reloadProjects) await reloadProjects();
      setIsEditing(false);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Update failed", err);
      toast.error(err?.response?.data?.message || "Update failed");
    } finally {
      setIsLoading(false);
    }
  }, [
    editedProject,
    coverFile,
    coverPhoto,
    samples,
    localColorVariants,
    onOpenChange,
    reloadProjects,
  ]);

  const handleCancelEdit = useCallback(() => {
    if (!project) return;
    setIsEditing(false);
    setEditedProject({ ...project });
    setCoverPhoto(project.coverImage || null);
    setCoverFile(null);
    setSamples(
      Array.isArray(project.sampleImages) ? [...project.sampleImages] : []
    );
    setSampleFiles(
      Array.isArray(project.sampleImages)
        ? new Array(project.sampleImages.length).fill(null)
        : []
    );
    const vm = convertColorVariants(project);
    setColorVariants(vm);
    setLocalColorVariants(vm);
    if (project.color) setActiveColorTab(project.color);
    else {
      const first = vm.size > 0 ? Array.from(vm.keys())[0] : "";
      setActiveColorTab(first);
    }
  }, [project]);

  // Update loadCostData to fetch from color variants
  const loadCostData = async () => {
    if (!project?._id) return;

    try {
      // Check if we have color variants and an active color tab
      if (localColorVariants && localColorVariants.size > 0 && activeColorTab) {
        const variant = localColorVariants.get(activeColorTab);
        if (variant?.costing) {
          setCostData({
            upper: variant.costing.upper || [],
            component: variant.costing.component || [],
            material: variant.costing.material || [],
            packaging: variant.costing.packaging || [],
            misc: variant.costing.misc || [],
            labour: variant.costing.labour || { items: [], directTotal: 0 },
            summary: variant.costing.summary || getEmptySummary(),
          });
          return;
        }
      }

      // Fallback to default API calls
      const [summary, upper, component, material, packaging, misc, labour] =
        await Promise.all([
          api.get(`/projects/${project._id}/costs`),
          api.get(`/projects/${project._id}/costs/upper`),
          api.get(`/projects/${project._id}/costs/component`),
          api.get(`/projects/${project._id}/costs/material`),
          api.get(`/projects/${project._id}/costs/packaging`),
          api.get(`/projects/${project._id}/costs/miscellaneous`),
          api.get(`/projects/${project._id}/costs/labour`),
        ]);

      setCostData({
        upper: upper.data.rows,
        component: component.data.rows,
        material: material.data.rows,
        packaging: packaging.data.rows,
        misc: misc.data.rows,
        labour: labour.data.labour,
        summary: summary.data.summary,
      });
    } catch (error) {
      console.error("Error loading cost data:", error);
      toast.error("Failed to load cost data");
    }
  };

  // Add this helper function
  const getEmptySummary = () => ({
    upperTotal: 0,
    componentTotal: 0,
    materialTotal: 0,
    packagingTotal: 0,
    miscTotal: 0,
    labourTotal: 0,
    additionalCosts: 0,
    profitMargin: 0,
    profitAmount: 0,
    tentativeCost: 0,
  });

  // Update the effect to reload when color tab changes
  useEffect(() => {
    if (open && project?._id) {
      loadCostData();
    }
  }, [open, project?._id, activeColorTab]); // Added activeColorTab dependency

  // Update convertColorVariants to include costing
  function convertColorVariants(projectData: any): Map<string, any> {
    const variantsMap = new Map<string, any>();
    if (!projectData?.colorVariants) return variantsMap;

    const getEmptyCosting = () => ({
      upper: [],
      material: [],
      component: [],
      packaging: [],
      misc: [],
      labour: { items: [], directTotal: 0 },
      summary: getEmptySummary(),
    });

    if (projectData.colorVariants instanceof Map) {
      for (const [k, v] of projectData.colorVariants.entries()) {
        variantsMap.set(k, {
          materials: Array.isArray(v?.materials) ? v.materials : [],
          components: Array.isArray(v?.components) ? v.components : [],
          images: Array.isArray(v?.images) ? v.images : [],
          costing: v?.costing || getEmptyCosting(),
          updatedBy: v?.updatedBy || null,
          updatedAt: v?.updatedAt ? new Date(v.updatedAt) : new Date(),
        });
      }
      return variantsMap;
    }

    for (const [k, v] of Object.entries(projectData.colorVariants || {})) {
      const val: any = v;
      variantsMap.set(k, {
        materials: Array.isArray(val?.materials) ? val.materials : [],
        components: Array.isArray(val?.components) ? val.components : [],
        images: Array.isArray(val?.images) ? val.images : [],
        costing: val?.costing || getEmptyCosting(),
        updatedBy: val?.updatedBy || null,
        updatedAt: val?.updatedAt ? new Date(val.updatedAt) : new Date(),
      });
    }
    return variantsMap;
  }
  // Add this function inside the GreenSealProjectDetailsDialog component

  const handleDownloadPDF = async () => {
    try {
      if (!project) return;

      // Get cost data for the DEFAULT/MAIN color (from API)
      const [
        summaryRes,
        upperRes,
        componentRes,
        materialRes,
        packagingRes,
        miscRes,
        labourRes,
      ] = await Promise.all([
        api.get(`/projects/${project._id}/costs`),
        api.get(`/projects/${project._id}/costs/upper`),
        api.get(`/projects/${project._id}/costs/component`),
        api.get(`/projects/${project._id}/costs/material`),
        api.get(`/projects/${project._id}/costs/packaging`),
        api.get(`/projects/${project._id}/costs/miscellaneous`),
        api.get(`/projects/${project._id}/costs/labour`),
      ]);

      // Prepare DEFAULT cost data
      const defaultCostData = {
        upper: upperRes.data.rows || [],
        component: componentRes.data.rows || [],
        material: materialRes.data.rows || [],
        packaging: packagingRes.data.rows || [],
        miscellaneous: miscRes.data.rows || [],
        labour: labourRes.data.labour || { directTotal: 0, items: [] },
        summary: summaryRes.data.hasCostData ? summaryRes.data.summary : null,
      };

      // Prepare COLOR VARIANTS data from localColorVariants
      const colorVariantsData: Record<string, any> = {};

      // Collect cost data for each color variant from localColorVariants
      for (const colorId of colorVariantTabs) {
        const variant = localColorVariants.get(colorId);
        if (variant?.costing) {
          colorVariantsData[colorId] = {
            color: colorId,
            costing: {
              upper: variant.costing.upper || [],
              component: variant.costing.component || [],
              material: variant.costing.material || [],
              packaging: variant.costing.packaging || [],
              misc: variant.costing.misc || [],
              labour: variant.costing.labour || { directTotal: 0, items: [] },
              summary: variant.costing.summary || getEmptySummary(),
            },
            materials: variant.materials || [],
            components: variant.components || [],
            images: variant.images || [],
          };
        }
      }

      const pdfProject = {
        autoCode: project.autoCode,
        company: { name: project.company?.name || "-" },
        brand: { name: project.brand?.name || "-" },
        category: { name: project.category?.name || "-" },
        type: { name: project.type?.name || "-" },
        gender: project.gender || "-",
        artName: project.artName || "-",
        color: project.color || "-",
        priority: project.priority || "-",
        redSealTargetDate: project.redSealTargetDate || "",
        assignPerson: { name: project.assignPerson?.name || "-" },
        productDesc: project.productDesc || "-",
        clientApproval: project.clientApproval || "-",
        nextUpdate: {
          date: project.nextUpdate?.date || "",
          note: project.nextUpdate?.note || "",
        },
        coverImage: project.coverImage
          ? getFullImageUrl(project.coverImage)
          : null,
        sampleImages: (project.sampleImages || []).map(getFullImageUrl),
        costData: defaultCostData,
      };

      const activeTab = project.status;

      await generateProjectPDF({
        project: pdfProject,
        costData: defaultCostData,
        activeTab,
        colorVariants: colorVariantsData, // Pass actual color variant data
      });

      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("PDF generation failed");
    }
  };
  if (!editedProject || !project) return null;
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={`
            ${
              isMobile
                ? "max-w-[95vw]! w-[95vw]! max-h-[95vh] top-[2.5vh] translate-y-0"
                : "max-w-[85vw]! w-[85vw]! max-h-[90vh]"
            } overflow-hidden p-0 m-0 flex flex-col
          `}
        >
          {/* Header */}
          <div className="sticky top-0 z-50 px-4 md:px-8 py-4 md:py-6 bg-linear-to-r from-green-50 via-white to-green-50 border-b border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                  <Shield className="w-5 h-5 md:w-7 md:h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-1 md:mb-2 truncate">
                    Green Seal Approval Details
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4">
                    <span className="text-sm md:text-lg text-gray-600 truncate">
                      {project.autoCode}
                    </span>
                    <Badge
                      className={`${currentStage.color} text-xs md:text-sm px-2 md:px-3 py-1 truncate`}
                    >
                      {currentStage.name}
                    </Badge>
                    <Badge
                      className={`
                        text-xs px-2 py-1
                        ${
                          project.priority === "high"
                            ? "bg-red-500 text-white"
                            : project.priority === "medium"
                            ? "bg-purple-500 text-white"
                            : "bg-green-600 text-white"
                        }
                      `}
                    >
                      {project.priority || "N/A"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                {/* Add PDF Download Button */}
                <Button
                  onClick={handleDownloadPDF}
                  variant="outline"
                  className="bg-white hover:bg-gray-50 text-xs md:text-sm border-2"
                  size={isMobile ? "sm" : "default"}
                >
                  <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  {isMobile ? "PDF" : "Download PDF"}
                </Button>

                {!isEditing ? (
                  <>
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-xs md:text-sm"
                      size={isMobile ? "sm" : "default"}
                    >
                      <Edit2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                      {isMobile ? "Edit" : "Edit Project"}
                    </Button>
                    {nextStage && !isMobile && (
                      <Button
                        onClick={() => setPOTargetDialogOpen(true)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-xs md:text-sm"
                        size={isMobile ? "sm" : "default"}
                      >
                        <ArrowRight className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                        Advance to {nextStage.name}
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      className="bg-green-500 hover:bg-green-600 text-xs md:text-sm"
                      size={isMobile ? "sm" : "default"}
                    >
                      <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                      {isMobile ? "Save" : "Save Changes"}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      size={isMobile ? "sm" : "default"}
                    >
                      {isMobile ? "Cancel" : "Cancel Edit"}
                    </Button>
                  </div>
                )}

                <Button
                  onClick={() => onOpenChange(false)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 md:h-10 md:w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500 hover:text-gray-700" />
                </Button>
              </div>
            </div>

            {/* Mobile Tabs */}
            {isMobile && (
              <div className="mt-4 border-b border-gray-200">
                <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`pb-2 px-1 text-sm font-medium whitespace-nowrap ${
                      activeTab === "details"
                        ? "border-b-2 border-green-500 text-green-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("timeline")}
                    className={`pb-2 px-1 text-sm font-medium whitespace-nowrap ${
                      activeTab === "timeline"
                        ? "border-b-2 border-green-500 text-green-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Timeline
                  </button>
                  <button
                    onClick={() => setActiveTab("materials")}
                    className={`pb-2 px-1 text-sm font-medium whitespace-nowrap ${
                      activeTab === "materials"
                        ? "border-b-2 border-green-500 text-green-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Materials
                  </button>
                  <button
                    onClick={() => setActiveTab("feedback")}
                    className={`pb-2 px-1 text-sm font-medium whitespace-nowrap ${
                      activeTab === "feedback"
                        ? "border-b-2 border-green-500 text-green-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Feedback
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="px-4 md:px-8 py-4 md:py-8 space-y-8 md:space-y-12">
              {/* Approval Progress - Show only on timeline tab on mobile */}
              {(!isMobile || activeTab === "timeline") && (
                <div className="space-y-4 md:space-y-5">
                  <div className="flex items-center gap-4 md:gap-5">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                      <Workflow className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                      Green Seal Approval Progress
                    </h3>
                  </div>

                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6">
                    <div className="mb-4 md:mb-5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs md:text-sm font-medium text-gray-600">
                          Overall Progress
                        </span>
                        <span className="text-xs md:text-sm font-bold text-gray-900">
                          {currentStage.progress}%
                        </span>
                      </div>
                      <Progress value={currentStage.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-6 gap-1 md:gap-2">
                      {workflowStages.map((stage, index) => {
                        const isCompleted = currentIndex >= index;
                        const isCurrent = stage.id === editedProject.status;
                        return (
                          <div
                            key={stage.id}
                            className={`text-center p-1 md:p-2 rounded-lg transition-all ${
                              isCurrent
                                ? "bg-green-100 border-2 border-green-400 shadow-md"
                                : isCompleted
                                ? "bg-green-50 border border-green-200"
                                : "bg-gray-50 border border-gray-200"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 md:w-6 md:h-6 mx-auto mb-1 rounded-full flex items-center justify-center text-xs ${
                                isCurrent
                                  ? "bg-green-500 text-white"
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
                            <div className="text-[10px] md:text-xs font-medium text-gray-700 truncate">
                              {stage.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Product Info - Show only on details tab on mobile */}
              {(!isMobile || activeTab === "details") && (
                <div className="space-y-4 md:space-y-6">
                  <div className="flex items-center gap-4 md:gap-5">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                      <Target className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                      Green Seal Information
                    </h3>
                  </div>

                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4 md:mb-5">
                      <h4 className="text-base md:text-lg font-semibold text-gray-900">
                        Product & Brand Details
                      </h4>
                      <Badge
                        variant="secondary"
                        className="bg-purple-50 text-purple-700 border-purple-200 text-xs md:text-sm"
                      >
                        {currentStage.name}
                      </Badge>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 mb-4 md:mb-5">
                      <div className="shrink-0 w-full md:w-44">
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 h-full">
                          <Label className="text-xs font-medium text-gray-600 mb-2 block">
                            Preview
                          </Label>
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mx-auto mb-2">
                            <img
                              src={coverImageUrl}
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
                              samples.filter(Boolean).length > 0) && (
                              <Badge
                                variant="secondary"
                                className="bg-blue-50 text-blue-700 border-blue-200 text-xs h-5"
                              >
                                {
                                  [coverPhoto, ...samples.filter(Boolean)]
                                    .length
                                }
                              </Badge>
                            )}
                          </div>

                          {/* Images gallery / upload */}
                          {!isEditing ? (
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                              {coverPhoto && (
                                <div className="group relative shrink-0">
                                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 border-blue-400 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
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
                                      className="group relative shrink-0"
                                    >
                                      <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 hover:border-blue-300 cursor-pointer bg-white">
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
                                    <ImageIcon className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 text-gray-400" />
                                    <p className="text-xs text-gray-500">
                                      No images
                                    </p>
                                  </div>
                                )}
                            </div>
                          ) : (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                              <div className="shrink-0">
                                <input
                                  ref={coverRef}
                                  type="file"
                                  accept="image/*"
                                  hidden
                                  onChange={handleCoverUpload}
                                />
                                <div
                                  className="w-16 h-16 md:w-20 md:h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer"
                                  onClick={() => coverRef.current?.click()}
                                >
                                  {coverPhoto ? (
                                    <img
                                      src={coverImageUrl}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Upload className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                                  )}
                                </div>
                              </div>

                              {samples.map((s, idx) => (
                                <div key={idx} className="shrink-0 relative">
                                  <input
                                    ref={(el) => (sampleRefs.current[idx] = el)}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => handleSampleUpload(e, idx)}
                                  />
                                  <div
                                    className="w-16 h-16 md:w-20 md:h-20 border rounded-lg overflow-hidden cursor-pointer"
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
                                      <Upload className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mx-auto mt-6 md:mt-8" />
                                    )}
                                  </div>
                                  {s && (
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-1/2 right-1/2 h-5 w-5 md:h-6 md:w-6"
                                      onClick={() => removeSample(idx)}
                                    >
                                      <Trash2 className="w-2 h-2 md:w-3 md:h-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}

                              <div
                                className="w-16 h-16 md:w-20 md:h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer"
                                onClick={addSampleSlot}
                              >
                                <Plus className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Fields grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
                      <div>
                        <Label className="text-xs md:text-sm">
                          Product Code
                        </Label>
                        <div className="mt-1 font-mono font-bold text-gray-900 text-sm">
                          {project.autoCode}
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs md:text-sm">Company</Label>
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
                            <SelectTrigger className="mt-1 h-8 md:h-10 text-xs md:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {companies?.map((c) => (
                                <SelectItem
                                  key={c._id}
                                  value={c._id}
                                  className="text-xs md:text-sm"
                                >
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-1 text-sm text-gray-900">
                            {project.company?.name}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs md:text-sm">Brand</Label>
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
                            <SelectTrigger className="mt-1 h-8 md:h-10 text-xs md:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {brands?.map((b) => (
                                <SelectItem
                                  key={b._id}
                                  value={b._id}
                                  className="text-xs md:text-sm"
                                >
                                  {b.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-1 text-sm text-gray-900">
                            {project.brand?.name}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs md:text-sm">Category</Label>
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
                            <SelectTrigger className="mt-1 h-8 md:h-10 text-xs md:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem
                                  key={c._id}
                                  value={c._id}
                                  className="text-xs md:text-sm"
                                >
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-1 text-sm text-gray-900">
                            {project.category?.name}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs md:text-sm">Type</Label>
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
                            <SelectTrigger className="mt-1 h-8 md:h-10 text-xs md:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {types.map((t) => (
                                <SelectItem
                                  key={t._id}
                                  value={t._id}
                                  className="text-xs md:text-sm"
                                >
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-1 text-sm text-gray-900">
                            {project.type?.name}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs md:text-sm">Gender</Label>
                        {isEditing ? (
                          <Select
                            value={editedProject.gender || ""}
                            onValueChange={(v) =>
                              setEditedProject({ ...editedProject, gender: v })
                            }
                          >
                            <SelectTrigger className="mt-1 h-8 md:h-10 text-xs md:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                value="Unisex"
                                className="text-xs md:text-sm"
                              >
                                Unisex
                              </SelectItem>
                              <SelectItem
                                value="Men"
                                className="text-xs md:text-sm"
                              >
                                Men
                              </SelectItem>
                              <SelectItem
                                value="Women"
                                className="text-xs md:text-sm"
                              >
                                Women
                              </SelectItem>
                              <SelectItem
                                value="Kids"
                                className="text-xs md:text-sm"
                              >
                                Kids
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-1 text-sm text-gray-900">
                            {project.gender || "N/A"}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs md:text-sm">Art</Label>
                        {isEditing ? (
                          <Input
                            value={editedProject.artName || ""}
                            onChange={(e) =>
                              setEditedProject({
                                ...editedProject,
                                artName: e.target.value,
                              })
                            }
                            className="mt-1 h-8 md:h-10 text-xs md:text-sm"
                          />
                        ) : (
                          <div className="mt-1 text-sm text-gray-900">
                            {project.artName || "N/A"}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs md:text-sm">Colour</Label>
                        {isEditing ? (
                          <Input
                            value={editedProject.color || ""}
                            onChange={(e) =>
                              setEditedProject({
                                ...editedProject,
                                color: e.target.value,
                              })
                            }
                            className="mt-1 h-8 md:h-10 text-xs md:text-sm"
                          />
                        ) : (
                          <div className="mt-1 text-sm text-gray-900">
                            {project.color || "N/A"}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs md:text-sm">Country</Label>
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
                            <SelectTrigger className="mt-1 h-8 md:h-10 text-xs md:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((c) => (
                                <SelectItem
                                  key={c._id}
                                  value={c._id}
                                  className="text-xs md:text-sm"
                                >
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-1 text-sm text-gray-900">
                            {project.country?.name}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs md:text-sm">Status</Label>
                        <div className="mt-1">
                          <Badge className={currentStage.color}>
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
                              editedProject.createdAt
                                ? editedProject.createdAt.split("T")[0]
                                : ""
                            }
                            readOnly
                            className="mt-1 h-8 md:h-10 text-xs md:text-sm bg-gray-50"
                          />
                        ) : (
                          <div className="mt-1 text-sm text-gray-900">
                            {formatDateDisplay(project.createdAt)}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs md:text-sm">
                          Target Date
                        </Label>
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
                            className="mt-1 h-8 md:h-10 text-xs md:text-sm"
                          />
                        ) : (
                          <div className="mt-1 text-sm text-gray-900">
                            {formatDateDisplay(project.redSealTargetDate)}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs md:text-sm">Priority</Label>
                        {isEditing ? (
                          <Select
                            value={editedProject.priority || "low"}
                            onValueChange={(v) =>
                              setEditedProject({
                                ...editedProject,
                                priority: v,
                              })
                            }
                          >
                            <SelectTrigger className="mt-1 h-8 md:h-10 text-xs md:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                value="low"
                                className="text-xs md:text-sm"
                              >
                                Low
                              </SelectItem>
                              <SelectItem
                                value="medium"
                                className="text-xs md:text-sm"
                              >
                                Medium
                              </SelectItem>
                              <SelectItem
                                value="high"
                                className="text-xs md:text-sm"
                              >
                                High
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-1">
                            <Badge
                              className={`
                                text-xs px-2 py-1
                                ${
                                  project.priority === "high"
                                    ? "bg-red-500 text-white"
                                    : project.priority === "medium"
                                    ? "bg-amber-500 text-white"
                                    : "bg-green-500 text-white"
                                }
                              `}
                            >
                              {project.priority || "N/A"}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs md:text-sm">
                          Assigned To
                        </Label>
                        {isEditing ? (
                          <Select
                            value={editedProject.assignPerson?._id}
                            onValueChange={(v) =>
                              setEditedProject({
                                ...editedProject,
                                assignPerson:
                                  assignPersons.find((p) => p._id === v) ||
                                  null,
                              })
                            }
                          >
                            <SelectTrigger className="mt-1 h-8 md:h-10 text-xs md:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {assignPersons?.map((p) => (
                                <SelectItem
                                  key={p._id}
                                  value={p._id}
                                  className="text-xs md:text-sm"
                                >
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-1 text-sm text-gray-900">
                            {project.assignPerson?.name || "N/A"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Materials & Components Analysis - Show only on materials tab on mobile */}
              {(!isMobile || activeTab === "materials") && (
                <div className="space-y-4 md:space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 md:gap-5">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                        <Calculator className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                        Materials & Components Analysis
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 border-b border-gray-200">
                      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                        {colorVariantTabs.length > 0 ? (
                          colorVariantTabs.map((colorId) => (
                            <button
                              key={colorId}
                              onClick={() => setActiveColorTab(colorId)}
                              className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 border-b-2 transition-colors shrink-0 ${
                                activeColorTab === colorId
                                  ? "border-green-600 text-gray-900"
                                  : "border-transparent text-gray-600 hover:text-gray-900"
                              }`}
                            >
                              <div
                                className="w-3 h-3 md:w-4 md:h-4 rounded-full border border-gray-300"
                                style={{
                                  backgroundColor: (colorId || "")
                                    .toLowerCase()
                                    .includes("#")
                                    ? colorId
                                    : undefined,
                                }}
                              ></div>
                              <span className="text-xs md:text-sm">
                                {colorId}
                                {project?.color &&
                                  colorId === project.color && (
                                    <span className="ml-1 md:ml-1.5 text-xs text-gray-500 hidden md:inline">
                                      (Default)
                                    </span>
                                  )}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2.5 text-gray-500 text-sm">
                            No color variants configured
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => setColorMaterialsDialogOpen(true)}
                        className="bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 mr-2 mb-2 text-xs md:text-sm"
                        size={isMobile ? "sm" : "default"}
                      >
                        <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                        {isMobile ? "Variant" : "Color Variant"}
                      </Button>
                    </div>

                    {colorVariantTabs.length === 0 && project?.color && (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                        <Palette className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">
                          No color variants configured. Using default color.
                        </p>
                        <p className="text-xs md:text-sm mt-1">
                          Click "Color Variant" to add new color options.
                        </p>
                      </div>
                    )}
                  </div>

                  {(colorVariantTabs.length > 0 || shouldShowDefaultData()) &&
                    (() => {
                      // Count how many cost tables have data
                      const costTableCount = [
                        costData.upper,
                        costData.component,
                        costData.material,
                        costData.packaging,
                        costData.misc,
                      ].filter((table) => table.length > 0).length;

                      const hasLabour =
                        costData.labour.items &&
                        costData.labour.items.length > 0;
                      const totalItems = costTableCount + (hasLabour ? 1 : 0);

                      // No data at all
                      if (totalItems === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                            <Calculator className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                            <p className="text-base font-medium text-gray-600">
                              No costing data available
                            </p>
                            <p className="text-sm mt-1 text-gray-500">
                              Add cost details for this color variant
                            </p>
                          </div>
                        );
                      }

                      // If we have 1-3 items total, use single column
                      // If we have 4+ items, use two columns
                      const useTwoColumns = totalItems >= 4;

                      return (
                        <div
                          className={`grid gap-4 md:gap-6 ${
                            useTwoColumns
                              ? "grid-cols-1 lg:grid-cols-2"
                              : "grid-cols-1"
                          }`}
                        >
                          {/* Left Column - Always show cost tables here if they exist */}
                          {costTableCount > 0 && (
                            <div className="space-y-4 md:space-y-6">
                              {costData.upper.length > 0 && (
                                <CostTable
                                  title="Upper Cost"
                                  rows={costData.upper}
                                />
                              )}
                              {costData.component.length > 0 && (
                                <CostTable
                                  title="Component Cost"
                                  rows={costData.component}
                                />
                              )}
                              {costData.material.length > 0 && (
                                <CostTable
                                  title="Material Cost"
                                  rows={costData.material}
                                />
                              )}
                              {costData.packaging.length > 0 && (
                                <CostTable
                                  title="Packaging Cost"
                                  rows={costData.packaging}
                                />
                              )}
                              {costData.misc.length > 0 && (
                                <CostTable
                                  title="Miscellaneous Cost"
                                  rows={costData.misc}
                                />
                              )}
                            </div>
                          )}

                          {/* Right Column - Show labour table */}
                          {hasLabour && (
                            <div className="space-y-4 md:space-y-6">
                              <LabourTable labour={costData.labour} />

                              {/* If labour is alone in right column with no left column content */}
                              {costTableCount === 0 && useTwoColumns && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                  <p className="text-sm text-gray-500">
                                    Add cost tables to see complete analysis
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* If we're using single column but labour should come after cost tables
                          {!useTwoColumns && hasLabour && (
                            <LabourTable labour={costData.labour} />
                          )} */}
                        </div>
                      );
                    })()}
                </div>
              )}

              {/* Client Feedback & Next Update - Show only on feedback tab on mobile */}
              {(!isMobile || activeTab === "feedback") && (
                <div className="space-y-4 md:space-y-6">
                  <div className="flex items-center gap-4 md:gap-5">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                      <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                      Client Feedback & Updates
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6">
                      <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                        Client Feedback
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs md:text-sm font-medium text-gray-600 mb-2 block">
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
                              className="min-h-20 md:min-h-[100px] resize-none text-xs md:text-sm"
                            />
                          ) : (
                            <div className="p-3 bg-gray-50 rounded-lg text-xs md:text-sm text-gray-700 min-h-20 md:min-h-[100px] border border-gray-200">
                              {project.productDesc || "No remarks provided"}
                            </div>
                          )}
                        </div>

                        <div>
                          <Label className="text-xs md:text-sm font-medium text-gray-600 mb-2 block">
                            Client Approval Status
                          </Label>
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <Select
                                value={
                                  editedProject.clientApproval || "pending"
                                }
                                onValueChange={(value) =>
                                  setEditedProject({
                                    ...editedProject,
                                    clientApproval: value,
                                  })
                                }
                              >
                                <SelectTrigger className="w-full h-8 md:h-10 text-xs md:text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem
                                    value="ok"
                                    className="text-xs md:text-sm"
                                  >
                                    Approved
                                  </SelectItem>
                                  <SelectItem
                                    value="update_req"
                                    className="text-xs md:text-sm"
                                  >
                                    Update Required
                                  </SelectItem>
                                  <SelectItem
                                    value="pending"
                                    className="text-xs md:text-sm"
                                  >
                                    Pending Review
                                  </SelectItem>
                                  <SelectItem
                                    value="review_req"
                                    className="text-xs md:text-sm"
                                  >
                                    Review Required
                                  </SelectItem>
                                  <SelectItem
                                    value="rejected"
                                    className="text-xs md:text-sm"
                                  >
                                    Rejected
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge
                                variant="secondary"
                                className={`
                                  text-xs px-2 py-1
                                  ${
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
                                `}
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

                    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6">
                      <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                        Next Update Schedule
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs md:text-sm font-medium text-gray-600 mb-2 block">
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
                              className="w-full h-8 md:h-10 text-xs md:text-sm"
                            />
                          ) : (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-xs md:text-sm border border-gray-200">
                              <Calendar className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                              <span className="text-gray-900">
                                {project?.nextUpdate &&
                                project?.nextUpdate?.date
                                  ? formatDateDisplay(project?.nextUpdate?.date)
                                  : "Not scheduled"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <Label className="text-xs md:text-sm font-medium text-gray-600 mb-2 block">
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
                              className="min-h-16 md:min-h-[80px] resize-none text-xs md:text-sm"
                            />
                          ) : (
                            <div className="p-3 bg-gray-50 rounded-lg text-xs md:text-sm text-gray-700 min-h-16 md:min-h-[80px] border border-gray-200">
                              {project?.nextUpdate && project?.nextUpdate?.note
                                ? project.nextUpdate.note
                                : "No update notes"}
                            </div>
                          )}
                        </div>

                        {(() => {
                          const nextDate =
                            editedProject?.nextUpdateDate ||
                            project?.nextUpdate?.date;
                          if (!nextDate) {
                            return (
                              <div className="p-3 md:p-4 border rounded-lg bg-gray-50 text-center text-gray-600 text-xs md:text-sm">
                                <Clock className="w-3 h-3 md:w-4 md:h-4 mx-auto mb-1" />
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
                              } border rounded-lg p-3 md:p-4`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Clock
                                  className={`w-3 h-3 md:w-4 md:h-4 ${
                                    isOverdue ? "text-red-600" : "text-blue-600"
                                  }`}
                                />
                                <span
                                  className={`text-xs md:text-sm ${
                                    isOverdue ? "text-red-700" : "text-blue-700"
                                  }`}
                                >
                                  Days Until Next Update
                                </span>
                              </div>
                              <div
                                className={`text-lg md:text-xl font-bold ${
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
                </div>
              )}
            </div>
          </div>

          {/* Mobile Next Stage Button - Fixed at bottom on mobile */}
          {isMobile && nextStage && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <Button
                onClick={() => setPOTargetDialogOpen(true)}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
                size="lg"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Advance to {nextStage.name}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* POTargetDialog */}
      <POTargetDialog
        open={poTargetDialogOpen}
        onOpenChange={setPOTargetDialogOpen}
        project={project}
        onConfirm={handlePOConfirm}
      />

      {/* ColorMaterialsDialog */}
      <ColorMaterialsDialog
        open={colorMaterialsDialogOpen}
        onOpenChange={setColorMaterialsDialogOpen}
        project={editedProject}
        colors={Array.from(localColorVariants.keys())}
        onSave={handleColorVariantsSave}
      />
    </>
  );
}

// Helper functions
const DEFAULT_MATERIALS = (): Material[] => [
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

const DEFAULT_COMPONENTS = (): CompType[] => [
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

// Update convertColorVariants function in GreenSealProjectDetailsDialog

function convertColorVariants(projectData: any): Map<string, any> {
  const variantsMap = new Map<string, any>();
  if (!projectData?.colorVariants) return variantsMap;

  // Helper function to get empty costing structure
  const getEmptyCosting = () => ({
    upper: [],
    material: [],
    component: [],
    packaging: [],
    misc: [],
    labour: { items: [], directTotal: 0 },
    summary: {
      upperTotal: 0,
      componentTotal: 0,
      materialTotal: 0,
      packagingTotal: 0,
      miscTotal: 0,
      labourTotal: 0,
      additionalCosts: 0,
      profitMargin: 0,
      profitAmount: 0,
      tentativeCost: 0,
    },
  });

  if (projectData.colorVariants instanceof Map) {
    for (const [k, v] of projectData.colorVariants.entries()) {
      variantsMap.set(k, {
        materials: Array.isArray(v?.materials) ? v.materials : [],
        components: Array.isArray(v?.components) ? v.components : [],
        images: Array.isArray(v?.images) ? v.images : [],
        costing: v?.costing || getEmptyCosting(),
        updatedBy: v?.updatedBy || null,
        updatedAt: v?.updatedAt ? new Date(v.updatedAt) : new Date(),
      });
    }
    return variantsMap;
  }

  for (const [k, v] of Object.entries(projectData.colorVariants || {})) {
    const val: any = v;
    variantsMap.set(k, {
      materials: Array.isArray(val?.materials) ? val.materials : [],
      components: Array.isArray(val?.components) ? val.components : [],
      images: Array.isArray(val?.images) ? val.images : [],
      costing: val?.costing || getEmptyCosting(),
      updatedBy: val?.updatedBy || null,
      updatedAt: val?.updatedAt ? new Date(val.updatedAt) : new Date(),
    });
  }
  return variantsMap;
}
