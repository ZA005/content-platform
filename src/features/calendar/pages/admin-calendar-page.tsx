import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, ExternalLink, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { TaskFormModal } from "@/features/tasks/components/task-form-modal";
import type { TaskFormValues } from "@/features/tasks/schema";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { useCreators } from "@/features/creators/hooks/use-creators";

export function AdminCalendarPage() {
  const [selected, setSelected] = useState<Date>(new Date());
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const selectedIso = format(selected, "yyyy-MM-dd");
  const { tasks, isLoading, createTask } = useTasks({ date: selectedIso });
  const { creators } = useCreators();

  const { tasks: monthTasks } = useTasks();
  const scheduledDates = useMemo(() => {
    const set = new Set(monthTasks.map((t) => t.scheduledDate));
    return Array.from(set).map((d) => new Date(d));
  }, [monthTasks]);

  const handleCreateTask = async (values: TaskFormValues) => {
    await createTask({
      ...values,
      creatorId: values.creatorId,
      scheduledDate: selectedIso,
    });
    setTaskFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-sm text-muted-foreground">Overview of scheduled production across your team.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <Card className="w-fit">
          <CardContent className="p-2">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(date) => date && setSelected(date)}
              modifiers={{ scheduled: scheduledDates }}
              modifiersClassNames={{
                scheduled:
                  "after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle>{format(selected, "EEEE, MMMM d, yyyy")}</CardTitle>
            <Button size="sm" onClick={() => setTaskFormOpen(true)}>
              <Plus className="size-4" />
              Add Task
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <LoadingState rows={3} />
            ) : tasks.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Nothing scheduled"
                description="No tasks are scheduled for this date."
              />
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{task.creator?.name ?? "Unassigned"}</p>
                    <p className="truncate text-sm text-muted-foreground">{task.instruction}</p>
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
                </div>
              ))
            )}
            <Link to="/admin/tasks" className="inline-block text-xs text-primary hover:underline">
              Manage tasks for this day →
            </Link>
          </CardContent>
        </Card>
      </div>

      <TaskFormModal
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        creators={creators}
        defaultDate={selectedIso}
        onSubmit={handleCreateTask}
      />
    </div>
  );
}
