import { useCallback, useEffect, useState } from "react";
import type { PayoutConfiguration } from "@/core/types";
import { payoutConfigurationService } from "@/features/payouts/services/payout-configuration-service";
import { toast } from "sonner";

export function usePayoutConfiguration() {
  const [config, setConfig] = useState<PayoutConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loaded = await payoutConfigurationService.getConfiguration();
      setConfig(loaded);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load payout configuration";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updatePayoutDay = useCallback(
    async (day: number) => {
      if (!config) return;

      setIsSaving(true);
      try {
        const updated = await payoutConfigurationService.updateConfiguration({
          payoutDayOfMonth: day,
        });
        setConfig(updated);
        toast.success("Payout day updated");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update payout day";
        toast.error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [config]
  );

  const updateDefaultMultiplier = useCallback(
    async (multiplier: number) => {
      if (!config) return;

      setIsSaving(true);
      try {
        const updated = await payoutConfigurationService.updateConfiguration({
          defaultDayOffMultiplier: multiplier,
        });
        setConfig(updated);
        toast.success("Day-off multiplier updated");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update day-off multiplier";
        toast.error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [config]
  );

  return {
    config,
    isLoading,
    error,
    isSaving,
    updatePayoutDay,
    updateDefaultMultiplier,
    refetch: loadConfig,
  };
}
