import { EmptyState } from "@/components/shared/empty-state";

export function PayoutConfigurationPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Payout Configuration</h1>
        <p className="text-sm text-neutral-400">
          Configure payout settings, salaries, and work schedules
        </p>
      </div>

      <EmptyState
        title="Configuration coming soon"
        description="Payout configuration tools will be available here."
      />
    </div>
  );
}
