import { useState } from "react";
import { CalendarX2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DateNav } from "@/components/shared/date-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { TaskFormModal } from "../../tasks/components/task-form-modal";
import type { TaskFormValues } from "../../tasks/schema";
import { useTasks } from "../../tasks/hooks/use-tasks";
import { useCreators } from "../../creators/hooks/use-creators";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function ManagerCalendarPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const { tasks, isLoading, createTask } = useTasks({ date: selectedDate });
  const { creators } = useCreators();

  const handleCreateTask = async (values: TaskFormValues) => {
    await createTask({
      ...values,
      creatorId: values.creatorId,
      scheduledDate: selectedDate,
    });
    setTaskFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Task Calendar</h1>
        <p className="text-sm text-muted-foreground">View all creator tasks scheduled for each day.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <DateNav date={selectedDate} onChange={setSelectedDate} onAddTask={() => setTaskFormOpen(true)} />
      </div>

      <div>
        <p className="mb-3 text-sm text-muted-foreground">
          {isLoading ? "Loading…" : `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`}
        </p>

        {isLoading ? (
          <LoadingState rows={3} />
        ) : tasks.length === 0 ? (
          <EmptyState icon={CalendarX2} title="No tasks today" description="No tasks are scheduled for this date. Check another day." />
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">{initials(task.creator?.name || "Unknown")}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{task.creator?.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{task.creator?.username}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Brand:</span>
                          <Badge variant="secondary" className="text-xs">{task.brand}</Badge>
                        </div>

                        <div>
                          <p className="text-sm text-foreground line-clamp-2">{task.instruction}</p>
                        </div>

                        {task.notes && (
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Notes</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{task.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <StatusBadge status={task.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <TaskFormModal
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        creators={creators}
        defaultDate={selectedDate}
        onSubmit={handleCreateTask}
      />
    </div>
  );
}
