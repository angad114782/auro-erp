import { create } from "zustand";
import api from "../lib/api";

interface VendorStore {
  vendors: any[];
  loadVendors: () => Promise<void>;
  addVendor: (payload: any) => Promise<void>;
  updateVendor: (id: string, payload: any) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
}
export const useVendorStore = create<VendorStore>((set) => ({
  vendors: [],

  loadVendors: async () => {
    const res = await api.get("/vendors");
    set({ vendors: res.data.data });
  },

  addVendor: async (payload) => {
    const res = await api.post("/vendors", payload);
    set((state) => ({
      vendors: [...state.vendors, res.data.data],
    }));
  },

  updateVendor: async (id, payload) => {
    const res = await api.put(`/vendors/${id}`, payload);
    set((state) => ({
      vendors: state.vendors.map((v) => (v._id === id ? res.data.data : v)),
    }));
  },

  deleteVendor: async (id) => {
    await api.delete(`/vendors/${id}`);
    set((state) => ({
      vendors: state.vendors.filter((v) => v._id !== id),
    }));
  },
}));
