import { Component, inject } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import {
  lucidePencil,
  lucideSettings,
  lucideTrash2,
  lucideUserPlus,
  lucideUsers,
  lucideX,
} from "@ng-icons/lucide";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { type ManageTab, WorkspaceManagement } from "../../services/workspace-management";
import { WorkspaceGeneralTab } from "./tabs/general/workspace-general-tab";
import { WorkspaceMembersTab } from "./tabs/members/workspace-members-tab";
import { WorkspaceInviteTab } from "./tabs/invite/workspace-invite-tab";
import { WorkspaceDangerTab } from "./tabs/danger/workspace-danger-tab";

export type { ManageTab };

@Component({
  selector: "aos-workspace-manage-modal",
  standalone: true,
  imports: [
    Button,
    Icons,
    WorkspaceGeneralTab,
    WorkspaceMembersTab,
    WorkspaceInviteTab,
    WorkspaceDangerTab,
  ],
  providers: [
    provideIcons({
      lucideSettings,
      lucideX,
      lucidePencil,
      lucideUsers,
      lucideUserPlus,
      lucideTrash2,
    }),
  ],
  templateUrl: "workspace-manage-modal.html",
})
export class WorkspaceManageModal {
  readonly wm = inject(WorkspaceManagement);

  readonly isOpen = this.wm.isManageModalOpen;
  readonly workspace = this.wm.selectedManageWorkspace;
  readonly activeTab = this.wm.selectedManageTab;
  readonly members = this.wm.members;

  onClose(): void {
    this.wm.closeManageModal();
  }

  setTab(tab: ManageTab): void {
    this.wm.onManageTabChange(tab);
  }
}
