import type {
  CreateCreatorInput,
  CreatorRepository,
  UpdateCreatorInput,
} from "@/core/interfaces/repositories";
import type { Creator, ID } from "@/core/types";
import apiClient from "@/infrastructure/api/api-client";

export class ApiCreatorRepository implements CreatorRepository {
  async list(): Promise<Creator[]> {
    try {
      const response = await apiClient.get<Creator[]>("/creators");
      return response.data.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch creators");
    }
  }

  async getById(id: ID): Promise<Creator | null> {
    try {
      const response = await apiClient.get<Creator>(`/creators/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw new Error(error.response?.data?.message || "Failed to fetch creator");
    }
  }

  async getByUsername(username: string): Promise<Creator | null> {
    try {
      const normalized = username.trim().toLowerCase();
      const response = await apiClient.get<Creator>(`/creators/username/${normalized}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw new Error(error.response?.data?.message || "Failed to fetch creator");
    }
  }

  async create(input: CreateCreatorInput): Promise<Creator> {
    try {
      const response = await apiClient.post<Creator>("/creators", input);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create creator");
    }
  }

  async update(id: ID, input: UpdateCreatorInput): Promise<Creator> {
    try {
      const response = await apiClient.put<Creator>(`/creators/${id}`, input);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update creator");
    }
  }

  async disable(id: ID): Promise<Creator> {
    return this.update(id, { status: "disabled" });
  }

  async enable(id: ID): Promise<Creator> {
    return this.update(id, { status: "active" });
  }

  async delete(id: ID): Promise<void> {
    try {
      await apiClient.delete(`/creators/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete creator");
    }
  }
}

export const apiCreatorRepository = new ApiCreatorRepository();
