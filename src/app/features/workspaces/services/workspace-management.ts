import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import {
  WorkspaceInvitationResponse,
  WorkspaceMemberResponse,
  WorkspaceResponse,
  WorkspaceRole,
} from "../../../core/api/models";
import { InvitationApi, WorkspaceApi } from "../../../core/api/services";
import { WorkspaceStore } from "../../../core/multitenancy/workspace.store";
import { AuthStore } from "../../../core/auth/stores/auth.store";
import { SelectOption } from "../../../shared/components/select/select";

export type ManageTab = "general" | "members" | "invite" | "danger";

@Injectable()
export class WorkspaceManagement {
  private readonly workspaceApi = inject(WorkspaceApi);
  private readonly invitationApi = inject(InvitationApi);
  readonly workspaceStore = inject(WorkspaceStore);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParams = toSignal(this.route.queryParams);

  // Reactive HTTP Resources (Signals)
  readonly workspacesResource = this.workspaceApi.getWorkspacesResource({ defaultValue: [] });
  readonly invitationsResource = this.invitationApi.getPendingInvitationsResource({
    defaultValue: [],
  });

  // Safe computed lists
  readonly workspacesList = computed<WorkspaceResponse[]>(() => {
    try {
      if (this.workspacesResource.error()) {
        return [];
      }
      return this.workspacesResource.value() ?? [];
    } catch {
      return [];
    }
  });

  readonly pendingInvitations = computed<WorkspaceInvitationResponse[]>(() => {
    try {
      if (this.invitationsResource.error()) {
        return [];
      }
      return this.invitationsResource.value() ?? [];
    } catch {
      return [];
    }
  });

  readonly hasWorkspaces = computed(() => this.workspacesList().length > 0);

  // Search & Filter State
  readonly searchQuery = signal("");

  readonly filteredWorkspaces = computed(() => {
    const list = this.workspacesList();
    const query = this.searchQuery().trim().toLowerCase();

    if (!query) {
      return list;
    }

    return list.filter(
      ws =>
        ws.name.toLowerCase().includes(query) ||
        ws.tenantId.toLowerCase().includes(query) ||
        ws.contactEmail?.toLowerCase().includes(query),
    );
  });

  // Manage Modal & Query Parameter State
  readonly isManageModalOpen = signal(false);
  readonly selectedManageWorkspace = signal<WorkspaceResponse | null>(null);
  readonly selectedManageTab = signal<ManageTab>("general");

  // Invitation Processing State
  readonly processingInvitationId = signal<string | null>(null);

  // Manage Modal: Tab 1 - General (Rename)
  readonly editName = signal<string>("");
  readonly isUpdatingName = signal<boolean>(false);
  readonly updateNameSuccess = signal<string | null>(null);
  readonly updateNameError = signal<string | null>(null);

  // Manage Modal: Tab 2 - Members
  readonly members = signal<WorkspaceMemberResponse[]>([]);
  readonly isLoadingMembers = signal<boolean>(false);
  readonly membersError = signal<string | null>(null);
  readonly memberActionSuccess = signal<string | null>(null);
  readonly memberActionError = signal<string | null>(null);
  readonly memberActionLoading = signal<string | null>(null);
  readonly transferTarget = signal<WorkspaceMemberResponse | null>(null);
  readonly removeTarget = signal<WorkspaceMemberResponse | null>(null);

  // Manage Modal: Tab 3 - Invite
  readonly inviteTarget = signal<string>("");
  readonly inviteRole = signal<WorkspaceRole>("MEMBER");
  readonly isInviting = signal<boolean>(false);
  readonly inviteSuccess = signal<string | null>(null);
  readonly inviteError = signal<string | null>(null);

  // Manage Modal: Tab 4 - Delete
  readonly deleteConfirmName = signal<string>("");
  readonly isDeleting = signal<boolean>(false);
  readonly deleteError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const params = this.queryParams();
      const manageTenantId = params?.["manage"];
      const tab = (params?.["tab"] as ManageTab) || "general";

      if (manageTenantId) {
        const list = this.workspacesList();
        const ws = list.find(w => w.tenantId === manageTenantId);
        if (ws) {
          this.setModalWorkspace(ws, tab);
        }
      } else if (params && "manage" in params && this.isManageModalOpen()) {
        this.isManageModalOpen.set(false);
        this.selectedManageWorkspace.set(null);
      }
    });
  }

  // --- Directory & Navigation Methods ---

  selectWorkspace(ws: WorkspaceResponse): void {
    this.workspaceStore.setActiveWorkspace(ws);
    void this.router.navigate(["/"]);
  }

  isCurrentActive(ws: WorkspaceResponse): boolean {
    return this.workspaceStore.activeTenantId() === ws.tenantId;
  }

  openManageModal(ws: WorkspaceResponse, tab: ManageTab = "general"): void {
    this.setModalWorkspace(ws, tab);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { manage: ws.tenantId, tab },
      queryParamsHandling: "merge",
    });
  }

  onManageTabChange(tab: ManageTab): void {
    this.selectedManageTab.set(tab);
    this.memberActionSuccess.set(null);
    this.memberActionError.set(null);
    if (tab === "members") {
      this.loadMembers();
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: "merge",
    });
  }

  closeManageModal(): void {
    this.isManageModalOpen.set(false);
    this.selectedManageWorkspace.set(null);
    this.resetModalState();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { manage: null, tab: null },
      queryParamsHandling: "merge",
    });
  }

  reloadAll(): void {
    this.workspacesResource.reload();
    this.invitationsResource.reload();
  }

  acceptInvitation(invitation: WorkspaceInvitationResponse): void {
    this.processingInvitationId.set(invitation.id);
    this.invitationApi.acceptInvitation(invitation.id).subscribe({
      next: () => {
        this.processingInvitationId.set(null);
        this.invitationsResource.reload();
        this.workspacesResource.reload();
      },
      error: () => {
        this.processingInvitationId.set(null);
      },
    });
  }

  declineInvitation(invitation: WorkspaceInvitationResponse): void {
    this.processingInvitationId.set(invitation.id);
    this.invitationApi.declineInvitation(invitation.id).subscribe({
      next: () => {
        this.processingInvitationId.set(null);
        this.invitationsResource.reload();
      },
      error: () => {
        this.processingInvitationId.set(null);
      },
    });
  }

  // --- Manage Modal Logic ---

  setModalWorkspace(ws: WorkspaceResponse, tab: ManageTab = "general"): void {
    this.selectedManageWorkspace.set(ws);
    this.selectedManageTab.set(tab);
    this.editName.set(ws.name);
    this.isManageModalOpen.set(true);
    this.resetModalState();
    if (tab === "members") {
      this.loadMembers();
    }
  }

  resetModalState(): void {
    this.updateNameSuccess.set(null);
    this.updateNameError.set(null);
    this.isUpdatingName.set(false);

    this.memberActionSuccess.set(null);
    this.memberActionError.set(null);
    this.memberActionLoading.set(null);
    this.transferTarget.set(null);
    this.removeTarget.set(null);

    this.inviteTarget.set("");
    this.inviteRole.set("MEMBER");
    this.inviteSuccess.set(null);
    this.inviteError.set(null);

    this.deleteConfirmName.set("");
    this.isDeleting.set(false);
    this.deleteError.set(null);
  }

  loadMembers(): void {
    const ws = this.selectedManageWorkspace();
    if (!ws) return;

    this.isLoadingMembers.set(true);
    this.membersError.set(null);

    this.workspaceApi.getMembers(ws.tenantId).subscribe({
      next: members => {
        this.members.set(members);
        this.isLoadingMembers.set(false);
      },
      error: (err: unknown) => {
        this.isLoadingMembers.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to load workspace members.");
        this.membersError.set(detail);
      },
    });
  }

  submitUpdateName(): void {
    const ws = this.selectedManageWorkspace();
    const name = this.editName().trim();
    if (!ws || !name || name === ws?.name) return;

    this.isUpdatingName.set(true);
    this.updateNameSuccess.set(null);
    this.updateNameError.set(null);

    this.workspaceApi
      .updateWorkspace(ws.tenantId, {
        name,
        contactEmail: ws.contactEmail,
      })
      .subscribe({
        next: updated => {
          this.isUpdatingName.set(false);
          this.updateNameSuccess.set("Workspace name updated successfully!");
          this.selectedManageWorkspace.set(updated);
          this.workspacesResource.reload();
          if (this.workspaceStore.activeTenantId() === updated.tenantId) {
            this.workspaceStore.setActiveWorkspace(updated);
          }
        },
        error: (err: unknown) => {
          this.isUpdatingName.set(false);
          const detail =
            (err as { error?: { detail?: string } })?.error?.detail ||
            (err instanceof Error ? err.message : "Failed to update workspace name.");
          this.updateNameError.set(detail);
        },
      });
  }

  onRoleChange(member: WorkspaceMemberResponse, newRole: WorkspaceRole): void {
    const ws = this.selectedManageWorkspace();
    if (!ws || member.role === newRole) return;

    this.memberActionLoading.set(member.userId);
    this.memberActionSuccess.set(null);
    this.memberActionError.set(null);

    this.workspaceApi.updateMemberRole(ws.tenantId, member.userId, { role: newRole }).subscribe({
      next: () => {
        this.memberActionLoading.set(null);
        this.memberActionSuccess.set(`Updated ${member.username}'s role to ${newRole}.`);
        this.loadMembers();
      },
      error: (err: unknown) => {
        this.memberActionLoading.set(null);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to update member role.");
        this.memberActionError.set(detail);
      },
    });
  }

  submitTransferOwnership(): void {
    const ws = this.selectedManageWorkspace();
    const target = this.transferTarget();
    if (!ws || !target) return;

    this.memberActionLoading.set(target.userId);
    this.memberActionSuccess.set(null);
    this.memberActionError.set(null);

    this.workspaceApi.transferOwnership(ws.tenantId, { newOwnerId: target.userId }).subscribe({
      next: () => {
        this.memberActionLoading.set(null);
        this.memberActionSuccess.set(`Ownership successfully transferred to ${target.username}!`);
        this.transferTarget.set(null);
        this.loadMembers();
        this.workspacesResource.reload();
      },
      error: (err: unknown) => {
        this.memberActionLoading.set(null);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to transfer workspace ownership.");
        this.memberActionError.set(detail);
      },
    });
  }

  submitRemoveMember(): void {
    const ws = this.selectedManageWorkspace();
    const target = this.removeTarget();
    if (!ws || !target) return;

    this.memberActionLoading.set(target.userId);
    this.memberActionSuccess.set(null);
    this.memberActionError.set(null);

    this.workspaceApi.removeMember(ws.tenantId, target.userId).subscribe({
      next: () => {
        this.memberActionLoading.set(null);
        this.memberActionSuccess.set(`Removed ${target.username} from the workspace.`);
        this.removeTarget.set(null);
        this.loadMembers();
      },
      error: (err: unknown) => {
        this.memberActionLoading.set(null);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to remove member.");
        this.memberActionError.set(detail);
      },
    });
  }

  submitInviteUser(): void {
    const ws = this.selectedManageWorkspace();
    const target = this.inviteTarget().trim();
    if (!ws || !target) {
      this.inviteError.set("Username or email is required.");
      return;
    }

    this.isInviting.set(true);
    this.inviteSuccess.set(null);
    this.inviteError.set(null);

    const isEmail = target.includes("@");
    const payload = {
      username: isEmail ? undefined : target,
      email: isEmail ? target.toLowerCase() : undefined,
      role: this.inviteRole(),
    };

    this.invitationApi.inviteUser(ws.tenantId, payload).subscribe({
      next: () => {
        this.isInviting.set(false);
        this.inviteSuccess.set(`Invitation sent to ${target}!`);
        this.inviteTarget.set("");
      },
      error: (err: unknown) => {
        this.isInviting.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to send invitation.");
        this.inviteError.set(detail);
      },
    });
  }

  submitDeleteWorkspace(): void {
    const ws = this.selectedManageWorkspace();
    if (this.deleteConfirmName().trim() !== ws?.name) return;

    this.isDeleting.set(true);
    this.deleteError.set(null);

    this.workspaceApi.deleteWorkspace(ws.tenantId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        if (this.workspaceStore.activeTenantId() === ws.tenantId) {
          this.workspaceStore.clear();
        }
        this.closeManageModal();
        this.workspacesResource.reload();
      },
      error: (err: unknown) => {
        this.isDeleting.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to delete workspace.");
        this.deleteError.set(detail);
      },
    });
  }

  // --- Permission & Role Helpers ---

  getInviteRoleOptions(): SelectOption<WorkspaceRole>[] {
    const opts: SelectOption<WorkspaceRole>[] = [
      { label: "MEMBER (Standard Access)", value: "MEMBER" },
      { label: "ADMIN (Workspace Management)", value: "ADMIN" },
    ];
    if (this.selectedManageWorkspace()?.role === "OWNER") {
      opts.push({ label: "CLIENT (External Portal Access)", value: "CLIENT" });
    }
    return opts;
  }

  getMemberRoleOptions(): SelectOption<WorkspaceRole>[] {
    const opts: SelectOption<WorkspaceRole>[] = [
      { label: "MEMBER", value: "MEMBER" },
      { label: "ADMIN", value: "ADMIN" },
    ];
    if (this.selectedManageWorkspace()?.role === "OWNER") {
      opts.push({ label: "CLIENT", value: "CLIENT" });
    }
    return opts;
  }

  getInitials(member: WorkspaceMemberResponse): string {
    if (member.firstName && member.lastName) {
      return `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
    }
    return (member.username || member.email || "?").slice(0, 2).toUpperCase();
  }

  isSelf(member: WorkspaceMemberResponse): boolean {
    const currentUser = this.authStore.user();
    if (!currentUser) return false;
    return (
      (!!currentUser.id && currentUser.id === member.userId) ||
      (!!currentUser.username &&
        currentUser.username.toLowerCase() === member.username.toLowerCase()) ||
      (!!currentUser.email && currentUser.email.toLowerCase() === member.email.toLowerCase())
    );
  }

  canModifyRole(member: WorkspaceMemberResponse): boolean {
    if (this.isSelf(member)) return false;
    const currentRole = this.selectedManageWorkspace()?.role;
    if (member.role === "OWNER") return false;
    if (currentRole === "OWNER") return true;
    if (currentRole === "ADMIN" && member.role === "MEMBER") return true;
    return false;
  }

  canRemoveMember(member: WorkspaceMemberResponse): boolean {
    return this.canModifyRole(member);
  }
}
