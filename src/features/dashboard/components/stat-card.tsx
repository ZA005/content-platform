import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "primary" | "info" | "success" | "warning" | "danger";
}

const ACCENT_CLASSES: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-primary/15 text-primary",
  info: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
};

export function StatCard({ label, value, icon: Icon, accent = "primary" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", ACCENT_CLASSES[accent])}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="font-display text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
