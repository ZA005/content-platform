import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { APP_NAME } from "@/core/constants";
import { BRAND_ICON } from "./nav-config";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-config";

export function AppSidebar({ items }: { items: NavItem[] }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card/60 transition-all duration-300 lg:flex",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className={cn("flex items-center justify-between px-2 py-3", isCollapsed && "flex-col gap-2")}>
        <div className="flex items-center gap-2 px-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BRAND_ICON className="size-4" />
          </div>
          {!isCollapsed && <span className="font-display text-base font-semibold tracking-tight">{APP_NAME}</span>}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-2 hover:bg-secondary/40 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("size-4 transition-transform", isCollapsed && "rotate-180")} />
        </button>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto scrollbar-thin px-2">
        <SidebarNav items={items} collapsed={isCollapsed} />
      </div>

      <div className={cn("pt-3", isCollapsed && "px-1")}>
        <UserMenu collapsed={isCollapsed} />
      </div>
    </aside>
  );
}
