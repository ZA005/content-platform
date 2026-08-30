import { useState } from "react";
import { CalendarX2 } from "lucide-react";
import { DateNav } from "@/components/shared/date-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { TASK_STATUS } from "@/core/constants";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { CreatorTaskCard } from "../../tasks/components/creator-task-card";
import { useTasks } from "../../tasks/hooks/use-tasks";

export function CreatorCalendarPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { tasks, isLoading, updateTask } = useTasks({ date: selectedDate, creatorId: user?.creatorId });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">My Content Calendar</h1>
        <p className="text-sm text-muted-foreground">Everything scheduled for you, day by day.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <DateNav date={selectedDate} onChange={setSelectedDate} />
      </div>

      <div>
        <p className="mb-3 text-sm text-muted-foreground">
          {isLoading ? "Loading…" : `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`}
        </p>

        {isLoading ? (
          <LoadingState rows={3} />
        ) : tasks.length === 0 ? (
          <EmptyState icon={CalendarX2} title="No tasks today" description="Enjoy the downtime — check back tomorrow or pick another date." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tasks.map((task) => (
              <CreatorTaskCard
                key={task.id}
                task={task}
                onComplete={(t) => updateTask(t.id, { status: TASK_STATUS.COMPLETED })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
