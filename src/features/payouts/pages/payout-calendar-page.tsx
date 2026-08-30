import { EmptyState } from "@/components/shared/empty-state";

export function PayoutCalendarPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Payout Calendar</h1>
        <p className="text-sm text-neutral-400">
          View monthly payout summaries and configure compensation settings
        </p>
      </div>

      <EmptyState
        title="Payout calendar coming soon"
        description="The payout calendar will be available here. Configure payout settings to get started."
      />
    </div>
  );
}
