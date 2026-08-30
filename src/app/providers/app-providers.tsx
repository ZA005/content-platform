import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/features/auth/context/auth-provider";
import { DebugPanel } from "@/components/shared/debug-panel";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
      <DebugPanel />
    </AuthProvider>
  );
}
