// ProjectDetailsDialog.tsx
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  Eye,
  Edit2,
  ArrowRight,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Workflow,
  Target,
  X,
  Save,
  Upload,
  Trash2,
  Plus,
  ImageIcon,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "./ui/select";

import { toast } from "sonner";
import { TentativeCostDialog } from "./TentativeCostDialog";
import { useProjects } from "../hooks/useProjects";
import { useERP } from "../lib/stores/erpContext";
import { useRedirect } from "../hooks/useRedirect";

export default function ProjectDetailsDialog(props: any) {
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
    loadBrandsByCompany,
    loadCategoriesByBrand,
    setBrands,
    setCategories,
    reloadProjects,
    setSelectedSubModule,
  } = props;

  const { updateProject, updateProjectStatus } = useProjects();

  const { goTo } = useRedirect();
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState<any | null>(null);
  const [tentativeDialogOpen, setTentativeDialogOpen] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [samples, setSamples] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const coverRef = useRef<HTMLInputElement | null>(null);
  const sampleRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const getStage = (id?: string) =>
    workflowStages.find((s) => s.id === id) || workflowStages[0];

  // utilities
  const getFullImageUrl = (img?: string | null) => {
    if (!img) return "";
    if (img.startsWith("http") || img.startsWith("data:")) return img;
    return `${import.meta.env.VITE_BACKEND_URL}/${img}`;
  };

  const formatDateDisplay = (d?: string | null) => {
    if (!d) return "TBD";
    try {
      return new Date(d).toLocaleDateString("en-GB");
    } catch {
      return d;
    }
  };

  useEffect(() => {
    if (!project || !open) return;
    console.log("Incoming project 👉", project);
    setEdited({
      ...project,
      nextUpdateDate: project?.nextUpdate?.date || "",
      updateNotes: project?.nextUpdate?.note || "",
    });

    setCoverPhoto(project.coverImage || null);
    setSamples(project.sampleImages ? [...project.sampleImages] : []);
    setIsEditing(false);
  }, [project, open]);

  useEffect(() => {
    if (!isEditing) return;
    if (edited?.company?._id) {
      loadBrandsByCompany(edited.company._id);
    } else {
      setBrands([]);
    }
  }, [edited?.company?._id, isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    if (edited?.company?._id && edited?.brand?._id) {
      loadCategoriesByBrand(edited.company._id, edited.brand._id);
    } else {
      setCategories([]);
    }
  }, [edited?.brand?._id, edited?.company?._id, isEditing]);

  const currentStage = useMemo(
    () => getStage(edited?.status),
    [edited?.status]
  );
  const currentIndex = useMemo(
    () => workflowStages.findIndex((s) => s.id === edited?.status),
    [edited?.status]
  );
  const nextStage = useMemo(
    () =>
      currentIndex >= 0 && currentIndex < workflowStages.length - 1
        ? workflowStages[currentIndex + 1]
        : null,
    [currentIndex]
  );

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

  const dataUrlToFile = (dataUrl: string, filename: string) => {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8 = new Uint8Array(n);
    while (n--) u8[n] = bstr.charCodeAt(n);
    return new File([u8], filename, { type: mime });
  };

  const handleSave = useCallback(async () => {
    if (!edited) return;

    if (!edited.company?._id || !edited.brand?._id || !edited.category?._id) {
      toast.error("Company, Brand and Category are required");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("company", edited.company._id);
      fd.append("brand", edited.brand._id);
      fd.append("category", edited.category._id);

      if (edited.type) fd.append("type", String(edited.type._id));
      if (edited.country) fd.append("country", String(edited.country._id));
      if (edited.assignPerson)
        fd.append("assignPerson", String(edited.assignPerson._id));
      if (edited.artName) fd.append("artName", edited.artName);
      if (edited.color) fd.append("color", edited.color);
      if (edited.size) fd.append("size", edited.size);
      if (edited.gender) fd.append("gender", edited.gender);
      if (edited.priority) fd.append("priority", edited.priority);
      if (edited.productDesc) fd.append("productDesc", edited.productDesc);
      if (edited.redSealTargetDate)
        fd.append("redSealTargetDate", edited.redSealTargetDate);
      if (edited.clientApproval)
        fd.append("clientApproval", edited.clientApproval);

      if (edited.nextUpdateDate) {
        fd.append(
          "nextUpdate",
          JSON.stringify({
            date: edited.nextUpdateDate,
            note: edited.updateNotes || "",
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

      await updateProject(edited._id, fd);

      toast.success("Project updated");
      setIsEditing(false);
      onOpenChange(false);
      await reloadProjects();
    } catch (err: any) {
      console.error("Update failed", err);
      toast.error(err?.response?.data?.message || "Update failed");
    }
  }, [
    edited,
    coverPhoto,
    samples,
    updateProject,
    onOpenChange,
    reloadProjects,
  ]);

  const handleAdvanceStage = useCallback(async () => {
    if (!nextStage) {
      toast.info("Project is already at the final stage");
      return;
    }

    if (nextStage.id === "red_seal") {
      setTentativeDialogOpen(true);
      return;
    }

    try {
      await updateProjectStatus(edited._id, nextStage.id);
      toast.success(`Moved to ${nextStage.name}`);
      onOpenChange(false);
      await reloadProjects();

      console.log("redirecting ......");

      goTo("rd-management", "red_seal");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update project stage");
    }
  }, [nextStage, edited, updateProjectStatus, onOpenChange, reloadProjects]);

  const handleCancelEdit = useCallback(() => {
    if (!project) return;
    setIsEditing(false);
    setEdited({ ...project });
    setCoverPhoto(project.coverImage || null);
    setSamples(project.sampleImages || []);
  }, [project]);

  if (!project || !edited) return null;

  const nextStageLocal =
    currentIndex >= 0 && currentIndex < workflowStages.length - 1
      ? workflowStages[currentIndex + 1]
      : null;

  const coverImageUrl = getFullImageUrl(coverPhoto);

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
              <div className="w-10 h-10 md:w-14 md:h-14 bg-linear-to-br from-[#0c9dcb] to-[#26b4e0] rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <Eye className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-1 md:mb-2 truncate">
                  Project Details
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
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
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

              {nextStageLocal && !isMobile && (
                <Button
                  onClick={handleAdvanceStage}
                  className="bg-emerald-500 hover:bg-emerald-600 text-xs md:text-sm"
                  size={isMobile ? "sm" : "default"}
                >
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  {isMobile ? "Next" : `Advance to ${nextStageLocal.name}`}
                </Button>
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
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`pb-2 px-1 text-sm font-medium whitespace-nowrap ${
                    activeTab === "timeline"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setActiveTab("feedback")}
                  className={`pb-2 px-1 text-sm font-medium whitespace-nowrap ${
                    activeTab === "feedback"
                      ? "border-b-2 border-blue-500 text-blue-600"
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
            {/* Workflow Progress - Show only on timeline tab on mobile */}
            {(!isMobile || activeTab === "timeline") && (
              <div>
                <div className="flex items-center gap-4 md:gap-5 mb-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                    <Workflow className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                    Development Progress
                  </h3>
                </div>

                <div className="bg-white border rounded-xl p-4 md:p-6">
                  <div className="mb-4 md:mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 text-sm">
                        Overall Progress
                      </span>
                      <span className="font-semibold text-gray-900">
                        {currentStage.progress}%
                      </span>
                    </div>
                    <Progress value={currentStage.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-6 gap-1 md:gap-2">
                    {workflowStages.map((stage, index) => {
                      const isCompleted = currentIndex >= index;
                      const isCurrent = stage.id === edited.status;
                      return (
                        <div
                          key={stage.id}
                          className={`p-1 md:p-2 rounded-lg text-center transition-all ${
                            isCurrent
                              ? "bg-blue-100 border border-blue-400 shadow-md"
                              : isCompleted
                              ? "bg-green-50 border border-green-200"
                              : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <div
                            className={`mx-auto mb-1 w-4 h-4 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs ${
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
                          <span className="text-[10px] md:text-xs font-medium text-gray-700 truncate block">
                            {stage.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Product Details - Show only on details tab on mobile */}
            {(!isMobile || activeTab === "details") && (
              <div>
                <div className="flex items-center gap-4 md:gap-5 mb-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                    <Target className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                    Product Details
                  </h3>
                </div>

                <div className="bg-white border rounded-xl p-4 md:p-6">
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="w-full md:w-44">
                      <div className="bg-gray-50 border rounded-lg p-3 text-center">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden mx-auto mb-2 border shadow-sm">
                          <img
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
                            Images (
                            {samples.filter(Boolean).length +
                              (coverPhoto ? 1 : 0)}
                            )
                          </span>
                        </div>
                      </div>

                      {!isEditing ? (
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                          {coverPhoto && (
                            <div className="w-16 h-16 md:w-20 md:h-20 border rounded-md overflow-hidden shrink-0">
                              <img
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
                                src={getFullImageUrl(s)}
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
                                    src={getFullImageUrl(s)}
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

                  {/* Fields grid */}
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
                          value={edited.company?._id}
                          onValueChange={(v) =>
                            setEdited({
                              ...edited,
                              company:
                                companies.find((c: any) => c._id === v) || null,
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
                          value={edited.brand?._id}
                          onValueChange={(v) =>
                            setEdited({
                              ...edited,
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
                          value={edited.category?._id}
                          onValueChange={(v) =>
                            setEdited({
                              ...edited,
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
                          value={edited.type?._id}
                          onValueChange={(v) =>
                            setEdited({
                              ...edited,
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
                          value={edited.gender || ""}
                          onValueChange={(v) =>
                            setEdited({ ...edited, gender: v })
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
                          value={edited.artName || ""}
                          onChange={(e) =>
                            setEdited({ ...edited, artName: e.target.value })
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
                          value={edited.color || ""}
                          onChange={(e) =>
                            setEdited({ ...edited, color: e.target.value })
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
                          value={edited.country?._id}
                          onValueChange={(v) =>
                            setEdited({
                              ...edited,
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
                          value={edited.priority || ""}
                          onValueChange={(v) =>
                            setEdited({ ...edited, priority: v })
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
                          {project.priority || "N/A"}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs md:text-sm">Target Date</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={
                            edited.redSealTargetDate
                              ? edited.redSealTargetDate.split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            setEdited({
                              ...edited,
                              redSealTargetDate: e.target.value,
                            })
                          }
                          className="h-8 md:h-10 text-xs md:text-sm"
                        />
                      ) : (
                        <div className="mt-1 text-sm">
                          {formatDateDisplay(project.redSealTargetDate)}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs md:text-sm">
                        Assigned Person
                      </Label>
                      {isEditing ? (
                        <Select
                          value={edited.assignPerson?._id}
                          onValueChange={(v) =>
                            setEdited({
                              ...edited,
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
                            {assignPersons.map((p: any) => (
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
                          {project.assignPerson?.name || "N/A"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Client Feedback & Next Update - Show only on feedback tab on mobile */}
            {(!isMobile || activeTab === "feedback") && (
              <div className="space-y-6 md:space-y-10">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                    <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                    Client Feedback & Updates
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-white border rounded-lg p-4 md:p-6">
                    <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                      Client Feedback
                    </h4>
                    <div className="mb-4 md:mb-6">
                      <Label className="text-xs md:text-sm font-medium text-gray-600 mb-2 block">
                        Description
                      </Label>
                      {isEditing ? (
                        <Textarea
                          value={edited.productDesc || ""}
                          onChange={(e) =>
                            setEdited({
                              ...edited,
                              productDesc: e.target.value,
                            })
                          }
                          className="min-h-20 md:min-h-[100px] text-xs md:text-sm"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg text-xs md:text-sm text-gray-700 min-h-20 md:min-h-[100px]">
                          {project.productDesc || "No Description"}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs md:text-sm font-medium text-gray-600 mb-2 block">
                        Approval Status
                      </Label>
                      {isEditing ? (
                        <Select
                          value={edited.clientApproval || "pending"}
                          onValueChange={(value) =>
                            setEdited({ ...edited, clientApproval: value })
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
                              edited.clientApproval === "ok"
                                ? "bg-emerald-100 text-emerald-700"
                                : edited.clientApproval === "pending"
                                ? "bg-blue-100 text-blue-700"
                                : edited.clientApproval === "update_req"
                                ? "bg-yellow-100 text-yellow-700"
                                : edited.clientApproval === "review_req"
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
                            }[edited.clientApproval || "pending"]
                          }
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4 md:p-6">
                    <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                      Next Update Schedule
                    </h4>

                    <div className="mb-4 md:mb-6">
                      <Label className="text-xs md:text-sm font-medium text-gray-600 mb-2 block">
                        Next Update Date
                      </Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={
                            edited.nextUpdateDate
                              ? edited.nextUpdateDate.split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            setEdited({
                              ...edited,
                              nextUpdateDate: e.target.value,
                            })
                          }
                          className="h-8 md:h-10 text-xs md:text-sm"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs md:text-sm">
                          <Calendar className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                          <span className="text-gray-900">
                            {project?.nextUpdate?.date
                              ? formatDateDisplay(project?.nextUpdate?.date)
                              : "Not scheduled"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4 md:mb-6">
                      <Label className="text-xs md:text-sm font-medium text-gray-600 mb-2 block">
                        Update Notes
                      </Label>
                      {isEditing ? (
                        <Textarea
                          value={edited.updateNotes || ""}
                          onChange={(e) =>
                            setEdited({
                              ...edited,
                              updateNotes: e.target.value,
                            })
                          }
                          className="min-h-16 md:min-h-20 text-xs md:text-sm"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg text-xs md:text-sm text-gray-700 min-h-16 md:min-h-20">
                          {project?.nextUpdate?.note || "No update notes"}
                        </div>
                      )}
                    </div>

                    <div>
                      {(() => {
                        const next = edited.nextUpdateDate;
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
                          setEdited({
                            ...edited,
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
                          setEdited({
                            ...edited,
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
                          setEdited({
                            ...edited,
                            updateNotes: "Client approved the update.",
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
          </div>
        </div>

        {/* Mobile Next Stage Button - Fixed at bottom on mobile */}
        {isMobile && nextStageLocal && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
            <Button
              onClick={handleAdvanceStage}
              className="w-full bg-emerald-500 hover:bg-emerald-600"
              size="lg"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Advance to {nextStageLocal.name}
            </Button>
          </div>
        )}

        <TentativeCostDialog
          open={tentativeDialogOpen}
          onOpenChange={setTentativeDialogOpen}
          project={{ ...edited, _id: edited._id }}
          onApproved={async () => {
            await reloadProjects();
            setTentativeDialogOpen(false);
            onOpenChange(false);
            setSelectedSubModule?.("red-seal");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
