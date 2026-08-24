import { TestBed } from "@angular/core/testing";
import { ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { authGuard } from "./auth.guard";
import { AuthStore } from "../stores/auth.store";
import { ENVIRONMENT } from "../../tokens/enviroment/environment.token";

describe("authGuard", () => {
  const mockEnv = {
    production: false,
    apiUrl: "https://api.example.com",
    wsUrl: "wss://api.example.com/ws",
    keycloak: {
      url: "https://auth.example.com",
      realm: "test-realm",
      clientId: "test-client",
    },
  };

  let authStore: InstanceType<typeof AuthStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ENVIRONMENT, useValue: mockEnv }],
    });
    authStore = TestBed.inject(AuthStore);
  });

  it("should allow navigation if user is authenticated", async () => {
    vi.spyOn(authStore, "isAuthenticated").mockReturnValue(true);

    const route = {} as ActivatedRouteSnapshot;
    const state = { url: "/dashboard" } as RouterStateSnapshot;

    const result = await TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBe(true);
  });

  it("should prevent navigation and call login if user is not authenticated", async () => {
    vi.spyOn(authStore, "isAuthenticated").mockReturnValue(false);
    const loginSpy = vi.spyOn(authStore, "login").mockImplementation(() => Promise.resolve());

    const route = {} as ActivatedRouteSnapshot;
    const state = { url: "/protected-page" } as RouterStateSnapshot;

    const result = await TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBe(false);
    expect(loginSpy).toHaveBeenCalledWith(window.location.origin + "/protected-page");
  });
});
