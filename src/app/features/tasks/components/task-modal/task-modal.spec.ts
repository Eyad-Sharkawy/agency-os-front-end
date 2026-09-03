import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectResponse } from "../../../../core/api/models/project.models";
import { TaskResponse, TaskStatus } from "../../../../core/api/models/task.models";
import { TaskManagement } from "../../services/task-management";
import { TaskModal } from "./task-modal";

describe("TaskModal", () => {
  let component: TaskModal;
  let fixture: ComponentFixture<TaskModal>;
  let isCreateModalOpenSignal: WritableSignal<boolean>;
  let isEditModalOpenSignal: WritableSignal<boolean>;
  let selectedTaskSignal: WritableSignal<TaskResponse | null>;
  let defaultStatusSignal: WritableSignal<TaskStatus>;
  let projectsSignal: WritableSignal<ProjectResponse[]>;
  let projectFilterSignal: WritableSignal<string>;

  let tmMock: {
    isCreateModalOpen: WritableSignal<boolean>;
    isEditModalOpen: WritableSignal<boolean>;
    selectedTask: WritableSignal<TaskResponse | null>;
    defaultStatusForCreate: WritableSignal<TaskStatus>;
    projects: WritableSignal<ProjectResponse[]>;
    projectFilter: WritableSignal<string>;
    createTask: ReturnType<typeof vi.fn>;
    updateTask: ReturnType<typeof vi.fn>;
    closeModals: ReturnType<typeof vi.fn>;
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

  const mockTask: TaskResponse = {
    id: "task-1",
    title: "Wireframe Homepage",
    description: "Desktop & mobile layouts",
    projectId: "proj-1",
    status: "TODO",
    priority: "HIGH",
    estimatedMinutes: 480,
    totalLoggedMinutes: 0,
    isOverBudget: false,
    startDate: "2026-02-01T00:00:00.000Z",
    dueDate: "2026-02-15T00:00:00.000Z",
    assigneeIds: ["user-1", "user-2"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  beforeEach(async () => {
    isCreateModalOpenSignal = signal(false);
    isEditModalOpenSignal = signal(false);
    selectedTaskSignal = signal<TaskResponse | null>(null);
    defaultStatusSignal = signal<TaskStatus>("TODO");
    projectsSignal = signal<ProjectResponse[]>(mockProjects);
    projectFilterSignal = signal<string>("ALL");

    tmMock = {
      isCreateModalOpen: isCreateModalOpenSignal,
      isEditModalOpen: isEditModalOpenSignal,
      selectedTask: selectedTaskSignal,
      defaultStatusForCreate: defaultStatusSignal,
      projects: projectsSignal,
      projectFilter: projectFilterSignal,
      createTask: vi.fn().mockReturnValue(of({ ...mockTask, id: "task-created" })),
      updateTask: vi.fn().mockReturnValue(of(mockTask)),
      closeModals: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TaskModal],
      providers: [{ provide: TaskManagement, useValue: tmMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component and start closed", () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(false);
    expect(component.isEditMode()).toBe(false);
  });

  it("should initialize form for create mode", () => {
    isCreateModalOpenSignal.set(true);
    defaultStatusSignal.set("IN_PROGRESS");
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    expect(component.isEditMode()).toBe(false);
    expect(component.title()).toBe("");
    expect(component.projectId()).toBe("proj-1");
    expect(component.status()).toBe("IN_PROGRESS");
  });

  it("should prefill form when opened in edit mode", () => {
    selectedTaskSignal.set(mockTask);
    isEditModalOpenSignal.set(true);
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    expect(component.isEditMode()).toBe(true);
    expect(component.title()).toBe("Wireframe Homepage");
    expect(component.description()).toBe("Desktop & mobile layouts");
    expect(component.projectId()).toBe("proj-1");
    expect(component.status()).toBe("TODO");
    expect(component.priority()).toBe("HIGH");
    expect(component.estimatedHours()).toBe(8);
    expect(component.assigneesText()).toBe("user-1, user-2");
  });

  it("should validate form fields", () => {
    component.title.set("");
    component.projectId.set("");
    expect(component.isFormValid()).toBe(false);

    component.title.set("Valid Title");
    component.projectId.set("proj-1");
    expect(component.isFormValid()).toBe(true);
  });

  it("should submit create task request", () => {
    isCreateModalOpenSignal.set(true);
    fixture.detectChanges();

    component.title.set("Build Header");
    component.projectId.set("proj-1");
    component.status.set("TODO");
    component.priority.set("MEDIUM");
    component.estimatedHours.set(4);
    component.assigneesText.set("user-1, user-3");

    component.onSubmit();

    expect(tmMock.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Build Header",
        projectId: "proj-1",
        status: "TODO",
        priority: "MEDIUM",
        estimatedMinutes: 240,
        assigneeIds: ["user-1", "user-3"],
      }),
    );
    expect(tmMock.closeModals).toHaveBeenCalled();
  });

  it("should submit update task request in edit mode", () => {
    selectedTaskSignal.set(mockTask);
    isEditModalOpenSignal.set(true);
    fixture.detectChanges();

    component.title.set("Updated Wireframe Title");
    component.onSubmit();

    expect(tmMock.updateTask).toHaveBeenCalledWith(
      "task-1",
      expect.objectContaining({
        title: "Updated Wireframe Title",
        projectId: "proj-1",
      }),
    );
    expect(tmMock.closeModals).toHaveBeenCalled();
  });

  it("should display error message if API fails", () => {
    isCreateModalOpenSignal.set(true);
    fixture.detectChanges();

    tmMock.createTask.mockReturnValue(
      throwError(() => ({ error: { detail: "Project has reached maximum task limit" } })),
    );

    component.title.set("Test Limit");
    component.projectId.set("proj-1");
    component.onSubmit();

    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBe("Project has reached maximum task limit");
  });
});
