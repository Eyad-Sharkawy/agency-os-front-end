import { Routes } from "@angular/router";
import { authGuard } from "./core/auth/guards/auth.guard";
import { redirectIfAuthenticatedGuard } from "./core/auth/guards/redirect-if-authenticated.guard";
import { tenantGuard } from "./core/multitenancy/tenant.guard";
import { LandingPage } from "./features/landing-page/landing-page";
import { DashboardShell } from "./layout/dashboard-shell/dashboard-shell";

export const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    component: LandingPage,
    canActivate: [redirectIfAuthenticatedGuard],
  },
  {
    path: "how-it-works",
    loadComponent: () => import("./features/how-it-works/how-it-works").then(m => m.HowItWorks),
    canActivate: [redirectIfAuthenticatedGuard],
  },
  {
    path: "workspaces",
    canActivate: [authGuard],
    loadChildren: () =>
      import("./features/workspaces/workspaces.routes").then(m => m.WORKSPACE_ROUTES),
  },
  {
    path: "w/:workspaceId",
    canActivate: [authGuard, tenantGuard],
    component: DashboardShell,
    children: [
      {
        path: "",
        title: "Agency OS - Dashboard",
        loadComponent: () =>
          import("./features/dashboard-overview/dashboard-overview").then(m => m.DashboardOverview),
      },
      {
        path: "clients",
        title: "Agency OS - Clients",
        loadComponent: () => import("./features/clients/clients").then(m => m.ClientsComponent),
      },
      {
        path: "projects",
        title: "Agency OS - Projects",
        loadComponent: () => import("./features/projects/projects").then(m => m.ProjectsComponent),
      },
      {
        path: "tasks",
        title: "Agency OS - Tasks",
        loadComponent: () => import("./features/tasks/tasks").then(m => m.TasksComponent),
      },
      {
        path: "time-tracking",
        title: "Agency OS - Time Tracking",
        loadComponent: () =>
          import("./features/time-tracking/time-tracking").then(m => m.TimeTrackingComponent),
      },
      {
        path: "invoices",
        title: "Agency OS - Invoices",
        loadComponent: () => import("./features/invoices/invoices").then(m => m.InvoicesComponent),
      },
    ],
  },
  {
    path: "app",
    redirectTo: "workspaces",
  },
  {
    path: "**",
    redirectTo: "",
  },
];
