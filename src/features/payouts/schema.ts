import { z } from "zod";

export const payoutConfigSchema = z.object({
  payoutDayOfMonth: z
    .number()
    .int()
    .min(1, "Payout day must be between 1 and 31")
    .max(31, "Payout day must be between 1 and 31"),
  defaultDayOffMultiplier: z
    .number()
    .positive("Day-off multiplier must be greater than 0")
    .finite("Day-off multiplier must be a valid number"),
});

export type PayoutConfigFormValues = z.infer<typeof payoutConfigSchema>;

export const compensationSchema = z.object({
  baseSalary: z
    .number()
    .min(0, "Base salary cannot be negative")
    .finite("Base salary must be a valid number"),
  dayOffMultiplier: z
    .number()
    .positive("Day-off multiplier must be greater than 0")
    .finite("Day-off multiplier must be a valid number")
    .optional(),
});

export type CompensationFormValues = z.infer<typeof compensationSchema>;

export const workScheduleSchema = z.object({
  workingDays: z
    .array(z.number().int().min(0).max(6))
    .min(1, "At least one working day must be selected"),
  customDaysOff: z.array(z.string()).optional().default([]),
});

export type WorkScheduleFormValues = z.infer<typeof workScheduleSchema>;
