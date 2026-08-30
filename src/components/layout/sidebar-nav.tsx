import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-config";

interface SidebarNavProps {
  items: NavItem[];
  onNavigate?: () => void;
  collapsed?: boolean;
}

export function SidebarNav({ items, onNavigate, collapsed = false }: SidebarNavProps) {
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.href === "/admin" || item.href === "/creator" || item.href === "/manager"}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground",
              isActive && "bg-secondary text-foreground",
              collapsed && "justify-center px-2",
            )
          }
          title={collapsed ? item.label : undefined}
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  "absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity",
                  isActive && "opacity-100 tally-glow",
                  collapsed && "hidden",
                )}
              />
              <item.icon className="size-4 shrink-0" />
              {!collapsed && item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
