import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { TASK_STATUS } from "@/core/constants";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { CreatorTaskCard } from "../components/creator-task-card";
import { useTasks } from "../hooks/use-tasks";

export function CreatorTasksPage() {
  const { user } = useAuth();
  const { tasks, isLoading, updateTask } = useTasks({ creatorId: user?.creatorId });
  const [confirmCompleteAll, setConfirmCompleteAll] = useState(false);

  const openTasks = useMemo(
    () => tasks.filter((t) => t.status !== TASK_STATUS.COMPLETED),
    [tasks],
  );

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === TASK_STATUS.COMPLETED),
    [tasks],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof openTasks>();
    openTasks.forEach((task) => {
      const list = map.get(task.scheduledDate) ?? [];
      list.push(task);
      map.set(task.scheduledDate, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [openTasks]);

  const completeAllTasks = () => {
    openTasks.forEach((task) => {
      updateTask(task.id, { status: TASK_STATUS.COMPLETED });
    });
    setConfirmCompleteAll(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">My Tasks</h1>
          <p className="text-sm text-muted-foreground">All open work assigned to you, across every date.</p>
        </div>
        {openTasks.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => setConfirmCompleteAll(true)}>
            Complete All Tasks
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState rows={4} />
      ) : openTasks.length === 0 ? (
        <EmptyState icon={ListTodo} title="Nothing open" description="You're all caught up — new tasks will show up here." />
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, dateTasks]) => (
            <div key={date}>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {format(new Date(date), "EEEE, MMMM d, yyyy")}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {dateTasks.map((task) => (
                  <CreatorTaskCard
                    key={task.id}
                    task={task}
                    onComplete={(t) => updateTask(t.id, { status: TASK_STATUS.COMPLETED })}
                    onStatusChange={(taskId, status) => updateTask(taskId, { status })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">Completed Tasks</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {completedTasks.map((task) => (
              <CreatorTaskCard
                key={task.id}
                task={task}
                onComplete={(t) => updateTask(t.id, { status: TASK_STATUS.COMPLETED })}
                onStatusChange={(taskId, status) => updateTask(taskId, { status })}
              />
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmCompleteAll}
        onOpenChange={setConfirmCompleteAll}
        title="Complete all tasks?"
        description={`This will mark ${openTasks.length} task${openTasks.length !== 1 ? "s" : ""} as complete. You can revert individual tasks if needed.`}
        confirmLabel="Complete All"
        onConfirm={completeAllTasks}
      />
    </div>
  );
}
