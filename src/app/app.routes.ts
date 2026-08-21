import { Routes } from "@angular/router";
import { DashboardShell } from "./layout/dashboard-shell/dashboard-shell";
import { LandingPage } from "./features/landing-page/landing-page";

export const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    component: LandingPage,
  },
  {
    path: "how-it-works",
    loadComponent: () => import("./features/how-it-works/how-it-works").then(m => m.HowItWorks),
  },
  {
    path: "",
    component: DashboardShell,
  },
];
