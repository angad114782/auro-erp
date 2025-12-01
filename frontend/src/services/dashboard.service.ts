import api from "../lib/api";

export const dashboardService = {
  // Dashboard aggregated endpoint
  async getDashboard() {
    try {
      const response = await api.get("/dashboard");
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      return {
        projects: [],
        brands: [],
        categories: [],
        users: [],
        vendors: [],
        inventory: [],
        companies: [],
      };
    }
  },
  // Projects
  async getProjects() {
    try {
      const response = await api.get("/projects");
      return response.data;
    } catch (error) {
      console.error("Error fetching projects:", error);
      return [];
    }
  },

  // Inventory Items
  async getInventoryItems() {
    try {
      const response = await api.get("/inventory");
      return response.data;
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      return [];
    }
  },

  // Vendors
  async getVendors() {
    try {
      const response = await api.get("/vendors");
      return response.data;
    } catch (error) {
      console.error("Error fetching vendors:", error);
      return [];
    }
  },

  // Users
  async getUsers() {
    try {
      const response = await api.get("/users");
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  // Production Projects
  async getProductionProjects() {
    try {
      const response = await api.get("/production");
      return response.data;
    } catch (error) {
      console.error("Error fetching production projects:", error);
      return [];
    }
  },

  // Companies
  async getCompanies() {
    try {
      const response = await api.get("/companies");
      return response.data;
    } catch (error) {
      console.error("Error fetching companies:", error);
      return [];
    }
  },

  // Categories
  async getCategories() {
    try {
      const response = await api.get("/categories");
      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },

  // Brands
  async getBrands() {
    try {
      const response = await api.get("/brands");
      return response.data;
    } catch (error) {
      console.error("Error fetching brands:", error);
      return [];
    }
  },
};
