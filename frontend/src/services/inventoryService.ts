import api from "../lib/api";

export const inventoryService = {
  // Get items with pagination and filters
  async getItems(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      isDraft?: boolean | string;
      sortBy?: string;
      sortOrder?: string;
    } = {}
  ) {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, String(value));
      }
    });

    const res = await api.get(`/inventory?${queryParams.toString()}`);
    return res.data;
  },

  // Reserve a code before creating item
  async reserveCode() {
    try {
      const res = await api.get("/inventory/reserve-code");
      return res.data;
    } catch (error) {
      console.error("Error reserving code:", error);
      throw error;
    }
  },

  // Create new inventory item
  async createItem(formData: FormData) {
    const res = await api.post("/inventory", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  // Update existing inventory item
  async updateItem(itemId: string, formData: FormData) {
    const res = await api.put(`/inventory/${itemId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  // Update stock with file upload support
  async updateStock(itemId: string, payload: FormData | any) {
    // Check if payload is FormData (for file upload) or regular object
    if (payload instanceof FormData) {
      const res = await api.post(`/inventory/stock/${itemId}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } else {
      // For backward compatibility - regular JSON payload
      const res = await api.post(`/inventory/stock/${itemId}`, payload);
      return res.data;
    }
  },

  // Get transaction history for a specific item
  async getHistory(itemId: string) {
    const res = await api.get(`/inventory/history/${itemId}`);
    return res.data;
  },

  // Get all transaction history
  async getAllHistory() {
    const res = await api.get("/inventory/history-all");
    return res.data;
  },

  // Soft delete an item (mark as deleted)
  async softDeleteItem(itemId: string) {
    const res = await api.patch(`/inventory/${itemId}/soft-delete`);
    return res.data;
  },

  // Get item by ID
  async getItemById(itemId: string) {
    const res = await api.get(`/inventory/${itemId}`);
    return res.data;
  },
};
