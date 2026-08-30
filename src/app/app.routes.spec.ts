import { routes } from "./app.routes";
import { authGuard } from "./core/auth/guards/auth.guard";
import { redirectIfAuthenticatedGuard } from "./core/auth/guards/redirect-if-authenticated.guard";
import { tenantGuard } from "./core/multitenancy/tenant.guard";
import { LandingPage } from "./features/landing-page/landing-page";
import { DashboardShell } from "./layout/dashboard-shell/dashboard-shell";

describe("App Routes Configuration", () => {
  it("should have correct route paths defined", () => {
    expect(routes).toHaveLength(6);

    // Root landing page route
    const rootRoute = routes[0];
    expect(rootRoute.path).toBe("");
    expect(rootRoute.pathMatch).toBe("full");
    expect(rootRoute.component).toBe(LandingPage);
    expect(rootRoute.canActivate).toEqual([redirectIfAuthenticatedGuard]);

    // How it works route
    const howItWorksRoute = routes[1];
    expect(howItWorksRoute.path).toBe("how-it-works");
    expect(typeof howItWorksRoute.loadComponent).toBe("function");

    // Workspaces feature routes
    const workspacesRoute = routes[2];
    expect(workspacesRoute.path).toBe("workspaces");
    expect(workspacesRoute.canActivate).toEqual([authGuard]);

    // Authenticated Dashboard shell route tree
    const workspaceShellRoute = routes[3];
    expect(workspaceShellRoute.path).toBe("w/:workspaceId");
    expect(workspaceShellRoute.component).toBe(DashboardShell);
    expect(workspaceShellRoute.canActivate).toEqual([authGuard, tenantGuard]);
    expect(workspaceShellRoute.children).toHaveLength(6);

    // App backwards compatibility route
    const appRoute = routes[4];
    expect(appRoute.path).toBe("app");
    expect(appRoute.redirectTo).toBe("workspaces");
  });

  it("should lazy load children features under /w/:workspaceId", async () => {
    const workspaceShellRoute = routes[3];
    const children = workspaceShellRoute.children ?? [];

    for (const child of children) {
      if (child.loadComponent) {
        const loaded = await (child.loadComponent as () => Promise<unknown>)();
        expect(loaded).toBeDefined();
      }
    }
  });
});
