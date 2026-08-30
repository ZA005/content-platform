import { addDays, format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DateNavProps {
  date: string;
  onChange: (date: string) => void;
  onAddTask?: () => void;
}

export function DateNav({ date, onChange, onAddTask }: DateNavProps) {
  const parsed = parseISO(date);
  const todayIso = new Date().toISOString().slice(0, 10);

  const go = (offset: number) => {
    onChange(format(addDays(parsed, offset), "yyyy-MM-dd"));
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => go(-1)} aria-label="Previous day">
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onChange(todayIso)} className="min-w-16">
          Today
        </Button>
        <Button variant="outline" size="icon" onClick={() => go(1)} aria-label="Next day">
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="font-display text-sm font-semibold text-foreground truncate">
          {format(parsed, "EEE, MMM d, yyyy")}
        </div>
        {onAddTask && (
          <Button size="sm" onClick={onAddTask}>
            <Plus className="size-4" />
            Add Task
          </Button>
        )}
      </div>
    </div>
  );
}
