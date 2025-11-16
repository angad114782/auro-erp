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
  Percent,
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

// Cost item interface matching backend
interface CostItem {
  _id: string;
  item: string;
  description: string;
  consumption: string;
  cost: number;
  department?: string;
}

// Labour cost interface
interface LabourCost {
  directTotal: number;
  items: Array<{
    _id: string;
    name: string;
    cost: number;
  }>;
}

// Cost summary interface
interface CostSummary {
  additionalCosts: number;
  profitMargin: number;
  remarks: string;
  upperTotal: number;
  componentTotal: number;
  materialTotal: number;
  packagingTotal: number;
  miscTotal: number;
  labourTotal: number;
  totalAllCosts: number;
  profitAmount: number;
  tentativeCost: number;
  brandFinalCost: number;
  status: "draft" | "ready_for_red_seal";
}

// Add New Item Dialog Component
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
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New {category.charAt(0).toUpperCase() + category.slice(1)} Item
        </DialogTitle>
        <DialogDescription>
          Add a new item to the {category} cost breakdown
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor={`item-${category}`}>Item Name *</Label>
          <Input
            id={`item-${category}`}
            value={formData.item}
            onChange={(e) => onFormChange("item", e.target.value)}
            placeholder="Enter item name"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`description-${category}`}>Description</Label>
          <Input
            id={`description-${category}`}
            value={formData.description}
            onChange={(e) => onFormChange("description", e.target.value)}
            placeholder="Enter description (optional)"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`consumption-${category}`}>Consumption</Label>
          <Input
            id={`consumption-${category}`}
            value={formData.consumption}
            onChange={(e) => onFormChange("consumption", e.target.value)}
            placeholder="Enter consumption details (optional)"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`cost-${category}`}>Cost *</Label>
          <div className="relative mt-1">
            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id={`cost-${category}`}
              type="number"
              value={formData.cost || ""}
              onChange={(e) =>
                onFormChange("cost", Number(e.target.value) || 0)
              }
              placeholder="0.00"
              className="pl-10"
              min="0"
              step="0.01"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onAddItem}>Add Item</Button>
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

export function RedSealProjectDetailsDialog(props: Props) {
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

  // Image states
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [samples, setSamples] = useState<string[]>([]);
  const coverRef = React.useRef<HTMLInputElement | null>(null);
  const sampleRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Cost states
  const [costRows, setCostRows] = useState<{
    upper: CostItem[];
    component: CostItem[];
    material: CostItem[];
    packaging: CostItem[];
    miscellaneous: CostItem[];
  }>({
    upper: [],
    component: [],
    material: [],
    packaging: [],
    miscellaneous: [],
  });

  const [labourCost, setLabourCost] = useState<LabourCost>({
    directTotal: 0,
    items: [],
  });

  const [costSummary, setCostSummary] = useState<CostSummary>({
    additionalCosts: 0,
    profitMargin: 25,
    remarks: "",
    upperTotal: 0,
    componentTotal: 0,
    materialTotal: 0,
    packagingTotal: 0,
    miscTotal: 0,
    labourTotal: 0,
    totalAllCosts: 0,
    profitAmount: 0,
    tentativeCost: 0,
    brandFinalCost: 0,
    status: "draft",
  });

  // Dialog states for adding items
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

  // Initialize state when dialog opens
  useEffect(() => {
    if (!project || !open) return;

    setEditedProject({ ...project });
    setCoverPhoto(project.coverImage || null);
    setSamples(project.sampleImages ? [...project.sampleImages] : []);
    setIsEditing(false);

    // Load cost data
    loadAllCostData();
  }, [project, open]);

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

  // Load all cost data from backend
  const loadAllCostData = async () => {
    if (!project) return;

    setIsLoading(true);
    try {
      // Load cost summary
      const summaryResponse = await api.get(`/projects/${project._id}/costs`);
      const summaryData = summaryResponse.data.summary || summaryResponse.data;

      if (summaryData) {
        setCostSummary({
          additionalCosts: Number(summaryData.additionalCosts) || 0,
          profitMargin: Number(summaryData.profitMargin) || 25,
          remarks: summaryData.remarks || "",
          upperTotal: Number(summaryData.upperTotal) || 0,
          componentTotal: Number(summaryData.componentTotal) || 0,
          materialTotal: Number(summaryData.materialTotal) || 0,
          packagingTotal: Number(summaryData.packagingTotal) || 0,
          miscTotal: Number(summaryData.miscTotal) || 0,
          labourTotal: Number(summaryData.labourTotal) || 0,
          totalAllCosts: Number(summaryData.totalAllCosts) || 0,
          profitAmount: Number(summaryData.profitAmount) || 0,
          tentativeCost: Number(summaryData.tentativeCost) || 0,
          brandFinalCost: Number(summaryData.brandFinalCost) || 0,
          status: summaryData.status || "draft",
        });
      }

      // Load cost rows
      const sections = [
        "upper",
        "component",
        "material",
        "packaging",
        "miscellaneous",
      ];
      const rowPromises = sections.map((section) =>
        api.get(`/projects/${project._id}/costs/${section}`)
      );
      const rowResponses = await Promise.all(rowPromises);

      const newCostRows = {
        upper: Array.isArray(rowResponses[0]?.data?.rows)
          ? rowResponses[0].data.rows.map((item: any) => ({
              _id: item._id,
              item: item.item || "",
              description: item.description || "",
              consumption: item.consumption || "",
              cost: Number(item.cost) || 0,
              department: item.department || "",
            }))
          : [],
        component: Array.isArray(rowResponses[1]?.data?.rows)
          ? rowResponses[1].data.rows.map((item: any) => ({
              _id: item._id,
              item: item.item || "",
              description: item.description || "",
              consumption: item.consumption || "",
              cost: Number(item.cost) || 0,
              department: item.department || "",
            }))
          : [],
        material: Array.isArray(rowResponses[2]?.data?.rows)
          ? rowResponses[2].data.rows.map((item: any) => ({
              _id: item._id,
              item: item.item || "",
              description: item.description || "",
              consumption: item.consumption || "",
              cost: Number(item.cost) || 0,
            }))
          : [],
        packaging: Array.isArray(rowResponses[3]?.data?.rows)
          ? rowResponses[3].data.rows.map((item: any) => ({
              _id: item._id,
              item: item.item || "",
              description: item.description || "",
              consumption: item.consumption || "",
              cost: Number(item.cost) || 0,
            }))
          : [],
        miscellaneous: Array.isArray(rowResponses[4]?.data?.rows)
          ? rowResponses[4].data.rows.map((item: any) => ({
              _id: item._id,
              item: item.item || "",
              description: item.description || "",
              consumption: item.consumption || "",
              cost: Number(item.cost) || 0,
            }))
          : [],
      };

      setCostRows(newCostRows);

      // Load labour cost
      const labourResponse = await api.get(
        `/projects/${project._id}/costs/labour`
      );
      const labourData = labourResponse.data.labour || labourResponse.data;

      if (labourData) {
        setLabourCost({
          directTotal: Number(labourData.directTotal) || 0,
          items: Array.isArray(labourData.items)
            ? labourData.items.map((item: any) => ({
                _id: item._id,
                name: item.name || "",
                cost: Number(item.cost) || 0,
              }))
            : [],
        });
      }
    } catch (error) {
      console.error("Failed to load cost data:", error);
      toast.error("Failed to load cost data");
    } finally {
      setIsLoading(false);
    }
  };

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

  // Cost item management
  const updateItemCost = async (itemId: string, cost: number) => {
    if (!project) return;

    try {
      let section: string | null = null;
      for (const [sec, items] of Object.entries(costRows)) {
        if (items.find((item) => item._id === itemId)) {
          section = sec;
          break;
        }
      }

      if (!section) return;

      await api.patch(`/projects/${project._id}/costs/${section}/${itemId}`, {
        cost: Number(cost) || 0,
      });

      setCostRows((prev) => ({
        ...prev,
        [section as string]: prev[section as keyof typeof prev].map((item) =>
          item._id === itemId ? { ...item, cost: Number(cost) || 0 } : item
        ),
      }));

      await loadAllCostData();
    } catch (error) {
      console.error("Failed to update item cost:", error);
      toast.error("Failed to update item cost");
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!project) return;

    try {
      let section: string | null = null;
      for (const [sec, items] of Object.entries(costRows)) {
        if (items.find((item) => item._id === itemId)) {
          section = sec;
          break;
        }
      }

      if (!section) return;

      await api.delete(`/projects/${project._id}/costs/${section}/${itemId}`);

      setCostRows((prev) => ({
        ...prev,
        [section as string]: prev[section as keyof typeof prev].filter(
          (item) => item._id !== itemId
        ),
      }));

      await loadAllCostData();
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast.error("Failed to delete item");
    }
  };

  const updateDefaultItem = (
    section: string,
    key: string,
    field: "item" | "description" | "consumption" | "cost",
    value: string | number
  ) => {
    setCostRows((prev) => ({
      ...prev,
      [section]: prev[section as keyof typeof prev].map((item) =>
        item._id === key
          ? { ...item, [field]: field === "cost" ? Number(value) || 0 : value }
          : item
      ),
    }));
  };

  // Dialog management
  const openAddItemDialog = (category: string) => {
    setAddItemDialogs((prev) => ({ ...prev, [category]: true }));
  };

  const closeAddItemDialog = (category: string) => {
    setAddItemDialogs((prev) => ({ ...prev, [category]: false }));
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
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value,
      },
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
      const payload = {
        item: form.item.trim(),
        description: form.description || "",
        consumption: form.consumption || "",
        cost: Number(form.cost) || 0,
      };

      const response = await api.post(
        `/projects/${project._id}/costs/${category}`,
        payload
      );

      if (response.data.row) {
        setCostRows((prev) => ({
          ...prev,
          [category]: [
            ...prev[category as keyof typeof prev],
            {
              _id: response.data.row._id,
              item: response.data.row.item || "",
              description: response.data.row.description || "",
              consumption: response.data.row.consumption || "",
              cost: Number(response.data.row.cost) || 0,
              department: response.data.row.department || "",
            },
          ],
        }));
      }

      await loadAllCostData();
      closeAddItemDialog(category);
      toast.success(`New ${category} item added successfully!`);
    } catch (error) {
      console.error("Failed to add item:", error);
      toast.error("Failed to add item");
    }
  };

  const updateLabourCost = async (value: number) => {
    if (!project) return;

    try {
      await api.patch(`/projects/${project._id}/costs/labour`, {
        directTotal: Number(value) || 0,
      });

      setLabourCost((prev) => ({ ...prev, directTotal: Number(value) || 0 }));
      await loadAllCostData();
    } catch (error) {
      console.error("Failed to update labour cost:", error);
      toast.error("Failed to update labour cost");
    }
  };

  const updateBrandFinalCost = async (value: number) => {
    if (!project) return;

    try {
      await api.patch(`/projects/${project._id}/costs`, {
        brandFinalCost: Number(value) || 0,
      });

      setCostSummary((prev) => ({
        ...prev,
        brandFinalCost: Number(value) || 0,
      }));
    } catch (error) {
      console.error("Failed to update brand final cost:", error);
      toast.error("Failed to update brand final cost");
    }
  };

  const updateStatus = useCallback(
    async (newStatus: string) => {
      if (!editedProject) return;
      const companyId = editedProject.company?._id;
      const brandId = editedProject.brand?._id;
      const categoryId = editedProject.category?._id;
      const projectId = editedProject._id;

      await api.patch(
        `/companies/${companyId}/brands/${brandId}/categories/${categoryId}/projects/${projectId}/status`,
        { status: newStatus }
      );
    },
    [editedProject]
  );

  const handleAdvanceToGreenSeal = useCallback(async () => {
    try {
      await updateStatus(nextStage?.id!);
      toast.success(`Moved to ${nextStage?.name}`);
      await reloadProjects();
      setSelectedSubModule?.("green-seal");
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update project stage");
    }
  }, [
    nextStage,
    updateStatus,
    onOpenChange,
    reloadProjects,
    setSelectedSubModule,
  ]);

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

      if (editedProject.nextUpdateDate)
        fd.append(
          "nextUpdate",
          JSON.stringify({
            date: editedProject.nextUpdateDate,
            note: editedProject.updateNotes || "",
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
  }, [editedProject, coverPhoto, samples, onOpenChange, reloadProjects]);

  const handleCancelEdit = useCallback(() => {
    if (!project) return;
    setIsEditing(false);
    setEditedProject({ ...project });
    setCoverPhoto(project.coverImage || null);
    setSamples(project.sampleImages || []);
  }, [project]);

  const calculateTotal = (section: keyof typeof costRows) => {
    return costRows[section].reduce((sum, item) => sum + (item.cost || 0), 0);
  };

  if (!project || !editedProject) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[85vw] !w-[85vw] max-h-[90vh] overflow-hidden p-0 m-0 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-50 px-8 py-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-semibold text-gray-900 mb-2">
                  Red Seal Approval Details
                </DialogTitle>
                <DialogDescription className="sr-only">
                  View and manage Red Seal Approval project details
                </DialogDescription>
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
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Project
                  </Button>
                  <Button
                    onClick={handleAdvanceToGreenSeal}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Advance to Green Seal
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
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
                          value={editedProject.productDesc || ""}
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
                          {project.productDesc || "No Description"}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-600 mb-2 block">
                        Approval Status
                      </Label>
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
                    <div>
                      <Label className="text-sm font-medium text-gray-600 mb-2 block">
                        Next Update Date
                      </Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedProject.nextUpdateDate || ""}
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
                            {project?.nextUpdate?.date
                              ? formatDateDisplay(project.nextUpdate?.date)
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
                          className="min-h-[80px]"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 min-h-[80px]">
                          {project.nextUpdate?.note || "No update notes"}
                        </div>
                      )}
                    </div>

                    <div>
                      {(() => {
                        const next =
                          editedProject.nextUpdateDate ||
                          project.nextUpdateDate;
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

            {/* Cost Breakdown */}
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Cost Breakdown & Final Tentative Cost
                </h3>
              </div>

              {/* Cost Analysis */}
              <div className="bg-white border-2 border-green-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Cost Analysis & Final Calculations
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Tentative Cost */}
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-sm">
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

                  {/* Brand Final Cost */}
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
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
                          value={costSummary.brandFinalCost || ""}
                          onChange={(e) =>
                            updateBrandFinalCost(Number(e.target.value))
                          }
                          className="text-center text-3xl font-bold text-blue-800 bg-white/50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg h-auto w-48 px-2 py-1 shadow-inner"
                          placeholder="0"
                        />
                      </div>
                    ) : (
                      <div className="text-3xl font-bold text-blue-800 tracking-tight">
                        ₹{costSummary.brandFinalCost.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cost Breakdown Summary */}
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
                                        Number(e.target.value)
                                      )
                                    }
                                    className="pl-6 text-sm h-8"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteItem(item._id)}
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
                                        Number(e.target.value)
                                      )
                                    }
                                    className="pl-6 text-sm h-8"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteItem(item._id)}
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

                {/* Material Cost Card */}
                <div className="bg-white border-2 border-teal-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-teal-900 mb-4">
                    Material Cost Breakdown
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-600 bg-teal-50 p-2 rounded">
                      <div>MATERIAL</div>
                      <div>DESCRIPTION</div>
                      <div>CONSUMPTION</div>
                      <div>
                        COST
                        {isEditing && <span className="ml-1">/ ACTION</span>}
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {costRows.material.map((item) => (
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
                                        Number(e.target.value)
                                      )
                                    }
                                    className="pl-6 text-sm h-8"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteItem(item._id)}
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
                        className="w-full text-teal-600 border-teal-200 hover:bg-teal-50"
                        onClick={() => openAddItemDialog("material")}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Material
                      </Button>
                    )}

                    <div className="bg-teal-50 p-3 rounded-lg mt-3">
                      <div className="flex justify-between font-semibold text-teal-900">
                        <span>Total Material Cost:</span>
                        <span>₹{calculateTotal("material").toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Packaging & Labour Card */}
                <div className="bg-white border-2 border-indigo-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-indigo-900 mb-4">
                    Packaging & Labour Costs
                  </h4>
                  <div className="space-y-4">
                    {/* Packaging Section */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">
                        Packaging Cost
                      </h5>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {costRows.packaging.map((item) => (
                          <div
                            key={item._id}
                            className="flex justify-between text-sm items-center"
                          >
                            {isEditing ? (
                              <>
                                <Input
                                  value={item.item}
                                  readOnly
                                  className="text-sm h-8 flex-1 mr-2 bg-gray-50"
                                />
                                <div className="flex items-center gap-1">
                                  <div className="relative w-24">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                                    <Input
                                      type="number"
                                      value={item.cost}
                                      onChange={(e) =>
                                        updateItemCost(
                                          item._id,
                                          Number(e.target.value)
                                        )
                                      }
                                      className="pl-6 text-sm h-8"
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteItem(item._id)}
                                    className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-gray-600">
                                  {item.item}:
                                </span>
                                <span className="font-medium">
                                  ₹{item.cost.toFixed(2)}
                                </span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>

                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 mt-2"
                          onClick={() => openAddItemDialog("packaging")}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Packaging Item
                        </Button>
                      )}

                      <div className="bg-indigo-50 p-2 rounded mt-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Packaging Subtotal:</span>
                          <span>₹{calculateTotal("packaging").toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Labour Cost */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">
                        Labour + OH Cost
                      </h5>
                      <div className="bg-indigo-50 p-2 rounded">
                        <div className="flex justify-between text-sm font-medium items-center">
                          <span>Total Labour Cost:</span>
                          {isEditing ? (
                            <div className="relative w-32">
                              <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                              <Input
                                type="number"
                                value={labourCost.directTotal}
                                onChange={(e) =>
                                  updateLabourCost(Number(e.target.value))
                                }
                                className="pl-6 text-sm h-8"
                              />
                            </div>
                          ) : (
                            <span>₹{labourCost.directTotal.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Miscellaneous Cost */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">
                        Miscellaneous Cost
                      </h5>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {costRows.miscellaneous.map((item) => (
                          <div
                            key={item._id}
                            className="flex justify-between text-sm items-center"
                          >
                            {isEditing ? (
                              <>
                                <Input
                                  value={item.item}
                                  readOnly
                                  className="text-sm h-8 flex-1 mr-2 bg-gray-50"
                                />
                                <div className="flex items-center gap-1">
                                  <div className="relative w-24">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                                    <Input
                                      type="number"
                                      value={item.cost}
                                      onChange={(e) =>
                                        updateItemCost(
                                          item._id,
                                          Number(e.target.value)
                                        )
                                      }
                                      className="pl-6 text-sm h-8"
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteItem(item._id)}
                                    className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-gray-600">
                                  {item.item}:
                                </span>
                                <span className="font-medium">
                                  ₹{item.cost.toFixed(2)}
                                </span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>

                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 mt-2"
                          onClick={() => openAddItemDialog("miscellaneous")}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Miscellaneous Item
                        </Button>
                      )}

                      <div className="bg-indigo-50 p-2 rounded mt-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Miscellaneous Subtotal:</span>
                          <span>
                            ₹{calculateTotal("miscellaneous").toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Calculation Summary */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-6">
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

              {/* Approval Notes */}
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
