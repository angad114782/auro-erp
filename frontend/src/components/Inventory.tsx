// Inventory.tsx - Updated with proper tab counts
import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/card";

import {
  Plus,
  Search,
  Edit,
  Settings,
  FileText,
  Package,
  Trash2,
  X,
  Filter,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { UpdateStockDialog } from "./UpdateStockDialog";
import { ItemHistoryDialog } from "./ItemHistoryDialog";
import { useInventory } from "../hooks/useInventory";
import { AddItemDialog } from "./AddProductDialog";
import { useVendorStore } from "../hooks/useVendor";
import { inventoryService } from "../services/inventoryService";
import { ConfirmActionDialog } from "./ConfirmActionDialog";
import Pagination from "./Pagination";

export function Inventory() {
  const {
    items,
    loading,
    pagination,
    filters,
    categoryCounts,
    tabCounts,
    loadItems,
    loadTabCounts,
    refreshTabCounts,
    handlePageChange,
    handlePageSizeChange,
    handleSearch,
    handleCategoryFilter,
    handleTabChange,
    createItem,
    updateItem,
    updateStock,
  } = useInventory();

  const { vendors, loadVendors } = useVendorStore();

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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadItems(), loadVendors()]);
    };
    loadData();
  }, []);

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      handleSearch(value);
    }, 500);

    setDebounceTimer(timer);
  };

  // Handle category filter
  const handleCategorySelect = (category: string) => {
    setActiveCategory(category);
    handleCategoryFilter(category === "All" ? "" : category);
  };

  // Handle tab change with proper logic
  const handleTabSelect = (tab: string) => {
    setCurrentTab(tab);
    setActiveCategory("All");
    setSearchQuery("");
    handleTabChange(tab);
  };

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

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setIsEditMode(true);
    setShowAddDialog(true);
  };

  // const handleDialogClose = async (open: boolean) => {
  //   if (!open) {
  //     // Refresh all data when dialog closes
  //     await Promise.all([loadItems(), loadVendors(), refreshTabCounts()]);

  //     // If we were editing a draft and saved it, switch to items tab if it's no longer a draft
  //     if (editingItem && editingItem.isDraft) {
  //       // Check if the edited item is still a draft
  //       try {
  //         const updatedItem = await inventoryService.getItemById(
  //           editingItem._id
  //         );
  //         if (!updatedItem.isDraft && currentTab === "drafts") {
  //           handleTabSelect("items");
  //         }
  //       } catch (error) {
  //         console.error("Failed to check item status:", error);
  //       }
  //     }

  //     setEditingItem(null);
  //     setIsEditMode(false);
  //   }
  //   setShowAddDialog(open);
  // };

  const handleDialogClose = async (open: boolean) => {
    if (!open) {
      // Refresh data
      await Promise.all([loadItems(), loadVendors(), refreshTabCounts()]);

      // If editing a draft, switch to items tab
      if (editingItem?.isDraft) {
        handleTabSelect("items");
      }

      setEditingItem(null);
      setIsEditMode(false);
    }
    setShowAddDialog(open);
  };
  const handleSoftDelete = async (item: any) => {
    if (!item || !item._id) return;
    try {
      await inventoryService.softDeleteItem(item._id);
      // Refresh all data
      await Promise.all([loadItems(), loadVendors(), refreshTabCounts()]);
    } catch (err) {
      console.error("Soft delete failed:", err);
      await loadItems();
    }
  };

  const handleUpdateStockClose = (open: boolean) => {
    setShowUpdateStockDialog(open);
  };

  // Clear debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <div className="w-full min-h-screen bg-gray-50 lg:bg-white">
      {/* Mobile Header - Sticky */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        {/* Top Row: Tabs and Add Button */}
        <div className="flex items-center justify-between px-3 py-2">
          <Tabs
            value={currentTab}
            className="flex-1"
            onValueChange={handleTabSelect}
          >
            <TabsList className="h-9 bg-gray-100">
              <TabsTrigger value="items" className="text-xs px-2 gap-1">
                <Package className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Items</span>
                <Badge
                  variant="secondary"
                  className="h-4 px-1 text-[10px] ml-0.5"
                >
                  {tabCounts.items}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="drafts" className="text-xs px-2 gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Drafts</span>
                <Badge
                  variant="secondary"
                  className="h-4 px-1 text-[10px] ml-0.5"
                >
                  {tabCounts.drafts}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            onClick={() => setShowAddDialog(true)}
            size="sm"
            className="ml-2 bg-[#0c9dcb] hover:bg-[#26b4e0] h-9 px-2 sm:px-3"
          >
            <Plus className="w-4 h-4" />
            <span className="ml-1 text-xs font-semibold hidden xs:inline">
              Add
            </span>
          </Button>
        </div>

        {/* Search and Filter Row */}
        <div className="px-3 pb-2 flex gap-2">
          <div className="relative flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search items..."
              className="pl-9 pr-3 h-9 text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="h-9 px-3 border-gray-300"
          >
            <Filter className="w-4 h-4" />
            {showMobileFilters && <X className="w-3 h-3 ml-1" />}
          </Button>
        </div>

        {/* Total Count */}
        <div className="px-3 pb-2">
          <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 border border-[#0c9dcb] rounded-lg">
            <span className="text-[#0c9dcb] font-semibold text-xs">
              Total: {items.length} of {pagination.totalItems}
            </span>
          </div>
        </div>

        {/* Category Filters (Collapsible on Mobile) */}
        {showMobileFilters && (
          <div className="px-3 pb-3 border-t border-gray-100 pt-2 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">
                Filter by Category
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileFilters(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryCounts.map((category) => (
                <button
                  key={category.name}
                  onClick={() => {
                    handleCategorySelect(category.name);
                    setShowMobileFilters(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeCategory === category.name
                      ? "bg-[#0c9dcb] text-white shadow-sm"
                      : "bg-white border border-gray-300 text-gray-600"
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex flex-col gap-4 p-4 sticky top-0 bg-white z-30 shadow-sm">
        <div className="flex items-center justify-between w-full border-b border-gray-200 pb-2">
          <Tabs
            value={currentTab}
            className="flex-1"
            onValueChange={handleTabSelect}
          >
            <TabsList className="inline-flex h-9 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground">
              <TabsTrigger
                value="items"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium gap-1.5"
              >
                <Package className="w-3.5 h-3.5 text-[#0c9dcb]" />
                Items
                <Badge
                  variant="secondary"
                  className="ml-1 h-4 px-1.5 text-xs font-medium"
                >
                  {tabCounts.items}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="drafts"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-gray-600" />
                Drafts
                <Badge
                  variant="secondary"
                  className="ml-1 h-4 px-1.5 text-xs font-medium"
                >
                  {tabCounts.drafts}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            <div className="relative w-full max-w-xs lg:max-w-sm">
              <Input
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search items..."
                className="pl-10 pr-4 h-9"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>

            <div className="px-3 py-2 border border-[#0c9dcb] rounded-lg">
              <span className="text-[#0c9dcb] font-semibold text-sm">
                Total Item : {items.length.toString().padStart(2, "0")} of{" "}
                {pagination.totalItems}
              </span>
            </div>

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

        <div className="flex gap-2 py-2 overflow-x-auto pb-3 no-scrollbar">
          {categoryCounts.map((category) => (
            <div
              key={category.name}
              onClick={() => handleCategorySelect(category.name)}
              className={`px-3 py-2 rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
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

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0c9dcb]"></div>
        </div>
      )}

      {/* Desktop Table */}
      {!loading && (
        <>
          <div className="hidden lg:block mx-6 mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                      Color
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
                  {items.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
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
                            <div className="text-sm text-gray-500">
                              {item.code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.category || "Uncategorized"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.subCategory || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.color.toUpperCase() || "No Color"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.vendorId?.vendorName || "No Vendor"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500">
                          {new Date(item.updatedAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.quantity}{" "}
                          <span className="text-lg font-normal text-gray-600">
                            {item.quantityUnit}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.isDraft ? "Draft" : "Available"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end space-x-2">
                        {item.isDraft ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-200 text-green-600 hover:bg-green-50"
                            onClick={(e: any) => {
                              e.stopPropagation();
                              handleEditItem(item);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" /> Edit Item
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                            onClick={(e: any) => {
                              e.stopPropagation();
                              setSelectedItemForStock(item);
                              setShowUpdateStockDialog(true);
                            }}
                          >
                            <Settings className="w-4 h-4 mr-1" /> Update Stock
                          </Button>
                        )}

                        <ConfirmActionDialog
                          title="Deactivate Inventory Item"
                          description={`Archive ${item.itemName}`}
                          onConfirm={() => handleSoftDelete(item)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.itemsPerPage}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[10, 20, 30, 50]}
              />
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden px-3 pb-20 pt-3 grid grid-cols-1 gap-3">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No items found</p>
                <p className="text-gray-400 text-xs mt-1">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              items.map((item) => (
                <Card
                  key={item._id}
                  className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow active:scale-[0.98]"
                  onClick={() => {
                    setSelectedItemForHistory(item);
                    setShowHistoryDialog(true);
                  }}
                >
                  <CardHeader className="pb-2 px-3 pt-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-12 w-12 shrink-0 rounded-lg flex items-center justify-center ${getIconColorClasses(
                          item.iconColor
                        )}`}
                      >
                        <Package className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-semibold truncate">
                          {item.itemName}
                        </CardTitle>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.code}
                        </p>
                        {item.isDraft && (
                          <Badge
                            variant="secondary"
                            className="mt-1 text-[10px] h-5"
                          >
                            Draft
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="text-xs text-gray-700 space-y-1.5 px-3 pb-2">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <p className="font-medium truncate">
                          {item.category || "Uncategorized"}
                        </p>
                      </div>
                      {/* <div>
                        <span className="text-gray-500">Brand:</span>
                        <p className="font-medium truncate">
                          {item.brand || "—"}
                        </p>
                      </div> */}
                      <div>
                        <span className="text-gray-500">Vendor:</span>
                        <p className="font-medium truncate">
                          {item.vendorId?.vendorName || "No Vendor"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Stock:</span>
                        <p className="font-medium">
                          {item.quantity}{" "}
                          <span className="text-[10px] text-gray-500">
                            {item.quantityUnit}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-gray-100">
                      <span className="text-gray-500">Updated: </span>
                      <span className="text-[10px] text-gray-600">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 px-3 pb-3 flex gap-2">
                    {item.isDraft ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-green-200 text-green-600 hover:bg-green-50 h-9 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditItem(item);
                        }}
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 h-9 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItemForStock(item);
                          setShowUpdateStockDialog(true);
                        }}
                      >
                        <Settings className="w-3.5 h-3.5 mr-1" /> Stock
                      </Button>
                    )}

                    <ConfirmActionDialog
                      title="Deactivate Inventory Item"
                      description={`Archive ${item.itemName}`}
                      onConfirm={() => handleSoftDelete(item)}
                      trigger={
                        <Button
                          size="sm"
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white h-9 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                        </Button>
                      }
                    />
                  </CardFooter>
                </Card>
              ))
            )}
          </div>

          {/* Mobile Pagination */}
          {items.length > 0 && (
            <div className="lg:hidden px-3 pb-4">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.itemsPerPage}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[10, 20, 30]}
              />
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <AddItemDialog
        open={showAddDialog}
        onOpenChange={handleDialogClose}
        editingItem={editingItem}
        isEditMode={isEditMode}
        createItem={createItem}
        updateItem={updateItem}
        vendors={vendors}
      />
      <UpdateStockDialog
        open={showUpdateStockDialog}
        onOpenChange={handleUpdateStockClose}
        selectedItem={selectedItemForStock}
        updateStock={updateStock}
        vendors={vendors}
      />
      <ItemHistoryDialog
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
        item={selectedItemForHistory}
      />
    </div>
  );
}
