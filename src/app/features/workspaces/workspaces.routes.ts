import { Routes } from "@angular/router";

export const WORKSPACE_ROUTES: Routes = [
  {
    path: "",
    children: [
      {
        path: "",
        title: "Agency OS - Workspaces",
        loadComponent: () => import("./workspaces").then(m => m.Workspaces),
      },
      {
        path: "create",
        title: "Agency OS - Create workspace",
        loadComponent: () =>
          import("./create-workspace/create-workspace").then(m => m.CreateWorkspace),
      },
    ],
  },
];
