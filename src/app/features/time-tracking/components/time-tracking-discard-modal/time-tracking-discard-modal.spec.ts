import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { TimeTrackingDiscardModal } from "./time-tracking-discard-modal";
import { TimeTrackingManagement } from "../../services/time-tracking-management";
import { TaskResponse } from "../../../../core/api/models/task.models";

describe("TimeTrackingDiscardModal", () => {
  let component: TimeTrackingDiscardModal;
  let fixture: ComponentFixture<TimeTrackingDiscardModal>;
  let tmMock: {
    isDiscardModalOpen: ReturnType<typeof signal<boolean>>;
    activeTask: ReturnType<typeof signal<TaskResponse | null>>;
    activeTimerFormatted: ReturnType<typeof signal<string>>;
    closeDiscardModal: ReturnType<typeof vi.fn>;
    confirmDiscardTimer: ReturnType<typeof vi.fn>;
  };

  const sampleTask: TaskResponse = {
    id: "task-1",
    title: "Sprint Planning",
    projectId: "p-1",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    assigneeIds: ["user-1"],
    totalLoggedMinutes: 30,
    isOverBudget: false,
    createdAt: "2026-08-14T00:00:00Z",
    updatedAt: "2026-08-14T00:00:00Z",
  };

  beforeEach(async () => {
    tmMock = {
      isDiscardModalOpen: signal(true),
      activeTask: signal<TaskResponse | null>(sampleTask),
      activeTimerFormatted: signal<string>("00:15:30"),
      closeDiscardModal: vi.fn(),
      confirmDiscardTimer: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TimeTrackingDiscardModal],
      providers: [{ provide: TimeTrackingManagement, useValue: tmMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeTrackingDiscardModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display active task and elapsed formatted", () => {
    expect(component.activeTask()?.title).toBe("Sprint Planning");
    expect(component.elapsedFormatted()).toBe("00:15:30");
  });

  it("should call closeDiscardModal on close", () => {
    component.onClose();
    expect(tmMock.closeDiscardModal).toHaveBeenCalled();
  });

  it("should call confirmDiscardTimer on discard", () => {
    component.onDiscard();
    expect(tmMock.confirmDiscardTimer).toHaveBeenCalled();
  });
});
