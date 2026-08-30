import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useMyPayout } from "@/features/payouts/hooks/use-my-payout";
import { PayoutSummaryCards } from "@/features/payouts/components/payout-summary-cards";
import { PayoutBreakdownCard } from "@/features/payouts/components/payout-breakdown-card";
import { PayoutExplanation } from "@/features/payouts/components/payout-explanation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MyPayoutPage() {
  const { user } = useAuth();
  const { month, currentPayout, isLoading, error, previousMonth, nextMonth, toCurrentMonth } =
    useMyPayout();

  if (!user) {
    return <LoadingState />;
  }

  const monthDate = new Date(`${month}-01`);
  const monthName = monthDate.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  const currentMonth = new Date().getMonth() === monthDate.getMonth();

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Payout</h1>
        <p className="text-sm text-neutral-400">View your compensation details and payout history</p>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-neutral-900 rounded-lg p-4">
        <Button variant="ghost" size="sm" onClick={previousMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-semibold">{monthName}</h2>
          {currentMonth && <p className="text-xs text-neutral-500">Current month</p>}
        </div>
        <div className="flex gap-2">
          {!currentMonth && (
            <Button variant="outline" size="sm" onClick={toCurrentMonth}>
              Today
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && <LoadingState />}

      {/* Content */}
      {!isLoading && !error && currentPayout ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <PayoutSummaryCards payout={currentPayout} />

          {/* Breakdown Card */}
          <PayoutBreakdownCard payout={currentPayout} />

          {/* Explanation */}
          <PayoutExplanation payout={currentPayout} />

          {/* Note about estimated vs finalized */}
          <div className="bg-neutral-900 rounded-lg p-4 text-xs text-neutral-400">
            <p className="font-medium text-neutral-300 mb-1">
              {currentPayout.finalized ? "✓ Finalized Payout" : "Estimated Payout"}
            </p>
            <p>
              {currentPayout.finalized
                ? "This payout has been finalized and will not change."
                : "This is an estimated payout based on current configuration. Final payout will be determined when the month is finalized."}
            </p>
          </div>
        </div>
      ) : !isLoading && !error ? (
        <EmptyState
          title="No payout data available"
          description="Your compensation has not been configured yet. Contact your administrator to set up your salary."
        />
      ) : null}
    </div>
  );
}
