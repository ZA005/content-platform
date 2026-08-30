import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clapperboard, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME, USER_ROLE } from "@/core/constants";
import { useAuth } from "../hooks/use-auth";
import { loginSchema, type LoginFormValues } from "../schema";

export function LoginPage() {
  const { user, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  if (!isLoading && user) {
    const dest = user.role === USER_ROLE.ADMIN ? "/admin" : "/creator";
    return <Navigate to={dest} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      const loggedInUser = await login(values.username, values.password);
      const redirectTo =
        (location.state as { from?: string } | null)?.from ??
        (loggedInUser.role === USER_ROLE.ADMIN ? "/admin" : "/creator");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to sign in.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground tally-glow">
            <Clapperboard className="size-5" />
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight">{APP_NAME}</h1>
          <p className="text-sm text-muted-foreground">Sign in to your production workspace</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Enter your credentials to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="admin"
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-xs text-danger">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-danger">{errors.password.message}</p>
                )}
              </div>

              {formError && (
                <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                  {formError}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Admin demo: <span className="font-mono text-foreground">admin / admin</span>
        </p>
      </div>
    </div>
  );
}
