// useProjectQuery.ts - Updated with filter support
import { useEffect, useState } from "react";
import api from "../../lib/api";

type Query = {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  country?: string;
  priority?: string;
  company?: string;
  brand?: string;
  category?: string;
  type?: string;
};

export function useProjectQuery(params: Query) {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        // Build query params, only include non-empty values
        const queryParams: any = {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
        };

        if (params.status) queryParams.status = params.status;
        if (params.search) queryParams.search = params.search;
        if (params.country) queryParams.country = params.country;
        if (params.priority) queryParams.priority = params.priority;
        if (params.company) queryParams.company = params.company;
        if (params.brand) queryParams.brand = params.brand;
        if (params.category) queryParams.category = params.category;
        if (params.type) queryParams.type = params.type;

        const res = await api.get("/projects", {
          params: queryParams,
          signal: controller.signal,
        });

        if (!mounted) return;
        setData(res.data.data || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
      } catch (e) {
        if (!mounted) return;
        console.error("Failed to load projects:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [
    params.status,
    params.search,
    params.page,
    params.limit,
    params.country,
    params.priority,
    params.company,
    params.brand,
    params.category,
    params.type,
    reloadToken,
  ]);

  return {
    data,
    total,
    pages,
    loading,
    reload: () => setReloadToken((x) => x + 1),
  };
}
