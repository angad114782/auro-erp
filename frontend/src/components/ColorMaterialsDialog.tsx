// ColorMaterialsDialog.tsx - FULL RESPONSIVE VERSION
import {
  CheckCircle,
  Palette,
  Plus,
  Save,
  Trash2,
  X,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Menu,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../lib/api";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

// Interfaces
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

interface CostRow {
  item: string;
  description: string;
  consumption: string;
  cost: number;
}

interface LabourRow {
  name: string;
  cost: number;
}

interface LabourData {
  items: LabourRow[];
  directTotal: number;
}

interface SummaryData {
  upperTotal: number;
  componentTotal: number;
  materialTotal: number;
  packagingTotal: number;
  miscTotal: number;
  labourTotal: number;
  additionalCosts: number;
  profitMargin: number;
  profitAmount: number;
  tentativeCost: number;
}

interface CostingData {
  upper: CostRow[];
  material: CostRow[];
  component: CostRow[];
  packaging: CostRow[];
  misc: CostRow[];
  labour: LabourData;
  summary: SummaryData;
}

interface ColorVariantData {
  materials: Material[];
  components: Component[];
  images: string[];
  costing: CostingData;
  updatedBy?: string | null;
  updatedAt?: Date;
}

interface ColorMaterialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  colors?: any[];
  onSave?: (savedColorIds: string[]) => void;
}

export function ColorMaterialsDialog({
  open,
  onOpenChange,
  project,
  colors,
  onSave,
}: ColorMaterialsDialogProps) {
  // State Management
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [activeColorTab, setActiveColorTab] = useState<string>("");
  const [newColorName, setNewColorName] = useState("");
  const [isAddingColor, setIsAddingColor] = useState(false);
  const [customColors, setCustomColors] = useState<{
    [key: string]: { name: string; hex: string };
  }>({});
  const [colorVariantsData, setColorVariantsData] = useState<{
    [colorId: string]: ColorVariantData;
  }>({});
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("upper");

  const [pendingColorVariants, setPendingColorVariants] = useState<{
    [colorId: string]: ColorVariantData;
  }>({});
  const [newColorVariants, setNewColorVariants] = useState<string[]>([]);

  // Current data for active color
  const [currentComponents, setCurrentComponents] = useState<Component[]>([]);
  const [currentMaterials, setCurrentMaterials] = useState<Material[]>([]);
  const [currentUpperCosts, setCurrentUpperCosts] = useState<CostRow[]>([]);
  const [currentMaterialCosts, setCurrentMaterialCosts] = useState<CostRow[]>(
    []
  );
  const [currentComponentCosts, setCurrentComponentCosts] = useState<CostRow[]>(
    []
  );
  const [currentPackagingCosts, setCurrentPackagingCosts] = useState<CostRow[]>(
    []
  );
  const [currentMiscCosts, setCurrentMiscCosts] = useState<CostRow[]>([]);
  const [currentLabour, setCurrentLabour] = useState<LabourData>({
    items: [],
    directTotal: 0,
  });

  const getEmptySummary = (): SummaryData => ({
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
  const [currentSummary, setCurrentSummary] = useState<SummaryData>(
    getEmptySummary()
  );

  // Dialog states
  const [addComponentDialogOpen, setAddComponentDialogOpen] = useState(false);
  const [addMaterialDialogOpen, setAddMaterialDialogOpen] = useState(false);
  const [addCostDialogOpen, setAddCostDialogOpen] = useState(false);
  const [addLabourDialogOpen, setAddLabourDialogOpen] = useState(false);
  const [activeCostTable, setActiveCostTable] = useState<string>("");

  // New item states
  const [newComponent, setNewComponent] = useState({
    name: "",
    desc: "",
    consumption: "",
  });
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    desc: "",
    consumption: "",
  });
  const [newCostItem, setNewCostItem] = useState({
    item: "",
    description: "",
    consumption: "",
    cost: 0,
  });
  const [newLabourItem, setNewLabourItem] = useState({ name: "", cost: 0 });

  // Mobile state
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setShowMobileMenu(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Helper functions
  const getEmptyCosting = (): CostingData => ({
    upper: [],
    material: [],
    component: [],
    packaging: [],
    misc: [],
    labour: { items: [], directTotal: 0 },
    summary: getEmptySummary(),
  });

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

  const nameToHexMap: Record<string, string> = {
    black: "#000000",
    white: "#ffffff",
    brown: "#a52a2a",
    "navy blue": "#000080",
    navy_blue: "#000080",
    red: "#ff0000",
    blue: "#0000ff",
    green: "#008000",
    yellow: "#ffff00",
    orange: "#ffa500",
    purple: "#800080",
    pink: "#ffc0cb",
    gray: "#808080",
    "rose gold": "#b76e79",
    "mahogany brown": "#c04000",
    default: "#6b7280",
  };

  // Load color variants
  const loadColorVariants = async () => {
    if (!project?._id) return;

    try {
      const variants: { [key: string]: ColorVariantData } = {};

      // Load existing variants
      if (project.colorVariants instanceof Map) {
        for (const [colorId, data] of project.colorVariants.entries()) {
          variants[colorId] = {
            materials: data.materials || [],
            components: data.components || [],
            images: data.images || [],
            costing: data.costing || getEmptyCosting(),
            updatedBy: data.updatedBy,
            updatedAt: data.updatedAt,
          };
        }
      } else if (typeof project.colorVariants === "object") {
        Object.assign(variants, project.colorVariants);
      }

      // Create default variant if none exist
      if (Object.keys(variants).length === 0 && project.color) {
        variants[project.color] = {
          materials: getDefaultMaterials(),
          components: getDefaultComponents(),
          images: [],
          costing: getEmptyCosting(),
        };
      }

      setColorVariantsData(variants);
      setPendingColorVariants({});
      setNewColorVariants([]);

      const colorIds = Object.keys(variants);
      if (colorIds.length > 0) {
        setSelectedColors(colorIds);
        // Always set active color to first one
        setActiveColorTab(colorIds[0]);
      } else {
        setSelectedColors([]);
        setActiveColorTab("");
      }
    } catch (error) {
      console.error("Error loading color variants:", error);
      toast.error("Failed to load color variants");
    }
  };

  // Load data on open
  useEffect(() => {
    if (project && open) {
      loadColorVariants();
      setIsAddingColor(false);
      setNewColorName("");
      setActiveTab("upper");
    }
  }, [project, open]);

  // Update current data when active color changes
  useEffect(() => {
    if (activeColorTab) {
      const variantData =
        pendingColorVariants[activeColorTab] ||
        colorVariantsData[activeColorTab];

      if (variantData) {
        setCurrentComponents(variantData.components || []);
        setCurrentMaterials(variantData.materials || []);
        setCurrentUpperCosts(variantData.costing?.upper || []);
        setCurrentMaterialCosts(variantData.costing?.material || []);
        setCurrentComponentCosts(variantData.costing?.component || []);
        setCurrentPackagingCosts(variantData.costing?.packaging || []);
        setCurrentMiscCosts(variantData.costing?.misc || []);
        setCurrentLabour(
          variantData.costing?.labour || { items: [], directTotal: 0 }
        );
        setCurrentSummary(variantData.costing?.summary || getEmptySummary());
      } else {
        // New variant or no data
        setCurrentComponents(getDefaultComponents());
        setCurrentMaterials(getDefaultMaterials());
        setCurrentUpperCosts([]);
        setCurrentMaterialCosts([]);
        setCurrentComponentCosts([]);
        setCurrentPackagingCosts([]);
        setCurrentMiscCosts([]);
        setCurrentLabour({ items: [], directTotal: 0 });
        setCurrentSummary(getEmptySummary());
      }
    }
  }, [activeColorTab, colorVariantsData, pendingColorVariants]);

  // Helper functions for color display
  const getColorName = (colorId: string) => {
    if (customColors[colorId]) {
      return customColors[colorId].name;
    }
    const color = colors?.find(
      (c) => c.id === colorId || c.colorName === colorId
    );
    return color?.colorName || colorId || "Unknown Color";
  };

  const getColorHex = (colorIdOrName: string) => {
    if (customColors[colorIdOrName]) {
      return customColors[colorIdOrName].hex;
    }

    const found = colors?.find(
      (c) =>
        c.id === colorIdOrName ||
        (c.colorName &&
          c.colorName.toLowerCase() === String(colorIdOrName).toLowerCase())
    );
    if (found && (found.hexCode || found.hex)) {
      return found.hexCode || found.hex;
    }

    const normalized = String(colorIdOrName)
      .toLowerCase()
      .replace(/[_\s]+/g, " ")
      .trim();
    return nameToHexMap[normalized] || nameToHexMap["default"];
  };

  // Color management
  const handleRemoveColor = async (colorId: string) => {
    if (!project?._id) return;

    // Don't allow removal of default color
    if (colorId === project.color) {
      toast.error("Cannot remove default color variant");
      return;
    }

    try {
      // Remove from pending changes
      if (pendingColorVariants[colorId]) {
        const newPending = { ...pendingColorVariants };
        delete newPending[colorId];
        setPendingColorVariants(newPending);

        setNewColorVariants((prev) => prev.filter((id) => id !== colorId));
        const newColors = selectedColors.filter((id) => id !== colorId);
        setSelectedColors(newColors);

        const newCustomColors = { ...customColors };
        delete newCustomColors[colorId];
        setCustomColors(newCustomColors);

        if (activeColorTab === colorId && newColors.length > 0) {
          setActiveColorTab(newColors[0]);
        } else if (newColors.length === 0) {
          setActiveColorTab("");
        }

        toast.success("Color variant removed locally");
        return;
      }

      // Remove from backend
      await api.delete(`/projects/${project._id}/color-variants/${colorId}`);

      const newColors = selectedColors.filter((id) => id !== colorId);
      setSelectedColors(newColors);

      const newVariants = { ...colorVariantsData };
      delete newVariants[colorId];
      setColorVariantsData(newVariants);

      if (activeColorTab === colorId && newColors.length > 0) {
        setActiveColorTab(newColors[0]);
      } else if (newColors.length === 0) {
        setActiveColorTab("");
      }

      toast.success("Color variant removed");
    } catch (error) {
      console.error("Error removing color variant:", error);
      toast.error("Failed to remove color variant");
    }
  };

  const handleAddNewColor = () => {
    if (!newColorName.trim()) {
      toast.error("Please enter color name");
      return;
    }

    const newColorId = newColorName.toLowerCase().replace(/\s+/g, "_");

    // Check if color already exists
    if (selectedColors.includes(newColorId)) {
      toast.error("Color variant already exists");
      return;
    }

    // Create new variant with empty data
    const variantData: ColorVariantData = {
      materials: [],
      components: [],
      images: [],
      costing: getEmptyCosting(),
    };

    setPendingColorVariants((prev) => ({
      ...prev,
      [newColorId]: variantData,
    }));

    setNewColorVariants((prev) => [...prev, newColorId]);
    setSelectedColors((prev) => [...prev, newColorId]);
    setActiveColorTab(newColorId);

    setCustomColors((prev) => ({
      ...prev,
      [newColorId]: {
        name: newColorName,
        hex: getColorHex(newColorName),
      },
    }));

    toast.success(`New color variant "${newColorName}" created`);
    setNewColorName("");
    setIsAddingColor(false);
  };

  // Material/Component CRUD
  const updateComponent = (
    index: number,
    field: keyof Component,
    value: string
  ) => {
    const updated = [...currentComponents];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentComponents(updated);
    updatePendingData({ components: updated });
  };

  const updateMaterial = (
    index: number,
    field: keyof Material,
    value: string
  ) => {
    const updated = [...currentMaterials];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentMaterials(updated);
    updatePendingData({ materials: updated });
  };

  const deleteComponent = (index: number) => {
    const updated = currentComponents.filter((_, i) => i !== index);
    setCurrentComponents(updated);
    updatePendingData({ components: updated });
    toast.success("Component removed");
  };

  const deleteMaterial = (index: number) => {
    const updated = currentMaterials.filter((_, i) => i !== index);
    setCurrentMaterials(updated);
    updatePendingData({ materials: updated });
    toast.success("Material removed");
  };

  // Cost Table CRUD
  const getCostTableData = (table: string): CostRow[] => {
    switch (table) {
      case "upper":
        return currentUpperCosts;
      case "material":
        return currentMaterialCosts;
      case "component":
        return currentComponentCosts;
      case "packaging":
        return currentPackagingCosts;
      case "misc":
        return currentMiscCosts;
      default:
        return [];
    }
  };

  const setCostTableData = (table: string, data: CostRow[]) => {
    switch (table) {
      case "upper":
        setCurrentUpperCosts(data);
        break;
      case "material":
        setCurrentMaterialCosts(data);
        break;
      case "component":
        setCurrentComponentCosts(data);
        break;
      case "packaging":
        setCurrentPackagingCosts(data);
        break;
      case "misc":
        setCurrentMiscCosts(data);
        break;
    }
    updatePendingCosting(table, data);
  };

  const updateCostRow = (
    table: string,
    index: number,
    field: keyof CostRow,
    value: string | number
  ) => {
    const data = getCostTableData(table);
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    setCostTableData(table, updated);
  };

  const deleteCostRow = (table: string, index: number) => {
    const data = getCostTableData(table);
    const updated = data.filter((_, i) => i !== index);
    setCostTableData(table, updated);
    toast.success("Cost item removed");
  };

  const addCostRow = () => {
    if (!newCostItem.item.trim()) {
      toast.error("Please enter item name");
      return;
    }

    const table = activeCostTable;
    const data = getCostTableData(table);
    const updated = [...data, { ...newCostItem }];
    setCostTableData(table, updated);
    setAddCostDialogOpen(false);
    setNewCostItem({ item: "", description: "", consumption: "", cost: 0 });
    toast.success("Cost item added");
  };

  // Labour CRUD
  const updateLabour = (
    index: number,
    field: keyof LabourRow,
    value: string | number
  ) => {
    const updated = [...currentLabour.items];
    updated[index] = { ...updated[index], [field]: value };
    const directTotal = updated.reduce(
      (sum, item) => sum + (Number(item.cost) || 0),
      0
    );
    setCurrentLabour({ items: updated, directTotal });
    updatePendingCosting("labour", { items: updated, directTotal });
  };

  const deleteLabour = (index: number) => {
    const updated = currentLabour.items.filter((_, i) => i !== index);
    const directTotal = updated.reduce(
      (sum, item) => sum + (Number(item.cost) || 0),
      0
    );
    setCurrentLabour({ items: updated, directTotal });
    updatePendingCosting("labour", { items: updated, directTotal });
    toast.success("Labour item removed");
  };

  const addLabour = () => {
    if (!newLabourItem.name.trim()) {
      toast.error("Please enter labour name");
      return;
    }

    const updated = [...currentLabour.items, { ...newLabourItem }];
    const directTotal = updated.reduce(
      (sum, item) => sum + (Number(item.cost) || 0),
      0
    );
    setCurrentLabour({ items: updated, directTotal });
    updatePendingCosting("labour", { items: updated, directTotal });
    setAddLabourDialogOpen(false);
    setNewLabourItem({ name: "", cost: 0 });
    toast.success("Labour item added");
  };

  // Summary updates
  const updateSummary = (field: keyof SummaryData, value: number) => {
    const updated = { ...currentSummary, [field]: value };

    // Auto-calculate profit amount and tentative cost
    if (field === "profitMargin") {
      const totalCost =
        (updated.upperTotal || 0) +
        (updated.componentTotal || 0) +
        (updated.materialTotal || 0) +
        (updated.packagingTotal || 0) +
        (updated.miscTotal || 0) +
        (updated.labourTotal || 0) +
        (updated.additionalCosts || 0);

      updated.profitAmount = (totalCost * (value || 0)) / 100;
      updated.tentativeCost = totalCost + updated.profitAmount;
    }

    setCurrentSummary(updated);
    updatePendingCosting("summary", updated);
  };

  // Helper to update pending data
  const updatePendingData = (data: Partial<ColorVariantData>) => {
    if (!activeColorTab) return;

    const currentData =
      pendingColorVariants[activeColorTab] ||
      (colorVariantsData[activeColorTab]
        ? { ...colorVariantsData[activeColorTab] }
        : {
            materials: [],
            components: [],
            images: [],
            costing: getEmptyCosting(),
          });

    setPendingColorVariants((prev) => ({
      ...prev,
      [activeColorTab]: { ...currentData, ...data },
    }));
  };

  const updatePendingCosting = (section: string, data: any) => {
    if (!activeColorTab) return;

    const currentData =
      pendingColorVariants[activeColorTab] ||
      (colorVariantsData[activeColorTab]
        ? { ...colorVariantsData[activeColorTab] }
        : {
            materials: [],
            components: [],
            images: [],
            costing: getEmptyCosting(),
          });

    const updatedCosting = { ...currentData.costing, [section]: data };

    setPendingColorVariants((prev) => ({
      ...prev,
      [activeColorTab]: { ...currentData, costing: updatedCosting },
    }));
  };

  // Save function
  const handleSave = async () => {
    if (!project?._id) return;

    try {
      const updates = [];

      for (const [colorId, variantData] of Object.entries(
        pendingColorVariants
      )) {
        updates.push(
          api.put(`/projects/${project._id}/color-variants/${colorId}`, {
            materials: variantData.materials,
            components: variantData.components,
            images: variantData.images,
            costing: variantData.costing,
          })
        );
      }

      if (updates.length > 0) {
        await Promise.all(updates);
        toast.success("All color variants saved successfully!");
      } else {
        toast.info("No changes to save");
      }

      setPendingColorVariants({});
      setNewColorVariants([]);

      if (onSave) {
        onSave(selectedColors);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving color variants:", error);
      toast.error("Failed to save color variants");
    }
  };

  // Render functions - Responsive versions
  const renderResponsiveTable = (
    title: string,
    table: string,
    rows: any[],
    renderRow: (row: any, index: number) => any
  ) => {
    if (isMobile) {
      return (
        <div className="space-y-3">
          <div
            className={`text-white p-3 rounded-lg ${getTableColor(table).bg}`}
          >
            <div className="text-sm font-medium">{title}</div>
            <div className="text-xs opacity-90">{rows.length} items</div>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3 pr-2">
              {rows.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm">No items added</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setActiveCostTable(table);
                      setAddCostDialogOpen(true);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add First Item
                  </Button>
                </div>
              ) : (
                rows.map((row, index) => (
                  <div
                    key={index}
                    className="bg-white border rounded-lg p-3 shadow-sm"
                  >
                    {renderRow(row, index)}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveCostTable(table);
              setAddCostDialogOpen(true);
            }}
            className={`w-full ${getTableColor(table).text} ${
              getTableColor(table).border
            } hover:${getTableColor(table).hover}`}
          >
            <Plus className="w-3 h-3 mr-1" /> Add {title} Item
          </Button>
        </div>
      );
    }

    // Desktop version
    return (
      <div className="space-y-2">
        <div
          className={`grid grid-cols-12 gap-1 md:gap-2 text-xs font-medium text-white p-2 rounded ${
            getTableColor(table).bg
          }`}
        >
          <div className="col-span-3">Item</div>
          <div className="col-span-3">Description</div>
          <div className="col-span-3">Consumption</div>
          <div className="col-span-2">Cost</div>
          <div className="col-span-1 text-center">Action</div>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="space-y-1">
            {rows.map((row, index) => (
              <div
                key={index}
                className={`grid grid-cols-12 gap-1 md:gap-2 items-center text-xs py-2 border-b border-gray-200 hover:${
                  getTableColor(table).hover
                } transition-colors`}
              >
                <div className="col-span-3">
                  <Input
                    value={row.item}
                    onChange={(e) =>
                      updateCostRow(table, index, "item", e.target.value)
                    }
                    className={`h-7 text-xs ${
                      getTableColor(table).border
                    } focus:${getTableColor(table).border.replace(
                      "200",
                      "400"
                    )}`}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    value={row.description}
                    onChange={(e) =>
                      updateCostRow(table, index, "description", e.target.value)
                    }
                    className={`h-7 text-xs ${
                      getTableColor(table).border
                    } focus:${getTableColor(table).border.replace(
                      "200",
                      "400"
                    )}`}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    value={row.consumption}
                    onChange={(e) =>
                      updateCostRow(table, index, "consumption", e.target.value)
                    }
                    className={`h-7 text-xs ${
                      getTableColor(table).border
                    } focus:${getTableColor(table).border.replace(
                      "200",
                      "400"
                    )}`}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    value={row.cost}
                    onChange={(e) =>
                      updateCostRow(
                        table,
                        index,
                        "cost",
                        Number(e.target.value) || 0
                      )
                    }
                    className={`h-7 text-xs ${
                      getTableColor(table).border
                    } focus:${getTableColor(table).border.replace(
                      "200",
                      "400"
                    )}`}
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCostRow(table, index)}
                    className="h-6 w-6 p-0 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setActiveCostTable(table);
            setAddCostDialogOpen(true);
          }}
          className={`w-full ${getTableColor(table).text} ${
            getTableColor(table).border
          } hover:${getTableColor(table).hover}`}
        >
          <Plus className="w-3 h-3 mr-1" /> Add {title} Item
        </Button>
      </div>
    );
  };

  const getTableColor = (table: string) => {
    const tableColors: Record<
      string,
      { bg: string; border: string; text: string; hover: string }
    > = {
      upper: {
        bg: "bg-blue-600",
        border: "border-blue-200",
        text: "text-blue-600",
        hover: "bg-blue-50",
      },
      material: {
        bg: "bg-amber-600",
        border: "border-amber-200",
        text: "text-amber-600",
        hover: "bg-amber-50",
      },
      component: {
        bg: "bg-indigo-600",
        border: "border-indigo-200",
        text: "text-indigo-600",
        hover: "bg-indigo-50",
      },
      packaging: {
        bg: "bg-emerald-600",
        border: "border-emerald-200",
        text: "text-emerald-600",
        hover: "bg-emerald-50",
      },
      misc: {
        bg: "bg-rose-600",
        border: "border-rose-200",
        text: "text-rose-600",
        hover: "bg-rose-50",
      },
    };

    return (
      tableColors[table] || {
        bg: "bg-gray-600",
        border: "border-gray-200",
        text: "text-gray-600",
        hover: "bg-gray-50",
      }
    );
  };

  const renderCostTable = (title: string, table: string) => {
    const data = getCostTableData(table);
    const colors = getTableColor(table);

    return renderResponsiveTable(title, table, data, (row, index) =>
      isMobile ? (
        <>
          <div className="space-y-2">
            <div>
              <div className="text-xs font-medium text-gray-500">Item</div>
              <Input
                value={row.item}
                onChange={(e) =>
                  updateCostRow(table, index, "item", e.target.value)
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs font-medium text-gray-500">
                  Description
                </div>
                <Input
                  value={row.description}
                  onChange={(e) =>
                    updateCostRow(table, index, "description", e.target.value)
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500">
                  Consumption
                </div>
                <Input
                  value={row.consumption}
                  onChange={(e) =>
                    updateCostRow(table, index, "consumption", e.target.value)
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500">
                  Cost (Rs.)
                </div>
                <Input
                  type="number"
                  value={row.cost}
                  onChange={(e) =>
                    updateCostRow(
                      table,
                      index,
                      "cost",
                      Number(e.target.value) || 0
                    )
                  }
                  className="h-8 text-sm"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteCostRow(table, index)}
                className="ml-2 mt-5 h-8 w-8 p-0 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
              </Button>
            </div>
          </div>
        </>
      ) : null
    );
  };

  const renderLabourTable = () => {
    if (isMobile) {
      return (
        <div className="space-y-3">
          <div className="bg-sky-600 text-white p-3 rounded-lg">
            <div className="text-sm font-medium">Labour Cost</div>
            <div className="text-xs opacity-90">
              {currentLabour.items.length} items • Total: Rs.{" "}
              {currentLabour.directTotal.toLocaleString("en-IN")}
            </div>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3 pr-2">
              {currentLabour.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm">No labour items added</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setAddLabourDialogOpen(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add First Labour
                  </Button>
                </div>
              ) : (
                currentLabour.items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white border rounded-lg p-3 shadow-sm"
                  >
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-medium text-gray-500">
                          Labour Item
                        </div>
                        <Input
                          value={item.name}
                          onChange={(e) =>
                            updateLabour(index, "name", e.target.value)
                          }
                          className="h-8 text-sm border-sky-200 focus:border-sky-400"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-xs font-medium text-gray-500">
                            Cost (Rs.)
                          </div>
                          <Input
                            type="number"
                            value={item.cost}
                            onChange={(e) =>
                              updateLabour(
                                index,
                                "cost",
                                Number(e.target.value) || 0
                              )
                            }
                            className="h-8 text-sm border-sky-200 focus:border-sky-400"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteLabour(index)}
                          className="ml-2 mt-5 h-8 w-8 p-0 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <div className="bg-sky-50 p-3 rounded-lg border border-sky-200">
            <div className="text-sm font-semibold text-sky-800">
              Direct Labour Total: Rs.{" "}
              {currentLabour.directTotal.toLocaleString("en-IN")}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddLabourDialogOpen(true)}
            className="w-full text-sky-600 border-sky-300 hover:bg-sky-50 hover:text-sky-700"
          >
            <Plus className="w-3 h-3 mr-1" /> Add Labour
          </Button>
        </div>
      );
    }

    // Desktop version
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-1 md:gap-2 text-xs font-medium text-white bg-sky-600 p-2 rounded">
          <div className="col-span-9">Labour Item</div>
          <div className="col-span-2">Cost</div>
          <div className="col-span-1 text-center">Action</div>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="space-y-1">
            {currentLabour.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-1 md:gap-2 items-center text-xs py-2 border-b border-gray-200 hover:bg-sky-50 transition-colors"
              >
                <div className="col-span-9">
                  <Input
                    value={item.name}
                    onChange={(e) =>
                      updateLabour(index, "name", e.target.value)
                    }
                    className="h-7 text-xs border-sky-200 focus:border-sky-400"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    value={item.cost}
                    onChange={(e) =>
                      updateLabour(index, "cost", Number(e.target.value) || 0)
                    }
                    className="h-7 text-xs border-sky-200 focus:border-sky-400"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteLabour(index)}
                    className="h-6 w-6 p-0 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="bg-sky-50 p-3 rounded-lg border border-sky-200">
          <div className="text-sm font-semibold text-sky-800">
            Direct Labour Total: Rs.{" "}
            {currentLabour.directTotal.toLocaleString("en-IN")}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddLabourDialogOpen(true)}
          className="w-full text-sky-600 border-sky-300 hover:bg-sky-50 hover:text-sky-700"
        >
          <Plus className="w-3 h-3 mr-1" /> Add Labour
        </Button>
      </div>
    );
  };

  const hasUnsavedChanges = Object.keys(pendingColorVariants).length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={`${
            isMobile
              ? "max-w-[95vw]! w-[95vw]! h-[95vh]! max-h-[95vh]! m-0! "
              : "max-w-[90vw]! w-[90vw]! max-h-[90vh]!"
          } p-0 flex flex-col overflow-hidden rounded-lg`}
        >
          {/* Header - Responsive */}
          <div className="sticky top-0 z-50 px-4 md:px-6 py-3 md:py-4 bg-linear-to-r from-purple-50 to-blue-50 border-b shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
              <div className="flex items-center justify-between md:justify-start gap-3 md:gap-4">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="h-8 w-8"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-linear-to-br from-purple-500 to-blue-600 rounded-lg md:rounded-xl flex items-center justify-center shadow">
                    <Palette className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-lg md:text-xl font-bold text-gray-900 truncate">
                      Color Variants
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm text-gray-600 truncate">
                        {project?.autoCode}
                      </span>
                      {hasUnsavedChanges && (
                        <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                          Unsaved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                  className="bg-green-600 hover:bg-green-700 text-xs md:text-sm h-8 md:h-9"
                  size="sm"
                >
                  <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  {isMobile ? "Save" : "Save All"}
                </Button>
                <Button
                  variant="ghost"
                  size={isMobile ? "sm" : "icon"}
                  onClick={() => onOpenChange(false)}
                  className={isMobile ? "h-8" : "h-8 w-8 md:h-9 md:w-9"}
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </div>
            </div>

            {/* Color Tabs - Responsive */}
            <div className="mt-3 md:mt-4">
              <div className="flex items-center justify-between gap-2">
                <ScrollArea className="flex-1" orientation="horizontal">
                  <div className="flex items-center gap-1 pb-1">
                    {selectedColors.map((colorId) => (
                      <button
                        key={colorId}
                        onClick={() => setActiveColorTab(colorId)}
                        className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 border-b-2 transition-colors shrink-0 min-w-fit ${
                          activeColorTab === colorId
                            ? "border-purple-600 text-purple-700 bg-purple-50"
                            : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <div
                          className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: getColorHex(colorId) }}
                        />
                        <span className="text-xs md:text-sm font-medium truncate max-w-[80px] md:max-w-none">
                          {getColorName(colorId)}
                        </span>
                        {colorId === project?.color && (
                          <span className="hidden md:inline text-xs text-gray-500">
                            (Default)
                          </span>
                        )}
                        {selectedColors.length > 1 &&
                          colorId !== project?.color && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveColor(colorId);
                              }}
                              className="ml-0.5 md:ml-1 p-0.5 hover:bg-gray-100 rounded"
                            >
                              <X className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-400 hover:text-red-500" />
                            </button>
                          )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
                <Button
                  onClick={() => setIsAddingColor(!isAddingColor)}
                  variant="outline"
                  size={isMobile ? "sm" : "default"}
                  className="h-7 md:h-8 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {isMobile ? "Add" : "Add Color"}
                </Button>
              </div>

              {/* Add Color Form - Responsive */}
              {isAddingColor && (
                <div className="mt-3 p-3 md:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                      <Label className="text-xs md:text-sm font-medium">
                        Color Name *
                      </Label>
                      <Input
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        placeholder="e.g., Navy Blue, Red, Black"
                        className="mt-1 h-8 md:h-9 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleAddNewColor}
                        disabled={!newColorName.trim()}
                        size={isMobile ? "sm" : "default"}
                        className="flex-1 md:flex-none"
                      >
                        <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        {isMobile ? "Create" : "Create Variant"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingColor(false)}
                        size={isMobile ? "sm" : "default"}
                      >
                        {isMobile ? "Cancel" : "Cancel"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Always render this container */}
          <div className="flex-1 flex overflow-hidden">
            {/* Mobile Menu Sidebar */}
            {isMobile && showMobileMenu && (
              <div className="fixed inset-0 z-50 bg-black/50 md:hidden">
                <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-lg">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Cost Tables</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-2">
                    {[
                      "upper",
                      "materialcost",
                      "componentcost",
                      "packaging",
                      "misc",
                      "labour",
                    ].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => {
                          setActiveTab(tab);
                          setShowMobileMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 flex items-center justify-between ${
                          activeTab === tab
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              getTableColor(tab).bg
                            }`}
                          />
                          <span className="text-sm font-medium">
                            {tab === "materialcost"
                              ? "Material Cost"
                              : tab === "componentcost"
                              ? "Component Cost"
                              : tab.charAt(0).toUpperCase() + tab.slice(1)}{" "}
                            Cost
                          </span>
                        </div>
                        {activeTab === tab && (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Content Area - Always render this container */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Color Info Bar - Shows when color is selected */}
              {activeColorTab && (
                <div className="px-4 md:px-6 py-2 md:py-3 bg-gray-50 border-b">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div
                        className="w-5 h-5 md:w-6 md:h-6 rounded-full border shadow-sm"
                        style={{ backgroundColor: getColorHex(activeColorTab) }}
                      />
                      <div className="min-w-0">
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 truncate">
                          {getColorName(activeColorTab)}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {pendingColorVariants[activeColorTab]
                            ? "Modified locally"
                            : "Saved"}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-teal-600 font-medium">
                          {currentMaterials.length}
                        </span>{" "}
                        materials
                      </span>
                      <span className="mx-2">•</span>
                      <span className="inline-flex items-center gap-1">
                        <span className="text-purple-600 font-medium">
                          {currentComponents.length}
                        </span>{" "}
                        components
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Tab Navigation - Shows when color is selected */}
              {isMobile && activeColorTab && (
                <div className="px-4 py-2 border-b bg-white">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMobileMenu(true)}
                      className="flex items-center gap-1"
                    >
                      <Menu className="w-3 h-3" />
                      <span className="text-xs font-medium">
                        {activeTab === "upper"
                          ? "Upper Cost"
                          : activeTab === "materialcost"
                          ? "Material Cost"
                          : activeTab === "componentcost"
                          ? "Component Cost"
                          : activeTab === "packaging"
                          ? "Packaging Cost"
                          : activeTab === "misc"
                          ? "Miscellaneous"
                          : "Labour Cost"}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          const tabs = [
                            "upper",
                            "materialcost",
                            "componentcost",
                            "packaging",
                            "misc",
                            "labour",
                          ];
                          const currentIndex = tabs.indexOf(activeTab);
                          const prevIndex =
                            currentIndex > 0
                              ? currentIndex - 1
                              : tabs.length - 1;
                          setActiveTab(tabs[prevIndex]);
                        }}
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          const tabs = [
                            "upper",
                            "materialcost",
                            "componentcost",
                            "packaging",
                            "misc",
                            "labour",
                          ];
                          const currentIndex = tabs.indexOf(activeTab);
                          const nextIndex =
                            currentIndex < tabs.length - 1
                              ? currentIndex + 1
                              : 0;
                          setActiveTab(tabs[nextIndex]);
                        }}
                      >
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop Tabs - Shows when color is selected */}
              {!isMobile && activeColorTab && (
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="flex-1 flex flex-col"
                >
                  <div className="px-6 pt-3 border-b">
                    <TabsList className="w-full justify-start overflow-x-auto">
                      {[
                        "upper",
                        "materialcost",
                        "componentcost",
                        "packaging",
                        "misc",
                        "labour",
                      ].map((tab) => (
                        <TabsTrigger
                          key={tab}
                          value={tab}
                          className="text-xs md:text-sm px-3 md:px-4"
                        >
                          {tab === "materialcost"
                            ? "Material Cost"
                            : tab === "componentcost"
                            ? "Component Cost"
                            : tab.charAt(0).toUpperCase() + tab.slice(1)}{" "}
                          Cost
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* TabsContent components as direct children of Tabs */}
                  <TabsContent value="upper" className="m-0 flex-1">
                    <ScrollArea className="flex-1">
                      <div className="p-4 md:p-6">
                        <div className="bg-white rounded-lg border-2 border-blue-200 p-4 md:p-6">
                          <h4 className="text-lg md:text-xl font-semibold text-blue-900 mb-3 md:mb-4">
                            Upper Cost Analysis
                          </h4>
                          {renderCostTable("Upper", "upper")}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="materialcost" className="m-0 flex-1">
                    <ScrollArea className="flex-1">
                      <div className="p-4 md:p-6">
                        <div className="bg-white rounded-lg border-2 border-amber-200 p-4 md:p-6">
                          <h4 className="text-lg md:text-xl font-semibold text-amber-900 mb-3 md:mb-4">
                            Material Cost Analysis
                          </h4>
                          {renderCostTable("Material", "material")}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="componentcost" className="m-0 flex-1">
                    <ScrollArea className="flex-1">
                      <div className="p-4 md:p-6">
                        <div className="bg-white rounded-lg border-2 border-indigo-200 p-4 md:p-6">
                          <h4 className="text-lg md:text-xl font-semibold text-indigo-900 mb-3 md:mb-4">
                            Component Cost Analysis
                          </h4>
                          {renderCostTable("Component", "component")}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="packaging" className="m-0 flex-1">
                    <ScrollArea className="flex-1">
                      <div className="p-4 md:p-6">
                        <div className="bg-white rounded-lg border-2 border-emerald-200 p-4 md:p-6">
                          <h4 className="text-lg md:text-xl font-semibold text-emerald-900 mb-3 md:mb-4">
                            Packaging Cost Analysis
                          </h4>
                          {renderCostTable("Packaging", "packaging")}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="misc" className="m-0 flex-1">
                    <ScrollArea className="flex-1">
                      <div className="p-4 md:p-6">
                        <div className="bg-white rounded-lg border-2 border-rose-200 p-4 md:p-6">
                          <h4 className="text-lg md:text-xl font-semibold text-rose-900 mb-3 md:mb-4">
                            Miscellaneous Cost Analysis
                          </h4>
                          {renderCostTable("Miscellaneous", "misc")}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="labour" className="m-0 flex-1">
                    <ScrollArea className="flex-1">
                      <div className="p-4 md:p-6">
                        <div className="bg-white rounded-lg border-2 border-sky-200 p-4 md:p-6">
                          <h4 className="text-lg md:text-xl font-semibold text-sky-900 mb-3 md:mb-4">
                            Labour Cost Analysis
                          </h4>
                          {renderLabourTable()}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              )}

              {/* Main Content Area - Always render ScrollArea with conditional content */}
              {(!isMobile || (isMobile && !activeColorTab)) && (
                <ScrollArea className="flex-1">
                  <div className="p-4 md:p-6">
                    {activeColorTab ? (
                      // Desktop - No tab selected yet (shows welcome message)
                      !isMobile && (
                        <div className="text-center py-12">
                          <Calculator className="w-20 h-20 text-blue-400 mx-auto mb-6" />
                          <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                            Select a Cost Table
                          </h3>
                          <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            Choose a cost table from the tabs above to view or
                            edit detailed cost breakdowns for this color variant
                          </p>
                          <div className="flex flex-wrap justify-center gap-3">
                            {[
                              "upper",
                              "materialcost",
                              "componentcost",
                              "packaging",
                              "misc",
                              "labour",
                            ].map((tab) => (
                              <Button
                                key={tab}
                                variant="outline"
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 ${
                                  getTableColor(tab).border
                                } ${getTableColor(tab).text} hover:${
                                  getTableColor(tab).hover
                                }`}
                              >
                                {tab === "materialcost"
                                  ? "Material Cost"
                                  : tab === "componentcost"
                                  ? "Component Cost"
                                  : tab.charAt(0).toUpperCase() +
                                    tab.slice(1)}{" "}
                                Cost
                              </Button>
                            ))}
                          </div>
                        </div>
                      )
                    ) : (
                      // No color selected - show empty state
                      <div className="h-full flex items-center justify-center py-12">
                        <div className="text-center max-w-md mx-auto">
                          <Palette className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                          <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                            No Color Selected
                          </h3>
                          <p className="text-gray-500 mb-8">
                            {selectedColors.length === 0
                              ? "Create your first color variant to start adding materials and costs"
                              : "Select a color variant from the tabs above to start adding materials and costs"}
                          </p>
                          {selectedColors.length === 0 ? (
                            <Button
                              onClick={() => setIsAddingColor(true)}
                              size="lg"
                              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
                            >
                              <Plus className="w-5 h-5 mr-2" />
                              Create Your First Color Variant
                            </Button>
                          ) : (
                            <div className="text-lg text-gray-600 font-medium">
                              Click on any color tab above to get started
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}

              {/* Mobile Content Area - Shows when color is selected */}
              {isMobile && activeColorTab && (
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <div className="space-y-6">
                      <div
                        className={`bg-white rounded-lg border-2 p-4 ${
                          getTableColor(activeTab).border
                        }`}
                      >
                        <h4
                          className={`text-lg font-semibold mb-3 ${getTableColor(
                            activeTab
                          ).text.replace("600", "900")}`}
                        >
                          {activeTab === "upper"
                            ? "Upper Cost Analysis"
                            : activeTab === "materialcost"
                            ? "Material Cost Analysis"
                            : activeTab === "componentcost"
                            ? "Component Cost Analysis"
                            : activeTab === "packaging"
                            ? "Packaging Cost Analysis"
                            : activeTab === "misc"
                            ? "Miscellaneous Cost Analysis"
                            : "Labour Cost Analysis"}
                        </h4>
                        {activeTab === "labour"
                          ? renderLabourTable()
                          : renderCostTable(
                              activeTab === "upper"
                                ? "Upper"
                                : activeTab === "materialcost"
                                ? "Material"
                                : activeTab === "componentcost"
                                ? "Component"
                                : activeTab === "packaging"
                                ? "Packaging"
                                : "Miscellaneous",
                              activeTab === "materialcost"
                                ? "material"
                                : activeTab === "componentcost"
                                ? "component"
                                : activeTab
                            )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogs - Responsive */}
      <Dialog
        open={addMaterialDialogOpen}
        onOpenChange={setAddMaterialDialogOpen}
      >
        <DialogContent
          className={isMobile ? "max-w-[95vw] w-[95vw] rounded-lg" : "max-w-md"}
        >
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">
              Add New Material
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 md:space-y-4">
            <div>
              <Label className="text-sm">Material Name *</Label>
              <Input
                value={newMaterial.name}
                onChange={(e) =>
                  setNewMaterial({ ...newMaterial, name: e.target.value })
                }
                className="h-9 md:h-10 text-sm"
                placeholder="e.g., Upper, Lining"
              />
            </div>
            <div>
              <Label className="text-sm">Description</Label>
              <Input
                value={newMaterial.desc}
                onChange={(e) =>
                  setNewMaterial({ ...newMaterial, desc: e.target.value })
                }
                className="h-9 md:h-10 text-sm"
                placeholder="e.g., Rexine, Skinfit"
              />
            </div>
            <div>
              <Label className="text-sm">Consumption</Label>
              <Input
                value={newMaterial.consumption}
                onChange={(e) =>
                  setNewMaterial({
                    ...newMaterial,
                    consumption: e.target.value,
                  })
                }
                className="h-9 md:h-10 text-sm"
                placeholder="e.g., 26 pairs/mtr"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setAddMaterialDialogOpen(false)}
              size={isMobile ? "default" : "default"}
              className="w-full md:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const updated = [...currentMaterials, { ...newMaterial }];
                setCurrentMaterials(updated);
                updatePendingData({ materials: updated });
                setAddMaterialDialogOpen(false);
                setNewMaterial({ name: "", desc: "", consumption: "" });
                toast.success("Material added");
              }}
              size={isMobile ? "default" : "default"}
              className="w-full md:w-auto"
            >
              Add Material
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addComponentDialogOpen}
        onOpenChange={setAddComponentDialogOpen}
      >
        <DialogContent
          className={isMobile ? "max-w-[95vw] w-[95vw] rounded-lg" : "max-w-md"}
        >
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">
              Add New Component
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 md:space-y-4">
            <div>
              <Label className="text-sm">Component Name *</Label>
              <Input
                value={newComponent.name}
                onChange={(e) =>
                  setNewComponent({ ...newComponent, name: e.target.value })
                }
                className="h-9 md:h-10 text-sm"
                placeholder="e.g., Foam, Velcro"
              />
            </div>
            <div>
              <Label className="text-sm">Description</Label>
              <Input
                value={newComponent.desc}
                onChange={(e) =>
                  setNewComponent({ ...newComponent, desc: e.target.value })
                }
                className="h-9 md:h-10 text-sm"
                placeholder="e.g., 75mm, sticker"
              />
            </div>
            <div>
              <Label className="text-sm">Consumption</Label>
              <Input
                value={newComponent.consumption}
                onChange={(e) =>
                  setNewComponent({
                    ...newComponent,
                    consumption: e.target.value,
                  })
                }
                className="h-9 md:h-10 text-sm"
                placeholder="e.g., 7.5grm, 2pcs"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setAddComponentDialogOpen(false)}
              size={isMobile ? "default" : "default"}
              className="w-full md:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const updated = [...currentComponents, { ...newComponent }];
                setCurrentComponents(updated);
                updatePendingData({ components: updated });
                setAddComponentDialogOpen(false);
                setNewComponent({ name: "", desc: "", consumption: "" });
                toast.success("Component added");
              }}
              size={isMobile ? "default" : "default"}
              className="w-full md:w-auto"
            >
              Add Component
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addCostDialogOpen} onOpenChange={setAddCostDialogOpen}>
        <DialogContent
          className={isMobile ? "max-w-[95vw] w-[95vw] rounded-lg" : "max-w-md"}
        >
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">
              Add Cost Item
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 md:space-y-4">
            <div>
              <Label className="text-sm">Item Name *</Label>
              <Input
                value={newCostItem.item}
                onChange={(e) =>
                  setNewCostItem({ ...newCostItem, item: e.target.value })
                }
                className="h-9 md:h-10 text-sm"
                placeholder="e.g., Upper Material"
              />
            </div>
            <div>
              <Label className="text-sm">Description</Label>
              <Input
                value={newCostItem.description}
                onChange={(e) =>
                  setNewCostItem({
                    ...newCostItem,
                    description: e.target.value,
                  })
                }
                className="h-9 md:h-10 text-sm"
                placeholder="e.g., Rexine, Leather"
              />
            </div>
            <div>
              <Label className="text-sm">Consumption</Label>
              <Input
                value={newCostItem.consumption}
                onChange={(e) =>
                  setNewCostItem({
                    ...newCostItem,
                    consumption: e.target.value,
                  })
                }
                className="h-9 md:h-10 text-sm"
                placeholder="e.g., 26 pairs/mtr"
              />
            </div>
            <div>
              <Label className="text-sm">Cost (Rs.)</Label>
              <Input
                type="number"
                value={newCostItem.cost}
                onChange={(e) =>
                  setNewCostItem({
                    ...newCostItem,
                    cost: Number(e.target.value) || 0,
                  })
                }
                className="h-9 md:h-10 text-sm"
                placeholder="e.g., 1500"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setAddCostDialogOpen(false)}
              size={isMobile ? "default" : "default"}
              className="w-full md:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={addCostRow}
              size={isMobile ? "default" : "default"}
              className="w-full md:w-auto"
            >
              Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addLabourDialogOpen} onOpenChange={setAddLabourDialogOpen}>
        <DialogContent
          className={isMobile ? "max-w-[95vw] w-[95vw] rounded-lg" : "max-w-md"}
        >
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">
              Add Labour Item
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 md:space-y-4">
            <div>
              <Label className="text-sm">Labour Name *</Label>
              <Input
                value={newLabourItem.name}
                onChange={(e) =>
                  setNewLabourItem({ ...newLabourItem, name: e.target.value })
                }
                className="h-9 md:h-10 text-sm"
                placeholder="e.g., Stitching, Assembly"
              />
            </div>
            <div>
              <Label className="text-sm">Cost (Rs.)</Label>
              <Input
                type="number"
                value={newLabourItem.cost}
                onChange={(e) =>
                  setNewLabourItem({
                    ...newLabourItem,
                    cost: Number(e.target.value) || 0,
                  })
                }
                className="h-9 md:h-10 text-sm"
                placeholder="e.g., 500"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setAddLabourDialogOpen(false)}
              size={isMobile ? "default" : "default"}
              className="w-full md:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={addLabour}
              size={isMobile ? "default" : "default"}
              className="w-full md:w-auto"
            >
              Add Labour
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
