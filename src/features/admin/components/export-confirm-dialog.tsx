import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { exportData } from "@/features/admin/services/data-export-import-service";

export type ExportEntity = "creators" | "tasks" | "managers" | "compensation" | "payout-config" | "work-schedules" | "brands";

interface ExportOption {
  id: ExportEntity;
  label: string;
  description: string;
  defaultChecked: boolean;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: "creators",
    label: "Creators",
    description: "Creator accounts and profiles",
    defaultChecked: true,
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "All task assignments and history",
    defaultChecked: true,
  },
  {
    id: "managers",
    label: "Managers",
    description: "Manager accounts and team structure",
    defaultChecked: true,
  },
  {
    id: "compensation",
    label: "Compensation Profiles",
    description: "Salary and payout settings per user",
    defaultChecked: true,
  },
  {
    id: "payout-config",
    label: "Payout Configuration",
    description: "System-wide payout defaults and settings",
    defaultChecked: true,
  },
  {
    id: "work-schedules",
    label: "Work Schedules",
    description: "Working days and time-off schedules",
    defaultChecked: false,
  },
  {
    id: "brands",
    label: "Brands",
    description: "Brand list and categories",
    defaultChecked: false,
  },
];

interface ExportConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportConfirmDialog({ open, onOpenChange }: ExportConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selected, setSelected] = useState<Set<ExportEntity>>(
    new Set(EXPORT_OPTIONS.filter((o) => o.defaultChecked).map((o) => o.id))
  );

  const handleToggle = (id: ExportEntity) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleConfirm = async () => {
    if (selected.size === 0) {
      toast.error("Please select at least one entity to export");
      return;
    }

    setIsSubmitting(true);
    try {
      await exportData(Array.from(selected));
      toast.success("Data exported successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export data");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>Select what data to include in your export</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {EXPORT_OPTIONS.map((option) => (
            <div key={option.id} className="flex items-start space-x-3 p-2 rounded hover:bg-neutral-900">
              <Checkbox
                id={option.id}
                checked={selected.has(option.id)}
                onChange={() => handleToggle(option.id)}
                disabled={isSubmitting}
              />
              <div className="flex-1">
                <Label
                  htmlFor={option.id}
                  className="font-medium text-sm cursor-pointer"
                >
                  {option.label}
                </Label>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting || selected.size === 0}>
            {isSubmitting ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
