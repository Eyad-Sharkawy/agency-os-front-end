import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { signal } from "@angular/core";
import { of, throwError } from "rxjs";
import { WorkspaceManagement } from "./workspace-management";
import { WorkspaceApi } from "../../../core/api/services/workspace/workspace-api";
import { InvitationApi } from "../../../core/api/services/invitation/invitation-api";
import { AuthStore } from "../../../core/auth/stores/auth.store";
import { ENVIRONMENT } from "../../../core/tokens";
import {
  WorkspaceInvitationResponse,
  WorkspaceMemberResponse,
  WorkspaceResponse,
} from "../../../core/api/models";

describe("WorkspaceManagement Service", () => {
  let service: WorkspaceManagement;
  let router: Router;
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
    acceptInvitation: ReturnType<typeof vi.fn>;
    declineInvitation: ReturnType<typeof vi.fn>;
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

  beforeEach(() => {
    workspaceApiMock = {
      getWorkspacesResource: vi.fn().mockReturnValue({
        value: signal([mockWorkspace]),
        isLoading: signal(false),
        error: signal(null),
        reload: vi.fn(),
      }),
      getMembers: vi.fn().mockReturnValue(of(mockMembers)),
      updateMemberRole: vi.fn().mockReturnValue(of(mockMembers[1])),
      removeMember: vi.fn().mockReturnValue(of(undefined)),
      transferOwnership: vi.fn().mockReturnValue(of(mockWorkspace)),
      updateWorkspace: vi.fn().mockReturnValue(of(mockWorkspace)),
      deleteWorkspace: vi.fn().mockReturnValue(of(undefined)),
    };

    invitationApiMock = {
      getPendingInvitationsResource: vi.fn().mockReturnValue({
        value: signal([]),
        isLoading: signal(false),
        error: signal(null),
        reload: vi.fn(),
      }),
      acceptInvitation: vi.fn().mockReturnValue(of(undefined)),
      declineInvitation: vi.fn().mockReturnValue(of(undefined)),
      inviteUser: vi.fn().mockReturnValue(of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [
        WorkspaceManagement,
        provideRouter([]),
        { provide: WorkspaceApi, useValue: workspaceApiMock },
        { provide: InvitationApi, useValue: invitationApiMock },
        { provide: ENVIRONMENT, useValue: mockEnv },
      ],
    });

    service = TestBed.inject(WorkspaceManagement);
    router = TestBed.inject(Router);
    authStore = TestBed.inject(AuthStore);

    vi.spyOn(authStore, "user").mockReturnValue({
      id: "u-owner",
      username: "owner",
      email: "owner@acme.com",
      firstName: "Owner",
      lastName: "User",
    });
  });

  it("should initialize lists, search queries, and invitations", () => {
    expect(service.hasWorkspaces()).toBe(true);
    expect(service.workspacesList()).toEqual([mockWorkspace]);
    expect(service.filteredWorkspaces()).toEqual([mockWorkspace]);

    service.searchQuery.set("Nonexistent");
    expect(service.filteredWorkspaces()).toHaveLength(0);

    service.searchQuery.set("acme");
    expect(service.filteredWorkspaces()).toHaveLength(1);
  });

  it("should select active workspace and navigate to /w/:workspaceId", () => {
    const navigateSpy = vi.spyOn(router, "navigate").mockResolvedValue(true);
    service.selectWorkspace(mockWorkspace);

    expect(service.isCurrentActive(mockWorkspace)).toBe(true);
    expect(navigateSpy).toHaveBeenCalledWith(["/w", mockWorkspace.tenantId]);
  });

  it("should accept and decline invitations", () => {
    const mockInvitation: WorkspaceInvitationResponse = {
      id: "inv-1",
      workspaceId: "w-1",
      workspaceName: "Acme Agency",
      username: "alex_dev",
      invitedByUsername: "Owner",
      role: "MEMBER",
      status: "PENDING",
      createdAt: "2026-01-01T00:00:00Z",
    };

    service.acceptInvitation(mockInvitation);
    expect(invitationApiMock.acceptInvitation).toHaveBeenCalledWith("inv-1");

    service.declineInvitation(mockInvitation);
    expect(invitationApiMock.declineInvitation).toHaveBeenCalledWith("inv-1");
  });

  it("should open, change tabs, and close manage modal with router query sync", () => {
    const navigateSpy = vi.spyOn(router, "navigate").mockResolvedValue(true);

    service.openManageModal(mockWorkspace, "members");
    expect(service.isManageModalOpen()).toBe(true);
    expect(service.selectedManageWorkspace()).toEqual(mockWorkspace);
    expect(service.selectedManageTab()).toBe("members");
    expect(navigateSpy).toHaveBeenCalled();

    service.onManageTabChange("invite");
    expect(service.selectedManageTab()).toBe("invite");

    service.closeManageModal();
    expect(service.isManageModalOpen()).toBe(false);
    expect(service.selectedManageWorkspace()).toBeNull();
  });

  it("should load workspace members and handle failure", () => {
    service.setModalWorkspace(mockWorkspace, "members");
    expect(workspaceApiMock.getMembers).toHaveBeenCalledWith("tenant_acme");
    expect(service.members()).toEqual(mockMembers);
    expect(service.isLoadingMembers()).toBe(false);

    workspaceApiMock.getMembers.mockReturnValue(throwError(() => new Error("Network error")));
    service.loadMembers();
    expect(service.membersError()).toBe("Network error");
  });

  it("should update workspace name and handle error", () => {
    service.setModalWorkspace(mockWorkspace);
    service.editName.set("Acme Agency Updated");

    const updatedWorkspace = { ...mockWorkspace, name: "Acme Agency Updated" };
    workspaceApiMock.updateWorkspace.mockReturnValue(of(updatedWorkspace));

    service.submitUpdateName();
    expect(workspaceApiMock.updateWorkspace).toHaveBeenCalledWith("tenant_acme", {
      name: "Acme Agency Updated",
      contactEmail: "admin@acme.com",
    });
    expect(service.updateNameSuccess()).toBe("Workspace name updated successfully!");

    workspaceApiMock.updateWorkspace.mockReturnValue(
      throwError(() => ({ error: { detail: "Name already taken" } })),
    );
    service.editName.set("Another Name");
    service.submitUpdateName();
    expect(service.updateNameError()).toBe("Name already taken");
  });

  it("should change member role and handle error", () => {
    service.setModalWorkspace(mockWorkspace);
    service.onRoleChange(mockMembers[1], "ADMIN");

    expect(workspaceApiMock.updateMemberRole).toHaveBeenCalledWith("tenant_acme", "u-member", {
      role: "ADMIN",
    });
    expect(service.memberActionSuccess()).toContain("Updated alex_dev's role to ADMIN");

    workspaceApiMock.updateMemberRole.mockReturnValue(
      throwError(() => new Error("Failed to update role")),
    );
    service.onRoleChange(mockMembers[1], "CLIENT");
    expect(service.memberActionError()).toBe("Failed to update role");
  });

  it("should transfer ownership and handle error", () => {
    service.setModalWorkspace(mockWorkspace);
    service.transferTarget.set(mockMembers[1]);

    service.submitTransferOwnership();
    expect(workspaceApiMock.transferOwnership).toHaveBeenCalledWith("tenant_acme", {
      newOwnerId: "u-member",
    });
    expect(service.memberActionSuccess()).toContain("Ownership successfully transferred");

    workspaceApiMock.transferOwnership.mockReturnValue(
      throwError(() => new Error("Transfer forbidden")),
    );
    service.transferTarget.set(mockMembers[1]);
    service.submitTransferOwnership();
    expect(service.memberActionError()).toBe("Transfer forbidden");
  });

  it("should remove member and handle error", () => {
    service.setModalWorkspace(mockWorkspace);
    service.removeTarget.set(mockMembers[1]);

    service.submitRemoveMember();
    expect(workspaceApiMock.removeMember).toHaveBeenCalledWith("tenant_acme", "u-member");
    expect(service.memberActionSuccess()).toContain("Removed alex_dev from the workspace");

    workspaceApiMock.removeMember.mockReturnValue(
      throwError(() => new Error("Failed to remove member")),
    );
    service.removeTarget.set(mockMembers[1]);
    service.submitRemoveMember();
    expect(service.memberActionError()).toBe("Failed to remove member");
  });

  it("should invite user by username or email and handle error", () => {
    service.setModalWorkspace(mockWorkspace);

    // Validation error when target is empty
    service.inviteTarget.set("   ");
    service.submitInviteUser();
    expect(service.inviteError()).toBe("Username or email is required.");

    // Valid invitation
    service.inviteTarget.set("newdev@acme.com");
    service.inviteRole.set("ADMIN");
    service.submitInviteUser();

    expect(invitationApiMock.inviteUser).toHaveBeenCalledWith("tenant_acme", {
      username: undefined,
      email: "newdev@acme.com",
      role: "ADMIN",
    });
    expect(service.inviteSuccess()).toContain("Invitation sent to newdev@acme.com");

    invitationApiMock.inviteUser.mockReturnValue(
      throwError(() => ({ error: { detail: "User already invited" } })),
    );
    service.inviteTarget.set("newdev@acme.com");
    service.submitInviteUser();
    expect(service.inviteError()).toBe("User already invited");
  });

  it("should delete workspace and handle error", () => {
    service.setModalWorkspace(mockWorkspace);

    // Confirmation mismatch
    service.deleteConfirmName.set("Wrong_ID");
    service.submitDeleteWorkspace();
    expect(workspaceApiMock.deleteWorkspace).not.toHaveBeenCalled();

    // Matching workspace tenantId / id
    service.deleteConfirmName.set("tenant_acme");
    service.submitDeleteWorkspace();
    expect(workspaceApiMock.deleteWorkspace).toHaveBeenCalledWith("tenant_acme");

    workspaceApiMock.deleteWorkspace.mockReturnValue(
      throwError(() => new Error("Cannot delete active workspace")),
    );
    service.setModalWorkspace(mockWorkspace);
    service.deleteConfirmName.set("tenant_acme");
    service.submitDeleteWorkspace();
    expect(service.deleteError()).toBe("Cannot delete active workspace");
  });

  it("should check permission helpers correctly", () => {
    service.setModalWorkspace(mockWorkspace);

    // Self check
    expect(service.isSelf(mockMembers[0])).toBe(true);
    expect(service.isSelf(mockMembers[1])).toBe(false);

    // Role options for OWNER (MEMBER and ADMIN only)
    expect(service.getInviteRoleOptions()).toHaveLength(2);

    // canModifyRole & canRemoveMember
    expect(service.canModifyRole(mockMembers[0])).toBe(false); // self/owner
    expect(service.canModifyRole(mockMembers[1])).toBe(true);
    expect(service.canRemoveMember(mockMembers[1])).toBe(true);
  });

  it("should test reloadAll and initials generation", () => {
    const reloadWorkspacesSpy = vi.spyOn(service.workspacesResource, "reload");
    const reloadInvitationsSpy = vi.spyOn(service.invitationsResource, "reload");

    service.reloadAll();
    expect(reloadWorkspacesSpy).toHaveBeenCalled();
    expect(reloadInvitationsSpy).toHaveBeenCalled();

    expect(service.getInitials(mockMembers[0])).toBe("OU");
    expect(
      service.getInitials({
        userId: "u-3",
        username: "developer",
        email: "dev@test.com",
        firstName: "Dev",
        lastName: "",
        role: "MEMBER",
      }),
    ).toBe("DE");
    expect(
      service.getInitials({
        userId: "u-4",
        username: "",
        email: "support@acme.com",
        firstName: "",
        lastName: "",
        role: "MEMBER",
      }),
    ).toBe("SU");
    expect(
      service.getInitials({
        userId: "u-5",
        username: "",
        email: "",
        firstName: "",
        lastName: "",
        role: "MEMBER",
      }),
    ).toBe("?");
  });

  it("should evaluate canModifyRole properly for ADMIN role", () => {
    service.selectedManageWorkspace.set({
      ...mockWorkspace,
      role: "ADMIN",
    });
    vi.spyOn(authStore, "user").mockReturnValue({
      id: "u-other-admin",
      username: "other_admin",
      email: "other@acme.com",
      firstName: "Other",
      lastName: "Admin",
    });

    expect(
      service.canModifyRole({
        userId: "u-owner",
        username: "owner",
        email: "owner@acme.com",
        firstName: "Owner",
        lastName: "User",
        role: "OWNER",
      }),
    ).toBe(false);
    expect(
      service.canModifyRole({
        userId: "u-admin",
        username: "admin",
        email: "admin@acme.com",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
      }),
    ).toBe(false);
    expect(
      service.canModifyRole({
        userId: "u-member",
        username: "member",
        email: "member@acme.com",
        firstName: "Member",
        lastName: "User",
        role: "MEMBER",
      }),
    ).toBe(true);
  });

  it("should invite user by username without email symbol", () => {
    service.setModalWorkspace(mockWorkspace);
    service.inviteTarget.set("janedoe");
    service.inviteRole.set("MEMBER");
    service.submitInviteUser();

    expect(invitationApiMock.inviteUser).toHaveBeenCalledWith("tenant_acme", {
      username: "janedoe",
      email: undefined,
      role: "MEMBER",
    });
  });

  it("should handle error in invitation acceptance and declining", () => {
    const mockInvitation: WorkspaceInvitationResponse = {
      id: "inv-err",
      workspaceId: "w-1",
      workspaceName: "Acme Agency",
      username: "alex_dev",
      invitedByUsername: "Owner",
      role: "MEMBER",
      status: "PENDING",
      createdAt: "2026-01-01T00:00:00Z",
    };

    invitationApiMock.acceptInvitation.mockReturnValue(
      throwError(() => new Error("Accept failed")),
    );
    service.acceptInvitation(mockInvitation);
    expect(service.processingInvitationId()).toBeNull();

    invitationApiMock.declineInvitation.mockReturnValue(
      throwError(() => new Error("Decline failed")),
    );
    service.declineInvitation(mockInvitation);
    expect(service.processingInvitationId()).toBeNull();
  });
});
