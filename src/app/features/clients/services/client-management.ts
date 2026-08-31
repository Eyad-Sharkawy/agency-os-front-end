import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable, tap } from "rxjs";
import {
  ClientRequest,
  ClientResponse,
  ClientStatus,
} from "../../../core/api/models/client.models";
import { WorkspaceInvitationResponse } from "../../../core/api/models/invitation.models";
import { ClientApi } from "../../../core/api/services/client/client-api";
import { InvitationApi } from "../../../core/api/services/invitation/invitation-api";
import { WorkspaceStore } from "../../../core/multitenancy/workspace.store";

export type ClientFilterStatus = "ALL" | ClientStatus;
export type ClientViewMode = "grid" | "table";
export type ClientAction = "create" | "edit" | "delete" | "invite";

@Injectable({
  providedIn: "root",
})
export class ClientManagement {
  private readonly clientApi = inject(ClientApi);
  private readonly invitationApi = inject(InvitationApi);
  readonly workspaceStore = inject(WorkspaceStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParams = toSignal(this.route.queryParams);

  // State Signals
  readonly clients = signal<ClientResponse[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Filter & View State
  readonly searchQuery = signal<string>("");
  readonly statusFilter = signal<ClientFilterStatus>("ALL");
  readonly viewMode = signal<ClientViewMode>("grid");

  // Modal State
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly isEditModalOpen = signal<boolean>(false);
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly isInviteModalOpen = signal<boolean>(false);
  readonly selectedClient = signal<ClientResponse | null>(null);

  // Client User Invitation State
  readonly inviteTarget = signal<string>("");
  readonly isInviting = signal<boolean>(false);
  readonly inviteSuccess = signal<string | null>(null);
  readonly inviteError = signal<string | null>(null);

  // User Permissions
  readonly userRole = computed(() => this.workspaceStore.activeWorkspace()?.role);
  readonly canCreate = computed(() => {
    const role = this.userRole();
    return role === "OWNER" || role === "ADMIN";
  });
  readonly canEdit = computed(() => {
    const role = this.userRole();
    return role === "OWNER";
  });
  readonly canDelete = computed(() => {
    const role = this.userRole();
    return role === "OWNER";
  });
  readonly canInviteClient = computed(() => {
    const role = this.userRole();
    return role === "OWNER";
  });

  // Derived Computed Signals
  readonly filteredClients = computed<ClientResponse[]>(() => {
    const list = this.clients();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    return list.filter(client => {
      const matchesSearch =
        !query ||
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query);

      const matchesStatus = status === "ALL" || client.status === status;

      return matchesSearch && matchesStatus;
    });
  });

  readonly stats = computed(() => {
    const all = this.clients();
    const active = all.filter(c => c.status === "ACTIVE").length;
    const inactive = all.filter(c => c.status === "INACTIVE").length;
    return {
      total: all.length,
      active,
      inactive,
    };
  });

  constructor() {
    effect(() => {
      const params = this.queryParams();
      const action = params?.["action"] as ClientAction | undefined;
      const clientId = params?.["clientId"] as string | undefined;

      if (!action) {
        if (
          this.isCreateModalOpen() ||
          this.isEditModalOpen() ||
          this.isDeleteModalOpen() ||
          this.isInviteModalOpen()
        ) {
          this.resetModalSignals();
        }
        return;
      }

      if (action === "create") {
        this.selectedClient.set(null);
        this.isCreateModalOpen.set(true);
        this.isEditModalOpen.set(false);
        this.isDeleteModalOpen.set(false);
        this.isInviteModalOpen.set(false);
        return;
      }

      if (clientId && (action === "edit" || action === "delete" || action === "invite")) {
        if (this.selectedClient()?.id === clientId) {
          this.isCreateModalOpen.set(false);
          this.isEditModalOpen.set(action === "edit");
          this.isDeleteModalOpen.set(action === "delete");
          this.isInviteModalOpen.set(action === "invite");
          return;
        }

        const client = this.clients().find(c => c.id === clientId);
        if (client) {
          this.applyModalAction(action, client);
        } else {
          // If clients list is not populated yet, fetch the specific client
          this.clientApi.getClientById(clientId).subscribe({
            next: fetchedClient => {
              if (fetchedClient) {
                this.applyModalAction(action, fetchedClient);
              }
            },
            error: () => {
              this.closeModals();
            },
          });
        }
      }
    });
  }

  private applyModalAction(action: ClientAction, client: ClientResponse): void {
    this.selectedClient.set(client);
    this.isCreateModalOpen.set(false);
    this.isEditModalOpen.set(action === "edit");
    this.isDeleteModalOpen.set(action === "delete");
    this.isInviteModalOpen.set(action === "invite");

    if (action === "invite") {
      this.inviteTarget.set(client.email || "");
      this.inviteSuccess.set(null);
      this.inviteError.set(null);
      this.isInviting.set(false);
    }
  }

  private resetModalSignals(): void {
    this.isCreateModalOpen.set(false);
    this.isEditModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.isInviteModalOpen.set(false);
    this.selectedClient.set(null);
    this.inviteSuccess.set(null);
    this.inviteError.set(null);
    this.isInviting.set(false);
  }

  // --- API & State Operations ---

  loadClients(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.clientApi.getClients().subscribe({
      next: data => {
        this.clients.set(data || []);
        this.isLoading.set(false);

        // Re-check query param client selection if present
        const params = this.queryParams();
        const action = params?.["action"] as ClientAction | undefined;
        const clientId = params?.["clientId"] as string | undefined;
        if (clientId && action && action !== "create") {
          const client = (data || []).find(c => c.id === clientId);
          if (client) {
            this.applyModalAction(action, client);
          }
        }
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to load clients.");
        this.errorMessage.set(detail);
      },
    });
  }

  createClient(req: ClientRequest): Observable<ClientResponse> {
    return this.clientApi.createClient(req).pipe(
      tap(newClient => {
        this.clients.update(prev => [newClient, ...prev]);
      }),
    );
  }

  updateClient(id: string, req: ClientRequest): Observable<ClientResponse> {
    return this.clientApi.updateClient(id, req).pipe(
      tap(updatedClient => {
        this.clients.update(prev => prev.map(c => (c.id === id ? updatedClient : c)));
      }),
    );
  }

  deleteClient(id: string): Observable<void> {
    return this.clientApi.deleteClient(id).pipe(
      tap(() => {
        this.clients.update(prev => prev.filter(c => c.id !== id));
      }),
    );
  }

  // --- Navigation & Query Param Sync Methods ---

  openCreateModal(): void {
    this.selectedClient.set(null);
    this.isCreateModalOpen.set(true);
    this.isEditModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.isInviteModalOpen.set(false);
    void this.router.navigate([], {
      queryParams: { action: "create", clientId: null },
      queryParamsHandling: "merge",
    });
  }

  openEditModal(client: ClientResponse): void {
    this.applyModalAction("edit", client);
    void this.router.navigate([], {
      queryParams: { action: "edit", clientId: client.id },
      queryParamsHandling: "merge",
    });
  }

  openDeleteModal(client: ClientResponse): void {
    this.applyModalAction("delete", client);
    void this.router.navigate([], {
      queryParams: { action: "delete", clientId: client.id },
      queryParamsHandling: "merge",
    });
  }

  openInviteModal(client: ClientResponse): void {
    this.applyModalAction("invite", client);
    void this.router.navigate([], {
      queryParams: { action: "invite", clientId: client.id },
      queryParamsHandling: "merge",
    });
  }

  closeModals(): void {
    this.resetModalSignals();
    void this.router.navigate([], {
      queryParams: { action: null, clientId: null },
      queryParamsHandling: "merge",
    });
  }

  inviteClientUser(target: string): Observable<WorkspaceInvitationResponse> {
    const client = this.selectedClient();
    const activeTenantId = this.workspaceStore.activeTenantId();
    if (!client || !activeTenantId) {
      throw new Error("Active workspace or client is missing.");
    }

    this.isInviting.set(true);
    this.inviteSuccess.set(null);
    this.inviteError.set(null);

    const isEmail = target.includes("@");
    const payload = {
      username: isEmail ? undefined : target.trim(),
      email: isEmail ? target.trim().toLowerCase() : undefined,
      role: "CLIENT" as const,
      clientId: client.id,
    };

    return this.invitationApi.inviteUser(activeTenantId, payload).pipe(
      tap({
        next: () => {
          this.isInviting.set(false);
          this.inviteSuccess.set(`Invitation successfully sent to ${target} for ${client.name}!`);
        },
        error: (err: unknown) => {
          this.isInviting.set(false);
          const detail =
            (err as { error?: { detail?: string } })?.error?.detail ||
            (err instanceof Error ? err.message : "Failed to send invitation.");
          this.inviteError.set(detail);
        },
      }),
    );
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  setStatusFilter(status: ClientFilterStatus): void {
    this.statusFilter.set(status);
  }

  setViewMode(mode: ClientViewMode): void {
    this.viewMode.set(mode);
  }

  getInitials(name: string): string {
    if (!name) return "CL";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
