import api from "../lib/api";

// src/services/inventoryService.ts
export const inventoryService = {
  // async getItems(params: {
  //   page?: number;
  //   limit?: number;
  //   search?: string;
  //   category?: string;
  //   isDraft?: boolean | string;
  //   sortBy?: string;
  //   sortOrder?: string;
  // } = {}) {
  //   const queryParams = new URLSearchParams();

  //   Object.entries(params).forEach(([key, value]) => {
  //     if (value !== undefined && value !== null && value !== '') {
  //       queryParams.append(key, String(value));
  //     }
  //   });

  //   const res = await api.get(`/inventory?${queryParams.toString()}`);
  //   return res.data;
  // },
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
  // Keep other methods as they were
  async createItem(formData: FormData) {
    const res = await api.post("/inventory", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async updateItem(itemId: string, formData: FormData) {
    const res = await api.put(`/inventory/${itemId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async updateStock(itemId: string, payload: any) {
    const res = await api.post(`/inventory/stock/${itemId}`, payload);
    return res.data;
  },

  async getHistory(itemId: string) {
    const res = await api.get(`/inventory/history/${itemId}`);
    return res.data;
  },

  getAllHistory: async () => {
    return await api.get("/inventory/history-all");
  },

  async softDeleteItem(itemId: string) {
    const res = await api.patch(`/inventory/${itemId}/soft-delete`);
    return res.data;
  },
};
