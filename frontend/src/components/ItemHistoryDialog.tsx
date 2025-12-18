import {
  Calendar,
  Clock,
  FileText,
  History,
  Info,
  Package,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import type { InventoryItem } from "../lib/data-store";
import { useERPStore } from "../lib/data-store";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { useVendorStore } from "../hooks/useVendor";
import { useEffect, useState } from "react";
import { useInventory } from "../hooks/useInventory";

interface ItemHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
}

export function ItemHistoryDialog({
  open,
  onOpenChange,
  item,
}: ItemHistoryDialogProps) {
  const { vendors, loadVendors } = useVendorStore();
  const { getHistory } = useInventory();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(
    null
  );

  // Load vendors when component mounts or opens
  useEffect(() => {
    if (open) {
      loadVendors();
    }
  }, [open, loadVendors]);

  // Fetch transactions when item changes or dialog opens
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!item?._id) {
        setTransactions([]);
        return;
      }

      try {
        const history = await getHistory(item._id);
        // keep raw transactions, we'll resolve vendor names on render
        setTransactions(Array.isArray(history) ? history : []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
      }
    };

    if (open && item) {
      fetchTransactions();
    } else {
      setTransactions([]);
    }
  }, [item, getHistory, open]);

  if (!item) return null;

  // Get vendor name safely
  const getVendorName = (vendorId?: string | null) => {
    if (!vendorId) return "N/A";
    const vendor = vendors.find((v) => v._id === vendorId);
    return vendor?.vendorName || "N/A";
  };

  const currentVendorName = getVendorName(item.vendorId);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStockBadgeColor = (type?: string) => {
    switch (type) {
      case "Stock In":
        return "bg-green-100 text-green-800 border-green-200";
      case "Stock Out":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStockIcon = (type?: string) => {
    switch (type) {
      case "Stock In":
        return <TrendingUp className="w-4 h-4" />;
      case "Stock Out":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  // Resolve attachment src: if absolute URL, use it; if relative, prepend backend URL env var (if present)
  const resolveAttachmentSrc = (path: string) => {
    if (!path) return "";
    const isAbsolute = /^https?:\/\//i.test(path);
    if (isAbsolute) return path;
    const backend = (import.meta as any).env?.VITE_BACKEND_URL || "";
    return `${backend}${path}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[95vw] md:w-[90vw] lg:w-[85vw]
          max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw]
          max-h-[92vh]
          overflow-hidden p-0 m-0
          top-[4vh] translate-y-0 flex flex-col
        "
      >
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-50 px-4 md:px-8 py-4 md:py-6 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-start md:items-center justify-between gap-4 md:gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-2xl font-semibold text-gray-900 mb-0">
                  Item Stock History
                </DialogTitle>
                <DialogDescription className="text-sm md:text-base text-gray-600">
                  View item details and stock update history
                </DialogDescription>

                <div className="mt-2 flex items-center gap-3">
                  <span className="text-sm md:text-base text-gray-700 font-medium">
                    {item.itemName}
                  </span>
                  <Badge className="bg-blue-100 text-blue-800 text-xs md:text-sm px-2 py-0.5">
                    {item.code}
                  </Badge>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              type="button"
              className="h-9 w-9 md:h-10 md:w-10 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center border-0 bg-transparent transition-colors"
            >
              <X className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-4 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
            {/* Item Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                  <Info className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  Item Information
                </h3>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-600">
                      Item Name
                    </Label>
                    <div className="mt-1 text-sm md:text-base font-semibold text-gray-900">
                      {item.itemName}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-600">
                      Item Code
                    </Label>
                    <div className="mt-1 text-sm md:text-base font-mono font-bold text-gray-900">
                      {item.code}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-600">
                      Category
                    </Label>
                    <div className="mt-1 text-sm md:text-base text-gray-900">
                      {item.category}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-600">
                      Sub Category
                    </Label>
                    <div className="mt-1 text-sm md:text-base text-gray-900">
                      {item.subCategory || "N/A"}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-600">
                      Brand
                    </Label>
                    <div className="mt-1 text-sm md:text-base text-gray-900">
                      {item.brand || "N/A"}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-600">
                      Color
                    </Label>
                    <div className="mt-1 text-sm md:text-base text-gray-900">
                      {item.color || "N/A"}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-600">
                      Current Stock
                    </Label>
                    <div className="mt-1 text-sm md:text-base font-bold text-blue-600">
                      {item.quantity} {item.quantityUnit}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-600">
                      Vendor
                    </Label>
                    <div className="mt-1 text-sm md:text-base text-gray-900">
                      {item?.vendorId?.vendorName || " - "}
                    </div>
                  </div>

                  {item.expiryDate && (
                    <div className="sm:col-span-2 lg:col-span-2">
                      <Label className="text-xs md:text-sm font-medium text-gray-600">
                        Expiry Date
                      </Label>
                      <div className="mt-1 text-sm md:text-base text-gray-900">
                        {formatDate(item.expiryDate)}
                      </div>
                    </div>
                  )}

                  {item.description && (
                    <div className="sm:col-span-2 lg:col-span-4">
                      <Label className="text-xs md:text-sm font-medium text-gray-600">
                        Description
                      </Label>
                      <div className="mt-1 text-sm md:text-base text-gray-700 leading-relaxed">
                        {item.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stock Update History Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <History className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  Stock Update History
                </h3>
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-700 text-xs md:text-sm px-2 py-0.5"
                >
                  {transactions.length}{" "}
                  {transactions.length === 1 ? "Transaction" : "Transactions"}
                </Badge>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                {/* Mobile: Card list */}
                <div className="md:hidden divide-y divide-gray-100">
                  {transactions.length > 0 ? (
                    transactions.map((transaction: any) => {
                      const key = transaction.id || transaction._id;
                      return (
                        <div key={key} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex items-center gap-2 px-2 py-0.5 text-xs font-semibold rounded ${getStockBadgeColor(
                                    transaction.transactionType
                                  )}`}
                                >
                                  {getStockIcon(transaction.transactionType)}
                                  <span>{transaction.transactionType}</span>
                                </div>
                              </div>

                              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-700">
                                <div>
                                  <div className="text-xs text-gray-500">
                                    Date
                                  </div>
                                  <div className="text-sm text-gray-900">
                                    {formatDate(transaction.transactionDate)}
                                  </div>
                                  <div className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(transaction.transactionDate)}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-xs text-gray-500">
                                    Quantity
                                  </div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    {(transaction.transactionType === "Stock In"
                                      ? "+"
                                      : transaction.transactionType ===
                                        "Stock Out"
                                      ? "-"
                                      : "±") + transaction.quantity}{" "}
                                    {item.quantityUnit}
                                  </div>

                                  <div className="text-xs text-gray-500 mt-2">
                                    Balance
                                  </div>
                                  <div className="text-sm text-gray-900">
                                    {transaction.newStock} {item.quantityUnit}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-xs text-gray-500">
                                    Bill
                                  </div>
                                  <div className="text-sm text-gray-900">
                                    {transaction.billNumber || "-"}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-xs text-gray-500">
                                    Vendor
                                  </div>
                                  <div className="text-sm text-gray-900">
                                    {getVendorName(transaction.vendorId)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              {transaction.billNumber &&
                              (transaction.billAttachmentUrl ||
                                transaction.attachment) ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                  onClick={() => {
                                    setSelectedAttachment(
                                      transaction.billAttachmentUrl ||
                                        transaction.attachment
                                    );
                                    setAttachmentDialogOpen(true);
                                  }}
                                >
                                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                                  View
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-6 py-12 text-center">
                      <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-base font-medium text-gray-700">
                        No stock history available
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Stock updates will appear here once recorded
                      </p>
                    </div>
                  )}
                </div>

                {/* Desktop / Tablet: Table view */}
                <div className="hidden md:block overflow-x-auto">
                  {transactions.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Balance After
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bill Number
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vendor
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Attachment
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction: any) => {
                          const key = transaction.id || transaction._id;
                          return (
                            <tr
                              key={key}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap align-top">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {formatDate(transaction.transactionDate)}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatTime(transaction.transactionDate)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap align-top">
                                <div
                                  className={`flex items-center gap-1 w-fit ${getStockBadgeColor(
                                    transaction.transactionType
                                  )}`}
                                >
                                  {getStockIcon(transaction.transactionType)}
                                  <span className="text-sm">
                                    {transaction.transactionType}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap align-top">
                                <div
                                  className={`text-sm font-bold ${
                                    transaction.transactionType === "Stock In"
                                      ? "text-green-600"
                                      : transaction.transactionType ===
                                        "Stock Out"
                                      ? "text-red-600"
                                      : "text-blue-600"
                                  }`}
                                >
                                  {(transaction.transactionType === "Stock In"
                                    ? "+"
                                    : transaction.transactionType ===
                                      "Stock Out"
                                    ? "-"
                                    : "±") + transaction.quantity}{" "}
                                  {item.quantityUnit}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap align-top">
                                <div className="text-sm font-semibold text-gray-900">
                                  {transaction.newStock} {item.quantityUnit}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap align-top">
                                {transaction.billNumber ? (
                                  <div className="text-sm font-mono text-gray-900">
                                    {transaction.billNumber}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap align-top">
                                <div className="text-sm text-gray-900">
                                  {transaction?.vendorId?.vendorName || " - "}
                                  {/* {getVendorName(transaction.vendorId)} */}
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap align-top">
                                {transaction.billAttachmentUrl ||
                                transaction.attachment ? (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedAttachment(
                                          transaction.billAttachmentUrl ||
                                            transaction.attachment
                                        );
                                        setAttachmentDialogOpen(true);
                                      }}
                                    >
                                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                                      View
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 text-xs border-green-200 text-green-600 hover:bg-green-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Download the file
                                        const url = resolveAttachmentSrc(
                                          transaction.billAttachmentUrl ||
                                            transaction.attachment
                                        );
                                        window.open(url, "_blank");
                                      }}
                                    >
                                      <Download className="w-3.5 h-3.5 mr-1.5" />
                                      Download
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">
                                    -
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="px-6 py-16 text-center">
                      <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-base font-medium text-gray-700">
                        No stock history available
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Stock updates will appear here once recorded
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Attachment View Dialog */}
      <Dialog
        open={attachmentDialogOpen}
        onOpenChange={setAttachmentDialogOpen}
      >
        <DialogContent
          className="
            w-[95vw] sm:w-[80vw] md:w-[70vw] lg:w-[60vw]
            max-w-[95vw] sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw]
            max-h-[86vh] overflow-hidden p-0 m-0 top-[6vh] translate-y-0 flex flex-col bg-white
          "
        >
          <div className="sticky top-0 z-50 px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm md:text-lg font-semibold text-gray-900">
              Bill Attachment
            </h2>
            <button
              onClick={() => setAttachmentDialogOpen(false)}
              type="button"
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full cursor-pointer flex items-center justify-center border-0 bg-transparent transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex items-center justify-center bg-gray-50 p-4 md:p-6">
            {selectedAttachment ? (
              // If it's an image, show <img>, otherwise attempt to show in iframe
              /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(selectedAttachment) ||
              /^data:image\//.test(selectedAttachment) ? (
                <img
                  src={resolveAttachmentSrc(selectedAttachment)}
                  alt="Bill Attachment"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                // For pdfs/docs, try iframe (many browsers will preview PDF)
                <iframe
                  src={resolveAttachmentSrc(selectedAttachment)}
                  title="Attachment"
                  className="w-full h-[70vh] border rounded-lg"
                />
              )
            ) : (
              <div className="text-center text-gray-500">
                <p>No attachment selected</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
