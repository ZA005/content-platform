import { useMemo, useState } from "react";
import { CalendarX2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateNav } from "@/components/shared/date-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { TaskFormModal } from "../../tasks/components/task-form-modal";
import type { TaskFormValues } from "../../tasks/schema";
import { CREATOR_STATUS, TASK_STATUS } from "@/core/constants";
import { useTasks } from "../../tasks/hooks/use-tasks";
import { useCreators } from "../../creators/hooks/use-creators";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function ManagerDashboardPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const { tasks: selectedDateTasks, isLoading: tasksLoading, createTask } = useTasks({ date: selectedDate });
  const { tasks: allTasks, isLoading: allTasksLoading } = useTasks();
  const { creators, isLoading: creatorsLoading } = useCreators();

  const stats = useMemo(() => {
    const activeCount = creators.filter((c) => c.status === CREATOR_STATUS.ACTIVE).length;
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === TASK_STATUS.COMPLETED).length;
    const pendingTasks = allTasks.filter((t) => t.status !== TASK_STATUS.COMPLETED).length;

    return {
      activeCreators: activeCount,
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [creators, allTasks]);

  const isLoading = tasksLoading || allTasksLoading || creatorsLoading;

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
        <h1 className="font-display text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of creators and their task progress.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCreators}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">Today's Tasks</h2>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <DateNav date={selectedDate} onChange={setSelectedDate} onAddTask={() => setTaskFormOpen(true)} />
        </div>

        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${selectedDateTasks.length} task${selectedDateTasks.length !== 1 ? "s" : ""}`}
          </p>

          {isLoading ? (
            <LoadingState rows={3} />
          ) : selectedDateTasks.length === 0 ? (
            <EmptyState icon={CalendarX2} title="No tasks today" description="No tasks are scheduled for this date. Check another day." />
          ) : (
            <div className="space-y-3">
              {selectedDateTasks.map((task) => (
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
