import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/features/auth/hooks/use-auth";

export function MyPayoutPage() {
  const { user } = useAuth();

  if (!user) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Payout</h1>
        <p className="text-sm text-neutral-400">View your compensation details and payout history</p>
      </div>

      <EmptyState
        title="Payout information coming soon"
        description="Payout details and history will appear here once configured by your administrator."
      />
    </div>
  );
}
