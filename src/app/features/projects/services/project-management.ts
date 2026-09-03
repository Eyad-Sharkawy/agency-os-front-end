import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { catchError, forkJoin, Observable, of, tap } from "rxjs";
import { ClientResponse } from "../../../core/api/models/client.models";
import {
  ProjectRequest,
  ProjectResponse,
  ProjectStatus,
} from "../../../core/api/models/project.models";
import { ClientApi } from "../../../core/api/services/client/client-api";
import { ProjectApi } from "../../../core/api/services/project/project-api";
import { WorkspaceStore } from "../../../core/multitenancy/workspace.store";

export type ProjectFilterStatus = "ALL" | ProjectStatus;
export type ProjectViewMode = "grid" | "table";
export type ProjectAction = "create" | "edit" | "delete";

@Injectable({
  providedIn: "root",
})
export class ProjectManagement {
  private readonly projectApi = inject(ProjectApi);
  private readonly clientApi = inject(ClientApi);
  readonly workspaceStore = inject(WorkspaceStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParams = toSignal(this.route.queryParams);

  // State Signals
  readonly projects = signal<ProjectResponse[]>([]);
  readonly clients = signal<ClientResponse[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Filter & View State
  readonly searchQuery = signal<string>("");
  readonly statusFilter = signal<ProjectFilterStatus>("ALL");
  readonly clientFilter = signal<string>("ALL");
  readonly viewMode = signal<ProjectViewMode>("grid");

  // Modal State
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly isEditModalOpen = signal<boolean>(false);
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly selectedProject = signal<ProjectResponse | null>(null);

  // User Permissions
  readonly userRole = computed(() => this.workspaceStore.activeWorkspace()?.role);
  readonly canCreate = computed(() => {
    const role = this.userRole();
    return role === "OWNER" || role === "ADMIN";
  });
  readonly canEdit = computed(() => {
    const role = this.userRole();
    return role === "OWNER" || role === "ADMIN";
  });
  readonly canDelete = computed(() => {
    const role = this.userRole();
    return role === "OWNER";
  });
  readonly isReadOnly = computed(() => this.userRole() === "CLIENT");
  readonly canChangeClient = computed(() => {
    const role = this.userRole();
    return role === "OWNER";
  });

  // Client Map for fast lookup
  readonly clientMap = computed<Map<string, ClientResponse>>(() => {
    const map = new Map<string, ClientResponse>();
    for (const c of this.clients()) {
      map.set(c.id, c);
    }
    return map;
  });

  // Derived Filtered Projects
  readonly filteredProjects = computed<ProjectResponse[]>(() => {
    const list = this.projects();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const client = this.clientFilter();
    const clientLookup = this.clientMap();

    return list.filter(project => {
      const clientName = clientLookup.get(project.clientId)?.name?.toLowerCase() ?? "";
      const matchesSearch =
        !query ||
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        clientName.includes(query);

      const matchesStatus = status === "ALL" || project.status === status;
      const matchesClient = client === "ALL" || project.clientId === client;

      return matchesSearch && matchesStatus && matchesClient;
    });
  });

  // Stats Ribbon
  readonly stats = computed(() => {
    const all = this.projects();
    const inProgress = all.filter(p => p.status === "IN_PROGRESS").length;
    const planning = all.filter(p => p.status === "PLANNING").length;
    const onHold = all.filter(p => p.status === "ON_HOLD").length;
    const delivered = all.filter(p => p.status === "DELIVERED").length;
    const totalBudget = all.reduce((sum, p) => sum + (p.budget ?? 0), 0);

    return {
      total: all.length,
      inProgress,
      planning,
      onHold,
      delivered,
      totalBudget,
    };
  });

  constructor() {
    let lastTenantId: string | null = null;
    effect(() => {
      const tenantId = this.workspaceStore.activeTenantId();
      if (tenantId && tenantId !== lastTenantId) {
        lastTenantId = tenantId;
        this.loadProjects();
      }
    });

    effect(() => {
      this.syncUrlActionState(this.queryParams());
    });
  }

  private syncUrlActionState(params: Record<string, unknown> | undefined): void {
    const action = params?.["action"] as ProjectAction | undefined;
    const projectId = params?.["projectId"] as string | undefined;

    if (!action) {
      if (this.isCreateModalOpen() || this.isEditModalOpen() || this.isDeleteModalOpen()) {
        this.resetModalSignals();
      }
      return;
    }

    if (action === "create") {
      this.handleCreateAction();
      return;
    }

    if (projectId && (action === "edit" || action === "delete")) {
      this.handleEntityAction(action, projectId);
    }
  }

  private handleCreateAction(): void {
    if (!this.canCreate()) return;
    this.selectedProject.set(null);
    this.isCreateModalOpen.set(true);
    this.isEditModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
  }

  private handleEntityAction(action: "edit" | "delete", projectId: string): void {
    if ((action === "edit" && !this.canEdit()) || (action === "delete" && !this.canDelete())) {
      return;
    }

    if (this.selectedProject()?.id === projectId) {
      this.isCreateModalOpen.set(false);
      this.isEditModalOpen.set(action === "edit");
      this.isDeleteModalOpen.set(action === "delete");
      return;
    }

    const project = this.projects().find(p => p.id === projectId);
    if (project) {
      this.applyModalAction(action, project);
      return;
    }

    this.projectApi.getProjectById(projectId).subscribe({
      next: fetchedProject => {
        if (fetchedProject) {
          this.applyModalAction(action, fetchedProject);
        }
      },
      error: () => {
        this.closeModals();
      },
    });
  }

  private applyModalAction(action: ProjectAction, project: ProjectResponse): void {
    this.selectedProject.set(project);
    this.isCreateModalOpen.set(false);
    this.isEditModalOpen.set(action === "edit");
    this.isDeleteModalOpen.set(action === "delete");
  }

  private resetModalSignals(): void {
    this.isCreateModalOpen.set(false);
    this.isEditModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.selectedProject.set(null);
  }

  // --- API & State Operations ---

  loadProjects(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      projects: this.projectApi.getProjects(),
      clients: this.clientApi.getClients().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ projects, clients }) => {
        this.projects.set(projects || []);
        this.clients.set(clients || []);
        this.isLoading.set(false);

        const params = this.queryParams();
        const action = params?.["action"] as ProjectAction | undefined;
        const projectId = params?.["projectId"] as string | undefined;
        if (projectId && action && action !== "create") {
          const project = (projects || []).find(p => p.id === projectId);
          if (project) {
            this.applyModalAction(action, project);
          }
        }
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to load projects.");
        this.errorMessage.set(detail);
      },
    });
  }

  loadClients(): void {
    this.clientApi.getClients().subscribe({
      next: data => {
        this.clients.set(data || []);
      },
      error: () => {
        // Silently tolerate or log
      },
    });
  }

  createProject(req: ProjectRequest): Observable<ProjectResponse> {
    return this.projectApi.createProject(req).pipe(
      tap(newProject => {
        this.projects.update(prev => [newProject, ...prev]);
      }),
    );
  }

  updateProject(id: string, req: ProjectRequest): Observable<ProjectResponse> {
    return this.projectApi.updateProject(id, req).pipe(
      tap(updatedProject => {
        this.projects.update(prev => prev.map(p => (p.id === id ? updatedProject : p)));
      }),
    );
  }

  deleteProject(id: string): Observable<void> {
    return this.projectApi.deleteProject(id).pipe(
      tap(() => {
        this.projects.update(prev => prev.filter(p => p.id !== id));
      }),
    );
  }

  // --- Navigation & Query Param Sync Methods ---

  openCreateModal(): void {
    if (!this.canCreate()) return;
    this.selectedProject.set(null);
    this.isCreateModalOpen.set(true);
    this.isEditModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    void this.router.navigate([], {
      queryParams: { action: "create", projectId: null },
      queryParamsHandling: "merge",
    });
  }

  openEditModal(project: ProjectResponse): void {
    if (!this.canEdit()) return;
    this.applyModalAction("edit", project);
    void this.router.navigate([], {
      queryParams: { action: "edit", projectId: project.id },
      queryParamsHandling: "merge",
    });
  }

  openDeleteModal(project: ProjectResponse): void {
    if (!this.canDelete()) return;
    this.applyModalAction("delete", project);
    void this.router.navigate([], {
      queryParams: { action: "delete", projectId: project.id },
      queryParamsHandling: "merge",
    });
  }

  closeModals(): void {
    this.resetModalSignals();
    void this.router.navigate([], {
      queryParams: { action: null, projectId: null },
      queryParamsHandling: "merge",
    });
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  setStatusFilter(status: ProjectFilterStatus): void {
    this.statusFilter.set(status);
  }

  setClientFilter(clientId: string): void {
    this.clientFilter.set(clientId);
  }

  setViewMode(mode: ProjectViewMode): void {
    this.viewMode.set(mode);
  }

  getClientName(clientId: string): string {
    return this.clientMap().get(clientId)?.name ?? "Unknown Client";
  }
}
