import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { payoutConfigurationService } from "@/features/payouts/services/payout-configuration-service";
import { repositoryFactory } from "@/infrastructure/repositories/repository-factory";
import { toast } from "sonner";
import { workScheduleKeys } from "./query-keys";

export function useWorkSchedule() {
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading, error, refetch } = useQuery({
    queryKey: workScheduleKeys.list(),
    queryFn: () => payoutConfigurationService.listWorkSchedules(),
  });

  const updateWorkScheduleMutation = useMutation({
    mutationFn: (input: { userId: string; workingDays: number[] }) => {
      const workScheduleRepo = repositoryFactory.getWorkScheduleRepository();
      return workScheduleRepo.upsert(input.userId, {
        workingDays: input.workingDays,
        customDaysOff: [],
      });
    },
    onSuccess: () => {
      toast.success("Work schedule updated");
      queryClient.invalidateQueries({ queryKey: workScheduleKeys.all });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to update work schedule";
      toast.error(message);
    },
  });

  const deleteWorkScheduleMutation = useMutation({
    mutationFn: (scheduleId: string) => {
      const workScheduleRepo = repositoryFactory.getWorkScheduleRepository();
      return workScheduleRepo.delete(scheduleId);
    },
    onSuccess: () => {
      toast.success("Work schedule deleted");
      queryClient.invalidateQueries({ queryKey: workScheduleKeys.all });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to delete work schedule";
      toast.error(message);
    },
  });

  const updateWorkSchedule = useCallback(
    (userId: string, workingDays: number[]) => updateWorkScheduleMutation.mutateAsync({ userId, workingDays }),
    [updateWorkScheduleMutation],
  );

  const deleteWorkSchedule = useCallback(
    (scheduleId: string) => deleteWorkScheduleMutation.mutateAsync(scheduleId),
    [deleteWorkScheduleMutation],
  );

  return {
    schedules,
    isLoading,
    error: error?.message ?? null,
    isSaving: updateWorkScheduleMutation.isPending || deleteWorkScheduleMutation.isPending,
    updateWorkSchedule,
    deleteWorkSchedule,
    refetch,
  };
}
