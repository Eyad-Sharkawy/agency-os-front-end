# Agency OS Front-End — Back-End API Integration Guide

This guide details how the Angular front-end communicates with the Spring Boot back-end, handles Keycloak authentication, attaches multi-tenant headers, and connects to real-time WebSockets.

---

## 1. Environment & API Endpoints

Configure environment settings for API and Keycloak endpoints:

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

All outbound HTTP calls to `/api/v1/*` must pass through two essential interceptors:

### 2.1 Authentication & Tenant Interceptor

```typescript
import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../auth/auth.service";
import { WorkspaceStore } from "../multitenancy/workspace.store";

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const workspaceStore = inject(WorkspaceStore);

  const token = authService.getAccessToken();
  const tenantId = workspaceStore.activeTenantId();

  let headers = req.headers;

  if (token) {
    headers = headers.set("Authorization", `Bearer ${token}`);
  }

  // Only attach X-Tenant-ID for tenant-scoped endpoints (skip /workspaces root endpoints)
  if (
    tenantId &&
    !req.url.endsWith("/workspaces") &&
    !req.url.includes("/workspaces/invitations")
  ) {
    headers = headers.set("X-Tenant-ID", tenantId);
  }

  const clonedReq = req.clone({ headers });
  return next(clonedReq);
};
```

### 2.2 Error Interceptor (RFC 7807 ProblemDetail Handling)

```typescript
import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, throwError } from "rxjs";
import { ToastService } from "../../shared/services/toast.service";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.error && error.error.detail) {
        toast.error(error.error.title || "Error", error.error.detail);
      } else if (error.status === 401) {
        toast.error("Session Expired", "Please log in again.");
      } else if (error.status === 403) {
        toast.error("Access Denied", "You do not have permission to perform this action.");
      }
      return throwError(() => error);
    }),
  );
};
```

---

## 3. Real-Time WebSocket Client (STOMP over SockJS)

The front-end connects to `/ws-timer` using `@stomp/stompjs` and `sockjs-client`:

```typescript
import { Injectable, signal } from "@angular/core";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { AuthService } from "../auth/auth.service";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: "root" })
export class TimerWebSocketService {
  private client: Client | null = null;
  private timerSub: StompSubscription | null = null;

  readonly activeTimerEvent = signal<any>(null);

  constructor(private authService: AuthService) {}

  connect(tenantId: string) {
    this.disconnect();

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${this.authService.getAccessToken()}`,
      },
      debug: str => console.debug("[STOMP]", str),
      reconnectDelay: 5000,
      onConnect: () => {
        // Subscribe to live timer start events
        this.timerSub =
          this.client?.subscribe(`/topic/${tenantId}/timers/start`, message => {
            const data = JSON.parse(message.body);
            this.activeTimerEvent.set({ type: "START", data });
          }) ?? null;

        // Subscribe to live timer stop events
        this.client?.subscribe(`/topic/${tenantId}/timers/stop`, message => {
          const data = JSON.parse(message.body);
          this.activeTimerEvent.set({ type: "STOP", data });
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

## 4. API Service Catalog & Type Models

### 4.1 TypeScript Data Interfaces

```typescript
export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "CLIENT";
export type ClientStatus = "PROSPECT" | "ACTIVE" | "INACTIVE";
export type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "DELIVERED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE";

export interface Client {
  id: string;
  name: string;
  email: string;
  status: ClientStatus;
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
  totalLoggedMinutes: number;
  isOverBudget: boolean;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  durationMinutes: number;
  isBillable: boolean;
  createdAt: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  totalAmount: number;
  status: InvoiceStatus;
  createdAt: string;
}
```
