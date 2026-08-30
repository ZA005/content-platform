import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import type { MonthlyPayoutSummary } from "@/core/types";

interface PayoutBreakdownCardProps {
  payout: MonthlyPayoutSummary;
}

export function PayoutBreakdownCard({ payout }: PayoutBreakdownCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout Breakdown</CardTitle>
        <CardDescription>How your payout is calculated</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
            <div>
              <p className="text-sm text-neutral-400">Regular Workday Tasks</p>
              <p className="text-xs text-neutral-500">{payout.regularTasks} tasks</p>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(payout.regularPayoutCentavos)}</p>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
            <div>
              <p className="text-sm text-neutral-400">Day-Off Tasks</p>
              <p className="text-xs text-neutral-500">{payout.dayOffTasks} tasks</p>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(payout.dayOffPayoutCentavos)}</p>
          </div>

          <div className="flex justify-between items-center pt-3">
            <p className="text-sm font-medium">Total Payout</p>
            <p className="text-2xl font-bold text-emerald-500">
              {formatCurrency(payout.totalPayoutCentavos)}
            </p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded p-3 text-xs text-neutral-400">
          <p className="font-medium text-neutral-300 mb-2">Payout Date</p>
          <p>
            {new Date(payout.payoutDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
