import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideBriefcase,
  lucideBuilding2,
  lucidePlus,
  lucideRefreshCw,
  lucideSearch,
} from "@ng-icons/lucide";
import { WorkspaceInvitationResponse, WorkspaceResponse } from "../../core/api/models";
import { AuthStore } from "../../core/auth/stores/auth.store";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";
import { LogoComponent } from "../../shared/components/logo/logo";
import { WorkspaceCard } from "./components/workspace-card/workspace-card";
import {
  ManageTab,
  WorkspaceManageModal,
} from "./components/workspace-manage-modal/workspace-manage-modal";
import { WorkspaceInvitations } from "./components/workspace-invitations/workspace-invitations";
import { WorkspaceManagement } from "./services/workspace-management";

@Component({
  selector: "aos-workspaces",
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    Button,
    Icons,
    LogoComponent,
    WorkspaceCard,
    WorkspaceManageModal,
    WorkspaceInvitations,
  ],
  providers: [
    provideIcons({
      lucideBuilding2,
      lucidePlus,
      lucideAlertCircle,
      lucideRefreshCw,
      lucideSearch,
      lucideBriefcase,
    }),
  ],
  templateUrl: "./workspaces.html",
  styleUrl: "./workspaces.css",
})
export class Workspaces {
  readonly wm = inject(WorkspaceManagement);
  readonly authStore = inject(AuthStore);

  // Directory & Resource Signals
  readonly workspacesResource = this.wm.workspacesResource;
  readonly invitationsResource = this.wm.invitationsResource;
  readonly workspacesList = this.wm.workspacesList;
  readonly pendingInvitations = this.wm.pendingInvitations;
  readonly hasWorkspaces = this.wm.hasWorkspaces;
  readonly searchQuery = this.wm.searchQuery;
  readonly filteredWorkspaces = this.wm.filteredWorkspaces;
  readonly processingInvitationId = this.wm.processingInvitationId;

  // Manage Modal State Signals
  readonly isManageModalOpen = this.wm.isManageModalOpen;
  readonly selectedManageWorkspace = this.wm.selectedManageWorkspace;
  readonly selectedManageTab = this.wm.selectedManageTab;

  selectWorkspace(ws: WorkspaceResponse): void {
    this.wm.selectWorkspace(ws);
  }

  isCurrentActive(ws: WorkspaceResponse): boolean {
    return this.wm.isCurrentActive(ws);
  }

  openManageModal(ws: WorkspaceResponse, tab: ManageTab = "general"): void {
    this.wm.openManageModal(ws, tab);
  }

  onManageTabChange(tab: ManageTab): void {
    this.wm.onManageTabChange(tab);
  }

  closeManageModal(): void {
    this.wm.closeManageModal();
  }

  onWorkspaceUpdated(updatedWs: WorkspaceResponse): void {
    this.wm.selectedManageWorkspace.set(updatedWs);
    this.wm.workspacesResource.reload();
    if (this.wm.workspaceStore.activeTenantId() === updatedWs.tenantId) {
      this.wm.workspaceStore.setActiveWorkspace(updatedWs);
    }
  }

  onWorkspaceDeleted(tenantId: string): void {
    if (this.wm.workspaceStore.activeTenantId() === tenantId) {
      this.wm.workspaceStore.clear();
    }
    this.wm.closeManageModal();
    this.wm.workspacesResource.reload();
  }

  acceptInvitation(invitation: WorkspaceInvitationResponse): void {
    this.wm.acceptInvitation(invitation);
  }

  declineInvitation(invitation: WorkspaceInvitationResponse): void {
    this.wm.declineInvitation(invitation);
  }

  reloadAll(): void {
    this.wm.reloadAll();
  }
}
