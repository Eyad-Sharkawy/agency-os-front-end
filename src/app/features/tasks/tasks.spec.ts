import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectResponse } from "../../core/api/models/project.models";
import { TaskResponse, TaskStatus } from "../../core/api/models/task.models";
import {
  TaskFilterPriority,
  TaskFilterStatus,
  TaskManagement,
  TaskStats,
  TaskViewMode,
} from "./services/task-management";
import { TasksComponent } from "./tasks";

describe("TasksComponent", () => {
  let component: TasksComponent;
  let fixture: ComponentFixture<TasksComponent>;

  let tmMock: {
    tasks: WritableSignal<TaskResponse[]>;
    projects: WritableSignal<ProjectResponse[]>;
    filteredTasks: WritableSignal<TaskResponse[]>;
    todoTasks: WritableSignal<TaskResponse[]>;
    inProgressTasks: WritableSignal<TaskResponse[]>;
    reviewTasks: WritableSignal<TaskResponse[]>;
    doneTasks: WritableSignal<TaskResponse[]>;
    isLoading: WritableSignal<boolean>;
    errorMessage: WritableSignal<string | null>;
    searchQuery: WritableSignal<string>;
    statusFilter: WritableSignal<TaskFilterStatus>;
    priorityFilter: WritableSignal<TaskFilterPriority>;
    projectFilter: WritableSignal<string>;
    viewMode: WritableSignal<TaskViewMode>;
    canCreate: WritableSignal<boolean>;
    canEdit: WritableSignal<boolean>;
    canDelete: WritableSignal<boolean>;
    canUpdateStatus: WritableSignal<boolean>;
    isCreateModalOpen: WritableSignal<boolean>;
    isEditModalOpen: WritableSignal<boolean>;
    isDeleteModalOpen: WritableSignal<boolean>;
    selectedTask: WritableSignal<TaskResponse | null>;
    defaultStatusForCreate: WritableSignal<TaskStatus>;
    stats: WritableSignal<TaskStats>;
    loadTasks: ReturnType<typeof vi.fn>;
    openCreateModal: ReturnType<typeof vi.fn>;
    openEditModal: ReturnType<typeof vi.fn>;
    openDeleteModal: ReturnType<typeof vi.fn>;
    closeModals: ReturnType<typeof vi.fn>;
    setSearchQuery: ReturnType<typeof vi.fn>;
    setStatusFilter: ReturnType<typeof vi.fn>;
    setPriorityFilter: ReturnType<typeof vi.fn>;
    setProjectFilter: ReturnType<typeof vi.fn>;
    setViewMode: ReturnType<typeof vi.fn>;
    updateTaskStatus: ReturnType<typeof vi.fn>;
    reorderColumnTasks: ReturnType<typeof vi.fn>;
    getProjectName: ReturnType<typeof vi.fn>;
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
  ];

  const mockTasks: TaskResponse[] = [
    {
      id: "task-1",
      title: "Design System Specs",
      description: "Define color tokens and typography scale",
      projectId: "proj-1",
      status: "TODO",
      priority: "HIGH",
      estimatedMinutes: 240,
      totalLoggedMinutes: 60,
      isOverBudget: false,
      assigneeIds: ["user-1"],
      createdAt: "2026-01-05T00:00:00Z",
      updatedAt: "2026-01-05T00:00:00Z",
    },
    {
      id: "task-2",
      title: "Build Kanban Board",
      description: "Angular CDK drag and drop integration",
      projectId: "proj-1",
      status: "IN_PROGRESS",
      priority: "URGENT",
      estimatedMinutes: 180,
      totalLoggedMinutes: 240,
      isOverBudget: true,
      assigneeIds: ["user-1", "user-2"],
      createdAt: "2026-01-06T00:00:00Z",
      updatedAt: "2026-01-06T00:00:00Z",
    },
  ];

  beforeEach(async () => {
    tmMock = {
      tasks: signal<TaskResponse[]>(mockTasks),
      projects: signal<ProjectResponse[]>(mockProjects),
      filteredTasks: signal<TaskResponse[]>(mockTasks),
      todoTasks: signal<TaskResponse[]>([mockTasks[0]]),
      inProgressTasks: signal<TaskResponse[]>([mockTasks[1]]),
      reviewTasks: signal<TaskResponse[]>([]),
      doneTasks: signal<TaskResponse[]>([]),
      isLoading: signal(false),
      errorMessage: signal(null),
      searchQuery: signal(""),
      statusFilter: signal("ALL"),
      priorityFilter: signal("ALL"),
      projectFilter: signal("ALL"),
      viewMode: signal("kanban"),
      canCreate: signal(true),
      canEdit: signal(true),
      canDelete: signal(true),
      canUpdateStatus: signal(true),
      isCreateModalOpen: signal(false),
      isEditModalOpen: signal(false),
      isDeleteModalOpen: signal(false),
      selectedTask: signal(null),
      defaultStatusForCreate: signal("TODO"),
      stats: signal({
        total: 2,
        todo: 1,
        inProgress: 1,
        review: 0,
        done: 0,
        overBudget: 1,
      }),
      loadTasks: vi.fn(),
      openCreateModal: vi.fn(),
      openEditModal: vi.fn(),
      openDeleteModal: vi.fn(),
      closeModals: vi.fn(),
      setSearchQuery: vi.fn(),
      setStatusFilter: vi.fn(),
      setPriorityFilter: vi.fn(),
      setProjectFilter: vi.fn(),
      setViewMode: vi.fn(),
      updateTaskStatus: vi.fn().mockReturnValue(of(mockTasks[0])),
      reorderColumnTasks: vi.fn(),
      getProjectName: vi.fn().mockReturnValue("Alpha Redesign"),
    };

    await TestBed.configureTestingModule({
      imports: [TasksComponent],
      providers: [provideRouter([]), { provide: TaskManagement, useValue: tmMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(TasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create tasks component and load tasks on init", () => {
    expect(component).toBeTruthy();
    expect(tmMock.loadTasks).toHaveBeenCalled();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Tasks");
    expect(compiled.textContent).toContain("Create Task");
    expect(compiled.textContent).toContain("Design System Specs");
    expect(compiled.textContent).toContain("Build Kanban Board");
  });

  it("should render sprint stats in ribbon", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Total");
    expect(compiled.textContent).toContain("To Do");
    expect(compiled.textContent).toContain("In Progress");
    expect(compiled.textContent).toContain("Review");
    expect(compiled.textContent).toContain("Done");
    expect(compiled.textContent).toContain("Over Budget");
  });

  it("should handle search and filter changes", () => {
    component.onSearch("Design");
    expect(tmMock.setSearchQuery).toHaveBeenCalledWith("Design");

    component.onProjectFilter("proj-1");
    expect(tmMock.setProjectFilter).toHaveBeenCalledWith("proj-1");

    component.onPriorityFilter("URGENT");
    expect(tmMock.setPriorityFilter).toHaveBeenCalledWith("URGENT");

    component.onStatusFilter("TODO");
    expect(tmMock.setStatusFilter).toHaveBeenCalledWith("TODO");

    component.onViewMode("list");
    expect(tmMock.setViewMode).toHaveBeenCalledWith("list");
  });

  it("should render list table when viewMode is list", () => {
    tmMock.viewMode.set("list");
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("table")).toBeTruthy();
    expect(compiled.textContent).toContain("Task");
    expect(compiled.textContent).toContain("Project");
    expect(compiled.textContent).toContain("Status");
    expect(compiled.textContent).toContain("Hours");
  });

  it("should track drag state with onDragStarted and onDragEnded", () => {
    expect(component.isDragging()).toBe(false);
    expect(component.draggingTask()).toBeNull();

    component.onDragStarted(mockTasks[0]);
    expect(component.isDragging()).toBe(true);
    expect(component.draggingTask()).toEqual(mockTasks[0]);

    component.onDragEnded();
    expect(component.isDragging()).toBe(false);
    expect(component.draggingTask()).toBeNull();
  });

  it("should handle onDrop for CDK drag and drop in same column vs cross column", () => {
    const crossColumnEvent = {
      item: { data: mockTasks[0] }, // status is TODO
      previousContainer: { id: "TODO" },
      container: { id: "IN_PROGRESS" },
      previousIndex: 0,
      currentIndex: 1,
    } as unknown as import("@angular/cdk/drag-drop").CdkDragDrop<TaskResponse[]>;

    component.onDrop(crossColumnEvent);
    expect(tmMock.updateTaskStatus).toHaveBeenCalledWith("task-1", "IN_PROGRESS", 1);

    // Dropping onto the same column should reorder
    const sameDropContainer = { id: "TODO" };
    const sameColumnEvent = {
      item: { data: mockTasks[0] },
      previousContainer: sameDropContainer,
      container: sameDropContainer,
      previousIndex: 0,
      currentIndex: 2,
    } as unknown as import("@angular/cdk/drag-drop").CdkDragDrop<TaskResponse[]>;
    component.onDrop(sameColumnEvent);
    expect(tmMock.reorderColumnTasks).toHaveBeenCalledWith("TODO", 0, 2);
  });

  it("should display empty state when no tasks match", () => {
    tmMock.filteredTasks.set([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("No tasks found");
  });

  it("should display loading skeleton when isLoading is true", () => {
    tmMock.isLoading.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("should correctly compute status and priority styling", () => {
    expect(component.getStatusLabel("TODO")).toBe("To Do");
    expect(component.getStatusLabel("IN_PROGRESS")).toBe("In Progress");
    expect(component.getStatusLabel("REVIEW")).toBe("Review");
    expect(component.getStatusLabel("DONE")).toBe("Done");

    expect(component.getPriorityClass("URGENT")).toContain("text-error");
    expect(component.getPriorityClass("HIGH")).toContain("orange");
    expect(component.getPriorityClass("MEDIUM")).toContain("blue");
    expect(component.getPriorityClass("LOW")).toContain("soft-stone");
  });

  it("should return correct status classes and status dot classes", () => {
    expect(component.getStatusClass("TODO")).toContain("soft-stone");
    expect(component.getStatusDotClass("TODO")).toContain("muted");

    expect(component.getStatusClass("IN_PROGRESS")).toContain("brand-green");
    expect(component.getStatusDotClass("IN_PROGRESS")).toContain("brand-green");

    expect(component.getStatusClass("REVIEW")).toContain("amber");
    expect(component.getStatusDotClass("REVIEW")).toContain("amber");

    expect(component.getStatusClass("DONE")).toContain("deep-green");
    expect(component.getStatusDotClass("DONE")).toContain("deep-green");
  });

  it("should calculate isOverdue, loggedHours, and estimatedHours correctly", () => {
    const overdueTask: TaskResponse = {
      ...mockTasks[0],
      dueDate: "2020-01-01T00:00:00Z",
      status: "TODO",
      totalLoggedMinutes: 150, // 2.5h
      estimatedMinutes: 300, // 5h
    };
    expect(component.isOverdue(overdueTask)).toBe(true);
    expect(component.getLoggedHours(overdueTask)).toBe(2.5);
    expect(component.getEstimatedHours(overdueTask)).toBe(5);

    // Done task is not overdue even if date is in the past
    expect(component.isOverdue({ ...overdueTask, status: "DONE" })).toBe(false);

    // Missing due date and estimated minutes
    const plainTask: TaskResponse = {
      ...mockTasks[0],
      dueDate: undefined,
      estimatedMinutes: undefined,
      totalLoggedMinutes: 0,
    };
    expect(component.isOverdue(plainTask)).toBe(false);
    expect(component.getEstimatedHours(plainTask)).toBeNull();
  });

  it("should ignore drag started and drop when user cannot update status", () => {
    tmMock.canUpdateStatus.set(false);

    component.onDragStarted(mockTasks[0]);
    expect(component.isDragging()).toBe(false);

    const dropEvent = {
      item: { data: mockTasks[0] },
      previousContainer: { id: "TODO" },
      container: { id: "IN_PROGRESS" },
      previousIndex: 0,
      currentIndex: 1,
    } as unknown as import("@angular/cdk/drag-drop").CdkDragDrop<TaskResponse[]>;

    component.onDrop(dropEvent);
    expect(tmMock.updateTaskStatus).not.toHaveBeenCalled();
  });

  it("should not reorder when dropped at same index in same column", () => {
    const sameDropContainer = { id: "TODO" };
    const sameIndexEvent = {
      item: { data: mockTasks[0] },
      previousContainer: sameDropContainer,
      container: sameDropContainer,
      previousIndex: 2,
      currentIndex: 2,
    } as unknown as import("@angular/cdk/drag-drop").CdkDragDrop<TaskResponse[]>;

    component.onDrop(sameIndexEvent);
    expect(tmMock.reorderColumnTasks).not.toHaveBeenCalled();
  });

  it("should handle error when cross-column drop fails", () => {
    tmMock.updateTaskStatus.mockReturnValue(
      throwError(() => ({ error: { detail: "Database connection failed" } })),
    );

    const crossColumnEvent = {
      item: { data: mockTasks[0] },
      previousContainer: { id: "TODO" },
      container: { id: "IN_PROGRESS" },
      previousIndex: 0,
      currentIndex: 1,
    } as unknown as import("@angular/cdk/drag-drop").CdkDragDrop<TaskResponse[]>;

    component.onDrop(crossColumnEvent);
    expect(tmMock.errorMessage()).toBe("Database connection failed");
  });
});
