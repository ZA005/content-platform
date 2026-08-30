import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import type { Creator } from "@/core/types";
import { useBrands } from "@/features/brands/hooks/use-brands";
import { creatorFormSchema, type CreatorFormValues } from "../schema";

interface CreatorFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creator?: Creator | null;
  onSubmit: (values: CreatorFormValues) => Promise<void>;
}

export function CreatorFormModal({ open, onOpenChange, creator, onSubmit }: CreatorFormModalProps) {
  const isEditing = Boolean(creator);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { brands: availableBrands } = useBrands();

  const schema = useMemo(
    () =>
      isEditing
        ? creatorFormSchema
        : creatorFormSchema.extend({
            password: z.string().min(4, "Password must be at least 4 characters"),
          }),
    [isEditing],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatorFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", username: "", password: "", brands: [], avatarUrl: "" },
  });

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    reset({
      name: creator?.name ?? "",
      username: creator?.username ?? "",
      password: "",
      brands: creator?.brands ?? [],
      avatarUrl: creator?.avatarUrl ?? "",
    });
  }, [open, creator, reset]);

  const submit = async (values: CreatorFormValues) => {
    setSubmitError(null);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not save this creator.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Creator" : "Add Creator"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update this creator's account details." : "Create a new creator account."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Maya Torres" {...register("name")} />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="maya" {...register("username")} />
            {errors.username && <p className="text-xs text-danger">{errors.username.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Brands</Label>
            <Controller
              control={control}
              name="brands"
              render={({ field }) => (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {availableBrands.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => {
                          const current = field.value ?? [];
                          if (current.includes(brand)) {
                            field.onChange(current.filter((b) => b !== brand));
                          } else {
                            field.onChange([...current, brand]);
                          }
                        }}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                          (field.value ?? []).includes(brand)
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-card text-foreground hover:bg-secondary"
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                  {errors.brands && <p className="text-xs text-danger">{errors.brands.message}</p>}
                </div>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{isEditing ? "New password" : "Password"}</Label>
            <Input
              id="password"
              type="password"
              placeholder={isEditing ? "Leave blank to keep current" : "••••••••"}
              {...register("password")}
            />
            {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
          </div>

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
              {isEditing ? "Save changes" : "Add Creator"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
