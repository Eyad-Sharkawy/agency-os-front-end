import { TestBed } from "@angular/core/testing";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { signal, WritableSignal } from "@angular/core";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { roleGuard } from "./role.guard";
import { WorkspaceStore } from "../../multitenancy/workspace.store";
import { WorkspaceResponse } from "../../api/models/workspace.models";

describe("roleGuard", () => {
  let workspaceStoreMock: {
    activeWorkspace: WritableSignal<WorkspaceResponse | null>;
    activeRole: WritableSignal<string | null>;
    hasActiveWorkspace: WritableSignal<boolean>;
    loadWorkspaces: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    createUrlTree: ReturnType<typeof vi.fn>;
  };
  const dummyState = {} as RouterStateSnapshot;

  const sampleWorkspace: WorkspaceResponse = {
    id: "ws-1",
    name: "Acme Agency",
    tenantId: "tenant-acme",
    contactEmail: "admin@acme.com",
    role: "ADMIN",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  beforeEach(() => {
    workspaceStoreMock = {
      activeWorkspace: signal<WorkspaceResponse | null>(sampleWorkspace),
      activeRole: signal<string | null>("ADMIN"),
      hasActiveWorkspace: signal<boolean>(true),
      loadWorkspaces: vi.fn().mockResolvedValue([sampleWorkspace]),
    };

    routerMock = {
      createUrlTree: vi.fn((commands: unknown[]) => ({ tree: commands }) as unknown as UrlTree),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: WorkspaceStore, useValue: workspaceStoreMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it("should allow navigation if no roles specified in route data", async () => {
    const route = {
      data: {},
      paramMap: { get: () => null },
    } as unknown as ActivatedRouteSnapshot;

    const result = await TestBed.runInInjectionContext(() => roleGuard(route, dummyState));
    expect(result).toBe(true);
  });

  it("should allow navigation if active role is in allowed roles list", async () => {
    const route = {
      data: { roles: ["OWNER", "ADMIN", "MEMBER"] },
      paramMap: { get: () => "tenant-acme" },
    } as unknown as ActivatedRouteSnapshot;

    const result = await TestBed.runInInjectionContext(() => roleGuard(route, dummyState));
    expect(result).toBe(true);
  });

  it("should redirect to /w/:workspaceId/unauthorized if role is not allowed", async () => {
    workspaceStoreMock.activeRole.set("CLIENT");

    const route = {
      data: { roles: ["OWNER", "ADMIN", "MEMBER"] },
      paramMap: { get: (key: string) => (key === "workspaceId" ? "tenant-acme" : null) },
      parent: null,
    } as unknown as ActivatedRouteSnapshot;

    const result = await TestBed.runInInjectionContext(() => roleGuard(route, dummyState));
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(["/w", "tenant-acme", "unauthorized"]);
    expect(result).toEqual({ tree: ["/w", "tenant-acme", "unauthorized"] });
  });

  it("should load workspaces if not active, and redirect to /workspaces if empty", async () => {
    workspaceStoreMock.hasActiveWorkspace.set(false);
    workspaceStoreMock.loadWorkspaces.mockResolvedValue([]);

    const route = {
      data: { roles: ["OWNER", "ADMIN"] },
      paramMap: { get: () => null },
    } as unknown as ActivatedRouteSnapshot;

    const result = await TestBed.runInInjectionContext(() => roleGuard(route, dummyState));
    expect(workspaceStoreMock.loadWorkspaces).toHaveBeenCalled();
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(["/workspaces"]);
    expect(result).toEqual({ tree: ["/workspaces"] });
  });

  it("should fallback to /unauthorized if no workspaceId is resolvable", async () => {
    workspaceStoreMock.activeWorkspace.set(null);
    workspaceStoreMock.activeRole.set("CLIENT");
    workspaceStoreMock.hasActiveWorkspace.set(true);

    const route = {
      data: { roles: ["OWNER", "ADMIN"] },
      paramMap: { get: () => null },
      parent: null,
    } as unknown as ActivatedRouteSnapshot;

    const result = await TestBed.runInInjectionContext(() => roleGuard(route, dummyState));
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(["/unauthorized"]);
    expect(result).toEqual({ tree: ["/unauthorized"] });
  });
});
