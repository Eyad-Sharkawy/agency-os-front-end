import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
import { WorkspaceManageModal } from "./workspace-manage-modal";
import { WorkspaceService } from "../../../../core/api/services/workspace.service";
import { InvitationService } from "../../../../core/api/services/invitation.service";
import { AuthStore } from "../../../../core/auth/auth.store";
import { ENVIRONMENT } from "../../../../core/tokens/environment.token";
import {
  WorkspaceMemberResponse,
  WorkspaceResponse,
} from "../../../../core/api/models/workspace.models";

describe("WorkspaceManageModal Component", () => {
  let component: WorkspaceManageModal;
  let fixture: ComponentFixture<WorkspaceManageModal>;
  let workspaceServiceMock: {
    getMembers: ReturnType<typeof vi.fn>;
    updateMemberRole: ReturnType<typeof vi.fn>;
    removeMember: ReturnType<typeof vi.fn>;
    transferOwnership: ReturnType<typeof vi.fn>;
    updateWorkspace: ReturnType<typeof vi.fn>;
    deleteWorkspace: ReturnType<typeof vi.fn>;
  };
  let invitationServiceMock: {
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
    workspaceServiceMock = {
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

    invitationServiceMock = {
      inviteUser: vi.fn().mockReturnValue(
        of({
          id: "inv-1",
          workspaceId: "w-1",
          workspaceName: "Acme Agency",
          username: "alex_dev",
          invitedByUsername: "owner",
          role: "MEMBER",
          status: "PENDING",
          createdAt: "2026-01-01T00:00:00Z",
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [WorkspaceManageModal],
      providers: [
        provideRouter([]),
        { provide: WorkspaceService, useValue: workspaceServiceMock },
        { provide: InvitationService, useValue: invitationServiceMock },
        { provide: ENVIRONMENT, useValue: mockEnv },
        AuthStore,
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

    fixture = TestBed.createComponent(WorkspaceManageModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("workspace", mockWorkspace);
    fixture.componentRef.setInput("isOpen", true);
    fixture.detectChanges();
  });

  it("should create modal and initialize values from workspace", () => {
    expect(component).toBeTruthy();
    expect(component.editName()).toBe("Acme Agency");
    expect(component.activeTab()).toBe("general");
  });

  it("should switch tabs and load members when members tab is active", () => {
    component.setTab("members");
    expect(component.activeTab()).toBe("members");
    expect(workspaceServiceMock.getMembers).toHaveBeenCalledWith("tenant_acme");
    expect(component.members().length).toBe(2);

    component.setTab("invite");
    expect(component.activeTab()).toBe("invite");

    component.setTab("danger");
    expect(component.activeTab()).toBe("danger");
  });

  it("should not allow modifying role or removing oneself", () => {
    const selfMember = mockMembers[0]; // username: "owner", userId: "u-owner"
    const otherMember = mockMembers[1]; // username: "alex_dev", userId: "u-member"

    expect(component.isSelf(selfMember)).toBe(true);
    expect(component.isSelf(otherMember)).toBe(false);

    expect(component.canModifyRole(selfMember)).toBe(false);
    expect(component.canRemoveMember(selfMember)).toBe(false);

    expect(component.canModifyRole(otherMember)).toBe(true);
    expect(component.canRemoveMember(otherMember)).toBe(true);
  });

  it("should change member role", () => {
    component.setTab("members");
    const targetMember = mockMembers[1];

    component.onRoleChange(targetMember, "ADMIN");

    expect(workspaceServiceMock.updateMemberRole).toHaveBeenCalledWith("tenant_acme", "u-member", {
      role: "ADMIN",
    });
    expect(component.memberActionSuccess()).toContain("Updated role");
  });

  it("should remove member on confirmation", () => {
    component.setTab("members");
    const targetMember = mockMembers[1];
    component.removeTarget.set(targetMember);

    component.confirmRemoveMember();

    expect(workspaceServiceMock.removeMember).toHaveBeenCalledWith("tenant_acme", "u-member");
    expect(component.memberActionSuccess()).toContain("Removed @alex_dev");
    expect(component.removeTarget()).toBeNull();
  });

  it("should transfer ownership on confirmation and emit updated", () => {
    let emittedWs: WorkspaceResponse | undefined;
    component.updated.subscribe(ws => (emittedWs = ws));

    component.setTab("members");
    const targetMember = mockMembers[1];
    component.transferTarget.set(targetMember);

    component.confirmTransferOwnership();

    expect(workspaceServiceMock.transferOwnership).toHaveBeenCalledWith("tenant_acme", {
      newOwnerId: "u-member",
    });
    expect(component.memberActionSuccess()).toContain("Ownership transferred");
    expect(component.transferTarget()).toBeNull();
    expect(emittedWs?.role).toBe("ADMIN");
  });

  it("should submit workspace name update and emit updated event", () => {
    let emittedWs: WorkspaceResponse | undefined;
    component.updated.subscribe(ws => (emittedWs = ws));

    component.editName.set("Acme Renamed");
    component.submitUpdateName();

    expect(workspaceServiceMock.updateWorkspace).toHaveBeenCalledWith("tenant_acme", {
      name: "Acme Renamed",
      contactEmail: "admin@acme.com",
    });
    expect(component.updateNameSuccess()).toContain("updated successfully");
    expect(emittedWs?.name).toBe("Acme Renamed");
  });

  it("should handle error when updating name fails", () => {
    workspaceServiceMock.updateWorkspace.mockReturnValue(
      throwError(() => ({ error: { detail: "Name already taken" } })),
    );

    component.editName.set("Taken Name");
    component.submitUpdateName();

    expect(component.updateNameError()).toBe("Name already taken");
  });

  it("should send invitation by username", () => {
    component.setTab("invite");
    component.inviteTarget.set("alex_dev");
    component.inviteRole.set("MEMBER");

    component.submitInviteUser();

    expect(invitationServiceMock.inviteUser).toHaveBeenCalledWith("tenant_acme", {
      username: "alex_dev",
      email: undefined,
      role: "MEMBER",
    });
    expect(component.inviteSuccess()).toContain("Invitation sent to alex_dev");
  });

  it("should send invitation by email", () => {
    component.setTab("invite");
    component.inviteTarget.set("alex@example.com");
    component.inviteRole.set("ADMIN");

    component.submitInviteUser();

    expect(invitationServiceMock.inviteUser).toHaveBeenCalledWith("tenant_acme", {
      username: undefined,
      email: "alex@example.com",
      role: "ADMIN",
    });
    expect(component.inviteSuccess()).toContain("Invitation sent to alex@example.com");
  });

  it("should require matching name before deleting workspace", () => {
    let deletedTenantId: string | undefined;
    component.deleted.subscribe(id => (deletedTenantId = id));

    component.setTab("danger");
    component.deleteConfirmName.set("Wrong Name");
    component.submitDeleteWorkspace();

    expect(workspaceServiceMock.deleteWorkspace).not.toHaveBeenCalled();

    component.deleteConfirmName.set("Acme Agency");
    component.submitDeleteWorkspace();

    expect(workspaceServiceMock.deleteWorkspace).toHaveBeenCalledWith("tenant_acme");
    expect(deletedTenantId).toBe("tenant_acme");
  });

  it("should emit closed event", () => {
    let isClosed = false;
    component.closed.subscribe(() => (isClosed = true));

    component.onClose();
    expect(isClosed).toBe(true);
  });
});
