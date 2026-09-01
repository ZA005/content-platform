import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CREATOR_STATUS } from "@/core/constants";
import type { Creator, Task } from "@/core/types";
import { taskFormSchema, type TaskFormValues } from "../schema";

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creators: Creator[];
  task?: Task | null;
  defaultDate?: string;
  onSubmit: (values: TaskFormValues) => Promise<void>;
}

export function TaskFormModal({
  open,
  onOpenChange,
  creators,
  task,
  defaultDate,
  onSubmit,
}: TaskFormModalProps) {
  const isEditing = Boolean(task);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("");
  const activeCreators = creators.filter((c) => c.status === CREATOR_STATUS.ACTIVE);

  const selectedCreator = useMemo(
    () => activeCreators.find((c) => c.id === selectedCreatorId),
    [selectedCreatorId, activeCreators]
  );
  const creatorBrands = useMemo(() => selectedCreator?.brands ?? [], [selectedCreator]);

  const getDefaultDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      scheduledDate: defaultDate ?? getDefaultDate(),
      creatorId: "",
      brand: "",
      scriptLink: "",
      instruction: "",
      notes: "",
      referenceLink: "",
      isDayOff: false,
    },
  });

  const selectedCreatorIdWatch = watch("creatorId");
  const isDayOffWatch = watch("isDayOff");

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    const creatorId = task?.creatorId ?? "";
    reset({
      scheduledDate: task?.scheduledDate ?? defaultDate ?? getDefaultDate(),
      creatorId: creatorId,
      brand: task?.brand ?? "",
      scriptLink: task?.scriptLink ?? "",
      instruction: task?.instruction ?? "",
      notes: task?.notes ?? "",
      referenceLink: task?.referenceLink ?? "",
      status: task?.status,
      isDayOff: task?.isDayOff ?? false,
    });
    setSelectedCreatorId(creatorId);
  }, [open, task, defaultDate, reset]);

  const submit = async (values: TaskFormValues) => {
    setSubmitError(null);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not save this task.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Assign Task"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this task."
              : "Schedule a new piece of content for a creator."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
          {/* 1. Date */}
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Controller
              control={control}
              name="scheduledDate"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start font-normal"
                    >
                      <CalendarIcon className="size-4" />
                      {field.value ? format(parseISO(field.value), "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? parseISO(field.value) : undefined}
                      onSelect={(date) => date && field.onChange(format(date, "yyyy-MM-dd"))}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.scheduledDate && (
              <p className="text-xs text-danger">{errors.scheduledDate.message}</p>
            )}
          </div>

          {/* 2. Creator & Brand (2 columns) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Creator Column */}
            <div className="space-y-1.5">
              <Label>Assign Creator</Label>
              <Controller
                control={control}
                name="creatorId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedCreatorId(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a creator" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCreators.length === 0 && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No active creators available
                        </div>
                      )}
                      {activeCreators.map((creator) => (
                        <SelectItem key={creator.id} value={creator.id}>
                          {creator.name} · {creator.brands.join(", ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.creatorId && <p className="text-xs text-danger">{errors.creatorId.message}</p>}
            </div>

            {/* Brand Column */}
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Controller
                control={control}
                name="brand"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!selectedCreatorId}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCreatorId ? "Choose a brand" : "Select a creator first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {creatorBrands.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          {selectedCreatorId ? "Creator has no brands" : "No brands available"}
                        </div>
                      ) : (
                        creatorBrands.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.brand && <p className="text-xs text-danger">{errors.brand.message}</p>}
            </div>
          </div>

          {/* 2.3 Day Off Toggle - Only show when creator is selected */}
          {selectedCreatorIdWatch && (
            <div className="space-y-1.5">
              <Controller
                control={control}
                name="isDayOff"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border border-neutral-800 p-3">
                    <div className="flex flex-col">
                      <Label className="text-sm font-medium">Mark as Day-Off Work</Label>
                      <p className="text-xs text-neutral-400 mt-0.5">Completed on a non-working day</p>
                    </div>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            </div>
          )}

          {/* Remaining fields - Hidden if day off is selected */}
          {!isDayOffWatch && (
            <>
              {/* 3. Script Link */}
              <div className="space-y-1.5">
                <Label htmlFor="scriptLink">Script Link</Label>
                <Input
                  id="scriptLink"
                  placeholder="https://docs.example.com/scripts/..."
                  {...register("scriptLink")}
                />
                {errors.scriptLink && <p className="text-xs text-danger">{errors.scriptLink.message}</p>}
              </div>

              {/* 3.5 Reference Link */}
              <div className="space-y-1.5">
                <Label htmlFor="referenceLink">Reference Link (Optional)</Label>
                <Input
                  id="referenceLink"
                  placeholder="https://example.com/reference/..."
                  {...register("referenceLink")}
                />
                {errors.referenceLink && <p className="text-xs text-danger">{errors.referenceLink.message}</p>}
              </div>

              {/* 4. Instruction / What to Change */}
              <div className="space-y-1.5">
                <Label htmlFor="instruction">Instruction / What to Change</Label>
                <Textarea
                  id="instruction"
                  rows={5}
                  placeholder="Describe exactly what the creator needs to do…"
                  {...register("instruction")}
                />
                {errors.instruction && (
                  <p className="text-xs text-danger">{errors.instruction.message}</p>
                )}
              </div>

              {/* 5. Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" rows={3} placeholder="Optional context for the creator…" {...register("notes")} />
              </div>
            </>
          )}

          {submitError && (
            <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {submitError}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isEditing ? "Save changes" : "Assign Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
