import React, { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  IndianRupee,
  Package,
  ChevronLeft,
  ChevronRight,
  Settings,
  FileText,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { AddItemDialog } from "./AddProductDialog";
import { UpdateStockDialog } from "./UpdateStockDialog";
import { ItemHistoryDialog } from "./ItemHistoryDialog";
import { useERPStore } from "../lib/data-store";
import svgPaths from "../imports/svg-gixm2ll7zv";

interface InventoryProps {
  searchTerm?: string;
}

export function Inventory({ searchTerm = "" }: InventoryProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showUpdateStockDialog, setShowUpdateStockDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("items");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItemForStock, setSelectedItemForStock] = useState<any>(null);
  const [selectedItemForHistory, setSelectedItemForHistory] =
    useState<any>(null);

  // Get data from store
  const { inventoryItems, vendors } = useERPStore();

  // Separate items and drafts
  const items = inventoryItems.filter((item) => !item.isDraft);
  const drafts = inventoryItems.filter((item) => item.isDraft);

  // Use appropriate data based on current tab
  const currentData = currentTab === "items" ? items : drafts;

  // Handle edit item
  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setIsEditMode(true);
    setShowAddDialog(true);
  };

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingItem(null);
      setIsEditMode(false);
    }
    setShowAddDialog(open);
  };

  // Filter data based on active category and search query
  const filteredData = currentData.filter((item) => {
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;

    // Get vendor name for search
    const vendor = vendors.find((v) => v.id === item.vendorId);
    const vendorName = vendor?.vendorName || "";

    const matchesSearch =
      searchQuery === "" ||
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.brand || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.color || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendorName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Calculate category counts based on current tab
  const getCategoryCount = (categoryName: string) => {
    if (categoryName === "All") return currentData.length;
    return currentData.filter((item) => item.category === categoryName).length;
  };

  const categories = [
    { name: "All", count: getCategoryCount("All") },
    { name: "Raw Materials", count: getCategoryCount("Raw Materials") },
    {
      name: "Components & Parts",
      count: getCategoryCount("Components & Parts"),
    },
    { name: "Finished Footwear", count: getCategoryCount("Finished Footwear") },
    {
      name: "Accessories & Hardware",
      count: getCategoryCount("Accessories & Hardware"),
    },
  ];

  const getIconColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      amber: "bg-amber-100 text-amber-600",
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-purple-100 text-purple-600",
      orange: "bg-orange-100 text-orange-600",
      red: "bg-red-100 text-red-600",
      indigo: "bg-indigo-100 text-indigo-600",
    };
    return colorMap[color] || "bg-gray-100 text-gray-600";
  };

  // Helper function to get vendor name
  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    return vendor?.vendorName || "No Vendor";
  };

  return (
    <div className="w-full">
      {/* Inventory Navigation Bar */}
      <div className="flex flex-col gap-6 p-6 pb-4">
        {/* Top Navigation with Tabs and Actions */}
        <div className="flex items-center justify-between w-full border-b border-gray-200 pb-2">
          {/* Left: Tabs */}
          <Tabs
            defaultValue="items"
            className="flex-1"
            onValueChange={(value) => {
              setCurrentTab(value);
            }}
          >
            <TabsList className="inline-flex h-9 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground">
              <TabsTrigger
                value="items"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow gap-1.5"
              >
                <Package className="w-3.5 h-3.5 text-[#0c9dcb]" />
                Items
                <Badge
                  variant="secondary"
                  className="ml-1 h-4 px-1.5 text-xs font-medium"
                >
                  {items.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="drafts"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-gray-600" />
                Drafts
                <Badge
                  variant="secondary"
                  className="ml-1 h-4 px-1.5 text-xs font-medium"
                >
                  {drafts.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative w-80">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="pl-10 pr-4 h-9"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>

            {/* Total Item */}
            <div className="px-3 py-2 border border-[#0c9dcb] rounded-lg">
              <span className="text-[#0c9dcb] font-semibold text-sm">
                Total Item : {filteredData.length.toString().padStart(2, "0")}
              </span>
            </div>
            {/* Add New Item */}
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-[#0c9dcb] hover:bg-[#26b4e0] px-3 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4 mr-2 text-white" />
              <span className="text-white font-semibold text-sm">
                Add New Item
              </span>
            </Button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 py-2">
          {categories.map((category) => (
            <div
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              className={`px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                activeCategory === category.name
                  ? "border-2 border-[#0c9dcb] bg-blue-50"
                  : "border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span
                className={`font-semibold text-xs ${
                  activeCategory === category.name
                    ? "text-[#0c9dcb]"
                    : "text-gray-500"
                }`}
              >
                {category.name} ({category.count})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="mx-6 mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand & Color
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Update
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Qty
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  key={item.id}
                  onClick={() => {
                    setSelectedItemForHistory(item);
                    setShowHistoryDialog(true);
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="shrink-0 h-10 w-10">
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center ${getIconColorClasses(
                            item.iconColor
                          )}`}
                        >
                          <Package className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.itemName}
                        </div>
                        <div className="text-sm text-gray-500">{item.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.category}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.subCategory}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.brand || "No Brand"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.color || "No Color"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getVendorName(item.vendorId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{item.lastUpdate}</div>
                    <div className="text-gray-500">{item.lastUpdateTime}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.quantity} {item.quantityUnit}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.isDraft ? "Draft" : "Available"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {item.isDraft ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-200 text-green-600 hover:bg-green-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditItem(item);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit Item
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItemForStock(item);
                          setShowUpdateStockDialog(true);
                        }}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Update Stock
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {filteredData.length} of {currentData.length} results
              {activeCategory !== "All" && ` (filtered by ${activeCategory})`}
              {currentTab === "drafts" && " in drafts"}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-gray-600 hover:bg-gray-100"
                disabled
              >
                Previous
              </Button>
              <div className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-medium">
                1
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-gray-600 hover:bg-gray-100"
                disabled
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Dialog */}
      <AddItemDialog
        open={showAddDialog}
        onOpenChange={handleDialogClose}
        editingItem={editingItem}
        isEditMode={isEditMode}
      />

      {/* Update Stock Dialog */}
      <UpdateStockDialog
        open={showUpdateStockDialog}
        onOpenChange={() => setShowUpdateStockDialog(false)}
        selectedItem={selectedItemForStock}
      />

      {/* Item History Dialog */}
      <ItemHistoryDialog
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
        item={selectedItemForHistory}
      />
    </div>
  );
}
