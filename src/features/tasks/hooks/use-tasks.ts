import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { CreateTaskInput, UpdateTaskInput } from "@/core/interfaces/repositories";
import type { ID, TaskWithCreator } from "@/core/types";
import { taskService } from "../services/task-service";

interface UseTasksOptions {
  date?: string;
  creatorId?: string;
}

export function useTasks(options: UseTasksOptions = {}) {
  const { date, creatorId } = options;
  const [tasks, setTasks] = useState<TaskWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let result: TaskWithCreator[];
      if (date && creatorId) {
        result = (await taskService.listByCreator(creatorId)).filter((t) => t.scheduledDate === date);
      } else if (date) {
        result = await taskService.listByDate(date);
      } else if (creatorId) {
        result = await taskService.listByCreator(creatorId);
      } else {
        result = await taskService.listAll();
      }
      setTasks(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks.");
    } finally {
      setIsLoading(false);
    }
  }, [date, creatorId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createTask = useCallback(
    async (input: CreateTaskInput) => {
      await taskService.create(input);
      toast.success("Task assigned");
      await refetch();
    },
    [refetch],
  );

  const updateTask = useCallback(
    async (id: ID, input: UpdateTaskInput) => {
      await taskService.update(id, input);
      toast.success("Task updated");
      await refetch();
    },
    [refetch],
  );

  const deleteTask = useCallback(
    async (id: ID) => {
      await taskService.delete(id);
      toast.success("Task deleted");
      await refetch();
    },
    [refetch],
  );

  return { tasks, isLoading, error, refetch, createTask, updateTask, deleteTask };
}
