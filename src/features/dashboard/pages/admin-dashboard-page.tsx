import { useMemo } from "react";
import { format } from "date-fns";
import { Activity, CalendarClock, CheckCircle2, ListTodo, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingCards, LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { TASK_STATUS } from "@/core/constants";
import { useCreators } from "@/features/creators/hooks/use-creators";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { StatCard } from "../components/stat-card";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function AdminDashboardPage() {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { creators, isLoading: creatorsLoading } = useCreators();

  const todayIso = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const active = tasks.filter(
      (t) => t.status === TASK_STATUS.NOT_STARTED || t.status === TASK_STATUS.IN_PROGRESS || t.status === TASK_STATUS.IN_REVIEW,
    ).length;
    const completed = tasks.filter((t) => t.status === TASK_STATUS.COMPLETED).length;
    const today = tasks.filter((t) => t.scheduledDate === todayIso).length;
    return { active, completed, today };
  }, [tasks, todayIso]);

  const upcoming = useMemo(() => {
    const byDate = new Map<string, number>();
    tasks
      .filter((t) => t.scheduledDate >= todayIso)
      .forEach((t) => byDate.set(t.scheduledDate, (byDate.get(t.scheduledDate) ?? 0) + 1));
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 5);
  }, [tasks, todayIso]);

  const workload = useMemo(() => {
    return creators
      .map((creator) => ({
        creator,
        openCount: tasks.filter(
          (t) => t.creatorId === creator.id && t.status !== TASK_STATUS.COMPLETED,
        ).length,
      }))
      .sort((a, b) => b.openCount - a.openCount);
  }, [creators, tasks]);

  const recentActivity = useMemo(() => {
    return [...tasks]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 6);
  }, [tasks]);

  const isLoading = tasksLoading || creatorsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Daily production overview across your team.</p>
      </div>

      {isLoading ? (
        <LoadingCards count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Creators" value={creators.length} icon={Users} accent="info" />
          <StatCard label="Active Tasks" value={stats.active} icon={ListTodo} accent="primary" />
          <StatCard label="Completed Tasks" value={stats.completed} icon={CheckCircle2} accent="success" />
          <StatCard label="Tasks Today" value={stats.today} icon={CalendarClock} accent="warning" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Creator workload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <LoadingState rows={3} />
            ) : workload.length === 0 ? (
              <EmptyState icon={Users} title="No creators yet" />
            ) : (
              workload.map(({ creator, openCount }) => (
                <div key={creator.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback>{initials(creator.name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm text-foreground">{creator.name}</span>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {openCount} open
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <LoadingState rows={3} />
            ) : upcoming.length === 0 ? (
              <EmptyState icon={CalendarClock} title="Nothing scheduled ahead" />
            ) : (
              upcoming.map(([date, count]) => (
                <div key={date} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{format(new Date(date), "EEEE, MMM d")}</span>
                  <span className="font-mono text-xs text-muted-foreground">{count} task{count !== 1 ? "s" : ""}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <LoadingState rows={4} />
          ) : recentActivity.length === 0 ? (
            <EmptyState icon={Activity} title="No activity yet" />
          ) : (
            recentActivity.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">
                    <span className="font-medium">{task.creator?.name ?? "Unassigned"}</span> · {task.instruction}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Updated {format(new Date(task.updatedAt), "MMM d, h:mm a")}
                  </p>
                </div>
                <StatusBadge status={task.status} className="shrink-0" />
              </div>
            ))
          )}
          <Link to="/admin/tasks" className="inline-block text-xs text-primary hover:underline">
            View all tasks →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
