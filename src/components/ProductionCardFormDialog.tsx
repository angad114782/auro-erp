import React, { useState } from "react";
import {
  X,
  Save,
  Calendar,
  User,
  Target,
  Package,
  FileText,
  AlertCircle,
  Plus,
  CheckCircle,
  Factory,
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
import { toast } from "sonner@2.0.3";
import { useERPStore, RDProject } from "../lib/data-store";

interface ProductionCardData {
  id: string;
  cardName: string;
  productionType: string;
  priority: string;
  targetQuantity: string;
  cardQuantity: string;
  startDate: string;
  endDate: string;
  supervisor: string;
  workShift: string;
  description: string;
  specialInstructions: string;
  status: string;
  createdAt: string;
}

interface ProductionCardFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (cardData: ProductionCardData) => void;
  selectedProject?: RDProject | null;
  editingCard?: ProductionCardData | null;
}

export function ProductionCardFormDialog({
  open,
  onClose,
  onSave,
  selectedProject,
  editingCard,
}: ProductionCardFormDialogProps) {
  const { brands, categories, types, colors, countries, addMaterialRequest, updateMaterialRequest, getMaterialRequestByCardId, addProductionCard } = useERPStore();
  
  const [formData, setFormData] = useState({
    cardName: "",
    productionType: "",
    priority: "",
    targetQuantity: "",
    startDate: "",
    endDate: "",
    supervisor: "",
    workShift: "",
    description: "",
    specialInstructions: "",
    cardQuantity: "",
    assignPlant: ""
  });

  const [materialRequestId, setMaterialRequestId] = useState<string>("");
  const [requestStatus, setRequestStatus] = useState<'Pending Availability Check' | 'Pending to Store' | 'Issued' | 'Partially Issued'>('Pending Availability Check');
  const [materialData, setMaterialData] = useState<{[key: string]: {available: number, issued: number}}>({});

  // Plants list and dialog state
  const [plantsList, setPlantsList] = useState<string[]>([
    'Aura',
    'Prime',
    'Smith',
    'Plant A - Main Factory',
    'Plant B - North Unit',
  ]);
  const [addPlantDialogOpen, setAddPlantDialogOpen] = useState(false);
  const [newPlantName, setNewPlantName] = useState('');

  // Check for existing material request when dialog opens
  React.useEffect(() => {
    if (open && materialRequestId) {
      const existingRequest = getMaterialRequestByCardId(materialRequestId);
      if (existingRequest) {
        setRequestStatus(existingRequest.status as any);
        // Load material data from existing request
        const materialDataMap: {[key: string]: {available: number, issued: number}} = {};
        existingRequest.materials.forEach(item => {
          materialDataMap[item.name] = { available: item.available, issued: item.issued };
        });
        existingRequest.components.forEach(item => {
          materialDataMap[item.name] = { available: item.available, issued: item.issued };
        });
        setMaterialData(materialDataMap);
      }
    }
  }, [open, materialRequestId]);

  // Prefill form when editing an existing card
  React.useEffect(() => {
    if (open && editingCard) {
      setFormData({
        cardName: editingCard.cardName,
        productionType: editingCard.productionType,
        priority: editingCard.priority,
        targetQuantity: editingCard.targetQuantity,
        startDate: editingCard.startDate,
        endDate: editingCard.endDate,
        supervisor: editingCard.supervisor,
        workShift: editingCard.workShift,
        description: editingCard.description,
        specialInstructions: editingCard.specialInstructions,
        cardQuantity: editingCard.cardQuantity,
        assignPlant: editingCard.assignedPlant || ""
      });
    } else if (open && !editingCard) {
      // Reset form for new card
      setFormData({
        cardName: "",
        productionType: "",
        priority: "",
        targetQuantity: "",
        startDate: "",
        endDate: "",
        supervisor: "",
        workShift: "",
        description: "",
        specialInstructions: "",
        cardQuantity: "",
        assignPlant: ""
      });
    }
  }, [open, editingCard]);

  const handleMaterialDataChange = (itemName: string, field: 'available' | 'issued', value: number) => {
    setMaterialData(prev => ({
      ...prev,
      [itemName]: {
        ...prev[itemName],
        [field]: value
      }
    }));
  };

  // Handler to save new plant
  const saveNewPlant = () => {
    if (!newPlantName.trim()) {
      toast.error('Please enter plant name');
      return;
    }

    if (plantsList.includes(newPlantName)) {
      toast.error('Plant already exists');
      return;
    }

    setPlantsList([...plantsList, newPlantName]);
    setFormData({ ...formData, assignPlant: newPlantName });
    setNewPlantName('');
    setAddPlantDialogOpen(false);
    toast.success('Plant added successfully');
  };

  // Helper functions to get names from IDs
  const getBrandName = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    return brand ? brand.brandName : "Unknown Brand";
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.categoryName : "Unknown Category";
  };

  const getTypeName = (typeId: string) => {
    const type = types.find(t => t.id === typeId);
    return type ? type.typeName : "Unknown Type";
  };

  const getColorName = (colorId: string) => {
    const color = colors.find(c => c.id === colorId);
    return color ? color.colorName : "Unknown Color";
  };

  const getCountryName = (countryId: string) => {
    const country = countries.find(c => c.id === countryId);
    return country ? country.countryName : "Unknown Country";
  };

  // Generate product name from project data
  const getProductName = () => {
    if (!selectedProject) return "No Product Selected";
    
    const brand = getBrandName(selectedProject.brandId);
    const category = getCategoryName(selectedProject.categoryId);
    const type = getTypeName(selectedProject.typeId);
    const color = getColorName(selectedProject.colorId);
    
    return `${brand} ${category} - ${type} ${color}`;
  };

  // Generate production card number
  const generateProductionCardNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomNum = String(Math.floor(Math.random() * 9000) + 1000);
    return `PC-${year}-${month}-${randomNum}`;
  };

  const productionTypes = [
    "Pre-Production Setup",
    "Material Preparation",
    "Cutting & Sizing",
    "Assembly & Stitching",
    "Quality Control",
    "Finishing & Packaging",
    "Final Inspection",
  ];

  const priorities = ["High", "Medium", "Low"];

  const supervisors = [
    "John Smith",
    "Sarah Wilson", 
    "Mike Chen",
    "Emma Davis",
    "David Kumar",
    "Lisa Anderson",
  ];

  const workShifts = [
    "Day Shift (6 AM - 2 PM)",
    "Evening Shift (2 PM - 10 PM)",
    "Night Shift (10 PM - 6 AM)",
    "Double Shift (6 AM - 10 PM)",
  ];

  const generateCardId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PC-${timestamp}-${random}`;
  };

  const handleSave = () => {
    if (!formData.cardQuantity || !formData.startDate || !formData.assignPlant) {
      toast.error("Please fill in all required fields (Allocation, Start Date, and Plant)");
      return;
    }

    if (!selectedProject) {
      toast.error("No project selected for production card");
      return;
    }

    const cardId = generateCardId();
    const cardNumber = generateProductionCardNumber();
    
    // Create production card data
    const productionCardData = {
      cardNumber,
      projectId: selectedProject.id,
      productName: getProductName(),
      cardQuantity: parseInt(formData.cardQuantity),
      startDate: formData.startDate,
      assignedPlant: formData.assignPlant,
      description: formData.description,
      specialInstructions: formData.specialInstructions,
      status: 'Draft' as const,
      materialRequestStatus: requestStatus,
      createdBy: "Production Manager", // This would be current user
      materials: selectedProject.materials || [],
      components: selectedProject.components || []
    };

    // Save to production cards store
    addProductionCard(productionCardData);

    // Also call the original onSave for compatibility
    const cardData: ProductionCardData = {
      id: cardId,
      cardName: cardNumber,
      productionType: "Production Card",
      priority: "Medium",
      targetQuantity: formData.cardQuantity,
      cardQuantity: formData.cardQuantity,
      startDate: formData.startDate,
      endDate: "",
      supervisor: "",
      workShift: "",
      description: formData.description,
      specialInstructions: formData.specialInstructions,
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    onSave(cardData);
    toast.success(editingCard ? "Production card updated successfully!" : "Production card created successfully!");

    // Reset form
    setFormData({
      cardName: "",
      productionType: "",
      priority: "",
      targetQuantity: "",
      startDate: "",
      endDate: "",
      supervisor: "",
      workShift: "",
      description: "",
      specialInstructions: "",
      cardQuantity: "",
      assignPlant: ""
    });

    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="!max-w-6xl !w-[90vw] max-h-[95vh] overflow-hidden p-0 m-0 top-[2.5vh] translate-y-0 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-50 px-10 py-8 bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b-2 border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-semibold text-gray-900">
                  {editingCard ? "Edit Production Card" : "Create Production Card"}
                </DialogTitle>
                <DialogDescription className="text-lg text-gray-600 mt-2">
                  {editingCard ? "Update production workflow and requirements" : "Define production workflow and requirements"}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {/* Quantity Allocation Input */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 min-w-[200px]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-500" />
                    <Label htmlFor="cardQuantity" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      Allocation
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      id="cardQuantity"
                      type="number"
                      value={formData.cardQuantity || ""}
                      onChange={(e) => handleInputChange("cardQuantity", e.target.value)}
                      placeholder=""
                      className="w-20 h-9 text-center border-2 border-gray-300 rounded-md bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-semibold text-gray-900 text-base hover:border-gray-400 transition-all duration-200"
                      min="1"
                      max="1200"
                    />
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">/ 1,200</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Units for this production card
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-12 w-12 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-gray-500" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-10 py-8 space-y-10">
            {/* Product Information */}
            <div className="space-y-8">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-4">
                <FileText className="w-6 h-6 text-blue-500" />
                Product Information
              </h3>
              
              {/* Product Information Display */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {/* Auto-Generated Card Number */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Card Number</Label>
                    <p className="font-semibold text-blue-600">
                      {editingCard ? editingCard.cardName : generateProductionCardNumber()}
                    </p>
                  </div>
                  
                  {/* Product Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Product Name</Label>
                    <p className="font-semibold text-gray-900">{getProductName()}</p>
                  </div>

                  {/* Article Section */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Article Section</Label>
                    <p className="font-semibold text-gray-900">Art and Color</p>
                  </div>

                  {/* Article Size Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Size Range</Label>
                    <p className="font-semibold text-gray-900">6-12</p>
                  </div>
                  
                  {/* Creation Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Date</Label>
                    <p className="font-semibold text-gray-900">{new Date().toLocaleDateString('en-IN')}</p>
                  </div>
                </div>   
              </div>
            </div>

            {/* Tentative Cost Breakdown */}
            <div className="space-y-8">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-4">
                <Target className="w-6 h-6 text-blue-500" />
                Material Requirements & Allocation
              </h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
                
                {/* Materials Requirements Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100 border-b-2 border-gray-200">
                          <th className="px-6 py-4 text-left font-semibold text-gray-900 border-r border-gray-300 min-w-[120px]">ITEM</th>
                          <th className="px-6 py-4 text-left font-semibold text-gray-900 border-r border-gray-300 min-w-[200px]">SPECIFICATION</th>
                          <th className="px-6 py-4 text-center font-semibold text-gray-900 border-r border-gray-300 min-w-[120px]">REQUIREMENT</th>
                          <th className="px-6 py-4 text-center font-semibold text-gray-900 border-r border-gray-300 min-w-[120px]">AVAILABLE</th>
                          <th className="px-6 py-4 text-center font-semibold text-gray-900 border-r border-gray-300 min-w-[100px]">ISSUED</th>
                          <th className="px-6 py-4 text-center font-semibold text-gray-900 min-w-[100px]">BALANCE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Materials Section */}
                        <tr className="border-b border-gray-200 bg-cyan-100">
                          <td className="px-6 py-3 font-semibold text-cyan-800 border-r border-gray-300" colSpan={6}>
                            MATERIALS USED
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-300">Upper</td>
                          <td className="px-6 py-4 text-gray-600 border-r border-gray-300">Rexine</td>
                          <td className="px-6 py-4 text-center text-gray-900 border-r border-gray-300">
                            {formData.cardQuantity ? `${parseInt(formData.cardQuantity) * 25} pair/vth` : "25 pair/vth"}
                          </td>
                          <td className="px-6 py-4 text-center border-r border-gray-300">
                            {requestStatus === 'Pending Availability Check' ? (
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="w-20 h-8 text-center border-gray-300"
                                min="0"
                                step="1"
                                value={materialData['Upper']?.available || ''}
                                onChange={(e) => handleMaterialDataChange('Upper', 'available', parseFloat(e.target.value) || 0)}
                              />
                            ) : (
                              <span className="text-center">{materialData['Upper']?.available || 0}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-400 border-r border-gray-300">
                            {requestStatus === 'Issued' || requestStatus === 'Partially Issued' 
                              ? materialData['Upper']?.issued || 0 
                              : '-'
                            }
                          </td>
                          <td className="px-6 py-4 text-center text-gray-400">
                            {requestStatus === 'Issued' || requestStatus === 'Partially Issued' 
                              ? Math.max(0, (formData.cardQuantity ? parseInt(formData.cardQuantity) * 25 : 25) - (materialData['Upper']?.available || 0) - (materialData['Upper']?.issued || 0))
                              : '-'
                            }
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-300">Lining</td>
                          <td className="px-6 py-4 text-gray-600 border-r border-gray-300">Skimh</td>
                          <td className="px-6 py-4 text-center text-gray-900 border-r border-gray-300">
                            {formData.cardQuantity ? `${parseInt(formData.cardQuantity) * 25} pair @ 15/-` : "25 pair @ 15/-"}
                          </td>
                          <td className="px-6 py-4 text-center border-r border-gray-300">
                            {requestStatus === 'Pending Availability Check' ? (
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="w-20 h-8 text-center border-gray-300"
                                min="0"
                                step="1"
                                value={materialData['Lining_Skimh']?.available || ''}
                                onChange={(e) => handleMaterialDataChange('Lining_Skimh', 'available', parseFloat(e.target.value) || 0)}
                              />
                            ) : (
                              <span className="text-center">{materialData['Lining_Skimh']?.available || 0}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-400 border-r border-gray-300">
                            {requestStatus === 'Issued' || requestStatus === 'Partially Issued' 
                              ? materialData['Lining_Skimh']?.issued || 0 
                              : '-'
                            }
                          </td>
                          <td className="px-6 py-4 text-center text-gray-400">
                            {requestStatus === 'Issued' || requestStatus === 'Partially Issued' 
                              ? Math.max(0, (formData.cardQuantity ? parseInt(formData.cardQuantity) * 25 : 25) - (materialData['Lining_Skimh']?.available || 0) - (materialData['Lining_Skimh']?.issued || 0))
                              : '-'
                            }
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-300">Lining</td>
                          <td className="px-6 py-4 text-gray-600 border-r border-gray-300">EVA</td>
                          <td className="px-6 py-4 text-center text-gray-900 border-r border-gray-300">3370 - 1.5mm 35pair</td>
                          <td className="px-6 py-4 text-center border-r border-gray-300">
                            {requestStatus === 'Pending Availability Check' ? (
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="w-20 h-8 text-center border-gray-300"
                                min="0"
                                step="1"
                                value={materialData['Lining_EVA']?.available || ''}
                                onChange={(e) => handleMaterialDataChange('Lining_EVA', 'available', parseFloat(e.target.value) || 0)}
                              />
                            ) : (
                              <span className="text-center">{materialData['Lining_EVA']?.available || 0}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-400 border-r border-gray-300">
                            {requestStatus === 'Issued' || requestStatus === 'Partially Issued' 
                              ? materialData['Lining_EVA']?.issued || 0 
                              : '-'
                            }
                          </td>
                          <td className="px-6 py-4 text-center text-gray-400">
                            {requestStatus === 'Issued' || requestStatus === 'Partially Issued' 
                              ? Math.max(0, 35 - (materialData['Lining_EVA']?.available || 0) - (materialData['Lining_EVA']?.issued || 0))
                              : '-'
                            }
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200 bg-cyan-50">
                          <td className="px-6 py-3 text-sm text-cyan-700 border-r border-gray-300 italic" colSpan={6}>
                            Total Materials: 3 different materials used in production
                          </td>
                        </tr>

                        {/* Components Section */}
                        <tr className="border-b border-gray-200 bg-purple-100">
                          <td className="px-6 py-3 font-semibold text-purple-800 border-r border-gray-300" colSpan={6}>
                            COMPONENTS USED
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-300">Foam</td>
                          <td className="px-6 py-4 text-gray-600 border-r border-gray-300">-</td>
                          <td className="px-6 py-4 text-center text-gray-900 border-r border-gray-300">
                            {formData.cardQuantity ? `${(parseFloat(formData.cardQuantity) * 7.5).toFixed(1)} gm` : "7.5 gm"}
                          </td>
                          <td className="px-6 py-4 text-center border-r border-gray-300">
                            {requestStatus === 'Pending Availability Check' ? (
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="w-20 h-8 text-center border-gray-300"
                                min="0"
                                step="0.1"
                                value={materialData['Foam']?.available || ''}
                                onChange={(e) => handleMaterialDataChange('Foam', 'available', parseFloat(e.target.value) || 0)}
                              />
                            ) : (
                              <span className="text-center">{materialData['Foam']?.available || 0}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-400 border-r border-gray-300">
                            {requestStatus === 'Issued' || requestStatus === 'Partially Issued' 
                              ? materialData['Foam']?.issued || 0 
                              : '-'
                            }
                          </td>
                          <td className="px-6 py-4 text-center text-gray-400">
                            {requestStatus === 'Issued' || requestStatus === 'Partially Issued' 
                              ? Math.max(0, (formData.cardQuantity ? parseFloat(formData.cardQuantity) * 7.5 : 7.5) - (materialData['Foam']?.available || 0) - (materialData['Foam']?.issued || 0)).toFixed(1)
                              : '-'
                            }
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-300">Velcro</td>
                          <td className="px-6 py-4 text-gray-600 border-r border-gray-300">75mm</td>
                          <td className="px-6 py-4 text-center text-gray-900 border-r border-gray-300">
                            {formData.cardQuantity ? `${(parseFloat(formData.cardQuantity) * 1.25).toFixed(2)} pair` : "1.25 pair"}
                          </td>
                          <td className="px-6 py-4 text-center border-r border-gray-300">
                            {requestStatus === 'Pending Availability Check' ? (
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="w-20 h-8 text-center border-gray-300"
                                min="0"
                                step="0.1"
                                value={materialData['Velcro']?.available || ''}
                                onChange={(e) => handleMaterialDataChange('Velcro', 'available', parseFloat(e.target.value) || 0)}
                              />
                            ) : (
                              <span className="text-center">{materialData['Velcro']?.available || 0}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-400 border-r border-gray-300">
                            {requestStatus === 'Issued' || requestStatus === 'Partially Issued' 
                              ? materialData['Velcro']?.issued || 0 
                              : '-'
                            }
                          </td>
                          <td className="px-6 py-4 text-center text-gray-400">
                            {requestStatus === 'Issued' || requestStatus === 'Partially Issued' 
                              ? Math.max(0, (formData.cardQuantity ? parseFloat(formData.cardQuantity) * 1.25 : 1.25) - (materialData['Velcro']?.available || 0) - (materialData['Velcro']?.issued || 0)).toFixed(2)
                              : '-'
                            }
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-300">Buckle</td>
                          <td className="px-6 py-4 text-gray-600 border-r border-gray-300">-</td>
                          <td className="px-6 py-4 text-center text-gray-900 border-r border-gray-300">
                            {formData.cardQuantity ? `${parseInt(formData.cardQuantity) * 2} pcs` : "2 pcs"}
                          </td>
                          <td className="px-6 py-4 text-center border-r border-gray-300">
                            {requestStatus === 'Pending Availability Check' ? (
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="w-20 h-8 text-center border-gray-300"
                                min="0"
                                step="1"
                                value={materialData['Buckle']?.available || ''}
                                onChange={(e) => handleMaterialDataChange('Buckle', 'available', parseFloat(e.target.value) || 0)}
                              />
                            ) : (
                              <span className="text-center">{materialData['Buckle']?.available || 0}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-400 border-r border-gray-300">
                            {requestStatus === 'Issued' || requestStatus === 'Partially Issued' 
                              ? materialData['Buckle']?.issued || 0 
                              : '-'
                            }
                          </td>
                          <td className="px-6 py-4 text-center text-gray-400">
                            {requestStatus === 'Issued' || requestStatus === 'Partially Issued' 
                              ? Math.max(0, (formData.cardQuantity ? parseInt(formData.cardQuantity) * 2 : 2) - (materialData['Buckle']?.available || 0) - (materialData['Buckle']?.issued || 0))
                              : '-'
                            }
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-300">Trim</td>
                          <td className="px-6 py-4 text-gray-600 border-r border-gray-300">sticker</td>
                          <td className="px-6 py-4 text-center text-gray-900 border-r border-gray-300">
                            {formData.cardQuantity ? `${parseInt(formData.cardQuantity) * 10} pcs` : "10 pcs"}
                          </td>
                          <td className="px-6 py-4 text-center border-r border-gray-300">
                            {requestStatus === 'Pending Availability Check' ? (
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="w-20 h-8 text-center border-gray-300"
                                min="0"
                                step="1"
                                value={materialData['Trim']?.available || ''}
                                onChange={(e) => handleMaterialDataChange('Trim', 'available', parseFloat(e.target.value) || 0)}
                              />
                            ) : (
                              <span className="text-center">{materialData['Trim']?.available || 0}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-400 border-r border-gray-300">
                            {requestStatus === 'Issued' || requestStatus === 'Partially Issued' 
                              ? materialData['Trim']?.issued || 0 
                              : '-'
                            }
                          </td>
                          <td className="px-6 py-4 text-center text-gray-400">
                            {requestStatus === 'Issued' || requestStatus === 'Partially Issued' 
                              ? Math.max(0, (formData.cardQuantity ? parseInt(formData.cardQuantity) * 10 : 10) - (materialData['Trim']?.available || 0) - (materialData['Trim']?.issued || 0))
                              : '-'
                            }
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200 bg-purple-50">
                          <td className="px-6 py-3 text-sm text-purple-700 border-r border-gray-300 italic" colSpan={6}>
                            Total Components: 4 different components used in production
                          </td>
                        </tr>

                        {/* Summary Row */}
                        <tr className="border-t-2 border-gray-300 bg-blue-100">
                          <td className="px-6 py-4 font-bold text-blue-900 border-r border-gray-300" colSpan={2}>
                            TOTAL ITEMS FOR PRODUCTION
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-blue-900 border-r border-gray-300">
                            {formData.cardQuantity || "0"} units
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-blue-700 border-r border-gray-300">
                            Available
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-blue-700 border-r border-gray-300">
                            Pending
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-blue-700">
                            Remaining
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Summary */}
                <div className="mt-6 bg-white rounded-lg border border-blue-200 p-4">
                  <div className="flex items-center justify-between">
                    {/* Left side - Status and Info */}
                    <div className="flex items-center gap-8">
                      
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                          {requestStatus}
                        </span>
                      </div>
                    </div>

                    {/* Right side - Send to Store Manager Button */}
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={() => {
                          if (!formData.cardQuantity || parseInt(formData.cardQuantity) === 0) {
                            toast.error("Please enter production allocation quantity first");
                            return;
                          }
                          
                          // Create material request
                          const materialRequestData = {
                            productionCardId: generateCardId(),
                            requestedBy: "Production Manager", // This would be current user
                            status: 'Pending to Store' as const,
                            materials: [
                              {
                                id: '1',
                                name: 'Upper',
                                specification: 'Rexine',
                                requirement: parseInt(formData.cardQuantity) * 25,
                                unit: 'pair/vth',
                                available: materialData['Upper']?.available || 0,
                                issued: 0,
                                balance: 0
                              },
                              {
                                id: '2',
                                name: 'Lining',
                                specification: 'Skimh',
                                requirement: parseInt(formData.cardQuantity) * 25,
                                unit: 'pair @ 15/-',
                                available: materialData['Lining_Skimh']?.available || 0,
                                issued: 0,
                                balance: 0
                              },
                              {
                                id: '3',
                                name: 'Lining',
                                specification: 'EVA',
                                requirement: 35,
                                unit: '3370 - 1.5mm pair',
                                available: materialData['Lining_EVA']?.available || 0,
                                issued: 0,
                                balance: 0
                              }
                            ],
                            components: [
                              {
                                id: '1',
                                name: 'Foam',
                                specification: '-',
                                requirement: parseFloat(formData.cardQuantity) * 7.5,
                                unit: 'gm',
                                available: materialData['Foam']?.available || 0,
                                issued: 0,
                                balance: 0
                              },
                              {
                                id: '2',
                                name: 'Velcro',
                                specification: '75mm',
                                requirement: parseFloat(formData.cardQuantity) * 1.25,
                                unit: 'pair',
                                available: materialData['Velcro']?.available || 0,
                                issued: 0,
                                balance: 0
                              },
                              {
                                id: '3',
                                name: 'Buckle',
                                specification: '-',
                                requirement: parseInt(formData.cardQuantity) * 2,
                                unit: 'pcs',
                                available: materialData['Buckle']?.available || 0,
                                issued: 0,
                                balance: 0
                              },
                              {
                                id: '4',
                                name: 'Trim',
                                specification: 'sticker',
                                requirement: parseInt(formData.cardQuantity) * 10,
                                unit: 'pcs',
                                available: materialData['Trim']?.available || 0,
                                issued: 0,
                                balance: 0
                              }
                            ]
                          };

                          // Add to store
                          addMaterialRequest(materialRequestData);
                          setMaterialRequestId(materialRequestData.productionCardId);
                          setRequestStatus('Pending to Store');
                          
                          toast.success("Material request sent to Store Manager successfully!");
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                        disabled={!formData.cardQuantity || parseInt(formData.cardQuantity) === 0 || requestStatus !== 'Pending Availability Check'}
                      >
                        <Package className="w-4 h-4" />
                        {requestStatus === 'Pending Availability Check' ? 'Send to Store Manager' : 'Request Sent'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline & Resources */}
            <div className="space-y-8">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-4">
                <Calendar className="w-6 h-6 text-blue-500" />
                Timeline & Resources
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label htmlFor="startDate" className="text-base font-medium text-gray-700">
                    Start Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                      className="h-12 border-2 focus:border-blue-500 text-base pl-12 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="assignPlant" className="text-base font-medium text-gray-700">
                    Assign Plant
                  </Label>
                  <Select
                    value={formData.assignPlant || ""}
                    onValueChange={(value) => {
                      if (value === '__add_new__') {
                        setAddPlantDialogOpen(true);
                      } else {
                        handleInputChange("assignPlant", value);
                      }
                    }}
                  >
                    <SelectTrigger className="h-12 border-2 focus:border-blue-500 text-base">
                      <SelectValue placeholder="Select manufacturing plant" />
                    </SelectTrigger>
                    <SelectContent>
                      {plantsList.map((plant) => (
                        <SelectItem key={plant} value={plant}>
                          {plant}
                        </SelectItem>
                      ))}
                      <Separator className="my-1" />
                      <div
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setAddPlantDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Plant
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-8">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-4">
                <AlertCircle className="w-6 h-6 text-blue-500" />
                Additional Details
              </h3>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label htmlFor="description" className="text-base font-medium text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe the production process and requirements..."
                    rows={4}
                    className="resize-none border-2 focus:border-blue-500 text-base"
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="specialInstructions" className="text-base font-medium text-gray-700">
                    Special Instructions
                  </Label>
                  <Textarea
                    id="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={(e) => handleInputChange("specialInstructions", e.target.value)}
                    placeholder="Any special instructions or quality requirements..."
                    rows={4}
                    className="resize-none border-2 focus:border-blue-500 text-base"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 px-8 py-4 shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  // This would open the Start Production Manager dialog
                  toast.info("Start Production Manager dialog would open here");
                }}
                variant="outline"
                className="px-6 py-2 border-green-500 text-green-600 hover:bg-green-50"
              >
                <Target className="w-4 h-4 mr-2" />
                Start Production
              </Button>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingCard ? "Update Production Card" : "Save Production Card"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Add New Plant Dialog */}
      <Dialog open={addPlantDialogOpen} onOpenChange={setAddPlantDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Factory className="w-5 h-5 text-blue-600" />
              Add New Plant
            </DialogTitle>
            <DialogDescription>
              Enter the name of the new manufacturing plant
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plantName">Plant Name *</Label>
              <Input
                id="plantName"
                value={newPlantName}
                onChange={(e) => setNewPlantName(e.target.value)}
                placeholder="e.g., Plant F - Central Unit"
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    saveNewPlant();
                  }
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAddPlantDialogOpen(false);
                setNewPlantName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveNewPlant}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Add Plant
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}