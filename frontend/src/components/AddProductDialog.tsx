// src/components/AddItemDialog.tsx
import React from "react";
import {
  Plus,
  Package,
  X,
  FileText,
  Paperclip,
  Barcode,
  Calendar,
  Tag,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

interface NewItem {
  itemName: string;
  category: string;
  brand: string;
  color: string;
  vendorId: string; // now free-text (id or name)
  expiryDate: string;
  quantity: string;
  quantityUnit: string;
  description: string;
  billNumber?: string;
  billDate?: string;
  billAttachment?: File | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: any;
  isEditMode?: boolean;
  createItem: (args: { formData: FormData }) => Promise<any>;
  updateItem: (id: string, formData: FormData) => Promise<any>;
  vendors?: any[]; // provided but we use free text
}

export function AddItemDialog({
  open,
  onOpenChange,
  editingItem,
  isEditMode = false,
  createItem,
  updateItem,
  vendors = [],
}: Props) {
  const [newItem, setNewItem] = React.useState<NewItem>({
    itemName: "",
    category: "",
    brand: "",
    color: "",
    vendorId: "",
    expiryDate: "",
    quantity: "",
    quantityUnit: "piece",
    description: "",
    billNumber: "",
    billDate: "",
    billAttachment: null,
  });

  React.useEffect(() => {
    if (open) {
      if (isEditMode && editingItem) {
        setNewItem({
          itemName: editingItem.itemName || "",
          category: editingItem.category || "",
          brand: editingItem.brand || "",
          color: editingItem.color || "",
          vendorId: editingItem.vendorId || "",
          expiryDate: editingItem.expiryDate || "",
          quantity: (editingItem.quantity || 0).toString(),
          quantityUnit: editingItem.quantityUnit || "piece",
          description: editingItem.description || "",
          billNumber: editingItem.billNumber || "",
          billDate: editingItem.billDate || "",
          billAttachment: null,
        });
      } else {
        setNewItem({
          itemName: "",
          category: "",
          brand: "",
          color: "",
          vendorId: "",
          expiryDate: "",
          quantity: "",
          quantityUnit: "piece",
          description: "",
          billNumber: "",
          billDate: "",
          billAttachment: null,
        });
      }
    }
  }, [open, isEditMode, editingItem]);

  const generateItemCode = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `ITM-${currentYear}-${month}${day}-${randomNum}`;
  };

  const handleSubmit = async (draft = false) => {
    if (!newItem.itemName || !newItem.category) {
      toast.error("Please fill required fields");
      return;
    }

    // Build FormData for file upload
    const formData = new FormData();
    formData.append("itemName", newItem.itemName);
    formData.append("category", newItem.category);
    formData.append("subCategory", "General");
    formData.append("brand", newItem.brand || "N/A");
    formData.append("color", newItem.color || "N/A");
    formData.append("vendorId", newItem.vendorId || "N/A");
    formData.append("expiryDate", newItem.expiryDate || "");
    formData.append(
      "quantity",
      (parseInt(newItem.quantity || "0") || 0).toString()
    );
    formData.append("quantityUnit", newItem.quantityUnit || "piece");
    formData.append("description", newItem.description || "");
    formData.append("billNumber", newItem.billNumber || "");
    formData.append("billDate", newItem.billDate || "");
    formData.append("isDraft", draft ? "true" : "false");
    formData.append(
      "code",
      isEditMode && editingItem ? editingItem.code : generateItemCode()
    );

    if (newItem.billAttachment) {
      formData.append("billAttachment", newItem.billAttachment);
    }

    try {
      if (isEditMode && editingItem) {
        await updateItem(editingItem._id, formData);
        toast.success("Item updated successfully!");
      } else {
        await createItem({ formData });
        toast.success(
          draft ? "Item saved as draft!" : "Item added successfully!"
        );
      }
      // reset & close
      setNewItem({
        itemName: "",
        category: "",
        brand: "",
        color: "",
        vendorId: "",
        expiryDate: "",
        quantity: "",
        quantityUnit: "piece",
        description: "",
        billNumber: "",
        billDate: "",
        billAttachment: null,
      });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Save failed");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onOpenChange(false);
      }}
    >
      <DialogContent className="!max-w-[96vw] !w-[96vw] max-h-[95vh] overflow-hidden p-0 m-0 top-[2.5vh] translate-y-0 flex flex-col">
        <div className="sticky top-0 z-50 px-12 py-8 bg-linear-to-r from-gray-50 via-white to-gray-50 border-b-2 border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-linear-to-br from-[#0c9dcb] to-[#26b4e0] rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <DialogTitle className="text-4xl font-semibold text-gray-900 mb-2">
                  {isEditMode ? "Edit Item" : "Add New Item"}
                </DialogTitle>
                <DialogDescription className="text-xl text-gray-600">
                  {isEditMode
                    ? "Update item details and inventory information"
                    : "Add items to your inventory with comprehensive details and pricing"}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Button
                onClick={() => onOpenChange(false)}
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

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-12 py-10">
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Item Information
                </h3>
                <div className="flex-1 h-px bg-linear-to-r from-gray-200 via-gray-400 to-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-6 gap-8">
                <div className="xl:col-span-2 space-y-4">
                  <Label
                    htmlFor="itemName"
                    className="text-base font-semibold text-gray-700"
                  >
                    Item Name *
                  </Label>
                  <Input
                    id="itemName"
                    value={newItem.itemName}
                    onChange={(e) =>
                      setNewItem({ ...newItem, itemName: e.target.value })
                    }
                    placeholder="e.g., Premium Leather Running Shoes"
                    className="h-12 text-base border-2 focus:border-[#0c9dcb]"
                  />
                </div>

                <div className="xl:col-span-2 space-y-4">
                  <Label className="text-base font-semibold text-gray-700">
                    Item Code
                  </Label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg h-12">
                    <span className="text-base font-mono font-bold text-gray-900">
                      {isEditMode && editingItem
                        ? editingItem.code
                        : generateItemCode()}
                    </span>
                  </div>
                </div>

                {/* CATEGORY as text input (requested) */}
                <div className="xl:col-span-2 space-y-4">
                  <Label
                    htmlFor="category"
                    className="text-base font-semibold text-gray-700"
                  >
                    Category *
                  </Label>
                  <Input
                    id="category"
                    value={newItem.category}
                    onChange={(e) =>
                      setNewItem({ ...newItem, category: e.target.value })
                    }
                    placeholder="e.g., Raw Materials"
                    className="h-12 text-base border-2 focus:border-[#0c9dcb]"
                  />
                </div>

                <div className="xl:col-span-2 space-y-4">
                  <Label
                    htmlFor="brand"
                    className="text-base font-semibold text-gray-700"
                  >
                    Brand
                  </Label>
                  <Input
                    id="brand"
                    value={newItem.brand}
                    onChange={(e) =>
                      setNewItem({ ...newItem, brand: e.target.value })
                    }
                    placeholder="e.g., Nike"
                    className="h-12 text-base border-2 focus:border-[#0c9dcb]"
                  />
                </div>

                <div className="xl:col-span-2 space-y-4">
                  <Label
                    htmlFor="color"
                    className="text-base font-semibold text-gray-700"
                  >
                    Color
                  </Label>
                  <Input
                    id="color"
                    value={newItem.color}
                    onChange={(e) =>
                      setNewItem({ ...newItem, color: e.target.value })
                    }
                    placeholder="e.g., Black"
                    className="h-12 text-base border-2 focus:border-[#0c9dcb]"
                  />
                </div>

                {/* VENDOR as text input (requested) */}
                <div className="xl:col-span-2 space-y-4">
                  <Label
                    htmlFor="vendorId"
                    className="text-base font-semibold text-gray-700"
                  >
                    Vendor / Supplier
                  </Label>
                  <Input
                    id="vendorId"
                    value={newItem.vendorId}
                    onChange={(e) =>
                      setNewItem({ ...newItem, vendorId: e.target.value })
                    }
                    placeholder="Vendor id or name (free text)"
                    className="h-12 text-base border-2 focus:border-[#0c9dcb]"
                  />
                </div>

                <div className="xl:col-span-2 space-y-4">
                  <Label
                    htmlFor="expiryDate"
                    className="text-base font-semibold text-gray-700"
                  >
                    Expiry Date
                  </Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={newItem.expiryDate}
                    onChange={(e) =>
                      setNewItem({ ...newItem, expiryDate: e.target.value })
                    }
                    className="h-12 text-base border-2 focus:border-[#0c9dcb]"
                    style={{ colorScheme: "light" }}
                  />
                </div>

                {/* QUANTITY & QUANTITY UNIT (unit as input, requested) */}
                <div className="xl:col-span-2 space-y-4">
                  <Label
                    htmlFor="quantity"
                    className="text-base font-semibold text-gray-700"
                  >
                    Initial Stock Quantity *
                  </Label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="quantity"
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({ ...newItem, quantity: e.target.value })
                      }
                      placeholder="0"
                      className="pl-12 h-12 text-base border-2 focus:border-[#0c9dcb]"
                    />
                  </div>
                </div>

                <div className="xl:col-span-2 space-y-4">
                  <Label
                    htmlFor="quantityUnit"
                    className="text-base font-semibold text-gray-700"
                  >
                    Quantity Unit *
                  </Label>
                  <Input
                    id="quantityUnit"
                    value={newItem.quantityUnit}
                    onChange={(e) =>
                      setNewItem({ ...newItem, quantityUnit: e.target.value })
                    }
                    placeholder="piece / pair / kg / liter"
                    className="h-12 text-base border-2 focus:border-[#0c9dcb]"
                  />
                </div>

                <div className="xl:col-span-6 space-y-4">
                  <Label
                    htmlFor="description"
                    className="text-base font-semibold text-gray-700"
                  >
                    Item Description & Features
                  </Label>
                  <Textarea
                    id="description"
                    value={newItem.description}
                    onChange={(e) =>
                      setNewItem({ ...newItem, description: e.target.value })
                    }
                    placeholder="Describe the item..."
                    rows={4}
                    className="resize-none text-base border-2 focus:border-[#0c9dcb] leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Billing Info */}
            <div className="space-y-8 mt-10">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Billing Information
                </h3>
                <div className="flex-1 h-px bg-linear-to-r from-gray-200 via-gray-400 to-gray-200"></div>
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-600 px-3 py-1"
                >
                  Optional
                </Badge>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <Label
                    htmlFor="billNumber"
                    className="text-base font-semibold text-gray-700"
                  >
                    Bill Number
                  </Label>
                  <div className="relative">
                    <Barcode className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="billNumber"
                      value={newItem.billNumber || ""}
                      onChange={(e) =>
                        setNewItem({ ...newItem, billNumber: e.target.value })
                      }
                      placeholder="e.g., INV-2024-001"
                      className="pl-12 h-12 text-base border-2 focus:border-[#0c9dcb]"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label
                    htmlFor="billDate"
                    className="text-base font-semibold text-gray-700"
                  >
                    Bill Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                    <Input
                      id="billDate"
                      type="date"
                      value={newItem.billDate || ""}
                      onChange={(e) =>
                        setNewItem({ ...newItem, billDate: e.target.value })
                      }
                      className="pl-12 h-12 text-base border-2 focus:border-[#0c9dcb]"
                      style={{ colorScheme: "light" }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label
                    htmlFor="billAttachment"
                    className="text-base font-semibold text-gray-700"
                  >
                    Bill Attachment
                  </Label>
                  <div className="relative">
                    <input
                      id="billAttachment"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setNewItem({ ...newItem, billAttachment: file });
                        if (file) toast.success(`File "${file.name}" attached`);
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("billAttachment")?.click()
                      }
                      className="w-full h-12 border-2 border-gray-300 hover:border-[#0c9dcb] hover:bg-blue-50 transition-all text-base"
                    >
                      <Paperclip className="w-5 h-5 mr-2 text-gray-500" />
                      <span className="flex-1 text-left truncate">
                        {newItem.billAttachment
                          ? newItem.billAttachment.name
                          : "Choose file (PDF, Image, Doc)"}
                      </span>
                      {newItem.billAttachment && (
                        <X
                          className="w-4 h-4 ml-2 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewItem({ ...newItem, billAttachment: null });
                            const fileInput = document.getElementById(
                              "billAttachment"
                            ) as HTMLInputElement;
                            if (fileInput) fileInput.value = "";
                            toast.success("File removed");
                          }}
                        />
                      )}
                    </Button>
                  </div>
                  {newItem.billAttachment && (
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> File
                      attached:{" "}
                      {(newItem.billAttachment.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 px-12 py-8 flex justify-between items-center shadow-lg z-50">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-base font-semibold text-gray-900">
                {isEditMode
                  ? "Ready to Update This Item?"
                  : "Ready to Add This Item?"}
              </p>
              <p className="text-sm text-gray-600">
                Double-check all required fields marked with * before submission
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-3 text-base border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => handleSubmit(true)}
              type="button"
            >
              <Package className="w-5 h-5 mr-3" />
              {isEditMode ? "Save Changes" : "Save as Draft"}
            </Button>
            <Button
              onClick={() => handleSubmit(false)}
              size="lg"
              className="px-8 py-3 text-base bg-[#0c9dcb] hover:bg-[#0c9dcb]/90"
              type="button"
            >
              <Plus className="w-5 h-5 mr-3" />
              {isEditMode ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
