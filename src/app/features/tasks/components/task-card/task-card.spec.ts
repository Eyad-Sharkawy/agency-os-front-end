import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskResponse } from "../../../../core/api/models/task.models";
import { TaskManagement } from "../../services/task-management";
import { TaskCard } from "./task-card";

import { signal, WritableSignal } from "@angular/core";
import { WorkspaceStore } from "../../../../core/multitenancy/workspace.store";
import { TimeTrackingManagement } from "../../../time-tracking/services/time-tracking-management";
import { ActiveTimerResponse } from "../../../../core/api/models/time-entry.models";

describe("TaskCard", () => {
  let component: TaskCard;
  let fixture: ComponentFixture<TaskCard>;
  let tmMock: {
    openEditModal: ReturnType<typeof vi.fn>;
    openDeleteModal: ReturnType<typeof vi.fn>;
    canEdit: ReturnType<typeof vi.fn>;
    canDelete: ReturnType<typeof vi.fn>;
    canUpdateStatus: ReturnType<typeof vi.fn>;
    getProjectName: ReturnType<typeof vi.fn>;
    updateTaskStatus: ReturnType<typeof vi.fn>;
  };
  let timeTrackingMock: {
    startTimer: ReturnType<typeof vi.fn>;
    pauseTimer: ReturnType<typeof vi.fn>;
    resumeTimer: ReturnType<typeof vi.fn>;
    stopTimer: ReturnType<typeof vi.fn>;
    openDiscardModal: ReturnType<typeof vi.fn>;
    openStartTimerModal: ReturnType<typeof vi.fn>;
    activeTimer: WritableSignal<ActiveTimerResponse | null>;
    isPaused: WritableSignal<boolean>;
    activeTimerFormatted: WritableSignal<string>;
    isSubmitting: WritableSignal<boolean>;
  };
  let workspaceStoreMock: {
    activeWorkspace: ReturnType<typeof signal<{ role: string } | null>>;
  };

  const mockTask: TaskResponse = {
    id: "task-123",
    title: "Implement OAuth2 Flow",
    description: "PKCE authorization with Keycloak",
    projectId: "proj-1",
    status: "IN_PROGRESS",
    priority: "HIGH",
    estimatedMinutes: 480,
    totalLoggedMinutes: 600,
    isOverBudget: true,
    dueDate: "2026-01-01T00:00:00Z", // Past date -> overdue
    assigneeIds: ["user-1", "user-2"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  beforeEach(async () => {
    tmMock = {
      openEditModal: vi.fn(),
      openDeleteModal: vi.fn(),
      canEdit: vi.fn().mockReturnValue(true),
      canDelete: vi.fn().mockReturnValue(true),
      canUpdateStatus: vi.fn().mockReturnValue(true),
      getProjectName: vi.fn().mockReturnValue("Alpha Project"),
      updateTaskStatus: vi.fn().mockReturnValue(of({ ...mockTask, status: "REVIEW" })),
    };

    timeTrackingMock = {
      startTimer: vi.fn(),
      pauseTimer: vi.fn(),
      resumeTimer: vi.fn(),
      stopTimer: vi.fn(),
      openDiscardModal: vi.fn(),
      openStartTimerModal: vi.fn(),
      activeTimer: signal(null),
      isPaused: signal(false),
      activeTimerFormatted: signal("00:00:00"),
      isSubmitting: signal(false),
    };

    workspaceStoreMock = {
      activeWorkspace: signal({ role: "MEMBER" }),
    };

    await TestBed.configureTestingModule({
      imports: [TaskCard],
      providers: [
        provideRouter([]),
        { provide: TaskManagement, useValue: tmMock },
        { provide: TimeTrackingManagement, useValue: timeTrackingMock },
        { provide: WorkspaceStore, useValue: workspaceStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("task", mockTask);
    fixture.detectChanges();
  });

  it("should create component and render task info", () => {
    expect(component).toBeTruthy();
    expect(component.task()).toEqual(mockTask);
    expect(component.projectName()).toBe("Alpha Project");
    expect(component.isOverdue()).toBe(true);
    expect(component.loggedHours()).toBe(10);
    expect(component.estimatedHours()).toBe(8);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Implement OAuth2 Flow");
    expect(compiled.textContent).toContain("PKCE authorization with Keycloak");
    expect(compiled.textContent).toContain("Alpha Project");
    expect(compiled.textContent).toContain("HIGH");
    expect(compiled.textContent).toContain("Over Budget");
    expect(compiled.textContent).toContain("overdue");
  });

  it("should calculate correct previous and next status transitions", () => {
    expect(component.previousStatus()).toBe("TODO");
    expect(component.nextStatus()).toBe("REVIEW");

    fixture.componentRef.setInput("task", { ...mockTask, status: "TODO" });
    expect(component.previousStatus()).toBeNull();
    expect(component.nextStatus()).toBe("IN_PROGRESS");

    fixture.componentRef.setInput("task", { ...mockTask, status: "REVIEW" });
    expect(component.previousStatus()).toBe("IN_PROGRESS");
    expect(component.nextStatus()).toBe("DONE");

    fixture.componentRef.setInput("task", { ...mockTask, status: "DONE" });
    expect(component.previousStatus()).toBe("REVIEW");
    expect(component.nextStatus()).toBeNull();
  });

  it("should calculate isOverdue correctly for future, done, and missing due dates", () => {
    // Missing due date
    fixture.componentRef.setInput("task", { ...mockTask, dueDate: undefined });
    expect(component.isOverdue()).toBe(false);

    // Done status ignores overdue
    fixture.componentRef.setInput("task", {
      ...mockTask,
      status: "DONE",
      dueDate: "2020-01-01T00:00:00Z",
    });
    expect(component.isOverdue()).toBe(false);

    // Future due date
    fixture.componentRef.setInput("task", {
      ...mockTask,
      status: "TODO",
      dueDate: "2099-01-01T00:00:00Z",
    });
    expect(component.isOverdue()).toBe(false);
  });

  it("should handle null estimated hours when estimatedMinutes is missing", () => {
    fixture.componentRef.setInput("task", { ...mockTask, estimatedMinutes: undefined });
    expect(component.estimatedHours()).toBeNull();
  });

  it("should return correct priority classes and dot classes", () => {
    expect(component.getPriorityClass("URGENT")).toContain("error");
    expect(component.getPriorityDotClass("URGENT")).toContain("error");

    expect(component.getPriorityClass("HIGH")).toContain("orange");
    expect(component.getPriorityDotClass("HIGH")).toContain("orange");

    expect(component.getPriorityClass("MEDIUM")).toContain("blue");
    expect(component.getPriorityDotClass("MEDIUM")).toContain("blue");

    expect(component.getPriorityClass("LOW")).toContain("soft-stone");
    expect(component.getPriorityDotClass("LOW")).toContain("muted");
  });

  it("should trigger status transition when onMoveStatus is called", () => {
    component.onMoveStatus("REVIEW");
    expect(tmMock.updateTaskStatus).toHaveBeenCalledWith("task-123", "REVIEW");
  });

  it("should not trigger status transition if canUpdateStatus is false", () => {
    tmMock.canUpdateStatus.mockReturnValue(false);
    component.onMoveStatus("REVIEW");
    expect(tmMock.updateTaskStatus).not.toHaveBeenCalled();
  });

  it("should gracefully handle error onMoveStatus", () => {
    tmMock.updateTaskStatus.mockReturnValue(throwError(() => new Error("Update failed")));
    expect(() => component.onMoveStatus("REVIEW")).not.toThrow();
  });

  it("should open edit modal when onEdit is called", () => {
    component.onEdit();
    expect(tmMock.openEditModal).toHaveBeenCalledWith(mockTask);
  });

  it("should open delete modal when onDelete is called", () => {
    component.onDelete();
    expect(tmMock.openDeleteModal).toHaveBeenCalledWith(mockTask);
  });

  it("should calculate timeProgress, isNearBudget, and isOverBudget correctly", () => {
    // 600 / 480 = 125% -> Over budget
    expect(component.timeProgress()).toBe(125);
    expect(component.isOverBudget()).toBe(true);
    expect(component.isNearBudget()).toBe(false);
    expect(component.progressPercentageCapped()).toBe(100);

    // Near limit (85%)
    fixture.componentRef.setInput("task", {
      ...mockTask,
      estimatedMinutes: 100,
      totalLoggedMinutes: 85,
      isOverBudget: false,
    });
    expect(component.timeProgress()).toBe(85);
    expect(component.isNearBudget()).toBe(true);
    expect(component.isOverBudget()).toBe(false);
    expect(component.progressPercentageCapped()).toBe(85);

    // Normal on-track (50%)
    fixture.componentRef.setInput("task", {
      ...mockTask,
      estimatedMinutes: 100,
      totalLoggedMinutes: 50,
      isOverBudget: false,
    });
    expect(component.timeProgress()).toBe(50);
    expect(component.isNearBudget()).toBe(false);
    expect(component.isOverBudget()).toBe(false);

    // No estimated minutes
    fixture.componentRef.setInput("task", {
      ...mockTask,
      estimatedMinutes: 0,
      totalLoggedMinutes: 50,
    });
    expect(component.timeProgress()).toBeNull();
    expect(component.progressPercentageCapped()).toBe(0);
  });

  it("should delegate to timeTrackingManagement when onStartTracking is clicked", () => {
    const fakeEvent = { stopPropagation: vi.fn() } as unknown as Event;
    component.onStartTracking(fakeEvent);
    expect(fakeEvent.stopPropagation).toHaveBeenCalled();
    expect(timeTrackingMock.startTimer).toHaveBeenCalledWith("task-123");
  });

  it("should handle pause, resume, stop and save, and discard tracking", () => {
    const fakeEvent = { stopPropagation: vi.fn() } as unknown as Event;

    component.onPauseTracking(fakeEvent);
    expect(timeTrackingMock.pauseTimer).toHaveBeenCalled();

    component.onResumeTracking(fakeEvent);
    expect(timeTrackingMock.resumeTimer).toHaveBeenCalled();

    component.onStopAndSaveTracking(fakeEvent);
    expect(timeTrackingMock.stopTimer).toHaveBeenCalledWith(true);

    component.onDiscardTracking(fakeEvent);
    expect(timeTrackingMock.openDiscardModal).toHaveBeenCalled();
  });

  it("should detect when this task is being tracked", () => {
    expect(component.isTrackingThisTask()).toBe(false);

    timeTrackingMock.activeTimer.set({
      userId: "u-1",
      taskId: "task-123",
      startTime: "2026-08-14T00:00:00Z",
    });
    expect(component.isTrackingThisTask()).toBe(true);

    timeTrackingMock.isPaused.set(true);
    expect(component.isTimerPaused()).toBe(true);
  });

  it("should disable canTrackTime for CLIENT role", () => {
    expect(component.canTrackTime()).toBe(true);
    workspaceStoreMock.activeWorkspace.set({ role: "CLIENT" });
    expect(component.canTrackTime()).toBe(false);
  });
});
