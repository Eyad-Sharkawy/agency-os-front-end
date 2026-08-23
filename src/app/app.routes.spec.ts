import { routes } from "./app.routes";
import { LandingPage } from "./features/landing-page/landing-page";
import { DashboardShell } from "./layout/dashboard-shell/dashboard-shell";

describe("App Routes Configuration", () => {
  it("should have correct route paths defined", () => {
    expect(routes.length).toBe(3);

    // Root landing page route
    const rootRoute = routes[0];
    expect(rootRoute.path).toBe("");
    expect(rootRoute.pathMatch).toBe("full");
    expect(rootRoute.component).toBe(LandingPage);

    // How it works route
    const howItWorksRoute = routes[1];
    expect(howItWorksRoute.path).toBe("how-it-works");
    expect(typeof howItWorksRoute.loadComponent).toBe("function");

    // Dashboard shell wildcard/default fallback route
    const dashboardRoute = routes[2];
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
});
