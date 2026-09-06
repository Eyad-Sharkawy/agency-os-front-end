import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { TimeEntryDeleteModal } from "./time-entry-delete-modal";
import { TimeTrackingManagement } from "../../services/time-tracking-management";
import { TimeEntryResponse } from "../../../../core/api/models/time-entry.models";
import { TaskResponse } from "../../../../core/api/models/task.models";

describe("TimeEntryDeleteModal", () => {
  let component: TimeEntryDeleteModal;
  let fixture: ComponentFixture<TimeEntryDeleteModal>;
  let tmMock: {
    isDeleteModalOpen: ReturnType<typeof signal<boolean>>;
    selectedEntryForDelete: ReturnType<typeof signal<TimeEntryResponse | null>>;
    taskMap: ReturnType<typeof signal<Map<string, TaskResponse>>>;
    deleteEntry: ReturnType<typeof vi.fn>;
    closeDeleteModal: ReturnType<typeof vi.fn>;
  };

  const sampleEntry: TimeEntryResponse = {
    id: "te-1",
    taskId: "task-1",
    userId: "user-1",
    durationMinutes: 90,
    isBillable: true,
    createdAt: "2026-08-14T00:00:00Z",
    updatedAt: "2026-08-14T00:00:00Z",
  };

  const sampleTask: TaskResponse = {
    id: "task-1",
    title: "Implement Auth Flow",
    projectId: "p-1",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assigneeIds: ["user-1"],
    totalLoggedMinutes: 90,
    isOverBudget: false,
    createdAt: "2026-08-14T00:00:00Z",
    updatedAt: "2026-08-14T00:00:00Z",
  };

  beforeEach(async () => {
    const taskMap = new Map<string, TaskResponse>();
    taskMap.set("task-1", sampleTask);

    tmMock = {
      isDeleteModalOpen: signal(true),
      selectedEntryForDelete: signal<TimeEntryResponse | null>(sampleEntry),
      taskMap: signal<Map<string, TaskResponse>>(taskMap),
      deleteEntry: vi.fn(),
      closeDeleteModal: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TimeEntryDeleteModal],
      providers: [{ provide: TimeTrackingManagement, useValue: tmMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeEntryDeleteModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should format duration properly", () => {
    expect(component.formattedDuration()).toBe("1h 30m");

    tmMock.selectedEntryForDelete.set({ ...sampleEntry, durationMinutes: 60 });
    expect(component.formattedDuration()).toBe("1h");

    tmMock.selectedEntryForDelete.set({ ...sampleEntry, durationMinutes: 45 });
    expect(component.formattedDuration()).toBe("45m");

    tmMock.selectedEntryForDelete.set(null);
    expect(component.formattedDuration()).toBe("0m");
  });

  it("should display task title properly", () => {
    expect(component.taskTitle()).toBe("Implement Auth Flow");

    tmMock.selectedEntryForDelete.set({ ...sampleEntry, taskId: "unknown-task" });
    expect(component.taskTitle()).toBe("Unknown Task");

    tmMock.selectedEntryForDelete.set(null);
    expect(component.taskTitle()).toBe("Unknown Task");
  });

  it("should call closeDeleteModal on close", () => {
    component.onClose();
    expect(tmMock.closeDeleteModal).toHaveBeenCalled();
  });

  it("should call deleteEntry and closeDeleteModal on delete", () => {
    component.onDelete();
    expect(tmMock.deleteEntry).toHaveBeenCalledWith("te-1");
    expect(tmMock.closeDeleteModal).toHaveBeenCalled();
  });

  it("should not delete if no entry is selected", () => {
    tmMock.selectedEntryForDelete.set(null);
    component.onDelete();
    expect(tmMock.deleteEntry).not.toHaveBeenCalled();
  });
});
