import type { Manager } from "@/core/types";
import apiClient from "./api-client";

interface CreateManagerInput {
  name: string;
  username: string;
  password: string;
  avatarUrl?: string;
}

interface UpdateManagerInput {
  name?: string;
  username?: string;
  password?: string;
  avatarUrl?: string;
}

export const apiManagerService = {
  async listAll(): Promise<Manager[]> {
    try {
      const response = await apiClient.get<Manager[]>("/managers");
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch managers");
    }
  },

  async getById(id: string): Promise<Manager | null> {
    try {
      const response = await apiClient.get<Manager>(`/managers/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw new Error(error.response?.data?.message || "Failed to fetch manager");
    }
  },

  async getByUsername(username: string): Promise<Manager | null> {
    try {
      const normalized = username.trim().toLowerCase();
      const response = await apiClient.get<Manager>(`/managers/username/${normalized}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw new Error(error.response?.data?.message || "Failed to fetch manager");
    }
  },

  async create(data: CreateManagerInput): Promise<Manager> {
    try {
      const response = await apiClient.post<Manager>("/managers", data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create manager");
    }
  },

  async update(id: string, data: UpdateManagerInput): Promise<Manager> {
    try {
      const response = await apiClient.put<Manager>(`/managers/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update manager");
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/managers/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete manager");
    }
  },
};
