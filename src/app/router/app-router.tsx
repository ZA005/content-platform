import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_NAV, CREATOR_NAV, MANAGER_NAV } from "@/components/layout/nav-config";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { USER_ROLE } from "@/core/constants";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { LoginPage } from "@/features/auth/pages/login-page";
import { AdminCalendarPage } from "@/features/calendar/pages/admin-calendar-page";
import { CreatorCalendarPage } from "@/features/calendar/pages/creator-calendar-page";
import { AdminCreatorsPage } from "@/features/creators/pages/admin-creators-page";
import { CreatorProfilePage } from "@/features/creators/pages/creator-profile-page";
import { AdminDashboardPage } from "@/features/dashboard/pages/admin-dashboard-page";
import { AdminNotificationsPage } from "@/features/dashboard/pages/admin-notifications-page";
import { AdminSettingsPage } from "@/features/settings/pages/admin-settings-page";
import { AdminTasksPage } from "@/features/tasks/pages/admin-tasks-page";
import { CreatorCompletedPage } from "@/features/tasks/pages/creator-completed-page";
import { CreatorTasksPage } from "@/features/tasks/pages/creator-tasks-page";
import { ManagerDashboardPage } from "@/features/manager/pages/manager-dashboard-page";
import { ManagerCreatorsPage } from "@/features/manager/pages/manager-creators-page";
import { ManagerSettingsPage } from "@/features/manager/pages/manager-settings-page";
import { APIDiagnosticPage } from "@/features/diagnostics/pages/api-diagnostic-page";
import { LoginTestPage } from "@/features/diagnostics/pages/login-test-page";
import { NotFoundPage } from "./not-found-page";
import { RootRedirect } from "./root-redirect";

function withBoundary(children: React.ReactNode) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/diagnostics", element: withBoundary(<APIDiagnosticPage />) },
  { path: "/test-login", element: withBoundary(<LoginTestPage />) },
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN]}>
        <AppShell items={ADMIN_NAV} />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withBoundary(<AdminDashboardPage />) },
      { path: "tasks", element: withBoundary(<AdminTasksPage />) },
      { path: "calendar", element: withBoundary(<AdminCalendarPage />) },
      { path: "creators", element: withBoundary(<AdminCreatorsPage />) },
      { path: "notifications", element: withBoundary(<AdminNotificationsPage />) },
      { path: "settings", element: withBoundary(<AdminSettingsPage />) },
    ],
  },
  {
    path: "/creator",
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLE.CREATOR]}>
        <AppShell items={CREATOR_NAV} />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withBoundary(<CreatorCalendarPage />) },
      { path: "tasks", element: withBoundary(<CreatorTasksPage />) },
      { path: "completed", element: withBoundary(<CreatorCompletedPage />) },
      { path: "profile", element: withBoundary(<CreatorProfilePage />) },
    ],
  },
  {
    path: "/manager",
    element: (
      <ProtectedRoute allowedRoles={[USER_ROLE.MANAGER]}>
        <AppShell items={MANAGER_NAV} />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withBoundary(<ManagerDashboardPage />) },
      { path: "creators", element: withBoundary(<ManagerCreatorsPage />) },
      { path: "settings", element: withBoundary(<ManagerSettingsPage />) },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
