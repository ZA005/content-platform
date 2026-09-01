import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateTaskInput, UpdateTaskInput } from "@/core/interfaces/repositories";
import type { ID, TaskWithCreator } from "@/core/types";
import { taskService } from "../services/task-service";
import { taskKeys } from "./query-keys";

interface UseTasksOptions {
  date?: string;
  creatorId?: string;
}

export function useTasks(options: UseTasksOptions = {}) {
  const { date, creatorId } = options;
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: taskKeys.list(options),
    queryFn: async () => {
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
      return result;
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => taskService.create(input),
    onSuccess: () => {
      toast.success("Task assigned");
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, input }: { id: ID; input: UpdateTaskInput }) => taskService.update(id, input),
    onSuccess: () => {
      toast.success("Task updated");
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: ID) => taskService.delete(id),
    onSuccess: () => {
      toast.success("Task deleted");
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });

  const createTask = useCallback((input: CreateTaskInput) => createTaskMutation.mutateAsync(input), [createTaskMutation]);
  const updateTask = useCallback((id: ID, input: UpdateTaskInput) => updateTaskMutation.mutateAsync({ id, input }), [updateTaskMutation]);
  const deleteTask = useCallback((id: ID) => deleteTaskMutation.mutateAsync(id), [deleteTaskMutation]);

  return {
    tasks,
    isLoading,
    error: error?.message ?? null,
    refetch,
    createTask,
    updateTask,
    deleteTask,
  };
}
