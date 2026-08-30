import { Navigate } from "react-router-dom";
import { USER_ROLE } from "@/core/constants";
import { useAuth } from "@/features/auth/hooks/use-auth";

export function RootRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  const redirectPath =
    user.role === USER_ROLE.ADMIN ? "/admin" :
    user.role === USER_ROLE.MANAGER ? "/manager" :
    "/creator";
  return <Navigate to={redirectPath} replace />;
}
