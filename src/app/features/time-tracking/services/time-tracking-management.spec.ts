import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { TimeTrackingManagement } from "./time-tracking-management";
import { TimeEntryApi } from "../../../core/api/services/time-entry/time-entry-api";
import { TaskApi } from "../../../core/api/services/task/task-api";
import { ProjectApi } from "../../../core/api/services/project/project-api";
import { WorkspaceStore } from "../../../core/multitenancy/workspace.store";
import { ActiveTimerResponse, TimeEntryResponse } from "../../../core/api/models/time-entry.models";
import { TaskResponse } from "../../../core/api/models/task.models";
import { ProjectResponse } from "../../../core/api/models/project.models";
import { provideRouter, Router } from "@angular/router";
import { WorkspaceApi } from "../../../core/api/services/workspace/workspace-api";

describe("TimeTrackingManagement", () => {
  let service: TimeTrackingManagement;
  let mockWorkspaceApi: {
    getMembers: ReturnType<typeof vi.fn>;
  };
  let mockTimeEntryApi: {
    getTimeEntries: ReturnType<typeof vi.fn>;
    getActiveTimer: ReturnType<typeof vi.fn>;
    startTimer: ReturnType<typeof vi.fn>;
    stopTimer: ReturnType<typeof vi.fn>;
    logTime: ReturnType<typeof vi.fn>;
    deleteTimeEntry: ReturnType<typeof vi.fn>;
    pauseTimer: ReturnType<typeof vi.fn>;
    resumeTimer: ReturnType<typeof vi.fn>;
  };
  let mockTaskApi: {
    getTasks: ReturnType<typeof vi.fn>;
  };
  let mockProjectApi: {
    getProjects: ReturnType<typeof vi.fn>;
  };
  let mockWorkspaceStore: {
    activeTenantId: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  const sampleEntry: TimeEntryResponse = {
    id: "te-1",
    taskId: "t-1",
    userId: "u-1",
    durationMinutes: 90,
    isBillable: true,
    createdAt: "2026-08-14T07:00:00Z",
    updatedAt: "2026-08-14T07:00:00Z",
  };

  const sampleNonBillableEntry: TimeEntryResponse = {
    id: "te-2",
    taskId: "t-2",
    userId: "u-1",
    durationMinutes: 30,
    isBillable: false,
    createdAt: "2026-08-14T08:00:00Z",
    updatedAt: "2026-08-14T08:00:00Z",
  };

  const sampleTask: TaskResponse = {
    id: "t-1",
    title: "Implement Auth Flow",
    projectId: "p-1",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assigneeIds: ["u-1"],
    totalLoggedMinutes: 90,
    isOverBudget: false,
    createdAt: "2026-08-14T00:00:00Z",
    updatedAt: "2026-08-14T00:00:00Z",
  };

  const sampleTask2: TaskResponse = {
    id: "t-2",
    title: "Code Review",
    projectId: "p-2",
    priority: "LOW",
    status: "TODO",
    assigneeIds: ["u-1"],
    totalLoggedMinutes: 30,
    isOverBudget: false,
    createdAt: "2026-08-14T00:00:00Z",
    updatedAt: "2026-08-14T00:00:00Z",
  };

  const sampleProject: ProjectResponse = {
    id: "p-1",
    name: "Acme Redesign",
    billingRate: 150,
    status: "IN_PROGRESS",
    clientId: "c-1",
    createdAt: "2026-08-14T00:00:00Z",
    updatedAt: "2026-08-14T00:00:00Z",
  };

  beforeEach(() => {
    mockTimeEntryApi = {
      getTimeEntries: vi.fn().mockReturnValue(of([sampleEntry, sampleNonBillableEntry])),
      getActiveTimer: vi.fn().mockReturnValue(of(null)),
      startTimer: vi.fn(),
      stopTimer: vi.fn(),
      logTime: vi.fn(),
      deleteTimeEntry: vi.fn(),
      pauseTimer: vi.fn().mockReturnValue(of(null)),
      resumeTimer: vi.fn().mockReturnValue(of(null)),
    };

    mockTaskApi = {
      getTasks: vi.fn().mockReturnValue(of([sampleTask, sampleTask2])),
    };

    mockProjectApi = {
      getProjects: vi.fn().mockReturnValue(of([sampleProject])),
    };

    mockWorkspaceStore = {
      activeTenantId: vi.fn().mockReturnValue("tenant-1"),
    };

    mockWorkspaceApi = {
      getMembers: vi.fn().mockReturnValue(of([])),
    };

    TestBed.configureTestingModule({
      providers: [
        TimeTrackingManagement,
        provideRouter([]),
        { provide: TimeEntryApi, useValue: mockTimeEntryApi },
        { provide: TaskApi, useValue: mockTaskApi },
        { provide: ProjectApi, useValue: mockProjectApi },
        { provide: WorkspaceStore, useValue: mockWorkspaceStore },
        { provide: WorkspaceApi, useValue: mockWorkspaceApi },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, "navigate").mockImplementation(() => Promise.resolve(true));
    localStorage.clear();
    service = TestBed.inject(TimeTrackingManagement);
  });

  it("should initialize and load initial data", () => {
    service.loadInitialData();
    expect(service.timeEntries()).toHaveLength(2);
    expect(service.tasks()).toHaveLength(2);
    expect(service.projects()).toHaveLength(1);
    expect(service.totalMinutesLogged()).toBe(120);
    expect(service.totalBillableMinutes()).toBe(90);
    expect(service.billablePercentage()).toBe(75);
    expect(service.totalHoursFormatted()).toBe("2h 0m");
    expect(service.billableHoursFormatted()).toBe("1h 30m");
  });

  it("should filter entries by project", () => {
    service.loadInitialData();
    service.projectFilter.set("p-1");
    expect(service.filteredEntries()).toHaveLength(1);
    expect(service.filteredEntries()[0].id).toBe("te-1");
  });

  it("should filter entries by billable status", () => {
    service.loadInitialData();
    service.billableFilter.set("BILLABLE");
    expect(service.filteredEntries()).toHaveLength(1);
    expect(service.filteredEntries()[0].isBillable).toBe(true);

    service.billableFilter.set("NON_BILLABLE");
    expect(service.filteredEntries()).toHaveLength(1);
    expect(service.filteredEntries()[0].isBillable).toBe(false);
  });

  it("should filter entries by task search query", () => {
    service.loadInitialData();
    service.searchQuery.set("Review");
    expect(service.filteredEntries()).toHaveLength(1);
    expect(service.filteredEntries()[0].id).toBe("te-2");
  });

  it("should filter entries by member", () => {
    service.loadInitialData();
    service.memberFilter.set("u-1");
    expect(service.filteredEntries()).toHaveLength(2);

    service.memberFilter.set("non-existent-user");
    expect(service.filteredEntries()).toHaveLength(0);
  });

  it("should start timer and update activeTimer signal", () => {
    const activeResponse: ActiveTimerResponse = {
      userId: "u-1",
      taskId: "t-1",
      startTime: new Date().toISOString(),
    };
    mockTimeEntryApi.startTimer.mockReturnValue(of(activeResponse));

    service.startTimer("t-1");
    expect(service.activeTimer()).toEqual(activeResponse);
    expect(service.isSubmitting()).toBe(false);
  });

  it("should handle error when starting timer fails", () => {
    mockTimeEntryApi.startTimer.mockReturnValue(
      throwError(() => ({ error: { detail: "Timer already running" } })),
    );

    service.startTimer("t-1");
    expect(service.errorMessage()).toBe("Timer already running");
  });

  it("should stop timer and append new time entry", () => {
    const loggedEntry: TimeEntryResponse = {
      id: "te-3",
      taskId: "t-1",
      userId: "u-1",
      durationMinutes: 45,
      isBillable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTimeEntryApi.stopTimer.mockReturnValue(of(loggedEntry));

    service.stopTimer(true);
    expect(service.activeTimer()).toBeNull();
    expect(service.timeEntries()[0].id).toBe("te-3");
  });

  it("should log manual entry and close modal", () => {
    const newEntry: TimeEntryResponse = {
      id: "te-manual",
      taskId: "t-1",
      userId: "u-1",
      durationMinutes: 60,
      isBillable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTimeEntryApi.logTime.mockReturnValue(of(newEntry));

    service.openManualModal();
    expect(service.isManualModalOpen()).toBe(true);

    service.logManualEntry({
      taskId: "t-1",
      durationMinutes: 60,
      isBillable: true,
    });

    expect(service.isManualModalOpen()).toBe(false);
    expect(service.timeEntries()[0].id).toBe("te-manual");
    expect(router.navigate).toHaveBeenCalledWith([], {
      queryParams: { action: null, entryId: null, taskId: null },
      queryParamsHandling: "merge",
    });
  });

  it("should delete time entry and close delete modal", () => {
    service.loadInitialData();
    mockTimeEntryApi.deleteTimeEntry.mockReturnValue(of(undefined));

    service.deleteEntry("te-1");
    expect(service.timeEntries().find(e => e.id === "te-1")).toBeUndefined();
    expect(service.isDeleteModalOpen()).toBe(false);
  });

  it("should handle error when deleteEntry fails", () => {
    mockTimeEntryApi.deleteTimeEntry.mockReturnValue(throwError(() => new Error("Delete failed")));
    service.deleteEntry("te-1");
    expect(service.errorMessage()).toBe("Failed to delete time entry.");
  });

  it("should handle error when stopTimer fails", () => {
    mockTimeEntryApi.stopTimer.mockReturnValue(
      throwError(() => ({ error: { detail: "Failed to stop timer" } })),
    );

    service.stopTimer(true);
    expect(service.errorMessage()).toBe("Failed to stop timer");
  });

  it("should handle error when logManualEntry fails", () => {
    mockTimeEntryApi.logTime.mockReturnValue(
      throwError(() => ({ error: { detail: "Validation failed" } })),
    );

    service.logManualEntry({ taskId: "t-1", durationMinutes: 30, isBillable: true });
    expect(service.errorMessage()).toBe("Validation failed");
  });

  it("should handle error when loadInitialData fails", () => {
    mockTimeEntryApi.getTimeEntries.mockReturnValue(throwError(() => new Error("Network error")));
    service.loadInitialData();
    expect(service.timeEntries()).toEqual([]);
  });

  it("should compute activeTask and activeProject when activeTimer is set", () => {
    service.loadInitialData();
    expect(service.activeTask()).toBeNull();
    expect(service.activeProject()).toBeNull();

    service.activeTimer.set({
      userId: "u-1",
      taskId: "t-1",
      startTime: new Date().toISOString(),
    });

    expect(service.activeTask()?.id).toBe("t-1");
    expect(service.activeProject()?.id).toBe("p-1");
  });

  it("should return 0 billable percentage when total minutes is 0", () => {
    service.timeEntries.set([]);
    expect(service.totalMinutesLogged()).toBe(0);
    expect(service.billablePercentage()).toBe(0);
  });

  it("should format active timer properly", () => {
    service.activeTimerSeconds.set(3665); // 1h 1m 5s
    expect(service.activeTimerFormatted()).toBe("01:01:05");
  });

  it("should call discardTimer and delegate to stopTimer(false)", () => {
    mockTimeEntryApi.stopTimer.mockReturnValue(of(sampleEntry));
    const stopSpy = vi.spyOn(service, "stopTimer");
    service.discardTimer();
    expect(stopSpy).toHaveBeenCalledWith(false);
  });

  it("should open and close manual modal with mode, preselected task, and sync query params", () => {
    service.openManualModal("manual", "t-1");
    expect(service.isManualModalOpen()).toBe(true);
    expect(service.modalMode()).toBe("manual");
    expect(service.preselectedTaskId()).toBe("t-1");
    expect(router.navigate).toHaveBeenCalledWith([], {
      queryParams: { action: "manual", taskId: "t-1", entryId: null },
      queryParamsHandling: "merge",
    });

    service.closeManualModal();
    expect(service.isManualModalOpen()).toBe(false);
    expect(service.preselectedTaskId()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith([], {
      queryParams: { action: null, entryId: null, taskId: null },
      queryParamsHandling: "merge",
    });

    service.openStartTimerModal("t-2");
    expect(service.isManualModalOpen()).toBe(true);
    expect(service.modalMode()).toBe("timer");
    expect(service.preselectedTaskId()).toBe("t-2");
    expect(router.navigate).toHaveBeenCalledWith([], {
      queryParams: { action: "timer", taskId: "t-2", entryId: null },
      queryParamsHandling: "merge",
    });

    service.setModalMode("manual");
    expect(service.modalMode()).toBe("manual");
    expect(router.navigate).toHaveBeenCalledWith([], {
      queryParams: { action: "manual" },
      queryParamsHandling: "merge",
    });
  });

  it("should pause and resume active timer ticker with persistence", () => {
    vi.useFakeTimers();
    localStorage.clear();

    const activeTimerData: ActiveTimerResponse = {
      userId: "u-1",
      taskId: "t-1",
      startTime: new Date(Date.now() - 10000).toISOString(),
      isPaused: false,
      accumulatedSeconds: 0,
    };
    mockTimeEntryApi.getActiveTimer.mockReturnValue(of(activeTimerData));
    mockTimeEntryApi.pauseTimer.mockReturnValue(
      of({ ...activeTimerData, isPaused: true, accumulatedSeconds: 10 }),
    );
    mockTimeEntryApi.resumeTimer.mockReturnValue(
      of({ ...activeTimerData, isPaused: false, accumulatedSeconds: 10 }),
    );
    service.activeTimer.set(activeTimerData);
    const privateService = service as unknown as {
      startTicker: (t: ActiveTimerResponse) => void;
      syncUrlActionState: (p: Record<string, unknown>) => void;
      loadStoredState: (taskId: string) => unknown;
      saveStoredState: (taskId: string) => void;
      clearStoredState: () => void;
    };
    privateService.startTicker(activeTimerData);

    // Pause timer
    service.pauseTimer();
    expect(service.isPaused()).toBe(true);

    vi.advanceTimersByTime(3000);
    expect(service.activeTimerSeconds()).toBe(10);

    // Calling pause again when already paused is a no-op
    service.pauseTimer();
    expect(service.isPaused()).toBe(true);

    // Resume timer
    service.resumeTimer();
    expect(service.isPaused()).toBe(false);
    vi.advanceTimersByTime(2000);
    expect(service.activeTimerSeconds()).toBe(12);

    // Calling resume again when not paused is a no-op
    service.resumeTimer();
    expect(service.isPaused()).toBe(false);

    vi.useRealTimers();
  });

  it("should open and close delete modal with selected entry and sync query params", () => {
    service.openDeleteModal(sampleEntry);
    expect(service.isDeleteModalOpen()).toBe(true);
    expect(service.selectedEntryForDelete()).toEqual(sampleEntry);
    expect(router.navigate).toHaveBeenCalledWith([], {
      queryParams: { action: "delete", entryId: sampleEntry.id, taskId: null },
      queryParamsHandling: "merge",
    });

    service.closeDeleteModal();
    expect(service.isDeleteModalOpen()).toBe(false);
    expect(service.selectedEntryForDelete()).toBeNull();
  });

  it("should open, close, and confirm discard modal and sync query params", () => {
    mockTimeEntryApi.stopTimer.mockReturnValue(of(sampleEntry));
    const discardSpy = vi.spyOn(service, "discardTimer");

    service.openDiscardModal();
    expect(service.isDiscardModalOpen()).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith([], {
      queryParams: { action: "discard", entryId: null, taskId: null },
      queryParamsHandling: "merge",
    });

    service.closeDiscardModal();
    expect(service.isDiscardModalOpen()).toBe(false);

    service.openDiscardModal();
    service.confirmDiscardTimer();
    expect(discardSpy).toHaveBeenCalled();
    expect(service.isDiscardModalOpen()).toBe(false);
  });

  it("should sync url action state from query parameters", () => {
    const privateService = service as unknown as {
      syncUrlActionState: (p: Record<string, unknown>) => void;
    };
    service.timeEntries.set([sampleEntry]);

    // Manual action
    privateService.syncUrlActionState({ action: "manual", taskId: "t-1" });
    expect(service.isManualModalOpen()).toBe(true);
    expect(service.modalMode()).toBe("manual");
    expect(service.preselectedTaskId()).toBe("t-1");

    // Discard action
    privateService.syncUrlActionState({ action: "discard" });
    expect(service.isDiscardModalOpen()).toBe(true);
    expect(service.isManualModalOpen()).toBe(false);

    // Delete action with entryId
    privateService.syncUrlActionState({ action: "delete", entryId: "te-1" });
    expect(service.isDeleteModalOpen()).toBe(true);
    expect(service.selectedEntryForDelete()?.id).toBe("te-1");
    expect(service.isDiscardModalOpen()).toBe(false);

    // Empty action closes all modals
    privateService.syncUrlActionState({});
    expect(service.isManualModalOpen()).toBe(false);
    expect(service.isDeleteModalOpen()).toBe(false);
    expect(service.isDiscardModalOpen()).toBe(false);
    expect(service.selectedEntryForDelete()).toBeNull();
  });

  it("should restore paused state when stored in localStorage", () => {
    const privateService = service as unknown as {
      startTicker: (t: ActiveTimerResponse) => void;
    };
    localStorage.setItem(
      "agency_os_stopwatch_state",
      JSON.stringify({
        taskId: "t-1",
        isPaused: true,
        accumulatedSeconds: 45,
        lastResumeTimestamp: null,
      }),
    );

    privateService.startTicker({
      userId: "u-1",
      taskId: "t-1",
      startTime: "2026-08-14T00:00:00Z",
    });
    expect(service.isPaused()).toBe(true);
    expect(service.activeTimerSeconds()).toBe(45);
  });

  it("should restore running state when stored in localStorage", () => {
    const privateService = service as unknown as {
      startTicker: (t: ActiveTimerResponse) => void;
    };
    vi.useFakeTimers();
    localStorage.setItem(
      "agency_os_stopwatch_state",
      JSON.stringify({
        taskId: "t-1",
        isPaused: false,
        accumulatedSeconds: 20,
        lastResumeTimestamp: Date.now() - 5000,
      }),
    );

    privateService.startTicker({
      userId: "u-1",
      taskId: "t-1",
      startTime: "2026-08-14T00:00:00Z",
    });
    expect(service.isPaused()).toBe(false);
    expect(service.activeTimerSeconds()).toBe(25);

    vi.useRealTimers();
  });

  it("should handle corrupted localStorage gracefully", () => {
    const privateService = service as unknown as {
      loadStoredState: (taskId: string) => unknown;
    };
    localStorage.setItem("agency_os_stopwatch_state", "invalid-json{{");
    const result = privateService.loadStoredState("t-1");
    expect(result).toBeNull();
  });

  it("should handle localStorage setItem and removeItem errors gracefully", () => {
    const privateService = service as unknown as {
      saveStoredState: (taskId: string) => void;
      clearStoredState: () => void;
    };
    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Quota exceeded");
    });
    expect(() => privateService.saveStoredState("t-1")).not.toThrow();
    setSpy.mockRestore();

    const removeSpy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    expect(() => privateService.clearStoredState()).not.toThrow();
    removeSpy.mockRestore();
  });
});
