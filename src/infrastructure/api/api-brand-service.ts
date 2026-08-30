import apiClient from "./api-client";

const DEFAULT_BRANDS = ["Nike", "Adidas", "Puma", "Reebok", "New Balance", "Asics", "Saucony", "HOKA"];

let cachedBrands: string[] | null = null;

export const apiBrandService = {
  async getAll(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>("/brands");
      cachedBrands = response.data;
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch brands:", error);
      return cachedBrands || DEFAULT_BRANDS;
    }
  },

  async initialize(): Promise<void> {
    try {
      await apiClient.post("/brands/initialize", { brands: DEFAULT_BRANDS });
      cachedBrands = DEFAULT_BRANDS;
    } catch (error: any) {
      console.error("Failed to initialize brands:", error);
    }
  },

  async add(brand: string): Promise<void> {
    try {
      await apiClient.post("/brands", { brand });
      cachedBrands = null; // Invalidate cache
      await this.getAll(); // Refresh
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to add brand");
    }
  },

  async remove(brand: string): Promise<void> {
    try {
      await apiClient.delete(`/brands/${brand}`);
      cachedBrands = null; // Invalidate cache
      await this.getAll(); // Refresh
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to remove brand");
    }
  },
};
