import { Routes } from "@angular/router";
import { DashboardShell } from "./layout/dashboard-shell/dashboard-shell";

export const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    loadComponent: () => import("./features/landing-page/landing-page").then((m) => m.LandingPage)
  },
  {
    path: "",
    component: DashboardShell
  }
];
