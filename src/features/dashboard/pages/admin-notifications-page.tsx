import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

export function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">Stay on top of task updates across your team.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={Bell}
            title="You're all caught up"
            description="Live notifications aren't wired up yet — this panel is ready for that once a backend is connected."
          />
        </CardContent>
      </Card>
    </div>
  );
}
