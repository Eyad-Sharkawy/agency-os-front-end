import { Component, inject } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideAlertTriangle,
  lucideCrown,
  lucideLoader2,
  lucideTrash2,
  lucideUserMinus,
} from "@ng-icons/lucide";
import {
  WorkspaceMemberResponse,
  WorkspaceRole,
} from "../../../../../../core/api/models/workspace.models";
import { Button } from "../../../../../../shared/components/button/button";
import { Icons } from "../../../../../../shared/components/icons/icons";
import { Select, SelectOption } from "../../../../../../shared/components/select/select";
import { WorkspaceManagement } from "../../../../services/workspace-management";

@Component({
  selector: "aos-workspace-members-tab",
  standalone: true,
  imports: [Button, Icons, Select],
  providers: [
    provideIcons({
      lucideCrown,
      lucideAlertCircle,
      lucideAlertTriangle,
      lucideLoader2,
      lucideUserMinus,
      lucideTrash2,
    }),
  ],
  templateUrl: "workspace-members-tab.html",
})
export class WorkspaceMembersTab {
  readonly wm = inject(WorkspaceManagement);

  readonly workspace = this.wm.selectedManageWorkspace;
  readonly members = this.wm.members;
  readonly isLoadingMembers = this.wm.isLoadingMembers;
  readonly membersError = this.wm.membersError;
  readonly memberActionSuccess = this.wm.memberActionSuccess;
  readonly memberActionError = this.wm.memberActionError;
  readonly memberActionLoading = this.wm.memberActionLoading;
  readonly transferTarget = this.wm.transferTarget;
  readonly removeTarget = this.wm.removeTarget;

  loadMembers(): void {
    this.wm.loadMembers();
  }

  confirmTransferOwnership(): void {
    this.wm.submitTransferOwnership();
  }

  confirmRemoveMember(): void {
    this.wm.submitRemoveMember();
  }

  onRoleChange(member: WorkspaceMemberResponse, newRole: WorkspaceRole): void {
    this.wm.onRoleChange(member, newRole);
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
