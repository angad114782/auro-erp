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
import { toast } from "sonner@2.0.3";
import { useERPStore } from "../lib/data-store";
import type { RDProject } from "../lib/data-store";

interface RedSealProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: RDProject | null;
}

// Add New Item Dialog Component
const AddNewItemDialog = ({ 
  category, 
  isOpen, 
  onClose, 
  formData, 
  onFormChange, 
  onAddItem 
}: { 
  category: string;
  isOpen: boolean;
  onClose: () => void;
  formData: { item: string; description: string; consumption: string; cost: number };
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
            onChange={(e) => onFormChange('item', e.target.value)}
            placeholder="Enter item name"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`description-${category}`}>Description</Label>
          <Input
            id={`description-${category}`}
            value={formData.description}
            onChange={(e) => onFormChange('description', e.target.value)}
            placeholder="Enter description (optional)"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`consumption-${category}`}>Consumption</Label>
          <Input
            id={`consumption-${category}`}
            value={formData.consumption}
            onChange={(e) => onFormChange('consumption', e.target.value)}
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
              value={formData.cost || ''}
              onChange={(e) => onFormChange('cost', Number(e.target.value) || 0)}
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
          <Button onClick={onAddItem}>
            Add Item
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

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

export function RedSealProjectDetailsDialog({
  open,
  onOpenChange,
  project,
}: RedSealProjectDetailsDialogProps) {
  const {
    brands,
    categories,
    types,
    colors,
    countries,
    updateRDProject,
  } = useERPStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<
    Partial<RDProject>
  >({});

  // Cost editing states
  const [targetCost, setTargetCost] = useState<string>('12500');
  const [profitMargin, setProfitMargin] = useState<string>('25.0');
  const [brandFinalCost, setBrandFinalCost] = useState<string>('18500');

  // Detailed cost breakdown states - Default items with full details
  type DefaultItem = { item: string; description: string; consumption: string; cost: number };
  
  const [defaultUpperItems, setDefaultUpperItems] = useState<{[key: string]: DefaultItem}>({
    upper: { item: 'Upper', description: 'Rexine', consumption: '26 pairs/mtr @/-', cost: 0 },
    lining1: { item: 'Lining', description: 'Skinfit', consumption: '25 pair @ 155/-', cost: 6.20 },
    lining2: { item: 'Lining', description: 'EVA', consumption: '33/70 - 1.5mm 35pair', cost: 0 }
  });

  // Legacy cost states (for custom items)
  const [upperCosts, setUpperCosts] = useState<{[key: string]: number}>({});

  const [defaultComponentItems, setDefaultComponentItems] = useState<{[key: string]: DefaultItem}>({
    thread: { item: 'Thread', description: '-', consumption: '-', cost: 1.00 },
    taftaLabel: { item: 'Tafta Label', description: 'MRP', consumption: '-', cost: 1.00 },
    heatTransfer: { item: 'Heat Transfer', description: '-', consumption: '-', cost: 1.00 },
    welding: { item: 'Welding', description: '-', consumption: '-', cost: 1.00 }
  });

  const [defaultMaterialItems, setDefaultMaterialItems] = useState<{[key: string]: DefaultItem}>({
    outSole: { item: 'Out Sole', description: '-', consumption: '-', cost: 98.00 },
    puAdhesive: { item: 'PU Adhesive', description: '-', consumption: '-', cost: 7.00 },
    print: { item: 'Print', description: '-', consumption: '-', cost: 4.00 }
  });

  const [defaultPackagingItems, setDefaultPackagingItems] = useState<{[key: string]: DefaultItem}>({
    inner: { item: 'Inner', description: '-', consumption: '-', cost: 22.00 }
  });

  const [defaultMiscellaneousItems, setDefaultMiscellaneousItems] = useState<{[key: string]: DefaultItem}>({
    seconds: { item: 'Seconds (4.064%)', description: '-', consumption: '-', cost: 4.064 },
    freight: { item: 'Freight', description: '-', consumption: '-', cost: 2.00 }
  });

  // Legacy cost states (for custom items)
  const [componentCosts, setComponentCosts] = useState<{[key: string]: number}>({});
  const [materialCosts, setMaterialCosts] = useState<{[key: string]: number}>({});
  const [packagingCosts, setPackagingCosts] = useState<{[key: string]: number}>({});
  const [miscellaneousCosts, setMiscellaneousCosts] = useState<{[key: string]: number}>({});

  const [labourCosts, setLabourCosts] = useState<{[key: string]: number}>({
    totalLabour: 62.00
  });

  // Custom items state
  const [customItems, setCustomItems] = useState<{[key: string]: Array<{id: string, item: string, description: string, consumption: string, cost: number}>}>({
    upper: [],
    component: [],
    material: [],
    packaging: [],
    miscellaneous: []
  });

  // Dialog states for adding new items
  const [addItemDialogs, setAddItemDialogs] = useState({
    upper: false,
    component: false,
    material: false,
    packaging: false,
    miscellaneous: false
  });

  // Form data for add item dialogs
  const [dialogForms, setDialogForms] = useState({
    upper: { item: '', description: '', consumption: '', cost: 0 },
    component: { item: '', description: '', consumption: '', cost: 0 },
    material: { item: '', description: '', consumption: '', cost: 0 },
    packaging: { item: '', description: '', consumption: '', cost: 0 },
    miscellaneous: { item: '', description: '', consumption: '', cost: 0 }
  });

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
      // Load existing images
      setCoverPhoto(project.coverPhoto || null);
      setAdditionalImages(project.additionalImages || []);
      setDynamicImages(project.dynamicImages || []);
    }
  }, [project]);

  if (!project) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const getCurrentStage = () => {
    return (
      workflowStages.find(
        (stage) =>
          stage.id ===
          project.status.toLowerCase().replace(" ", "-"),
      ) || workflowStages[4]
    ); // Default to Red Seal
  };

  const currentStage = getCurrentStage();

  const getBrandName = (brandId: string) => {
    return (
      brands?.find((b) => b.id === brandId)?.brandName ||
      "Toucan"
    );
  };

  const getBrandCode = (brandId: string) => {
    return (
      brands?.find((b) => b.id === brandId)?.brandCode || "TC04"
    );
  };

  const getCategoryName = (categoryId: string) => {
    return (
      categories?.find((c) => c.id === categoryId)
        ?.categoryName || "Boots"
    );
  };

  const getTypeName = (typeId: string) => {
    return (
      types?.find((t) => t.id === typeId)?.typeName || "Leather"
    );
  };

  const getColorName = (colorId: string) => {
    return (
      colors?.find((c) => c.id === colorId)?.colorName ||
      "Black"
    );
  };

  const getColorDisplay = () => {
    return "bg-gray-900";
  };

  const getCountryName = (countryId: string) => {
    return (
      countries?.find((c) => c.id === countryId)?.countryName ||
      "Vietnam"
    );
  };

  const getDesignerName = (designerId: string) => {
    const designerNames: { [key: string]: string } = {
      '1': 'Rahul Sharma',
      '2': 'Priyanka Patel',
      '3': 'Amit Kumar',
      '4': 'Sneha Reddy',
      '5': 'Vikram Singh'
    };
    return designerNames[designerId] || 'Designer ' + designerId;
  };

  // Image upload handlers
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

  const removeCoverPhoto = () => {
    setCoverPhoto(null);
  };

  const removeAdditionalImage = (index: number) => {
    const newImages = [...additionalImages];
    newImages[index] = '';
    setAdditionalImages(newImages);
  };

  const removeDynamicImage = (index: number) => {
    const newImages = dynamicImages.filter((_, i) => i !== index);
    setDynamicImages(newImages);
  };

  const handleAddImageSlot = () => {
    setDynamicImages([...dynamicImages, '']);
  };

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

  const handleSave = () => {
    if (editedProject.id) {
      updateRDProject(editedProject.id, editedProject);
      toast.success("Red Seal project updated successfully");
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedProject(project);
    setIsEditing(false);
  };

  const handleAdvanceToGreenSeal = () => {
    // Update project status to Green Seal
    if (project && project.id) {
      updateRDProject(project.id, {
        ...project,
        status: "Green Seal"
      });
      toast.success("Project successfully advanced to Green Seal stage!");
      onOpenChange(false); // Close the dialog
    }
  };

  // Cost update handlers
  const updateDefaultUpperItem = (key: string, field: 'item' | 'description' | 'consumption' | 'cost', value: string | number) => {
    setDefaultUpperItems(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === 'cost' ? (Number(value) || 0) : value
      }
    }));
  };

  const deleteDefaultUpperItem = (key: string) => {
    setDefaultUpperItems(prev => {
      const newItems = { ...prev };
      delete newItems[key];
      return newItems;
    });
    toast.success('Item deleted successfully');
  };

  const updateUpperCost = (key: string, value: number) => {
    setUpperCosts(prev => ({ ...prev, [key]: value || 0 }));
  };

  const updateDefaultComponentItem = (key: string, field: 'item' | 'description' | 'consumption' | 'cost', value: string | number) => {
    setDefaultComponentItems(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === 'cost' ? (Number(value) || 0) : value
      }
    }));
  };

  const deleteDefaultComponentItem = (key: string) => {
    setDefaultComponentItems(prev => {
      const newItems = { ...prev };
      delete newItems[key];
      return newItems;
    });
    toast.success('Component deleted successfully');
  };

  const updateDefaultMaterialItem = (key: string, field: 'item' | 'description' | 'consumption' | 'cost', value: string | number) => {
    setDefaultMaterialItems(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === 'cost' ? (Number(value) || 0) : value
      }
    }));
  };

  const deleteDefaultMaterialItem = (key: string) => {
    setDefaultMaterialItems(prev => {
      const newItems = { ...prev };
      delete newItems[key];
      return newItems;
    });
    toast.success('Material deleted successfully');
  };

  const updateDefaultPackagingItem = (key: string, field: 'item' | 'description' | 'consumption' | 'cost', value: string | number) => {
    setDefaultPackagingItems(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === 'cost' ? (Number(value) || 0) : value
      }
    }));
  };

  const deleteDefaultPackagingItem = (key: string) => {
    setDefaultPackagingItems(prev => {
      const newItems = { ...prev };
      delete newItems[key];
      return newItems;
    });
    toast.success('Packaging item deleted successfully');
  };

  const updateDefaultMiscellaneousItem = (key: string, field: 'item' | 'description' | 'consumption' | 'cost', value: string | number) => {
    setDefaultMiscellaneousItems(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === 'cost' ? (Number(value) || 0) : value
      }
    }));
  };

  const deleteDefaultMiscellaneousItem = (key: string) => {
    setDefaultMiscellaneousItems(prev => {
      const newItems = { ...prev };
      delete newItems[key];
      return newItems;
    });
    toast.success('Miscellaneous item deleted successfully');
  };

  const updateComponentCost = (key: string, value: number) => {
    setComponentCosts(prev => ({ ...prev, [key]: value || 0 }));
  };

  const updateMaterialCost = (key: string, value: number) => {
    setMaterialCosts(prev => ({ ...prev, [key]: value || 0 }));
  };

  const updatePackagingCost = (key: string, value: number) => {
    setPackagingCosts(prev => ({ ...prev, [key]: value || 0 }));
  };

  const updateLabourCost = (key: string, value: number) => {
    setLabourCosts(prev => ({ ...prev, [key]: value || 0 }));
  };

  const updateMiscellaneousCost = (key: string, value: number) => {
    setMiscellaneousCosts(prev => ({ ...prev, [key]: value || 0 }));
  };

  const updateCustomItemCost = (category: string, itemId: string, value: number) => {
    const categoryMap: {[key: string]: any} = {
      upper: upperCosts,
      component: componentCosts,
      material: materialCosts,
      packaging: packagingCosts,
      miscellaneous: miscellaneousCosts
    };
    
    const setterMap: {[key: string]: any} = {
      upper: setUpperCosts,
      component: setComponentCosts,
      material: setMaterialCosts,
      packaging: setPackagingCosts,
      miscellaneous: setMiscellaneousCosts
    };

    const currentCosts = categoryMap[category];
    const setter = setterMap[category];
    
    if (currentCosts && setter) {
      setter({ ...currentCosts, [itemId]: value || 0 });
    }
  };

  // Add item dialog handlers
  const openAddItemDialog = (category: string) => {
    setAddItemDialogs(prev => ({ ...prev, [category]: true }));
  };

  const closeAddItemDialog = (category: string) => {
    setAddItemDialogs(prev => ({ ...prev, [category]: false }));
    // Reset form
    setDialogForms(prev => ({
      ...prev,
      [category]: { item: '', description: '', consumption: '', cost: 0 }
    }));
  };

  const handleDialogFormChange = (category: string, field: string, value: string | number) => {
    setDialogForms(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleAddItem = (category: string) => {
    const form = dialogForms[category as keyof typeof dialogForms];
    
    if (!form.item || form.cost === 0) {
      toast.error('Please fill in item name and cost');
      return;
    }

    const newItem = {
      id: `custom-${Date.now()}`,
      item: form.item,
      description: form.description,
      consumption: form.consumption,
      cost: form.cost
    };

    setCustomItems(prev => ({
      ...prev,
      [category]: [...prev[category], newItem]
    }));

    // Add to appropriate cost state
    const categoryMap: {[key: string]: any} = {
      upper: setUpperCosts,
      component: setComponentCosts,
      material: setMaterialCosts,
      packaging: setPackagingCosts,
      miscellaneous: setMiscellaneousCosts
    };

    const setter = categoryMap[category];
    if (setter) {
      setter((prev: any) => ({ ...prev, [newItem.id]: newItem.cost }));
    }

    toast.success(`${form.item} added successfully`);
    closeAddItemDialog(category);
  };

  const deleteCustomItem = (category: string, itemId: string) => {
    setCustomItems(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.id !== itemId)
    }));

    // Remove from cost state
    const categoryMap: {[key: string]: any} = {
      upper: setUpperCosts,
      component: setComponentCosts,
      material: setMaterialCosts,
      packaging: setPackagingCosts,
      miscellaneous: setMiscellaneousCosts
    };

    const setter = categoryMap[category];
    if (setter) {
      setter((prev: any) => {
        const newCosts = { ...prev };
        delete newCosts[itemId];
        return newCosts;
      });
    }

    toast.success('Item deleted successfully');
  };

  // Calculate totals
  const calculateUpperTotal = () => {
    const defaultTotal = Object.values(defaultUpperItems).reduce((sum, item) => sum + (item.cost || 0), 0);
    const customTotal = customItems.upper.reduce((sum, item) => sum + (upperCosts[item.id] || 0), 0);
    return defaultTotal + customTotal;
  };

  const calculateComponentTotal = () => {
    const defaultTotal = Object.values(defaultComponentItems).reduce((sum, item) => sum + (item.cost || 0), 0);
    const customTotal = customItems.component.reduce((sum, item) => sum + (componentCosts[item.id] || 0), 0);
    return defaultTotal + customTotal;
  };

  const calculateMaterialTotal = () => {
    const defaultTotal = Object.values(defaultMaterialItems).reduce((sum, item) => sum + (item.cost || 0), 0);
    const customTotal = customItems.material.reduce((sum, item) => sum + (materialCosts[item.id] || 0), 0);
    return defaultTotal + customTotal;
  };

  const calculatePackagingTotal = () => {
    const defaultTotal = Object.values(defaultPackagingItems).reduce((sum, item) => sum + (item.cost || 0), 0);
    const customTotal = customItems.packaging.reduce((sum, item) => sum + (packagingCosts[item.id] || 0), 0);
    return defaultTotal + customTotal;
  };

  const calculateLabourTotal = () => {
    return Object.values(labourCosts).reduce((sum, cost) => sum + (cost || 0), 0);
  };

  const calculateMiscellaneousTotal = () => {
    const defaultTotal = Object.values(defaultMiscellaneousItems).reduce((sum, item) => sum + (item.cost || 0), 0);
    const customTotal = customItems.miscellaneous.reduce((sum, item) => sum + (miscellaneousCosts[item.id] || 0), 0);
    return defaultTotal + customTotal;
  };

  // Calculate total costs
  const totalAllCosts = 6.20 + 4.00 + 109.00 + 22.00 + 62.00 + 6.06; // 209.26
  const profitPercentage = parseFloat(profitMargin) || 0;
  const profitAmount = Math.round((totalAllCosts * profitPercentage) / 100);
  const tentativeCost = totalAllCosts + profitAmount;

  const projectData = {
    productCode: project.autoCode,
    artColour: "Boots - Black",
    targetDate: formatDate(project.endDate),
    nextDate: formatDate(project.nextUpdateDate),
    remarks: project.remarks,
    gender: "Men",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[85vw] !w-[85vw] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
        {/* Sticky Header Section - Exact same as ProjectDetailsDialog */}
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
                  View and manage Red Seal Approval project
                  details and information
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
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    onClick={handleCancel}
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

        {/* Scrollable Main Content - Exact same structure as ProjectDetailsDialog */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-8 py-8 space-y-10">
            {/* Approval Progress - matching ProjectDetailsDialog structure */}
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
                  <Progress
                    value={currentStage.progress}
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {workflowStages.map((stage, index) => {
                    const isCompleted =
                      workflowStages.findIndex(
                        (s) => s.id === "Red Seal",
                      ) >= index;
                    const isCurrent = stage.id === "Red Seal";

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

            {/* Approval Information - Same structure as ProjectDetailsDialog */}
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Approval Information
                </h3>
              </div>

              {/* Unified Product Details Section */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-lg font-semibold text-gray-900">Product & Brand Details</h4>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                    {currentStage.name}
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
                          src={coverPhoto || "https://images.unsplash.com/photo-1549298916-b41d501d3772?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBzaG9lJTIwcHJvZHVjdHxlbnwxfHx8fDE3NTY3MzU5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080"}
                          alt={project.autoCode}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs font-medium text-gray-900 text-center">{project.autoCode}</div>
                      <div className="text-xs text-gray-500 text-center mt-0.5">Sample</div>
                    </div>
                  </div>

                  {/* Product Images Gallery - Horizontal Scroll */}
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
                        // View Mode
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                          {coverPhoto && (
                            <div className="group relative flex-shrink-0">
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-blue-400 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                                <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="absolute bottom-1 left-1 right-1">
                                    <span className="text-xs font-semibold text-white">Cover</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          {additionalImages.filter(img => img).map((image, i) => (
                            <div key={i} className="group relative flex-shrink-0">
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 hover:border-blue-300 cursor-pointer bg-white">
                                <img src={image} alt={`Image ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="absolute bottom-1 left-1">
                                    <Eye className="w-3 h-3 text-white" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {dynamicImages.map((image, i) => (
                            <div key={`dynamic-${i}`} className="group relative flex-shrink-0">
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 hover:border-blue-300 cursor-pointer bg-white">
                                <img src={image} alt={`Image ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="absolute bottom-1 left-1">
                                    <Eye className="w-3 h-3 text-white" />
                                  </div>
                                </div>
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
                        // Edit Mode
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                            <div className="flex-shrink-0">
                              <input
                                ref={coverInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleCoverPhotoUpload}
                              />
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
                                <input
                                  ref={(el) => { if (additionalInputRefs.current) { additionalInputRefs.current[i] = el; }}}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleAdditionalImageUpload(e, i)}
                                />
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
                                <input
                                  ref={(el) => { if (dynamicInputRefs.current) { dynamicInputRefs.current[i] = el; }}}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleDynamicImageUpload(e, i)}
                                />
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
                  {/* Row 1 */}
                  <div>
                    <Label>Product Code</Label>
                    <div className="mt-1 font-mono font-bold text-gray-900">{project.autoCode}</div>
                  </div>
                  
                  <div>
                    <Label>Company</Label>
                    {isEditing ? (
                      <Select 
                        value={editedProject.companyId} 
                        onValueChange={(value) => setEditedProject({...editedProject, companyId: value})}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
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
                      <Select 
                        value={editedProject.brandId} 
                        onValueChange={(value) => setEditedProject({...editedProject, brandId: value})}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(brands || []).map(brand => (
                            <SelectItem key={brand.id} value={brand.id}>{brand.brandName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1 text-gray-900">{getBrandName(project.brandId)}</div>
                    )}
                  </div>

                  <div>
                    <Label>Category</Label>
                    {isEditing ? (
                      <Select 
                        value={editedProject.categoryId} 
                        onValueChange={(value) => setEditedProject({...editedProject, categoryId: value})}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {(categories || []).map(category => (
                            <SelectItem key={category.id} value={category.id}>{category.categoryName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1 text-gray-900">{getCategoryName(project.categoryId)}</div>
                    )}
                  </div>

                  <div>
                    <Label>Type</Label>
                    {isEditing ? (
                      <Select 
                        value={editedProject.typeId} 
                        onValueChange={(value) => setEditedProject({...editedProject, typeId: value})}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {(types || []).map(type => (
                            <SelectItem key={type.id} value={type.id}>{type.typeName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1 text-gray-900">{getTypeName(project.typeId)}</div>
                    )}
                  </div>

                  <div>
                    <Label>Gender</Label>
                    {isEditing ? (
                      <Select defaultValue="unisex">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="unisex">Unisex</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1 text-gray-900">Unisex</div>
                    )}
                  </div>

                  {/* Row 2 */}
                  <div>
                    <Label>Art</Label>
                    {isEditing ? (
                      <Input type="text" defaultValue="Modern Design" className="mt-1" />
                    ) : (
                      <div className="mt-1 text-gray-900">Modern Design</div>
                    )}
                  </div>

                  <div>
                    <Label>Colour</Label>
                    {isEditing ? (
                      <Select 
                        value={editedProject.colorId} 
                        onValueChange={(value) => setEditedProject({...editedProject, colorId: value})}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
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
                        <span className="text-gray-900">{getColorName(project.colorId)}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Country</Label>
                    {isEditing ? (
                      <Select 
                        value={editedProject.countryId} 
                        onValueChange={(value) => setEditedProject({...editedProject, countryId: value})}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(countries || []).map(country => (
                            <SelectItem key={country.id} value={country.id}>{country.countryName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1 text-gray-900">{getCountryName(project.countryId)}</div>
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
                        value={editedProject.startDate}
                        onChange={(e) => setEditedProject({...editedProject, startDate: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 text-gray-900">{formatDate(project.startDate)}</div>
                    )}
                  </div>

                  <div>
                    <Label>Target Date</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editedProject.endDate}
                        onChange={(e) => setEditedProject({...editedProject, endDate: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 text-gray-900">{formatDate(project.endDate)}</div>
                    )}
                  </div>

                  {/* Row 3 */}
                  <div>
                    <Label>Priority</Label>
                    {isEditing ? (
                      <Select 
                        value={editedProject.priority || 'Low'} 
                        onValueChange={(value) => setEditedProject({...editedProject, priority: value})}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1">
                        <Badge className={
                          project.priority === 'High' ? 'bg-red-500 text-white' :
                          project.priority === 'Medium' ? 'bg-amber-500 text-white' :
                          'bg-green-500 text-white'
                        }>
                          {project.priority}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Assigned To</Label>
                    {isEditing ? (
                      <Input
                        type="text"
                        value={editedProject.taskInc}
                        onChange={(e) => setEditedProject({...editedProject, taskInc: e.target.value})}
                        className="mt-1"
                        placeholder="Person name"
                      />
                    ) : (
                      <div className="mt-1 text-gray-900">{project.taskInc}</div>
                    )}
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
                          value={editedProject.remarks || ""}
                          onChange={(e) =>
                            setEditedProject({
                              ...editedProject,
                              remarks: e.target.value,
                            })
                          }
                          placeholder="Enter client feedback and remarks..."
                          className="min-h-[100px] resize-none text-sm"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 min-h-[100px] border border-gray-200">
                          {editedProject.remarks ||
                            "Red Seal sample shows good quality but the sole thickness needs adjustment. Client requested modification in heel height by 2mm for better comfort. Material selection approved but color consistency needs improvement."}
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
                            value={
                              editedProject.clientFeedback ||
                              "Update Required"
                            }
                            onValueChange={(value) =>
                              setEditedProject({
                                ...editedProject,
                                clientFeedback: value as
                                  | "OK"
                                  | "Update Required"
                                  | "Pending",
                              })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OK">
                                Approved
                              </SelectItem>
                              <SelectItem value="Update Required">
                                Update Required
                              </SelectItem>
                              <SelectItem value="Pending">
                                Pending Review
                              </SelectItem>
                              <SelectItem value="Rejected">
                                Rejected
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-orange-100 text-orange-700"
                          >
                            ⚠ Update Required
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
                            editedProject.nextUpdateDate ||
                            "2024-09-15"
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
                            {editedProject.nextUpdateDate
                              ? formatDate(
                                  editedProject.nextUpdateDate,
                                )
                              : "15/09/2024"}
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
                          value={
                            editedProject.updateNotes || ""
                          }
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
                          {editedProject.updateNotes ||
                            "Schedule follow-up meeting with client to review updated Red Seal sample. Prepare revised prototype with adjusted sole thickness and improved color consistency for approval."}
                        </div>
                      )}
                    </div>

                    {/* Days Until Next Update */}
                    {(() => {
                      const nextDate =
                        editedProject.nextUpdateDate ||
                        "2024-09-15";
                      const today = new Date();
                      const updateDate = new Date(nextDate);
                      const diffTime =
                        updateDate.getTime() -
                        today.getTime();
                      const diffDays = Math.ceil(
                        diffTime / (1000 * 60 * 60 * 24),
                      );
                      const isOverdue = diffDays <= 0;
                      
                      return (
                        <div className={`${isOverdue ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'} rounded-lg p-4`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
                            <span className={`text-sm ${isOverdue ? 'text-red-700' : 'text-blue-700'}`}>
                              Days Until Next Update
                            </span>
                          </div>
                          <div className={`text-xl font-bold ${isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
                            {diffDays > 0
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
                        nextWeek.setDate(
                          nextWeek.getDate() + 7,
                        );
                        setEditedProject({
                          ...editedProject,
                          nextUpdateDate: nextWeek
                            .toISOString()
                            .split("T")[0],
                          updateNotes:
                            "Schedule follow-up meeting for next week to review updated Red Seal sample",
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
                        twoWeeks.setDate(
                          twoWeeks.getDate() + 14,
                        );
                        setEditedProject({
                          ...editedProject,
                          nextUpdateDate: twoWeeks
                            .toISOString()
                            .split("T")[0],
                          updateNotes:
                            "Allow 2 weeks for Red Seal modifications and client review",
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
                          clientFeedback: "Update Required",
                          updateNotes:
                            "Client requested modifications - awaiting revised Red Seal sample",
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
                          clientFeedback: "OK",
                          updateNotes:
                            "Red Seal approved by client - ready to proceed to Green Seal stage",
                        });
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Mark Approved
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditedProject({
                          ...editedProject,
                          status: "Green Seal",
                          updateNotes:
                            "Moving to Green Seal stage after Red Seal approval",
                        });
                      }}
                    >
                      <ArrowRight className="w-4 h-4 mr-1" />
                      Move to Green Seal
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Red Seal Development - Tentative Cost Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Cost Breakdown & Final Tentaive Cost
                </h3>
              </div>

              {/* Cost Analysis & Summary */}
              <div className="bg-white border-2 border-green-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Cost Analysis & Final Calculations
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Tentative Cost - Read Only */}
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Calculator className="w-5 h-5 text-green-600" />
                      <div className="text-sm text-green-700 font-semibold tracking-wide uppercase">
                        Tentative Cost
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-green-800 tracking-tight">
                      ₹15,247
                    </div>
                  </div>

                  {/* Brand Final Cost - Editable when isEditing */}
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Award className="w-5 h-5 text-blue-600" />
                      <div className="text-sm text-blue-700 font-semibold tracking-wide uppercase">
                        Brand Final Cost
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="relative flex items-center justify-center gap-1">
                        <span className="text-3xl font-bold text-blue-800">₹</span>
                        <Input
                          type="number"
                          value={brandFinalCost}
                          onChange={(e) => setBrandFinalCost(e.target.value)}
                          className="text-center text-3xl font-bold text-blue-800 bg-white/50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg h-auto w-48 px-2 py-1 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                      </div>
                    ) : (
                      <div className="text-3xl font-bold text-blue-800 tracking-tight">
                        ₹{parseInt(brandFinalCost || '0').toLocaleString()}
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
                      <span className="text-gray-600">
                        Upper Cost:
                      </span>
                      <span className="font-medium">₹6.20</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Component Cost:
                      </span>
                      <span className="font-medium">₹4.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Material Cost:
                      </span>
                      <span className="font-medium">
                        ₹109.00
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Packaging Cost:
                      </span>
                      <span className="font-medium">
                        ₹22.00
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Labour + OH:
                      </span>
                      <span className="font-medium">
                        ₹62.00
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Miscellaneous:
                      </span>
                      <span className="font-medium">₹6.06</span>
                    </div>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="flex justify-between font-semibold mb-3">
                    <span>Total All Costs:</span>
                    <span>₹{totalAllCosts.toFixed(2)}</span>
                  </div>

                  {/* Profit Margin Input */}
                  <div className="mb-3">
                    <Label className="text-sm font-medium text-gray-600">Profit Margin (%)</Label>
                    <div className="relative mt-1">
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="number"
                        value={profitMargin}
                        onChange={(e) => setProfitMargin(e.target.value)}
                        className="pl-10"
                        placeholder="Enter profit margin %"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Profit percentage on total costs
                    </div>
                  </div>

                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Profit ({profitPercentage}%):</span>
                    <span className="font-medium">+₹{profitAmount.toFixed(2)}</span>
                  </div>

                  <Separator className="my-3" />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Total Tentative Cost:</span>
                    <span>₹{tentativeCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Cost Breakdown Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upper Cost Details */}
                <div className="bg-white border-2 border-orange-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-orange-900 mb-4">
                    Upper Cost Breakdown
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-600 bg-orange-50 p-2 rounded">
                      <div>ITEM</div>
                      <div>DESCRIPTION</div>
                      <div>CONSUMPTION</div>
                      <div>COST{isEditing && <span className="ml-1">/  ACTION</span>}</div>
                    </div>

                    {/* Default Upper Items - Dynamic Rendering */}
                    {Object.entries(defaultUpperItems).map(([key, item]) => (
                      <div key={key} className="grid grid-cols-4 gap-2 text-sm py-2 border-b border-gray-200 items-center">
                        {isEditing ? (
                          <>
                            <Input
                              value={item.item}
                              onChange={(e) => updateDefaultUpperItem(key, 'item', e.target.value)}
                              className="text-sm h-8"
                              placeholder="Item"
                            />
                            <Input
                              value={item.description}
                              onChange={(e) => updateDefaultUpperItem(key, 'description', e.target.value)}
                              className="text-sm h-8"
                              placeholder="Description"
                            />
                            <Input
                              value={item.consumption}
                              onChange={(e) => updateDefaultUpperItem(key, 'consumption', e.target.value)}
                              className="text-sm h-8"
                              placeholder="Consumption"
                            />
                            <div className="flex items-center gap-1">
                              <div className="relative flex-1">
                                <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                                <Input
                                  type="number"
                                  value={item.cost || ''}
                                  onChange={(e) => updateDefaultUpperItem(key, 'cost', e.target.value)}
                                  className="pl-6 text-sm h-8"
                                  placeholder="0.00"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteDefaultUpperItem(key)}
                                className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium">{item.item}</div>
                            <div className="text-gray-600">{item.description || '-'}</div>
                            <div className="text-gray-600">{item.consumption || '-'}</div>
                            <div className="font-medium">₹{item.cost.toFixed(2)}</div>
                          </>
                        )}
                      </div>
                    ))}

                    {/* Custom Upper Items */}
                    {customItems.upper.map((item) => (
                      <div key={item.id} className="grid grid-cols-4 gap-2 text-sm py-2 border-b border-gray-200 items-center">
                        <div className="font-medium">{item.item}</div>
                        <div className="text-gray-600">{item.description || '-'}</div>
                        <div className="text-gray-600">{item.consumption || '-'}</div>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <div className="relative flex-1">
                              <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                              <Input
                                type="number"
                                value={upperCosts[item.id] || ''}
                                onChange={(e) => updateCustomItemCost('upper', item.id, Number(e.target.value))}
                                className="pl-6 text-sm h-8"
                                placeholder="0.00"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCustomItem('upper', item.id)}
                              className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="font-medium">₹{(upperCosts[item.id] || 0).toFixed(2)}</div>
                        )}
                      </div>
                    ))}

                    {/* Add New Item Button */}
                    {isEditing && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-orange-600 border-orange-200 hover:bg-orange-50 mt-2"
                        onClick={() => openAddItemDialog('upper')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Item
                      </Button>
                    )}

                    <div className="bg-orange-50 p-3 rounded-lg mt-3">
                      <div className="flex justify-between font-semibold text-orange-900">
                        <span>Total Upper Cost:</span>
                        <span>₹{calculateUpperTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Component Cost Details */}
                <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-purple-900 mb-4">
                    Component Cost Breakdown
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-600 bg-purple-50 p-2 rounded">
                      <div>COMPONENT</div>
                      <div>DESCRIPTION</div>
                      <div>CONSUMPTION</div>
                      <div>COST{isEditing && <span className="ml-1">/ ACTION</span>}</div>
                    </div>

                    {/* Default Component Items - Dynamic Rendering */}
                    {Object.entries(defaultComponentItems).map(([key, item]) => (
                      <div key={key} className="grid grid-cols-4 gap-2 text-sm py-2 border-b border-gray-200 items-center">
                        {isEditing ? (
                          <>
                            <Input
                              value={item.item}
                              onChange={(e) => updateDefaultComponentItem(key, 'item', e.target.value)}
                              className="text-sm h-8"
                              placeholder="Component"
                            />
                            <Input
                              value={item.description}
                              onChange={(e) => updateDefaultComponentItem(key, 'description', e.target.value)}
                              className="text-sm h-8"
                              placeholder="Description"
                            />
                            <Input
                              value={item.consumption}
                              onChange={(e) => updateDefaultComponentItem(key, 'consumption', e.target.value)}
                              className="text-sm h-8"
                              placeholder="Consumption"
                            />
                            <div className="flex items-center gap-1">
                              <div className="relative flex-1">
                                <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                                <Input
                                  type="number"
                                  value={item.cost || ''}
                                  onChange={(e) => updateDefaultComponentItem(key, 'cost', e.target.value)}
                                  className="pl-6 text-sm h-8"
                                  placeholder="0.00"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteDefaultComponentItem(key)}
                                className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium">{item.item}</div>
                            <div className="text-gray-600">{item.description || '-'}</div>
                            <div className="text-gray-600">{item.consumption || '-'}</div>
                            <div className="font-medium">₹{item.cost.toFixed(2)}</div>
                          </>
                        )}
                      </div>
                    ))}

                    {/* Custom Component Items */}
                    {customItems.component.map((item) => (
                      <div key={item.id} className="grid grid-cols-4 gap-2 text-sm py-2 border-b border-gray-200 items-center">
                        <div className="font-medium">{item.item}</div>
                        <div className="text-gray-600">{item.description || '-'}</div>
                        <div className="text-gray-600">{item.consumption || '-'}</div>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <div className="relative flex-1">
                              <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                              <Input
                                type="number"
                                value={componentCosts[item.id] || ''}
                                onChange={(e) => updateCustomItemCost('component', item.id, Number(e.target.value))}
                                className="pl-6 text-sm h-8"
                                placeholder="0.00"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCustomItem('component', item.id)}
                              className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="font-medium">₹{(componentCosts[item.id] || 0).toFixed(2)}</div>
                        )}
                      </div>
                    ))}

                    {/* Add New Item Button */}
                    {isEditing && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-purple-600 border-purple-200 hover:bg-purple-50 mt-2"
                        onClick={() => openAddItemDialog('component')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Component
                      </Button>
                    )}

                    <div className="bg-purple-50 p-3 rounded-lg mt-3">
                      <div className="flex justify-between font-semibold text-purple-900">
                        <span>Total Component Cost:</span>
                        <span>₹{calculateComponentTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Material Cost Details */}
                <div className="bg-white border-2 border-teal-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-teal-900 mb-4">
                    Material Cost Breakdown
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-600 bg-teal-50 p-2 rounded">
                      <div>MATERIAL</div>
                      <div>DESCRIPTION</div>
                      <div>CONSUMPTION</div>
                      <div>COST{isEditing && <span className="ml-1">/ ACTION</span>}</div>
                    </div>

                    {/* Default Material Items - Dynamic Rendering */}
                    {Object.entries(defaultMaterialItems).map(([key, item]) => (
                      <div key={key} className="grid grid-cols-4 gap-2 text-sm py-2 border-b border-gray-200 items-center">
                        {isEditing ? (
                          <>
                            <Input
                              value={item.item}
                              onChange={(e) => updateDefaultMaterialItem(key, 'item', e.target.value)}
                              className="text-sm h-8"
                              placeholder="Material"
                            />
                            <Input
                              value={item.description}
                              onChange={(e) => updateDefaultMaterialItem(key, 'description', e.target.value)}
                              className="text-sm h-8"
                              placeholder="Description"
                            />
                            <Input
                              value={item.consumption}
                              onChange={(e) => updateDefaultMaterialItem(key, 'consumption', e.target.value)}
                              className="text-sm h-8"
                              placeholder="Consumption"
                            />
                            <div className="flex items-center gap-1">
                              <div className="relative flex-1">
                                <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                                <Input
                                  type="number"
                                  value={item.cost || ''}
                                  onChange={(e) => updateDefaultMaterialItem(key, 'cost', e.target.value)}
                                  className="pl-6 text-sm h-8"
                                  placeholder="0.00"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteDefaultMaterialItem(key)}
                                className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium">{item.item}</div>
                            <div className="text-gray-600">{item.description || '-'}</div>
                            <div className="text-gray-600">{item.consumption || '-'}</div>
                            <div className="font-medium">₹{item.cost.toFixed(2)}</div>
                          </>
                        )}
                      </div>
                    ))}

                    {/* Custom Material Items */}
                    {customItems.material.map((item) => (
                      <div key={item.id} className="grid grid-cols-4 gap-2 text-sm py-2 border-b border-gray-200 items-center">
                        <div className="font-medium">{item.item}</div>
                        <div className="text-gray-600">{item.description || '-'}</div>
                        <div className="text-gray-600">{item.consumption || '-'}</div>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <div className="relative flex-1">
                              <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                              <Input
                                type="number"
                                value={materialCosts[item.id] || ''}
                                onChange={(e) => updateCustomItemCost('material', item.id, Number(e.target.value))}
                                className="pl-6 text-sm h-8"
                                placeholder="0.00"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCustomItem('material', item.id)}
                              className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="font-medium">₹{(materialCosts[item.id] || 0).toFixed(2)}</div>
                        )}
                      </div>
                    ))}

                    {/* Add New Item Button */}
                    {isEditing && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-teal-600 border-teal-200 hover:bg-teal-50 mt-2"
                        onClick={() => openAddItemDialog('material')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Material
                      </Button>
                    )}

                    <div className="bg-teal-50 p-3 rounded-lg mt-3">
                      <div className="flex justify-between font-semibold text-teal-900">
                        <span>Total Material Cost:</span>
                        <span>₹{calculateMaterialTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Packaging & Labour Cost Details */}
                <div className="bg-white border-2 border-indigo-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-indigo-900 mb-4">
                    Packaging & Labour Costs
                  </h4>
                  <div className="space-y-4">
                    {/* Packaging Cost */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">
                        Packaging Cost
                      </h5>
                      <div className="space-y-2">
                        {/* Default Packaging Items - Dynamic Rendering */}
                        {Object.entries(defaultPackagingItems).map(([key, item]) => (
                          <div key={key} className="flex justify-between text-sm items-center">
                            {isEditing ? (
                              <>
                                <Input
                                  value={item.item}
                                  onChange={(e) => updateDefaultPackagingItem(key, 'item', e.target.value)}
                                  className="text-sm h-8 flex-1 mr-2"
                                  placeholder="Item"
                                />
                                <div className="flex items-center gap-1">
                                  <div className="relative w-24">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                                    <Input
                                      type="number"
                                      value={item.cost || ''}
                                      onChange={(e) => updateDefaultPackagingItem(key, 'cost', e.target.value)}
                                      className="pl-6 text-sm h-8"
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteDefaultPackagingItem(key)}
                                    className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-gray-600">{item.item}:</span>
                                <span className="font-medium">₹{item.cost.toFixed(2)}</span>
                              </>
                            )}
                          </div>
                        ))}

                        {/* Custom Packaging Items */}
                        {customItems.packaging.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm items-center">
                            <span className="text-gray-600">{item.item}:</span>
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <div className="relative w-24">
                                  <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                                  <Input
                                    type="number"
                                    value={packagingCosts[item.id] || ''}
                                    onChange={(e) => updateCustomItemCost('packaging', item.id, Number(e.target.value))}
                                    className="pl-6 text-sm h-8"
                                    placeholder="0.00"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCustomItem('packaging', item.id)}
                                  className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="font-medium">₹{(packagingCosts[item.id] || 0).toFixed(2)}</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add New Packaging Item Button */}
                      {isEditing && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 mt-2"
                          onClick={() => openAddItemDialog('packaging')}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add New Packaging Item
                        </Button>
                      )}

                      <div className="bg-indigo-50 p-2 rounded mt-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Packaging Subtotal:</span>
                          <span>₹{calculatePackagingTotal().toFixed(2)}</span>
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
                                value={labourCosts.totalLabour || ''}
                                onChange={(e) => updateLabourCost('totalLabour', Number(e.target.value))}
                                className="pl-6 text-sm h-8"
                                placeholder="0.00"
                              />
                            </div>
                          ) : (
                            <span>₹{labourCosts.totalLabour.toFixed(2)}</span>
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
                      <div className="space-y-2">
                        {/* Default Miscellaneous Items - Dynamic Rendering */}
                        {Object.entries(defaultMiscellaneousItems).map(([key, item]) => (
                          <div key={key} className="flex justify-between text-sm items-center">
                            {isEditing ? (
                              <>
                                <Input
                                  value={item.item}
                                  onChange={(e) => updateDefaultMiscellaneousItem(key, 'item', e.target.value)}
                                  className="text-sm h-8 flex-1 mr-2"
                                  placeholder="Item"
                                />
                                <div className="flex items-center gap-1">
                                  <div className="relative w-24">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                                    <Input
                                      type="number"
                                      value={item.cost || ''}
                                      onChange={(e) => updateDefaultMiscellaneousItem(key, 'cost', e.target.value)}
                                      className="pl-6 text-sm h-8"
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteDefaultMiscellaneousItem(key)}
                                    className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-gray-600">{item.item}:</span>
                                <span className="font-medium">₹{item.cost.toFixed(2)}</span>
                              </>
                            )}
                          </div>
                        ))}

                        {/* Custom Miscellaneous Items */}
                        {customItems.miscellaneous.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm items-center">
                            <span className="text-gray-600">{item.item}:</span>
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <div className="relative w-24">
                                  <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                                  <Input
                                    type="number"
                                    value={miscellaneousCosts[item.id] || ''}
                                    onChange={(e) => updateCustomItemCost('miscellaneous', item.id, Number(e.target.value))}
                                    className="pl-6 text-sm h-8"
                                    placeholder="0.00"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCustomItem('miscellaneous', item.id)}
                                  className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="font-medium">₹{(miscellaneousCosts[item.id] || 0).toFixed(2)}</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add New Miscellaneous Item Button */}
                      {isEditing && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 mt-2"
                          onClick={() => openAddItemDialog('miscellaneous')}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add New Miscellaneous Item
                        </Button>
                      )}

                      <div className="bg-indigo-50 p-2 rounded mt-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Miscellaneous Subtotal:</span>
                          <span>₹{calculateMiscellaneousTotal().toFixed(2)}</span>
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
                      ₹{totalAllCosts.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Additional Costs:
                    </span>
                    <span className="font-medium">
                      ₹0.00
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Profit Margin ({profitPercentage}%):
                    </span>
                    <span className="font-medium">
                      +₹{profitAmount.toFixed(2)}
                    </span>
                  </div>

                  <Separator />
                  <div className="flex justify-between font-bold text-lg text-green-700">
                    <span>Final Tentative Cost:</span>
                    <span>₹{tentativeCost.toFixed(2)}</span>
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
                      Tentative cost calculated: ₹261.57. Total
                      Cost: ₹209.26, Profit: ₹52.31 (25.0%).
                      Cost breakdown includes upper materials
                      (₹6.20), components (₹4.00), materials
                      (₹109.00), packaging (₹22.00), labour
                      costs (₹62.00), and miscellaneous expenses
                      (₹6.06).
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 font-medium">
                      Tentative cost approved and ready for Red
                      Seal development stage
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">
                      Approved on:{" "}
                      {new Date().toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Add New Item Dialogs */}
      <AddNewItemDialog
        category="upper"
        isOpen={addItemDialogs.upper}
        onClose={() => closeAddItemDialog('upper')}
        formData={dialogForms.upper}
        onFormChange={(field, value) => handleDialogFormChange('upper', field, value)}
        onAddItem={() => handleAddItem('upper')}
      />
      <AddNewItemDialog
        category="component"
        isOpen={addItemDialogs.component}
        onClose={() => closeAddItemDialog('component')}
        formData={dialogForms.component}
        onFormChange={(field, value) => handleDialogFormChange('component', field, value)}
        onAddItem={() => handleAddItem('component')}
      />
      <AddNewItemDialog
        category="material"
        isOpen={addItemDialogs.material}
        onClose={() => closeAddItemDialog('material')}
        formData={dialogForms.material}
        onFormChange={(field, value) => handleDialogFormChange('material', field, value)}
        onAddItem={() => handleAddItem('material')}
      />
      <AddNewItemDialog
        category="packaging"
        isOpen={addItemDialogs.packaging}
        onClose={() => closeAddItemDialog('packaging')}
        formData={dialogForms.packaging}
        onFormChange={(field, value) => handleDialogFormChange('packaging', field, value)}
        onAddItem={() => handleAddItem('packaging')}
      />
      <AddNewItemDialog
        category="miscellaneous"
        isOpen={addItemDialogs.miscellaneous}
        onClose={() => closeAddItemDialog('miscellaneous')}
        formData={dialogForms.miscellaneous}
        onFormChange={(field, value) => handleDialogFormChange('miscellaneous', field, value)}
        onAddItem={() => handleAddItem('miscellaneous')}
      />
    </Dialog>
  );
}