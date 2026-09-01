import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CompensationProfile, Creator, ID, Manager } from "@/core/types";
import { payoutConfigurationService } from "@/features/payouts/services/payout-configuration-service";
import { repositoryFactory } from "@/infrastructure/repositories/repository-factory";
import { toast } from "sonner";
import { compensationKeys } from "./query-keys";

interface CompensationWithUser extends CompensationProfile {
  userName?: string;
}

interface CompensationDataResponse {
  compensations: CompensationWithUser[];
  creators: Creator[];
  managers: Manager[];
}

export function useCompensation() {
  const queryClient = useQueryClient();

  const { data = { compensations: [], creators: [], managers: [] }, isLoading, error, refetch } = useQuery({
    queryKey: compensationKeys.list(),
    queryFn: async (): Promise<CompensationDataResponse> => {
      const [comps, creatorsData, managersData] = await Promise.all([
        payoutConfigurationService.listCompensation(),
        repositoryFactory.getCreatorRepository().list(),
        repositoryFactory.getManagerRepository().list(),
      ]);

      const enriched = comps.map((comp: CompensationProfile) => {
        const creator = creatorsData.find((c: Creator) => c.id === comp.userId);
        const manager = managersData.find((m: Manager) => m.id === comp.userId);
        return {
          ...comp,
          userName: creator?.name || manager?.name || "Unknown",
        };
      });

      return { compensations: enriched, creators: creatorsData, managers: managersData };
    },
  });

  const { compensations, creators, managers } = data;

  const updateCompensationMutation = useMutation({
    mutationFn: async (input: { userId: ID; baseSalaryDollars: number; dayOffMultiplier?: number }) => {
      const creator = creators.find((c: Creator) => c.id === input.userId);
      const manager = managers.find((m: Manager) => m.id === input.userId);
      const role = creator ? ("creator" as const) : manager ? ("manager" as const) : null;

      if (!role) {
        throw new Error("User not found");
      }

      const baseSalaryCentavos = Math.round(input.baseSalaryDollars * 100);
      const compensationRepo = repositoryFactory.getCompensationRepository();

      await compensationRepo.upsert(input.userId, role, {
        baseSalaryCentavos,
        dayOffMultiplier: input.dayOffMultiplier,
      });
    },
    onSuccess: () => {
      toast.success("Compensation updated");
      queryClient.invalidateQueries({ queryKey: compensationKeys.all });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to update compensation";
      toast.error(message);
    },
  });

  const deleteCompensationMutation = useMutation({
    mutationFn: (compensationId: ID) => {
      const compensationRepo = repositoryFactory.getCompensationRepository();
      return compensationRepo.delete(compensationId);
    },
    onSuccess: () => {
      toast.success("Compensation profile removed");
      queryClient.invalidateQueries({ queryKey: compensationKeys.all });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to remove compensation";
      toast.error(message);
    },
  });

  const updateCompensation = useCallback(
    (userId: ID, baseSalaryDollars: number, dayOffMultiplier?: number) =>
      updateCompensationMutation.mutateAsync({ userId, baseSalaryDollars, dayOffMultiplier }),
    [updateCompensationMutation],
  );

  const deleteCompensation = useCallback(
    (compensationId: ID) => deleteCompensationMutation.mutateAsync(compensationId),
    [deleteCompensationMutation],
  );

  return {
    compensations,
    creators,
    managers,
    isLoading,
    error: error?.message ?? null,
    isSaving: updateCompensationMutation.isPending || deleteCompensationMutation.isPending,
    updateCompensation,
    deleteCompensation,
    refetch,
  };
}
