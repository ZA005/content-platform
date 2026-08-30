import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { TASK_STATUS } from "@/core/constants";
import type { Task } from "@/core/types";

interface CreatorTaskCardProps {
  task: Task;
  onComplete: (task: Task) => void;
  onStatusChange?: (taskId: string, status: Task["status"]) => void;
}

export function CreatorTaskCard({ task, onComplete, onStatusChange }: CreatorTaskCardProps) {
  const isDone = task.status === TASK_STATUS.COMPLETED;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Brand:</span>
              <span className="text-sm font-semibold text-foreground">{task.brand}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <a
                href={task.scriptLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-sm text-primary hover:underline w-fit"
              >
                Open Script <ExternalLink className="size-3.5" />
              </a>
              {task.referenceLink && (
                <a
                  href={task.referenceLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-sm text-primary hover:underline w-fit"
                >
                  Open Reference <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          </div>
          <StatusBadge status={task.status} />
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Instruction</p>
          <p className="text-sm text-foreground">{task.instruction}</p>
        </div>

        {task.notes && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
            <p className="text-sm text-muted-foreground">{task.notes}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {!isDone && (
            <Button size="sm" variant="secondary" onClick={() => onComplete(task)}>
              Mark Complete
            </Button>
          )}
          {isDone && onStatusChange && (
            <Button size="sm" variant="outline" onClick={() => onStatusChange(task.id, TASK_STATUS.NOT_STARTED)}>
              Revert to Open
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
