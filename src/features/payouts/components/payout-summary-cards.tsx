import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import type { MonthlyPayoutSummary } from "@/core/types";

interface PayoutSummaryCardsProps {
  payout: MonthlyPayoutSummary | null;
  isLoading?: boolean;
}

export function PayoutSummaryCards({ payout, isLoading }: PayoutSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium h-5 bg-neutral-700 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-neutral-700 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!payout) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Delivered Tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-400">—</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cards = [
    { label: "Delivered Tasks", value: payout.deliveredTasks.toString() },
    { label: "Regular Tasks", value: payout.regularTasks.toString() },
    { label: "Day-Off Tasks", value: payout.dayOffTasks.toString() },
    { label: "Total Payout", value: formatCurrency(payout.totalPayoutCentavos) },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">{card.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
