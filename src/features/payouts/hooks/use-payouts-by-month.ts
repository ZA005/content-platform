import { useQuery } from "@tanstack/react-query";
import { payoutCalculationService } from "@/features/payouts/services/payout-calculation-service";
import { payoutKeys } from "./query-keys";

export function usePayoutsByMonth(month: string) {
  const { data: payouts = [], isLoading, error, refetch } = useQuery({
    queryKey: payoutKeys.month(month),
    queryFn: async () => {
      const dailyMap = await payoutCalculationService.calculateDailyPayoutsByDate(month);
      const allPayouts: any[] = [];
      for (const [date, creators] of dailyMap) {
        allPayouts.push(...creators.map((c) => ({ ...c, date })));
      }
      return allPayouts;
    },
  });

  return { payouts, isLoading, error, refetch };
}
