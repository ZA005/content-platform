import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/features/auth/context/auth-provider";
import { DebugPanel } from "@/components/shared/debug-panel";
import { getQueryClient } from "@/infrastructure/query/query-client";

export function AppProviders({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster />
        <DebugPanel />
      </AuthProvider>
    </QueryClientProvider>
  );
}
