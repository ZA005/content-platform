import { TASK_STATUS, TASK_STATUS_LABELS } from "@/core/constants";
import type { TaskStatus } from "@/core/types";
import { cn } from "@/lib/utils";

const DOT_COLOR: Record<TaskStatus, string> = {
  [TASK_STATUS.NOT_STARTED]: "bg-muted-foreground",
  [TASK_STATUS.IN_PROGRESS]: "bg-info",
  [TASK_STATUS.IN_REVIEW]: "bg-warning",
  [TASK_STATUS.COMPLETED]: "bg-success",
  [TASK_STATUS.OVERDUE]: "bg-danger",
};

const TEXT_COLOR: Record<TaskStatus, string> = {
  [TASK_STATUS.NOT_STARTED]: "text-muted-foreground",
  [TASK_STATUS.IN_PROGRESS]: "text-info",
  [TASK_STATUS.IN_REVIEW]: "text-warning",
  [TASK_STATUS.COMPLETED]: "text-success",
  [TASK_STATUS.OVERDUE]: "text-danger",
};

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium",
        TEXT_COLOR[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT_COLOR[status], status === "in_progress" && "tally-glow")} />
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}
