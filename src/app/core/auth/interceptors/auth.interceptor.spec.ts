import { TestBed } from "@angular/core/testing";
import { HttpClient, provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { authInterceptor } from "./auth.interceptor";
import { AuthStore } from "../stores/auth.store";
import { WorkspaceStore } from "../../multitenancy/workspace.store";
import { WorkspaceApi } from "../../api/services/workspace/workspace-api";
import { ENVIRONMENT } from "../../tokens/enviroment/environment.token";

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
  let workspaceStore: InstanceType<typeof WorkspaceStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WorkspaceApi,
        WorkspaceStore,
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT, useValue: mockEnv },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    authStore = TestBed.inject(AuthStore);
    workspaceStore = TestBed.inject(WorkspaceStore);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("should add Authorization header for requests targeting apiUrl when token is present", async () => {
    vi.spyOn(authStore, "getValidToken").mockResolvedValue("test-valid-token");

    httpClient.get("https://api.example.com/users").subscribe();

    await Promise.resolve();

    const req = httpTesting.expectOne("https://api.example.com/users");
    expect(req.request.headers.get("Authorization")).toBe("Bearer test-valid-token");
    req.flush({});
  });

  it("should add Authorization header for requests targeting keycloak.url without X-Tenant-ID", async () => {
    vi.spyOn(authStore, "getValidToken").mockResolvedValue("test-valid-token");
    workspaceStore.setActiveWorkspace({
      id: "w-1",
      name: "Acme",
      tenantId: "tenant_acme_123",
      contactEmail: "admin@acme.com",
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    });

    httpClient.get("https://auth.example.com/realms/test-realm/account").subscribe();

    await Promise.resolve();

    const req = httpTesting.expectOne("https://auth.example.com/realms/test-realm/account");
    expect(req.request.headers.get("Authorization")).toBe("Bearer test-valid-token");
    expect(req.request.headers.has("X-Tenant-ID")).toBe(false);
    req.flush({});
  });

  it("should add X-Tenant-ID header when activeTenantId is present and endpoint is tenant-scoped", async () => {
    vi.spyOn(authStore, "getValidToken").mockResolvedValue("test-valid-token");
    workspaceStore.setActiveWorkspace({
      id: "w-1",
      name: "Acme",
      tenantId: "tenant_acme_123",
      contactEmail: "admin@acme.com",
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    });

    httpClient.get("https://api.example.com/clients").subscribe();

    await Promise.resolve();

    const req = httpTesting.expectOne("https://api.example.com/clients");
    expect(req.request.headers.get("Authorization")).toBe("Bearer test-valid-token");
    expect(req.request.headers.get("X-Tenant-ID")).toBe("tenant_acme_123");
    req.flush([]);
  });

  it("should not add X-Tenant-ID header for global workspace root endpoint", async () => {
    vi.spyOn(authStore, "getValidToken").mockResolvedValue("test-valid-token");
    workspaceStore.setActiveWorkspace({
      id: "w-1",
      name: "Acme",
      tenantId: "tenant_acme_123",
      contactEmail: "admin@acme.com",
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    });

    httpClient.get("https://api.example.com/workspaces").subscribe();

    await Promise.resolve();

    const req = httpTesting.expectOne("https://api.example.com/workspaces");
    expect(req.request.headers.has("X-Tenant-ID")).toBe(false);
    req.flush([]);
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
