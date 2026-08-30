import { z } from "zod";

export const creatorFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-z0-9._-]+$/i, "Letters, numbers, dots, dashes and underscores only"),
  password: z.string().min(4, "Password must be at least 4 characters").optional().or(z.literal("")),
  brands: z.array(z.string()).min(1, "Select at least one brand"),
  avatarUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});

export type CreatorFormValues = z.infer<typeof creatorFormSchema>;
