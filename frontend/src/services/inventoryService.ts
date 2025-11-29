import api from "../lib/api";

export interface InventoryItem {
  _id: string;
  code: string;
  itemName: string;

  category: string;
  subCategory: string;
  brand: string;
  color: string;

  vendorId?: string;
  vendor?: any; // populated vendor

  expiryDate?: string;

  quantity: number;
  quantityUnit: string;
  description?: string;

  billNumber?: string;
  billDate?: string;
  billAttachmentUrl?: string;

  isDraft: boolean;

  lastUpdate?: string;
  lastUpdateTime?: string;
}

export interface InventoryTransaction {
  _id: string;
  itemId: string;
  transactionType: "Stock In" | "Stock Out";
  quantity: number;
  previousStock: number;
  newStock: number;
  vendorId?: string;
  billNumber?: string;
  reason?: string;
  remarks?: string;
  transactionDate: string;
}

export const inventoryService = {
  async getItems() {
    const res = await api.get("/inventory");
    return res.data;
  },

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
    // payload: { type: 'add'|'reduce', quantity, vendorId?, billNumber?, billDate?, notes? }
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
};
