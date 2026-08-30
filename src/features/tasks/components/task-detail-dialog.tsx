import { format, parseISO } from "date-fns";
import { ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import type { TaskWithCreator } from "@/core/types";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
}: {
  task: TaskWithCreator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle>Task details</DialogTitle>
            <StatusBadge status={task.status} />
          </div>
          <DialogDescription>
            Scheduled for {format(parseISO(task.scheduledDate), "EEEE, MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {task.creator && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3">
              <Avatar>
                <AvatarFallback>{initials(task.creator.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{task.creator.name}</p>
                <p className="text-xs text-muted-foreground">{task.creator.brands.join(", ")}</p>
              </div>
            </div>
          )}

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Script Link
            </p>
            <a
              href={task.scriptLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-sm text-primary hover:underline"
            >
              Open Script <ExternalLink className="size-3.5" />
            </a>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Instruction
            </p>
            <p className="whitespace-pre-wrap text-foreground">{task.instruction}</p>
          </div>

          {task.notes && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notes
              </p>
              <p className="whitespace-pre-wrap text-foreground">{task.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
