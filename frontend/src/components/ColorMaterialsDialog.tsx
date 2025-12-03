// ColorMaterialsDialog.tsx
import { CheckCircle, Palette, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../lib/api";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
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
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [activeColorTab, setActiveColorTab] = useState<string>("");
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [isAddingColor, setIsAddingColor] = useState(false);
  const [customColors, setCustomColors] = useState<{
    [key: string]: { name: string; hex: string };
  }>({});
  const [colorVariantsData, setColorVariantsData] = useState<{
    [colorId: string]: ColorVariantData;
  }>({});
  const [isMobile, setIsMobile] = useState(false);

  const [pendingColorVariants, setPendingColorVariants] = useState<{
    [colorId: string]: ColorVariantData;
  }>({});
  const [newColorVariants, setNewColorVariants] = useState<string[]>([]);

  const [currentComponents, setCurrentComponents] = useState<
    Array<{ name: string; desc: string; consumption: string }>
  >([]);
  const [currentMaterials, setCurrentMaterials] = useState<
    Array<{ name: string; desc: string; consumption: string }>
  >([]);

  const [addComponentDialogOpen, setAddComponentDialogOpen] = useState(false);
  const [addMaterialDialogOpen, setAddMaterialDialogOpen] = useState(false);

  const [newComponentName, setNewComponentName] = useState("");
  const [newComponentDesc, setNewComponentDesc] = useState("");
  const [newComponentConsumption, setNewComponentConsumption] = useState("");

  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialDesc, setNewMaterialDesc] = useState("");
  const [newMaterialConsumption, setNewMaterialConsumption] = useState("");

  // Check screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const loadColorVariants = async () => {
    if (!project?._id) return;

    try {
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

      if (Object.keys(variants).length === 0 && project.color) {
        variants[project.color] = {
          materials: getDefaultMaterials(),
          components: getDefaultComponents(),
          images: [],
        };
      }

      setColorVariantsData(variants);
      setPendingColorVariants({});
      setNewColorVariants([]);

      const colorIds = Object.keys(variants);
      if (colorIds.length > 0) {
        setSelectedColors(colorIds);
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

  useEffect(() => {
    if (project && open) {
      loadColorVariants();
      setIsAddingColor(false);
      setNewColorName("");
      setNewColorHex("#000000");
    }
  }, [project, open]);

  useEffect(() => {
    if (activeColorTab) {
      const variantData =
        pendingColorVariants[activeColorTab] ||
        colorVariantsData[activeColorTab];
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
  }, [activeColorTab, colorVariantsData, pendingColorVariants]);

  if (!project) return null;

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

  const handleRemoveColor = async (colorId: string) => {
    if (!project?._id) return;

    try {
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
    if (!newColorName.trim()) return;

    const newColorId = newColorName.toLowerCase().replace(/\s+/g, "_");

    const variantData = {
      materials: getDefaultMaterials(),
      components: getDefaultComponents(),
      images: [],
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

    toast.success(`New color variant "${newColorName}" created locally`);
    setNewColorName("");
    setNewColorHex("#000000");
    setIsAddingColor(false);
  };

  const handleCloneDefaultColors = async (colorIds: string[]) => {
    if (!project?._id) return;

    try {
      await api.post(`/projects/${project._id}/color-variants/clone-default`, {
        colors: colorIds,
      });

      await loadColorVariants();
      toast.success("Color variants cloned successfully");
    } catch (error) {
      console.error("Error cloning color variants:", error);
      toast.error("Failed to clone color variants");
    }
  };

  const updateComponent = (
    index: number,
    field: "name" | "desc" | "consumption",
    value: string
  ) => {
    const updated = [...currentComponents];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentComponents(updated);

    if (activeColorTab) {
      if (pendingColorVariants[activeColorTab]) {
        setPendingColorVariants((prev) => ({
          ...prev,
          [activeColorTab]: {
            ...prev[activeColorTab],
            components: updated,
          },
        }));
      } else if (colorVariantsData[activeColorTab]) {
        setPendingColorVariants((prev) => ({
          ...prev,
          [activeColorTab]: {
            ...colorVariantsData[activeColorTab],
            components: updated,
          },
        }));
      }
    }
  };

  const updateMaterial = (
    index: number,
    field: "name" | "desc" | "consumption",
    value: string
  ) => {
    const updated = [...currentMaterials];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentMaterials(updated);

    if (activeColorTab) {
      if (pendingColorVariants[activeColorTab]) {
        setPendingColorVariants((prev) => ({
          ...prev,
          [activeColorTab]: {
            ...prev[activeColorTab],
            materials: updated,
          },
        }));
      } else if (colorVariantsData[activeColorTab]) {
        setPendingColorVariants((prev) => ({
          ...prev,
          [activeColorTab]: {
            ...colorVariantsData[activeColorTab],
            materials: updated,
          },
        }));
      }
    }
  };

  const deleteComponent = (index: number) => {
    const updated = currentComponents.filter((_, i) => i !== index);
    setCurrentComponents(updated);

    if (activeColorTab) {
      if (pendingColorVariants[activeColorTab]) {
        setPendingColorVariants((prev) => ({
          ...prev,
          [activeColorTab]: {
            ...prev[activeColorTab],
            components: updated,
          },
        }));
      } else if (colorVariantsData[activeColorTab]) {
        setPendingColorVariants((prev) => ({
          ...prev,
          [activeColorTab]: {
            ...colorVariantsData[activeColorTab],
            components: updated,
          },
        }));
      }
    }

    toast.success("Component removed");
  };

  const deleteMaterial = (index: number) => {
    const updated = currentMaterials.filter((_, i) => i !== index);
    setCurrentMaterials(updated);

    if (activeColorTab) {
      if (pendingColorVariants[activeColorTab]) {
        setPendingColorVariants((prev) => ({
          ...prev,
          [activeColorTab]: {
            ...prev[activeColorTab],
            materials: updated,
          },
        }));
      } else if (colorVariantsData[activeColorTab]) {
        setPendingColorVariants((prev) => ({
          ...prev,
          [activeColorTab]: {
            ...colorVariantsData[activeColorTab],
            materials: updated,
          },
        }));
      }
    }

    toast.success("Material removed");
  };

  const openAddComponentDialog = () => {
    setAddComponentDialogOpen(true);
  };

  const openAddMaterialDialog = () => {
    setAddMaterialDialogOpen(true);
  };

  const saveNewComponent = () => {
    if (!newComponentName.trim()) {
      toast.error("Please enter component name");
      return;
    }

    const newComponents = [
      ...currentComponents,
      {
        name: newComponentName,
        desc: newComponentDesc,
        consumption: newComponentConsumption,
      },
    ];

    setCurrentComponents(newComponents);

    if (activeColorTab) {
      if (pendingColorVariants[activeColorTab]) {
        setPendingColorVariants((prev) => ({
          ...prev,
          [activeColorTab]: {
            ...prev[activeColorTab],
            components: newComponents,
          },
        }));
      } else if (colorVariantsData[activeColorTab]) {
        setPendingColorVariants((prev) => ({
          ...prev,
          [activeColorTab]: {
            ...colorVariantsData[activeColorTab],
            components: newComponents,
          },
        }));
      }
    }

    setNewComponentName("");
    setNewComponentDesc("");
    setNewComponentConsumption("");
    setAddComponentDialogOpen(false);
    toast.success("Component added successfully");
  };

  const saveNewMaterial = () => {
    if (!newMaterialName.trim()) {
      toast.error("Please enter material name");
      return;
    }

    const newMaterials = [
      ...currentMaterials,
      {
        name: newMaterialName,
        desc: newMaterialDesc,
        consumption: newMaterialConsumption,
      },
    ];

    setCurrentMaterials(newMaterials);

    if (activeColorTab) {
      if (pendingColorVariants[activeColorTab]) {
        setPendingColorVariants((prev) => ({
          ...prev,
          [activeColorTab]: {
            ...prev[activeColorTab],
            materials: newMaterials,
          },
        }));
      } else if (colorVariantsData[activeColorTab]) {
        setPendingColorVariants((prev) => ({
          ...prev,
          [activeColorTab]: {
            ...colorVariantsData[activeColorTab],
            materials: newMaterials,
          },
        }));
      }
    }

    setNewMaterialName("");
    setNewMaterialDesc("");
    setNewMaterialConsumption("");
    setAddMaterialDialogOpen(false);
    toast.success("Material added successfully");
  };

  const handleSave = async () => {
    if (!project?._id) return;

    try {
      const updates = [];

      for (const [colorId, variantData] of Object.entries(
        pendingColorVariants
      )) {
        updates.push(
          api.put(
            `/projects/${project._id}/color-variants/${colorId}`,
            variantData
          )
        );
      }

      if (updates.length > 0) {
        await Promise.all(updates);
      } else {
        if (activeColorTab && pendingColorVariants[activeColorTab]) {
          await api.put(
            `/projects/${project._id}/color-variants/${activeColorTab}`,
            pendingColorVariants[activeColorTab]
          );
        }
      }

      setPendingColorVariants({});
      setNewColorVariants([]);

      toast.success("All color variants saved successfully!");

      if (onSave) {
        onSave(selectedColors);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving color variants:", error);
      toast.error("Failed to save color variants");
    }
  };

  const hasUnsavedChanges = Object.keys(pendingColorVariants).length > 0;

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
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-50 px-4 md:px-8 py-4 md:py-6 bg-linear-to-r from-green-50 via-white to-green-50 border-b border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <Palette className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-1 md:mb-2 truncate">
                  Brand Color Variants
                  {hasUnsavedChanges && (
                    <span className="ml-2 text-xs font-normal text-orange-600 bg-orange-100 px-2 py-1 rounded">
                      Unsaved Changes
                    </span>
                  )}
                </DialogTitle>
                <div className="flex items-center gap-2 md:gap-4 mt-2">
                  <span className="text-sm md:text-lg text-gray-600 truncate">
                    {project.autoCode}
                  </span>
                  {newColorVariants.length > 0 && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {newColorVariants.length} new variant(s) pending save
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Button
                onClick={handleSave}
                className="bg-green-500 hover:bg-green-600 text-xs md:text-sm"
                size={isMobile ? "sm" : "default"}
                disabled={!hasUnsavedChanges}
              >
                <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                {isMobile ? "Save" : "Save Color Variant"}
              </Button>
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
          <div className="px-4 md:px-8 py-4 space-y-4 md:space-y-5">
            {/* Color Variant Tabs Section */}
            <div className="space-y-3">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-gray-200">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {selectedColors.map((colorId) => (
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
                          backgroundColor: getColorHex(getColorName(colorId)),
                        }}
                      ></div>
                      <span className="text-xs md:text-sm">
                        {getColorName(colorId)}
                        {colorId === project.color && (
                          <span className="ml-1 text-xs text-gray-500 hidden md:inline">
                            (Default)
                          </span>
                        )}
                        {pendingColorVariants[colorId] && (
                          <span className="ml-1 text-xs text-orange-500">
                            *
                          </span>
                        )}
                      </span>
                      {selectedColors.length > 1 &&
                        colorId !== project.color && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveColor(colorId);
                            }}
                            className="ml-1 p-0.5 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                            role="button"
                            aria-label="Remove color variant"
                          >
                            <X className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-400 hover:text-red-500" />
                          </span>
                        )}
                    </button>
                  ))}
                </div>

                {/* Add Color Variant Button */}
                <button
                  onClick={() => setIsAddingColor(!isAddingColor)}
                  className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 ml-auto text-xs md:text-sm border rounded transition-colors shrink-0 ${
                    isAddingColor
                      ? "bg-purple-500 text-white border-purple-500"
                      : "border-gray-300 text-gray-700 hover:border-purple-400 hover:text-purple-600"
                  }`}
                >
                  <Plus className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden md:inline">Add Variant</span>
                  <span className="md:hidden">Add</span>
                </button>
              </div>

              {/* Add New Color Form */}
              {isAddingColor && (
                <div className="p-4 md:p-5 bg-linear-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                  <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">
                    Create New Color Variant
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <Label className="text-xs md:text-sm text-gray-700 mb-2">
                        Color Name
                      </Label>
                      <Input
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        placeholder="e.g., Navy Blue"
                        className="mt-1 h-8 md:h-10 text-xs md:text-sm"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button
                        onClick={handleAddNewColor}
                        className="bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 flex-1 text-xs md:text-sm"
                        size={isMobile ? "sm" : "default"}
                        disabled={!newColorName.trim()}
                      >
                        <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                        {isMobile ? "Create" : "Create Variant"}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsAddingColor(false);
                          setNewColorName("");
                          setNewColorHex("#000000");
                        }}
                        variant="outline"
                        size={isMobile ? "sm" : "default"}
                        className="text-xs md:text-sm"
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
              <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {/* Components Analysis */}
                  <div className="bg-white border-2 border-purple-200 rounded-xl p-4 md:p-6">
                    <div className="flex items-center gap-3 mb-3 md:mb-4">
                      <h4 className="text-base md:text-lg font-semibold text-purple-900">
                        Components Used
                      </h4>
                      <div className="flex items-center gap-2 px-2 py-1 bg-purple-50 rounded">
                        <div
                          className="w-3 h-3 md:w-4 md:h-4 rounded-full border border-purple-300"
                          style={{
                            backgroundColor: getColorHex(
                              getColorName(activeColorTab)
                            ),
                          }}
                        ></div>
                        <span className="text-xs font-medium text-purple-700 truncate">
                          {getColorName(activeColorTab)}
                        </span>
                        {pendingColorVariants[activeColorTab] && (
                          <span className="text-xs text-orange-500 ml-1">
                            *
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      {/* Fixed Table Header */}
                      <div className="grid grid-cols-12 gap-1 md:gap-2 text-[10px] md:text-xs font-medium text-gray-600 bg-purple-50 p-2 rounded">
                        <div className="col-span-4 md:col-span-3">
                          COMPONENT
                        </div>
                        <div className="col-span-4 md:col-span-4">
                          DESCRIPTION
                        </div>
                        <div className="col-span-3 md:col-span-4">
                          CONSUMPTION
                        </div>
                        <div className="col-span-1 text-center">ACTION</div>
                      </div>

                      {/* Scrollable Content */}
                      <div className="max-h-48 md:max-h-64 overflow-y-auto scrollbar-hide space-y-1 md:space-y-2">
                        {currentComponents.map((item, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-12 gap-1 md:gap-2 items-center text-xs md:text-sm py-1 md:py-2 border-b border-gray-200 group hover:bg-purple-50 transition-colors px-2 -mx-2 rounded"
                          >
                            <div className="col-span-4 md:col-span-3">
                              <Input
                                value={item.name}
                                onChange={(e) =>
                                  updateComponent(index, "name", e.target.value)
                                }
                                className="h-7 md:h-8 text-xs"
                                placeholder="Component"
                              />
                            </div>
                            <div className="col-span-4 md:col-span-4">
                              <Input
                                value={item.desc}
                                onChange={(e) =>
                                  updateComponent(index, "desc", e.target.value)
                                }
                                className="h-7 md:h-8 text-xs"
                                placeholder="Description"
                              />
                            </div>
                            <div className="col-span-3 md:col-span-4">
                              <Input
                                value={item.consumption}
                                onChange={(e) =>
                                  updateComponent(
                                    index,
                                    "consumption",
                                    e.target.value
                                  )
                                }
                                className="h-7 md:h-8 text-xs"
                                placeholder="Consumption"
                              />
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteComponent(index)}
                                className="h-6 w-6 md:h-8 md:w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                              >
                                <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add New Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-purple-600 border-purple-200 hover:bg-purple-50 text-xs"
                        onClick={openAddComponentDialog}
                      >
                        <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                        Add New Component
                      </Button>

                      {/* Total Count */}
                      <div className="bg-purple-50 p-2 md:p-3 rounded-lg mt-2 md:mt-3">
                        <div className="text-xs md:text-sm text-purple-800">
                          <strong>Total Components:</strong>{" "}
                          {currentComponents.length} different components used
                          in production
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Materials Analysis */}
                  <div className="bg-white border-2 border-teal-200 rounded-xl p-4 md:p-6">
                    <div className="flex items-center gap-3 mb-3 md:mb-4">
                      <h4 className="text-base md:text-lg font-semibold text-teal-900">
                        Materials Used
                      </h4>
                      <div className="flex items-center gap-2 px-2 py-1 bg-teal-50 rounded">
                        <div
                          className="w-3 h-3 md:w-4 md:h-4 rounded-full border border-teal-300"
                          style={{
                            backgroundColor: getColorHex(
                              getColorName(activeColorTab)
                            ),
                          }}
                        ></div>
                        <span className="text-xs font-medium text-teal-700 truncate">
                          {getColorName(activeColorTab)}
                        </span>
                        {pendingColorVariants[activeColorTab] && (
                          <span className="text-xs text-orange-500 ml-1">
                            *
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      {/* Fixed Table Header */}
                      <div className="grid grid-cols-12 gap-1 md:gap-2 text-[10px] md:text-xs font-medium text-gray-600 bg-teal-50 p-2 rounded">
                        <div className="col-span-4 md:col-span-3">MATERIAL</div>
                        <div className="col-span-4 md:col-span-4">
                          DESCRIPTION
                        </div>
                        <div className="col-span-3 md:col-span-4">
                          CONSUMPTION
                        </div>
                        <div className="col-span-1 text-center">ACTION</div>
                      </div>

                      {/* Scrollable Content */}
                      <div className="max-h-48 md:max-h-64 overflow-y-auto scrollbar-hide space-y-1 md:space-y-2">
                        {currentMaterials.map((item, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-12 gap-1 md:gap-2 items-center text-xs md:text-sm py-1 md:py-2 border-b border-gray-200 group hover:bg-teal-50 transition-colors px-2 -mx-2 rounded"
                          >
                            <div className="col-span-4 md:col-span-3">
                              <Input
                                value={item.name}
                                onChange={(e) =>
                                  updateMaterial(index, "name", e.target.value)
                                }
                                className="h-7 md:h-8 text-xs"
                                placeholder="Material"
                              />
                            </div>
                            <div className="col-span-4 md:col-span-4">
                              <Input
                                value={item.desc}
                                onChange={(e) =>
                                  updateMaterial(index, "desc", e.target.value)
                                }
                                className="h-7 md:h-8 text-xs"
                                placeholder="Description"
                              />
                            </div>
                            <div className="col-span-3 md:col-span-4">
                              <Input
                                value={item.consumption}
                                onChange={(e) =>
                                  updateMaterial(
                                    index,
                                    "consumption",
                                    e.target.value
                                  )
                                }
                                className="h-7 md:h-8 text-xs"
                                placeholder="Consumption"
                              />
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMaterial(index)}
                                className="h-6 w-6 md:h-8 md:w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                              >
                                <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add New Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-teal-600 border-teal-200 hover:bg-teal-50 text-xs"
                        onClick={openAddMaterialDialog}
                      >
                        <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                        Add New Material
                      </Button>

                      {/* Total Count */}
                      <div className="bg-teal-50 p-2 md:p-3 rounded-lg mt-2 md:mt-3">
                        <div className="text-xs md:text-sm text-teal-800">
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

      {/* Add New Component Dialog - Responsive */}
      <Dialog
        open={addComponentDialogOpen}
        onOpenChange={setAddComponentDialogOpen}
      >
        <DialogContent
          className={isMobile ? "max-w-[95vw] w-[95vw]" : "max-w-2xl"}
        >
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl flex items-center gap-2">
              <Plus className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              Add New Component
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 md:space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="componentName" className="text-xs md:text-sm">
                Component Name *
              </Label>
              <Input
                id="componentName"
                value={newComponentName}
                onChange={(e) => setNewComponentName(e.target.value)}
                placeholder="e.g., Foam, Velcro, Thread"
                className="w-full h-8 md:h-10 text-xs md:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="componentDesc" className="text-xs md:text-sm">
                Description
              </Label>
              <Input
                id="componentDesc"
                value={newComponentDesc}
                onChange={(e) => setNewComponentDesc(e.target.value)}
                placeholder="e.g., 75mm, MRP, sticker"
                className="w-full h-8 md:h-10 text-xs md:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="componentConsumption"
                className="text-xs md:text-sm"
              >
                Consumption
              </Label>
              <Input
                id="componentConsumption"
                value={newComponentConsumption}
                onChange={(e) => setNewComponentConsumption(e.target.value)}
                placeholder="e.g., 7.5grm, 1.25 pair, 2pcs"
                className="w-full h-8 md:h-10 text-xs md:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 md:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAddComponentDialogOpen(false);
                setNewComponentName("");
                setNewComponentDesc("");
                setNewComponentConsumption("");
              }}
              size={isMobile ? "sm" : "default"}
              className="text-xs md:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={saveNewComponent}
              className="bg-purple-600 hover:bg-purple-700 text-xs md:text-sm"
              size={isMobile ? "sm" : "default"}
            >
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Add Component
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Material Dialog - Responsive */}
      <Dialog
        open={addMaterialDialogOpen}
        onOpenChange={setAddMaterialDialogOpen}
      >
        <DialogContent
          className={isMobile ? "max-w-[95vw] w-[95vw]" : "max-w-2xl"}
        >
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl flex items-center gap-2">
              <Plus className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
              Add New Material
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 md:space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="materialName" className="text-xs md:text-sm">
                Material Name *
              </Label>
              <Input
                id="materialName"
                value={newMaterialName}
                onChange={(e) => setNewMaterialName(e.target.value)}
                placeholder="e.g., Upper, Lining, Footbed"
                className="w-full h-8 md:h-10 text-xs md:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="materialDesc" className="text-xs md:text-sm">
                Description
              </Label>
              <Input
                id="materialDesc"
                value={newMaterialDesc}
                onChange={(e) => setNewMaterialDesc(e.target.value)}
                placeholder="e.g., Rexine, Skinfit, EVA"
                className="w-full h-8 md:h-10 text-xs md:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="materialConsumption"
                className="text-xs md:text-sm"
              >
                Consumption
              </Label>
              <Input
                id="materialConsumption"
                value={newMaterialConsumption}
                onChange={(e) => setNewMaterialConsumption(e.target.value)}
                placeholder="e.g., 26 pairs/mtr, 25 pair @ 155/-"
                className="w-full h-8 md:h-10 text-xs md:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 md:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAddMaterialDialogOpen(false);
                setNewMaterialName("");
                setNewMaterialDesc("");
                setNewMaterialConsumption("");
              }}
              size={isMobile ? "sm" : "default"}
              className="text-xs md:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={saveNewMaterial}
              className="bg-teal-600 hover:bg-teal-700 text-xs md:text-sm"
              size={isMobile ? "sm" : "default"}
            >
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Add Material
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
