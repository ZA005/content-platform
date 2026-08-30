import { useNavigate } from "react-router-dom";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PayoutSummaryCards } from "@/features/payouts/components/payout-summary-cards";
import { PayoutMonthCalendar } from "@/features/payouts/components/payout-month-calendar";
import { PayoutBreakdownCard } from "@/features/payouts/components/payout-breakdown-card";
import { payoutCalculationService } from "@/features/payouts/services/payout-calculation-service";
import { Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function PayoutCalendarPage() {
  const navigate = useNavigate();
  const [month, setMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });

  const [payouts, setPayouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const loadPayouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const monthPayouts = await payoutCalculationService.calculateMonthlyPayouts(month);
      setPayouts(monthPayouts);
    } catch (err) {
      console.error("Failed to load payouts:", err);
      setPayouts([]);
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  const monthDate = new Date(`${month}-01`);
  const monthName = monthDate.toLocaleDateString("en-US", { year: "numeric", month: "long" });

  const previousMonth = () => {
    const [year, monthStr] = month.split("-");
    const m = parseInt(monthStr) - 1;
    setMonth(m === 0 ? `${parseInt(year) - 1}-12` : `${year}-${String(m).padStart(2, "0")}`);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    const [year, monthStr] = month.split("-");
    const m = parseInt(monthStr) + 1;
    setMonth(m === 13 ? `${parseInt(year) + 1}-01` : `${year}-${String(m).padStart(2, "0")}`);
    setSelectedDay(null);
  };

  // Calculate monthly totals
  const monthlyTotals = payouts.reduce(
    (acc, payout) => ({
      deliveredTasks: acc.deliveredTasks + payout.deliveredTasks,
      regularTasks: acc.regularTasks + payout.regularTasks,
      dayOffTasks: acc.dayOffTasks + payout.dayOffTasks,
      totalPayout: acc.totalPayout + payout.totalPayoutCentavos,
    }),
    {
      deliveredTasks: 0,
      regularTasks: 0,
      dayOffTasks: 0,
      totalPayout: 0,
    }
  );

  const monthlySummary: any = {
    month,
    deliveredTasks: monthlyTotals.deliveredTasks,
    regularTasks: monthlyTotals.regularTasks,
    dayOffTasks: monthlyTotals.dayOffTasks,
    totalPayoutCentavos: monthlyTotals.totalPayout,
    baseSalaryCentavos: 0,
    regularPayoutCentavos: 0,
    dayOffPayoutCentavos: 0,
    payoutDate: "",
    finalized: false,
    userId: "",
    role: "creator",
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Payout Calendar</h1>
          <p className="text-sm text-neutral-400">
            View monthly payout summaries and configure compensation settings
          </p>
        </div>
        <Button onClick={() => navigate("/admin/payout-configuration")} variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Configure Payout
        </Button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-neutral-900 rounded-lg p-4">
        <Button variant="ghost" size="sm" onClick={previousMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-semibold">{monthName}</h2>
        <Button variant="ghost" size="sm" onClick={nextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      <PayoutSummaryCards payout={monthlySummary} isLoading={isLoading} />

      {/* Calendar */}
      {isLoading ? (
        <LoadingState />
      ) : payouts.length === 0 ? (
        <EmptyState
          title="No payout data for this month"
          description="Configure compensation settings to see payouts."
        />
      ) : (
        <PayoutMonthCalendar month={month} payouts={payouts} onDayClick={setSelectedDay} />
      )}

      {/* Day Detail Modal */}
      {selectedDay && (
        <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {monthName.split(" ")[0]} {selectedDay}, {monthDate.getFullYear()}
              </DialogTitle>
              <DialogDescription>Payout details for this day</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {payouts.map((payout) => (
                <PayoutBreakdownCard key={payout.userId} payout={payout} />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
