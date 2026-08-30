import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildExplanationLines } from "@/features/payouts/domain/payout-calculator";
import type { MonthlyPayoutSummary } from "@/core/types";

interface PayoutExplanationProps {
  payout: MonthlyPayoutSummary;
}

export function PayoutExplanation({ payout }: PayoutExplanationProps) {
  const lines = buildExplanationLines(
    payout.baseSalaryCentavos,
    1.5, // dayOffMultiplier - TODO: pass this from config
    payout.regularTasks,
    payout.dayOffTasks,
    payout.regularPayoutCentavos,
    payout.dayOffPayoutCentavos,
    payout.totalPayoutCentavos
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>How Your Payout Is Calculated</CardTitle>
        <CardDescription>Transparent breakdown of your compensation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lines.map((line, index) => (
            <div key={index} className="flex items-start gap-3 text-sm">
              <div className="text-emerald-500 font-bold mt-0.5 flex-shrink-0">{index + 1}.</div>
              <p className="text-neutral-300">{line}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
