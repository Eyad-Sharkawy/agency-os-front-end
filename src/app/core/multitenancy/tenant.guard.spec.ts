import { TestBed } from "@angular/core/testing";
import {
  convertToParamMap,
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from "@angular/router";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { tenantGuard } from "./tenant.guard";
import { WorkspaceStore } from "./workspace.store";

describe("tenantGuard", () => {
  let mockWorkspaceStore: {
    hasActiveWorkspace: ReturnType<typeof vi.fn>;
    loadWorkspaces: ReturnType<typeof vi.fn>;
    workspaces: ReturnType<typeof vi.fn>;
    activeWorkspace: ReturnType<typeof vi.fn>;
    setActiveWorkspace: ReturnType<typeof vi.fn>;
  };
  let mockRouter: {
    createUrlTree: ReturnType<typeof vi.fn>;
  };

  const dummyRoute = { paramMap: convertToParamMap({}) } as unknown as ActivatedRouteSnapshot;
  const dummyState = {} as RouterStateSnapshot;

  beforeEach(() => {
    mockWorkspaceStore = {
      hasActiveWorkspace: vi.fn(),
      loadWorkspaces: vi.fn(),
      workspaces: vi.fn().mockReturnValue([]),
      activeWorkspace: vi.fn().mockReturnValue(null),
      setActiveWorkspace: vi.fn(),
    };
    mockRouter = {
      createUrlTree: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: WorkspaceStore, useValue: mockWorkspaceStore },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it("should match :workspaceId param from route, activate workspace and return true", async () => {
    const mockWs = { id: "ws-123", tenantId: "acme", name: "Acme Corp" };
    mockWorkspaceStore.workspaces.mockReturnValue([mockWs]);

    const routeWithParam = {
      paramMap: convertToParamMap({ workspaceId: "ws-123" }),
    } as unknown as ActivatedRouteSnapshot;

    const result = await TestBed.runInInjectionContext(() =>
      tenantGuard(routeWithParam, dummyState),
    );

    expect(mockWorkspaceStore.setActiveWorkspace).toHaveBeenCalledWith(mockWs);
    expect(result).toBe(true);
  });

  it("should load workspaces if empty and match :workspaceId param", async () => {
    const mockWs = { id: "ws-123", tenantId: "acme", name: "Acme Corp" };
    mockWorkspaceStore.workspaces.mockReturnValue([]);
    mockWorkspaceStore.loadWorkspaces.mockResolvedValue([mockWs]);

    const routeWithParam = {
      paramMap: convertToParamMap({ workspaceId: "ws-123" }),
    } as unknown as ActivatedRouteSnapshot;

    const result = await TestBed.runInInjectionContext(() =>
      tenantGuard(routeWithParam, dummyState),
    );

    expect(mockWorkspaceStore.loadWorkspaces).toHaveBeenCalled();
    expect(mockWorkspaceStore.setActiveWorkspace).toHaveBeenCalledWith(mockWs);
    expect(result).toBe(true);
  });

  it("should redirect to /workspaces if :workspaceId param does not match any workspace", async () => {
    const mockTree = {} as UrlTree;
    mockWorkspaceStore.workspaces.mockReturnValue([]);
    mockWorkspaceStore.loadWorkspaces.mockResolvedValue([
      { id: "ws-other", tenantId: "other", name: "Other Corp" },
    ]);
    mockRouter.createUrlTree.mockReturnValue(mockTree);

    const routeWithParam = {
      paramMap: convertToParamMap({ workspaceId: "ws-nonexistent" }),
    } as unknown as ActivatedRouteSnapshot;

    const result = await TestBed.runInInjectionContext(() =>
      tenantGuard(routeWithParam, dummyState),
    );

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(["/workspaces"]);
    expect(result).toBe(mockTree);
  });

  it("should return true when active workspace already exists and no param is provided", async () => {
    mockWorkspaceStore.hasActiveWorkspace.mockReturnValue(true);

    const result = await TestBed.runInInjectionContext(() => tenantGuard(dummyRoute, dummyState));

    expect(result).toBe(true);
    expect(mockWorkspaceStore.loadWorkspaces).not.toHaveBeenCalled();
  });

  it("should redirect to /workspaces if no workspaces are found on fallback", async () => {
    const mockTree = {} as UrlTree;
    mockWorkspaceStore.hasActiveWorkspace.mockReturnValue(false);
    mockWorkspaceStore.loadWorkspaces.mockResolvedValue([]);
    mockRouter.createUrlTree.mockReturnValue(mockTree);

    const result = await TestBed.runInInjectionContext(() => tenantGuard(dummyRoute, dummyState));

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(["/workspaces"]);
    expect(result).toBe(mockTree);
  });
});
