import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import type { Manager } from "@/core/types";

interface ManagerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manager?: Manager | null;
  onSubmit: (values: ManagerFormValues) => Promise<void>;
}

export interface ManagerFormValues {
  name: string;
  username: string;
  password: string;
  avatarUrl?: string;
}

export function ManagerFormModal({
  open,
  onOpenChange,
  manager,
  onSubmit,
}: ManagerFormModalProps) {
  const isEditing = Boolean(manager);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ManagerFormValues>({
    name: "",
    username: "",
    password: "",
    avatarUrl: "",
  });

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    if (manager) {
      setFormData({
        name: manager.name,
        username: manager.username,
        password: "",
        avatarUrl: manager.avatarUrl || "",
      });
    } else {
      setFormData({
        name: "",
        username: "",
        password: "",
        avatarUrl: "",
      });
    }
  }, [open, manager]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formData.name || !formData.username) {
      setSubmitError("Name and username are required");
      return;
    }

    if (!isEditing && !formData.password) {
      setSubmitError("Password is required");
      return;
    }

    if (formData.password && formData.password.length < 4) {
      setSubmitError("Password must be at least 4 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not save this manager.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Manager" : "Add Manager"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update this manager's account details." : "Create a new manager account."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="John Smith"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="john.smith"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{isEditing ? "New password" : "Password"}</Label>
            <Input
              id="password"
              type="password"
              placeholder={isEditing ? "Leave blank to keep current" : "••••••••"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
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
              {isEditing ? "Save changes" : "Add Manager"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
