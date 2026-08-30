import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Manager } from "@/core/types";
import { managerService } from "../services/manager-service";

export function useManagers() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await managerService.listAll();
      setManagers(data);
    } catch (error) {
      toast.error("Failed to load managers");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createManager = useCallback(
    async (data: { name: string; username: string; password: string; avatarUrl?: string }) => {
      try {
        await managerService.create(data);
        toast.success("Manager created successfully");
        await refetch();
      } catch (error) {
        throw error instanceof Error ? error : new Error("Failed to create manager");
      }
    },
    [refetch],
  );

  const updateManager = useCallback(
    async (
      id: string,
      data: Partial<{
        name: string;
        username: string;
        password: string;
        avatarUrl: string;
      }>,
    ) => {
      try {
        await managerService.update(id, data);
        toast.success("Manager updated successfully");
        await refetch();
      } catch (error) {
        throw error instanceof Error ? error : new Error("Failed to update manager");
      }
    },
    [refetch],
  );

  const deleteManager = useCallback(
    async (id: string) => {
      try {
        await managerService.delete(id);
        toast.success("Manager deleted successfully");
        await refetch();
      } catch (error) {
        toast.error("Failed to delete manager");
      }
    },
    [refetch],
  );

  return {
    managers,
    isLoading,
    refetch,
    createManager,
    updateManager,
    deleteManager,
  };
}
