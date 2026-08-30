import { Outlet } from "react-router-dom";
import { AppSidebar } from "./app-sidebar";
import { MobileHeader } from "./mobile-header";
import type { NavItem } from "./nav-config";

export function AppShell({ items }: { items: NavItem[] }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar items={items} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader items={items} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
