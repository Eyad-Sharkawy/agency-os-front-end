import { Routes } from "@angular/router";
import { DashboardShell } from "./layout/dashboard-shell/dashboard-shell";
import { LandingPage } from "./features/landing-page/landing-page";
import { authGuard } from "./core/auth/auth.guard";
import { redirectIfAuthenticatedGuard } from "./core/auth/redirect-if-authenticated.guard";

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
  },

  {
    path: "workspaces",
    canActivate: [authGuard],
    loadChildren: () =>
      import("./features/workspaces/workspaces.routes").then(m => m.WORKSPACE_ROUTES),
  },
  {
    path: "",
    component: DashboardShell,
  },
];
