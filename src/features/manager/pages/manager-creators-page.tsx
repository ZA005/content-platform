import { useMemo } from "react";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { CREATOR_STATUS, TASK_STATUS } from "@/core/constants";
import { useCreators } from "@/features/creators/hooks/use-creators";
import { useTasks } from "@/features/tasks/hooks/use-tasks";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function ManagerCreatorsPage() {
  const { creators, isLoading: creatorsLoading } = useCreators();
  const { tasks } = useTasks();
  const isLoading = creatorsLoading;

  const creatorStats = useMemo(() => {
    const stats = new Map<string, { completed: number; total: number }>();
    creators.forEach((creator) => {
      stats.set(creator.id, { completed: 0, total: 0 });
    });
    tasks.forEach((task) => {
      const stat = stats.get(task.creatorId);
      if (stat) {
        stat.total += 1;
        if (task.status === TASK_STATUS.COMPLETED) {
          stat.completed += 1;
        }
      }
    });
    return stats;
  }, [creators, tasks]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Creators</h1>
        <p className="text-sm text-muted-foreground">Monitor creator progress and assign tasks.</p>
      </div>

      {isLoading ? (
        <LoadingState rows={4} />
      ) : creators.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No creators yet"
          description="Contact your admin to create creators in the system."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead className="hidden sm:table-cell">Brands</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creators.map((creator) => {
                const stat = creatorStats.get(creator.id);
                const completion = stat && stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;

                return (
                  <TableRow key={creator.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                          <AvatarFallback className="text-xs sm:text-sm">{initials(creator.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{creator.name}</p>
                          <p className="truncate text-xs font-mono text-muted-foreground sm:hidden">
                            {creator.username}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {creator.brands.map((brand) => (
                          <span key={brand} className="inline-block rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                            {brand}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={creator.status === CREATOR_STATUS.ACTIVE ? "success" : "outline"}>
                        {creator.status === CREATOR_STATUS.ACTIVE ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-foreground">
                          {stat?.completed ?? 0}/{stat?.total ?? 0}
                        </div>
                        <div className="text-xs text-muted-foreground">{completion}% complete</div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
