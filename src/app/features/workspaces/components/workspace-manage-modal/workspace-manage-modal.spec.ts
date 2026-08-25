import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { signal } from "@angular/core";
import { of } from "rxjs";
import { WorkspaceManageModal } from "./workspace-manage-modal";
import { WorkspaceApi } from "../../../../core/api/services/workspace/workspace-api";
import { InvitationApi } from "../../../../core/api/services/invitation/invitation-api";
import { AuthStore } from "../../../../core/auth/stores/auth.store";
import { ENVIRONMENT } from "../../../../core/tokens";
import { WorkspaceManagement } from "../../services/workspace-management";
import {
  WorkspaceMemberResponse,
  WorkspaceResponse,
} from "../../../../core/api/models/workspace.models";

describe("WorkspaceManageModal Component", () => {
  let component: WorkspaceManageModal;
  let fixture: ComponentFixture<WorkspaceManageModal>;
  let wm: WorkspaceManagement;
  let workspaceApiMock: {
    getWorkspacesResource: ReturnType<typeof vi.fn>;
    getMembers: ReturnType<typeof vi.fn>;
    updateMemberRole: ReturnType<typeof vi.fn>;
    removeMember: ReturnType<typeof vi.fn>;
    transferOwnership: ReturnType<typeof vi.fn>;
    updateWorkspace: ReturnType<typeof vi.fn>;
    deleteWorkspace: ReturnType<typeof vi.fn>;
  };
  let invitationApiMock: {
    getPendingInvitationsResource: ReturnType<typeof vi.fn>;
    inviteUser: ReturnType<typeof vi.fn>;
  };
  let authStore: InstanceType<typeof AuthStore>;

  const mockWorkspace: WorkspaceResponse = {
    id: "w-1",
    name: "Acme Agency",
    tenantId: "tenant_acme",
    contactEmail: "admin@acme.com",
    role: "OWNER",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  const mockMembers: WorkspaceMemberResponse[] = [
    {
      userId: "u-owner",
      username: "owner",
      email: "owner@acme.com",
      firstName: "Owner",
      lastName: "User",
      role: "OWNER",
    },
    {
      userId: "u-member",
      username: "alex_dev",
      email: "alex@acme.com",
      firstName: "Alex",
      lastName: "Dev",
      role: "MEMBER",
    },
  ];

  const mockEnv = {
    production: false,
    apiUrl: "https://api.example.com/api/v1",
    wsUrl: "wss://api.example.com/ws",
    keycloak: { url: "", realm: "", clientId: "" },
  };

  beforeEach(async () => {
    workspaceApiMock = {
      getWorkspacesResource: vi.fn().mockReturnValue({
        value: signal([mockWorkspace]),
        isLoading: signal(false),
        error: signal(null),
        reload: vi.fn(),
      }),
      getMembers: vi.fn().mockReturnValue(of(mockMembers)),
      updateMemberRole: vi.fn().mockReturnValue(of(undefined)),
      removeMember: vi.fn().mockReturnValue(of(undefined)),
      transferOwnership: vi.fn().mockReturnValue(of(undefined)),
      updateWorkspace: vi.fn().mockReturnValue(
        of({
          ...mockWorkspace,
          name: "Acme Renamed",
        }),
      ),
      deleteWorkspace: vi.fn().mockReturnValue(of(undefined)),
    };

    invitationApiMock = {
      getPendingInvitationsResource: vi.fn().mockReturnValue({
        value: signal([]),
        isLoading: signal(false),
        error: signal(null),
        reload: vi.fn(),
      }),
      inviteUser: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [WorkspaceManageModal],
      providers: [
        provideRouter([]),
        WorkspaceManagement,
        { provide: WorkspaceApi, useValue: workspaceApiMock },
        { provide: InvitationApi, useValue: invitationApiMock },
        { provide: ENVIRONMENT, useValue: mockEnv },
      ],
    }).compileComponents();

    authStore = TestBed.inject(AuthStore);
    vi.spyOn(authStore, "user").mockReturnValue({
      id: "u-owner",
      username: "owner",
      email: "admin@acme.com",
      firstName: "Owner",
      lastName: "User",
    });

    wm = TestBed.inject(WorkspaceManagement);
    wm.setModalWorkspace(mockWorkspace, "general");

    fixture = TestBed.createComponent(WorkspaceManageModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should render modal when open and workspace is present", () => {
    expect(component.isOpen()).toBe(true);
    expect(component.workspace()).toEqual(mockWorkspace);
    expect(component.activeTab()).toBe("general");
  });

  it("should delegate tab changes and close modal to WorkspaceManagement", () => {
    const tabSpy = vi.spyOn(wm, "onManageTabChange");
    component.setTab("members");
    expect(tabSpy).toHaveBeenCalledWith("members");

    const closeSpy = vi.spyOn(wm, "closeManageModal");
    component.onClose();
    expect(closeSpy).toHaveBeenCalled();
  });

  it("should render general tab content when activeTab is general", () => {
    const generalEl = fixture.nativeElement.querySelector("aos-workspace-general-tab");
    expect(generalEl).not.toBeNull();
  });

  it("should render members tab when activeTab is members", () => {
    wm.selectedManageTab.set("members");
    fixture.detectChanges();
    const membersEl = fixture.nativeElement.querySelector("aos-workspace-members-tab");
    expect(membersEl).not.toBeNull();
  });

  it("should render invite tab when activeTab is invite", () => {
    wm.selectedManageTab.set("invite");
    fixture.detectChanges();
    const inviteEl = fixture.nativeElement.querySelector("aos-workspace-invite-tab");
    expect(inviteEl).not.toBeNull();
  });

  it("should render danger tab when activeTab is danger and role is OWNER", () => {
    wm.selectedManageTab.set("danger");
    fixture.detectChanges();
    const dangerEl = fixture.nativeElement.querySelector("aos-workspace-danger-tab");
    expect(dangerEl).not.toBeNull();
  });
});
