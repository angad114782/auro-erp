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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface NewItem {
  itemName: string;
  category: string;
  brand: string;
  color: string;
  vendorId: string;
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
  vendors?: any[];
}

const DEFAULT_ITEM: NewItem = {
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
};

function generateItemCode() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ITM-${currentYear}-${month}${day}-${randomNum}`;
}

/* ---------- Small reusable UI pieces ---------- */

function FieldWrapper({
  label,
  required,
  children,
  id,
  className = "",
}: {
  label: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label
        htmlFor={id}
        className="text-sm md:text-base font-semibold text-gray-700"
      >
        {label} {required ? <span className="text-red-500">*</span> : null}
      </Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/* File input as a small component to avoid repetition */
function FileInputButton({
  inputId,
  file,
  onFileChange,
  accept,
  placeholder,
}: {
  inputId: string;
  file?: File | null;
  onFileChange: (f: File | null) => void;
  accept?: string;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        id={inputId}
        type="file"
        accept={accept || ".pdf,.jpg,.jpeg,.png,.doc,.docx"}
        onChange={(e) => {
          const f = e.target.files?.[0] || null;
          onFileChange(f);
          if (f) toast.success(`File "${f.name}" attached`);
        }}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => document.getElementById(inputId)?.click()}
        className="w-full h-12 border-2 border-gray-300 hover:border-[#0c9dcb] hover:bg-blue-50 transition-all text-base justify-start"
      >
        <Paperclip className="w-4 h-4 mr-2 text-gray-500" />
        <span className="flex-1 text-left truncate">
          {file ? file.name : placeholder || "Choose file (PDF, Image, Doc)"}
        </span>
        {file && (
          <X
            className="w-4 h-4 ml-2 text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onFileChange(null);
              const fileInput = document.getElementById(
                inputId
              ) as HTMLInputElement;
              if (fileInput) fileInput.value = "";
              toast.success("File removed");
            }}
          />
        )}
      </Button>
    </div>
  );
}

/* ------------------- Main Component ------------------- */

export function AddItemDialog({
  open,
  onOpenChange,
  editingItem,
  isEditMode = false,
  createItem,
  updateItem,
  vendors = [],
}: Props) {
  const [newItem, setNewItem] = React.useState<NewItem>(DEFAULT_ITEM);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
        setNewItem({ ...DEFAULT_ITEM });
      }
    }
  }, [open, isEditMode, editingItem]);

  const handleSubmit = async (draft = false) => {
    if (!newItem.itemName || !newItem.category) {
      toast.error("Please fill required fields");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("itemName", newItem.itemName);
    formData.append("category", newItem.category);
    formData.append("subCategory", "General");
    formData.append("brand", newItem.brand || "N/A");
    formData.append("color", newItem.color || "N/A");
    formData.append("vendorId", newItem.vendorId || "");
    formData.append("expiryDate", newItem.expiryDate || "");
    formData.append(
      "quantity",
      (parseInt(newItem.quantity || "0", 10) || 0).toString()
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

      // Reset and close
      setNewItem({ ...DEFAULT_ITEM });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Save failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* small helper for updating nested fields */
  const updateField = <K extends keyof NewItem>(key: K, value: NewItem[K]) =>
    setNewItem((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onOpenChange(false);
      }}
    >
      <DialogContent
        className="
          !w-[98vw] md:!w-[90vw] xl:!w-[96vw]
          !max-w-[98vw] md:!max-w-[90vw] xl:!max-w-[96vw]
          max-h-[95vh]
          overflow-hidden p-0 m-0
          top-[2.5vh] translate-y-0
          flex flex-col
        "
      >
        {/* ---------- HEADER ---------- */}
        <div
          className="
            sticky top-0 z-50 
            px-4 py-4 md:px-8 md:py-6 xl:px-12 xl:py-8 
            bg-white border-b shadow-sm
          "
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-linear-to-br from-[#0c9dcb] to-[#26b4e0] rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>

              <div>
                <DialogTitle className="text-xl md:text-3xl xl:text-4xl font-semibold text-gray-900">
                  {isEditMode ? "Edit Item" : "Add New Item"}
                </DialogTitle>
                <DialogDescription className="text-sm md:text-lg text-gray-600">
                  {isEditMode
                    ? "Update item details and inventory information"
                    : "Add items to your inventory with comprehensive details and pricing"}
                </DialogDescription>
              </div>
            </div>

            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </Button>
          </div>
        </div>

        {/* ---------- BODY SCROLL AREA ---------- */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-4 py-6 md:px-8 md:py-8 xl:px-12 xl:py-10">
            {/* ------------- SECTION 1: ITEM INFO ------------- */}
            <div className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                  <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-900">
                  Item Information
                </h3>
                <div className="flex-1 h-px bg-gray-300 hidden md:block"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-6 md:gap-8">
                <div className="xl:col-span-2">
                  <FieldWrapper label="Item Name" required id="itemName">
                    <Input
                      id="itemName"
                      value={newItem.itemName}
                      onChange={(e) => updateField("itemName", e.target.value)}
                      placeholder="e.g., Premium Leather Running Shoes"
                      className="h-12 text-base border-2 focus:border-[#0c9dcb]"
                    />
                  </FieldWrapper>
                </div>

                <div className="xl:col-span-2">
                  <FieldWrapper label="Item Code" id="itemCode">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg h-12">
                      <span className="text-base font-mono font-bold text-gray-900 truncate">
                        {isEditMode && editingItem
                          ? editingItem.code
                          : generateItemCode()}
                      </span>
                    </div>
                  </FieldWrapper>
                </div>

                <div className="xl:col-span-2">
                  <FieldWrapper label="Category" required id="category">
                    <Input
                      id="category"
                      value={newItem.category}
                      onChange={(e) => updateField("category", e.target.value)}
                      placeholder="e.g., Raw Materials"
                      className="h-12 text-base border-2 focus:border-[#0c9dcb]"
                    />
                  </FieldWrapper>
                </div>

                <div className="xl:col-span-2">
                  <FieldWrapper label="Brand" id="brand">
                    <Input
                      id="brand"
                      value={newItem.brand}
                      onChange={(e) => updateField("brand", e.target.value)}
                      placeholder="e.g., Nike"
                      className="h-12 text-base border-2 focus:border-[#0c9dcb]"
                    />
                  </FieldWrapper>
                </div>

                <div className="xl:col-span-2">
                  <FieldWrapper label="Color" id="color">
                    <Input
                      id="color"
                      value={newItem.color}
                      onChange={(e) => updateField("color", e.target.value)}
                      placeholder="e.g., Black"
                      className="h-12 text-base border-2 focus:border-[#0c9dcb]"
                    />
                  </FieldWrapper>
                </div>

                <div className="xl:col-span-2">
                  <FieldWrapper label="Vendor / Supplier" id="vendor">
                    <Select
                      value={newItem.vendorId}
                      onValueChange={(value) => updateField("vendorId", value)}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select a vendor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor._id} value={vendor._id}>
                            {vendor.vendorName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldWrapper>
                </div>

                <div className="xl:col-span-2">
                  <FieldWrapper label="Expiry Date" id="expiryDate">
                    <Input
                      id="expiryDate"
                      type="date"
                      value={newItem.expiryDate}
                      onChange={(e) =>
                        updateField("expiryDate", e.target.value)
                      }
                      className="h-12 text-base border-2 focus:border-[#0c9dcb]"
                      style={{ colorScheme: "light" }}
                    />
                  </FieldWrapper>
                </div>

                <div className="xl:col-span-2">
                  <FieldWrapper
                    label="Initial Stock Quantity"
                    required
                    id="quantity"
                  >
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="quantity"
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) =>
                          updateField("quantity", e.target.value)
                        }
                        placeholder="0"
                        className="pl-10 h-12 text-base border-2 focus:border-[#0c9dcb]"
                      />
                    </div>
                  </FieldWrapper>
                </div>

                <div className="xl:col-span-2">
                  <FieldWrapper
                    label="Quantity Unit"
                    required
                    id="quantityUnit"
                  >
                    <Input
                      id="quantityUnit"
                      value={newItem.quantityUnit}
                      onChange={(e) =>
                        updateField("quantityUnit", e.target.value)
                      }
                      placeholder="piece / pair / kg / liter"
                      className="h-12 text-base border-2 focus:border-[#0c9dcb]"
                    />
                  </FieldWrapper>
                </div>

                <div className="xl:col-span-6">
                  <FieldWrapper
                    label="Item Description & Features"
                    id="description"
                  >
                    <Textarea
                      id="description"
                      value={newItem.description}
                      onChange={(e) =>
                        updateField("description", e.target.value)
                      }
                      placeholder="Describe the item..."
                      rows={4}
                      className="resize-none text-base border-2 focus:border-[#0c9dcb] leading-relaxed"
                    />
                  </FieldWrapper>
                </div>
              </div>
            </div>

            {/* ------------- SECTION 2: BILLING INFO ------------- */}
            <div className="space-y-6 md:space-y-8 mt-10">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-900">
                  Billing Information
                </h3>
                <div className="flex-1 h-px bg-gray-300 hidden md:block"></div>
                <Badge className="bg-gray-100 text-gray-600 px-3 py-1">
                  Optional
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                <div>
                  <FieldWrapper label="Bill Number" id="billNumber">
                    <div className="relative">
                      <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="billNumber"
                        value={newItem.billNumber || ""}
                        onChange={(e) =>
                          updateField("billNumber", e.target.value)
                        }
                        placeholder="e.g., INV-2024-001"
                        className="pl-10 h-12 text-base border-2 focus:border-[#0c9dcb]"
                      />
                    </div>
                  </FieldWrapper>
                </div>

                <div>
                  <FieldWrapper label="Bill Date" id="billDate">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
                      <Input
                        id="billDate"
                        type="date"
                        value={newItem.billDate || ""}
                        onChange={(e) =>
                          updateField("billDate", e.target.value)
                        }
                        className="pl-10 h-12 text-base border-2 focus:border-[#0c9dcb]"
                        style={{ colorScheme: "light" }}
                      />
                    </div>
                  </FieldWrapper>
                </div>

                <div>
                  <FieldWrapper label="Bill Attachment" id="billAttachment">
                    <FileInputButton
                      inputId="billAttachment"
                      file={newItem.billAttachment || undefined}
                      onFileChange={(f) => updateField("billAttachment", f)}
                      placeholder="Choose file (PDF, Image, Doc)"
                    />
                    {newItem.billAttachment && (
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />{" "}
                        File attached:{" "}
                        {(newItem.billAttachment.size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </FieldWrapper>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- FOOTER ---------- */}
        <div
          className="
            sticky bottom-0 bg-white 
            border-t px-4 py-4 md:px-8 md:py-6 xl:px-12 xl:py-8 
            flex flex-col md:flex-row md:items-center md:justify-between 
            gap-4 shadow-lg z-50
          "
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            <div>
              <p className="text-sm md:text-base font-semibold text-gray-900">
                {isEditMode
                  ? "Ready to Update This Item?"
                  : "Ready to Add This Item?"}
              </p>
              <p className="text-xs md:text-sm text-gray-600">
                Double-check all required fields marked with * before submission
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full md:w-auto px-6 py-3 text-base border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => handleSubmit(true)}
              type="button"
              disabled={isSubmitting}
            >
              <Package className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              {isEditMode ? "Save Changes" : "Save as Draft"}
            </Button>

            <Button
              onClick={() => handleSubmit(false)}
              size="lg"
              className="w-full md:w-auto px-6 py-3 text-base bg-[#0c9dcb] hover:bg-[#0c9dcb]/90"
              type="button"
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              {isEditMode ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
