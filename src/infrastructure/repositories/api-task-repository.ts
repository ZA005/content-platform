import { TASK_STATUS } from "@/core/constants";
import type {
  CreateTaskInput,
  TaskRepository,
  UpdateTaskInput,
} from "@/core/interfaces/repositories";
import type { ID, Task } from "@/core/types";
import apiClient from "@/infrastructure/api/api-client";

function deriveDisplayStatus(task: Task): Task {
  const isOpen = task.status !== TASK_STATUS.COMPLETED && task.status !== TASK_STATUS.OVERDUE;
  const todayIso = new Date().toISOString().slice(0, 10);
  if (isOpen && task.scheduledDate < todayIso) {
    return { ...task, status: TASK_STATUS.OVERDUE };
  }
  return task;
}

export class ApiTaskRepository implements TaskRepository {
  async list(): Promise<Task[]> {
    try {
      const response = await apiClient.get<Task[]>("/tasks");
      return response.data
        .map(deriveDisplayStatus)
        .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch tasks");
    }
  }

  async getById(id: ID): Promise<Task | null> {
    try {
      const response = await apiClient.get<Task>(`/tasks/${id}`);
      return deriveDisplayStatus(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw new Error(error.response?.data?.message || "Failed to fetch task");
    }
  }

  async listByDate(date: string): Promise<Task[]> {
    try {
      const response = await apiClient.get<Task[]>(`/tasks/date/${date}`);
      return response.data
        .map(deriveDisplayStatus)
        .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch tasks by date");
    }
  }

  async listByCreator(creatorId: string): Promise<Task[]> {
    try {
      const response = await apiClient.get<Task[]>(`/tasks/creator/${creatorId}`);
      return response.data
        .map(deriveDisplayStatus)
        .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch tasks by creator");
    }
  }

  async listByCreatorAndDateRange(creatorId: string, startDate: string, endDate: string): Promise<Task[]> {
    try {
      const response = await apiClient.get<Task[]>(`/tasks/creator/${creatorId}`, {
        params: { startDate, endDate },
      });
      return response.data
        .map(deriveDisplayStatus)
        .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch tasks by creator and date range");
    }
  }

  async create(input: CreateTaskInput): Promise<Task> {
    try {
      const response = await apiClient.post<Task>("/tasks", input);
      return deriveDisplayStatus(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create task");
    }
  }

  async update(id: ID, input: UpdateTaskInput): Promise<Task> {
    try {
      const response = await apiClient.put<Task>(`/tasks/${id}`, input);
      return deriveDisplayStatus(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update task");
    }
  }

  async delete(id: ID): Promise<void> {
    try {
      await apiClient.delete(`/tasks/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete task");
    }
  }
}

export const apiTaskRepository = new ApiTaskRepository();
