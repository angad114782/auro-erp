// RedSealProjectDetailsDialog.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
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
  X,
  Save,
  Calculator,
  MessageSquare,
  Award,
  Shield,
  ImageIcon,
  Upload,
  Trash2,
  Plus,
  ChevronRight,
  ChevronLeft,
  Download,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
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

import api from "../lib/api";
import {
  getStage,
  getFullImageUrl,
  formatDateDisplay,
  formatLabel,
  dataUrlToFile,
} from "../lib/utils";

import { useCostManagement } from "../hooks/useCostManagement";
import { Project, projectService } from "../components/services/projectService";
import { useRedirect } from "../hooks/useRedirect";
import { generateProjectPDF } from "../utils/pdfDownload";
import { useImagePreview } from "../lib/stores/useImagePreview";

/**
 * AddNewItemDialog - same UI you had (kept small & functional)
 */
const AddNewItemDialog = ({
  category,
  isOpen,
  onClose,
  formData,
  onFormChange,
  onAddItem,
}: {
  category: string;
  isOpen: boolean;
  onClose: () => void;
  formData: {
    item: string;
    description: string;
    consumption: string;
    cost: number;
  };
  onFormChange: (field: string, value: string | number) => void;
  onAddItem: () => void;
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-md">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Add New {category}</h3>
        <div className="space-y-3">
          <Input
            placeholder="Item name"
            value={formData.item}
            onChange={(e) => onFormChange("item", e.target.value)}
          />
          <Input
            placeholder="Description"
            value={formData.description}
            onChange={(e) => onFormChange("description", e.target.value)}
          />
          <Input
            placeholder="Consumption"
            value={formData.consumption}
            onChange={(e) => onFormChange("consumption", e.target.value)}
          />
          <Input
            type="number"
            placeholder="Cost"
            value={formData.cost}
            onChange={(e) => onFormChange("cost", Number(e.target.value) || 0)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onAddItem}>Add</Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

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

export function RedSealProjectDetailsDialog(props: any) {
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

  const { goTo } = useRedirect();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const [sampleFiles, setSampleFiles] = useState<(File | null)[]>([]);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [samples, setSamples] = useState<string[]>([]);
  const coverRef = useRef<HTMLInputElement | null>(null);
  const sampleRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const openImagePreview = useImagePreview((s) => s.openPreview);
  // --- cost management hook
  const {
    costRows,
    labourCost,
    costSummary,
    loading: costLoading,
    loadAllCostData,
    updateItemCost,
    addCostItem,
    deleteCostItem,
    updateLabourCost,
    updateBrandFinalCost,
  } = useCostManagement(project?._id);

  // Local editable summary fields (since backend doesn't return computed fields)
  const [editAdditionalCosts, setEditAdditionalCosts] = useState<number>(0);
  const [editProfitMargin, setEditProfitMargin] = useState<number>(0);

  // Keep local computed values to display realtime
  const [localProfitAmount, setLocalProfitAmount] = useState<number>(0);
  const [localTentativeCost, setLocalTentativeCost] = useState<number>(0);

  // When costSummary changes, sync editable fields and recompute
  useEffect(() => {
    if (!costSummary) return;
    const add = Number(costSummary.additionalCosts || 0);
    const margin = Number(costSummary.profitMargin || 0);
    setEditAdditionalCosts(add);
    setEditProfitMargin(margin);
  }, [costSummary]);

  // derive totals and compute realtime values whenever totals or edits change
  useEffect(() => {
    // Use totals from costSummary (assumed available from hook)
    const totalAll = Number(costSummary?.totalAllCosts || 0);
    const additional = Number(editAdditionalCosts || 0);
    const margin = Number(editProfitMargin || 0);

    const profitAmount = ((totalAll + additional) * margin) / 100;

    const tentative = totalAll + additional + profitAmount;

    setLocalProfitAmount(profitAmount);
    setLocalTentativeCost(tentative);
  }, [costSummary?.totalAllCosts, editAdditionalCosts, editProfitMargin]);

  const computeRealtimeSummary = () => {
    return {
      profitAmount: localProfitAmount,
      tentative: localTentativeCost,
    };
  };

  const realtime = computeRealtimeSummary();

  // Initialize dialog on open
  useEffect(() => {
    if (!project || !open) return;

    const nextUpdateDate =
      project?.nextUpdate?.date || project?.nextUpdateDate || "";
    const updateNotes = project?.nextUpdate?.note || project?.updateNotes || "";

    setEditedProject({
      ...project,
      clientFinalCost:
        project.clientFinalCost || String(costSummary.brandFinalCost || 0),
      nextUpdateDate,
      updateNotes,
    });

    setCoverPhoto(project.coverImage || null);
    setSamples(project.sampleImages ? [...project.sampleImages] : []);
    setIsEditing(false);

    // Load cost data fresh
    loadAllCostData();
  }, [project, open, loadAllCostData]);

  // fetch brands when company changes (edit mode)
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

  // fetch categories when brand changes (edit mode)
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

  // image upload handlers
  const handleCoverUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const preview = URL.createObjectURL(file);
      setCoverPhoto(preview);
      setCoverFile(file);
    },
    []
  );

  const handleSampleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const preview = URL.createObjectURL(file);
      setSamples((prev) => {
        const arr = [...prev];
        arr[index] = preview;
        return arr;
      });
      setSampleFiles((prev) => {
        const arr = [...prev];
        arr[index] = file;
        return arr;
      });
    },
    []
  );

  const removeSample = (idx: number) => {
    setSamples((prev) => prev.filter((_, i) => i !== idx));
    setSampleFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSampleSlot = () => {
    setSamples((prev) => [...prev, ""]);
    setSampleFiles((prev) => [...prev, null]);
  };

  // dialog forms & cost item handlers
  const [addItemDialogs, setAddItemDialogs] = useState({
    upper: false,
    component: false,
    material: false,
    packaging: false,
    miscellaneous: false,
    labour: false,
  });

  const [dialogForms, setDialogForms] = useState({
    upper: { item: "", description: "", consumption: "", cost: 0 },
    component: { item: "", description: "", consumption: "", cost: 0 },
    material: { item: "", description: "", consumption: "", cost: 0 },
    packaging: { item: "", description: "", consumption: "", cost: 0 },
    miscellaneous: { item: "", description: "", consumption: "", cost: 0 },
    labour: { item: "", cost: 0 },
  });

  const openAddItemDialog = (category: string) =>
    setAddItemDialogs((p) => ({ ...p, [category]: true }));
  const closeAddItemDialog = (category: string) => {
    setAddItemDialogs((p) => ({ ...p, [category]: false }));
    setDialogForms((prev) => ({
      ...prev,
      [category]:
        category === "labour"
          ? { item: "", cost: 0 }
          : { item: "", description: "", consumption: "", cost: 0 },
    }));
  };

  const handleDialogFormChange = (
    category: string,
    field: string,
    value: string | number
  ) => {
    setDialogForms((prev) => ({
      ...prev,
      [category]: { ...prev[category as keyof typeof prev], [field]: value },
    }));
  };

  const handleAddItem = async (category: string) => {
    if (!project) return;

    if (category === "labour") {
      const form = dialogForms.labour;
      if (!form.item.trim()) {
        toast.error("Please enter a labour item name");
        return;
      }
      try {
        const newItems = [
          ...labourCost.items,
          { name: form.item, cost: Number(form.cost) || 0 },
        ];
        await updateLabourCost({ items: newItems });
        await loadAllCostData();
        closeAddItemDialog(category);
        toast.success("New labour item added successfully!");
      } catch (err) {
        console.error(err);
        toast.error("Failed to add labour item");
      }
      return;
    }

    const form = dialogForms[category as keyof typeof dialogForms] as any;
    if (!form.item.trim()) {
      toast.error("Please enter an item name");
      return;
    }
    try {
      await addCostItem(category, {
        item: form.item.trim(),
        description: form.description || "",
        consumption: form.consumption || "",
        cost: Number(form.cost) || 0,
      });
      await loadAllCostData();
      closeAddItemDialog(category);
      toast.success(`New ${category} item added successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add item");
    }
  };

  const calculateTotal = (section: keyof typeof costRows) => {
    return costRows[section].reduce((sum, item) => sum + (item.cost || 0), 0);
  };

  // update project status
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

  const updateStatus = useCallback(
    async (newStatus: string) => {
      if (!editedProject) return;
      const projectId = editedProject._id;
      await projectService.updateProjectStatus(projectId, newStatus);
    },
    [editedProject]
  );

  const handleAdvanceToGreenSeal = useCallback(async () => {
    try {
      if (!nextStage) {
        toast.info("Already at final stage");
        return;
      }
      await updateStatus(nextStage.id);
      toast.success(`Moved to ${nextStage.name}`);
      await reloadProjects();
      setSelectedSubModule?.("green-seal");
      onOpenChange(false);
      goTo("rd-management", "green-seal");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update project stage");
    }
  }, [
    nextStage,
    updateStatus,
    reloadProjects,
    setSelectedSubModule,
    onOpenChange,
  ]);

  // --- SAVE handler: sends additionalCosts & profitMargin to backend and updates project
  const handleSave = useCallback(async () => {
    if (!editedProject || !project) return;

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
        fd.append("clientApproval", String(editedProject.clientApproval));

      if (editedProject.clientFinalCost) {
        fd.append("clientFinalCost", String(editedProject.clientFinalCost));
      }

      const nextUpdateDate =
        editedProject.nextUpdateDate || project?.nextUpdate?.date;
      const updateNotes =
        editedProject.updateNotes || project?.nextUpdate?.note;

      if (nextUpdateDate) {
        fd.append(
          "nextUpdate",
          JSON.stringify({ date: nextUpdateDate, note: updateNotes || "" })
        );
      }

      // add sample files if any
      sampleFiles.forEach((file) => {
        if (file) fd.append("sampleImages", file);
      });

      // keep existing samples not replaced
      const existingSampleUrls = samples.filter((s, i) => !sampleFiles[i]);
      if (existingSampleUrls.length > 0) {
        fd.append("keepExistingSamples", JSON.stringify(existingSampleUrls));
      }

      // cover handling
      if (coverFile) {
        fd.append("coverImage", coverFile);
      } else if (coverPhoto) {
        fd.append("keepExistingCover", "true");
      }

      // 1) Save cost summary (only fields backend expects)
      await api.patch(`/projects/${project._id}/costs`, {
        additionalCosts: Number(editAdditionalCosts) || 0,
        profitMargin: Number(editProfitMargin) || 0,
      });

      // 2) Save project details
      await projectService.updateProject(editedProject._id, fd);

      // 3) Reload cost summary and row data from backend to reflect persisted values
      await loadAllCostData();

      toast.success("Project updated successfully");
      await reloadProjects();
      await loadAllCostData();

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
    sampleFiles,
    editAdditionalCosts,
    editProfitMargin,
    onOpenChange,
    reloadProjects,
    project,
    loadAllCostData,
  ]);

  const handleCancelEdit = useCallback(() => {
    if (!project) return;
    setIsEditing(false);
    setEditedProject({
      ...project,
      clientFinalCost:
        project.clientFinalCost || String(costSummary.brandFinalCost || 0),
    });
    setCoverPhoto(project.coverImage || null);
    setSamples(project.sampleImages || []);
    // reset local edits to backend values
    setEditAdditionalCosts(Number(costSummary.additionalCosts || 0));
    setEditProfitMargin(Number(costSummary.profitMargin || 0));
  }, [project, costSummary]);

  const handleDownloadPDF = async () => {
    try {
      if (!project) return;

      // Load all cost data including summary
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

      // Get the cost summary from your hook state (or API response)
      const summaryData =
        costSummary || summaryRes.data.summary || summaryRes.data;

      const costData = {
        upper: upperRes.data.rows || [],
        component: componentRes.data.rows || [],
        material: materialRes.data.rows || [],
        packaging: packagingRes.data.rows || [],
        miscellaneous: miscRes.data.rows || [],
        labour: {
          items: labourRes.data.labour?.items || [],
          directTotal: labourRes.data.labour?.directTotal || 0,
        },
        summary: {
          // Include all cost breakdown totals
          upperTotal: summaryData.upperTotal || calculateTotal("upper"),
          componentTotal:
            summaryData.componentTotal || calculateTotal("component"),
          materialTotal:
            summaryData.materialTotal || calculateTotal("material"),
          packagingTotal:
            summaryData.packagingTotal || calculateTotal("packaging"),
          miscTotal: summaryData.miscTotal || calculateTotal("miscellaneous"),
          labourTotal: summaryData.labourTotal || labourCost.directTotal,
          additionalCosts: editAdditionalCosts, // Use your local state
          profitMargin: editProfitMargin, // Use your local state
          profitAmount: localProfitAmount, // Use your local computed state
          totalAllCosts: summaryData.totalAllCosts || 0,
          tentativeCost: realtime.tentative, // Use your computed tentative cost
        },
      };
      console.log(project, "fdfdsfdfds");
      const pdfProject = {
        ...project, // Spread all project properties
        // Ensure these fields are included

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
        status: project.status,
        clientFinalCost:
          editedProject?.clientFinalCost || project.clientFinalCost || "0", // ADD THIS
        nextUpdate: {
          date: project.nextUpdate?.date || "",
          note: project.nextUpdate?.note || "",
        },
        coverImage: project.coverImage
          ? getFullImageUrl(project.coverImage)
          : null,
        sampleImages: (project.sampleImages || []).map(getFullImageUrl),
        // PO details if available
        po: project.po || {
          poNumber: project.poNumber,
          orderQuantity: project.orderQuantity,
          unitPrice: project.unitPrice,
          totalAmount: project.poValue,
          deliveryDate: project.redSealTargetDate,
        },
        poNumber: project.poNumber,
        orderQuantity: project.orderQuantity,
        unitPrice: project.unitPrice,
        poValue: project.poValue,
        costData, // Include the enhanced cost data
      };

      // ALWAYS use actual project stage as PDF template selector
      const activeTab = project.status;
      await generateProjectPDF({
        project: pdfProject,
        costData,
        activeTab,
        companyName: "AURA INTERNATIONAL",
        // logoUrl: "/logo/aura-logo.png", // OR full CDN URL
      });

      // await generateProjectPDF({
      //   project: pdfProject,
      //   costData,
      //   activeTab,
      // });

      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("PDF generation failed");
    }
  };

  if (!project || !editedProject) return null;

  return (
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
        <div className="sticky top-0 z-50 px-4 md:px-8 py-4 md:py-6 bg-linear-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-linear-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <Shield className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-1 md:mb-2 truncate">
                  Red Seal Approval Details
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                  <span className="text-sm md:text-lg text-gray-600 truncate">
                    {project.autoCode}
                  </span>
                  <Badge className="bg-red-100 text-red-800 text-xs md:text-sm px-2 md:px-3 py-1 truncate">
                    🔴 Red Seal Approval
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
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
                  {!isMobile && (
                    <Button
                      onClick={handleAdvanceToGreenSeal}
                      className="bg-emerald-500 hover:bg-emerald-600 text-xs md:text-sm"
                      size={isMobile ? "sm" : "default"}
                    >
                      <ArrowRight className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                      {isMobile ? "Next" : "Advance to Green Seal"}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    className="bg-green-500 hover:bg-green-600 text-xs md:text-sm"
                    size={isMobile ? "sm" : "default"}
                  >
                    <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    {isMobile ? "Save" : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    size={isMobile ? "sm" : "default"}
                  >
                    {isMobile ? "Cancel" : "Cancel Edit"}
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 md:h-10 md:w-10 p-0 rounded-full"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
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
                      ? "border-b-2 border-red-500 text-red-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`pb-2 px-1 text-sm font-medium whitespace-nowrap ${
                    activeTab === "timeline"
                      ? "border-b-2 border-red-500 text-red-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setActiveTab("feedback")}
                  className={`pb-2 px-1 text-sm font-medium whitespace-nowrap ${
                    activeTab === "feedback"
                      ? "border-b-2 border-red-500 text-red-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Feedback
                </button>
                {/* REMOVED: No "costs" tab - tables show always */}
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
                    Approval Progress
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
                              ? "bg-blue-100 border-2 border-blue-400 shadow-md"
                              : isCompleted
                              ? "bg-green-50 border border-green-200"
                              : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 md:w-6 md:h-6 mx-auto mb-1 rounded-full flex items-center justify-center text-xs ${
                              isCurrent
                                ? "bg-blue-500 text-white"
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

            {/* Product Details - Show only on details tab on mobile */}
            {(!isMobile || activeTab === "details") && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                    <Target className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                    Product Details
                  </h3>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6">
                  {/* Images Section */}
                  <div className="flex flex-col md:flex-row gap-4 mb-4 md:mb-6">
                    <div className="w-full md:w-44">
                      <div className="bg-gray-50 border rounded-lg p-3 text-center">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden mx-auto mb-2 border shadow-sm">
                          <img
                            onClick={(e) => {
                              // e.stopPropagation();
                              openImagePreview(
                                getFullImageUrl(project.coverImage),
                                project.artName
                              );
                            }}
                            src={coverImageUrl}
                            alt="cover"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="font-medium text-xs truncate">
                          {project.autoCode}
                        </div>
                        <div className="text-gray-400 text-xs">Sample</div>
                      </div>
                    </div>

                    <div className="flex-1 p-3 bg-gray-50/50 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                          <span className="text-xs font-semibold text-gray-800">
                            Images
                          </span>
                        </div>
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          {samples.filter(Boolean).length +
                            (coverPhoto ? 1 : 0)}
                        </Badge>
                      </div>

                      {!isEditing ? (
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                          {coverPhoto && (
                            <div className="w-16 h-16 md:w-20 md:h-20 border rounded-md overflow-hidden shrink-0">
                              <img
                                onClick={(e) => {
                                  // e.stopPropagation();
                                  openImagePreview(
                                    getFullImageUrl(project.coverImage),
                                    project.artName
                                  );
                                }}
                                src={coverImageUrl}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          {samples.map((s, i) => (
                            <div
                              key={i}
                              className="w-16 h-16 md:w-20 md:h-20 border rounded-md overflow-hidden shrink-0"
                            >
                              <img
                                src={sampleImageUrls[i]}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {!coverPhoto &&
                            samples.filter(Boolean).length === 0 && (
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
                                onClick={() => sampleRefs.current[idx]?.click()}
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

                  {/* Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
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
                            {companies.map((c: any) => (
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
                        <div className="mt-1 text-sm">
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
                              brand:
                                brands.find((b: any) => b._id === v) || null,
                              category: null,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1 h-8 md:h-10 text-xs md:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map((b: any) => (
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
                        <div className="mt-1 text-sm">
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
                                categories.find((c: any) => c._id === v) ||
                                null,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1 h-8 md:h-10 text-xs md:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c: any) => (
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
                        <div className="mt-1 text-sm">
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
                              type: types.find((t: any) => t._id === v) || null,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1 h-8 md:h-10 text-xs md:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {types.map((t: any) => (
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
                        <div className="mt-1 text-sm">{project.type?.name}</div>
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
                        <div className="mt-1 text-sm">
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
                        <div className="mt-1 text-sm">
                          {project.artName || "N/A"}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs md:text-sm">Color</Label>
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
                        <div className="mt-1 text-sm">
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
                                countries.find((c: any) => c._id === v) || null,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1 h-8 md:h-10 text-xs md:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((c: any) => (
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
                        <div className="mt-1 text-sm">
                          {project.country?.name}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs md:text-sm">Priority</Label>
                      {isEditing ? (
                        <Select
                          value={editedProject.priority || ""}
                          onValueChange={(v) =>
                            setEditedProject({ ...editedProject, priority: v })
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
                          {formatLabel(project.priority) || "N/A"}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs md:text-sm">Target Date</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={
                            editedProject?.redSealTargetDate
                              ? editedProject.redSealTargetDate.split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            setEditedProject({
                              ...editedProject,
                              redSealTargetDate: e.target.value,
                            })
                          }
                          className="h-8 md:h-10 text-xs md:text-sm"
                        />
                      ) : (
                        <div className="mt-1 text-sm">
                          {formatDateDisplay(project?.redSealTargetDate)}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs md:text-sm">
                        Assigned Person
                      </Label>
                      {isEditing ? (
                        <Select
                          value={editedProject?.assignPerson?._id}
                          onValueChange={(v) =>
                            setEditedProject({
                              ...editedProject,
                              assignPerson:
                                assignPersons.find((p: any) => p._id === v) ||
                                null,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1 h-8 md:h-10 text-xs md:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {assignPersons?.map((p: any) => (
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
                        <div className="mt-1 text-sm">
                          {project?.assignPerson?.name || "N/A"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Client Feedback & Updates - Show only on feedback tab on mobile */}
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
                  {/* Client Feedback */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6">
                    <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                      Client Feedback
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs md:text-sm font-medium text-gray-600 mb-2 block">
                          Description
                        </Label>
                        {isEditing ? (
                          <Textarea
                            value={editedProject?.productDesc || ""}
                            onChange={(e) =>
                              setEditedProject({
                                ...editedProject,
                                productDesc: e.target.value,
                              })
                            }
                            className="min-h-20 md:min-h-[100px] text-xs md:text-sm"
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg text-xs md:text-sm text-gray-700 min-h-20 md:min-h-[100px]">
                            {project?.productDesc || "No Description"}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs md:text-sm font-medium text-gray-600 mb-2 block">
                          Approval Status
                        </Label>
                        {isEditing ? (
                          <Select
                            value={editedProject?.clientApproval || "pending"}
                            onValueChange={(value) =>
                              setEditedProject({
                                ...editedProject,
                                clientApproval: value,
                              })
                            }
                          >
                            <SelectTrigger className="mt-1 h-8 md:h-10 text-xs md:text-sm">
                              <SelectValue placeholder="Select Approval Status" />
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
                                Pending
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
                            className={`
                              text-xs px-2 py-1
                              ${
                                editedProject.clientApproval === "ok"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : editedProject.clientApproval === "pending"
                                  ? "bg-blue-100 text-blue-700"
                                  : editedProject.clientApproval ===
                                    "update_req"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : editedProject.clientApproval ===
                                    "review_req"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-red-100 text-red-700"
                              }
                            `}
                          >
                            {
                              {
                                ok: "✓ Approved",
                                pending: "⏳ Pending",
                                update_req: "🔄 Update Required",
                                review_req: "📝 Review Required",
                                rejected: "❌ Rejected",
                              }[editedProject.clientApproval || "pending"]
                            }
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Next Update */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6">
                    <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                      Next Update Schedule
                    </h4>

                    <div className="space-y-4">
                      {/* DATE */}
                      <div>
                        <Label className="text-xs md:text-sm font-medium text-gray-600 mb-2 block">
                          Next Update Date
                        </Label>

                        {isEditing ? (
                          <Input
                            type="date"
                            value={editedProject?.nextUpdateDate || ""}
                            onChange={(e) =>
                              setEditedProject({
                                ...editedProject,
                                nextUpdateDate: e.target.value,
                              })
                            }
                            className="h-8 md:h-10 text-xs md:text-sm"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs md:text-sm">
                            <Calendar className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                            <span className="text-gray-900">
                              {project?.nextUpdate && project?.nextUpdate?.date
                                ? formatDateDisplay(project?.nextUpdate?.date)
                                : "Not scheduled"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* NOTES */}
                      <div>
                        <Label className="text-xs md:text-sm font-medium text-gray-600 mb-2 block">
                          Update Notes
                        </Label>

                        {isEditing ? (
                          <Textarea
                            value={editedProject?.updateNotes || ""}
                            onChange={(e) =>
                              setEditedProject({
                                ...editedProject,
                                updateNotes: e.target.value,
                              })
                            }
                            className="min-h-16 md:min-h-[80px] text-xs md:text-sm"
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg text-xs md:text-sm text-gray-700 min-h-16 md:min-h-[80px]">
                            {project?.nextUpdate && project?.nextUpdate?.note
                              ? project?.nextUpdate?.note
                              : "No update notes"}
                          </div>
                        )}
                      </div>

                      {/* REMAINING / OVERDUE */}
                      <div>
                        {(() => {
                          const next =
                            editedProject?.nextUpdateDate ||
                            project?.nextUpdate?.date;
                          if (!next) {
                            return (
                              <div className="p-3 md:p-4 border rounded-lg bg-gray-50 text-center text-gray-600 text-xs md:text-sm">
                                <Clock className="w-3 h-3 md:w-4 md:h-4 mx-auto mb-1" />
                                Not Scheduled
                              </div>
                            );
                          }
                          const diff = Math.ceil(
                            (new Date(next).getTime() - new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                          );
                          const overdue = diff < 0;
                          return (
                            <div
                              className={`p-3 md:p-4 border rounded-lg text-center text-xs md:text-sm ${
                                overdue
                                  ? "bg-red-50 border-red-200 text-red-700"
                                  : "bg-blue-50 border-blue-200 text-blue-700"
                              }`}
                            >
                              <Clock className="w-3 h-3 md:w-4 md:h-4 mx-auto mb-1" />
                              <span className="font-bold">
                                {diff === 0
                                  ? "Due Today"
                                  : overdue
                                  ? "Overdue"
                                  : `${diff} days remaining`}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                {isEditing && (
                  <div className="bg-gray-50 border rounded-lg p-3 md:p-4">
                    <Label className="text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3 block">
                      Quick Update Actions
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 7);
                          const iso = d.toISOString().split("T")[0];
                          setEditedProject({
                            ...editedProject,
                            nextUpdateDate: iso,
                            updateNotes: "Follow-up scheduled for next week.",
                          });
                        }}
                        className="text-xs"
                      >
                        <Calendar className="w-3 h-3 mr-1" /> Schedule Next Week
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEditedProject({
                            ...editedProject,
                            updateNotes: "Client requested revision.",
                          })
                        }
                        className="text-xs"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" /> Revision
                        Required
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEditedProject({
                            ...editedProject,
                            updateNotes: "Client approved the project.",
                            clientApproval: "ok", // ✅ THIS WAS MISSING
                          })
                        }
                        className="text-xs"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Mark Approved
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cost Breakdown - Show ALWAYS (on both mobile and desktop) */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                  <Calculator className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  Cost Breakdown & Final Tentative Cost
                </h3>
              </div>

              {/* All Cost Tables - Show in responsive grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Upper Cost Table */}
                <div className="bg-white border-2 border-orange-200 rounded-xl p-4 md:p-6">
                  <div className="flex justify-between items-center mb-3 md:mb-4">
                    <h4 className="text-base md:text-lg font-semibold text-orange-900">
                      Upper Cost Breakdown
                    </h4>
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs"
                        onClick={() => openAddItemDialog("upper")}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <div className="grid grid-cols-4 gap-1 md:gap-2 text-[10px] md:text-xs font-medium text-gray-600 bg-orange-50 p-2 rounded">
                      <div>ITEM</div>
                      <div>DESCRIPTION</div>
                      <div>CONSUMPTION</div>
                      <div>
                        COST{" "}
                        {isEditing && (
                          <span className="ml-1 hidden md:inline">
                            / ACTION
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-48 md:max-h-64 overflow-y-auto space-y-1 md:space-y-2">
                      {costRows.upper.map((item) => (
                        <div
                          key={item._id}
                          className="grid grid-cols-4 gap-1 md:gap-2 text-xs md:text-sm py-1 md:py-2 border-b items-center"
                        >
                          {isEditing ? (
                            <>
                              <Input
                                value={item.item}
                                readOnly
                                className="text-xs md:text-sm h-6 md:h-8 bg-gray-50"
                              />
                              <Input
                                value={item.description}
                                readOnly
                                className="text-xs md:text-sm h-6 md:h-8 bg-gray-50"
                              />
                              <Input
                                value={item.consumption}
                                readOnly
                                className="text-xs md:text-sm h-6 md:h-8 bg-gray-50"
                              />
                              <div className="flex items-center gap-1">
                                <div className="relative flex-1">
                                  <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-2 h-2 md:w-3 md:h-3" />
                                  <Input
                                    type="number"
                                    value={item.cost}
                                    onChange={(e) =>
                                      updateItemCost(
                                        item._id,
                                        Number(e.target.value) || 0
                                      )
                                    }
                                    className="pl-5 md:pl-6 text-xs md:text-sm h-6 md:h-8"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCostItem(item._id)}
                                  className="h-6 w-6 md:h-8 md:w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium truncate">
                                {item.item}
                              </div>
                              <div className="text-gray-600 truncate">
                                {item.description || "-"}
                              </div>
                              <div className="text-gray-600 truncate">
                                {item.consumption || "-"}
                              </div>
                              <div className="font-medium">
                                ₹{item.cost.toFixed(2)}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-orange-50 p-2 md:p-3 rounded-lg mt-2 md:mt-3">
                      <div className="flex justify-between font-semibold text-orange-900 text-sm">
                        <span>Total Upper Cost:</span>
                        <span>₹{calculateTotal("upper").toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Component Cost Table */}
                <div className="bg-white border-2 border-purple-200 rounded-xl p-4 md:p-6">
                  <div className="flex justify-between items-center mb-3 md:mb-4">
                    <h4 className="text-base md:text-lg font-semibold text-purple-900">
                      Component Cost Breakdown
                    </h4>
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-purple-600 border-purple-200 hover:bg-purple-50 text-xs"
                        onClick={() => openAddItemDialog("component")}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <div className="grid grid-cols-4 gap-1 md:gap-2 text-[10px] md:text-xs font-medium text-gray-600 bg-purple-50 p-2 rounded">
                      <div>COMPONENT</div>
                      <div>DESCRIPTION</div>
                      <div>CONSUMPTION</div>
                      <div>
                        COST{" "}
                        {isEditing && (
                          <span className="ml-1 hidden md:inline">
                            / ACTION
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-48 md:max-h-64 overflow-y-auto space-y-1 md:space-y-2">
                      {costRows.component.map((item) => (
                        <div
                          key={item._id}
                          className="grid grid-cols-4 gap-1 md:gap-2 text-xs md:text-sm py-1 md:py-2 border-b items-center"
                        >
                          {isEditing ? (
                            <>
                              <Input
                                value={item.item}
                                readOnly
                                className="text-xs md:text-sm h-6 md:h-8 bg-gray-50"
                              />
                              <Input
                                value={item.description}
                                readOnly
                                className="text-xs md:text-sm h-6 md:h-8 bg-gray-50"
                              />
                              <Input
                                value={item.consumption}
                                readOnly
                                className="text-xs md:text-sm h-6 md:h-8 bg-gray-50"
                              />
                              <div className="flex items-center gap-1">
                                <div className="relative flex-1">
                                  <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-2 h-2 md:w-3 md:h-3" />
                                  <Input
                                    type="number"
                                    value={item.cost}
                                    onChange={(e) =>
                                      updateItemCost(
                                        item._id,
                                        Number(e.target.value) || 0
                                      )
                                    }
                                    className="pl-5 md:pl-6 text-xs md:text-sm h-6 md:h-8"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCostItem(item._id)}
                                  className="h-6 w-6 md:h-8 md:w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium truncate">
                                {item.item}
                              </div>
                              <div className="text-gray-600 truncate">
                                {item.description || "-"}
                              </div>
                              <div className="text-gray-600 truncate">
                                {item.consumption || "-"}
                              </div>
                              <div className="font-medium">
                                ₹{item.cost.toFixed(2)}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-purple-50 p-2 md:p-3 rounded-lg mt-2 md:mt-3">
                      <div className="flex justify-between font-semibold text-purple-900 text-sm">
                        <span>Total Component Cost:</span>
                        <span>₹{calculateTotal("component").toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Material Cost Table */}
                <div className="bg-white border-2 border-blue-200 rounded-xl p-4 md:p-6">
                  <div className="flex justify-between items-center mb-3 md:mb-4">
                    <h4 className="text-base md:text-lg font-semibold text-blue-900">
                      Material Cost Breakdown
                    </h4>
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs"
                        onClick={() => openAddItemDialog("material")}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <div className="grid grid-cols-4 gap-1 md:gap-2 text-[10px] md:text-xs font-medium text-gray-600 bg-blue-50 p-2 rounded">
                      <div>MATERIAL</div>
                      <div>DESCRIPTION</div>
                      <div>CONSUMPTION</div>
                      <div>
                        COST{" "}
                        {isEditing && (
                          <span className="ml-1 hidden md:inline">
                            / ACTION
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-48 md:max-h-64 overflow-y-auto space-y-1 md:space-y-2">
                      {costRows.material.map((item) => (
                        <div
                          key={item._id}
                          className="grid grid-cols-4 gap-1 md:gap-2 text-xs md:text-sm py-1 md:py-2 border-b items-center"
                        >
                          {isEditing ? (
                            <>
                              <Input
                                value={item.item}
                                readOnly
                                className="text-xs md:text-sm h-6 md:h-8 bg-gray-50"
                              />
                              <Input
                                value={item.description}
                                readOnly
                                className="text-xs md:text-sm h-6 md:h-8 bg-gray-50"
                              />
                              <Input
                                value={item.consumption}
                                readOnly
                                className="text-xs md:text-sm h-6 md:h-8 bg-gray-50"
                              />
                              <div className="flex items-center gap-1">
                                <div className="relative flex-1">
                                  <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-2 h-2 md:w-3 md:h-3" />
                                  <Input
                                    type="number"
                                    value={item.cost}
                                    onChange={(e) =>
                                      updateItemCost(
                                        item._id,
                                        Number(e.target.value) || 0
                                      )
                                    }
                                    className="pl-5 md:pl-6 text-xs md:text-sm h-6 md:h-8"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCostItem(item._id)}
                                  className="h-6 w-6 md:h-8 md:w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium truncate">
                                {item.item}
                              </div>
                              <div className="text-gray-600 truncate">
                                {item.description || "-"}
                              </div>
                              <div className="text-gray-600 truncate">
                                {item.consumption || "-"}
                              </div>
                              <div className="font-medium">
                                ₹{item.cost.toFixed(2)}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 p-2 md:p-3 rounded-lg mt-2 md:mt-3">
                      <div className="flex justify-between font-semibold text-blue-900 text-sm">
                        <span>Total Material Cost:</span>
                        <span>₹{calculateTotal("material").toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Packaging Cost Table */}
                <div className="bg-white border-2 border-pink-200 rounded-xl p-4 md:p-6">
                  <div className="flex justify-between items-center mb-3 md:mb-4">
                    <h4 className="text-base md:text-lg font-semibold text-pink-900">
                      Packaging Cost Breakdown
                    </h4>
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-pink-600 border-pink-200 hover:bg-pink-50 text-xs"
                        onClick={() => openAddItemDialog("packaging")}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <div className="grid grid-cols-4 gap-1 md:gap-2 text-[10px] md:text-xs font-medium text-gray-600 bg-pink-50 p-2 rounded">
                      <div>PACKAGING</div>
                      <div>DESCRIPTION</div>
                      <div>CONSUMPTION</div>
                      <div>
                        COST{" "}
                        {isEditing && (
                          <span className="ml-1 hidden md:inline">
                            / ACTION
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-48 md:max-h-64 overflow-y-auto space-y-1 md:space-y-2">
                      {costRows.packaging.map((item) => (
                        <div
                          key={item._id}
                          className="grid grid-cols-4 gap-1 md:gap-2 text-xs md:text-sm py-1 md:py-2 border-b items-center"
                        >
                          {isEditing ? (
                            <>
                              <Input
                                value={item.item}
                                readOnly
                                className="text-xs md:text-sm h-6 md:h-8 bg-gray-50"
                              />
                              <Input
                                value={item.description}
                                readOnly
                                className="text-xs md:text-sm h-6 md:h-8 bg-gray-50"
                              />
                              <Input
                                value={item.consumption}
                                readOnly
                                className="text-xs md:text-sm h-6 md:h-8 bg-gray-50"
                              />
                              <div className="flex items-center gap-1">
                                <div className="relative flex-1">
                                  <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-2 h-2 md:w-3 md:h-3" />
                                  <Input
                                    type="number"
                                    value={item.cost}
                                    onChange={(e) =>
                                      updateItemCost(
                                        item._id,
                                        Number(e.target.value) || 0
                                      )
                                    }
                                    className="pl-5 md:pl-6 text-xs md:text-sm h-6 md:h-8"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCostItem(item._id)}
                                  className="h-6 w-6 md:h-8 md:w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium truncate">
                                {item.item}
                              </div>
                              <div className="text-gray-600 truncate">
                                {item.description || "-"}
                              </div>
                              <div className="text-gray-600 truncate">
                                {item.consumption || "-"}
                              </div>
                              <div className="font-medium">
                                ₹{item.cost.toFixed(2)}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-pink-50 p-2 md:p-3 rounded-lg mt-2 md:mt-3">
                      <div className="flex justify-between font-semibold text-pink-900 text-sm">
                        <span>Total Packaging Cost:</span>
                        <span>₹{calculateTotal("packaging").toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Miscellaneous Cost Table */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6">
                  <div className="flex justify-between items-center mb-3 md:mb-4">
                    <h4 className="text-base md:text-lg font-semibold text-gray-900">
                      Miscellaneous Cost Breakdown
                    </h4>
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-600 border-gray-200 hover:bg-gray-50 text-xs"
                        onClick={() => openAddItemDialog("miscellaneous")}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <div className="grid grid-cols-4 gap-1 md:gap-2 text-[10px] md:text-xs font-medium text-gray-600 bg-gray-50 p-2 rounded">
                      <div>ITEM</div>
                      <div>DESCRIPTION</div>
                      <div>CONSUMPTION</div>
                      <div>
                        COST{" "}
                        {isEditing && (
                          <span className="ml-1 hidden md:inline">
                            / ACTION
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-48 md:max-h-64 overflow-y-auto space-y-1 md:space-y-2">
                      {costRows.miscellaneous.map((item) => (
                        <div
                          key={item._id}
                          className="grid grid-cols-4 gap-1 md:gap-2 text-xs md:text-sm py-1 md:py-2 border-b items-center"
                        >
                          {isEditing ? (
                            <>
                              <Input
                                value={item.item}
                                readOnly
                                className="text-xs md:text-sm h-6 md:h-8 bg-gray-50"
                              />
                              <Input
                                value={item.description}
                                readOnly
                                className="text-xs md:text-sm h-6 md:h-8 bg-gray-50"
                              />
                              <Input
                                value={item.consumption}
                                readOnly
                                className="text-xs md:text-sm h-6 md:h-8 bg-gray-50"
                              />
                              <div className="flex items-center gap-1">
                                <div className="relative flex-1">
                                  <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-2 h-2 md:w-3 md:h-3" />
                                  <Input
                                    type="number"
                                    value={item.cost}
                                    onChange={(e) =>
                                      updateItemCost(
                                        item._id,
                                        Number(e.target.value) || 0
                                      )
                                    }
                                    className="pl-5 md:pl-6 text-xs md:text-sm h-6 md:h-8"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCostItem(item._id)}
                                  className="h-6 w-6 md:h-8 md:w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium truncate">
                                {item.item}
                              </div>
                              <div className="text-gray-600 truncate">
                                {item.description || "-"}
                              </div>
                              <div className="text-gray-600 truncate">
                                {item.consumption || "-"}
                              </div>
                              <div className="font-medium">
                                ₹{item.cost.toFixed(2)}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-50 p-2 md:p-3 rounded-lg mt-2 md:mt-3">
                      <div className="flex justify-between font-semibold text-gray-900 text-sm">
                        <span>Total Miscellaneous Cost:</span>
                        <span>
                          ₹{calculateTotal("miscellaneous").toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Labour Cost Table */}
                <div className="bg-white border-2 border-yellow-200 rounded-xl p-4 md:p-6">
                  <div className="flex justify-between items-center mb-3 md:mb-4">
                    <h4 className="text-base md:text-lg font-semibold text-yellow-900">
                      Labour Cost Breakdown
                    </h4>
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 text-xs"
                        onClick={() => openAddItemDialog("labour")}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <div className="grid grid-cols-2 gap-1 md:gap-2 text-[10px] md:text-xs font-medium text-gray-600 bg-yellow-50 p-2 rounded">
                      <div>LABOUR ITEM</div>
                      <div>
                        COST{" "}
                        {isEditing && (
                          <span className="ml-1 hidden md:inline">
                            / ACTION
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-48 md:max-h-64 overflow-y-auto space-y-1 md:space-y-2">
                      {labourCost.items.map((item, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-2 gap-1 md:gap-2 text-xs md:text-sm py-1 md:py-2 border-b items-center"
                        >
                          {isEditing ? (
                            <>
                              <Input
                                value={item.name}
                                readOnly
                                className="text-xs md:text-sm h-6 md:h-8 bg-gray-50"
                              />
                              <div className="flex items-center gap-1">
                                <div className="relative flex-1">
                                  <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-2 h-2 md:w-3 md:h-3" />
                                  <Input
                                    type="number"
                                    value={item.cost}
                                    onChange={(e) => {
                                      const newItems = [...labourCost.items];
                                      newItems[index] = {
                                        ...newItems[index],
                                        cost: Number(e.target.value) || 0,
                                      };
                                      updateLabourCost({ items: newItems });
                                    }}
                                    className="pl-5 md:pl-6 text-xs md:text-sm h-6 md:h-8"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newItems = labourCost.items.filter(
                                      (_, i) => i !== index
                                    );
                                    updateLabourCost({ items: newItems });
                                  }}
                                  className="h-6 w-6 md:h-8 md:w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium truncate">
                                {item.name}
                              </div>
                              <div className="font-medium">
                                ₹{item.cost.toFixed(2)}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-yellow-50 p-2 md:p-3 rounded-lg mt-2 md:mt-3">
                      <div className="flex justify-between font-semibold text-yellow-900 text-sm">
                        <span>Total Labour Cost:</span>
                        <span>₹{labourCost.directTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Calculation Section */}
              <div className="bg-white border-2 border-green-200 rounded-xl p-4 md:p-6">
                <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                  Cost Analysis & Final Calculations
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                  <div className="text-center p-4 md:p-6 bg-linear-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-sm">
                    <div className="flex items-center justify-center gap-2 mb-2 md:mb-3">
                      <Calculator className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                      <div className="text-xs md:text-sm text-green-700 font-semibold tracking-wide uppercase">
                        Tentative Cost
                      </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-green-800 tracking-tight">
                      ₹{(realtime.tentative || 0).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-center p-4 md:p-6 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
                    <div className="flex items-center justify-center gap-2 mb-2 md:mb-3">
                      <Award className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                      <div className="text-xs md:text-sm text-blue-700 font-semibold tracking-wide uppercase">
                        Brand Final Cost
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="relative flex items-center justify-center gap-1">
                        <span className="text-2xl md:text-3xl font-bold text-blue-800">
                          ₹
                        </span>
                        <Input
                          type="number"
                          value={editedProject.clientFinalCost || ""}
                          onChange={(e) =>
                            setEditedProject({
                              ...editedProject,
                              clientFinalCost: e.target.value,
                            })
                          }
                          className="text-center text-2xl md:text-3xl font-bold text-blue-800 bg-white/50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg h-auto w-32 md:w-48 px-2 py-1 shadow-inner"
                          placeholder="0"
                        />
                      </div>
                    ) : (
                      <div className="text-2xl md:text-3xl font-bold text-blue-800 tracking-tight">
                        ₹{project?.clientFinalCost?.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary box */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
                  <h5 className="font-semibold text-gray-900 mb-2 md:mb-3 text-sm md:text-base">
                    Cost Breakdown Summary
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 text-xs md:text-sm mb-3 md:mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Upper Cost:</span>
                      <span className="font-medium">
                        ₹{Number(costSummary.upperTotal || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Component Cost:</span>
                      <span className="font-medium">
                        ₹{Number(costSummary.componentTotal || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Material Cost:</span>
                      <span className="font-medium">
                        ₹{Number(costSummary.materialTotal || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Packaging Cost:</span>
                      <span className="font-medium">
                        ₹{Number(costSummary.packagingTotal || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Labour + OH:</span>
                      <span className="font-medium">
                        ₹{Number(costSummary.labourTotal || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Miscellaneous:</span>
                      <span className="font-medium">
                        ₹{Number(costSummary.miscTotal || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Separator className="my-2 md:my-3" />
                  <div className="flex justify-between font-semibold mb-2 md:mb-3 text-sm">
                    <span>Total All Costs:</span>
                    <span>
                      ₹{Number(costSummary.totalAllCosts || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Additional Costs */}
                  <div className="flex justify-between items-center mb-2 text-sm">
                    <span className="text-gray-600">Additional Costs:</span>
                    {!isEditing ? (
                      <span className="font-medium">
                        ₹{Number(costSummary.additionalCosts || 0).toFixed(2)}
                      </span>
                    ) : (
                      <div className="relative w-20 md:w-28">
                        <Input
                          type="number"
                          value={editAdditionalCosts}
                          onChange={(e) =>
                            setEditAdditionalCosts(Number(e.target.value) || 0)
                          }
                          className="h-7 md:h-8 text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Profit Margin (%) */}
                  <div className="flex justify-between items-center mb-2 text-sm">
                    <span className="text-gray-600">Profit Margin (%):</span>
                    {!isEditing ? (
                      <span className="font-medium">
                        {Number(costSummary.profitMargin || 0)}%
                      </span>
                    ) : (
                      <div className="relative w-16 md:w-20">
                        <Input
                          type="number"
                          value={editProfitMargin}
                          min={0}
                          max={100}
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (isNaN(val) || val < 0) val = 0;
                            if (val > 100) val = 100;
                            setEditProfitMargin(val);
                          }}
                          className="h-7 md:h-8 text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Profit Amount */}
                  <div className="flex justify-between text-xs md:text-sm mb-2">
                    <span className="text-gray-600">
                      Profit (
                      {isEditing ? editProfitMargin : costSummary.profitMargin}
                      %):
                    </span>
                    <span className="font-medium">
                      +₹
                      {(isEditing
                        ? localProfitAmount
                        : Number(costSummary.profitAmount || 0)
                      ).toFixed(2)}
                    </span>
                  </div>

                  <Separator />

                  {/* Tentative Cost */}
                  <div className="flex justify-between font-bold text-base md:text-lg text-green-700">
                    <span>Total Tentative Cost:</span>
                    <span>
                      ₹
                      {(isEditing
                        ? localTentativeCost
                        : Number(costSummary.tentativeCost || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Advance Button - Fixed at bottom on mobile */}
        {isMobile && nextStage && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
            <Button
              onClick={handleAdvanceToGreenSeal}
              className="w-full bg-emerald-500 hover:bg-emerald-600"
              size="lg"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Advance to Green Seal
            </Button>
          </div>
        )}
      </DialogContent>

      {/* Add New Item Dialogs */}
      {Object.keys(addItemDialogs).map((category) => (
        <AddNewItemDialog
          key={`dialog-${category}`}
          category={category}
          isOpen={addItemDialogs[category as keyof typeof addItemDialogs]}
          onClose={() => closeAddItemDialog(category)}
          formData={dialogForms[category as keyof typeof dialogForms]}
          onFormChange={(field, value) =>
            handleDialogFormChange(category, field, value)
          }
          onAddItem={() => handleAddItem(category)}
        />
      ))}
    </Dialog>
  );
}
