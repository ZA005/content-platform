import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { CreateCreatorInput, UpdateCreatorInput } from "@/core/interfaces/repositories";
import type { Creator, ID } from "@/core/types";
import { creatorService } from "../services/creator-service";

export function useCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCreators(await creatorService.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load creators.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createCreator = useCallback(
    async (input: CreateCreatorInput) => {
      await creatorService.create(input);
      toast.success("Creator added");
      await refetch();
    },
    [refetch],
  );

  const updateCreator = useCallback(
    async (id: ID, input: UpdateCreatorInput) => {
      await creatorService.update(id, input);
      toast.success("Creator updated");
      await refetch();
    },
    [refetch],
  );

  const toggleStatus = useCallback(
    async (creator: Creator) => {
      if (creator.status === "active") {
        await creatorService.disable(creator.id);
        toast.success(`${creator.name} disabled`);
      } else {
        await creatorService.enable(creator.id);
        toast.success(`${creator.name} enabled`);
      }
      await refetch();
    },
    [refetch],
  );

  const deleteCreator = useCallback(
    async (id: ID) => {
      await creatorService.delete(id);
      toast.success("Creator removed");
      await refetch();
    },
    [refetch],
  );

  return { creators, isLoading, error, refetch, createCreator, updateCreator, toggleStatus, deleteCreator };
}
