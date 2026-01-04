// POTargetDialog.tsx (FIXED VERSION)
import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  IndianRupee,
  Calendar,
  MessageSquare,
  User,
  CheckCircle,
  X,
  Save,
  Calculator,
  Target,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
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
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import api from "../lib/api";
import { useRedirect } from "../hooks/useRedirect";

interface POTargetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  onConfirm: () => void;
}

export function POTargetDialog({
  open,
  onOpenChange,
  project,
  onConfirm,
}: POTargetDialogProps) {
  const [orderQuantity, setOrderQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [poNumber, setPONumber] = useState("");
  const [clientFeedback, setClientFeedback] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState("Normal");
  const [qualityRequirements, setQualityRequirements] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [loadingCost, setLoadingCost] = useState(false);
  const [tentativeCost, setTentativeCost] = useState<number | null>(null);

  const { goTo } = useRedirect();

  // Check screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch tentative cost when dialog opens
  useEffect(() => {
    if (open && project?._id) {
      fetchTentativeCost();
    } else {
      // Reset when dialog closes
      setTentativeCost(null);
    }
  }, [open, project?._id]);

  const fetchTentativeCost = async () => {
    setLoadingCost(true);
    try {
      // Try to get calculated tentative cost from cost summary
      const response = await api.get(`/projects/${project._id}/costs`);

      if (response.data?.summary?.tentativeCost) {
        // If API returns calculated tentative cost
        setTentativeCost(response.data.summary.tentativeCost);
      } else if (response.data?.hasCostData && response.data?.summary) {
        // If we have cost breakdown in summary, use it
        const summary = response.data.summary;
        const calculatedTentative =
          (summary.upperTotal || 0) +
          (summary.componentTotal || 0) +
          (summary.materialTotal || 0) +
          (summary.packagingTotal || 0) +
          (summary.miscTotal || 0) +
          (summary.labourTotal || 0) +
          (summary.additionalCosts || 0);

        setTentativeCost(calculatedTentative);
      } else {
        // Fallback: Fetch all cost components and calculate
        await fetchAndCalculateTentativeCost();
      }
    } catch (error) {
      console.error("Error fetching tentative cost:", error);
      // Fallback to clientFinalCost if API fails
      setTentativeCost(project.clientFinalCost);
    } finally {
      setLoadingCost(false);
    }
  };

  const fetchAndCalculateTentativeCost = async () => {
    try {
      // Fetch all cost components
      const [
        upperRes,
        componentRes,
        materialRes,
        packagingRes,
        miscRes,
        labourRes,
      ] = await Promise.all([
        api.get(`/projects/${project._id}/costs/upper`),
        api.get(`/projects/${project._id}/costs/component`),
        api.get(`/projects/${project._id}/costs/material`),
        api.get(`/projects/${project._id}/costs/packaging`),
        api.get(`/projects/${project._id}/costs/miscellaneous`),
        api.get(`/projects/${project._id}/costs/labour`),
      ]);

      // Calculate totals from each category
      const calculateTotal = (items: any[]) =>
        items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;

      const upperTotal = calculateTotal(upperRes.data.rows || []);
      const componentTotal = calculateTotal(componentRes.data.rows || []);
      const materialTotal = calculateTotal(materialRes.data.rows || []);
      const packagingTotal = calculateTotal(packagingRes.data.rows || []);
      const miscTotal = calculateTotal(miscRes.data.rows || []);
      const labourTotal = labourRes.data.labour?.directTotal || 0;

      // Calculate tentative cost (cost total + 15% profit margin)
      const costTotal =
        upperTotal +
        componentTotal +
        materialTotal +
        packagingTotal +
        miscTotal +
        labourTotal;
      const profitMargin = 15; // Default 15% profit margin
      const tentative = costTotal * (1 + profitMargin / 100);

      setTentativeCost(tentative);
    } catch (error) {
      console.error("Error calculating tentative cost:", error);
      setTentativeCost(project.clientFinalCost);
    }
  };

  const calculateTotalAmount = () => {
    const qty = parseInt(orderQuantity) || 0;
    const price = parseFloat(unitPrice) || project.clientFinalCost || 0;
    return qty * price;
  };

  const handleSubmit = async () => {
    if (!orderQuantity || parseInt(orderQuantity) <= 0) {
      toast.error("Please enter a valid order quantity");
      return;
    }

    if (!clientFeedback.trim()) {
      toast.error("Please enter client feedback");
      return;
    }

    if (!deliveryDate) {
      toast.error("Please select a delivery date");
      return;
    }

    try {
      const poData = {
        orderQuantity: parseInt(orderQuantity),
        unitPrice: parseFloat(unitPrice) || project.clientFinalCost || 0,
        poNumber: poNumber.trim() || undefined,
        deliveryDate: deliveryDate,
        paymentTerms: paymentTerms,
        urgencyLevel: urgencyLevel,
        qualityRequirements: qualityRequirements,
        clientFeedback: clientFeedback,
        specialInstructions: specialInstructions,
        tentativeCost: tentativeCost, // Save tentative cost for reference
        brandFinalCost: project.clientFinalCost, // Save brand final cost
      };

      await api.patch(`/projects/${project._id}/po`, poData);

      if (poNumber.trim()) {
        toast.success("PO approved successfully!");
        goTo("rd-management", "po-target-date", { tab: "po-approved" });
      } else {
        toast.success("PO saved — waiting for PO number (Pending)");
        goTo("rd-management", "po-target-date", { tab: "po-pending" });
      }

      onConfirm();
      onOpenChange(false);

      // Reset form
      setOrderQuantity("");
      setUnitPrice("");
      setPONumber("");
      setClientFeedback("");
      setDeliveryDate("");
      setPaymentTerms("");
      setSpecialInstructions("");
      setUrgencyLevel("Normal");
      setQualityRequirements("");
    } catch (error) {
      console.error("Error updating PO:", error);
      toast.error("Failed to update PO details");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Display difference between costs
  const getCostDifference = () => {
    if (!tentativeCost || !project.clientFinalCost) return null;
    const difference = project.clientFinalCost - tentativeCost;
    const percentage = (difference / tentativeCost) * 100;
    return { difference, percentage };
  };

  const costDifference = getCostDifference();

  if (!project) return null;

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
        {/* Header */}
        <div className="sticky top-0 z-50 px-4 md:px-8 py-4 md:py-6 bg-linear-to-r from-emerald-50 via-white to-emerald-50 border-b border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <ShoppingCart className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-1 md:mb-2 truncate">
                  PO Target & Order Confirmation
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                  <span className="text-sm md:text-lg text-gray-600 truncate">
                    {project.autoCode}
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-xs md:text-sm px-2 md:px-3 py-1">
                    Green Seal → PO Target
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Button
                onClick={handleSubmit}
                className="bg-emerald-500 hover:bg-emerald-600 text-xs md:text-sm"
                size={isMobile ? "sm" : "default"}
                disabled={loadingCost}
              >
                <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                {poNumber.trim()
                  ? isMobile
                    ? "Approve PO"
                    : "Approve & Issue PO"
                  : isMobile
                  ? "Advance"
                  : "Advance PO Target"}
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 md:h-10 md:w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center"
              >
                <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500 hover:text-gray-700" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-4 md:px-8 py-4 md:py-8 space-y-6 md:space-y-8">
            {/* Project Summary */}
            <div className="space-y-4 md:space-y-5">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                  <Package className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  Project Summary
                </h3>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                  {/* Product Code */}
                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-600">
                      Product Code
                    </Label>
                    <div className="mt-1 text-sm md:text-base font-mono font-bold text-gray-900">
                      {project.autoCode}
                    </div>
                  </div>

                  {/* Tentative Cost */}
                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-600 flex items-center gap-1">
                      Tentative Cost
                      {loadingCost && (
                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                      )}
                    </Label>
                    <div className="mt-1 flex items-center space-x-1 text-sm md:text-base font-semibold text-green-700">
                      <IndianRupee className="w-3 h-3 md:w-4 md:h-4" />
                      <span>
                        {loadingCost ? (
                          <span className="text-gray-400">Calculating...</span>
                        ) : (
                          (tentativeCost || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Calculated from cost breakdown
                    </div>
                  </div>

                  {/* Brand Final Cost */}
                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-600">
                      Brand Final Cost
                    </Label>
                    <div className="mt-1 flex items-center space-x-1 text-sm md:text-base font-semibold text-blue-700">
                      <IndianRupee className="w-3 h-3 md:w-4 md:h-4" />
                      <span>
                        {(project.clientFinalCost || 0).toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Approved by client
                    </div>
                  </div>

                  {/* Cost Difference */}
                  {tentativeCost &&
                    project.clientFinalCost &&
                    costDifference && (
                      <div>
                        <Label className="text-xs md:text-sm font-medium text-gray-600">
                          Price Difference
                        </Label>
                        <div className="mt-1 flex items-center space-x-1 text-sm md:text-base font-semibold">
                          <IndianRupee className="w-3 h-3 md:w-4 md:h-4" />
                          <span
                            className={
                              costDifference.difference >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {costDifference.difference >= 0 ? "+" : ""}
                            {costDifference.difference.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div
                          className={`text-xs mt-0.5 ${
                            costDifference.percentage >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {costDifference.percentage >= 0 ? "+" : ""}
                          {costDifference.percentage.toFixed(1)}%
                          {costDifference.difference >= 0
                            ? " above tentative"
                            : " below tentative"}
                        </div>
                      </div>
                    )}
                </div>

                {/* Cost Comparison Card */}
                {tentativeCost && project.clientFinalCost && (
                  <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Cost Comparison
                      </span>
                      <Calculator className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 bg-green-50 rounded">
                        <div className="text-xs text-gray-600">Tentative</div>
                        <div className="font-semibold text-green-700">
                          ₹{tentativeCost.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-2 bg-blue-50 rounded">
                        <div className="text-xs text-gray-600">Final</div>
                        <div className="font-semibold text-blue-700">
                          ₹{project.clientFinalCost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-4 md:space-y-5">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                  <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  Order Details
                </h3>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Order Quantity */}
                  <div>
                    <Label
                      htmlFor="orderQuantity"
                      className="text-xs md:text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Order Quantity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="orderQuantity"
                      type="number"
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(e.target.value)}
                      placeholder="Enter quantity (e.g. 1000)"
                      className="w-full h-8 md:h-10 text-xs md:text-sm"
                      min="1"
                    />
                  </div>

                  {/* PO Number */}
                  <div>
                    <Label
                      htmlFor="poNumber"
                      className="text-xs md:text-sm font-medium text-gray-700 mb-2 block"
                    >
                      PO Order Number
                    </Label>
                    <Input
                      id="poNumber"
                      type="text"
                      value={poNumber}
                      onChange={(e) => setPONumber(e.target.value)}
                      placeholder="Enter client PO number (e.g. PO-2024-001)"
                      className="w-full h-8 md:h-10 text-xs md:text-sm"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      {poNumber.trim() ? (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          <span className="hidden md:inline">
                            PO Number will be marked as Approved
                          </span>
                          <span className="md:hidden">PO Number provided</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="hidden md:inline">
                            Status will be Pending until PO number is provided
                          </span>
                          <span className="md:hidden">Awaiting PO number</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unit Price */}
                  <div>
                    <Label
                      htmlFor="unitPrice"
                      className="text-xs md:text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Brand Final Cost
                    </Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder={`Brand Final: ₹${(
                        project.clientFinalCost || 0
                      ).toLocaleString("en-IN")}`}
                      className="w-full h-8 md:h-10 text-xs md:text-sm"
                      step="0.01"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        Leave empty to use brand final cost
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 text-xs"
                        onClick={() =>
                          setUnitPrice(
                            project.clientFinalCost?.toString() || ""
                          )
                        }
                      >
                        Use Brand Final
                      </Button>
                    </div>
                  </div>

                  {/* Delivery Date */}
                  <div>
                    <Label
                      htmlFor="deliveryDate"
                      className="text-xs md:text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Expected Delivery Date{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full h-8 md:h-10 text-xs md:text-sm"
                    />
                  </div>

                  {/* Payment Terms */}
                  <div>
                    <Label
                      htmlFor="paymentTerms"
                      className="text-xs md:text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Payment Terms
                    </Label>
                    <Select
                      value={paymentTerms}
                      onValueChange={setPaymentTerms}
                    >
                      <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="30-days"
                          className="text-xs md:text-sm"
                        >
                          30 Days Net
                        </SelectItem>
                        <SelectItem
                          value="45-days"
                          className="text-xs md:text-sm"
                        >
                          45 Days Net
                        </SelectItem>
                        <SelectItem
                          value="60-days"
                          className="text-xs md:text-sm"
                        >
                          60 Days Net
                        </SelectItem>
                        <SelectItem
                          value="advance-50"
                          className="text-xs md:text-sm"
                        >
                          50% Advance
                        </SelectItem>
                        <SelectItem
                          value="advance-100"
                          className="text-xs md:text-sm"
                        >
                          100% Advance
                        </SelectItem>
                        <SelectItem value="cod" className="text-xs md:text-sm">
                          Cash on Delivery
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Urgency Level */}
                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-700 mb-2 block">
                      Order Urgency Level
                    </Label>
                    <Select
                      value={urgencyLevel}
                      onValueChange={setUrgencyLevel}
                    >
                      <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low" className="text-xs md:text-sm">
                          Low Priority
                        </SelectItem>
                        <SelectItem
                          value="Normal"
                          className="text-xs md:text-sm"
                        >
                          Normal Priority
                        </SelectItem>
                        <SelectItem value="High" className="text-xs md:text-sm">
                          High Priority
                        </SelectItem>
                        <SelectItem
                          value="Urgent"
                          className="text-xs md:text-sm"
                        >
                          Urgent
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Total Amount Display */}
                {orderQuantity && (
                  <div className="mt-4 md:mt-6 p-3 md:p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm md:text-lg font-medium text-emerald-700">
                        Total Order Amount:
                      </span>
                      <div className="flex items-center space-x-1 text-lg md:text-2xl font-bold text-emerald-600">
                        <IndianRupee className="w-4 h-4 md:w-5 md:h-5" />
                        <span>
                          {calculateTotalAmount().toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs md:text-sm text-emerald-600 mt-1">
                      {orderQuantity} units × ₹
                      {(
                        parseFloat(unitPrice) ||
                        project.clientFinalCost ||
                        0
                      ).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      per unit
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Client Feedback & Requirements */}
            <div className="space-y-4 md:space-y-5">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                  <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  Client Feedback & Requirements
                </h3>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6">
                <div className="space-y-4 md:space-y-6">
                  {/* Client Feedback */}
                  <div>
                    <Label
                      htmlFor="clientFeedback"
                      className="text-xs md:text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Client Feedback & Comments{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="clientFeedback"
                      value={clientFeedback}
                      onChange={(e) => setClientFeedback(e.target.value)}
                      placeholder="Enter detailed client feedback on Green Seal approval and order confirmation..."
                      className="min-h-[80px] md:min-h-[120px] resize-none text-xs md:text-sm"
                    />
                  </div>

                  {/* Quality Requirements */}
                  <div>
                    <Label
                      htmlFor="qualityRequirements"
                      className="text-xs md:text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Special Quality Requirements
                    </Label>
                    <Textarea
                      id="qualityRequirements"
                      value={qualityRequirements}
                      onChange={(e) => setQualityRequirements(e.target.value)}
                      placeholder="Any specific quality standards, certifications, or inspection requirements..."
                      className="min-h-[60px] md:min-h-[100px] resize-none text-xs md:text-sm"
                    />
                  </div>

                  {/* Special Instructions */}
                  <div>
                    <Label
                      htmlFor="specialInstructions"
                      className="text-xs md:text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Special Production Instructions
                    </Label>
                    <Textarea
                      id="specialInstructions"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Any special instructions for production, packaging, or delivery..."
                      className="min-h-[60px] md:min-h-[100px] resize-none text-xs md:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
