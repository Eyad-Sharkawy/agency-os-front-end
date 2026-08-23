import { TestBed } from "@angular/core/testing";
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from "@angular/router";
import { redirectIfAuthenticatedGuard } from "./redirect-if-authenticated.guard";
import { AuthStore } from "./auth.store";
import { ENVIRONMENT } from "../tokens/environment.token";

describe("redirectIfAuthenticatedGuard", () => {
  const mockEnv = {
    production: false,
    apiUrl: "https://api.example.com",
    wsUrl: "wss://api.example.com/ws",
    keycloak: { url: "", realm: "", clientId: "" },
  };

  let authStore: InstanceType<typeof AuthStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), AuthStore, { provide: ENVIRONMENT, useValue: mockEnv }],
    });

    authStore = TestBed.inject(AuthStore);
  });

  it("should redirect to /workspaces when user is authenticated", () => {
    vi.spyOn(authStore, "isAuthenticated").mockReturnValue(true);

    const dummyRoute = {} as ActivatedRouteSnapshot;
    const dummyState = {} as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() =>
      redirectIfAuthenticatedGuard(dummyRoute, dummyState),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe("/workspaces");
  });

  it("should allow navigation to landing page when user is not authenticated", () => {
    vi.spyOn(authStore, "isAuthenticated").mockReturnValue(false);

    const dummyRoute = {} as ActivatedRouteSnapshot;
    const dummyState = {} as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() =>
      redirectIfAuthenticatedGuard(dummyRoute, dummyState),
    );

    expect(result).toBe(true);
  });
});
