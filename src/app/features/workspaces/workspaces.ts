import { Component, computed, effect, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideBriefcase,
  lucideBuilding2,
  lucidePlus,
  lucideRefreshCw,
  lucideSearch,
} from "@ng-icons/lucide";
import { WorkspaceResponse } from "../../core/api/models/workspace.models";
import { WorkspaceInvitationResponse } from "../../core/api/models/invitation.models";
import { WorkspaceService } from "../../core/api/services/workspace.service";
import { InvitationService } from "../../core/api/services/invitation.service";
import { WorkspaceStore } from "../../core/multitenancy/workspace.store";
import { AuthStore } from "../../core/auth/auth.store";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";
import { LogoComponent } from "../../shared/components/logo/logo";
import { WorkspaceCard } from "./components/workspace-card/workspace-card";
import {
  ManageTab,
  WorkspaceManageModal,
} from "./components/workspace-manage-modal/workspace-manage-modal";
import { WorkspaceInvitations } from "./components/workspace-invitations/workspace-invitations";

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
  private readonly workspaceService = inject(WorkspaceService);
  private readonly invitationService = inject(InvitationService);
  readonly workspaceStore = inject(WorkspaceStore);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParams = toSignal(this.route.queryParams);

  // Reactive HTTP Resources (Signals)
  readonly workspacesResource = this.workspaceService.getWorkspacesResource({ defaultValue: [] });
  readonly invitationsResource = this.invitationService.getPendingInvitationsResource({
    defaultValue: [],
  });

  // Safe computed lists guarding against resource errors
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

  // Manage / Edit Workspace Modal State
  readonly isManageModalOpen = signal(false);
  readonly selectedManageWorkspace = signal<WorkspaceResponse | null>(null);
  readonly selectedManageTab = signal<ManageTab>("general");

  // Invitation Processing State
  readonly processingInvitationId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const params = this.queryParams();
      const manageTenantId = params?.["manage"];
      const tab = (params?.["tab"] as ManageTab) || "general";

      if (manageTenantId) {
        const list = this.workspacesList();
        const ws = list.find(w => w.tenantId === manageTenantId);
        if (ws) {
          this.selectedManageWorkspace.set(ws);
          this.selectedManageTab.set(tab);
          this.isManageModalOpen.set(true);
        }
      } else if (this.isManageModalOpen()) {
        this.isManageModalOpen.set(false);
        this.selectedManageWorkspace.set(null);
      }
    });
  }

  selectWorkspace(ws: WorkspaceResponse): void {
    this.workspaceStore.setActiveWorkspace(ws);
    this.router.navigate(["/"]);
  }

  isCurrentActive(ws: WorkspaceResponse): boolean {
    return this.workspaceStore.activeTenantId() === ws.tenantId;
  }

  openManageModal(ws: WorkspaceResponse, tab: ManageTab = "general"): void {
    this.selectedManageWorkspace.set(ws);
    this.selectedManageTab.set(tab);
    this.isManageModalOpen.set(true);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { manage: ws.tenantId, tab },
      queryParamsHandling: "merge",
    });
  }

  onManageTabChange(tab: ManageTab): void {
    this.selectedManageTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: "merge",
    });
  }

  closeManageModal(): void {
    this.isManageModalOpen.set(false);
    this.selectedManageWorkspace.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { manage: null, tab: null },
      queryParamsHandling: "merge",
    });
  }

  onWorkspaceUpdated(updatedWs: WorkspaceResponse): void {
    this.workspacesResource.reload();
    if (this.workspaceStore.activeTenantId() === updatedWs.tenantId) {
      this.workspaceStore.setActiveWorkspace(updatedWs);
    }
  }

  onWorkspaceDeleted(tenantId: string): void {
    if (this.workspaceStore.activeTenantId() === tenantId) {
      this.workspaceStore.clear();
    }
    this.closeManageModal();
    this.workspacesResource.reload();
  }

  acceptInvitation(invitation: WorkspaceInvitationResponse): void {
    this.processingInvitationId.set(invitation.id);
    this.invitationService.acceptInvitation(invitation.id).subscribe({
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
    this.invitationService.declineInvitation(invitation.id).subscribe({
      next: () => {
        this.processingInvitationId.set(null);
        this.invitationsResource.reload();
      },
      error: () => {
        this.processingInvitationId.set(null);
      },
    });
  }

  reloadAll(): void {
    this.workspacesResource.reload();
    this.invitationsResource.reload();
  }
}
