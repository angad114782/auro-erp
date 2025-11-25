// RedSealProjectDetailsDialog.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
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
} from "lucide-react";
import { Dialog, DialogContent } from "./ui/dialog";
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
  dataUrlToFile,
} from "../lib/utils";

import { useCostManagement } from "../hooks/useCostManagement";
import { Project, projectService } from "../components/services/projectService";

// AddNewItemDialog omitted for brevity in this snippet — copy from your original component
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

  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  const [sampleFiles, setSampleFiles] = useState<(File | null)[]>([]); // actual files for upload

  // images
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [samples, setSamples] = useState<string[]>([]);
  const coverRef = React.useRef<HTMLInputElement | null>(null);
  const sampleRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // cost management hook (your hook)
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

  // dialog states for add items
  const [addItemDialogs, setAddItemDialogs] = useState({
    upper: false,
    component: false,
    material: false,
    packaging: false,
    miscellaneous: false,
  });

  const [dialogForms, setDialogForms] = useState({
    upper: { item: "", description: "", consumption: "", cost: 0 },
    component: { item: "", description: "", consumption: "", cost: 0 },
    material: { item: "", description: "", consumption: "", cost: 0 },
    packaging: { item: "", description: "", consumption: "", cost: 0 },
    miscellaneous: { item: "", description: "", consumption: "", cost: 0 },
  });

  // computed stage info
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

  // initialize when dialog opens
  useEffect(() => {
    if (!project || !open) return;

    // prefer project.nextUpdate subdoc if present
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

      // Update preview URL list
      setSamples((prev) => {
        const arr = [...prev];
        arr[index] = preview;
        return arr;
      });

      // Update real file list
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

  // cost item handlers use useCostManagement hook functions
  const openAddItemDialog = (category: string) =>
    setAddItemDialogs((p) => ({ ...p, [category]: true }));
  const closeAddItemDialog = (category: string) => {
    setAddItemDialogs((p) => ({ ...p, [category]: false }));
    setDialogForms((prev) => ({
      ...prev,
      [category]: { item: "", description: "", consumption: "", cost: 0 },
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
    const form = dialogForms[category as keyof typeof dialogForms];
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

  // update project status (uses projectService)
  const updateStatus = useCallback(
    async (newStatus: string) => {
      if (!editedProject) return;
      const companyId = editedProject.company?._id;
      const brandId = editedProject.brand?._id;
      const categoryId = editedProject.category?._id;
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

  // Save project using projectService.updateProject()
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

      // Add sample files
      sampleFiles.forEach((file) => {
        if (file) fd.append("sampleImages", file);
      });

      // Keep existing sample URLs (those that are not being replaced)
      const existingSampleUrls = samples.filter((s, i) => !sampleFiles[i]);

      if (existingSampleUrls.length > 0) {
        fd.append("keepExistingSamples", JSON.stringify(existingSampleUrls));
      }

      // Cover image handling
      if (coverFile) {
        fd.append("coverImage", coverFile);
      } else if (coverPhoto) {
        fd.append("keepExistingCover", "true");
      }

      await projectService.updateProject(editedProject._id, fd);

      toast.success("Project updated successfully");
      await reloadProjects();
      await loadAllCostData(); // 🔥 reload brandFinalCost

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
    costSummary.brandFinalCost,
    onOpenChange,
    reloadProjects,
    project,
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
  }, [project, costSummary.brandFinalCost]);

  if (!project || !editedProject) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[85vw]! w-[85vw]! max-h-[90vh] overflow-hidden p-0 m-0 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-50 px-8 py-6 bg-linear-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-linear-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-2">
                  Red Seal Approval Details
                </h2>
                <div className="flex items-center gap-4">
                  <span className="text-lg text-gray-600">
                    {project.autoCode}
                  </span>
                  <Badge className="bg-red-100 text-red-800 text-sm px-3 py-1">
                    🔴 Red Seal Approval
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
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Project
                  </Button>
                  <Button
                    onClick={handleAdvanceToGreenSeal}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" /> Advance to Green
                    Seal
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel Edit
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 rounded-full"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-5 h-5 text-gray-500" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-8 py-8 space-y-10">
            {/* Approval Progress */}
            <div className="space-y-5">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                  <Workflow className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Approval Progress
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

            {/* Product Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Product Details
                </h3>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                {/* Images Section */}
                <div className="flex gap-4 mb-6">
                  <div className="w-44">
                    <div className="bg-gray-50 border rounded-lg p-3 text-center">
                      <div className="w-20 h-20 rounded-lg overflow-hidden mx-auto mb-2 border shadow-sm">
                        <img
                          src={coverImageUrl}
                          alt="cover"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="font-medium text-xs">
                        {project.autoCode}
                      </div>
                      <div className="text-gray-400 text-xs">Sample</div>
                    </div>
                  </div>

                  <div className="flex-1 p-3 bg-gray-50/50 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-gray-800">
                          Images
                        </span>
                      </div>
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        {samples.filter(Boolean).length + (coverPhoto ? 1 : 0)}
                      </Badge>
                    </div>

                    {!isEditing ? (
                      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                        {coverPhoto && (
                          <div className="w-20 h-20 border rounded-md overflow-hidden shrink-0">
                            <img
                              src={coverImageUrl}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {samples.map((s, i) => (
                          <div
                            key={i}
                            className="w-20 h-20 border rounded-md overflow-hidden shrink-0"
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
                              <ImageIcon className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                              <p className="text-xs text-gray-500">No images</p>
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
                          <div key={idx} className="shrink-0 relative">
                            <input
                              ref={(el) => (sampleRefs.current[idx] = el)}
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={(e) => handleSampleUpload(e, idx)}
                            />
                            <div
                              className="w-20 h-20 border rounded-lg overflow-hidden cursor-pointer"
                              onClick={() => sampleRefs.current[idx]?.click()}
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

                {/* Fields Grid */}
                <div className="grid grid-cols-6 gap-4">
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
                            company: companies.find((c) => c._id === v) || null,
                            brand: null,
                            category: null,
                          })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((c) => (
                            <SelectItem key={c._id} value={c._id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1">{project.company?.name}</div>
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
                          {brands.map((b) => (
                            <SelectItem key={b._id} value={b._id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1">{project.brand?.name}</div>
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
                      <div className="mt-1">{project.category?.name}</div>
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
                      <div className="mt-1">{project.type?.name}</div>
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
                      <div className="mt-1">{project.gender || "N/A"}</div>
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
                      <div className="mt-1">{project.artName || "N/A"}</div>
                    )}
                  </div>

                  <div>
                    <Label>Color</Label>
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
                      <div className="mt-1">{project.color || "N/A"}</div>
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
                            country: countries.find((c) => c._id === v) || null,
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
                      <div className="mt-1">{project.country?.name}</div>
                    )}
                  </div>

                  <div>
                    <Label>Priority</Label>
                    {isEditing ? (
                      <Select
                        value={editedProject.priority || ""}
                        onValueChange={(v) =>
                          setEditedProject({ ...editedProject, priority: v })
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
                      <Badge
                        className={
                          project.priority === "high"
                            ? "bg-red-500 text-white"
                            : project.priority === "medium"
                            ? "bg-purple-500 text-white"
                            : "bg-green-600 text-white"
                        }
                      >
                        {project.priority || "N/A"}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <Label>Target Date</Label>
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
                      />
                    ) : (
                      <div className="mt-1">
                        {formatDateDisplay(project?.redSealTargetDate)}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Assigned Person</Label>
                    {isEditing ? (
                      <Select
                        value={editedProject?.assignPerson?._id}
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
                      <div className="mt-1">
                        {project?.assignPerson?.name || "N/A"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Client Feedback */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Client Feedback
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 mb-2 block">
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
                          className="min-h-[100px]"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 min-h-[100px]">
                          {project?.productDesc || "No Description"}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-600 mb-2 block">
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
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select Approval Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ok">Approved</SelectItem>
                            <SelectItem value="update_req">
                              Update Required
                            </SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="review_req">
                              Review Required
                            </SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          className={
                            editedProject.clientApproval === "ok"
                              ? "bg-emerald-100 text-emerald-700"
                              : editedProject.clientApproval === "pending"
                              ? "bg-blue-100 text-blue-700"
                              : editedProject.clientApproval === "update_req"
                              ? "bg-yellow-100 text-yellow-700"
                              : editedProject.clientApproval === "review_req"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-red-100 text-red-700"
                          }
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
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Next Update Schedule
                  </h4>

                  <div className="space-y-4">
                    {/* DATE */}
                    <div>
                      <Label className="text-sm font-medium text-gray-600 mb-2 block">
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
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
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
                      <Label className="text-sm font-medium text-gray-600 mb-2 block">
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
                          className="min-h-[80px]"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 min-h-[80px]">
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
                            <div className="p-4 border rounded-lg bg-gray-50 text-center text-gray-600">
                              <Clock className="w-4 h-4 mx-auto mb-1" />
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
                            className={`p-4 border rounded-lg text-center ${
                              overdue
                                ? "bg-red-50 border-red-200 text-red-700"
                                : "bg-blue-50 border-blue-200 text-blue-700"
                            }`}
                          >
                            <Clock className="w-4 h-4 mx-auto mb-1" />
                            <span className="text-lg font-bold">
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
                <div className="bg-gray-50 border rounded-lg p-4">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
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
                    >
                      <Calendar className="w-4 h-4 mr-1" /> Schedule Next Week
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
                    >
                      <AlertTriangle className="w-4 h-4 mr-1" /> Revision
                      Required
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditedProject({
                          ...editedProject,
                          updateNotes: "Client approved the update.",
                        })
                      }
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Mark Approved
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Cost Breakdown — uses useCostManagement hook data */}
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Cost Breakdown & Final Tentative Cost
                </h3>
              </div>

              <div className="bg-white border-2 border-green-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Cost Analysis & Final Calculations
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="text-center p-6 bg-linear-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-sm">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Calculator className="w-5 h-5 text-green-600" />
                      <div className="text-sm text-green-700 font-semibold tracking-wide uppercase">
                        Tentative Cost
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-green-800 tracking-tight">
                      ₹{costSummary.tentativeCost.toLocaleString()}
                    </div>
                  </div>

                  <div className="text-center p-6 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Award className="w-5 h-5 text-blue-600" />
                      <div className="text-sm text-blue-700 font-semibold tracking-wide uppercase">
                        Brand Final Cost
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="relative flex items-center justify-center gap-1">
                        <span className="text-3xl font-bold text-blue-800">
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
                          className="text-center text-3xl font-bold text-blue-800 bg-white/50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg h-auto w-48 px-2 py-1 shadow-inner"
                          placeholder="0"
                        />
                      </div>
                    ) : (
                      <div className="text-3xl font-bold text-blue-800 tracking-tight">
                        ₹{project.clientFinalCost.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary box */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">
                    Cost Breakdown Summary
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Upper Cost:</span>
                      <span className="font-medium">
                        ₹{costSummary.upperTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Component Cost:</span>
                      <span className="font-medium">
                        ₹{costSummary.componentTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Material Cost:</span>
                      <span className="font-medium">
                        ₹{costSummary.materialTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Packaging Cost:</span>
                      <span className="font-medium">
                        ₹{costSummary.packagingTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Labour + OH:</span>
                      <span className="font-medium">
                        ₹{costSummary.labourTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Miscellaneous:</span>
                      <span className="font-medium">
                        ₹{costSummary.miscTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Separator className="my-3" />
                  <div className="flex justify-between font-semibold mb-3">
                    <span>Total All Costs:</span>
                    <span>₹{costSummary.totalAllCosts.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">
                      Profit ({costSummary.profitMargin}%):
                    </span>
                    <span className="font-medium">
                      +₹{costSummary.profitAmount.toFixed(2)}
                    </span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between font-semibold">
                    <span>Total Tentative Cost:</span>
                    <span>₹{costSummary.tentativeCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Cost Breakdown Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upper Cost Card */}
                <div className="bg-white border-2 border-orange-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-orange-900 mb-4">
                    Upper Cost Breakdown
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-600 bg-orange-50 p-2 rounded">
                      <div>ITEM</div>
                      <div>DESCRIPTION</div>
                      <div>CONSUMPTION</div>
                      <div>
                        COST
                        {isEditing && <span className="ml-1">/ ACTION</span>}
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {costRows.upper.map((item) => (
                        <div
                          key={item._id}
                          className="grid grid-cols-4 gap-2 text-sm py-2 border-b items-center"
                        >
                          {isEditing ? (
                            <>
                              <Input
                                value={item.item}
                                readOnly
                                className="text-sm h-8 bg-gray-50"
                              />
                              <Input
                                value={item.description}
                                readOnly
                                className="text-sm h-8 bg-gray-50"
                              />
                              <Input
                                value={item.consumption}
                                readOnly
                                className="text-sm h-8 bg-gray-50"
                              />
                              <div className="flex items-center gap-1">
                                <div className="relative flex-1">
                                  <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                                  <Input
                                    type="number"
                                    value={item.cost}
                                    onChange={(e) =>
                                      updateItemCost(
                                        item._id,
                                        Number(e.target.value) || 0
                                      )
                                    }
                                    className="pl-6 text-sm h-8"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCostItem(item._id)}
                                  className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium">{item.item}</div>
                              <div className="text-gray-600">
                                {item.description || "-"}
                              </div>
                              <div className="text-gray-600">
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

                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                        onClick={() => openAddItemDialog("upper")}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Item
                      </Button>
                    )}

                    <div className="bg-orange-50 p-3 rounded-lg mt-3">
                      <div className="flex justify-between font-semibold text-orange-900">
                        <span>Total Upper Cost:</span>
                        <span>₹{calculateTotal("upper").toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Component Cost Card */}
                <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-purple-900 mb-4">
                    Component Cost Breakdown
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-600 bg-purple-50 p-2 rounded">
                      <div>COMPONENT</div>
                      <div>DESCRIPTION</div>
                      <div>CONSUMPTION</div>
                      <div>
                        COST
                        {isEditing && <span className="ml-1">/ ACTION</span>}
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {costRows.component.map((item) => (
                        <div
                          key={item._id}
                          className="grid grid-cols-4 gap-2 text-sm py-2 border-b items-center"
                        >
                          {isEditing ? (
                            <>
                              <Input
                                value={item.item}
                                readOnly
                                className="text-sm h-8 bg-gray-50"
                              />
                              <Input
                                value={item.description}
                                readOnly
                                className="text-sm h-8 bg-gray-50"
                              />
                              <Input
                                value={item.consumption}
                                readOnly
                                className="text-sm h-8 bg-gray-50"
                              />
                              <div className="flex items-center gap-1">
                                <div className="relative flex-1">
                                  <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                                  <Input
                                    type="number"
                                    value={item.cost}
                                    onChange={(e) =>
                                      updateItemCost(
                                        item._id,
                                        Number(e.target.value) || 0
                                      )
                                    }
                                    className="pl-6 text-sm h-8"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCostItem(item._id)}
                                  className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium">{item.item}</div>
                              <div className="text-gray-600">
                                {item.description || "-"}
                              </div>
                              <div className="text-gray-600">
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

                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
                        onClick={() => openAddItemDialog("component")}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Component
                      </Button>
                    )}

                    <div className="bg-purple-50 p-3 rounded-lg mt-3">
                      <div className="flex justify-between font-semibold text-purple-900">
                        <span>Total Component Cost:</span>
                        <span>₹{calculateTotal("component").toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Material, Packaging, Labour, Misc sections - keep same pattern (omitted here to save space) */}
                {/* Copy the rest from your original component unchanged. They should use costRows.*, labourCost, updateLabourCost, deleteCostItem, openAddItemDialog, handleAddItem, etc. */}
              </div>

              {/* Final Calculation Summary & Approval Notes — unchanged */}
              <div className="bg-linear-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Final Tentative Cost Calculation
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Total Production Cost:
                    </span>
                    <span className="font-medium">
                      ₹{costSummary.totalAllCosts.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Additional Costs:</span>
                    <span className="font-medium">
                      ₹{costSummary.additionalCosts.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Profit Margin ({costSummary.profitMargin}%):
                    </span>
                    <span className="font-medium">
                      +₹{costSummary.profitAmount.toFixed(2)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg text-green-700">
                    <span>Final Tentative Cost:</span>
                    <span>₹{costSummary.tentativeCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Tentative Cost Approval Notes
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-700">
                      <strong>Cost Calculation Summary:</strong>{" "}
                      {costSummary.remarks || "No remarks added."}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 font-medium">
                      Tentative cost approved and ready for Red Seal development
                      stage
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">
                      Approved on: {new Date().toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
