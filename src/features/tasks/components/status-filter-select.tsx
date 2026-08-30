import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_STATUS, TASK_STATUS_LABELS } from "@/core/constants";

export const ALL_STATUSES = "all";

export function StatusFilterSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-44">
        <SelectValue placeholder="All statuses" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
        {Object.values(TASK_STATUS).map((status) => (
          <SelectItem key={status} value={status}>
            {TASK_STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
