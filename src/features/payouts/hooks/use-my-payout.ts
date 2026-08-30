import { useCallback, useEffect, useState } from "react";
import type { MonthlyPayoutSummary } from "@/core/types";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { payoutCalculationService } from "@/features/payouts/services/payout-calculation-service";

export function useMyPayout(monthParam?: string) {
  const { user } = useAuth();
  const [month, setMonth] = useState<string>(() => {
    if (monthParam) return monthParam;
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });

  const [currentPayout, setCurrentPayout] = useState<MonthlyPayoutSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayout = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      if (user.role === "creator" && user.creatorId) {
        const payout = await payoutCalculationService.calculateCreatorMonthlyPayout(
          user.creatorId,
          month
        );
        setCurrentPayout(payout);
      } else if (user.role === "manager") {
        const payout = await payoutCalculationService.calculateManagerMonthlyPayout(user.id, month);
        setCurrentPayout(payout);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payout data");
    } finally {
      setIsLoading(false);
    }
  }, [user, month]);

  useEffect(() => {
    loadPayout();
  }, [loadPayout]);

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
    setMonth(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);
  }, []);

  return { month, currentPayout, isLoading, error, previousMonth, nextMonth, toCurrentMonth };
}
