import { create } from "zustand";
import api from "../lib/api";

interface VendorStore {
  vendors: any[];
  loading: boolean;
  error: string | null;

  loadVendors: () => Promise<void>;
  addVendor: (payload: any) => Promise<void>;
  updateVendor: (id: string, payload: any) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
}

export const useVendorStore = create<VendorStore>((set) => ({
  vendors: [],
  loading: false,
  error: null,

  loadVendors: async () => {
    try {
      set({ loading: true, error: null });
      const res = await api.get("/vendors");
      set({ vendors: res.data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.message || "Failed to load vendors" });
    }
  },

  addVendor: async (payload) => {
    try {
      set({ loading: true, error: null });
      const res = await api.post("/vendors", payload);
      set((state) => ({
        vendors: [...state.vendors, res.data.data],
        loading: false,
      }));
    } catch (err: any) {
      set({ loading: false, error: err.message || "Failed to add vendor" });
    }
  },

  updateVendor: async (id, payload) => {
    try {
      set({ loading: true, error: null });
      const res = await api.put(`/vendors/${id}`, payload);
      set((state) => ({
        vendors: state.vendors.map((v) => (v._id === id ? res.data.data : v)),
        loading: false,
      }));
    } catch (err: any) {
      set({ loading: false, error: err.message || "Failed to update vendor" });
    }
  },

  deleteVendor: async (id) => {
    try {
      set({ loading: true, error: null });
      await api.delete(`/vendors/${id}`);
      set((state) => ({
        vendors: state.vendors.filter((v) => v._id !== id),
        loading: false,
      }));
    } catch (err: any) {
      set({ loading: false, error: err.message || "Failed to delete vendor" });
    }
  },
}));
