import { useQuery } from "@tanstack/react-query";
import { payoutCalculationService } from "@/features/payouts/services/payout-calculation-service";
import { payoutKeys } from "./query-keys";

export function usePayoutsByMonth(month: string) {
  const { data: payouts = [], isLoading, error, refetch } = useQuery({
    queryKey: payoutKeys.month(month),
    queryFn: async () => {
      try {
        const dailyMap = await payoutCalculationService.calculateDailyPayoutsByDate(month);
        const allPayouts: any[] = [];
        for (const [date, creators] of dailyMap) {
          allPayouts.push(...creators.map((c) => ({ ...c, date })));
        }
        return allPayouts;
      } catch (err) {
        console.error("Error calculating payouts for month:", month, err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes to be consistent across the app
  });

  return { payouts, isLoading, error: error?.message ?? null, refetch };
}
