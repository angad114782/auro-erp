import api from "../../lib/api";

export interface MasterItem {
  _id: string;
  name: string;
  company?: { _id: string; name: string };
  brand?: { _id: string; name: string };
  isActive?: boolean;
}

export interface Project {
  _id: string;
  autoCode: string;
  company: MasterItem | null;
  brand: MasterItem | null;
  category: MasterItem | null;
  type: MasterItem | null;
  country: MasterItem | null;
  assignPerson: MasterItem | null;
  artName?: string;
  color?: string;
  gender?: string;
  size?: string;
  priority?: string;
  productDesc?: string;
  status?: string;
  redSealTargetDate?: string;
  coverImage?: string | null;
  sampleImages?: string[];
  updateNotes?: string;
  nextUpdateDate?: string;
  clientApproval?: string;
  clientFinalCost?: string;
  createdAt?: string;
  updatedAt?: string;
  nextUpdate?: {
    date: string;
    note: string;
    setBy: string;
    setAt: string;
  };
}

// Cost interfaces
export interface CostItem {
  _id: string;
  item: string;
  description: string;
  consumption: string;
  cost: number;
  department?: string;
}

export interface LabourCost {
  directTotal: number;
  items: Array<{
    _id: string;
    name: string;
    cost: number;
  }>;
}

export interface CostSummary {
  additionalCosts: number;
  profitMargin: number;
  remarks: string;
  upperTotal: number;
  componentTotal: number;
  materialTotal: number;
  packagingTotal: number;
  miscTotal: number;
  labourTotal: number;
  totalAllCosts: number;
  profitAmount: number;
  tentativeCost: number;
  brandFinalCost: number;
  status: "draft" | "ready_for_red_seal";
}

// Color Variant interfaces
export interface Material {
  name: string;
  desc: string;
  consumption: string;
}

export interface Component {
  name: string;
  desc: string;
  consumption: string;
}

export interface ColorVariantData {
  materials: Material[];
  components: Component[];
  images: string[];
  updatedBy?: string | null;
  updatedAt?: Date;
}

class ProjectService {
  // Master data operations
  async getCompanies() {
    const res = await api.get("/companies");
    return this.pickArray(res.data);
  }

  async getBrands(companyId?: string) {
    const params = companyId ? { company: companyId } : {};
    const res = await api.get("/brands", { params });
    return this.pickArray(res.data);
  }

  async getCategories(companyId: string, brandId: string) {
    const res = await api.get(
      `/companies/${companyId}/brands/${brandId}/categories`
    );
    return this.pickArray(res.data);
  }

  async getTypes() {
    const res = await api.get("/types");
    return this.pickArray(res.data);
  }

  async getCountries() {
    const res = await api.get("/countries");
    return this.pickArray(res.data);
  }

  async getAssignPersons() {
    const res = await api.get("/assign-persons");
    return this.pickArray(res.data);
  }

  // Project operations
  async getProjects() {
    const res = await api.get("/projects");
    return this.pickArray(res.data);
  }

  async createProject(formData: FormData) {
    const res = await api.post("/projects", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data || res.data;
  }

  async updateProject(projectId: string, formData: FormData) {
    const res = await api.put(`/projects/${projectId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data || res.data;
  }

  async deleteProject(projectId: string) {
    await api.delete(`/projects/${projectId}`);
  }

  async updateProjectStatus(projectId: string, status: string) {
    const res = await api.patch(`/projects/${projectId}/status`, { status });
    return res.data?.data || res.data;
  }

  // Sequence operations
  async reserveSequence() {
    const res = await api.post("/sequences/PRJ/reserve");
    return res.data.data;
  }

  async cancelSequence(sequenceId: string) {
    await api.post(`/sequences/${sequenceId}/cancel`);
  }

  // Master creation operations
  async createCompany(name: string) {
    const res = await api.post("/companies", { name });
    return res.data?.data || res.data;
  }

  async createBrand(companyId: string, name: string) {
    const res = await api.post(`/companies/${companyId}/brands`, { name });
    return res.data?.data || res.data;
  }

  async createCategory(companyId: string, brandId: string, name: string) {
    const res = await api.post(
      `/companies/${companyId}/brands/${brandId}/categories`,
      { name }
    );
    return res.data?.data || res.data;
  }

  async createType(name: string) {
    const res = await api.post("/types", { name });
    return res.data?.data || res.data;
  }

  async createCountry(name: string) {
    const res = await api.post("/countries", { name });
    return res.data?.data || res.data;
  }

  async createAssignPerson(name: string) {
    const res = await api.post("/assign-persons", { name });
    return res.data?.data || res.data;
  }

  // Master deletion operations
  async deleteCompany(id: string) {
    await api.delete(`/companies/${id}`);
  }

  async deleteBrand(id: string) {
    await api.delete(`/brands/${id}`);
  }

  async deleteCategory(companyId: string, brandId: string, categoryId: string) {
    await api.delete(
      `/companies/${companyId}/brands/${brandId}/categories/${categoryId}`
    );
  }

  async deleteType(id: string) {
    await api.delete(`/types/${id}`);
  }

  async deleteCountry(id: string) {
    await api.delete(`/countries/${id}`);
  }

  async deleteAssignPerson(id: string) {
    await api.delete(`/assign-persons/${id}`);
  }

  // Red Seal Cost Operations
  async getCostSummary(projectId: string) {
    const res = await api.get(`/projects/${projectId}/costs`);
    return res.data.summary || res.data;
  }

  async getCostItems(projectId: string, category: string) {
    const res = await api.get(`/projects/${projectId}/costs/${category}`);
    return this.pickArray(res.data?.rows || res.data);
  }

  async getLabourCost(projectId: string) {
    const res = await api.get(`/projects/${projectId}/costs/labour`);
    return res.data.labour || res.data;
  }

  async addCostItem(
    projectId: string,
    category: string,
    data: Partial<CostItem>
  ) {
    const res = await api.post(
      `/projects/${projectId}/costs/${category}`,
      data
    );
    return res.data.row || res.data;
  }

  async updateCostItem(
    projectId: string,
    category: string,
    itemId: string,
    data: Partial<CostItem>
  ) {
    const res = await api.patch(
      `/projects/${projectId}/costs/${category}/${itemId}`,
      data
    );
    return res.data.row || res.data;
  }

  async deleteCostItem(projectId: string, category: string, itemId: string) {
    await api.delete(`/projects/${projectId}/costs/${category}/${itemId}`);
  }

  async updateLabourCost(projectId: string, data: Partial<LabourCost>) {
    const res = await api.patch(`/projects/${projectId}/costs/labour`, data);
    return res.data.labour || res.data;
  }

  async updateCostSummary(projectId: string, data: Partial<CostSummary>) {
    const res = await api.patch(`/projects/${projectId}/costs/summary`, data);
    return res.data.summary || res.data;
  }

  // Helper method
  private pickArray(payload: any): any[] {
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload)) return payload;
    return [];
  }
}

export const projectService = new ProjectService();
