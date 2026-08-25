import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { signal } from "@angular/core";
import { of } from "rxjs";
import { WorkspaceGeneralTab } from "./general/workspace-general-tab";
import { WorkspaceMembersTab } from "./members/workspace-members-tab";
import { WorkspaceInviteTab } from "./invite/workspace-invite-tab";
import { WorkspaceDangerTab } from "./danger/workspace-danger-tab";
import { WorkspaceApi } from "../../../../../core/api/services/workspace/workspace-api";
import { InvitationApi } from "../../../../../core/api/services/invitation/invitation-api";
import { AuthStore } from "../../../../../core/auth/stores/auth.store";
import { ENVIRONMENT } from "../../../../../core/tokens";
import { WorkspaceManagement } from "../../../services/workspace-management";
import {
  WorkspaceMemberResponse,
  WorkspaceResponse,
} from "../../../../../core/api/models/workspace.models";

describe("Workspace Manage Modal Tabs", () => {
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
      imports: [WorkspaceGeneralTab, WorkspaceMembersTab, WorkspaceInviteTab, WorkspaceDangerTab],
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
  });

  describe("WorkspaceGeneralTab", () => {
    let fixture: ComponentFixture<WorkspaceGeneralTab>;
    let component: WorkspaceGeneralTab;

    beforeEach(() => {
      fixture = TestBed.createComponent(WorkspaceGeneralTab);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it("should bind to editName and delegate submitUpdateName to WorkspaceManagement", () => {
      const updateSpy = vi.spyOn(wm, "submitUpdateName");
      component.submitUpdateName();
      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe("WorkspaceMembersTab", () => {
    let fixture: ComponentFixture<WorkspaceMembersTab>;
    let component: WorkspaceMembersTab;

    beforeEach(() => {
      fixture = TestBed.createComponent(WorkspaceMembersTab);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it("should delegate role changes and permissions", () => {
      const roleSpy = vi.spyOn(wm, "onRoleChange");
      component.onRoleChange(mockMembers[1], "ADMIN");
      expect(roleSpy).toHaveBeenCalledWith(mockMembers[1], "ADMIN");

      expect(component.getInitials(mockMembers[0])).toBe("OU");
      expect(component.isSelf(mockMembers[0])).toBe(true);
      expect(component.canModifyRole(mockMembers[1])).toBe(true);
      expect(component.canRemoveMember(mockMembers[1])).toBe(true);
    });

    it("should delegate transfer ownership and remove member confirmations", () => {
      const transferSpy = vi.spyOn(wm, "submitTransferOwnership");
      component.confirmTransferOwnership();
      expect(transferSpy).toHaveBeenCalled();

      const removeSpy = vi.spyOn(wm, "submitRemoveMember");
      component.confirmRemoveMember();
      expect(removeSpy).toHaveBeenCalled();

      const loadSpy = vi.spyOn(wm, "loadMembers");
      component.loadMembers();
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe("WorkspaceInviteTab", () => {
    let fixture: ComponentFixture<WorkspaceInviteTab>;
    let component: WorkspaceInviteTab;

    beforeEach(() => {
      fixture = TestBed.createComponent(WorkspaceInviteTab);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it("should delegate submitInviteUser and getInviteRoleOptions", () => {
      const inviteSpy = vi.spyOn(wm, "submitInviteUser");
      component.submitInviteUser();
      expect(inviteSpy).toHaveBeenCalled();

      expect(component.getInviteRoleOptions()).toEqual(wm.getInviteRoleOptions());
    });
  });

  describe("WorkspaceDangerTab", () => {
    let fixture: ComponentFixture<WorkspaceDangerTab>;
    let component: WorkspaceDangerTab;

    beforeEach(() => {
      fixture = TestBed.createComponent(WorkspaceDangerTab);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it("should delegate submitDeleteWorkspace to WorkspaceManagement", () => {
      const deleteSpy = vi.spyOn(wm, "submitDeleteWorkspace");
      component.submitDeleteWorkspace();
      expect(deleteSpy).toHaveBeenCalled();
    });
  });
});
