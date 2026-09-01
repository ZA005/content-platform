import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateCreatorInput, UpdateCreatorInput } from "@/core/interfaces/repositories";
import type { Creator, ID } from "@/core/types";
import { creatorService } from "../services/creator-service";
import { creatorKeys } from "./query-keys";

export function useCreators() {
  const queryClient = useQueryClient();

  const { data: creators = [], isLoading, error, refetch } = useQuery({
    queryKey: creatorKeys.list(),
    queryFn: () => creatorService.list(),
  });

  const createCreatorMutation = useMutation({
    mutationFn: (input: CreateCreatorInput) => creatorService.create(input),
    onSuccess: () => {
      toast.success("Creator added");
      queryClient.invalidateQueries({ queryKey: creatorKeys.all });
    },
  });

  const updateCreatorMutation = useMutation({
    mutationFn: ({ id, input }: { id: ID; input: UpdateCreatorInput }) => creatorService.update(id, input),
    onSuccess: () => {
      toast.success("Creator updated");
      queryClient.invalidateQueries({ queryKey: creatorKeys.all });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (creator: Creator) => {
      if (creator.status === "active") {
        await creatorService.disable(creator.id);
      } else {
        await creatorService.enable(creator.id);
      }
      return creator;
    },
    onSuccess: (creator) => {
      toast.success(`${creator.name} ${creator.status === "active" ? "disabled" : "enabled"}`);
      queryClient.invalidateQueries({ queryKey: creatorKeys.all });
    },
  });

  const deleteCreatorMutation = useMutation({
    mutationFn: (id: ID) => creatorService.delete(id),
    onSuccess: () => {
      toast.success("Creator removed");
      queryClient.invalidateQueries({ queryKey: creatorKeys.all });
    },
  });

  const createCreator = useCallback((input: CreateCreatorInput) => createCreatorMutation.mutateAsync(input), [createCreatorMutation]);
  const updateCreator = useCallback((id: ID, input: UpdateCreatorInput) => updateCreatorMutation.mutateAsync({ id, input }), [updateCreatorMutation]);
  const toggleStatus = useCallback((creator: Creator) => toggleStatusMutation.mutateAsync(creator), [toggleStatusMutation]);
  const deleteCreator = useCallback((id: ID) => deleteCreatorMutation.mutateAsync(id), [deleteCreatorMutation]);

  return { creators, isLoading, error: error?.message ?? null, refetch, createCreator, updateCreator, toggleStatus, deleteCreator };
}
