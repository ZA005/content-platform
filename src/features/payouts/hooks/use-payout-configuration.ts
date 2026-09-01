import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { payoutConfigurationService } from "@/features/payouts/services/payout-configuration-service";
import { toast } from "sonner";
import { payoutConfigurationKeys } from "./query-keys";

export function usePayoutConfiguration() {
  const queryClient = useQueryClient();

  const { data: config = null, isLoading, error, refetch } = useQuery({
    queryKey: payoutConfigurationKeys.detail(),
    queryFn: () => payoutConfigurationService.getConfiguration(),
  });

  const updatePayoutDayMutation = useMutation({
    mutationFn: (day: number) => payoutConfigurationService.updateConfiguration({ payoutDayOfMonth: day }),
    onSuccess: () => {
      toast.success("Payout day updated");
      queryClient.invalidateQueries({ queryKey: payoutConfigurationKeys.all });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to update payout day";
      toast.error(message);
    },
  });

  const updateDefaultMultiplierMutation = useMutation({
    mutationFn: (multiplier: number) =>
      payoutConfigurationService.updateConfiguration({ defaultDayOffMultiplier: multiplier }),
    onSuccess: () => {
      toast.success("Day-off multiplier updated");
      queryClient.invalidateQueries({ queryKey: payoutConfigurationKeys.all });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to update day-off multiplier";
      toast.error(message);
    },
  });

  const updatePayoutDay = useCallback((day: number) => updatePayoutDayMutation.mutateAsync(day), [updatePayoutDayMutation]);

  const updateDefaultMultiplier = useCallback(
    (multiplier: number) => updateDefaultMultiplierMutation.mutateAsync(multiplier),
    [updateDefaultMultiplierMutation],
  );

  return {
    config,
    isLoading,
    error: error?.message ?? null,
    isSaving: updatePayoutDayMutation.isPending || updateDefaultMultiplierMutation.isPending,
    updatePayoutDay,
    updateDefaultMultiplier,
    refetch,
  };
}
