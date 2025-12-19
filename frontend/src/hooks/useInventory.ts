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

  // Load tab counts separately
  const loadTabCounts = useCallback(async () => {
    try {
      // Load items count (non-drafts)
      const itemsResponse = await inventoryService.getItems({
        page: 1,
        limit: 1,
        isDraft: false,
      });

      // Load drafts count
      const draftsResponse = await inventoryService.getItems({
        page: 1,
        limit: 1,
        isDraft: true,
      });

      setTabCounts({
        items: itemsResponse.pagination?.totalItems || 0,
        drafts: draftsResponse.pagination?.totalItems || 0,
        all:
          (itemsResponse.pagination?.totalItems || 0) +
          (draftsResponse.pagination?.totalItems || 0),
      });
    } catch (err) {
      console.error("loadTabCounts failed:", err);
    }
  }, []);

  // Initialize both items and tab counts
  const initializeItems = useCallback(async () => {
    await Promise.all([
      loadItems({ page: 1, limit: 10, isDraft: false }),
      loadTabCounts(),
    ]);
  }, [loadItems, loadTabCounts]);

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
  const handleTabChange = useCallback(
    async (tab: string) => {
      if (tab === "items") {
        await loadItems({ page: 1, isDraft: false });
      } else if (tab === "drafts") {
        await loadItems({ page: 1, isDraft: true });
      }
      // Also refresh tab counts when switching tabs
      await loadTabCounts();
    },
    [loadItems, loadTabCounts]
  );

  // Refresh tab counts (call this after creating/updating items)
  const refreshTabCounts = useCallback(async () => {
    await loadTabCounts();
  }, [loadTabCounts]);

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
        // Refresh both items list and tab counts
        await Promise.all([loadItems({ page: 1 }), loadTabCounts()]);
        return created;
      } catch (err) {
        console.error("createItem failed:", err);
        throw err;
      }
    },
    [loadItems, loadTabCounts]
  );

  const updateItem = useCallback(
    async (itemId: string, formData: FormData) => {
      try {
        const updated = await inventoryService.updateItem(itemId, formData);
        // Refresh both current items and tab counts
        await Promise.all([
          loadItems({ page: pagination.currentPage }),
          loadTabCounts(),
        ]);
        return updated;
      } catch (err) {
        console.error("updateItem failed:", err);
        throw err;
      }
    },
    [loadItems, pagination.currentPage, loadTabCounts]
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
    getHistory,
    setItems,
    getAllHistory,
    loadTransactions,
    transactions,
  };
};
