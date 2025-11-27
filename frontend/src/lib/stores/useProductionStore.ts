// hooks/useProduction.ts
import { useCallback, useState } from "react";
import api from "../api";

export interface ProductionProject {
  _id: string;
  project?: string; // parent project id (string)
  planName?: string;
  productName?: string;
  poNumber?: string;
  quantity?: number;
  startDate?: string;
  endDate?: string;
  deliveryDate?: string;
  priority?: string;
  status?: string;
  assignedPlant?: string;
  assignedTeam?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;

  // extend with fields your API returns
  [k: string]: any;
}

export const useProduction = () => {
  const [items, setItems] = useState<ProductionProject[]>([]);
  const [selected, setSelected] = useState<ProductionProject | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Load productions.
   * - If projectId provided -> GET /projects/:projectId/production
   * - If no projectId -> try GET /projects/production (global)
   */
  const loadProduction = useCallback(async (projectId?: string | null) => {
    setLoading(true);
    try {
      let res;
      if (projectId) {
        res = await api.get(`/projects/production`);
        console.log(res, "res");
      } else {
        // attempt a "global" listing; backend may accept this path
        // If your backend uses another route (e.g. /productions), change it here
        try {
          res = await api.get(`/projects/production`);
          console.log(res, "res2");
        } catch (err) {
          // fallback: try /production-projects (common naming)
          res = await api.get(`/production-projects`);
        }
      }

      const payload = res.data?.data ?? res.data;
      // backend may return { data: { items: [...] } } or array directly
      const list =
        payload?.items ??
        payload?.data ??
        (Array.isArray(payload) ? payload : payload?.list ?? []);

      setItems(Array.isArray(list) ? list : []);
      return list;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOne = useCallback(async (projectId: string, prodId: string) => {
    const res = await api.get(`/projects/${projectId}/production/${prodId}`);
    const doc = res.data?.data ?? res.data;
    setSelected(doc);
    return doc;
  }, []);

  const updateProduction = useCallback(
    async (projectId: string, prodId: string, payload: any) => {
      const res = await api.put(
        `/projects/${projectId}/production/${prodId}`,
        payload
      );
      const updated = res.data?.data ?? res.data;
      setItems((prev) => prev.map((p) => (p._id === prodId ? updated : p)));
      setSelected((s) => (s?._id === prodId ? updated : s));
      return updated;
    },
    []
  );

  const deleteProduction = useCallback(
    async (projectId: string, prodId: string) => {
      await api.delete(`/projects/${projectId}/production/${prodId}`);
      setItems((prev) => prev.filter((p) => p._id !== prodId));
      if (selected?._id === prodId) setSelected(null);
    },
    [selected]
  );

  const createProduction = useCallback(
    async (projectId: string, payload: any) => {
      // If your backend exposes POST /projects/:id/production use it (common)
      const res = await api.post(`/projects/${projectId}/production`, payload);
      const created = res.data?.data ?? res.data;
      setItems((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  return {
    items,
    selected,
    loading,
    loadProduction,
    loadOne,
    updateProduction,
    deleteProduction,
    createProduction,
    setSelected,
    setItems,
  };
};

export default useProduction;
