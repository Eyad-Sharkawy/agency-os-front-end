import { TestBed } from "@angular/core/testing";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { signal } from "@angular/core";
import { WorkspaceApi } from "./workspace-api";
import { ENVIRONMENT } from "../../../tokens/enviroment/environment.token";
import {
  WorkspaceRequest,
  WorkspaceResponse,
  WorkspaceMemberResponse,
  WorkspaceMemberUpdateRequest,
  WorkspaceOwnershipTransferRequest,
} from "../../models/workspace.models";

describe("WorkspaceApi", () => {
  let service: WorkspaceApi;
  let httpTesting: HttpTestingController;

  const mockEnv = {
    production: false,
    apiUrl: "https://api.example.com/api/v1",
    wsUrl: "wss://api.example.com/ws",
    keycloak: { url: "", realm: "", clientId: "" },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WorkspaceApi,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT, useValue: mockEnv },
      ],
    });

    service = TestBed.inject(WorkspaceApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("should create httpResource for listing workspaces", async () => {
    const mockResponses: WorkspaceResponse[] = [
      {
        id: "w-1",
        name: "Acme Agency",
        tenantId: "tenant_acme",
        contactEmail: "admin@acme.com",
        isActive: true,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    let resource: ReturnType<typeof service.getWorkspacesResource>;
    TestBed.runInInjectionContext(() => {
      resource = service.getWorkspacesResource({ defaultValue: [] });
      TestBed.flushEffects();
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/workspaces");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponses);

    await Promise.resolve();
    TestBed.flushEffects();

    expect(resource!.value()).toEqual(mockResponses);
  });

  it("should create httpResource for workspace members reacting to tenantId signal", async () => {
    const mockMembers: WorkspaceMemberResponse[] = [
      {
        userId: "u-1",
        username: "john",
        email: "john@acme.com",
        firstName: "John",
        lastName: "Doe",
        role: "OWNER",
      },
    ];

    let resource: ReturnType<typeof service.getMembersResource>;
    TestBed.runInInjectionContext(() => {
      const tenantId = signal<string | undefined>("tenant_acme");
      resource = service.getMembersResource(tenantId);
      TestBed.flushEffects();
    });

    const req = httpTesting.expectOne(
      "https://api.example.com/api/v1/workspaces/tenant_acme/members",
    );
    expect(req.request.method).toBe("GET");
    req.flush(mockMembers);

    await Promise.resolve();
    TestBed.flushEffects();

    expect(resource!.value()).toEqual(mockMembers);
  });

  it("should list workspaces via GET", () => {
    const mockResponses: WorkspaceResponse[] = [
      {
        id: "w-1",
        name: "Acme Agency",
        tenantId: "tenant_acme",
        contactEmail: "admin@acme.com",
        isActive: true,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    service.getWorkspaces().subscribe(res => {
      expect(res).toEqual(mockResponses);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/workspaces");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponses);
  });

  it("should create workspace via POST", () => {
    const payload: WorkspaceRequest = {
      name: "Acme Agency",
      contactEmail: "admin@acme.com",
    };
    const mockResponse: WorkspaceResponse = {
      id: "w-1",
      name: "Acme Agency",
      tenantId: "tenant_acme",
      contactEmail: "admin@acme.com",
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    service.createWorkspace(payload).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/workspaces");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it("should update workspace via PUT", () => {
    const payload: WorkspaceRequest = {
      name: "Acme Agency Updated",
      contactEmail: "admin@acme.com",
    };
    const mockResponse: WorkspaceResponse = {
      id: "w-1",
      name: "Acme Agency Updated",
      tenantId: "tenant_acme",
      contactEmail: "admin@acme.com",
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    };

    service.updateWorkspace("tenant_acme", payload).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/workspaces/tenant_acme");
    expect(req.request.method).toBe("PUT");
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it("should delete workspace via DELETE", () => {
    service.deleteWorkspace("tenant_acme").subscribe();

    const req = httpTesting.expectOne("https://api.example.com/api/v1/workspaces/tenant_acme");
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });

  it("should get workspace members via GET", () => {
    const mockMembers: WorkspaceMemberResponse[] = [
      {
        userId: "u-1",
        username: "john",
        email: "john@acme.com",
        firstName: "John",
        lastName: "Doe",
        role: "OWNER",
      },
    ];

    service.getMembers("tenant_acme").subscribe(res => {
      expect(res).toEqual(mockMembers);
    });

    const req = httpTesting.expectOne(
      "https://api.example.com/api/v1/workspaces/tenant_acme/members",
    );
    expect(req.request.method).toBe("GET");
    req.flush(mockMembers);
  });

  it("should update workspace member role via PUT", () => {
    const payload: WorkspaceMemberUpdateRequest = { role: "ADMIN" };
    const mockResponse: WorkspaceMemberResponse = {
      userId: "u-2",
      username: "sarah",
      email: "sarah@acme.com",
      firstName: "Sarah",
      lastName: "Smith",
      role: "ADMIN",
    };

    service.updateMemberRole("tenant_acme", "u-2", payload).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne(
      "https://api.example.com/api/v1/workspaces/tenant_acme/members/u-2",
    );
    expect(req.request.method).toBe("PUT");
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it("should remove workspace member via DELETE", () => {
    service.removeMember("tenant_acme", "u-2").subscribe();

    const req = httpTesting.expectOne(
      "https://api.example.com/api/v1/workspaces/tenant_acme/members/u-2",
    );
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });

  it("should transfer workspace ownership via POST", () => {
    const payload: WorkspaceOwnershipTransferRequest = {
      newOwnerId: "u-2",
    };

    service.transferOwnership("tenant_acme", payload).subscribe();

    const req = httpTesting.expectOne(
      "https://api.example.com/api/v1/workspaces/tenant_acme/transfer-ownership",
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(null);
  });
});
