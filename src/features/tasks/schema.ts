import { z } from "zod";
import { TASK_STATUS } from "@/core/constants";

export const taskFormSchema = z.object({
  scheduledDate: z.string().min(1, "Pick a date"),
  creatorId: z.string().min(1, "Assign a creator"),
  brand: z.string().min(1, "Brand is required").max(100),
  scriptLink: z.string().url("Enter a valid URL"),
  instruction: z.string().min(1, "Instruction is required").max(2000),
  notes: z.string().max(2000),
  referenceLink: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  status: z
    .enum([
      TASK_STATUS.NOT_STARTED,
      TASK_STATUS.IN_PROGRESS,
      TASK_STATUS.IN_REVIEW,
      TASK_STATUS.COMPLETED,
      TASK_STATUS.OVERDUE,
    ])
    .optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
