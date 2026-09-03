import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskResponse } from "../../../../core/api/models/task.models";
import { TaskManagement } from "../../services/task-management";
import { TaskCard } from "./task-card";

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

    await TestBed.configureTestingModule({
      imports: [TaskCard],
      providers: [provideRouter([]), { provide: TaskManagement, useValue: tmMock }],
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
    expect(compiled.textContent).toContain("(Overdue)");
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
});
