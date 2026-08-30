# Reel — Content Creation Management Platform

A dark-theme SaaS app for managing content production: an **Admin/Manager**
assigns scripted tasks to **Creators**, who work through a calendar-first
interface. Built with React, TypeScript, Vite, Tailwind CSS, and
hand-built shadcn/ui-style components on top of Radix primitives.

## Getting started

```bash
npm install
npm run dev      # starts the dev server on http://localhost:5173
npm run build    # type-checks and builds a production bundle to dist/
```

## Demo credentials

| Role   | Username | Password |
| ------ | -------- | -------- |
| Admin  | `admin`  | `admin`  |
| Creator (seeded) | `maya`, `jordan`, or `priya` | `creator123` |

Data is seeded automatically into `localStorage` on first load (see
`src/infrastructure/mock-data`). Use **Settings → Reset mock data** as
an admin to restore the original demo dataset at any time.

## Architecture

The app follows Clean Architecture: UI never talks to `localStorage`
directly.

```
src/
├── app/              # router, providers (Auth + Toaster), bootstrap glue
├── core/             # framework-agnostic types, constants, repository interfaces
├── infrastructure/    # LocalStorageService + repository implementations + seed data
├── features/         # one folder per domain: auth, tasks, creators, dashboard, calendar, settings
│   └── <feature>/
│       ├── pages/       # route-level components
│       ├── components/  # feature-scoped UI
│       ├── hooks/       # data-fetching / mutation hooks
│       ├── services/    # joins/orchestration over repositories
│       └── schema.ts    # Zod validation
└── components/
    ├── ui/           # shadcn-style primitives (Button, Dialog, Select, Calendar, …)
    ├── layout/       # AppShell, sidebar, mobile nav, user menu
    └── shared/       # EmptyState, LoadingState, StatusBadge, ErrorBoundary, ConfirmDialog
```

**Swapping the backend later:** every repository (`AuthRepository`,
`CreatorRepository`, `TaskRepository`) is defined as an interface in
`src/core/interfaces/repositories.ts`. The `LocalStorage*Repository`
classes in `src/infrastructure/repositories` are the only code that
knows `localStorage` exists. To move to a real API, implement
`ApiTaskRepository` (etc.) against the same interfaces and swap the
singleton exported from each repository file — no feature code, hooks,
or components need to change.

**State management:** a single `AuthContext` holds the session; every
other screen fetches through small `use*` hooks (`useTasks`,
`useCreators`) that wrap the service layer and expose `refetch` +
mutation helpers. There's no global store beyond that — feature state
stays local to the hook or component that needs it.

## Notable UI/UX decisions

- **Design language:** a dark "broadcast studio" palette — near-black
  charcoal surfaces with a single amber "tally light" accent used for
  active states, the in-progress status dot, and focus rings — paired
  with Space Grotesk (display) / Inter (body) / IBM Plex Mono (dates,
  ids, script links).
- **Overdue tasks** are derived automatically: any task still open
  with a `scheduledDate` before today displays as *Overdue* without
  mutating stored data, so marking it complete later needs no special
  case.
- Admin and Creator experiences are fully separate route trees
  (`/admin/*`, `/creator/*`) gated by `ProtectedRoute`, so a creator
  session can never reach admin-only screens.

## What's next (by design, not wired up)

- `UserRepository` interface exists for future multi-admin support.
- The Notifications screen is a placeholder — ready for a real feed
  once there's a backend to push from.
- File uploads, comments/collaboration, and analytics are intentionally
  out of scope for this milestone but the folder structure has an
  obvious home for each (`features/<name>/`).
