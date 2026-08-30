import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { creatorService } from "@/features/creators/services/creator-service";

const passwordSchema = z.object({
  password: z.string().min(4, "Password must be at least 4 characters"),
});
type PasswordFormValues = z.infer<typeof passwordSchema>;

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function CreatorProfilePage() {
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });

  if (!user) return null;

  const onSubmit = async (values: PasswordFormValues) => {
    if (!user.creatorId) return;
    await creatorService.update(user.creatorId, { password: values.password });
    toast.success("Password updated");
    reset({ password: "" });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account information.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-4 sm:flex-row sm:gap-4 sm:p-5">
          <Avatar className="size-12 sm:size-14">
            <AvatarFallback className="text-sm sm:text-base">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <p className="font-display text-base font-semibold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.username}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">Username</span>
            <span className="font-mono text-foreground break-words">{user.username}</span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="capitalize text-foreground">{user.role}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Update the password you use to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
