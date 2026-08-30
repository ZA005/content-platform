import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { AuthUser } from "@/core/types";
import { repositoryFactory } from "@/infrastructure/repositories/repository-factory";
import { AuthContext, type AuthContextValue } from "./auth-context";

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authRepository = repositoryFactory.getAuthRepository();

  useEffect(() => {
    let mounted = true;
    authRepository.getSession().then((session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [authRepository]);

  const logout = useCallback(async () => {
    await authRepository.logout();
    setUser(null);
  }, [authRepository]);

  const resetInactivityTimer = useCallback(() => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Only set timer if user is logged in
    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        logout();
        toast.error("Session expired due to inactivity. Please log in again.");
      }, INACTIVITY_TIMEOUT);
    }
  }, [user, logout]);

  const login = useCallback(async (username: string, password: string) => {
    const loggedInUser = await authRepository.login(username, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, [authRepository]);

  // Set up inactivity detection when user logs in
  useEffect(() => {
    if (!user) {
      // Clear timer on logout
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    // Start timer
    resetInactivityTimer();

    // Listen for user activity
    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart", "click"];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      // Clean up event listeners
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      // Clear timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user, resetInactivityTimer]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
