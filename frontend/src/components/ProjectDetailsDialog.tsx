// ProjectDetailsDialog.tsx - Optimized Version
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

import api from "../lib/api";
import { toast } from "sonner";
import { TentativeCostDialog } from "./TentativeCostDialog";

// ------------------------- Types -------------------------
export interface MasterItem {
  _id: string;
  name: string;
}

export interface ProductDevelopment {
  _id: string;
  autoCode: string;
  company: MasterItem | null;
  brand: MasterItem | null;
  category: MasterItem | null;
  type: MasterItem | null;
  country: MasterItem | null;
  assignPerson: MasterItem | null;
  artName?: string;
  color?: string;
  gender?: string;
  size?: string;
  priority?: string;
  productDesc?: string;
  status?: string;
  redSealTargetDate?: string;
  coverImage?: string | null;
  sampleImages?: string[];
  clientRemarks?: string;
  updateNotes?: string;
  nextUpdateDate?: string;
  clientApproval?: {
    status?: string;
    by?: string | null;
    at?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: ProductDevelopment | null;
  reloadProjects: () => Promise<void>;
  companies: MasterItem[];
  brands: MasterItem[];
  categories: MasterItem[];
  types: MasterItem[];
  countries: MasterItem[];
  assignPersons: MasterItem[];
  setBrands: (items: MasterItem[]) => void;
  setCategories: (items: MasterItem[]) => void;
  setSelectedSubModule?: (sub: string) => void;
}

// ------------------------- Constants -------------------------
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

// ------------------------- Helpers -------------------------
const getStage = (id?: string) =>
  workflowStages.find((s) => s.id === id) || workflowStages[0];

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

// ------------------------- Component -------------------------
export default function ProjectDetailsDialog(props: Props) {
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
  const [edited, setEdited] = useState<ProductDevelopment | null>(null);
  const [tentativeDialogOpen, setTentativeDialogOpen] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [samples, setSamples] = useState<string[]>([]);

  const coverRef = useRef<HTMLInputElement | null>(null);
  const sampleRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 🚀 Memoize computed values
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

  // 🚀 Memoize image URLs
  const coverImageUrl = useMemo(
    () => getFullImageUrl(coverPhoto),
    [coverPhoto]
  );
  const sampleImageUrls = useMemo(
    () => samples.map(getFullImageUrl),
    [samples]
  );

  // 🚀 Initialize state only when dialog opens
  useEffect(() => {
    if (!project || !open) return;
    setEdited({ ...project });
    setCoverPhoto(project.coverImage || null);
    setSamples(project.sampleImages ? [...project.sampleImages] : []);
    setIsEditing(false);
  }, [project, open]);

  // 🚀 Fetch brands - debounced and only in edit mode
  useEffect(() => {
    if (!isEditing || !edited?.company?._id) {
      if (isEditing) setBrands([]);
      return;
    }

    const companyId = edited.company._id;
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
  }, [edited?.company?._id, isEditing, setBrands]);

  // 🚀 Fetch categories - debounced and only in edit mode
  useEffect(() => {
    if (!isEditing || !edited?.company?._id || !edited?.brand?._id) {
      if (isEditing) setCategories([]);
      return;
    }

    const c = edited.company._id;
    const b = edited.brand._id;
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
  }, [edited?.company?._id, edited?.brand?._id, isEditing, setCategories]);

  // 🚀 Memoized callbacks
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

  const updateStatus = useCallback(
    async (newStatus: string) => {
      if (!edited) return;
      const companyId = edited.company?._id;
      const brandId = edited.brand?._id;
      const categoryId = edited.category?._id;
      const projectId = edited._id;

      await api.patch(
        `/companies/${companyId}/brands/${brandId}/categories/${categoryId}/projects/${projectId}/status`,
        { status: newStatus }
      );
    },
    [edited]
  );

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
      await updateStatus(nextStage.id);
      toast.success(`Moved to ${nextStage.name}`);
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update project stage");
    }
  }, [nextStage, updateStatus, onOpenChange]);

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
      if (edited.clientRemarks)
        fd.append("clientRemarks", edited.clientRemarks);
      if (edited.updateNotes) fd.append("updateNotes", edited.updateNotes);
      if (edited.nextUpdateDate)
        fd.append(
          "nextUpdate",
          JSON.stringify({
            date: edited.nextUpdateDate,
            note: edited.updateNotes || "",
          })
        );

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

      const url = `/companies/${edited.company._id}/brands/${edited.brand._id}/categories/${edited.category._id}/projects/${edited._id}`;

      await api.put(url, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Project updated");
      setIsEditing(false);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Update failed", err);
      toast.error(err?.response?.data?.message || "Update failed");
    }
  }, [edited, coverPhoto, samples, onOpenChange]);

  const handleCancelEdit = useCallback(() => {
    if (!project) return;
    setIsEditing(false);
    setEdited({ ...project });
    setCoverPhoto(project.coverImage || null);
    setSamples(project.sampleImages || []);
  }, [project]);

  if (!project || !edited) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[85vw] !w-[85vw] max-h-[90vh] overflow-hidden p-0 m-0 flex flex-col">
        {/* Header */}
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
                <div className="flex items-center gap-4">
                  <span className="text-lg text-gray-600">
                    {project.autoCode}
                  </span>
                  <Badge className={`${currentStage.color} text-sm px-3 py-1`}>
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

              {nextStage && (
                <Button
                  onClick={handleAdvanceStage}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Advance to {nextStage.name}
                </Button>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-8 py-8 space-y-12">
            {/* Workflow Progress */}
            <div>
              <div className="flex items-center gap-5 mb-4">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                  <Workflow className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Development Progress
                </h3>
              </div>

              <div className="bg-white border rounded-xl p-6">
                <div className="mb-6">
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

                <div className="grid grid-cols-6 gap-2">
                  {workflowStages.map((stage, index) => {
                    const isCompleted = currentIndex >= index;
                    const isCurrent = stage.id === edited.status;
                    return (
                      <div
                        key={stage.id}
                        className={`p-2 rounded-lg text-center transition-all ${
                          isCurrent
                            ? "bg-blue-100 border border-blue-400 shadow-md"
                            : isCompleted
                            ? "bg-green-50 border border-green-200"
                            : "bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <div
                          className={`mx-auto mb-1 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
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
                        <span className="text-xs font-medium text-gray-700">
                          {stage.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Product Details
                </h3>
              </div>

              <div className="bg-white border rounded-xl p-6">
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
                          <div className="w-20 h-20 border rounded-md overflow-hidden flex-shrink-0">
                            <img
                              src={coverImageUrl}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {samples.map((s, i) => (
                          <div
                            key={i}
                            className="w-20 h-20 border rounded-md overflow-hidden flex-shrink-0"
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
                        value={edited.company?._id}
                        onValueChange={(v) =>
                          setEdited({
                            ...edited,
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
                        value={edited.brand?._id}
                        onValueChange={(v) =>
                          setEdited({
                            ...edited,
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
                        value={edited.category?._id}
                        onValueChange={(v) =>
                          setEdited({
                            ...edited,
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
                        value={edited.type?._id}
                        onValueChange={(v) =>
                          setEdited({
                            ...edited,
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
                        value={edited.gender || ""}
                        onValueChange={(v) =>
                          setEdited({ ...edited, gender: v })
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
                        value={edited.artName || ""}
                        onChange={(e) =>
                          setEdited({ ...edited, artName: e.target.value })
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
                        value={edited.color || ""}
                        onChange={(e) =>
                          setEdited({ ...edited, color: e.target.value })
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
                        value={edited.country?._id}
                        onValueChange={(v) =>
                          setEdited({
                            ...edited,
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
                        value={edited.priority || ""}
                        onValueChange={(v) =>
                          setEdited({ ...edited, priority: v })
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
                      />
                    ) : (
                      <div className="mt-1">
                        {formatDateDisplay(project.redSealTargetDate)}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Assigned Person</Label>
                    {isEditing ? (
                      <Select
                        value={edited.assignPerson?._id}
                        onValueChange={(v) =>
                          setEdited({
                            ...edited,
                            assignPerson:
                              assignPersons.find((p) => p._id === v) || null,
                          })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {assignPersons.map((p) => (
                            <SelectItem key={p._id} value={p._id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1">
                        {project.assignPerson?.name || "N/A"}
                      </div>
                    )}
                  </div>

                  <div className="col-span-6">
                    <Label>Description</Label>
                    {isEditing ? (
                      <Textarea
                        value={edited.productDesc || ""}
                        onChange={(e) =>
                          setEdited({ ...edited, productDesc: e.target.value })
                        }
                        className="min-h-[80px]"
                      />
                    ) : (
                      <div className="mt-1 bg-gray-50 border rounded-lg p-3 text-sm">
                        {project.productDesc || "No description"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Client Feedback & Next Update */}
            <div className="space-y-10">
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
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Client Feedback
                  </h4>

                  <div className="mb-6">
                    <Label className="text-sm font-medium text-gray-600 mb-2 block">
                      Client Remarks
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={edited.clientRemarks || ""}
                        onChange={(e) =>
                          setEdited({
                            ...edited,
                            clientRemarks: e.target.value,
                          })
                        }
                        className="min-h-[100px]"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 min-h-[100px]">
                        {project.clientRemarks || "No remarks yet"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600 mb-2 block">
                      Approval Status
                    </Label>
                    <Badge
                      className={
                        project.clientApproval?.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : project.clientApproval?.status === "pending"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }
                    >
                      {project.clientApproval?.status === "approved"
                        ? "✓ Approved"
                        : project.clientApproval?.status === "pending"
                        ? "⏳ Pending"
                        : "⚠ Revision Needed"}
                    </Badge>
                  </div>
                </div>

                {/* Next Update */}
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Next Update Schedule
                  </h4>

                  <div className="mb-6">
                    <Label className="text-sm font-medium text-gray-600 mb-2 block">
                      Next Update Date
                    </Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={edited.nextUpdateDate || ""}
                        onChange={(e) =>
                          setEdited({
                            ...edited,
                            nextUpdateDate: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-900">
                          {project.nextUpdateDate
                            ? formatDateDisplay(project.nextUpdateDate)
                            : "Not scheduled"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <Label className="text-sm font-medium text-gray-600 mb-2 block">
                      Update Notes
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={edited.updateNotes || ""}
                        onChange={(e) =>
                          setEdited({ ...edited, updateNotes: e.target.value })
                        }
                        className="min-h-[80px]"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 min-h-[80px]">
                        {project.updateNotes || "No update notes"}
                      </div>
                    )}
                  </div>

                  <div>
                    {(() => {
                      const next =
                        edited.nextUpdateDate || project.nextUpdateDate;
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
                        setEdited({
                          ...edited,
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
                        setEdited({
                          ...edited,
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
                        setEdited({
                          ...edited,
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
          </div>
        </div>

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
