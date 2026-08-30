import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clapperboard,
  DollarSign,
  LayoutDashboard,
  ListTodo,
  Settings,
  UserRound,
  Users,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Tasks", href: "/admin/tasks", icon: ListTodo },
  { label: "Calendar", href: "/admin/calendar", icon: CalendarDays },
  { label: "Creators", href: "/admin/creators", icon: Users },
  { label: "Payout Calendar", href: "/admin/payout-calendar", icon: DollarSign },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export const CREATOR_NAV: NavItem[] = [
  { label: "My Calendar", href: "/creator", icon: CalendarDays },
  { label: "My Tasks", href: "/creator/tasks", icon: ListTodo },
  { label: "Completed", href: "/creator/completed", icon: CheckCircle2 },
  { label: "My Payout", href: "/creator/my-payout", icon: DollarSign },
  { label: "Profile", href: "/creator/profile", icon: UserRound },
];

export const MANAGER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/manager", icon: LayoutDashboard },
  { label: "Creators", href: "/manager/creators", icon: Users },
  { label: "My Payout", href: "/manager/my-payout", icon: DollarSign },
  { label: "Settings", href: "/manager/settings", icon: Settings },
];

export const BRAND_ICON = Clapperboard;
