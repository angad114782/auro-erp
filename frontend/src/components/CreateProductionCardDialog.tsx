import React, { useState, useEffect } from "react";
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
  Trash2,
  BarChart3,
  Building,
  Calendar,
  FileText,
  Play,
  Pause,
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
import { toast } from "sonner";
import { useERPStore } from "../lib/data-store";
import { ProductionCardFormDialog } from "./ProductionCardFormDialog";
import { useProjects } from "../hooks/useProjects";
import api from "../lib/api";

// Media query hook
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);
  return matches;
};

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
  assignPlant: string;
  projectId?: string;
}

interface CreateProductionCardDialogProps {
  open: boolean;
  onClose: () => void;
  selectedProductionCard?: any;
  onProductionCardCreated?: (createdCard: any) => void;
}

export function CreateProductionCardDialog({
  open,
  onClose,
  selectedProductionCard,
  onProductionCardCreated,
}: CreateProductionCardDialogProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1024px)");

  const { productionCards: storeProductionCards } = useERPStore();
  const { projects, loadProjects } = useProjects();

  useEffect(() => {
    loadProjects();
  }, []);

  const rdProjects = projects;
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const [showProductionCardForm, setShowProductionCardForm] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ProductionCardData | null>(
    null
  );
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);
  const [startingProduction, setStartingProduction] = useState<string | null>(
    null
  );
  const [showAllCards, setShowAllCards] = useState<boolean>(false);
  const [apiCards, setApiCards] = useState<any[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number | null>(null);

  const extractOrderQuantity = (src: any): number | null => {
    if (!src) return null;
    if (src.po && src.po.orderQuantity != null)
      return Number(src.po.orderQuantity);
    if (src.project && src.project.po && src.project.po.orderQuantity != null)
      return Number(src.project.po.orderQuantity);
    if (src.orderQuantity != null) return Number(src.orderQuantity);
    if (src.quantity != null) return Number(src.quantity);
    if (src.targetQuantity != null) return Number(src.targetQuantity);
    return null;
  };

  const fetchProductionCardsForProject = async (projectId: string) => {
    if (!projectId) {
      setApiCards([]);
      return;
    }
    setApiLoading(true);
    setApiError(null);
    try {
      const res = await api.get(`/projects/${projectId}/production-cards`);
      const items =
        res?.data?.data?.items ?? res?.data?.items ?? res?.data?.data ?? [];
      const normalized = Array.isArray(items)
        ? items
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setApiCards(normalized);
    } catch (err: any) {
      console.error("Failed to fetch production cards:", err);
      setApiError(
        err?.response?.data?.error || err?.message || "Unknown error"
      );
      setApiCards([]);
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    const projId =
      selectedProject?.project?._id ||
      selectedProject?.id ||
      selectedProject?._id;
    if (!showAllCards && projId) {
      fetchProductionCardsForProject(String(projId));
    } else {
      setApiCards([]);
      setApiError(null);
      setApiLoading(false);
    }
  }, [selectedProject, showAllCards]);

  useEffect(() => {
    let cardToUse = selectedProductionCard;
    if (!cardToUse && storeProductionCards.length > 0) {
      cardToUse = storeProductionCards[0];
    }

    const projectIdFromCard =
      cardToUse?.projectId ||
      cardToUse?.rdProjectId ||
      (cardToUse?.project && (cardToUse.project._id || cardToUse.project.id));

    if (cardToUse && rdProjects && rdProjects.length > 0 && projectIdFromCard) {
      const associatedProject = rdProjects.find(
        (project: any) =>
          project.id === projectIdFromCard || project._id === projectIdFromCard
      );
      if (associatedProject) {
        setSelectedProject(associatedProject);
      } else {
        setSelectedProject(null);
      }
    } else {
      setSelectedProject(null);
    }

    const qty = extractOrderQuantity(cardToUse);
    if (qty != null && !Number.isNaN(qty)) {
      setOrderQuantity(Number(qty));
    } else {
      setOrderQuantity(null);
    }
  }, [selectedProductionCard, rdProjects, storeProductionCards]);

  const normalizeCardProjectId = (card: any) => {
    return (
      card.projectId ||
      card.project ||
      card.rdProjectId ||
      card.rdProject ||
      (card.project && (card.project._id || card.project.id)) ||
      null
    );
  };

  const projId = selectedProject?.id || selectedProject?._id;
  const storeFiltered = storeProductionCards.filter((card: any) => {
    if (showAllCards) return true;
    if (!selectedProject) return false;
    const projIdFromCard = normalizeCardProjectId(card);
    if (!projIdFromCard || !projId) return false;
    return String(projIdFromCard) === String(projId);
  });

  const sourceCards =
    !showAllCards && apiCards && apiCards.length > 0 ? apiCards : storeFiltered;

  const displayProductionCards: ProductionCardData[] = sourceCards.map(
    (card: any) => ({
      id: card.id || card._id,
      projectId: card.projectId || card.project?._id || card.project || null,
      cardName: card.cardNumber || card.cardName,
      productionType: card.description || "Production",
      priority: "Medium",
      targetQuantity: card.cardQuantity?.toString?.() ?? "",
      startDate: card.startDate,
      endDate: "",
      supervisor: card.createdBy,
      workShift: card.workShift,
      description: card.description,
      specialInstructions: card.specialInstructions,
      status: card.status,
      createdAt: card.createdAt,
      assignPlant: card.assignedPlant,
    })
  );

  const handleDeleteCard = async (card: any) => {
    const projectId = card.projectId;
    if (!projectId) {
      toast.error("Project ID missing for this card");
      return;
    }
    try {
      await api.delete(`/projects/${projectId}/production-cards/${card.id}`);
      toast.success("Production card deleted");
      fetchProductionCardsForProject(projectId);
    } catch (err) {
      toast.error("Failed to delete card");
    }
  };

  const handleStartProduction = async (card: ProductionCardData) => {
    setStartingProduction(card.id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Production started for ${card.cardName}!`);
    } catch (error) {
      toast.error("Failed to start production");
    } finally {
      setStartingProduction(null);
    }
  };

  const handleStopProduction = async (card: ProductionCardData) => {
    setLoadingCardId(card.id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Production stopped for ${card.cardName}`);
    } catch (error) {
      toast.error("Failed to stop production");
    } finally {
      setLoadingCardId(null);
    }
  };

  const handleSaveProductionCard = (cardData: ProductionCardData) => {
    toast.success("Production Card saved successfully!");
    const projId =
      selectedProject?.project?._id ||
      selectedProject?.id ||
      selectedProject?._id;
    if (projId) fetchProductionCardsForProject(projId);
    if (editingCard) {
      setEditingCard(null);
    }
  };

  const handleEditCard = (card: ProductionCardData) => {
    setEditingCard(card);
    setShowProductionCardForm(true);
  };

  const getCardActionButtons = (card: ProductionCardData) => {
    const isInProgress = card.status === "In Progress";
    const isStarting = startingProduction === card.id;
    const isLoading = loadingCardId === card.id;

    if (isInProgress) {
      return (
        <>
          <Button
            onClick={() => handleStopProduction(card)}
            disabled={isLoading}
            variant="destructive"
            size="sm"
            className="flex-1 text-xs"
          >
            {isLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Stopping...
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                Stop
              </>
            )}
          </Button>
          <Button
            onClick={() => handleEditCard(card)}
            variant="secondary"
            size="sm"
            className="flex-1 text-xs"
          >
            <Target className="w-3 h-3" />
            Edit
          </Button>
        </>
      );
    }

    return (
      <div className="flex gap-2 w-full">
        <Button
          onClick={() => handleStartProduction(card)}
          disabled={isStarting}
          size="sm"
          className="flex-1 bg-green-500 hover:bg-green-600 text-xs"
        >
          <Play className="w-3 h-3" />
          Start
        </Button>
        <Button
          onClick={() => handleEditCard(card)}
          variant="secondary"
          size="sm"
          className="flex-1 text-xs"
        >
          <Target className="w-3 h-3" />
          Edit
        </Button>
        <Button
          onClick={() => handleDeleteCard(card)}
          variant="destructive"
          size="sm"
          className="flex-1 text-xs"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </Button>
      </div>
    );
  };

  // Determine dialog width based on screen size
  const getDialogStyle = () => {
    if (isMobile) {
      return {
        width: "95vw",
        maxWidth: "95vw",
        maxHeight: "98vh",
      };
    } else if (isTablet) {
      return {
        width: "90vw",
        maxWidth: "90vw",
        maxHeight: "95vh",
      };
    } else {
      return {
        width: "96vw",
        maxWidth: "1400px",
        maxHeight: "95vh",
      };
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        className="overflow-hidden p-0 m-0 flex flex-col"
        style={getDialogStyle()}
      >
        {/* Header */}
        <div className="sticky top-0 z-50 px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8 bg-linear-to-r from-gray-50 via-white to-gray-50 border-b-2 border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-6 md:gap-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Factory className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-gray-900 mb-1 sm:mb-2">
                  Start Production Manager
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600">
                  Initialize comprehensive production planning and management
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 self-end sm:self-center">
              <div className="bg-linear-to-br from-green-50 to-emerald-100 border border-green-200 rounded-lg sm:rounded-xl px-3 py-2 sm:px-6 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
                  <div>
                    <p className="text-xs sm:text-sm md:text-base text-green-600 font-semibold">
                      Order Quantity
                    </p>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl font-mono font-bold text-green-800">
                      {orderQuantity
                        ? `${Number(orderQuantity).toLocaleString(
                            "en-IN"
                          )} Units`
                        : "No Order"}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-8 w-8 sm:h-10 sm:w-10 p-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8 lg:py-10 space-y-6">
            {/* Production Cards Section */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                    Production Cards
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Manage production workflow and resource allocation
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllCards((s) => !s)}
                    className="text-xs sm:text-sm"
                  >
                    {showAllCards ? "Showing: All" : "Showing: This Project"}
                  </Button>
                  <Button
                    className="bg-[#0c9dcb] hover:bg-[#0a8bb5] text-white text-xs sm:text-sm"
                    onClick={() => setShowProductionCardForm(true)}
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Create Card
                  </Button>
                </div>
              </div>

              {/* Production Cards Display */}
              {displayProductionCards.filter(
                (card) =>
                  !["1", "2"].includes(card.id) &&
                  !card.cardName?.startsWith("PROD/25-26/09/00")
              ).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {displayProductionCards
                    .filter(
                      (card) =>
                        !["1", "2"].includes(card.id) &&
                        !card.cardName?.startsWith("PROD/25-26/09/00")
                    )
                    .map((card) => (
                      <div
                        key={card.id}
                        className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all"
                      >
                        {/* Header */}
                        <div className="flex flex-col space-y-3 sm:space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 truncate">
                                {card.cardName}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">
                                {card.productionType}
                              </p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                card.status === "In Progress"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {card.status === "In Progress"
                                ? "In Production"
                                : "Ready to Start"}
                            </Badge>
                            {card.status === "In Progress" && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                              >
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full animate-pulse mr-1" />
                                Live
                              </Badge>
                            )}
                          </div>

                          {/* Key Info */}
                          <div className="space-y-2 sm:space-y-3 pt-2">
                            {[
                              {
                                label: "Production Quantity",
                                value: `${card.targetQuantity} units`,
                              },
                              {
                                label: "Plant Assignment",
                                value:
                                  card?.assignPlant?.name || "Not assigned",
                              },
                              {
                                label: "Start Date",
                                value: card.startDate
                                  ? new Date(
                                      card.startDate
                                    ).toLocaleDateString()
                                  : "Not set",
                              },
                              { label: "Card Number", value: card.cardName },
                              {
                                label: "Created",
                                value: new Date(
                                  card.createdAt
                                ).toLocaleDateString(),
                              },
                            ].map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between py-1 sm:py-2 border-b border-gray-100"
                              >
                                <span className="text-xs text-gray-500">
                                  {item.label}
                                </span>
                                <span className="text-xs sm:text-sm font-medium text-gray-900 truncate ml-2">
                                  {item.value}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Description */}
                          {card.description && (
                            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-2">
                                Production Notes
                              </p>
                              <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">
                                {card.description}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
                            {getCardActionButtons(card)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Package className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-500" />
                  </div>
                  <h4 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                    No Production Cards
                  </h4>
                  <p className="text-sm text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">
                    Create production cards to organise and track different
                    aspects of production.
                  </p>
                  <Button
                    className="bg-[#0c9dcb] hover:bg-[#0a8bb5] text-white text-sm sm:text-base"
                    onClick={() => setShowProductionCardForm(true)}
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Create Your First Card
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 bg-white/95 backdrop-blur-sm border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              size={isMobile ? "sm" : "default"}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              size={isMobile ? "sm" : "default"}
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              <Factory className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Start Production
            </Button>
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
        selectedProject={selectedProductionCard}
        editingCard={editingCard}
        onCardCreated={() => {
          const projId =
            selectedProject?.project?._id ||
            selectedProject?.id ||
            selectedProject?._id;
          if (projId) fetchProductionCardsForProject(projId);
        }}
      />
    </Dialog>
  );
}

export default CreateProductionCardDialog;
