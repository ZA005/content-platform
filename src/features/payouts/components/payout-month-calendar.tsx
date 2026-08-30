import { eachDayOfInterval, endOfMonth, getDay, startOfMonth } from "date-fns";
import { Card } from "@/components/ui/card";
import type { MonthlyPayoutSummary } from "@/core/types";
import { formatCurrency } from "@/lib/currency";

interface PayoutMonthCalendarProps {
  month: string;
  payouts: MonthlyPayoutSummary[];
  onDayClick: (day: number) => void;
}

export function PayoutMonthCalendar({ month, payouts, onDayClick }: PayoutMonthCalendarProps) {
  const [year, monthStr] = month.split("-");
  const startDate = startOfMonth(new Date(`${year}-${monthStr}-01`));
  const endDate = endOfMonth(startDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const firstDayOfWeek = getDay(startDate);

  // Calculate total payout for each day
  const payoutByDay: Record<number, MonthlyPayoutSummary[]> = {};
  payouts.forEach((payout) => {
    const day = new Date(payout.month + "-01").getDate();
    if (!payoutByDay[day]) payoutByDay[day] = [];
    payoutByDay[day].push(payout);
  });

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-neutral-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {[...Array(firstDayOfWeek)].map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {days.map((date) => {
            const dayOfMonth = date.getDate();
            const dayPayouts = payoutByDay[dayOfMonth] || [];
            const totalPayout = dayPayouts.reduce((sum, p) => sum + p.totalPayoutCentavos, 0);
            const totalTasks = dayPayouts.reduce((sum, p) => sum + p.deliveredTasks, 0);

            return (
              <button
                key={dayOfMonth}
                onClick={() => onDayClick(dayOfMonth)}
                className="aspect-square bg-neutral-900 hover:bg-neutral-800 rounded border border-neutral-800 hover:border-neutral-700 p-2 text-left transition-colors flex flex-col"
              >
                <div className="text-sm font-semibold text-white">{dayOfMonth}</div>
                {totalTasks > 0 && (
                  <div className="text-xs text-neutral-400 mt-1">
                    {totalTasks} task{totalTasks !== 1 ? "s" : ""}
                  </div>
                )}
                {totalPayout > 0 && (
                  <div className="text-xs text-emerald-400 mt-auto font-medium">
                    {formatCurrency(totalPayout)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
