# Agency OS Front-End — Architecture & Design Guide

This document defines the architectural guidelines, component patterns, state management strategy, and styling conventions for the **Agency OS Angular 22** front-end application.

---

## 1. Core Architecture Principles

1. **Pure Standalone Components**: No `NgModule`s. Every component, directive, and pipe is standalone (`standalone: true`).
2. **Signal-Driven Reactivity**: Use Angular **Signals** (`signal()`, `computed()`, `effect()`) for local and shared component state.
3. **Tailwind CSS v4 Utility First**: Modern PostCSS-integrated Tailwind v4 design system with consistent design tokens.
4. **Strict Type Safety**: TypeScript 6 in strict mode with no implicit `any` and typed models matching back-end DTO records.

---

## 2. Directory Layout & Feature Organization

```
src/
├── app/
│   ├── core/                        # Singleton services, interceptors, auth, guards
│   │   ├── auth/                    # Keycloak OIDC service, token management, auth guard
│   │   ├── interceptors/            # Auth & Tenant HTTP interceptors, Error interceptor
│   │   ├── multitenancy/            # Active workspace state, tenant resolver & switchers
│   │   └── websocket/               # STOMP / SockJS real-time timer client
│   │
│   ├── shared/                      # Reusable UI components, pipes, directives
│   │   ├── components/              # Buttons, Modals, Tables, Badges, Loaders, Form controls
│   │   ├── models/                  # Shared TypeScript interfaces (ProblemDetail, etc.)
│   │   └── pipes/                   # DurationFormatterPipe, CurrencyPipe, DatePipe
│   │
│   ├── features/                    # Domain feature modules
│   │   ├── auth/                    # Login callback, unauthorized pages
│   │   ├── workspaces/              # Workspace switcher, creation modal, member management
│   │   ├── clients/                 # Client CRM table, client creation/edit drawer
│   │   ├── projects/                # Project list, budget progress bars, detail view
│   │   ├── tasks/                   # Kanban board, task creation, status drag-and-drop
│   │   ├── time-tracking/           # Live stopwatch bar, manual log modal, timesheet
│   │   └── invoices/                # Invoice list, generation wizard, PDF previewer
│   │
│   ├── layout/                      # Application shell
│   │   ├── sidebar/                 # Workspace navigation & navigation items
│   │   ├── topbar/                  # Tenant selector, active stopwatch indicator, user profile
│   │   └── shell.component.ts       # Main layout wrapper (<router-outlet>)
│   │
│   ├── app.config.ts                # Application providers (Router, HttpClient, Error Handler)
│   ├── app.routes.ts                # Application route declarations with guards
│   └── app.ts                       # Root bootstrap component
│
├── styles.css                       # Global Tailwind CSS @import
└── main.ts                          # Bootstrap application entry point
```

---

## 3. State Management with Angular Signals

State in Agency OS follows a **Store Service** pattern powered by Angular Signals:

```typescript
import { Injectable, signal, computed } from "@angular/core";

@Injectable({ providedIn: "root" })
export class WorkspaceStore {
  private readonly _activeWorkspace = signal<Workspace | null>(null);
  private readonly _workspaces = signal<Workspace[]>([]);

  // Public readonly signals
  readonly activeWorkspace = this._activeWorkspace.asReadonly();
  readonly workspaces = this._workspaces.asReadonly();
  readonly activeTenantId = computed(() => this._activeWorkspace()?.tenantId ?? null);

  setActiveWorkspace(workspace: Workspace) {
    this._activeWorkspace.set(workspace);
    localStorage.setItem("active_tenant_id", workspace.tenantId);
  }
}
```

---

## 4. Route Architecture & Guards

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: "",
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: "", redirectTo: "projects", pathMatch: "full" },
      {
        path: "workspaces",
        loadComponent: () => import("./features/workspaces/workspaces.component"),
      },
      {
        path: "clients",
        canActivate: [roleGuard(["OWNER", "ADMIN", "MEMBER"])],
        loadComponent: () => import("./features/clients/clients.component"),
      },
      {
        path: "projects",
        loadComponent: () => import("./features/projects/projects.component"),
      },
      {
        path: "tasks",
        loadComponent: () => import("./features/tasks/tasks.component"),
      },
      {
        path: "time-tracking",
        canActivate: [roleGuard(["OWNER", "ADMIN", "MEMBER"])],
        loadComponent: () => import("./features/time-tracking/time-tracking.component"),
      },
      {
        path: "invoices",
        canActivate: [roleGuard(["OWNER", "ADMIN", "CLIENT"])],
        loadComponent: () => import("./features/invoices/invoices.component"),
      },
    ],
  },
  { path: "login", loadComponent: () => import("./features/auth/login.component") },
  { path: "**", redirectTo: "" },
];
```

---

## 5. Testing with Vitest

Unit tests are executed via Vitest with `jsdom` runner:

- Component DOM rendering and inputs/outputs.
- Signal state mutations.
- Mocked HTTP testing with `HttpTestingController`.

```bash
npm test
```
