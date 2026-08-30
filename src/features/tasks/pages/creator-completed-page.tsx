import { useMemo } from "react";
import { format } from "date-fns";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { TASK_STATUS } from "@/core/constants";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useTasks } from "../hooks/use-tasks";

export function CreatorCompletedPage() {
  const { user } = useAuth();
  const { tasks, isLoading } = useTasks({ creatorId: user?.creatorId });

  const completed = useMemo(
    () =>
      tasks
        .filter((t) => t.status === TASK_STATUS.COMPLETED)
        .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate)),
    [tasks],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Completed</h1>
        <p className="text-sm text-muted-foreground">A record of everything you've wrapped up.</p>
      </div>

      {isLoading ? (
        <LoadingState rows={4} />
      ) : completed.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nothing completed yet" description="Finished tasks will show up here." />
      ) : (
        <div className="space-y-3">
          {completed.map((task) => (
            <Card key={task.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{task.instruction}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(task.scheduledDate), "MMMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={task.scriptLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                  >
                    Script <ExternalLink className="size-3" />
                  </a>
                  <StatusBadge status={task.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
