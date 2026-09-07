import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TimeTrackingComponent } from "./time-tracking";
import { BillableFilter, TimeTrackingManagement } from "./services/time-tracking-management";
import { ActiveTimerResponse, TimeEntryResponse } from "../../core/api/models/time-entry.models";
import { TaskResponse } from "../../core/api/models/task.models";
import { ProjectResponse } from "../../core/api/models/project.models";
import { WorkspaceMemberResponse } from "../../core/api/models/workspace.models";
import { WorkspaceStore } from "../../core/multitenancy/workspace.store";

describe("TimeTrackingComponent", () => {
  let component: TimeTrackingComponent;
  let fixture: ComponentFixture<TimeTrackingComponent>;

  let tmMock: {
    timeEntries: ReturnType<typeof signal<TimeEntryResponse[]>>;
    activeTimer: ReturnType<typeof signal<ActiveTimerResponse | null>>;
    activeTimerSeconds: ReturnType<typeof signal<number>>;
    tasks: ReturnType<typeof signal<TaskResponse[]>>;
    projects: ReturnType<typeof signal<ProjectResponse[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    isSubmitting: ReturnType<typeof signal<boolean>>;
    errorMessage: ReturnType<typeof signal<string | null>>;
    members: ReturnType<typeof signal<WorkspaceMemberResponse[]>>;
    projectFilter: ReturnType<typeof signal<string>>;
    billableFilter: ReturnType<typeof signal<BillableFilter>>;
    memberFilter: ReturnType<typeof signal<string>>;
    searchQuery: ReturnType<typeof signal<string>>;
    isManualModalOpen: ReturnType<typeof signal<boolean>>;
    activeTimerFormatted: ReturnType<typeof signal<string>>;
    activeTask: ReturnType<typeof signal<TaskResponse | null>>;
    activeProject: ReturnType<typeof signal<ProjectResponse | null>>;
    taskMap: ReturnType<typeof signal<Map<string, TaskResponse>>>;
    projectMap: ReturnType<typeof signal<Map<string, ProjectResponse>>>;
    filteredEntries: ReturnType<typeof signal<TimeEntryResponse[]>>;
    totalMinutesLogged: ReturnType<typeof signal<number>>;
    totalBillableMinutes: ReturnType<typeof signal<number>>;
    billablePercentage: ReturnType<typeof signal<number>>;
    totalHoursFormatted: ReturnType<typeof signal<string>>;
    billableHoursFormatted: ReturnType<typeof signal<string>>;
    loadInitialData: ReturnType<typeof vi.fn>;
    startTimer: ReturnType<typeof vi.fn>;
    stopTimer: ReturnType<typeof vi.fn>;
    logManualEntry: ReturnType<typeof vi.fn>;
    deleteEntry: ReturnType<typeof vi.fn>;
    openManualModal: ReturnType<typeof vi.fn>;
    openStartTimerModal: ReturnType<typeof vi.fn>;
    discardTimer: ReturnType<typeof vi.fn>;
    openDiscardModal: ReturnType<typeof vi.fn>;
    closeDiscardModal: ReturnType<typeof vi.fn>;
    openDeleteModal: ReturnType<typeof vi.fn>;
    closeDeleteModal: ReturnType<typeof vi.fn>;
    isDeleteModalOpen: ReturnType<typeof signal<boolean>>;
    selectedEntryForDelete: ReturnType<typeof signal<TimeEntryResponse | null>>;
    isDiscardModalOpen: ReturnType<typeof signal<boolean>>;
    pauseTimer: ReturnType<typeof vi.fn>;
    resumeTimer: ReturnType<typeof vi.fn>;
    isPaused: ReturnType<typeof signal<boolean>>;
    closeManualModal: ReturnType<typeof vi.fn>;
    getMember: ReturnType<typeof vi.fn>;
    getMemberDisplayName: ReturnType<typeof vi.fn>;
    getMemberInitials: ReturnType<typeof vi.fn>;
  };

  const sampleEntry: TimeEntryResponse = {
    id: "te-1",
    taskId: "t-1",
    userId: "u-1",
    durationMinutes: 120,
    isBillable: true,
    createdAt: "2026-08-14T07:00:00Z",
    updatedAt: "2026-08-14T07:00:00Z",
  };

  const sampleTask: TaskResponse = {
    id: "t-1",
    title: "Implement Core Feature",
    projectId: "p-1",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assigneeIds: ["u-1"],
    totalLoggedMinutes: 120,
    isOverBudget: false,
    createdAt: "2026-08-14T00:00:00Z",
    updatedAt: "2026-08-14T00:00:00Z",
  };

  const sampleProject: ProjectResponse = {
    id: "p-1",
    name: "Client Alpha",
    billingRate: 150,
    status: "IN_PROGRESS",
    clientId: "c-1",
    createdAt: "2026-08-14T00:00:00Z",
    updatedAt: "2026-08-14T00:00:00Z",
  };

  beforeEach(async () => {
    const taskMap = new Map<string, TaskResponse>();
    taskMap.set("t-1", sampleTask);

    const projectMap = new Map<string, ProjectResponse>();
    projectMap.set("p-1", sampleProject);

    tmMock = {
      timeEntries: signal<TimeEntryResponse[]>([sampleEntry]),
      activeTimer: signal<ActiveTimerResponse | null>(null),
      activeTimerSeconds: signal<number>(0),
      tasks: signal<TaskResponse[]>([sampleTask]),
      projects: signal<ProjectResponse[]>([sampleProject]),
      isLoading: signal<boolean>(false),
      isSubmitting: signal<boolean>(false),
      errorMessage: signal<string | null>(null),
      members: signal<WorkspaceMemberResponse[]>([]),
      projectFilter: signal<string>("ALL"),
      billableFilter: signal<BillableFilter>("ALL"),
      memberFilter: signal<string>("ALL"),
      searchQuery: signal<string>(""),
      isManualModalOpen: signal<boolean>(false),
      activeTimerFormatted: signal<string>("00:00:00"),
      activeTask: signal<TaskResponse | null>(null),
      activeProject: signal<ProjectResponse | null>(null),
      taskMap: signal<Map<string, TaskResponse>>(taskMap),
      projectMap: signal<Map<string, ProjectResponse>>(projectMap),
      filteredEntries: signal<TimeEntryResponse[]>([sampleEntry]),
      totalMinutesLogged: signal<number>(120),
      totalBillableMinutes: signal<number>(120),
      billablePercentage: signal<number>(100),
      totalHoursFormatted: signal<string>("2h 0m"),
      billableHoursFormatted: signal<string>("2h 0m"),
      loadInitialData: vi.fn(),
      startTimer: vi.fn(),
      stopTimer: vi.fn(),
      logManualEntry: vi.fn(),
      deleteEntry: vi.fn(),
      openManualModal: vi.fn(),
      openStartTimerModal: vi.fn(),
      discardTimer: vi.fn(),
      openDiscardModal: vi.fn(),
      closeDiscardModal: vi.fn(),
      openDeleteModal: vi.fn(),
      closeDeleteModal: vi.fn(),
      isDeleteModalOpen: signal<boolean>(false),
      selectedEntryForDelete: signal<TimeEntryResponse | null>(null),
      isDiscardModalOpen: signal<boolean>(false),
      pauseTimer: vi.fn(),
      resumeTimer: vi.fn(),
      isPaused: signal<boolean>(false),
      closeManualModal: vi.fn(),
      getMember: vi.fn().mockReturnValue(null),
      getMemberDisplayName: vi.fn().mockReturnValue("Team Member"),
      getMemberInitials: vi.fn().mockReturnValue("TM"),
    };

    const workspaceStoreMock = {
      activeWorkspace: signal({
        id: "w-1",
        name: "Test Workspace",
        tenantId: "tenant-1",
        contactEmail: "test@example.com",
        role: "ADMIN",
        isActive: true,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      }),
    };

    await TestBed.configureTestingModule({
      imports: [TimeTrackingComponent],
      providers: [
        { provide: TimeTrackingManagement, useValue: tmMock },
        { provide: WorkspaceStore, useValue: workspaceStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component and render header, metrics, and timesheet table", () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Time Tracking");
    expect(compiled.textContent).toContain("Manual Entry");
    expect(compiled.textContent).toContain("Total Tracked");
    expect(compiled.textContent).toContain("Billable Hours");
    expect(compiled.textContent).toContain("Implement Core Feature");
    expect(compiled.textContent).toContain("BILLABLE");
  });

  it("should open manual modal when Manual Entry button clicked", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(compiled.querySelectorAll("aos-button")) as HTMLElement[];
    const manualBtn = buttons.find(btn => btn.textContent?.includes("Manual Entry"));
    manualBtn?.click();
    expect(tmMock.openManualModal).toHaveBeenCalled();
  });

  it("should render active stopwatch widget when activeTimer is running", () => {
    tmMock.activeTimer.set({
      userId: "u-1",
      taskId: "t-1",
      startTime: new Date().toISOString(),
    });
    tmMock.activeTask.set(sampleTask);
    tmMock.activeProject.set(sampleProject);
    tmMock.activeTimerFormatted.set("00:15:30");
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Stopwatch Active");
    expect(compiled.textContent).toContain("00:15:30");
    expect(compiled.textContent).toContain("Stop & Save");
  });

  it("should format duration correctly", () => {
    expect(component.formatDuration(0)).toBe("0m");
    expect(component.formatDuration(45)).toBe("45m");
    expect(component.formatDuration(60)).toBe("1h");
    expect(component.formatDuration(90)).toBe("1h 30m");
  });

  it("should open start timer modal when Start Timer button is triggered", () => {
    component.onStartActiveTimer();
    expect(tmMock.openStartTimerModal).toHaveBeenCalled();
  });

  it("should stop active timer as billable or non-billable", () => {
    component.onStopActiveTimer(true);
    expect(tmMock.stopTimer).toHaveBeenCalledWith(true);

    component.onStopActiveTimer(false);
    expect(tmMock.stopTimer).toHaveBeenCalledWith(false);
  });

  it("should return fallback text when task or project is not found", () => {
    expect(component.getTaskTitle("unknown-task")).toBe("Unknown Task");
    expect(component.getProjectName("unknown-task")).toBe("—");
  });

  it("should compute projectFilterOptions correctly", () => {
    const options = component.projectFilterOptions();
    expect(options).toHaveLength(2);
    expect(options[0].value).toBe("ALL");
    expect(options[1].value).toBe("p-1");
  });

  it("should open discard modal when onDiscardActiveTimer is called", () => {
    component.onDiscardActiveTimer();
    expect(tmMock.openDiscardModal).toHaveBeenCalled();
  });

  it("should open delete modal when onDeleteEntry is called", () => {
    component.onDeleteEntry(sampleEntry);
    expect(tmMock.openDeleteModal).toHaveBeenCalledWith(sampleEntry);
  });

  it("should compute canTrackTime based on workspace role", () => {
    expect(component.canTrackTime()).toBe(true);
  });

  it("should pause and resume timer with onTogglePause", () => {
    // When not paused, toggle calls pauseTimer
    tmMock.isPaused.set(false);
    component.onTogglePause();
    expect(tmMock.pauseTimer).toHaveBeenCalled();

    // When paused, toggle calls resumeTimer
    tmMock.isPaused.set(true);
    component.onTogglePause();
    expect(tmMock.resumeTimer).toHaveBeenCalled();
  });

  it("should compute memberFilterOptions correctly and handle member role privacy banner", () => {
    tmMock.members.set([
      {
        userId: "u-1",
        username: "sarah_member",
        firstName: "Sarah",
        lastName: "Chen",
        email: "sarah@example.com",
        role: "MEMBER",
      },
    ]);

    const options = component.memberFilterOptions();
    expect(options).toHaveLength(2);
    expect(options[0].value).toBe("ALL");
    expect(options[1].value).toBe("u-1");
    expect(options[1].label).toBe("Sarah Chen (@sarah_member)");
    expect(options[1].description).toBe("MEMBER");

    expect(component.isOwnerOrAdmin()).toBe(true);
    expect(component.isMember()).toBe(false);
  });
});
