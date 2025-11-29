// src/hooks/useInventory.ts
import { useCallback, useState } from "react";
import { inventoryService } from "../services/inventoryService";

export const useInventory = () => {
  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const list = await inventoryService.getItems();
      setItems(list || []);
    } catch (err) {
      console.error("loadItems failed:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);
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
    async (payload: {
      // either raw object or FormData
      formData: FormData;
    }) => {
      try {
        const created = await inventoryService.createItem(payload.formData);
        setItems((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        console.error("createItem failed:", err);
        throw err;
      }
    },
    []
  );

  const updateItem = useCallback(async (itemId: string, formData: FormData) => {
    try {
      const updated = await inventoryService.updateItem(itemId, formData);
      setItems((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
      return updated;
    } catch (err) {
      console.error("updateItem failed:", err);
      throw err;
    }
  }, []);

  const updateStock = useCallback(
    async (itemId: string, payload: any) => {
      try {
        const updated = await inventoryService.updateStock(itemId, payload);
        // backend returns updated item — replace in list if present
        if (updated && updated._id) {
          setItems((prev) =>
            prev.map((i) => (i._id === updated._id ? updated : i))
          );
        } else {
          // fallback: reload
          await loadItems();
        }
        return updated;
      } catch (err) {
        console.error("updateStock failed:", err);
        throw err;
      }
    },
    [loadItems]
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
    loadItems,
    createItem,
    updateItem,
    updateStock,
    getHistory,
    setItems,
    loadTransactions,
    transactions,
  };
};
