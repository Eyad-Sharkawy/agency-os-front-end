import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideAlertTriangle,
  lucideArrowRightLeft,
  lucideCheck,
  lucideCheckCircle2,
  lucideCrown,
  lucideLoader2,
  lucideMail,
  lucidePencil,
  lucideSend,
  lucideSettings,
  lucideShield,
  lucideTrash2,
  lucideUserMinus,
  lucideUserPlus,
  lucideUsers,
  lucideX,
} from "@ng-icons/lucide";
import {
  WorkspaceMemberResponse,
  WorkspaceRole,
} from "../../../../core/api/models/workspace.models";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { Select, SelectOption } from "../../../../shared/components/select/select";
import { type ManageTab, WorkspaceManagement } from "../../services/workspace-management";

export type { ManageTab };

@Component({
  selector: "aos-workspace-manage-modal",
  standalone: true,
  imports: [FormsModule, Button, Icons, Select],
  providers: [
    provideIcons({
      lucideSettings,
      lucideX,
      lucidePencil,
      lucideUsers,
      lucideUserPlus,
      lucideUserMinus,
      lucideTrash2,
      lucideCheck,
      lucideCheckCircle2,
      lucideAlertCircle,
      lucideAlertTriangle,
      lucideLoader2,
      lucideSend,
      lucideMail,
      lucideCrown,
      lucideShield,
      lucideArrowRightLeft,
    }),
  ],
  templateUrl: "workspace-manage-modal.html",
})
export class WorkspaceManageModal {
  readonly wm = inject(WorkspaceManagement);

  readonly isOpen = this.wm.isManageModalOpen;
  readonly workspace = this.wm.selectedManageWorkspace;
  readonly activeTab = this.wm.selectedManageTab;

  readonly editName = this.wm.editName;
  readonly isUpdatingName = this.wm.isUpdatingName;
  readonly updateNameSuccess = this.wm.updateNameSuccess;
  readonly updateNameError = this.wm.updateNameError;

  readonly members = this.wm.members;
  readonly isLoadingMembers = this.wm.isLoadingMembers;
  readonly membersError = this.wm.membersError;
  readonly memberActionSuccess = this.wm.memberActionSuccess;
  readonly memberActionError = this.wm.memberActionError;
  readonly memberActionLoading = this.wm.memberActionLoading;
  readonly transferTarget = this.wm.transferTarget;
  readonly removeTarget = this.wm.removeTarget;

  readonly inviteTarget = this.wm.inviteTarget;
  readonly inviteRole = this.wm.inviteRole;
  readonly isInviting = this.wm.isInviting;
  readonly inviteSuccess = this.wm.inviteSuccess;
  readonly inviteError = this.wm.inviteError;

  readonly deleteConfirmName = this.wm.deleteConfirmName;
  readonly isDeleting = this.wm.isDeleting;
  readonly deleteError = this.wm.deleteError;

  onClose(): void {
    this.wm.closeManageModal();
  }

  setTab(tab: ManageTab): void {
    this.wm.onManageTabChange(tab);
  }

  loadMembers(): void {
    this.wm.loadMembers();
  }

  submitUpdateName(): void {
    this.wm.submitUpdateName();
  }

  onRoleChange(member: WorkspaceMemberResponse, newRole: WorkspaceRole): void {
    this.wm.onRoleChange(member, newRole);
  }

  submitTransferOwnership(): void {
    this.wm.submitTransferOwnership();
  }

  confirmTransferOwnership(): void {
    this.wm.submitTransferOwnership();
  }

  submitRemoveMember(): void {
    this.wm.submitRemoveMember();
  }

  confirmRemoveMember(): void {
    this.wm.submitRemoveMember();
  }

  submitInviteUser(): void {
    this.wm.submitInviteUser();
  }

  submitDeleteWorkspace(): void {
    this.wm.submitDeleteWorkspace();
  }

  getInviteRoleOptions(): SelectOption<WorkspaceRole>[] {
    return this.wm.getInviteRoleOptions();
  }

  getMemberRoleOptions(): SelectOption<WorkspaceRole>[] {
    return this.wm.getMemberRoleOptions();
  }

  getInitials(member: WorkspaceMemberResponse): string {
    return this.wm.getInitials(member);
  }

  isSelf(member: WorkspaceMemberResponse): boolean {
    return this.wm.isSelf(member);
  }

  canModifyRole(member: WorkspaceMemberResponse): boolean {
    return this.wm.canModifyRole(member);
  }

  canRemoveMember(member: WorkspaceMemberResponse): boolean {
    return this.wm.canRemoveMember(member);
  }
}
