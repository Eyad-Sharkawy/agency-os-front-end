import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { catchError, EMPTY, forkJoin, Observable, of, tap } from "rxjs";
import { moveItemInArray } from "@angular/cdk/drag-drop";
import { ProjectResponse } from "../../../core/api/models/project.models";
import {
  TaskPriority,
  TaskRequest,
  TaskResponse,
  TaskStatus,
  TaskStatusUpdateRequest,
} from "../../../core/api/models/task.models";
import { ProjectApi } from "../../../core/api/services/project/project-api";
import { TaskApi } from "../../../core/api/services/task/task-api";
import { WorkspaceStore } from "../../../core/multitenancy/workspace.store";

export type TaskFilterStatus = "ALL" | TaskStatus;
export type TaskFilterPriority = "ALL" | TaskPriority;
export type TaskViewMode = "kanban" | "list";
export type TaskAction = "create" | "edit" | "delete";

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  overBudget: number;
}

@Injectable({
  providedIn: "root",
})
export class TaskManagement {
  private readonly taskApi = inject(TaskApi);
  private readonly projectApi = inject(ProjectApi);
  readonly workspaceStore = inject(WorkspaceStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParams = toSignal(this.route.queryParams);

  // State Signals
  readonly tasks = signal<TaskResponse[]>([]);
  readonly projects = signal<ProjectResponse[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Filter & View State
  readonly searchQuery = signal<string>("");
  readonly statusFilter = signal<TaskFilterStatus>("ALL");
  readonly priorityFilter = signal<TaskFilterPriority>("ALL");
  readonly projectFilter = signal<string>("ALL");
  readonly viewMode = signal<TaskViewMode>("kanban");

  // Modal State
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly isEditModalOpen = signal<boolean>(false);
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly selectedTask = signal<TaskResponse | null>(null);
  readonly defaultStatusForCreate = signal<TaskStatus>("TODO");

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
    return role === "OWNER" || role === "ADMIN";
  });
  readonly canUpdateStatus = computed(() => {
    const role = this.userRole();
    return role === "OWNER" || role === "ADMIN" || role === "MEMBER";
  });
  readonly isReadOnly = computed(() => this.userRole() === "CLIENT");

  // Project Lookup Map
  readonly projectMap = computed<Map<string, ProjectResponse>>(() => {
    const map = new Map<string, ProjectResponse>();
    for (const p of this.projects()) {
      map.set(p.id, p);
    }
    return map;
  });

  // Filtered Tasks
  readonly filteredTasks = computed<TaskResponse[]>(() => {
    const list = this.tasks();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const priority = this.priorityFilter();
    const project = this.projectFilter();
    const projectLookup = this.projectMap();

    return list.filter(task => {
      const projectName = projectLookup.get(task.projectId)?.name?.toLowerCase() ?? "";
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        projectName.includes(query);

      const matchesStatus = status === "ALL" || task.status === status;
      const matchesPriority = priority === "ALL" || task.priority === priority;
      const matchesProject = project === "ALL" || task.projectId === project;

      return matchesSearch && matchesStatus && matchesPriority && matchesProject;
    });
  });

  // Kanban Column Tasks (derived from filteredTasks)
  readonly todoTasks = computed(() => this.filteredTasks().filter(t => t.status === "TODO"));
  readonly inProgressTasks = computed(() =>
    this.filteredTasks().filter(t => t.status === "IN_PROGRESS"),
  );
  readonly reviewTasks = computed(() => this.filteredTasks().filter(t => t.status === "REVIEW"));
  readonly doneTasks = computed(() => this.filteredTasks().filter(t => t.status === "DONE"));

  // Sprint & Backlog Stats Ribbon
  readonly stats = computed<TaskStats>(() => {
    const all = this.tasks();
    return {
      total: all.length,
      todo: all.filter(t => t.status === "TODO").length,
      inProgress: all.filter(t => t.status === "IN_PROGRESS").length,
      review: all.filter(t => t.status === "REVIEW").length,
      done: all.filter(t => t.status === "DONE").length,
      overBudget: all.filter(t => t.isOverBudget).length,
    };
  });

  constructor() {
    let lastTenantId: string | null = null;
    effect(() => {
      const tenantId = this.workspaceStore.activeTenantId();
      if (tenantId && tenantId !== lastTenantId) {
        lastTenantId = tenantId;
        this.loadTasks();
      }
    });

    effect(() => {
      this.syncUrlActionState(this.queryParams());
    });
  }

  private syncUrlActionState(params: Record<string, unknown> | undefined): void {
    const action = params?.["action"] as TaskAction | undefined;
    const taskId = params?.["taskId"] as string | undefined;
    const projectId = params?.["projectId"] as string | undefined;

    if (projectId && !action) {
      this.projectFilter.set(projectId);
    }

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

    if (taskId && (action === "edit" || action === "delete")) {
      this.handleEntityAction(action, taskId);
    }
  }

  private handleCreateAction(): void {
    if (!this.canCreate()) return;
    this.selectedTask.set(null);
    this.isCreateModalOpen.set(true);
    this.isEditModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
  }

  private handleEntityAction(action: "edit" | "delete", taskId: string): void {
    if ((action === "edit" && !this.canEdit()) || (action === "delete" && !this.canDelete())) {
      return;
    }

    if (this.selectedTask()?.id === taskId) {
      this.isCreateModalOpen.set(false);
      this.isEditModalOpen.set(action === "edit");
      this.isDeleteModalOpen.set(action === "delete");
      return;
    }

    const task = this.tasks().find(t => t.id === taskId);
    if (task) {
      this.applyModalAction(action, task);
      return;
    }

    this.taskApi.getTaskById(taskId).subscribe({
      next: fetchedTask => {
        if (fetchedTask) {
          this.applyModalAction(action, fetchedTask);
        }
      },
      error: () => {
        this.closeModals();
      },
    });
  }

  private applyModalAction(action: TaskAction, task: TaskResponse): void {
    this.selectedTask.set(task);
    this.isCreateModalOpen.set(false);
    this.isEditModalOpen.set(action === "edit");
    this.isDeleteModalOpen.set(action === "delete");
  }

  private resetModalSignals(): void {
    this.isCreateModalOpen.set(false);
    this.isEditModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.selectedTask.set(null);
  }

  // --- API & State Operations ---

  loadTasks(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      tasks: this.taskApi.getTasks(),
      projects: this.projectApi.getProjects().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ tasks, projects }) => {
        this.tasks.set(tasks || []);
        this.projects.set(projects || []);
        this.isLoading.set(false);

        const params = this.queryParams();
        const action = params?.["action"] as TaskAction | undefined;
        const taskId = params?.["taskId"] as string | undefined;
        if (taskId && action && action !== "create") {
          const task = (tasks || []).find(t => t.id === taskId);
          if (task) {
            this.applyModalAction(action, task);
          }
        }
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to load tasks.");
        this.errorMessage.set(detail);
      },
    });
  }

  createTask(req: TaskRequest): Observable<TaskResponse> {
    return this.taskApi.createTask(req).pipe(
      tap(newTask => {
        this.tasks.update(prev => [newTask, ...prev]);
      }),
    );
  }

  updateTask(id: string, req: TaskRequest): Observable<TaskResponse> {
    return this.taskApi.updateTask(id, req).pipe(
      tap(updatedTask => {
        this.tasks.update(prev => prev.map(t => (t.id === id ? updatedTask : t)));
      }),
    );
  }

  getColumnTasksByStatus(status: TaskStatus): TaskResponse[] {
    switch (status) {
      case "TODO":
        return this.todoTasks();
      case "IN_PROGRESS":
        return this.inProgressTasks();
      case "REVIEW":
        return this.reviewTasks();
      case "DONE":
        return this.doneTasks();
    }
  }

  reorderColumnTasks(status: TaskStatus, previousIndex: number, currentIndex: number): void {
    if (previousIndex === currentIndex) return;

    const columnTasks = this.getColumnTasksByStatus(status);
    if (
      previousIndex < 0 ||
      previousIndex >= columnTasks.length ||
      currentIndex < 0 ||
      currentIndex >= columnTasks.length
    ) {
      return;
    }

    const movedTask = columnTasks[previousIndex];
    const targetTask = columnTasks[currentIndex];
    if (!movedTask || !targetTask || movedTask.id === targetTask.id) return;

    this.tasks.update(currentTasks => {
      const updated = [...currentTasks];
      const fromIdx = updated.findIndex(t => t.id === movedTask.id);
      const toIdx = updated.findIndex(t => t.id === targetTask.id);

      if (fromIdx !== -1 && toIdx !== -1) {
        moveItemInArray(updated, fromIdx, toIdx);
      }
      return updated;
    });
  }

  updateTaskStatus(
    id: string,
    newStatus: TaskStatus,
    targetIndex?: number,
  ): Observable<TaskResponse> {
    // Optimistic update
    if (!this.canUpdateStatus()) {
      return EMPTY;
    }

    const previousTasks = this.tasks();
    this.tasks.update(prev => {
      const task = prev.find(t => t.id === id);
      if (!task) return prev;
      const updated = { ...task, status: newStatus };
      const without = prev.filter(t => t.id !== id);

      if (typeof targetIndex === "number" && targetIndex >= 0) {
        const columnTasks = without.filter(t => t.status === newStatus);
        if (targetIndex < columnTasks.length) {
          const insertBeforeItem = columnTasks[targetIndex];
          const insertIdx = without.findIndex(t => t.id === insertBeforeItem.id);
          const copy = [...without];
          copy.splice(insertIdx, 0, updated);
          return copy;
        }
      }
      return [...without, updated];
    });

    const req: TaskStatusUpdateRequest = { status: newStatus };
    return this.taskApi.updateTaskStatus(id, req).pipe(
      tap(updatedTask => {
        this.tasks.update(prev => prev.map(t => (t.id === id ? updatedTask : t)));
      }),
      catchError(err => {
        // Revert on error
        this.tasks.set(previousTasks);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to update task status.");
        this.errorMessage.set(detail);
        throw err;
      }),
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.taskApi.deleteTask(id).pipe(
      tap(() => {
        this.tasks.update(prev => prev.filter(t => t.id !== id));
      }),
    );
  }

  // --- Navigation & Query Param Sync Methods ---

  openCreateModal(defaultStatus: TaskStatus = "TODO"): void {
    if (!this.canCreate()) return;
    this.defaultStatusForCreate.set(defaultStatus);
    this.selectedTask.set(null);
    this.isCreateModalOpen.set(true);
    this.isEditModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    void this.router.navigate([], {
      queryParams: { action: "create", taskId: null },
      queryParamsHandling: "merge",
    });
  }

  openEditModal(task: TaskResponse): void {
    if (!this.canEdit()) return;
    this.applyModalAction("edit", task);
    void this.router.navigate([], {
      queryParams: { action: "edit", taskId: task.id },
      queryParamsHandling: "merge",
    });
  }

  openDeleteModal(task: TaskResponse): void {
    if (!this.canDelete()) return;
    this.applyModalAction("delete", task);
    void this.router.navigate([], {
      queryParams: { action: "delete", taskId: task.id },
      queryParamsHandling: "merge",
    });
  }

  closeModals(): void {
    this.resetModalSignals();
    void this.router.navigate([], {
      queryParams: { action: null, taskId: null },
      queryParamsHandling: "merge",
    });
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  setStatusFilter(status: TaskFilterStatus): void {
    this.statusFilter.set(status);
  }

  setPriorityFilter(priority: TaskFilterPriority): void {
    this.priorityFilter.set(priority);
  }

  setProjectFilter(projectId: string): void {
    this.projectFilter.set(projectId);
  }

  setViewMode(mode: TaskViewMode): void {
    this.viewMode.set(mode);
  }

  getProjectName(projectId: string): string {
    return this.projectMap().get(projectId)?.name ?? "Unknown Project";
  }
}
