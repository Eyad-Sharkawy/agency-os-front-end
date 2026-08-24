import { TestBed } from "@angular/core/testing";
import { WorkspaceStore } from "./workspace.store";
import { WorkspaceApi } from "../api/services/workspace/workspace-api";
import { LOCAL_STORAGE } from "../tokens/local-storage/local-storage.token";
import { of, throwError } from "rxjs";
import { WorkspaceResponse } from "../api/models/workspace.models";

describe("WorkspaceStore", () => {
  let store: InstanceType<typeof WorkspaceStore>;
  let workspaceService: { getWorkspaces: ReturnType<typeof vi.fn> };
  let mockStorage: Storage;

  const mockWorkspaces: WorkspaceResponse[] = [
    {
      id: "w-1",
      name: "Workspace One",
      tenantId: "tenant_1",
      contactEmail: "admin1@test.com",
      role: "OWNER",
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "w-2",
      name: "Workspace Two",
      tenantId: "tenant_2",
      contactEmail: "admin2@test.com",
      role: "MEMBER",
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    const memoryStore: Record<string, string> = {};
    mockStorage = {
      getItem: vi.fn((k: string) => memoryStore[k] || null),
      setItem: vi.fn((k: string, v: string) => {
        memoryStore[k] = v;
      }),
      removeItem: vi.fn((k: string) => {
        delete memoryStore[k];
      }),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };

    workspaceService = {
      getWorkspaces: vi.fn().mockReturnValue(of(mockWorkspaces)),
    };

    TestBed.configureTestingModule({
      providers: [
        WorkspaceStore,
        { provide: WorkspaceApi, useValue: workspaceService },
        { provide: LOCAL_STORAGE, useValue: mockStorage },
      ],
    });

    store = TestBed.inject(WorkspaceStore);
  });

  it("should initialize with default empty state", () => {
    expect(store.workspaces()).toEqual([]);
    expect(store.activeWorkspace()).toBeNull();
    expect(store.activeTenantId()).toBeNull();
    expect(store.hasActiveWorkspace()).toBe(false);
  });

  it("should load workspaces and automatically select the first if no active tenant is saved", async () => {
    const result = await store.loadWorkspaces();

    expect(result).toEqual(mockWorkspaces);
    expect(store.workspaces()).toEqual(mockWorkspaces);
    expect(store.activeWorkspace()).toEqual(mockWorkspaces[0]);
    expect(store.activeTenantId()).toBe("tenant_1");
    expect(mockStorage.setItem).toHaveBeenCalledWith("agency_os_active_tenant_id", "tenant_1");
  });

  it("should select the saved tenant if present in storage", async () => {
    (mockStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue("tenant_2");

    await store.loadWorkspaces();

    expect(store.activeWorkspace()).toEqual(mockWorkspaces[1]);
    expect(store.activeTenantId()).toBe("tenant_2");
  });

  it("should handle error when loading workspaces fails", async () => {
    workspaceService.getWorkspaces.mockReturnValue(throwError(() => new Error("Network error")));

    const result = await store.loadWorkspaces();

    expect(result).toEqual([]);
    expect(store.error()).toBe("Network error");
    expect(store.isLoading()).toBe(false);
  });

  it("should switch active workspace and persist to storage", () => {
    store.setActiveWorkspace(mockWorkspaces[1]);

    expect(store.activeWorkspace()).toEqual(mockWorkspaces[1]);
    expect(store.activeTenantId()).toBe("tenant_2");
    expect(mockStorage.setItem).toHaveBeenCalledWith("agency_os_active_tenant_id", "tenant_2");
  });

  it("should clear workspace state", () => {
    store.setActiveWorkspace(mockWorkspaces[0]);
    store.clear();

    expect(store.activeWorkspace()).toBeNull();
    expect(store.workspaces()).toEqual([]);
    expect(mockStorage.removeItem).toHaveBeenCalledWith("agency_os_active_tenant_id");
  });
});
