import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MonthlyPayoutSummary } from "@/core/types";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { payoutCalculationService } from "@/features/payouts/services/payout-calculation-service";
import { myPayoutKeys } from "./query-keys";

export function useMyPayout(monthParam?: string) {
  const { user } = useAuth();
  const [month, setMonth] = useState<string>(() => {
    if (monthParam) return monthParam;
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: currentPayout = null, isLoading, error } = useQuery({
    queryKey: myPayoutKeys.month(month),
    queryFn: async (): Promise<MonthlyPayoutSummary | null> => {
      if (!user) return null;

      if (user.role === "creator" && user.creatorId) {
        return await payoutCalculationService.calculateCreatorMonthlyPayout(user.creatorId, month);
      } else if (user.role === "manager") {
        return await payoutCalculationService.calculateManagerMonthlyPayout(user.id, month);
      }

      return null;
    },
    enabled: !!user,
  });

  const previousMonth = useCallback(() => {
    const [year, monthStr] = month.split("-");
    const m = parseInt(monthStr) - 1;
    if (m === 0) {
      setMonth(`${parseInt(year) - 1}-12`);
    } else {
      setMonth(`${year}-${String(m).padStart(2, "0")}`);
    }
  }, [month]);

  const nextMonth = useCallback(() => {
    const [year, monthStr] = month.split("-");
    const m = parseInt(monthStr) + 1;
    if (m === 13) {
      setMonth(`${parseInt(year) + 1}-01`);
    } else {
      setMonth(`${year}-${String(m).padStart(2, "0")}`);
    }
  }, [month]);

  const toCurrentMonth = useCallback(() => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    setMonth(currentMonth);
  }, []);

  return { month, currentPayout, isLoading, error: error?.message ?? null, previousMonth, nextMonth, toCurrentMonth };
}
