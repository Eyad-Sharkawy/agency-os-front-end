import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { of } from "rxjs";
import { Workspaces } from "./workspaces";
import { WorkspaceApi } from "../../core/api/services/workspace/workspace-api";
import { InvitationApi } from "../../core/api/services/invitation/invitation-api";
import { WorkspaceStore } from "../../core/multitenancy/workspace.store";
import { AuthStore } from "../../core/auth/stores/auth.store";
import { ENVIRONMENT } from "../../core/tokens/enviroment/environment.token";
import { LOCAL_STORAGE } from "../../core/tokens/local-storage/local-storage.token";
import { WorkspaceResponse } from "../../core/api/models/workspace.models";
import { WorkspaceInvitationResponse } from "../../core/api/models/invitation.models";
import { WorkspaceManagement } from "./services/workspace-management";

describe("Workspaces Component", () => {
  let component: Workspaces;
  let mockWorkspacesResource: {
    value: ReturnType<typeof vi.fn>;
    isLoading: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
  };
  let mockInvitationsResource: {
    value: ReturnType<typeof vi.fn>;
    isLoading: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
  };
  let workspaceServiceMock: {
    getWorkspacesResource: ReturnType<typeof vi.fn>;
    createWorkspace: ReturnType<typeof vi.fn>;
    updateWorkspace: ReturnType<typeof vi.fn>;
    deleteWorkspace: ReturnType<typeof vi.fn>;
    getWorkspaces: ReturnType<typeof vi.fn>;
    getMembers: ReturnType<typeof vi.fn>;
    updateMemberRole: ReturnType<typeof vi.fn>;
    removeMember: ReturnType<typeof vi.fn>;
    transferOwnership: ReturnType<typeof vi.fn>;
  };
  let invitationServiceMock: {
    getPendingInvitationsResource: ReturnType<typeof vi.fn>;
    acceptInvitation: ReturnType<typeof vi.fn>;
    declineInvitation: ReturnType<typeof vi.fn>;
  };
  let workspaceStore: InstanceType<typeof WorkspaceStore>;
  let authStore: InstanceType<typeof AuthStore>;
  let router: Router;

  const mockWorkspaces: WorkspaceResponse[] = [
    {
      id: "w-1",
      name: "Acme Agency",
      tenantId: "tenant_acme",
      contactEmail: "admin@acme.com",
      role: "OWNER",
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "w-2",
      name: "Stark Industries",
      tenantId: "tenant_stark",
      contactEmail: "tony@stark.com",
      role: "MEMBER",
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];

  const mockInvitations: WorkspaceInvitationResponse[] = [
    {
      id: "inv-1",
      workspaceId: "w-3",
      workspaceName: "Wayne Enterprises",
      username: "johndoe",
      invitedByUsername: "bruce",
      role: "ADMIN",
      status: "PENDING",
      createdAt: "2026-01-01T00:00:00Z",
    },
  ];

  const mockEnv = {
    production: false,
    apiUrl: "https://api.example.com/api/v1",
    wsUrl: "wss://api.example.com/ws",
    keycloak: { url: "", realm: "", clientId: "" },
  };

  beforeEach(async () => {
    mockWorkspacesResource = {
      value: vi.fn().mockReturnValue(mockWorkspaces),
      isLoading: vi.fn().mockReturnValue(false),
      error: vi.fn().mockReturnValue(null),
      reload: vi.fn(),
    };

    mockInvitationsResource = {
      value: vi.fn().mockReturnValue(mockInvitations),
      isLoading: vi.fn().mockReturnValue(false),
      error: vi.fn().mockReturnValue(null),
      reload: vi.fn(),
    };

    workspaceServiceMock = {
      getWorkspacesResource: vi.fn().mockReturnValue(mockWorkspacesResource),
      createWorkspace: vi.fn().mockReturnValue(
        of({
          id: "w-3",
          name: "New Enterprise",
          tenantId: "tenant_new",
          contactEmail: "admin@agency.com",
          role: "OWNER",
          isActive: true,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        }),
      ),
      updateWorkspace: vi.fn().mockImplementation((_tenantId, payload) =>
        of({
          ...mockWorkspaces[0],
          name: payload.name,
        }),
      ),
      deleteWorkspace: vi.fn().mockReturnValue(of(undefined)),
      getWorkspaces: vi.fn().mockReturnValue(of(mockWorkspaces)),
      getMembers: vi.fn().mockReturnValue(of([])),
      updateMemberRole: vi.fn().mockReturnValue(of(undefined)),
      removeMember: vi.fn().mockReturnValue(of(undefined)),
      transferOwnership: vi.fn().mockReturnValue(of(mockWorkspaces[0])),
    };

    invitationServiceMock = {
      getPendingInvitationsResource: vi.fn().mockReturnValue(mockInvitationsResource),
      acceptInvitation: vi.fn().mockReturnValue(of(undefined)),
      declineInvitation: vi.fn().mockReturnValue(of(undefined)),
    };

    const mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };

    await TestBed.configureTestingModule({
      imports: [Workspaces],
      providers: [
        provideRouter([]),
        WorkspaceManagement,
        { provide: WorkspaceApi, useValue: workspaceServiceMock },
        { provide: InvitationApi, useValue: invitationServiceMock },
        { provide: ENVIRONMENT, useValue: mockEnv },
        { provide: LOCAL_STORAGE, useValue: mockStorage },
        WorkspaceStore,
        AuthStore,
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, "navigate").mockImplementation(() => Promise.resolve(true));

    workspaceStore = TestBed.inject(WorkspaceStore);
    authStore = TestBed.inject(AuthStore);
    vi.spyOn(authStore, "userEmail").mockReturnValue("admin@agency.com");

    const fixture = TestBed.createComponent(Workspaces);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component and populate workspaces from resource", () => {
    expect(component).toBeTruthy();
    expect(component.filteredWorkspaces()).toEqual(mockWorkspaces);
    expect(component.pendingInvitations()).toEqual(mockInvitations);
  });

  it("should filter workspaces based on search query", () => {
    component.searchQuery.set("stark");
    expect(component.filteredWorkspaces().length).toBe(1);
    expect(component.filteredWorkspaces()[0].name).toBe("Stark Industries");

    component.searchQuery.set("non-existent");
    expect(component.filteredWorkspaces().length).toBe(0);
  });

  it("should select workspace, update WorkspaceStore and navigate to root", () => {
    const setActiveSpy = vi.spyOn(workspaceStore, "setActiveWorkspace");

    component.selectWorkspace(mockWorkspaces[0]);

    expect(setActiveSpy).toHaveBeenCalledWith(mockWorkspaces[0]);
    expect(router.navigate).toHaveBeenCalledWith(["/"]);
  });

  it("should open and close manage workspace modal with query params navigation", () => {
    expect(component.isManageModalOpen()).toBe(false);

    component.openManageModal(mockWorkspaces[0], "members");
    expect(component.isManageModalOpen()).toBe(true);
    expect(component.selectedManageWorkspace()).toEqual(mockWorkspaces[0]);
    expect(component.selectedManageTab()).toBe("members");
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { manage: "tenant_acme", tab: "members" },
      }),
    );

    component.onManageTabChange("invite");
    expect(component.selectedManageTab()).toBe("invite");
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { tab: "invite" },
      }),
    );

    component.closeManageModal();
    expect(component.isManageModalOpen()).toBe(false);
    expect(component.selectedManageWorkspace()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { manage: null, tab: null },
      }),
    );
  });

  it("should handle onWorkspaceUpdated by reloading resource and updating store", () => {
    workspaceStore.setActiveWorkspace(mockWorkspaces[0]);
    const setActiveSpy = vi.spyOn(workspaceStore, "setActiveWorkspace");

    const updated = { ...mockWorkspaces[0], name: "Acme Ultra" };
    component.onWorkspaceUpdated(updated);

    expect(mockWorkspacesResource.reload).toHaveBeenCalled();
    expect(setActiveSpy).toHaveBeenCalledWith(updated);
  });

  it("should handle onWorkspaceDeleted by clearing active workspace if matching", () => {
    workspaceStore.setActiveWorkspace(mockWorkspaces[0]);
    const clearSpy = vi.spyOn(workspaceStore, "clear");

    component.onWorkspaceDeleted("tenant_acme");

    expect(clearSpy).toHaveBeenCalled();
    expect(component.isManageModalOpen()).toBe(false);
    expect(mockWorkspacesResource.reload).toHaveBeenCalled();
  });

  it("should accept pending invitation", () => {
    component.acceptInvitation(mockInvitations[0]);

    expect(invitationServiceMock.acceptInvitation).toHaveBeenCalledWith("inv-1");
  });

  it("should decline pending invitation", () => {
    component.declineInvitation(mockInvitations[0]);

    expect(invitationServiceMock.declineInvitation).toHaveBeenCalledWith("inv-1");
  });

  it("should reload all resources", () => {
    component.reloadAll();

    expect(mockWorkspacesResource.reload).toHaveBeenCalled();
    expect(mockInvitationsResource.reload).toHaveBeenCalled();
  });
});
