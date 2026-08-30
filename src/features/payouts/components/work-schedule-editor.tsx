import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { WorkSchedule } from "@/core/types";

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface WorkScheduleEditorProps {
  schedule: WorkSchedule | null;
  onUpdate?: (workingDays: number[]) => Promise<void>;
  isLoading?: boolean;
}

export function WorkScheduleEditor({ schedule, onUpdate, isLoading }: WorkScheduleEditorProps) {
  const workingDays = schedule?.workingDays || [1, 2, 3, 4, 5];

  const handleToggle = async (day: number) => {
    const newDays = workingDays.includes(day)
      ? workingDays.filter((d) => d !== day)
      : [...workingDays, day].sort();

    if (onUpdate) {
      await onUpdate(newDays);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Schedule</CardTitle>
        <CardDescription>Days you typically work</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dayLabels.map((label, day) => (
            <div key={day} className="flex items-center justify-between">
              <Label htmlFor={`day-${day}`} className="cursor-pointer">
                {label}
              </Label>
              <Switch
                id={`day-${day}`}
                checked={workingDays.includes(day)}
                onCheckedChange={() => handleToggle(day)}
                disabled={isLoading}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
