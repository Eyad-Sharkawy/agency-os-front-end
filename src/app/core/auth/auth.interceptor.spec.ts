import { TestBed } from "@angular/core/testing";
import { HttpClient, provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { authInterceptor } from "./auth.interceptor";
import { AuthStore } from "./auth.store";
import { ENVIRONMENT } from "../tokens/environment.token";

describe("authInterceptor", () => {
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

  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let authStore: InstanceType<typeof AuthStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT, useValue: mockEnv },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    authStore = TestBed.inject(AuthStore);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("should add Authorization header for requests targeting apiUrl when token is present", async () => {
    vi.spyOn(authStore, "getValidToken").mockResolvedValue("test-valid-token");

    httpClient.get("https://api.example.com/users").subscribe();

    await Promise.resolve(); // Wait for promise microtask

    const req = httpTesting.expectOne("https://api.example.com/users");
    expect(req.request.headers.get("Authorization")).toBe("Bearer test-valid-token");
    req.flush({});
  });

  it("should not add Authorization header for non-api requests", () => {
    const getValidTokenSpy = vi.spyOn(authStore, "getValidToken");

    httpClient.get("https://other-domain.com/data").subscribe();

    const req = httpTesting.expectOne("https://other-domain.com/data");
    expect(req.request.headers.has("Authorization")).toBe(false);
    expect(getValidTokenSpy).not.toHaveBeenCalled();
    req.flush({});
  });

  it("should not add Authorization header if token is null", async () => {
    vi.spyOn(authStore, "getValidToken").mockResolvedValue(null);

    httpClient.get("https://api.example.com/public").subscribe();

    await Promise.resolve();

    const req = httpTesting.expectOne("https://api.example.com/public");
    expect(req.request.headers.has("Authorization")).toBe(false);
    req.flush({});
  });
});
