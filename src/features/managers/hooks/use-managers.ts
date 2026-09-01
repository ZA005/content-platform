import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { managerService } from "../services/manager-service";
import { managerKeys } from "./query-keys";

export function useManagers() {
  const queryClient = useQueryClient();

  const { data: managers = [], isLoading, refetch } = useQuery({
    queryKey: managerKeys.list(),
    queryFn: () => managerService.listAll(),
  });

  const createManagerMutation = useMutation({
    mutationFn: (data: { name: string; username: string; password: string; avatarUrl?: string }) =>
      managerService.create(data),
    onSuccess: () => {
      toast.success("Manager created successfully");
      queryClient.invalidateQueries({ queryKey: managerKeys.all });
    },
    onError: () => {
      toast.error("Failed to create manager");
    },
  });

  const updateManagerMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        username: string;
        password: string;
        avatarUrl: string;
      }>;
    }) => managerService.update(id, data),
    onSuccess: () => {
      toast.success("Manager updated successfully");
      queryClient.invalidateQueries({ queryKey: managerKeys.all });
    },
    onError: () => {
      toast.error("Failed to update manager");
    },
  });

  const deleteManagerMutation = useMutation({
    mutationFn: (id: string) => managerService.delete(id),
    onSuccess: () => {
      toast.success("Manager deleted successfully");
      queryClient.invalidateQueries({ queryKey: managerKeys.all });
    },
    onError: () => {
      toast.error("Failed to delete manager");
    },
  });

  const createManager = useCallback(
    (data: { name: string; username: string; password: string; avatarUrl?: string }) =>
      createManagerMutation.mutateAsync(data),
    [createManagerMutation],
  );

  const updateManager = useCallback(
    (
      id: string,
      data: Partial<{
        name: string;
        username: string;
        password: string;
        avatarUrl: string;
      }>,
    ) => updateManagerMutation.mutateAsync({ id, data }),
    [updateManagerMutation],
  );

  const deleteManager = useCallback((id: string) => deleteManagerMutation.mutateAsync(id), [deleteManagerMutation]);

  return {
    managers,
    isLoading,
    refetch,
    createManager,
    updateManager,
    deleteManager,
  };
}
