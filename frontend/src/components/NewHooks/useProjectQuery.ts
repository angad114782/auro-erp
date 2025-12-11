import { useEffect, useState } from "react";
import axios from "axios";
import api from "../../lib/api";

type Query = {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
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
        const res = await api.get("/projects", {
          params: {
            status: params.status,
            search: params.search,
            page: params.page ?? 1,
            limit: params.limit ?? 8,
          },
          signal: controller.signal,
        });

        if (!mounted) return;
        setData(res.data.data || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
      } catch (e) {
        if (!mounted) return;
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [params.status, params.search, params.page, params.limit, reloadToken]);
  //                👆 added reloadToken dependency!

  return {
    data,
    total,
    pages,
    loading,
    reload: () => setReloadToken((x) => x + 1), // REAL reload
  };
}
