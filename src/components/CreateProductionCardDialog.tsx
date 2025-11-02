import React, { useState } from "react";
import {
  Factory,
  Target,
  Calculator,
  Users,
  AlertCircle,
  CheckCircle,
  Workflow,
  Clock,
  IndianRupee,
  X,
  Package,
  Plus,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { toast } from "sonner@2.0.3";
import { useERPStore, RDProject } from "../lib/data-store";
import { ProductionCardFormDialog } from "./ProductionCardFormDialog";

interface ProductionCard {
  productionName: string;
  rdProject: string;
  productionLine: string;
  targetQuantity: string;
  startDate: string;
  endDate: string;
  supervisor: string;
  priority: string;
  materialRequirements: string;
  qualityStandards: string;
  notes: string;
  budgetAllocation: string;
  workShift: string;
}

interface ProductionCardData {
  id: string;
  cardName: string;
  productionType: string;
  priority: string;
  targetQuantity: string;
  startDate: string;
  endDate: string;
  supervisor: string;
  workShift: string;
  description: string;
  specialInstructions: string;
  status: string;
  createdAt: string;
  assignedPlant: string;
}

interface CreateProductionCardDialogProps {
  open: boolean;
  onClose: () => void;
  selectedProductionCard?: any; // The production card that was clicked to start production
}

export function CreateProductionCardDialog({
  open,
  onClose,
  selectedProductionCard,
}: CreateProductionCardDialogProps) {
  console.log('CreateProductionCardDialog rendered with props:', { open, selectedProductionCard });
  
  const { rdProjects, updateProject, brands, categories, types, colors, countries, productionCards: storeProductionCards, updateProductionCard } = useERPStore();
  
  const [selectedProject, setSelectedProject] = useState<RDProject | null>(null);
  const [showProductionCardForm, setShowProductionCardForm] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ProductionCardData | null>(null);
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);
  const [startingProduction, setStartingProduction] = useState<string | null>(null);

  // Effect to set selectedProject when selectedProductionCard changes
  React.useEffect(() => {
    console.log('CreateProductionCardDialog useEffect triggered');
    console.log('selectedProductionCard:', selectedProductionCard);
    console.log('rdProjects:', rdProjects);
    console.log('storeProductionCards:', storeProductionCards);
    
    // If we have a specific production card selected, use it
    let cardToUse = selectedProductionCard;
    
    // If no specific card is selected but we have production cards, use the first one for testing
    if (!cardToUse && storeProductionCards.length > 0) {
      console.log('No specific card selected, using first production card for testing');
      cardToUse = storeProductionCards[0];
    }
    
    if (cardToUse && rdProjects.length > 0) {
      console.log('Looking for project with ID:', cardToUse.projectId);
      // Find the RD project associated with this production card
      const associatedProject = rdProjects.find(project => project.id === cardToUse.projectId);
      console.log('Found associatedProject:', associatedProject);
      if (associatedProject) {
        setSelectedProject(associatedProject);
        console.log('Set selectedProject to:', associatedProject);
      } else {
        console.log('No matching project found');
        setSelectedProject(null);
      }
    } else {
      console.log('Setting selectedProject to null - missing data');
      setSelectedProject(null);
    }
  }, [selectedProductionCard, rdProjects, storeProductionCards]);

  // Convert store production cards to the format expected by this component
  const displayProductionCards: ProductionCardData[] = storeProductionCards.map(card => ({
    id: card.id,
    cardName: card.cardNumber,
    productionType: card.description || "Standard Production",
    priority: "Medium", // Default priority
    targetQuantity: card.cardQuantity.toString(),
    startDate: card.startDate,
    endDate: "", // Not available in store format
    supervisor: card.createdBy,
    workShift: "Day Shift", // Default shift
    description: card.description,
    specialInstructions: card.specialInstructions,
    status: card.status,
    createdAt: card.createdDate,
    assignedPlant: card.assignedPlant,
  }));

  // Remove duplicate local state since we're using the store data
  // const [productionCards, setProductionCards] = useState<ProductionCardData[]>([]);

  // Production card form state (missing state that was causing the error)
  const [productionCard, setProductionCard] = useState<ProductionCard>({
    productionName: "",
    rdProject: "",
    productionLine: "",
    targetQuantity: "",
    startDate: "",
    endDate: "",
    supervisor: "",
    priority: "",
    materialRequirements: "",
    qualityStandards: "",
    notes: "",
    budgetAllocation: "",
    workShift: "",
  });

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

  const generateProductionCode = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;
    const month = (now.getMonth() + 1)
      .toString()
      .padStart(2, "0");

    // Generate PROD code similar to RND
    const currentYearPrefix = `PROD/${currentYear.toString().slice(-2)}-${nextYear.toString().slice(-2)}/${month}/`;
    
    // Mock existing production cards count
    const existingProductionCards = 150; // This would come from actual production data

    return `PROD/${currentYear.toString().slice(-2)}-${nextYear.toString().slice(-2)}/${month}/${(existingProductionCards + 1).toString().padStart(3, "0")}`;
  };

  const handleCreateProductionCard = async () => {
    if (
      !productionCard.productionName ||
      !productionCard.rdProject ||
      !productionCard.targetQuantity
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Mock production card creation
    toast.success("Production Card created successfully!");

    // Reset form
    setProductionCard({
      productionName: "",
      rdProject: "",
      productionLine: "",
      targetQuantity: "",
      startDate: "",
      endDate: "",
      supervisor: "",
      priority: "",
      materialRequirements: "",
      qualityStandards: "",
      notes: "",
      budgetAllocation: "",
      workShift: "",
    });

    onClose();
  };

  const handleSaveProductionCard = (cardData: ProductionCardData) => {
    // For now, we'll just show a success message since we need to integrate with the store properly
    toast.success("Production Card saved successfully!");
    console.log('Production card saved:', cardData);
    
    if (editingCard) {
      setEditingCard(null);
    }
  };

  const handleEditCard = (card: ProductionCardData) => {
    setEditingCard(card);
    setShowProductionCardForm(true);
  };

  const handleStartProduction = async (card: ProductionCardData) => {
    setStartingProduction(card.id);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the production card status to "In Progress"
      if (updateProductionCard) {
        updateProductionCard(card.id, {
          ...card,
          status: "In Progress",
          startDate: new Date().toISOString(),
        });
      }
      
      toast.success(`Production started for ${card.cardName}!`);
      console.log('Production started for card:', card.cardName);
      
      // Optional: Close dialog and navigate to production tracking
      // onClose();
      
    } catch (error) {
      toast.error("Failed to start production. Please try again.");
      console.error('Error starting production:', error);
    } finally {
      setStartingProduction(null);
    }
  };

  const handleStopProduction = async (card: ProductionCardData) => {
    setLoadingCardId(card.id);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the production card status back to "Ready to Start"
      if (updateProductionCard) {
        updateProductionCard(card.id, {
          ...card,
          status: "Ready to Start",
        });
      }
      
      toast.success(`Production stopped for ${card.cardName}`);
      console.log('Production stopped for card:', card.cardName);
      
    } catch (error) {
      toast.error("Failed to stop production. Please try again.");
      console.error('Error stopping production:', error);
    } finally {
      setLoadingCardId(null);
    }
  };

  const getCardActionButtons = (card: ProductionCardData) => {
    const isInProgress = card.status === "In Progress";
    const isStarting = startingProduction === card.id;
    const isLoading = loadingCardId === card.id;

    if (isInProgress) {
      return (
        <>
          <button 
            onClick={() => handleStopProduction(card)}
            disabled={isLoading}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Stopping...
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                Stop Production
              </>
            )}
          </button>
          <button 
            onClick={() => handleEditCard(card)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
          >
            <Target className="w-4 h-4" />
            Edit Card
          </button>
        </>
      );
    }

    return (
      <>
        <button 
          onClick={() => handleStartProduction(card)}
          disabled={isStarting}
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
        >
          {isStarting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Factory className="w-4 h-4" />
              Start Production
            </>
          )}
        </button>
        <button 
          onClick={() => handleEditCard(card)}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
        >
          <Target className="w-4 h-4" />
          Edit Card
        </button>
      </>
    );
  }; 

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="!max-w-[96vw] !w-[96vw] max-h-[95vh] overflow-hidden p-0 m-0 top-[2.5vh] translate-y-0 flex flex-col">
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-50 px-12 py-8 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b-2 border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Factory className="w-8 h-8 text-white" />
              </div>
              <div>
                <DialogTitle className="text-4xl font-semibold text-gray-900 mb-2">
                  Start Production Manager
                </DialogTitle>
                <DialogDescription className="text-xl text-gray-600">
                  Initialize a comprehensive production planning and
                  management card with resource allocation and timeline
                  tracking
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl px-8 py-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div className="text-right">
                    <p className="text-base text-green-600 font-semibold">
                      Order Quantity
                    </p>
                    <p className="text-2xl font-mono font-bold text-green-800">
                      {selectedProject ? "1,200 Units" : "No Order"}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center"
                type="button"
              >
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-12 py-10 space-y-8">
            {/* Basic Product Details Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Product Details
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200"></div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Product Name</p>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedProject ? `${getBrandName(selectedProject.brandId)} ${getCategoryName(selectedProject.categoryId)}` : "No Product Selected"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Brand</p>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedProject ? getBrandName(selectedProject.brandId) : "No Brand"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Category</p>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedProject ? getCategoryName(selectedProject.categoryId) : "No Category"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Project Code</p>
                    <p className="text-base font-semibold text-blue-600">
                      {selectedProject ? selectedProject.autoCode : "No Project"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Type & Gender</p>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedProject ? `${getTypeName(selectedProject.typeId)} • Men` : "No Type"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Art & Colour</p>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedProject ? getColorName(selectedProject.colorId) : "No Color"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Country</p>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedProject ? getCountryName(selectedProject.countryId) : "No Country"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Order Quantity</p>
                    <p className="text-base font-semibold text-green-600">
                      {selectedProject ? "1,200 units" : "No Quantity"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Production Cards Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Production Cards</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage production workflow and resource allocation
                  </p>
                </div>
                <Button 
                  className="bg-[#0c9dcb] hover:bg-[#0a8bb5] text-white px-6 py-2.5"
                  onClick={() => setShowProductionCardForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Production Card
                </Button>
              </div>

              {/* Production Cards Display */}
              {displayProductionCards.filter(card => 
                // Filter out demo/sample cards - exclude cards with IDs '1' and '2' and demo card numbers
                !['1', '2'].includes(card.id) && 
                !card.cardName?.startsWith('PROD/25-26/09/00')
              ).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayProductionCards.filter(card => 
                    // Filter out demo/sample cards - exclude cards with IDs '1' and '2' and demo card numbers
                    !['1', '2'].includes(card.id) && 
                    !card.cardName?.startsWith('PROD/25-26/09/00')
                  ).map((card) => (
                    <div
                      key={card.id}
                      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-[420px]"
                    >
                      {/* Header Section */}
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                              {card.cardName}
                            </h4>
                            <p className="text-sm text-gray-600 mb-3">{card.productionType}</p>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="flex flex-wrap gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              card.status === "In Progress" 
                                ? "bg-green-50 text-green-700 border-green-200" 
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {card.status === "In Progress" ? "In Production" : "Ready to Start"}
                          </Badge>
                          {card.status === "In Progress" && (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse mr-1" />
                              Live
                            </Badge>
                          )}
                        </div>
                        
                        {/* Key Info Section */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-xs text-gray-500">Production Quantity</span>
                            <span className="text-sm font-semibold text-gray-900">{card.targetQuantity} units</span>
                          </div>
                          
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-xs text-gray-500">Plant Assignment</span>
                            <span className="text-sm font-medium text-gray-900">{card.assignedPlant || "Not assigned"}</span>
                          </div>
                          
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-xs text-gray-500">Start Date</span>
                            <span className="text-sm font-medium text-gray-900">
                              {card.startDate ? new Date(card.startDate).toLocaleDateString() : "Not set"}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-xs text-gray-500">Card Number</span>
                            <span className="text-sm font-medium text-blue-600">{card.cardName}</span>
                          </div>
                          
                          <div className="flex items-center justify-between py-2">
                            <span className="text-xs text-gray-500">Created</span>
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(card.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Description Section */}
                      {card.description && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Production Notes</p>
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{card.description}</p>
                        </div>
                      )}
                      
                      {/* Action Buttons Footer */}
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          {getCardActionButtons(card)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <Package className="w-10 h-10 text-blue-500" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">No Production Cards</h4>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                    Create production cards to organise and track different aspects of production.
                  </p>
                  <Button 
                    className="bg-[#0c9dcb] hover:bg-[#0a8bb5] text-white px-6 py-3 text-base"
                    onClick={() => setShowProductionCardForm(true)}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Card
                  </Button>
                </div>
              )}

              {/* Sticky Action Buttons */}
              <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200/80 shadow-2xl shadow-gray-900/10 z-50">
                <div className="px-12 py-6 flex justify-end gap-4">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    size="lg"
                    className="px-8 py-3 h-12 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateProductionCard}
                    size="lg"
                    className="px-8 py-3 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                  >
                    <Factory className="w-5 h-5 mr-2" />
                    Start Production
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* Production Card Form Dialog */}
      <ProductionCardFormDialog
        open={showProductionCardForm}
        onClose={() => {
          setShowProductionCardForm(false);
          setEditingCard(null);
        }}
        onSave={handleSaveProductionCard}
        selectedProject={selectedProject}
        editingCard={editingCard}
      />
    </Dialog>
  );
}