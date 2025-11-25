import React, { useState } from "react";
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
  FileText,
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
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import api from "../lib/api";

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

  if (!project) return null;

  const calculateTotalAmount = () => {
    const qty = parseInt(orderQuantity) || 0;
    const price = parseFloat(unitPrice) || project.clientFinalCost || 0;
    return qty * price;
  };

  const handleSubmit = async () => {
    // Validation
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

    console.log(project, "dfff");

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
      };

      // Update PO details via backend API
      await api.patch(`/projects/${project._id}/po`, poData);

      if (poNumber.trim()) {
        toast.success(
          "PO Target advanced successfully! PO Number approved and project moved to PO Approved stage."
        );
      } else {
        toast.success(
          "PO Target advanced successfully! Status is pending - awaiting PO Number from client."
        );
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[85vw] !w-[85vw] max-h-[90vh] overflow-hidden p-0 m-0 top-[5vh] translate-y-0 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-50 px-8 py-6 bg-linear-to-r from-emerald-50 via-white to-emerald-50 border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-semibold text-gray-900 mb-2">
                  PO Target & Order Confirmation
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Collect client feedback and order quantity for PO generation
                </DialogDescription>
                <div className="flex items-center gap-4">
                  <span className="text-lg text-gray-600">
                    {project.autoCode}
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800">
                    Green Seal → PO Target
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSubmit}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {poNumber.trim() ? "Approve & Issue PO" : "Advance PO Target"}
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-8 py-8 space-y-8">
            {/* Project Summary */}
            <div className="space-y-5">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Project Summary
                </h3>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Product Code
                    </Label>
                    <div className="mt-1 text-base font-mono font-bold text-gray-900">
                      {project.autoCode}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Tentative Cost per Unit
                    </Label>
                    <div className="mt-1 flex items-center space-x-1 text-base font-semibold text-green-700">
                      <IndianRupee className="w-4 h-4" />
                      <span>
                        {(project.clientFinalCost || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Brand Final Cost
                    </Label>
                    <div className="mt-1 flex items-center space-x-1 text-base font-semibold text-blue-700">
                      <IndianRupee className="w-4 h-4" />
                      <span>
                        {(project.clientFinalCost || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-5">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Order Details
                </h3>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Order Quantity */}
                  <div>
                    <Label
                      htmlFor="orderQuantity"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Order Quantity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="orderQuantity"
                      type="number"
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(e.target.value)}
                      placeholder="Enter quantity (e.g. 1000)"
                      className="w-full"
                      min="1"
                    />
                  </div>

                  {/* PO Number */}
                  <div>
                    <Label
                      htmlFor="poNumber"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      PO Order Number
                    </Label>
                    <Input
                      id="poNumber"
                      type="text"
                      value={poNumber}
                      onChange={(e) => setPONumber(e.target.value)}
                      placeholder="Enter client PO number (e.g. PO-2024-001)"
                      className="w-full"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      {poNumber.trim() ? (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          <span>PO Number will be marked as Approved</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <AlertTriangle className="w-3 h-3" />
                          <span>
                            Status will be Pending until PO number is provided
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unit Price */}
                  <div>
                    <Label
                      htmlFor="unitPrice"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Reverify Brand Final Cost
                    </Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder={`Default: ₹${(
                        project.clientFinalCost || 0
                      ).toLocaleString("en-IN")}`}
                      className="w-full"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use brand final cost: ₹
                      {(project.clientFinalCost || 0).toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Delivery Date */}
                  <div>
                    <Label
                      htmlFor="deliveryDate"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Expected Delivery Date{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Payment Terms */}
                  <div>
                    <Label
                      htmlFor="paymentTerms"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Payment Terms
                    </Label>
                    <Select
                      value={paymentTerms}
                      onValueChange={setPaymentTerms}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30-days">30 Days Net</SelectItem>
                        <SelectItem value="45-days">45 Days Net</SelectItem>
                        <SelectItem value="60-days">60 Days Net</SelectItem>
                        <SelectItem value="advance-50">50% Advance</SelectItem>
                        <SelectItem value="advance-100">
                          100% Advance
                        </SelectItem>
                        <SelectItem value="cod">Cash on Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Urgency Level */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Order Urgency Level
                    </Label>
                    <Select
                      value={urgencyLevel}
                      onValueChange={setUrgencyLevel}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low Priority</SelectItem>
                        <SelectItem value="Normal">Normal Priority</SelectItem>
                        <SelectItem value="High">High Priority</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Total Amount Display */}
                {orderQuantity && (
                  <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-emerald-700">
                        Total Order Amount:
                      </span>
                      <div className="flex items-center space-x-1 text-2xl font-bold text-emerald-600">
                        <IndianRupee className="w-5 h-5" />
                        <span>
                          {calculateTotalAmount().toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-emerald-600 mt-1">
                      {orderQuantity} units × ₹
                      {(
                        parseFloat(unitPrice) ||
                        project.clientFinalCost ||
                        0
                      ).toLocaleString("en-IN")}{" "}
                      per unit
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Client Feedback & Requirements */}
            <div className="space-y-5">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Client Feedback & Requirements
                </h3>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="space-y-6">
                  {/* Client Feedback */}
                  <div>
                    <Label
                      htmlFor="clientFeedback"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Client Feedback & Comments{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="clientFeedback"
                      value={clientFeedback}
                      onChange={(e) => setClientFeedback(e.target.value)}
                      placeholder="Enter detailed client feedback on Green Seal approval and order confirmation..."
                      className="min-h-[120px] resize-none"
                    />
                  </div>

                  {/* Quality Requirements */}
                  <div>
                    <Label
                      htmlFor="qualityRequirements"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Special Quality Requirements
                    </Label>
                    <Textarea
                      id="qualityRequirements"
                      value={qualityRequirements}
                      onChange={(e) => setQualityRequirements(e.target.value)}
                      placeholder="Any specific quality standards, certifications, or inspection requirements..."
                      className="min-h-[100px] resize-none"
                    />
                  </div>

                  {/* Special Instructions */}
                  <div>
                    <Label
                      htmlFor="specialInstructions"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Special Production Instructions
                    </Label>
                    <Textarea
                      id="specialInstructions"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Any special instructions for production, packaging, or delivery..."
                      className="min-h-[100px] resize-none"
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
