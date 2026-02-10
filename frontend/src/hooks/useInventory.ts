// src/hooks/useInventory.ts
// OPTIMIZED: Now extracts tabCounts from main API response instead of 3 separate calls
import { useCallback, useState, useRef } from "react";
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
    isDraft: undefined as boolean | undefined,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });
  const [categoryCounts, setCategoryCounts] = useState<
    Array<{ name: string; count: number }>
  >([]);
  const [tabCounts, setTabCounts] = useState({
    items: 0,
    drafts: 0,
    all: 0,
  });

  // Performance tracking ref
  const lastLoadTime = useRef<number>(0);

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
      const startTime = performance.now();

      try {
        // Merge with existing filters
        const loadParams = { ...filters, ...params };

        // Update filters state
        const newFilters = { ...filters };
        if (params.search !== undefined)
          newFilters.search = params.search || "";
        if (params.category !== undefined)
          newFilters.category = params.category || "All";

        // Handle isDraft
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

        if (apiParams.category === "All") {
          delete apiParams.category;
        }

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

        // Set category counts
        if (response.filters) {
          const categories = response.filters.categoryCounts || {};
          const categoryArray = Object.entries(categories).map(
            ([name, count]) => ({
              name,
              count: count as number,
            })
          );
          // Add "All" category
          categoryArray.unshift({
            name: "All",
            count: response.filters.totalAll || 0,
          });
          setCategoryCounts(categoryArray);
        }

        // OPTIMIZED: Extract tabCounts directly from API response
        // Backend now returns tabCounts in the main response
        if (response.tabCounts) {
          setTabCounts({
            items: response.tabCounts.items || 0,
            drafts: response.tabCounts.drafts || 0,
            all: response.tabCounts.all || 0,
          });
        }

        // Performance logging
        lastLoadTime.current = performance.now() - startTime;
        if (import.meta.env.DEV) {
          console.log(`[useInventory] loadItems completed in ${lastLoadTime.current.toFixed(2)}ms`);
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
        setCategoryCounts([]);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // OPTIMIZED: Simplified initialization - no separate tab count calls needed
  const initializeItems = useCallback(async () => {
    // Single API call now returns everything including tabCounts
    await loadItems({ page: 1, limit: 10, isDraft: false });
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

  // Handle tab change (items/drafts)
  // OPTIMIZED: No need for separate loadTabCounts call - main API returns updated counts
  const handleTabChange = useCallback(
    async (tab: string) => {
      if (tab === "items") {
        await loadItems({ page: 1, isDraft: false });
      } else if (tab === "drafts") {
        await loadItems({ page: 1, isDraft: true });
      }
      // Tab counts are automatically updated from the API response
    },
    [loadItems]
  );

  // OPTIMIZED: Refresh tab counts by simply reloading current view
  // The API now returns updated tabCounts with every response
  const refreshTabCounts = useCallback(async () => {
    await loadItems({ page: pagination.currentPage });
  }, [loadItems, pagination.currentPage]);

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
        // Single refresh - API returns updated tabCounts
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
        // Single refresh - API returns updated tabCounts
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

  const getAllHistory = useCallback(async () => {
    try {
      return await inventoryService.getAllHistory();
    } catch (err) {
      console.error("getAllhistory failed:", err);
      return [];
    }
  }, []);

  return {
    items,
    loading,
    pagination,
    filters,
    categoryCounts,
    tabCounts,
    loadItems: initializeItems,
    refreshTabCounts,
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
    getAllHistory,
    loadTransactions,
    transactions,
  };
};
