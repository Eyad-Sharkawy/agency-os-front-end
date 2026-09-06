import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TimeEntryModal } from "./time-entry-modal";
import { TimeTrackingManagement } from "../../services/time-tracking-management";
import { TaskResponse } from "../../../../core/api/models/task.models";
import { ProjectResponse } from "../../../../core/api/models/project.models";

describe("TimeEntryModal", () => {
  let component: TimeEntryModal;
  let fixture: ComponentFixture<TimeEntryModal>;

  let tmMock: {
    isManualModalOpen: ReturnType<typeof signal<boolean>>;
    isSubmitting: ReturnType<typeof signal<boolean>>;
    modalMode: ReturnType<typeof signal<"timer" | "manual">>;
    preselectedTaskId: ReturnType<typeof signal<string | null>>;
    projects: ReturnType<typeof signal<ProjectResponse[]>>;
    tasks: ReturnType<typeof signal<TaskResponse[]>>;
    logManualEntry: ReturnType<typeof vi.fn>;
    startTimer: ReturnType<typeof vi.fn>;
    closeManualModal: ReturnType<typeof vi.fn>;
    setModalMode: ReturnType<typeof vi.fn>;
  };

  const sampleProject1: ProjectResponse = {
    id: "p-1",
    name: "Alpha Project",
    billingRate: 120,
    status: "IN_PROGRESS",
    clientId: "c-1",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  const sampleProject2: ProjectResponse = {
    id: "p-2",
    name: "Beta Project",
    billingRate: 200,
    status: "PLANNING",
    clientId: "c-2",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  const sampleTask1: TaskResponse = {
    id: "t-1",
    title: "Task One",
    projectId: "p-1",
    priority: "HIGH",
    status: "TODO",
    assigneeIds: [],
    totalLoggedMinutes: 0,
    isOverBudget: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  const sampleTask2: TaskResponse = {
    id: "t-2",
    title: "Task Two",
    projectId: "p-2",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    assigneeIds: [],
    totalLoggedMinutes: 0,
    isOverBudget: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  beforeEach(async () => {
    tmMock = {
      isManualModalOpen: signal(true),
      isSubmitting: signal(false),
      modalMode: signal<"timer" | "manual">("manual"),
      preselectedTaskId: signal<string | null>(null),
      projects: signal([sampleProject1, sampleProject2]),
      tasks: signal([sampleTask1, sampleTask2]),
      logManualEntry: vi.fn(),
      startTimer: vi.fn(),
      closeManualModal: vi.fn(),
      setModalMode: vi.fn((mode: "timer" | "manual") => tmMock.modalMode.set(mode)),
    };

    await TestBed.configureTestingModule({
      imports: [TimeEntryModal],
      providers: [{ provide: TimeTrackingManagement, useValue: tmMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeEntryModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create modal component and render header", () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Log Time Entry");
    expect(compiled.textContent).toContain("Record billable or non-billable hours");
  });

  it("should populate project and task options", () => {
    expect(component.projectOptions()).toHaveLength(2);
    expect(component.projectOptions()[0].label).toBe("Alpha Project");

    // Task options filtered by selected project
    component.selectedProjectId.set("p-1");
    expect(component.taskOptions()).toHaveLength(1);
    expect(component.taskOptions()[0].label).toBe("Task One");
  });

  it("should handle project change and reset task if not belonging to project", () => {
    component.selectedProjectId.set("p-1");
    component.selectedTaskId.set("t-1");

    component.onProjectChange("p-2");
    expect(component.selectedProjectId()).toBe("p-2");
    expect(component.selectedTaskId()).toBe("");
  });

  it("should handle task change and sync project", () => {
    component.onTaskChange("t-2");
    expect(component.selectedTaskId()).toBe("t-2");
    expect(component.selectedProjectId()).toBe("p-2");
  });

  it("should validate that a task is selected before submitting", () => {
    component.selectedTaskId.set("");
    component.onSubmit();
    expect(component.errorMessage()).toContain("Please select a task");
    expect(tmMock.logManualEntry).not.toHaveBeenCalled();
  });

  it("should validate that duration is greater than 0", () => {
    component.selectedTaskId.set("t-1");
    component.hours.set(0);
    component.minutes.set(0);

    component.onSubmit();
    expect(component.errorMessage()).toContain("Duration must be greater than 0");
    expect(tmMock.logManualEntry).not.toHaveBeenCalled();
  });

  it("should submit manual time entry when valid", () => {
    component.selectedTaskId.set("t-1");
    component.hours.set(2);
    component.minutes.set(30);
    component.isBillable.set(true);

    component.onSubmit();
    expect(tmMock.logManualEntry).toHaveBeenCalledWith({
      taskId: "t-1",
      durationMinutes: 150,
      isBillable: true,
    });
  });

  it("should call closeManualModal on close", () => {
    component.onClose();
    expect(tmMock.closeManualModal).toHaveBeenCalled();
  });

  it("should render error message in template when set", () => {
    component.errorMessage.set("Custom validation failure");
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Custom validation failure");
  });

  it("should switch to timer mode, display timer header and start timer on submit", () => {
    component.setTab("timer");
    expect(tmMock.setModalMode).toHaveBeenCalledWith("timer");
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Start Live Stopwatch");
    expect(compiled.textContent).toContain("Select a project and task to start tracking");

    component.selectedTaskId.set("t-1");
    component.onSubmit();
    expect(tmMock.startTimer).toHaveBeenCalledWith("t-1");
  });

  it("should display selected task details card when task is selected", () => {
    component.selectedTaskId.set("t-1");
    component.selectedProjectId.set("p-1");
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Selected: Task One");
    expect(compiled.textContent).toContain("Priority: HIGH");
    expect(compiled.textContent).toContain("Alpha Project");
  });

  it("should load preselected task from time tracking management", () => {
    tmMock.preselectedTaskId.set("t-2");
    component.resetForm();

    expect(component.selectedTaskId()).toBe("t-2");
    expect(component.selectedProjectId()).toBe("p-2");
  });
});
