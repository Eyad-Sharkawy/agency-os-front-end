import { routes } from "./app.routes";
import { LandingPage } from "./features/landing-page/landing-page";
import { DashboardShell } from "./layout/dashboard-shell/dashboard-shell";
import { authGuard } from "./core/auth/guards/auth.guard";
import { redirectIfAuthenticatedGuard } from "./core/auth/guards/redirect-if-authenticated.guard";

describe("App Routes Configuration", () => {
  it("should have correct route paths defined", () => {
    expect(routes.length).toBe(4);

    // Root landing page route with redirect guard for logged-in users
    const rootRoute = routes[0];
    expect(rootRoute.path).toBe("");
    expect(rootRoute.pathMatch).toBe("full");
    expect(rootRoute.component).toBe(LandingPage);
    expect(rootRoute.canActivate).toEqual([redirectIfAuthenticatedGuard]);

    // How it works route
    const howItWorksRoute = routes[1];
    expect(howItWorksRoute.path).toBe("how-it-works");
    expect(typeof howItWorksRoute.loadComponent).toBe("function");

    // Workspaces lazy feature routes
    const workspacesRoute = routes[2];
    expect(workspacesRoute.path).toBe("workspaces");
    expect(workspacesRoute.canActivate).toEqual([authGuard]);
    expect(typeof workspacesRoute.loadChildren).toBe("function");

    // Dashboard shell wildcard/default fallback route
    const dashboardRoute = routes[3];
    expect(dashboardRoute.path).toBe("");
    expect(dashboardRoute.component).toBe(DashboardShell);
  });

  it("should lazy load HowItWorks component correctly", async () => {
    const howItWorksRoute = routes[1];
    if (howItWorksRoute.loadComponent) {
      const loadedComponent = await (howItWorksRoute.loadComponent as () => Promise<unknown>)();
      expect(loadedComponent).toBeDefined();
    }
  });

  it("should lazy load Workspaces feature routes correctly", async () => {
    const workspacesRoute = routes[2];
    if (workspacesRoute.loadChildren) {
      const loadedRoutes = await (workspacesRoute.loadChildren as () => Promise<unknown>)();
      expect(loadedRoutes).toBeDefined();
    }
  });
});
