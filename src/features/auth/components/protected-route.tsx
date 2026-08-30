import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { USER_ROLE } from "@/core/constants";
import type { UserRole } from "@/core/types";
import { useAuth } from "../hooks/use-auth";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = user.role === USER_ROLE.ADMIN ? "/admin" : "/creator";
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
