import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Plus, 
  Calculator, 
  Palette,
  Edit2,
  Trash2,
  CheckCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { useERPStore } from '../lib/data-store';
import type { RDProject } from '../lib/data-store';

interface ColorMaterialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: RDProject | null;
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
  const { updateRDProject } = useERPStore();
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [activeColorTab, setActiveColorTab] = useState<string>('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [isAddingColor, setIsAddingColor] = useState(false);
  const [customColors, setCustomColors] = useState<{ [key: string]: { name: string; hex: string } }>({});
  const [colorVariantsData, setColorVariantsData] = useState<{
    [colorId: string]: {
      materials: Array<{ name: string; desc: string; consumption: string }>;
      components: Array<{ name: string; desc: string; consumption: string }>;
    };
  }>({});
  
  // Current editing state for active color tab
  const [currentComponents, setCurrentComponents] = useState<Array<{ name: string; desc: string; consumption: string }>>([]);
  const [currentMaterials, setCurrentMaterials] = useState<Array<{ name: string; desc: string; consumption: string }>>([]);

  // Dialog states for adding new items
  const [addComponentDialogOpen, setAddComponentDialogOpen] = useState(false);
  const [addMaterialDialogOpen, setAddMaterialDialogOpen] = useState(false);
  
  // Form fields for new component
  const [newComponentName, setNewComponentName] = useState('');
  const [newComponentDesc, setNewComponentDesc] = useState('');
  const [newComponentConsumption, setNewComponentConsumption] = useState('');
  
  // Form fields for new material
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialDesc, setNewMaterialDesc] = useState('');
  const [newMaterialConsumption, setNewMaterialConsumption] = useState('');

  // Default data for new color variants
  const getDefaultComponents = () => [
    { name: 'Foam', desc: '-', consumption: '7.5grm' },
    { name: 'Velcro', desc: '75mm', consumption: '1.25 pair' },
    { name: 'Elastic Roop', desc: '-', consumption: '-' },
    { name: 'Thread', desc: '-', consumption: '-' },
    { name: 'Tafta Label', desc: 'MRP', consumption: '-' },
    { name: 'Buckle', desc: '-', consumption: '2pcs' },
    { name: 'Heat Transfer', desc: '-', consumption: '-' },
    { name: 'Trim', desc: 'sticker', consumption: '10 pcs' },
    { name: 'Welding', desc: '-', consumption: '-' },
  ];

  const getDefaultMaterials = () => [
    { name: 'Upper', desc: 'Rexine', consumption: '26 pairs/mtr' },
    { name: 'Lining', desc: 'Skinfit', consumption: '25 pair @ 155/-' },
    { name: 'Lining', desc: 'EVA', consumption: '33/70 - 1.5mm 35pair' },
    { name: 'Footbed', desc: '-', consumption: '-' },
    { name: 'Mid Sole 1', desc: '-', consumption: '-' },
    { name: 'Mid Sole 2', desc: '-', consumption: '-' },
    { name: 'Out Sole', desc: '-', consumption: '-' },
    { name: 'PU Adhesive', desc: '-', consumption: '-' },
    { name: 'Print', desc: '-', consumption: '-' },
  ];

  useEffect(() => {
    if (project && colors) {
      // Initialize with project's color as default
      if (project.colorId) {
        setSelectedColors([project.colorId]);
        setActiveColorTab(project.colorId);
      }
      
      // Load saved color variants data if exists
      if (project.colorVariants) {
        const loadedData: typeof colorVariantsData = {};
        Object.keys(project.colorVariants).forEach((colorId) => {
          const variant = project.colorVariants![colorId];
          loadedData[colorId] = {
            materials: variant.materials,
            components: variant.components,
          };
        });
        setColorVariantsData(loadedData);
        
        // Load selected colors from saved variants
        setSelectedColors(Object.keys(project.colorVariants));
      }
    }
  }, [project, colors]);

  // Load current components/materials when active tab changes
  useEffect(() => {
    if (activeColorTab) {
      const variantData = colorVariantsData[activeColorTab];
      if (variantData) {
        setCurrentComponents(variantData.components);
        setCurrentMaterials(variantData.materials);
      } else {
        // Use defaults for new color variants
        setCurrentComponents(getDefaultComponents());
        setCurrentMaterials(getDefaultMaterials());
      }
    }
  }, [activeColorTab, colorVariantsData]);

  if (!project) return null;

  const getColorName = (colorId: string) => {
    // Check custom colors first
    if (customColors[colorId]) {
      return customColors[colorId].name;
    }
    // Then check master data colors
    const color = colors?.find(c => c.id === colorId);
    return color?.colorName || 'Unknown Color';
  };

  const getColorHex = (colorId: string) => {
    // Check custom colors first
    if (customColors[colorId]) {
      return customColors[colorId].hex;
    }
    // Then check master data colors
    const color = colors?.find(c => c.id === colorId);
    return color?.hexCode || '#cccccc';
  };

  const handleRemoveColor = (colorId: string) => {
    const newColors = selectedColors.filter(id => id !== colorId);
    setSelectedColors(newColors);
    // Switch to first color if we're removing the active tab
    if (activeColorTab === colorId && newColors.length > 0) {
      setActiveColorTab(newColors[0]);
    }
    toast.success('Color variant removed');
  };

  const handleAddNewColor = () => {
    if (newColorName.trim()) {
      // In a real implementation, this would add to the color master data
      // For demo, we'll create a temp ID and store the color info
      const newColorId = `temp-${Date.now()}`;
      const newColors = [...selectedColors, newColorId];
      
      // Store the custom color info
      setCustomColors({
        ...customColors,
        [newColorId]: {
          name: newColorName,
          hex: newColorHex
        }
      });
      
      setSelectedColors(newColors);
      setActiveColorTab(newColorId);
      toast.success(`New color variant "${newColorName}" created`);
      setNewColorName('');
      setNewColorHex('#000000');
      setIsAddingColor(false);
    }
  };

  const getColorNameFromHex = (hex: string): string => {
    // Convert hex to RGB
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // Standard color name detection
    const colors: { [key: string]: [number, number, number] } = {
      'Black': [0, 0, 0],
      'White': [255, 255, 255],
      'Red': [255, 0, 0],
      'Green': [0, 128, 0],
      'Blue': [0, 0, 255],
      'Yellow': [255, 255, 0],
      'Cyan': [0, 255, 255],
      'Magenta': [255, 0, 255],
      'Silver': [192, 192, 192],
      'Gray': [128, 128, 128],
      'Maroon': [128, 0, 0],
      'Olive': [128, 128, 0],
      'Lime': [0, 255, 0],
      'Aqua': [0, 255, 255],
      'Teal': [0, 128, 128],
      'Navy': [0, 0, 128],
      'Purple': [128, 0, 128],
      'Orange': [255, 165, 0],
      'Pink': [255, 192, 203],
      'Brown': [165, 42, 42],
      'Beige': [245, 245, 220],
      'Tan': [210, 180, 140],
      'Peach': [255, 218, 185],
      'Lavender': [230, 230, 250],
      'Coral': [255, 127, 80],
      'Gold': [255, 215, 0],
      'Turquoise': [64, 224, 208],
      'Indigo': [75, 0, 130],
      'Violet': [238, 130, 238],
      'Crimson': [220, 20, 60],
    };

    // Find closest color
    let minDistance = Infinity;
    let closestColor = 'Custom Color';

    for (const [colorName, [cr, cg, cb]] of Object.entries(colors)) {
      const distance = Math.sqrt(
        Math.pow(r - cr, 2) + Math.pow(g - cg, 2) + Math.pow(b - cb, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = colorName;
      }
    }

    // If very close to a standard color (within threshold), return it
    return minDistance < 50 ? closestColor : 'Custom Color';
  };

  const handleColorHexChange = (hex: string) => {
    // Auto-format hex code
    let formattedHex = hex;
    if (!hex.startsWith('#')) {
      formattedHex = '#' + hex;
    }
    setNewColorHex(formattedHex);
    
    // Auto-fetch color name if valid hex
    if (/^#[0-9A-F]{6}$/i.test(formattedHex)) {
      const detectedName = getColorNameFromHex(formattedHex);
      if (detectedName !== 'Custom Color') {
        setNewColorName(detectedName);
      }
    }
  };

  const handleColorPickerChange = (hex: string) => {
    setNewColorHex(hex);
    // Auto-fetch color name
    const detectedName = getColorNameFromHex(hex);
    if (detectedName !== 'Custom Color') {
      setNewColorName(detectedName);
    }
  };

  // Update component field
  const updateComponent = (index: number, field: 'name' | 'desc' | 'consumption', value: string) => {
    const updated = [...currentComponents];
    updated[index][field] = value;
    setCurrentComponents(updated);
  };

  // Update material field
  const updateMaterial = (index: number, field: 'name' | 'desc' | 'consumption', value: string) => {
    const updated = [...currentMaterials];
    updated[index][field] = value;
    setCurrentMaterials(updated);
  };

  // Delete component
  const deleteComponent = (index: number) => {
    const updated = currentComponents.filter((_, i) => i !== index);
    setCurrentComponents(updated);
    toast.success('Component removed');
  };

  // Delete material
  const deleteMaterial = (index: number) => {
    const updated = currentMaterials.filter((_, i) => i !== index);
    setCurrentMaterials(updated);
    toast.success('Material removed');
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
      toast.error('Please enter component name');
      return;
    }
    
    setCurrentComponents([
      ...currentComponents, 
      { 
        name: newComponentName, 
        desc: newComponentDesc, 
        consumption: newComponentConsumption 
      }
    ]);
    
    // Reset form and close dialog
    setNewComponentName('');
    setNewComponentDesc('');
    setNewComponentConsumption('');
    setAddComponentDialogOpen(false);
    toast.success('Component added successfully');
  };

  // Save new material
  const saveNewMaterial = () => {
    if (!newMaterialName.trim()) {
      toast.error('Please enter material name');
      return;
    }
    
    setCurrentMaterials([
      ...currentMaterials, 
      { 
        name: newMaterialName, 
        desc: newMaterialDesc, 
        consumption: newMaterialConsumption 
      }
    ]);
    
    // Reset form and close dialog
    setNewMaterialName('');
    setNewMaterialDesc('');
    setNewMaterialConsumption('');
    setAddMaterialDialogOpen(false);
    toast.success('Material added successfully');
  };

  const handleSave = () => {
    if (!project) return;

    // First, save the current tab's data before building the final object
    if (activeColorTab) {
      colorVariantsData[activeColorTab] = {
        components: currentComponents,
        materials: currentMaterials,
      };
    }

    // Build color variants object with materials and components
    const colorVariants: {
      [colorId: string]: {
        colorName: string;
        colorHex: string;
        materials: Array<{ name: string; desc: string; consumption: string }>;
        components: Array<{ name: string; desc: string; consumption: string }>;
      };
    } = {};

    selectedColors.forEach((colorId) => {
      const colorName = getColorName(colorId);
      const colorHex = getColorHex(colorId);
      
      // Get data for this color - if it's the active tab, use current edited data
      const variantData = colorId === activeColorTab 
        ? { components: currentComponents, materials: currentMaterials }
        : (colorVariantsData[colorId] || {
            materials: getDefaultMaterials(),
            components: getDefaultComponents(),
          });

      colorVariants[colorId] = {
        colorName,
        colorHex,
        ...variantData,
      };
    });

    // Update project with color variants
    updateRDProject(project.id, {
      colorVariants,
    });

    toast.success('Color variants saved successfully!');
    
    // Call onSave callback with the saved color IDs
    if (onSave) {
      onSave(selectedColors);
    }
    
    onOpenChange(false);
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
                        ? 'border-green-600 text-gray-900'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: getColorHex(colorId) }}
                    ></div>
                    <span>
                      {getColorName(colorId)}
                      {colorId === project.colorId && (
                        <span className="ml-1.5 text-xs text-gray-500">(Default)</span>
                      )}
                    </span>
                    {selectedColors.length > 1 && colorId !== project.colorId && (
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
                      ? 'bg-purple-500 text-white border-purple-500'
                      : 'border-gray-300 text-gray-700 hover:border-purple-400 hover:text-purple-600'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Variant</span>
                </button>
              </div>

              {/* Add New Color Form */}
              {isAddingColor && (
                <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Create New Color Variant</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-700 mb-2">Color Name</Label>
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
                          setNewColorName('');
                          setNewColorHex('#000000');
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
                      <h4 className="text-lg font-semibold text-purple-900">Components Used</h4>
                      <div className="flex items-center gap-2 px-2 py-1 bg-purple-50 rounded">
                        <div
                          className="w-4 h-4 rounded-full border border-purple-300"
                          style={{ backgroundColor: getColorHex(activeColorTab) }}
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
                          <div key={index} className="grid grid-cols-12 gap-2 items-center text-sm py-2 border-b border-gray-200 group hover:bg-purple-50 transition-colors px-2 -mx-2 rounded">
                            <div className="col-span-3">
                              <Input
                                value={item.name}
                                onChange={(e) => updateComponent(index, 'name', e.target.value)}
                                className="h-8 text-sm"
                                placeholder="Component"
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                value={item.desc}
                                onChange={(e) => updateComponent(index, 'desc', e.target.value)}
                                className="h-8 text-sm"
                                placeholder="Description"
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                value={item.consumption}
                                onChange={(e) => updateComponent(index, 'consumption', e.target.value)}
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
                          <strong>Total Components:</strong> {currentComponents.length} different components used in production
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Materials Analysis */}
                  <div className="bg-white border-2 border-teal-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <h4 className="text-lg font-semibold text-teal-900">Materials Used</h4>
                      <div className="flex items-center gap-2 px-2 py-1 bg-teal-50 rounded">
                        <div
                          className="w-4 h-4 rounded-full border border-teal-300"
                          style={{ backgroundColor: getColorHex(activeColorTab) }}
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
                          <div key={index} className="grid grid-cols-12 gap-2 items-center text-sm py-2 border-b border-gray-200 group hover:bg-teal-50 transition-colors px-2 -mx-2 rounded">
                            <div className="col-span-3">
                              <Input
                                value={item.name}
                                onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                                className="h-8 text-sm"
                                placeholder="Material"
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                value={item.desc}
                                onChange={(e) => updateMaterial(index, 'desc', e.target.value)}
                                className="h-8 text-sm"
                                placeholder="Description"
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                value={item.consumption}
                                onChange={(e) => updateMaterial(index, 'consumption', e.target.value)}
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
                          <strong>Total Materials:</strong> {currentMaterials.length} different materials used in production
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
      <Dialog open={addComponentDialogOpen} onOpenChange={setAddComponentDialogOpen}>
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
                setNewComponentName('');
                setNewComponentDesc('');
                setNewComponentConsumption('');
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
      <Dialog open={addMaterialDialogOpen} onOpenChange={setAddMaterialDialogOpen}>
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
                setNewMaterialName('');
                setNewMaterialDesc('');
                setNewMaterialConsumption('');
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
