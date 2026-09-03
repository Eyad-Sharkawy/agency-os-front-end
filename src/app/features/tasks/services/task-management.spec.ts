import { signal, WritableSignal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectResponse } from "../../../core/api/models/project.models";
import { TaskRequest, TaskResponse, TaskStatus } from "../../../core/api/models/task.models";
import { ProjectApi } from "../../../core/api/services/project/project-api";
import { TaskApi } from "../../../core/api/services/task/task-api";
import { WorkspaceStore } from "../../../core/multitenancy/workspace.store";
import { TaskManagement } from "./task-management";

describe("TaskManagement", () => {
  let service: TaskManagement;
  let router: Router;
  let taskApiMock: {
    getTasks: ReturnType<typeof vi.fn>;
    getTaskById: ReturnType<typeof vi.fn>;
    createTask: ReturnType<typeof vi.fn>;
    updateTask: ReturnType<typeof vi.fn>;
    updateTaskStatus: ReturnType<typeof vi.fn>;
    deleteTask: ReturnType<typeof vi.fn>;
  };
  let projectApiMock: {
    getProjects: ReturnType<typeof vi.fn>;
  };
  let activeWorkspaceSignal: WritableSignal<{ role: string; tenantId: string } | null>;
  let workspaceStoreMock: {
    activeWorkspace: WritableSignal<{ role: string; tenantId: string } | null>;
    activeTenantId: WritableSignal<string | null>;
  };

  const mockProjects: ProjectResponse[] = [
    {
      id: "proj-1",
      name: "Alpha Redesign",
      clientId: "client-1",
      billingRate: 150,
      status: "IN_PROGRESS",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "proj-2",
      name: "Beta Mobile App",
      clientId: "client-2",
      billingRate: 175,
      status: "PLANNING",
      createdAt: "2026-01-02T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    },
  ];

  const mockTasks: TaskResponse[] = [
    {
      id: "task-1",
      title: "Design Homepage Wireframe",
      description: "Create high fidelity wireframes",
      projectId: "proj-1",
      status: "TODO",
      priority: "HIGH",
      estimatedMinutes: 480,
      totalLoggedMinutes: 120,
      isOverBudget: false,
      assigneeIds: ["user-1"],
      createdAt: "2026-01-05T00:00:00Z",
      updatedAt: "2026-01-05T00:00:00Z",
    },
    {
      id: "task-2",
      title: "Implement Auth Flow",
      description: "Keycloak integration with PKCE",
      projectId: "proj-1",
      status: "IN_PROGRESS",
      priority: "URGENT",
      estimatedMinutes: 300,
      totalLoggedMinutes: 360,
      isOverBudget: true,
      assigneeIds: ["user-1", "user-2"],
      createdAt: "2026-01-06T00:00:00Z",
      updatedAt: "2026-01-06T00:00:00Z",
    },
    {
      id: "task-3",
      title: "Code Review for API",
      description: "Review TaskController endpoints",
      projectId: "proj-2",
      status: "REVIEW",
      priority: "MEDIUM",
      estimatedMinutes: 120,
      totalLoggedMinutes: 60,
      isOverBudget: false,
      assigneeIds: [],
      createdAt: "2026-01-07T00:00:00Z",
      updatedAt: "2026-01-07T00:00:00Z",
    },
    {
      id: "task-4",
      title: "Deploy Database Schema",
      description: "Flyway migrations for tenant tables",
      projectId: "proj-2",
      status: "DONE",
      priority: "LOW",
      estimatedMinutes: 60,
      totalLoggedMinutes: 50,
      isOverBudget: false,
      assigneeIds: ["user-3"],
      createdAt: "2026-01-08T00:00:00Z",
      updatedAt: "2026-01-08T00:00:00Z",
    },
  ];

  beforeEach(() => {
    taskApiMock = {
      getTasks: vi.fn().mockReturnValue(of(mockTasks)),
      getTaskById: vi.fn().mockImplementation((id: string) => {
        const found = mockTasks.find(t => t.id === id);
        return found ? of(found) : throwError(() => new Error("Not found"));
      }),
      createTask: vi.fn().mockImplementation((req: TaskRequest) =>
        of({
          ...req,
          id: "task-new",
          totalLoggedMinutes: 0,
          isOverBudget: false,
          createdAt: "2026-02-01T00:00:00Z",
          updatedAt: "2026-02-01T00:00:00Z",
        }),
      ),
      updateTask: vi.fn().mockImplementation((id: string, req: TaskRequest) =>
        of({
          ...req,
          id,
          totalLoggedMinutes: 0,
          isOverBudget: false,
          createdAt: "2026-02-01T00:00:00Z",
          updatedAt: "2026-02-01T00:00:00Z",
        }),
      ),
      updateTaskStatus: vi.fn().mockImplementation((id: string, req: { status: TaskStatus }) => {
        const existing = mockTasks.find(t => t.id === id);
        return of({ ...(existing || mockTasks[0]), id, status: req.status });
      }),
      deleteTask: vi.fn().mockReturnValue(of(undefined)),
    };

    projectApiMock = {
      getProjects: vi.fn().mockReturnValue(of(mockProjects)),
    };

    activeWorkspaceSignal = signal({ role: "OWNER", tenantId: "tenant-1" });
    workspaceStoreMock = {
      activeWorkspace: activeWorkspaceSignal,
      activeTenantId: signal("tenant-1"),
    };

    TestBed.configureTestingModule({
      providers: [
        TaskManagement,
        provideRouter([]),
        { provide: TaskApi, useValue: taskApiMock },
        { provide: ProjectApi, useValue: projectApiMock },
        { provide: WorkspaceStore, useValue: workspaceStoreMock },
      ],
    });

    service = TestBed.inject(TaskManagement);
    router = TestBed.inject(Router);
    vi.spyOn(router, "navigate").mockResolvedValue(true);
  });

  it("should initialize with default states", () => {
    expect(service.tasks()).toEqual([]);
    expect(service.isLoading()).toBe(false);
    expect(service.searchQuery()).toBe("");
    expect(service.statusFilter()).toBe("ALL");
    expect(service.priorityFilter()).toBe("ALL");
    expect(service.projectFilter()).toBe("ALL");
    expect(service.viewMode()).toBe("kanban");
  });

  it("should load tasks and projects successfully", () => {
    service.loadTasks();

    expect(service.isLoading()).toBe(false);
    expect(service.tasks()).toHaveLength(4);
    expect(service.projects()).toHaveLength(2);
    expect(service.errorMessage()).toBeNull();
  });

  it("should handle error when loading tasks fails", () => {
    taskApiMock.getTasks.mockReturnValue(
      throwError(() => ({ error: { detail: "Failed to connect to database" } })),
    );

    service.loadTasks();

    expect(service.isLoading()).toBe(false);
    expect(service.errorMessage()).toBe("Failed to connect to database");
  });

  it("should filter tasks by search query, project, and priority", () => {
    service.loadTasks();

    // Search by title
    service.setSearchQuery("Homepage");
    expect(service.filteredTasks()).toHaveLength(1);
    expect(service.filteredTasks()[0].id).toBe("task-1");

    // Search by project name
    service.setSearchQuery("Beta");
    expect(service.filteredTasks()).toHaveLength(2);

    // Clear search and filter by project
    service.setSearchQuery("");
    service.setProjectFilter("proj-1");
    expect(service.filteredTasks()).toHaveLength(2);

    // Filter by priority
    service.setPriorityFilter("URGENT");
    expect(service.filteredTasks()).toHaveLength(1);
    expect(service.filteredTasks()[0].id).toBe("task-2");
  });

  it("should categorize tasks into Kanban columns", () => {
    service.loadTasks();

    expect(service.todoTasks()).toHaveLength(1);
    expect(service.inProgressTasks()).toHaveLength(1);
    expect(service.reviewTasks()).toHaveLength(1);
    expect(service.doneTasks()).toHaveLength(1);
  });

  it("should calculate correct sprint stats", () => {
    service.loadTasks();

    const stats = service.stats();
    expect(stats.total).toBe(4);
    expect(stats.todo).toBe(1);
    expect(stats.inProgress).toBe(1);
    expect(stats.review).toBe(1);
    expect(stats.done).toBe(1);
    expect(stats.overBudget).toBe(1);
  });

  it("should create a new task and add to list", () => {
    service.loadTasks();

    const req: TaskRequest = {
      title: "New Feature Task",
      projectId: "proj-1",
      priority: "MEDIUM",
      status: "TODO",
      assigneeIds: [],
    };

    service.createTask(req).subscribe(created => {
      expect(created.id).toBe("task-new");
    });

    expect(taskApiMock.createTask).toHaveBeenCalledWith(req);
    expect(service.tasks()).toHaveLength(5);
    expect(service.tasks()[0].title).toBe("New Feature Task");
  });

  it("should update a task in the list", () => {
    service.loadTasks();

    const updateReq: TaskRequest = {
      title: "Updated Title",
      projectId: "proj-1",
      priority: "HIGH",
      status: "TODO",
      assigneeIds: ["user-1"],
    };

    service.updateTask("task-1", updateReq).subscribe(updated => {
      expect(updated.title).toBe("Updated Title");
    });

    expect(taskApiMock.updateTask).toHaveBeenCalledWith("task-1", updateReq);
    expect(service.tasks().find(t => t.id === "task-1")?.title).toBe("Updated Title");
  });

  it("should optimistically update task status and revert on error", () => {
    service.loadTasks();

    // Successful status update
    service.updateTaskStatus("task-1", "IN_PROGRESS").subscribe();
    expect(service.tasks().find(t => t.id === "task-1")?.status).toBe("IN_PROGRESS");

    // Failure rollback
    taskApiMock.updateTaskStatus.mockReturnValue(throwError(() => new Error("Network error")));
    expect(() => {
      service.updateTaskStatus("task-1", "DONE").subscribe({
        error: (err: Error) => {
          expect(err.message).toBe("Network error");
        },
      });
    }).not.toThrow();

    // Reverted back to IN_PROGRESS
    expect(service.tasks().find(t => t.id === "task-1")?.status).toBe("IN_PROGRESS");
  });

  it("should reorder tasks within the same column", () => {
    service.loadTasks();

    // Create another TODO task so we have 2 tasks in TODO
    const extraTask: TaskResponse = {
      id: "task-extra",
      title: "Another TODO task",
      projectId: "proj-1",
      status: "TODO",
      priority: "LOW",
      estimatedMinutes: 60,
      totalLoggedMinutes: 0,
      isOverBudget: false,
      assigneeIds: [],
      createdAt: "2026-01-06T00:00:00Z",
      updatedAt: "2026-01-06T00:00:00Z",
    };
    service.tasks.update(prev => [extraTask, ...prev]);

    expect(service.todoTasks().map(t => t.id)).toEqual(["task-extra", "task-1"]);

    // Move task-extra from index 0 to index 1
    service.reorderColumnTasks("TODO", 0, 1);
    expect(service.todoTasks().map(t => t.id)).toEqual(["task-1", "task-extra"]);
  });

  it("should delete a task from the list", () => {
    service.loadTasks();

    service.deleteTask("task-1").subscribe();

    expect(taskApiMock.deleteTask).toHaveBeenCalledWith("task-1");
    expect(service.tasks()).toHaveLength(3);
    expect(service.tasks().find(t => t.id === "task-1")).toBeUndefined();
  });

  it("should manage modal state and query params", () => {
    service.openCreateModal("REVIEW");
    expect(service.isCreateModalOpen()).toBe(true);
    expect(service.defaultStatusForCreate()).toBe("REVIEW");
    expect(router.navigate).toHaveBeenCalledWith([], {
      queryParams: { action: "create", taskId: null },
      queryParamsHandling: "merge",
    });

    service.openEditModal(mockTasks[0]);
    expect(service.isEditModalOpen()).toBe(true);
    expect(service.selectedTask()?.id).toBe("task-1");

    service.openDeleteModal(mockTasks[0]);
    expect(service.isDeleteModalOpen()).toBe(true);

    service.closeModals();
    expect(service.isCreateModalOpen()).toBe(false);
    expect(service.isEditModalOpen()).toBe(false);
    expect(service.isDeleteModalOpen()).toBe(false);
    expect(service.selectedTask()).toBeNull();
  });

  it("should compute user permissions based on active workspace role", () => {
    activeWorkspaceSignal.set({ role: "OWNER", tenantId: "tenant-1" });
    expect(service.canCreate()).toBe(true);
    expect(service.canEdit()).toBe(true);
    expect(service.canDelete()).toBe(true);
    expect(service.canUpdateStatus()).toBe(true);

    activeWorkspaceSignal.set({ role: "MEMBER", tenantId: "tenant-1" });
    expect(service.canCreate()).toBe(false);
    expect(service.canEdit()).toBe(false);
    expect(service.canDelete()).toBe(false);
    expect(service.canUpdateStatus()).toBe(true);

    activeWorkspaceSignal.set({ role: "CLIENT", tenantId: "tenant-1" });
    expect(service.isReadOnly()).toBe(true);
    expect(service.canUpdateStatus()).toBe(false);
  });

  it("should not open modals when unauthorized", () => {
    activeWorkspaceSignal.set({ role: "CLIENT", tenantId: "tenant-1" });

    service.openCreateModal();
    expect(service.isCreateModalOpen()).toBe(false);

    service.openEditModal(mockTasks[0]);
    expect(service.isEditModalOpen()).toBe(false);

    service.openDeleteModal(mockTasks[0]);
    expect(service.isDeleteModalOpen()).toBe(false);
  });

  it("should return EMPTY when updateTaskStatus is called without permission", () => {
    activeWorkspaceSignal.set({ role: "CLIENT", tenantId: "tenant-1" });

    let emitted = false;
    service.updateTaskStatus("task-1", "DONE").subscribe({
      next: () => (emitted = true),
    });

    expect(emitted).toBe(false);
    expect(taskApiMock.updateTaskStatus).not.toHaveBeenCalled();
  });

  it("should retrieve column tasks by status", () => {
    service.loadTasks();

    expect(service.getColumnTasksByStatus("TODO")).toHaveLength(1);
    expect(service.getColumnTasksByStatus("IN_PROGRESS")).toHaveLength(1);
    expect(service.getColumnTasksByStatus("REVIEW")).toHaveLength(1);
    expect(service.getColumnTasksByStatus("DONE")).toHaveLength(1);
  });

  it("should handle boundary conditions in reorderColumnTasks", () => {
    service.loadTasks();

    // Same index does nothing
    expect(() => service.reorderColumnTasks("TODO", 0, 0)).not.toThrow();

    // Negative or out of bound index does nothing
    expect(() => service.reorderColumnTasks("TODO", -1, 0)).not.toThrow();
    expect(() => service.reorderColumnTasks("TODO", 0, 99)).not.toThrow();
  });

  it("should filter tasks by project, priority, and search query on project name", () => {
    service.loadTasks();

    service.setProjectFilter("proj-2");
    expect(service.filteredTasks()).toHaveLength(2);
    expect(service.filteredTasks().map(t => t.id)).toEqual(["task-3", "task-4"]);

    service.setProjectFilter("ALL");
    service.setPriorityFilter("URGENT");
    expect(service.filteredTasks()).toHaveLength(1);
    expect(service.filteredTasks()[0].id).toBe("task-2");

    service.setPriorityFilter("ALL");
    service.setSearchQuery("Beta Mobile");
    expect(service.filteredTasks()).toHaveLength(2);
    expect(service.filteredTasks().map(t => t.id)).toEqual(["task-3", "task-4"]);
  });

  it("should return project name or fallback to Unknown Project", () => {
    service.loadTasks();

    expect(service.getProjectName("proj-1")).toBe("Alpha Redesign");
    expect(service.getProjectName("nonexistent-proj")).toBe("Unknown Project");
  });

  it("should create, update, and change viewMode", () => {
    service.loadTasks();

    const newTask: TaskResponse = {
      id: "task-new",
      title: "New Task Title",
      projectId: "proj-1",
      status: "TODO",
      priority: "LOW",
      estimatedMinutes: 60,
      totalLoggedMinutes: 0,
      isOverBudget: false,
      assigneeIds: [],
      createdAt: "2026-01-10T00:00:00Z",
      updatedAt: "2026-01-10T00:00:00Z",
    };
    const taskReq: TaskRequest = {
      title: "New Task Title",
      projectId: "proj-1",
      status: "TODO",
      priority: "LOW",
      assigneeIds: [],
    };
    taskApiMock.createTask.mockReturnValue(of(newTask));
    service.createTask(taskReq).subscribe();
    expect(service.tasks().find(t => t.id === "task-new")).toBeTruthy();

    const updatedTask = { ...newTask, title: "Modified Title" };
    taskApiMock.updateTask.mockReturnValue(of(updatedTask));
    service.updateTask("task-new", { ...taskReq, title: "Modified Title" }).subscribe();
    expect(service.tasks().find(t => t.id === "task-new")?.title).toBe("Modified Title");

    service.setViewMode("list");
    expect(service.viewMode()).toBe("list");
  });

  it("should extract error details on loadTasks error", () => {
    taskApiMock.getTasks.mockReturnValue(
      throwError(() => ({ error: { detail: "Access denied to tasks" } })),
    );
    service.loadTasks();
    expect(service.errorMessage()).toBe("Access denied to tasks");
  });
});
