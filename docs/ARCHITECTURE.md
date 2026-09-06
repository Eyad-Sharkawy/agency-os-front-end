# Agency OS Front-End — Architecture & Design Guide

This document defines the architectural guidelines, component patterns, state management strategy, routing lifecycle, and testing standards for the **Agency OS Angular 22** front-end application.

---

## 1. Core Architecture Principles

1. **Pure Standalone Components**: Every component, directive, and pipe is standalone (`standalone: true`). No `NgModule`s are used.
2. **Signal-Driven Reactivity**: Primary UI state, asynchronous HTTP resources (`httpResource`), and computed derivations use Angular **Signals** (`signal()`, `computed()`, `effect()`).
3. **Tailwind CSS v4 Utility-First**: Direct PostCSS-integrated styling using modern design tokens, native CSS variables, and light/dark theme switching.
4. **Strict Type Safety**: TypeScript 6 with strict null checks, no implicit `any`, and typed domain models that mirror the Spring Boot back-end DTOs.
5. **Separation of Concerns**: UI components handle presentation and user interactions; domain management services handle business logic; API services handle HTTP serialization.

---

## 2. Directory Layout & Feature Organization

```
src/
├── app/
│   ├── core/                        # Singleton infrastructure services, auth, guards, interceptors
│   │   ├── api/                     # REST API clients & TypeScript DTOs
│   │   │   ├── models/              # Account, Client, Invoice, Project, Task, Time, Workspace
│   │   │   └── services/            # AccountApiService, WorkspaceApiService, ClientApiService, etc.
│   │   ├── auth/                    # Keycloak OIDC integration, AuthStore, functional guards
│   │   │   ├── guards/              # authGuard, redirectIfAuthenticatedGuard, roleGuard
│   │   │   ├── interceptors/        # authInterceptor (attaches Bearer JWT & X-Tenant-ID)
│   │   │   └── stores/              # AuthStore (user identity, roles, token lifecycle)
│   │   ├── multitenancy/            # WorkspaceStore, tenantGuard, active tenant signals
│   │   ├── services/                # ThemeService (Dark/Light mode), ToastService
│   │   └── tokens/                  # Environment injection token
│   │
│   ├── shared/                      # Reusable UI presentation components, models, and pipes
│   │   ├── components/              # Buttons, Modals, Tables, Badges, Loaders, Form controls
│   │   ├── models/                  # Shared types (ProblemDetail, Pagination, etc.)
│   │   └── pipes/                   # CurrencyPipe, DatePipe, DurationPipe
│   │
│   ├── features/                    # Domain feature modules (routed standalone components)
│   │   ├── clients/                 # Client CRM registry, creation/edit modals, deletion guards
│   │   ├── dashboard-overview/      # Workspace metric overview, budget health, quick navigation
│   │   ├── how-it-works/            # Interactive application tour & user onboarding
│   │   ├── invoices/                # Billing generation wizard, invoice table, PDF preview modal
│   │   ├── landing-page/            # Marketing landing page with hero, bento grid, and feature cards
│   │   ├── profile/                 # Profile modal dialog (Personal, Security, Sessions, Linked Accounts)
│   │   ├── projects/                # Project cards, budget usage indicators, project modal
│   │   ├── tasks/                   # Kanban task board, status drag-and-drop, task creation
│   │   ├── time-tracking/           # Live stopwatch bar, manual time logging modal, timesheet table
│   │   ├── unauthorized/            # 403 Access Denied presentation view
│   │   └── workspaces/              # Workspace switcher, member management, ownership transfer
│   │
│   ├── layout/                      # Application shell
│   │   ├── sidebar/                 # Workspace navigation links & active route state
│   │   ├── topbar/                  # Tenant selector, running stopwatch widget, profile avatar
│   │   └── shell.component.ts       # Main layout wrapper (<router-outlet>)
│   │
│   ├── app.config.ts                # Application providers (Router, HttpClient, Keycloak)
│   ├── app.routes.ts                # Route hierarchy with lazy loading and guards
│   └── app.ts                       # Root bootstrap component
│
├── styles.css                       # Global Tailwind CSS @import 'tailwindcss'
└── main.ts                          # Bootstrap entry point
```

---

## 3. State Management with Angular Signals

State in Agency OS follows a **Signal Store Service** pattern without bulky third-party state libraries:

### 3.1 WorkspaceStore

Manages tenant context and the active workspace across the application:

```typescript
@Injectable({ providedIn: "root" })
export class WorkspaceStore {
  private readonly _activeWorkspace = signal<Workspace | null>(null);
  private readonly _workspaces = signal<Workspace[]>([]);
  private readonly _loading = signal<boolean>(false);

  // Readonly exposed signals
  readonly activeWorkspace = this._activeWorkspace.asReadonly();
  readonly workspaces = this._workspaces.asReadonly();
  readonly loading = this._loading.asReadonly();

  // Computed derivations
  readonly activeTenantId = computed(() => this._activeWorkspace()?.tenantId ?? null);
  readonly isOwner = computed(() => this._activeWorkspace()?.currentUserRole === "OWNER");
  readonly isAdminOrOwner = computed(() => {
    const role = this._activeWorkspace()?.currentUserRole;
    return role === "OWNER" || role === "ADMIN";
  });

  setActiveWorkspace(workspace: Workspace) {
    this._activeWorkspace.set(workspace);
    localStorage.setItem("active_tenant_id", workspace.tenantId);
  }
}
```

### 3.2 AuthStore

Manages Keycloak user profile, authentication tokens, and permissions:

```typescript
@Injectable({ providedIn: "root" })
export class AuthStore {
  private readonly _user = signal<UserProfile | null>(null);
  private readonly _isAuthenticated = signal<boolean>(false);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly username = computed(() => this._user()?.username ?? "");
}
```

### 3.3 Dashboard Overview Reactive Aggregation

The `DashboardOverviewComponent` leverages signal-based computed derivations across tenant REST APIs:

- **Tenant API Ingestion**: Integrates `ClientApi`, `ProjectApi`, `TaskApi`, `TimeEntryApi`, and `InvoiceApi` with reactive refresh signals.
- **Role-Scoped Aggregation**: Distinguishes administrative overviews (global client, project, and billing metrics) from member-scoped tasks and personal hours.
- **Budget Burn Metrics**: Calculates project budget consumption percentage (`(loggedHours * billingRate) / budget * 100`) and categorizes health thresholds (`normal` $< 80\%$, `warning` $80-100\%$, `danger` $> 100\%$).
- **Live Stopwatch Integration**: Injects `TimeTrackingManagement` to display active/paused timer state, elapsed ticker numbers, and one-click timer controls.

---

## 4. Route Architecture & Functional Guards

Routes are defined declaratively in `app.routes.ts` with code-splitting and functional guards:

```typescript
export const routes: Routes = [
  {
    path: "",
    component: LandingPage,
    canActivate: [redirectIfAuthenticatedGuard],
  },
  {
    path: "how-it-works",
    loadComponent: () => import("./features/how-it-works/how-it-works"),
  },
  {
    path: "demo",
    loadComponent: () => import("./features/demo/demo"),
  },
  {
    path: "workspaces",
    canActivate: [authGuard],
    loadComponent: () => import("./features/workspaces/workspaces"),
  },
  {
    path: "w/:workspaceId",
    component: DashboardShell,
    canActivate: [authGuard, tenantGuard],
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      {
        path: "dashboard",
        loadComponent: () => import("./features/dashboard-overview/dashboard-overview"),
      },
      {
        path: "clients",
        canActivate: [roleGuard],
        data: { roles: ["OWNER", "ADMIN"] },
        loadComponent: () => import("./features/clients/clients"),
      },
      {
        path: "projects",
        canActivate: [roleGuard],
        data: { roles: ["OWNER", "ADMIN", "MEMBER", "CLIENT"] },
        loadComponent: () => import("./features/projects/projects"),
      },
      {
        path: "tasks",
        canActivate: [roleGuard],
        data: { roles: ["OWNER", "ADMIN", "MEMBER", "CLIENT"] },
        loadComponent: () => import("./features/tasks/tasks"),
      },
      {
        path: "time-tracking",
        canActivate: [roleGuard],
        data: { roles: ["OWNER", "ADMIN", "MEMBER"] },
        loadComponent: () => import("./features/time-tracking/time-tracking"),
      },
      {
        path: "invoices",
        canActivate: [roleGuard],
        data: { roles: ["OWNER", "ADMIN", "CLIENT"] },
        loadComponent: () => import("./features/invoices/invoices"),
      },
    ],
  },
  {
    path: "unauthorized",
    loadComponent: () => import("./features/unauthorized/unauthorized"),
  },
  { path: "app", redirectTo: "workspaces", pathMatch: "full" },
  { path: "**", redirectTo: "" },
];
```

---

## 5. HTTP Interceptors

All outbound HTTP calls are intercepted by functional interceptors:

1. **`authInterceptor`**:
   - Injects `Authorization: Bearer <JWT>` from the active Keycloak session.
   - For tenant-scoped API routes, injects `X-Tenant-ID: <activeTenantId>`.
2. **Error Handling**:
   - Intercepts RFC 7807 `ProblemDetail` responses and surfaces user-friendly toast notifications.
   - Redirects to `/unauthorized` or triggers token refresh upon `401` / `403` status codes.

---

## 6. Real-Time WebSocket Subsystem

The application connects to `/ws-timer` with STOMP over SockJS:

- Subscribes to `/topic/{tenantId}/timers/start`, `/topic/{tenantId}/timers/pause`, `/topic/{tenantId}/timers/resume`, and `/topic/{tenantId}/timers/stop`.
- Updates active stopwatch indicators in the topbar and time-tracking dashboard without manual page refreshes.

---

## 7. Testing Architecture & SonarQube Standards

Unit tests run with **Vitest** and `jsdom`:

- **Component Tests**: Verifies DOM rendering, signal binding, user clicks, and modal open/close transitions.
- **Service & Store Tests**: Tests signal updates, computed values, and localStorage persistence.
- **HTTP Mock Tests**: Uses `provideHttpClientTesting()` and `HttpTestingController` to verify request paths, headers, and responses.
- **SonarQube Quality Gate**: All feature components maintain $>80\%$ line and statement coverage with zero lint or typing violations.

```bash
# Run unit tests
npm test -- --run

# Run unit tests with code coverage report
npx ng test --watch=false --coverage
```
