import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskResponse } from "../../../../core/api/models/task.models";
import { TaskManagement } from "../../services/task-management";
import { TaskDeleteModal } from "./task-delete-modal";

describe("TaskDeleteModal", () => {
  let component: TaskDeleteModal;
  let fixture: ComponentFixture<TaskDeleteModal>;
  let isDeleteModalOpenSignal: WritableSignal<boolean>;
  let selectedTaskSignal: WritableSignal<TaskResponse | null>;

  let tmMock: {
    isDeleteModalOpen: WritableSignal<boolean>;
    selectedTask: WritableSignal<TaskResponse | null>;
    deleteTask: ReturnType<typeof vi.fn>;
    closeModals: ReturnType<typeof vi.fn>;
  };

  const mockTask: TaskResponse = {
    id: "task-123",
    title: "Obsolete Task",
    projectId: "proj-1",
    status: "TODO",
    priority: "LOW",
    totalLoggedMinutes: 0,
    isOverBudget: false,
    assigneeIds: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  beforeEach(async () => {
    isDeleteModalOpenSignal = signal(false);
    selectedTaskSignal = signal<TaskResponse | null>(null);

    tmMock = {
      isDeleteModalOpen: isDeleteModalOpenSignal,
      selectedTask: selectedTaskSignal,
      deleteTask: vi.fn().mockReturnValue(of(undefined)),
      closeModals: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TaskDeleteModal],
      providers: [{ provide: TaskManagement, useValue: tmMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskDeleteModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component and start closed", () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(false);
  });

  it("should display task title when open", () => {
    selectedTaskSignal.set(mockTask);
    isDeleteModalOpenSignal.set(true);
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Obsolete Task");
  });

  it("should call deleteTask and close modal on confirm", () => {
    selectedTaskSignal.set(mockTask);
    isDeleteModalOpenSignal.set(true);
    fixture.detectChanges();

    component.onDelete();

    expect(tmMock.deleteTask).toHaveBeenCalledWith("task-123");
    expect(tmMock.closeModals).toHaveBeenCalled();
  });

  it("should show error if delete fails", () => {
    selectedTaskSignal.set(mockTask);
    isDeleteModalOpenSignal.set(true);
    fixture.detectChanges();

    tmMock.deleteTask.mockReturnValue(
      throwError(() => ({ error: { detail: "Cannot delete task with active time logs" } })),
    );

    component.onDelete();

    expect(component.isDeleting()).toBe(false);
    expect(component.errorMessage()).toBe("Cannot delete task with active time logs");
  });
});
