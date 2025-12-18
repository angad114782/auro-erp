// src/hooks/useInventory.ts
import { useCallback, useState } from "react";
import { inventoryService } from "../services/inventoryService";

export const useInventory = () => {
  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [filters, setFilters] = useState({
    search: "",
    category: "All",
    isDraft: undefined as boolean | undefined, // Change to undefined to show all by default
    sortBy: "updatedAt",
    sortOrder: "desc",
  });
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {}
  );
  const [totalAll, setTotalAll] = useState(0);

  const loadItems = useCallback(
    async (
      params: {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        isDraft?: boolean | string;
        sortBy?: string;
        sortOrder?: string;
      } = {}
    ) => {
      setLoading(true);
      try {
        // Merge with existing filters
        const loadParams = { ...filters, ...params };

        // Update filters state
        const newFilters = { ...filters };
        if (params.search !== undefined)
          newFilters.search = params.search || "";
        if (params.category !== undefined)
          newFilters.category = params.category || "All";

        // Handle isDraft - undefined means show all, boolean means filter
        if (params.isDraft !== undefined) {
          if (params.isDraft === "false" || params.isDraft === false) {
            newFilters.isDraft = false;
          } else if (params.isDraft === "true" || params.isDraft === true) {
            newFilters.isDraft = true;
          } else {
            newFilters.isDraft = undefined;
          }
        }

        setFilters(newFilters);

        // Prepare params for API
        const apiParams: any = { ...loadParams };

        // If category is "All", don't send it to backend
        if (apiParams.category === "All") {
          delete apiParams.category;
        }

        // Handle isDraft for API
        if (apiParams.isDraft === undefined) {
          delete apiParams.isDraft;
        } else if (typeof apiParams.isDraft === "boolean") {
          apiParams.isDraft = apiParams.isDraft.toString();
        }

        const response = await inventoryService.getItems(apiParams);
        setItems(response.items || []);
        setPagination(
          response.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 10,
            hasNextPage: false,
            hasPrevPage: false,
          }
        );

        // Set category counts and total
        if (response.filters) {
          setCategoryCounts(response.filters.categoryCounts || {});
          setTotalAll(response.filters.totalAll || 0);
        }
      } catch (err) {
        console.error("loadItems failed:", err);
        setItems([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false,
        });
        setCategoryCounts({});
        setTotalAll(0);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // Initialize load
  const initializeItems = useCallback(async () => {
    await loadItems({ page: 1, limit: 10, isDraft: false }); // Default to non-draft items
  }, [loadItems]);

  // Handle page change
  const handlePageChange = useCallback(
    async (page: number) => {
      await loadItems({ page, limit: pagination.itemsPerPage });
    },
    [loadItems, pagination.itemsPerPage]
  );

  // Handle page size change
  const handlePageSizeChange = useCallback(
    async (size: number) => {
      await loadItems({ page: 1, limit: size });
    },
    [loadItems]
  );

  // Handle search
  const handleSearch = useCallback(
    async (searchTerm: string) => {
      await loadItems({ page: 1, search: searchTerm });
    },
    [loadItems]
  );

  // Handle category filter
  const handleCategoryFilter = useCallback(
    async (category: string) => {
      await loadItems({ page: 1, category });
    },
    [loadItems]
  );

  // Handle tab change (items/drafts/all)
  const handleTabChange = useCallback(
    async (tab: string) => {
      if (tab === "items") {
        await loadItems({ page: 1, isDraft: false });
      } else if (tab === "drafts") {
        await loadItems({ page: 1, isDraft: true });
      } else {
        await loadItems({ page: 1, isDraft: undefined }); // Show all
      }
    },
    [loadItems]
  );

  // Get category counts for display
  const getCategoryCounts = useCallback(() => {
    const allCount = totalAll;
    const categories = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
    }));

    // Always show "All" category with total count
    return [{ name: "All", count: allCount }, ...categories];
  }, [categoryCounts, totalAll]);

  // Other methods remain the same...
  const loadTransactions = useCallback(async () => {
    try {
      const res = await inventoryService.getAllHistory();
      setTransactions(res.data.data || []);
    } catch (err) {
      console.error("loadTransactions failed:", err);
      setTransactions([]);
    }
  }, []);

  const createItem = useCallback(
    async (payload: { formData: FormData }) => {
      try {
        const created = await inventoryService.createItem(payload.formData);
        // Refresh the list
        await loadItems({ page: 1 });
        return created;
      } catch (err) {
        console.error("createItem failed:", err);
        throw err;
      }
    },
    [loadItems]
  );

  const updateItem = useCallback(
    async (itemId: string, formData: FormData) => {
      try {
        const updated = await inventoryService.updateItem(itemId, formData);
        await loadItems({ page: pagination.currentPage });
        return updated;
      } catch (err) {
        console.error("updateItem failed:", err);
        throw err;
      }
    },
    [loadItems, pagination.currentPage]
  );

  const updateStock = useCallback(
    async (itemId: string, payload: any) => {
      try {
        const updated = await inventoryService.updateStock(itemId, payload);
        await loadItems({ page: pagination.currentPage });
        return updated;
      } catch (err) {
        console.error("updateStock failed:", err);
        throw err;
      }
    },
    [loadItems, pagination.currentPage]
  );

  const getHistory = useCallback(async (itemId: string) => {
    try {
      return await inventoryService.getHistory(itemId);
    } catch (err) {
      console.error("getHistory failed:", err);
      return [];
    }
  }, []);

  return {
    items,
    loading,
    pagination,
    filters,
    categoryCounts: getCategoryCounts(),
    loadItems: initializeItems,
    handlePageChange,
    handlePageSizeChange,
    handleSearch,
    handleCategoryFilter,
    handleTabChange,
    createItem,
    updateItem,
    updateStock,
    getHistory,
    setItems,
    loadTransactions,
    transactions,
  };
};
