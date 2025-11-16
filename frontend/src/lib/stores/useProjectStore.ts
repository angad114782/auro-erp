import { create } from "zustand";
import api from "../api";

/* ============================================================
   🚀 TYPE DEFINITIONS (Matches your Mongo Models exactly)
   ============================================================ */

export type ID = string;

export interface Project {
  _id: ID;
  autoCode: string;

  company: any;
  brand: any;
  category: any;

  type: any;
  country: any;
  assignPerson: any;

  color: string;
  artName: string;
  size: string;
  gender: string;
  priority: string;

  status: string;
  productDesc: string;
  redSealTargetDate?: string | null;

  coverImage: string;
  sampleImages: string[];

  clientFinalCost?: number | null;
  clientApproval: "pending" | "approved" | "rejected";

  nextUpdate?: {
    date: string;
    note: string;
    by?: any;
    at?: string;
  } | null;

  statusHistory: Array<{
    from: string | null;
    to: string;
    by?: any;
    at: string;
  }>;

  clientCostHistory: Array<{
    amount: number;
    by?: any;
    at: string;
  }>;

  colorVariants: any;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

/* ---------------- Master Types ---------------- */
export interface MasterItem {
  _id: ID;
  name: string;
  isActive?: boolean;
  company?: any;
  brand?: any;
}

/* ============================================================
   🚀 STORE STATE
   ============================================================ */

interface ProjectStore {
  projects: Project[];

  masters: {
    companies: MasterItem[];
    brands: MasterItem[];
    categories: MasterItem[];
    types: MasterItem[];
    countries: MasterItem[];
    assignPersons: MasterItem[];
  };

  selectedProject: Project | null;

  dialogs: {
    createOpen: boolean;
    detailsOpen: boolean;
  };

  loading: boolean;
  loadingMasters: boolean;

  searchTerm: string;
  currentPage: number;
  itemsPerPage: number;

  loadProjects: (opts?: { status?: string }) => Promise<void>;
  loadProject: (id: ID) => Promise<Project>;
  loadMasters: () => Promise<void>;
  loadBrands: (companyId: ID) => Promise<void>;
  loadCategories: (companyId: ID, brandId: ID) => Promise<void>;

  createProject: (fd: FormData | Record<string, any>) => Promise<Project>;

  updateProject: (
    id: ID,
    payload: FormData | Record<string, any>
  ) => Promise<Project>;

  deleteProject: (id: ID) => Promise<void>;

  setProjectStatus: (id: ID, status: string) => Promise<Project>;
  updateNextUpdate: (
    id: ID,
    data: { date: string; note: string }
  ) => Promise<Project>;
  updateClientApproval: (id: ID, status: string) => Promise<Project>;
  updateClientCost: (id: ID, amount: number) => Promise<Project>;
  updatePO: (id: ID, payload: any) => Promise<Project>;

  // stage auto-advance
  advanceSelectedProjectStage: () => Promise<Project | null>;

  // master creations
  createCompany: (name: string) => Promise<MasterItem>;
  createBrand: (companyId: ID, name: string) => Promise<MasterItem>;
  createCategory: (
    companyId: ID,
    brandId: ID,
    name: string
  ) => Promise<MasterItem>;
  createType: (name: string) => Promise<MasterItem>;
  createCountry: (name: string) => Promise<MasterItem>;
  createAssignPerson: (name: string) => Promise<MasterItem>;

  // UI
  selectProject: (p: Project | null) => void;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  openDetailsDialog: (p?: Project) => void;
  closeDetailsDialog: () => void;

  // search/pagination
  setSearchTerm: (s: string) => void;
  setPage: (p: number) => void;
  filteredProjects: () => Project[];
  paginatedProjects: () => Project[];
}

/* ============================================================
   🚀 CREATE STORE
   ============================================================ */

export const useProjectStore = create<ProjectStore>((set, get) => ({
  /* ---------------- DATA ---------------- */
  projects: [],
  masters: {
    companies: [],
    brands: [],
    categories: [],
    types: [],
    countries: [],
    assignPersons: [],
  },
  selectedProject: null,
  dialogs: {
    createOpen: false,
    detailsOpen: false,
  },

  loading: false,
  loadingMasters: false,

  searchTerm: "",
  currentPage: 1,
  itemsPerPage: 8,

  /* ============================================================
     🚀 LOAD PROJECTS
     ============================================================ */
  loadProjects: async ({ status } = {}) => {
    set({ loading: true });
    try {
      const res = await api.get("/projects", {
        params: status ? { status } : {},
      });

      const list =
        res.data?.data ??
        res.data?.items ??
        (Array.isArray(res.data) ? res.data : []);

      set({ projects: list });
    } finally {
      set({ loading: false });
    }
  },

  /* ---------------- Load a single project ---------------- */
  loadProject: async (id) => {
    const res = await api.get(`/projects/${id}`);
    const p = res.data?.data ?? res.data;
    set({ selectedProject: p });
    return p;
  },

  /* ============================================================
     🚀 LOAD MASTERS (companies/types/countries/assignPersons)
     ============================================================ */
  loadMasters: async () => {
    set({ loadingMasters: true });
    try {
      const [cRes, tRes, coRes, aRes] = await Promise.all([
        api.get("/companies"),
        api.get("/types"),
        api.get("/countries"),
        api.get("/assign-persons"),
      ]);

      set((s) => ({
        masters: {
          ...s.masters,
          companies: cRes.data?.data ?? cRes.data,
          types: tRes.data?.items ?? tRes.data,
          countries: coRes.data?.items ?? coRes.data,
          assignPersons: aRes.data?.items ?? aRes.data,
        },
      }));
    } finally {
      set({ loadingMasters: false });
    }
  },

  /* ---------------- Load brands for a company ---------------- */
  loadBrands: async (companyId) => {
    if (!companyId) {
      set((s) => ({
        masters: { ...s.masters, brands: [] },
      }));
      return;
    }
    const res = await api.get("/brands", {
      params: { company: companyId },
    });

    const arr = res.data?.items ?? res.data?.data ?? res.data ?? [];

    set((s) => ({
      masters: { ...s.masters, brands: arr },
    }));
  },

  /* ---------------- Load categories for company & brand ---------------- */
  loadCategories: async (companyId, brandId) => {
    if (!companyId || !brandId) {
      set((s) => ({
        masters: { ...s.masters, categories: [] },
      }));
      return;
    }

    const res = await api.get(
      `/companies/${companyId}/brands/${brandId}/categories`
    );

    const arr = res.data?.items ?? res.data?.data ?? res.data ?? [];

    set((s) => ({
      masters: { ...s.masters, categories: arr },
    }));
  },

  /* ============================================================
     🚀 CREATE PROJECT
     ============================================================ */
  createProject: async (payload) => {
    let fd: FormData;

    if (payload instanceof FormData) {
      fd = payload;
    } else {
      fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v == null) return;
        if (Array.isArray(v)) {
          v.forEach((x) => fd.append(k, x));
        } else {
          fd.append(k, v as any);
        }
      });
    }

    const res = await api.post("/projects", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const created = res.data?.data ?? res.data;

    set((s) => ({ projects: [created, ...s.projects] }));
    return created;
  },

  /* ============================================================
     🚀 UPDATE PROJECT
     ============================================================ */
  updateProject: async (id, payload) => {
    let fd: FormData | Record<string, any> = payload;
    let headers: any = {};

    if (!(payload instanceof FormData)) {
      const f = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v == null) return;
        if (Array.isArray(v)) {
          v.forEach((x) => f.append(k, x));
        } else {
          f.append(k, v as any);
        }
      });
      fd = f;
      headers["Content-Type"] = "multipart/form-data";
    }

    const res = await api.put(`/projects/${id}`, fd, { headers });
    const updated = res.data?.data ?? res.data;

    set((s) => ({
      projects: s.projects.map((p) => (p._id === id ? updated : p)),
      selectedProject:
        s.selectedProject?._id === id ? updated : s.selectedProject,
    }));

    return updated;
  },

  /* ============================================================
     🚀 DELETE PROJECT
     ============================================================ */
  deleteProject: async (id) => {
    await api.delete(`/projects/${id}`);
    set((s) => ({
      projects: s.projects.filter((p) => p._id !== id),
    }));
  },

  /* ============================================================
     🚀 UPDATE STATUS / NEXT UPDATE / COST / APPROVAL / PO
     ============================================================ */
  setProjectStatus: async (id, status) => {
    const res = await api.patch(`/projects/${id}/status`, { status });
    const updated = res.data?.data ?? res.data;

    set((s) => ({
      projects: s.projects.map((p) => (p._id === id ? updated : p)),
      selectedProject:
        s.selectedProject?._id === id ? updated : s.selectedProject,
    }));

    return updated;
  },

  updateNextUpdate: async (id, data) => {
    const res = await api.patch(`/projects/${id}/next-update`, data);
    const updated = res.data?.data ?? res.data;

    set((s) => ({
      selectedProject: updated,
      projects: s.projects.map((p) => (p._id === id ? updated : p)),
    }));

    return updated;
  },

  updateClientApproval: async (id, status) => {
    const res = await api.patch(`/projects/${id}/client-approval`, {
      status,
    });

    const updated = res.data?.data ?? res.data;

    set((s) => ({
      selectedProject: updated,
      projects: s.projects.map((p) => (p._id === id ? updated : p)),
    }));

    return updated;
  },

  updateClientCost: async (id, amount) => {
    const res = await api.patch(`/projects/${id}/client-cost`, {
      amount,
    });

    const updated = res.data?.data ?? res.data;

    set((s) => ({
      selectedProject: updated,
      projects: s.projects.map((p) => (p._id === id ? updated : p)),
    }));

    return updated;
  },

  updatePO: async (id, payload) => {
    const res = await api.patch(`/projects/${id}/po`, payload);
    const updated = res.data?.data ?? res.data;

    set((s) => ({
      selectedProject: updated,
      projects: s.projects.map((p) => (p._id === id ? updated : p)),
    }));

    return updated;
  },

  /* ============================================================
     🚀 AUTO-ADVANCE STAGE
     ============================================================ */
  advanceSelectedProjectStage: async () => {
    const p = get().selectedProject;
    if (!p) return null;

    const flow = [
      "prototype",
      "red_seal",
      "green_seal",
      "po_pending",
      "po_approved",
    ];

    const index = flow.indexOf(p.status);
    if (index === -1 || index === flow.length - 1) return null;

    const next = flow[index + 1];

    return await get().setProjectStatus(p._id, next);
  },

  /* ============================================================
     🚀 CREATE MASTERS
     ============================================================ */
  createCompany: async (name) => {
    const res = await api.post("/companies", { name });
    const created = res.data?.data ?? res.data;

    set((s) => ({
      masters: { ...s.masters, companies: [created, ...s.masters.companies] },
    }));

    return created;
  },

  createBrand: async (companyId, name) => {
    const res = await api.post(`/companies/${companyId}/brands`, { name });
    const created = res.data?.data ?? res.data;

    set((s) => ({
      masters: { ...s.masters, brands: [created, ...s.masters.brands] },
    }));

    return created;
  },

  createCategory: async (companyId, brandId, name) => {
    const res = await api.post(
      `/companies/${companyId}/brands/${brandId}/categories`,
      { name }
    );
    const created = res.data?.data ?? res.data;

    set((s) => ({
      masters: { ...s.masters, categories: [created, ...s.masters.categories] },
    }));

    return created;
  },

  createType: async (name) => {
    const res = await api.post("/types", { name });
    const created = res.data?.data ?? res.data;

    set((s) => ({
      masters: { ...s.masters, types: [created, ...s.masters.types] },
    }));

    return created;
  },

  createCountry: async (name) => {
    const res = await api.post("/countries", { name });
    const created = res.data?.data ?? res.data;

    set((s) => ({
      masters: { ...s.masters, countries: [created, ...s.masters.countries] },
    }));

    return created;
  },

  createAssignPerson: async (name) => {
    const res = await api.post("/assign-persons", { name });
    const created = res.data?.data ?? res.data;

    set((s) => ({
      masters: {
        ...s.masters,
        assignPersons: [created, ...s.masters.assignPersons],
      },
    }));

    return created;
  },

  /* ============================================================
     🚀 UI: Selection & Dialogs
     ============================================================ */
  selectProject: (p) => set({ selectedProject: p }),

  openCreateDialog: () =>
    set((s) => ({
      dialogs: { ...s.dialogs, createOpen: true },
    })),

  closeCreateDialog: () =>
    set((s) => ({
      dialogs: { ...s.dialogs, createOpen: false },
    })),

  openDetailsDialog: (p) =>
    set((s) => ({
      selectedProject: p ?? s.selectedProject,
      dialogs: { ...s.dialogs, detailsOpen: true },
    })),

  closeDetailsDialog: () =>
    set((s) => ({
      dialogs: { ...s.dialogs, detailsOpen: false },
    })),

  /* ============================================================
     🚀 SEARCH & PAGINATION
     ============================================================ */
  setSearchTerm: (searchTerm) => set({ searchTerm, currentPage: 1 }),

  setPage: (p) => set({ currentPage: p }),

  filteredProjects: () => {
    const { projects, searchTerm } = get();
    if (!searchTerm) return projects;

    const q = searchTerm.toLowerCase();

    return projects.filter((p) => {
      return (
        p.autoCode.toLowerCase().includes(q) ||
        p.artName?.toLowerCase().includes(q) ||
        p.company?.name?.toLowerCase().includes(q) ||
        p.brand?.name?.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q)
      );
    });
  },

  paginatedProjects: () => {
    const filtered = get().filteredProjects();
    const { currentPage, itemsPerPage } = get();

    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  },
}));
