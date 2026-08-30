import { useCallback, useEffect, useState } from "react";
import type { CompensationProfile, Creator, ID, Manager } from "@/core/types";
import { payoutConfigurationService } from "@/features/payouts/services/payout-configuration-service";
import { repositoryFactory } from "@/infrastructure/repositories/repository-factory";
import { toast } from "sonner";

interface CompensationWithUser extends CompensationProfile {
  userName?: string;
}

export function useCompensation() {
  const [compensations, setCompensations] = useState<CompensationWithUser[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [comps, creatorsData, managersData] = await Promise.all([
        payoutConfigurationService.listCompensation(),
        repositoryFactory.getCreatorRepository().list(),
        repositoryFactory.getManagerRepository().list(),
      ]);

      setCreators(creatorsData);
      setManagers(managersData);

      // Enrich compensations with user names
      const enriched = comps.map((comp: CompensationProfile) => {
        const creator = creatorsData.find((c: Creator) => c.id === comp.userId);
        const manager = managersData.find((m: Manager) => m.id === comp.userId);
        return {
          ...comp,
          userName: creator?.name || manager?.name || "Unknown",
        };
      });

      setCompensations(enriched);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load compensation data";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateCompensation = useCallback(
    async (userId: ID, baseSalaryPesos: number, dayOffMultiplier?: number) => {
      setIsSaving(true);
      try {
        const creator = creators.find((c: Creator) => c.id === userId);
        const manager = managers.find((m: Manager) => m.id === userId);
        const role = creator ? ("creator" as const) : manager ? ("manager" as const) : null;

        if (!role) {
          throw new Error("User not found");
        }

        const baseSalaryCentavos = Math.round(baseSalaryPesos * 100);
        const compensationRepo = repositoryFactory.getCompensationRepository();

        await compensationRepo.upsert(userId, role, {
          baseSalaryCentavos,
          dayOffMultiplier,
        });

        await loadData();
        toast.success("Compensation updated");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update compensation";
        toast.error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [creators, managers, loadData]
  );

  return {
    compensations,
    creators,
    managers,
    isLoading,
    error,
    isSaving,
    updateCompensation,
    refetch: loadData,
  };
}
