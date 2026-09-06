# Agency OS Front-End — Back-End API Integration Guide

This guide details how the Angular front-end communicates with the Spring Boot back-end, handles Keycloak authentication, attaches multi-tenant headers, and connects to real-time WebSockets.

---

## 1. Environment & API Endpoints

Environment configurations provide endpoint URLs for the REST API, WebSocket broker, and Keycloak server:

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:8080/api/v1",
  wsUrl: "http://localhost:8080/ws-timer",
  keycloak: {
    url: "http://localhost:8080",
    realm: "agency-os",
    clientId: "agency-os-frontend",
  },
};
```

---

## 2. HTTP Interceptors

All outbound HTTP calls to `/api/v1/*` pass through functional interceptors:

### 2.1 Authentication & Tenant Interceptor (`auth.interceptor.ts`)

```typescript
import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthStore } from "../stores/auth.store";
import { WorkspaceStore } from "../../multitenancy/workspace.store";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const workspaceStore = inject(WorkspaceStore);

  const token = authStore.getAccessToken();
  const tenantId = workspaceStore.activeTenantId();

  let headers = req.headers;

  if (token) {
    headers = headers.set("Authorization", `Bearer ${token}`);
  }

  // Attach X-Tenant-ID for tenant-scoped endpoints
  const isGlobalEndpoint =
    req.url.endsWith("/workspaces") ||
    req.url.includes("/workspaces/invitations") ||
    req.url.includes("/users/me") ||
    req.url.includes("/account");

  if (tenantId && !isGlobalEndpoint) {
    headers = headers.set("X-Tenant-ID", tenantId);
  }

  return next(req.clone({ headers }));
};
```

---

## 3. Real-Time WebSocket Client (STOMP over SockJS)

The front-end connects to `/ws-timer` using `@stomp/stompjs` and `sockjs-client`:

```typescript
import { Injectable, signal } from "@angular/core";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { AuthStore } from "../auth/stores/auth.store";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: "root" })
export class TimerWebSocketService {
  private client: Client | null = null;
  readonly activeTimerEvent = signal<any>(null);

  constructor(private authStore: AuthStore) {}

  connect(tenantId: string) {
    this.disconnect();

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${this.authStore.getAccessToken()}`,
      },
      debug: str => console.debug("[STOMP]", str),
      reconnectDelay: 5000,
      onConnect: () => {
        // Subscribe to live timer events
        this.client?.subscribe(`/topic/${tenantId}/timers/start`, msg => {
          this.activeTimerEvent.set({ type: "START", data: JSON.parse(msg.body) });
        });
        this.client?.subscribe(`/topic/${tenantId}/timers/pause`, msg => {
          this.activeTimerEvent.set({ type: "PAUSE", data: JSON.parse(msg.body) });
        });
        this.client?.subscribe(`/topic/${tenantId}/timers/resume`, msg => {
          this.activeTimerEvent.set({ type: "RESUME", data: JSON.parse(msg.body) });
        });
        this.client?.subscribe(`/topic/${tenantId}/timers/stop`, msg => {
          this.activeTimerEvent.set({ type: "STOP", data: JSON.parse(msg.body) });
        });
        this.client?.subscribe(`/topic/${tenantId}/time-entries`, msg => {
          this.activeTimerEvent.set({ type: "LOG_ENTRY", data: JSON.parse(msg.body) });
        });
      },
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }
}
```

---

## 4. API Service Catalog

The application provides strongly-typed API client services located in `src/app/core/api/services/`:

| Service                | Path                      | Key Methods                                                                                                                                                         |
| ---------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AccountApiService`    | `/realms/{realm}/account` | `getProfile()`, `updateProfile()`, `getSessions()`, `terminateSession()`, `getLinkedAccounts()`, `unlinkAccount()`, `changePassword()`                              |
| `WorkspaceApiService`  | `/api/v1/workspaces`      | `createWorkspace()`, `getUserWorkspaces()`, `updateWorkspace()`, `deleteWorkspace()`, `getMembers()`, `updateMemberRole()`, `removeMember()`, `transferOwnership()` |
| `InvitationApiService` | `/api/v1/workspaces`      | `inviteUser()`, `getPendingInvitations()`, `acceptInvitation()`, `declineInvitation()`                                                                              |
| `ClientApiService`     | `/api/v1/clients`         | `createClient()`, `getAllClients()`, `getClientById()`, `updateClient()`, `deleteClient()`                                                                          |
| `ProjectApiService`    | `/api/v1/projects`        | `createProject()`, `getAllProjects()`, `getProjectById()`, `getProjectsByClientId()`, `updateProject()`, `deleteProject()`                                          |
| `TaskApiService`       | `/api/v1/tasks`           | `createTask()`, `getAllTasks()`, `getTaskById()`, `getTasksByProjectId()`, `getTasksByAssigneeId()`, `updateTask()`, `updateTaskStatus()`, `deleteTask()`           |
| `TimeEntryApiService`  | `/api/v1/time-entries`    | `logTime()`, `getTimeEntries()`, `startTimer()`, `pauseTimer()`, `resumeTimer()`, `stopTimer()`, `getActiveTimer()`, `getTimeEntriesByTask()`, `deleteTimeEntry()`  |
| `InvoiceApiService`    | `/api/v1/invoices`        | `createInvoice()`, `getAllInvoices()`, `getInvoiceById()`, `getInvoicesByClientId()`, `updateInvoice()`, `deleteInvoice()`, `downloadInvoicePdf()`                  |

---

## 5. TypeScript Data Models

Located in `src/app/core/api/models/`:

```typescript
export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "CLIENT";
export type ClientStatus = "PROSPECT" | "ACTIVE" | "INACTIVE";
export type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "DELIVERED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface Workspace {
  id: string;
  name: string;
  tenantId: string;
  contactEmail: string;
  isActive: boolean;
  currentUserRole?: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  status: ClientStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  budget: number;
  billingRate: number;
  status: ProjectStatus;
  clientId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  estimatedMinutes: number;
  priority: TaskPriority;
  status: TaskStatus;
  projectId: string;
  assigneeIds: string[];
  totalLoggedMinutes?: number;
  isOverBudget?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveTimerResponse {
  userId: string;
  taskId: string;
  startTime: string;
  accumulatedSeconds: number;
  isPaused: boolean;
  lastPausedAt?: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  durationMinutes: number;
  isBillable: boolean;
  invoiceId?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  totalAmount: number;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}
```
