import { CheckCircle, Palette, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../lib/api";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

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

interface ColorVariantData {
  materials: Material[];
  components: Component[];
  images: string[];
  updatedBy?: string | null;
  updatedAt?: Date;
}

interface ColorMaterialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  colors?: any[]; // master colors array: { id, colorName, hexCode } etc.
  onSave?: (savedColorIds: string[]) => void;
}

export function ColorMaterialsDialog({
  open,
  onOpenChange,
  project,
  colors,
  onSave,
}: ColorMaterialsDialogProps) {
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [activeColorTab, setActiveColorTab] = useState<string>("");
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [isAddingColor, setIsAddingColor] = useState(false);
  const [customColors, setCustomColors] = useState<{
    [key: string]: { name: string; hex: string };
  }>({});
  const [colorVariantsData, setColorVariantsData] = useState<{
    [colorId: string]: {
      materials: Array<{ name: string; desc: string; consumption: string }>;
      components: Array<{ name: string; desc: string; consumption: string }>;
      images?: string[];
      updatedBy?: string | null;
      updatedAt?: Date;
    };
  }>({});

  // Current editing state for active color tab
  const [currentComponents, setCurrentComponents] = useState<
    Array<{ name: string; desc: string; consumption: string }>
  >([]);
  const [currentMaterials, setCurrentMaterials] = useState<
    Array<{ name: string; desc: string; consumption: string }>
  >([]);

  // Dialog states for adding new items
  const [addComponentDialogOpen, setAddComponentDialogOpen] = useState(false);
  const [addMaterialDialogOpen, setAddMaterialDialogOpen] = useState(false);

  // Form fields for new component
  const [newComponentName, setNewComponentName] = useState("");
  const [newComponentDesc, setNewComponentDesc] = useState("");
  const [newComponentConsumption, setNewComponentConsumption] = useState("");

  // Form fields for new material
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialDesc, setNewMaterialDesc] = useState("");
  const [newMaterialConsumption, setNewMaterialConsumption] = useState("");

  // Default data for new color variants
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

  // ---------- color name -> hex fallback map (AUTO-DETECT by name) ----------
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

  // Load color variants from backend (safe conversion)
  const loadColorVariants = async () => {
    if (!project?._id) return;

    try {
      // Convert whatever project.colorVariants shape into a plain object
      const variants: {
        [key: string]: ColorVariantData;
      } = {};

      if (project.colorVariants instanceof Map) {
        for (const [colorId, data] of project.colorVariants.entries()) {
          variants[colorId] = {
            materials: data.materials || [],
            components: data.components || [],
            images: data.images || [],
            updatedBy: data.updatedBy,
            updatedAt: data.updatedAt,
          };
        }
      } else if (typeof project.colorVariants === "object") {
        Object.assign(variants, project.colorVariants);
      }

      // If backend returned nothing but project.color exists, seed with defaults
      if (Object.keys(variants).length === 0 && project.color) {
        variants[project.color] = {
          materials: getDefaultMaterials(),
          components: getDefaultComponents(),
          images: [],
        };
      }

      setColorVariantsData(variants);

      const colorIds = Object.keys(variants);
      if (colorIds.length > 0) {
        setSelectedColors(colorIds);
        // Keep previously active tab if present else set to first
        setActiveColorTab((prev) =>
          prev && colorIds.includes(prev) ? prev : colorIds[0]
        );
      } else {
        setSelectedColors([]);
        setActiveColorTab("");
      }
    } catch (error) {
      console.error("Error loading color variants:", error);
      toast.error("Failed to load color variants");
    }
  };

  // 🔥 FIXED: Enhanced useEffect to properly reload when dialog opens
  useEffect(() => {
    if (project && open) {
      loadColorVariants();

      // Also reset the adding state when dialog opens
      setIsAddingColor(false);
      setNewColorName("");
      setNewColorHex("#000000");
    }
  }, [project, open]);

  // Load current components/materials when active tab changes
  useEffect(() => {
    if (activeColorTab) {
      const variantData = colorVariantsData[activeColorTab];
      if (variantData) {
        setCurrentComponents(variantData.components || []);
        setCurrentMaterials(variantData.materials || []);
      } else {
        setCurrentComponents(getDefaultComponents());
        setCurrentMaterials(getDefaultMaterials());
      }
    } else {
      setCurrentComponents([]);
      setCurrentMaterials([]);
    }
  }, [activeColorTab, colorVariantsData]);

  if (!project) return null;

  const getColorName = (colorId: string) => {
    // Check custom colors first (user-created)
    if (customColors[colorId]) {
      return customColors[colorId].name;
    }
    // Then check master data colors array passed via props
    const color = colors?.find(
      (c) => c.id === colorId || c.colorName === colorId
    );
    return color?.colorName || colorId || "Unknown Color";
  };

  // Auto-detect hex using (1) customColors, (2) master colors array, (3) fallback map by name
  const getColorHex = (colorIdOrName: string) => {
    // customColors store actual hex when created via dialog
    if (customColors[colorIdOrName]) {
      return customColors[colorIdOrName].hex;
    }

    // find in master colors prop by id or colorName
    const found = colors?.find(
      (c) =>
        c.id === colorIdOrName ||
        (c.colorName &&
          c.colorName.toLowerCase() === String(colorIdOrName).toLowerCase())
    );
    if (found && (found.hexCode || found.hex)) {
      return found.hexCode || found.hex;
    }

    // Try to interpret colorIdOrName as a name and lookup map
    const normalized = String(colorIdOrName)
      .toLowerCase()
      .replace(/[_\s]+/g, " ")
      .trim();
    return nameToHexMap[normalized] || nameToHexMap["default"];
  };

  const handleRemoveColor = async (colorId: string) => {
    if (!project?._id) return;

    try {
      await api.delete(`/projects/${project._id}/color-variants/${colorId}`);

      const newColors = selectedColors.filter((id) => id !== colorId);
      setSelectedColors(newColors);

      // Remove from local state
      const newVariants = { ...colorVariantsData };
      delete newVariants[colorId];
      setColorVariantsData(newVariants);

      // Switch to first color if we're removing the active tab
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

  const handleAddNewColor = async () => {
    if (!newColorName.trim() || !project?._id) return;

    try {
      const newColorId = newColorName.toLowerCase().replace(/\s+/g, "_");

      // Create new color variant with backend API using defaults
      const variantData = {
        materials: getDefaultMaterials(),
        components: getDefaultComponents(),
        images: [],
      };

      await api.put(
        `/projects/${project._id}/color-variants/${newColorId}`,
        variantData
      );

      // 🔥 FIXED: Immediately update local state instead of waiting for reload
      const newVariantsData = {
        ...colorVariantsData,
        [newColorId]: variantData,
      };

      setColorVariantsData(newVariantsData);

      // Update selected colors and active tab immediately
      setSelectedColors((prev) => [...prev, newColorId]);
      setActiveColorTab(newColorId);

      // Also update custom colors for display
      setCustomColors((prev) => ({
        ...prev,
        [newColorId]: {
          name: newColorName,
          hex: getColorHex(newColorName),
        },
      }));

      toast.success(`New color variant "${newColorName}" created`);
      setNewColorName("");
      setNewColorHex("#000000");
      setIsAddingColor(false);
    } catch (error) {
      console.error("Error creating color variant:", error);
      toast.error("Failed to create color variant");
    }
  };

  const handleCloneDefaultColors = async (colorIds: string[]) => {
    if (!project?._id) return;

    try {
      await api.post(`/projects/${project._id}/color-variants/clone-default`, {
        colors: colorIds,
      });

      // Reload color variants after cloning
      await loadColorVariants();
      toast.success("Color variants cloned successfully");
    } catch (error) {
      console.error("Error cloning color variants:", error);
      toast.error("Failed to clone color variants");
    }
  };

  // Update component field
  const updateComponent = (
    index: number,
    field: "name" | "desc" | "consumption",
    value: string
  ) => {
    const updated = [...currentComponents];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentComponents(updated);
  };

  // Update material field
  const updateMaterial = (
    index: number,
    field: "name" | "desc" | "consumption",
    value: string
  ) => {
    const updated = [...currentMaterials];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentMaterials(updated);
  };

  // Delete component
  const deleteComponent = (index: number) => {
    const updated = currentComponents.filter((_, i) => i !== index);
    setCurrentComponents(updated);
    toast.success("Component removed");
  };

  // Delete material
  const deleteMaterial = (index: number) => {
    const updated = currentMaterials.filter((_, i) => i !== index);
    setCurrentMaterials(updated);
    toast.success("Material removed");
  };

  // Open add component dialog
  const openAddComponentDialog = () => {
    setAddComponentDialogOpen(true);
  };

  // Open add material dialog
  const openAddMaterialDialog = () => {
    setAddMaterialDialogOpen(true);
  };

  // Save new component
  const saveNewComponent = () => {
    if (!newComponentName.trim()) {
      toast.error("Please enter component name");
      return;
    }

    setCurrentComponents([
      ...currentComponents,
      {
        name: newComponentName,
        desc: newComponentDesc,
        consumption: newComponentConsumption,
      },
    ]);

    // Reset form and close dialog
    setNewComponentName("");
    setNewComponentDesc("");
    setNewComponentConsumption("");
    setAddComponentDialogOpen(false);
    toast.success("Component added successfully");
  };

  // Save new material
  const saveNewMaterial = () => {
    if (!newMaterialName.trim()) {
      toast.error("Please enter material name");
      return;
    }

    setCurrentMaterials([
      ...currentMaterials,
      {
        name: newMaterialName,
        desc: newMaterialDesc,
        consumption: newMaterialConsumption,
      },
    ]);

    // Reset form and close dialog
    setNewMaterialName("");
    setNewMaterialDesc("");
    setNewMaterialConsumption("");
    setAddMaterialDialogOpen(false);
    toast.success("Material added successfully");
  };

  const handleSave = async () => {
    if (!project?._id || !activeColorTab) return;

    try {
      // Update the current variant data
      const updatedVariantData = {
        materials: currentMaterials,
        components: currentComponents,
        images: colorVariantsData[activeColorTab]?.images || [],
      };

      // Save to backend
      await api.put(
        `/projects/${project._id}/color-variants/${activeColorTab}`,
        updatedVariantData
      );

      // Update local state
      setColorVariantsData((prev) => ({
        ...prev,
        [activeColorTab]: updatedVariantData,
      }));

      toast.success("Color variants saved successfully!");

      // 🔥 FIXED: Call onSave with ALL selected colors, not just active one
      if (onSave) {
        onSave(selectedColors);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving color variants:", error);
      toast.error("Failed to save color variants");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[85vw] !w-[85vw] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
        {/* Sticky Header Section - Green Theme (matching Green Seal) */}
        <div className="sticky top-0 z-50 px-8 py-6 bg-gradient-to-r from-green-50 via-white to-green-50 border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Palette className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-semibold text-gray-900 mb-2">
                  Brand Color Variants
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Manage color options and their specific materials & components
                </DialogDescription>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-lg text-gray-600">
                    {project.autoCode}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                className="bg-green-500 hover:bg-green-600"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Color Variant
              </Button>
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

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-8 py-4 space-y-5">
            {/* Color Variant Tabs Section */}
            <div className="space-y-3">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-gray-200">
                {selectedColors.map((colorId) => (
                  <button
                    key={colorId}
                    onClick={() => setActiveColorTab(colorId)}
                    className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
                      activeColorTab === colorId
                        ? "border-green-600 text-gray-900"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{
                        backgroundColor: getColorHex(getColorName(colorId)),
                      }}
                    ></div>
                    <span>
                      {getColorName(colorId)}
                      {colorId === project.color && (
                        <span className="ml-1.5 text-xs text-gray-500">
                          (Default)
                        </span>
                      )}
                    </span>
                    {selectedColors.length > 1 && colorId !== project.color && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveColor(colorId);
                        }}
                        className="ml-1 p-0.5 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                        role="button"
                        aria-label="Remove color variant"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                      </span>
                    )}
                  </button>
                ))}

                {/* Add Color Variant Button */}
                <button
                  onClick={() => setIsAddingColor(!isAddingColor)}
                  className={`flex items-center gap-1.5 px-3 py-2 ml-auto text-sm border rounded transition-colors ${
                    isAddingColor
                      ? "bg-purple-500 text-white border-purple-500"
                      : "border-gray-300 text-gray-700 hover:border-purple-400 hover:text-purple-600"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Variant</span>
                </button>
              </div>

              {/* Add New Color Form */}
              {isAddingColor && (
                <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Create New Color Variant
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-700 mb-2">
                        Color Name
                      </Label>
                      <Input
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        placeholder="e.g., Navy Blue"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button
                        onClick={handleAddNewColor}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 flex-1"
                        disabled={!newColorName.trim()}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Create Variant
                      </Button>
                      <Button
                        onClick={() => {
                          setIsAddingColor(false);
                          setNewColorName("");
                          setNewColorHex("#000000");
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Materials & Components for Active Color Only */}
            {activeColorTab && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Components Analysis */}
                  <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <h4 className="text-lg font-semibold text-purple-900">
                        Components Used
                      </h4>
                      <div className="flex items-center gap-2 px-2 py-1 bg-purple-50 rounded">
                        <div
                          className="w-4 h-4 rounded-full border border-purple-300"
                          style={{
                            backgroundColor: getColorHex(
                              getColorName(activeColorTab)
                            ),
                          }}
                        ></div>
                        <span className="text-xs font-medium text-purple-700">
                          {getColorName(activeColorTab)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {/* Fixed Table Header */}
                      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 bg-purple-50 p-2 rounded">
                        <div className="col-span-3">COMPONENT</div>
                        <div className="col-span-4">DESCRIPTION</div>
                        <div className="col-span-4">CONSUMPTION</div>
                        <div className="col-span-1 text-center">ACTION</div>
                      </div>

                      {/* Scrollable Content */}
                      <div className="max-h-64 overflow-y-auto scrollbar-hide space-y-2">
                        {currentComponents.map((item, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-12 gap-2 items-center text-sm py-2 border-b border-gray-200 group hover:bg-purple-50 transition-colors px-2 -mx-2 rounded"
                          >
                            <div className="col-span-3">
                              <Input
                                value={item.name}
                                onChange={(e) =>
                                  updateComponent(index, "name", e.target.value)
                                }
                                className="h-8 text-sm"
                                placeholder="Component"
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                value={item.desc}
                                onChange={(e) =>
                                  updateComponent(index, "desc", e.target.value)
                                }
                                className="h-8 text-sm"
                                placeholder="Description"
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                value={item.consumption}
                                onChange={(e) =>
                                  updateComponent(
                                    index,
                                    "consumption",
                                    e.target.value
                                  )
                                }
                                className="h-8 text-sm"
                                placeholder="Consumption"
                              />
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteComponent(index)}
                                className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add New Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
                        onClick={openAddComponentDialog}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Component
                      </Button>

                      {/* Total Count */}
                      <div className="bg-purple-50 p-3 rounded-lg mt-3">
                        <div className="text-sm text-purple-800">
                          <strong>Total Components:</strong>{" "}
                          {currentComponents.length} different components used
                          in production
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Materials Analysis */}
                  <div className="bg-white border-2 border-teal-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <h4 className="text-lg font-semibold text-teal-900">
                        Materials Used
                      </h4>
                      <div className="flex items-center gap-2 px-2 py-1 bg-teal-50 rounded">
                        <div
                          className="w-4 h-4 rounded-full border border-teal-300"
                          style={{
                            backgroundColor: getColorHex(
                              getColorName(activeColorTab)
                            ),
                          }}
                        ></div>
                        <span className="text-xs font-medium text-teal-700">
                          {getColorName(activeColorTab)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {/* Fixed Table Header */}
                      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 bg-teal-50 p-2 rounded">
                        <div className="col-span-3">MATERIAL</div>
                        <div className="col-span-4">DESCRIPTION</div>
                        <div className="col-span-4">CONSUMPTION</div>
                        <div className="col-span-1 text-center">ACTION</div>
                      </div>

                      {/* Scrollable Content */}
                      <div className="max-h-64 overflow-y-auto scrollbar-hide space-y-2">
                        {currentMaterials.map((item, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-12 gap-2 items-center text-sm py-2 border-b border-gray-200 group hover:bg-teal-50 transition-colors px-2 -mx-2 rounded"
                          >
                            <div className="col-span-3">
                              <Input
                                value={item.name}
                                onChange={(e) =>
                                  updateMaterial(index, "name", e.target.value)
                                }
                                className="h-8 text-sm"
                                placeholder="Material"
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                value={item.desc}
                                onChange={(e) =>
                                  updateMaterial(index, "desc", e.target.value)
                                }
                                className="h-8 text-sm"
                                placeholder="Description"
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                value={item.consumption}
                                onChange={(e) =>
                                  updateMaterial(
                                    index,
                                    "consumption",
                                    e.target.value
                                  )
                                }
                                className="h-8 text-sm"
                                placeholder="Consumption"
                              />
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMaterial(index)}
                                className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add New Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-teal-600 border-teal-200 hover:bg-teal-50"
                        onClick={openAddMaterialDialog}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Material
                      </Button>

                      {/* Total Count */}
                      <div className="bg-teal-50 p-3 rounded-lg mt-3">
                        <div className="text-sm text-teal-800">
                          <strong>Total Materials:</strong>{" "}
                          {currentMaterials.length} different materials used in
                          production
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Add New Component Dialog */}
      <Dialog
        open={addComponentDialogOpen}
        onOpenChange={setAddComponentDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-600" />
              Add New Component
            </DialogTitle>
            <DialogDescription>
              Enter the details for the new component item
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="componentName">Component Name *</Label>
              <Input
                id="componentName"
                value={newComponentName}
                onChange={(e) => setNewComponentName(e.target.value)}
                placeholder="e.g., Foam, Velcro, Thread"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="componentDesc">Description</Label>
              <Input
                id="componentDesc"
                value={newComponentDesc}
                onChange={(e) => setNewComponentDesc(e.target.value)}
                placeholder="e.g., 75mm, MRP, sticker"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="componentConsumption">Consumption</Label>
              <Input
                id="componentConsumption"
                value={newComponentConsumption}
                onChange={(e) => setNewComponentConsumption(e.target.value)}
                placeholder="e.g., 7.5grm, 1.25 pair, 2pcs"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAddComponentDialogOpen(false);
                setNewComponentName("");
                setNewComponentDesc("");
                setNewComponentConsumption("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveNewComponent}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Add Component
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Material Dialog */}
      <Dialog
        open={addMaterialDialogOpen}
        onOpenChange={setAddMaterialDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Plus className="w-5 h-5 text-teal-600" />
              Add New Material
            </DialogTitle>
            <DialogDescription>
              Enter the details for the new material item
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="materialName">Material Name *</Label>
              <Input
                id="materialName"
                value={newMaterialName}
                onChange={(e) => setNewMaterialName(e.target.value)}
                placeholder="e.g., Upper, Lining, Footbed"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="materialDesc">Description</Label>
              <Input
                id="materialDesc"
                value={newMaterialDesc}
                onChange={(e) => setNewMaterialDesc(e.target.value)}
                placeholder="e.g., Rexine, Skinfit, EVA"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="materialConsumption">Consumption</Label>
              <Input
                id="materialConsumption"
                value={newMaterialConsumption}
                onChange={(e) => setNewMaterialConsumption(e.target.value)}
                placeholder="e.g., 26 pairs/mtr, 25 pair @ 155/-"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAddMaterialDialogOpen(false);
                setNewMaterialName("");
                setNewMaterialDesc("");
                setNewMaterialConsumption("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveNewMaterial}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Add Material
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
