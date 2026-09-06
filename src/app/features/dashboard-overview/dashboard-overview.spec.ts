import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientApi } from "../../core/api/services/client/client-api";
import { InvoiceApi } from "../../core/api/services/invoice/invoice-api";
import { ProjectApi } from "../../core/api/services/project/project-api";
import { TaskApi } from "../../core/api/services/task/task-api";
import { TimeEntryApi } from "../../core/api/services/time-entry/time-entry-api";
import { WorkspaceStore } from "../../core/multitenancy/workspace.store";
import { TimeTrackingManagement } from "../time-tracking/services/time-tracking-management";
import { DashboardOverview } from "./dashboard-overview";

describe("DashboardOverview Component", () => {
  let component: DashboardOverview;
  let fixture: ComponentFixture<DashboardOverview>;

  let mockWorkspaceStore: {
    activeWorkspace: ReturnType<typeof vi.fn>;
    activeTenantId: ReturnType<typeof vi.fn>;
    isLoading: ReturnType<typeof vi.fn>;
  };

  let mockClientApi: {
    getClients: ReturnType<typeof vi.fn>;
  };

  let mockProjectApi: {
    getProjects: ReturnType<typeof vi.fn>;
  };

  let mockTaskApi: {
    getTasks: ReturnType<typeof vi.fn>;
  };

  let mockTimeEntryApi: {
    getTimeEntries: ReturnType<typeof vi.fn>;
  };

  let mockInvoiceApi: {
    getInvoices: ReturnType<typeof vi.fn>;
  };

  let mockTimeTrackingManagement: {
    activeTimer: ReturnType<typeof vi.fn>;
    activeTimerFormatted: ReturnType<typeof vi.fn>;
    isPaused: ReturnType<typeof vi.fn>;
    pauseTimer: ReturnType<typeof vi.fn>;
    resumeTimer: ReturnType<typeof vi.fn>;
    stopTimer: ReturnType<typeof vi.fn>;
    openDiscardModal: ReturnType<typeof vi.fn>;
  };

  const sampleClients = [
    {
      id: "c-1",
      name: "Alpha Corp",
      email: "alpha@corp.com",
      status: "ACTIVE" as const,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: "c-2",
      name: "Beta LLC",
      email: "beta@llc.com",
      status: "INACTIVE" as const,
      createdAt: "2026-01-02",
      updatedAt: "2026-01-02",
    },
  ];

  const sampleProjects = [
    {
      id: "p-1",
      name: "Alpha Platform",
      clientId: "c-1",
      status: "IN_PROGRESS" as const,
      budget: 10000,
      billingRate: 150,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-05",
    },
    {
      id: "p-2",
      name: "Beta Mobile",
      clientId: "c-2",
      status: "PLANNING" as const,
      budget: 5000,
      billingRate: 100,
      createdAt: "2026-01-02",
      updatedAt: "2026-01-02",
    },
  ];

  const sampleTasks = [
    {
      id: "t-1",
      title: "Design System Tokens",
      projectId: "p-1",
      priority: "URGENT" as const,
      status: "IN_PROGRESS" as const,
      assigneeIds: [],
      totalLoggedMinutes: 120,
      isOverBudget: false,
      dueDate: "2026-12-31",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-05",
    },
    {
      id: "t-2",
      title: "Implement API Auth",
      projectId: "p-1",
      priority: "HIGH" as const,
      status: "TODO" as const,
      assigneeIds: [],
      totalLoggedMinutes: 60,
      isOverBudget: false,
      dueDate: "2026-12-31",
      createdAt: "2026-01-02",
      updatedAt: "2026-01-02",
    },
  ];

  const sampleTimeEntries = [
    {
      id: "te-1",
      taskId: "t-1",
      userId: "u-1",
      durationMinutes: 120,
      isBillable: true,
      createdAt: "2026-01-05",
      updatedAt: "2026-01-05",
    },
    {
      id: "te-2",
      taskId: "t-2",
      userId: "u-1",
      durationMinutes: 60,
      isBillable: false,
      createdAt: "2026-01-06",
      updatedAt: "2026-01-06",
    },
  ];

  const sampleInvoices = [
    {
      id: "inv-1",
      clientId: "c-1",
      totalAmount: 12500,
      status: "PAID" as const,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-02",
    },
    {
      id: "inv-2",
      clientId: "c-2",
      totalAmount: 4500,
      status: "SENT" as const,
      createdAt: "2026-01-03",
      updatedAt: "2026-01-03",
    },
  ];

  beforeEach(async () => {
    mockWorkspaceStore = {
      activeWorkspace: vi.fn().mockReturnValue({
        id: "ws-1",
        name: "Acme Agency",
        tenantId: "acme-agency",
        ownerId: "user-1",
        role: "ADMIN",
        createdAt: "2026-01-01T00:00:00Z",
      }),
      activeTenantId: vi.fn().mockReturnValue("acme-agency"),
      isLoading: vi.fn().mockReturnValue(false),
    };

    mockClientApi = {
      getClients: vi.fn().mockReturnValue(of(sampleClients)),
    };

    mockProjectApi = {
      getProjects: vi.fn().mockReturnValue(of(sampleProjects)),
    };

    mockTaskApi = {
      getTasks: vi.fn().mockReturnValue(of(sampleTasks)),
    };

    mockTimeEntryApi = {
      getTimeEntries: vi.fn().mockReturnValue(of(sampleTimeEntries)),
    };

    mockInvoiceApi = {
      getInvoices: vi.fn().mockReturnValue(of(sampleInvoices)),
    };

    mockTimeTrackingManagement = {
      activeTimer: vi.fn().mockReturnValue(null),
      activeTimerFormatted: vi.fn().mockReturnValue("00:00:00"),
      isPaused: vi.fn().mockReturnValue(false),
      pauseTimer: vi.fn(),
      resumeTimer: vi.fn(),
      stopTimer: vi.fn(),
      openDiscardModal: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardOverview],
      providers: [
        provideRouter([]),
        { provide: WorkspaceStore, useValue: mockWorkspaceStore },
        { provide: ClientApi, useValue: mockClientApi },
        { provide: ProjectApi, useValue: mockProjectApi },
        { provide: TaskApi, useValue: mockTaskApi },
        { provide: TimeEntryApi, useValue: mockTimeEntryApi },
        { provide: InvoiceApi, useValue: mockInvoiceApi },
        { provide: TimeTrackingManagement, useValue: mockTimeTrackingManagement },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create and display active workspace details and connected numbers", () => {
    expect(component).toBeTruthy();
    expect(component.isLoading()).toBe(false);
    expect(component.activeWorkspace()?.name).toBe("Acme Agency");
    expect(component.activeWorkspace()?.tenantId).toBe("acme-agency");

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Acme Agency");
    expect(compiled.textContent).toContain("Active Tenant: acme-agency");

    // Check connected client stats
    expect(component.clientStats().active).toBe(1);
    expect(component.clientStats().total).toBe(2);
    expect(compiled.textContent).toContain("1 Active");

    // Check connected project stats
    expect(component.projectStats().inProgress).toBe(1);
    expect(component.projectStats().total).toBe(2);
    expect(compiled.textContent).toContain("Alpha Platform");

    // Check connected task stats
    expect(component.taskStats().open).toBe(2);
    expect(compiled.textContent).toContain("Design System Tokens");

    // Check connected time stats
    expect(component.timeStats().totalHoursFormatted).toBe("3h 0m");
    expect(component.timeStats().billablePercentage).toBe(67);

    // Check connected financial stats
    expect(component.invoiceStats().totalInvoiced).toBe(17000);
    expect(component.invoiceStats().totalPaid).toBe(12500);
    expect(component.invoiceStats().totalPending).toBe(4500);
  });

  it("should render quick links to clients, projects, tasks, time tracking and invoices", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Manage clients");
    expect(compiled.textContent).toContain("View projects");
    expect(compiled.textContent).toContain("View tasks");
    expect(compiled.textContent).toContain("View timesheet");
    expect(compiled.textContent).toContain("Manage invoices");
  });

  it("should render active stopwatch banner when a timer is running", () => {
    mockTimeTrackingManagement.activeTimer.mockReturnValue({
      taskId: "t-1",
      userId: "u-1",
      startTime: "2026-01-01T00:00:00Z",
    });
    mockTimeTrackingManagement.activeTimerFormatted.mockReturnValue("01:24:45");

    fixture = TestBed.createComponent(DashboardOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Stopwatch Active");
    expect(compiled.textContent).toContain("01:24:45");
    expect(compiled.textContent).toContain("Stop & Save");
  });

  it("should display skeleton placeholders when workspace is loading", () => {
    mockWorkspaceStore.isLoading.mockReturnValue(true);
    fixture = TestBed.createComponent(DashboardOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    const skeletons = compiled.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
    expect(compiled.textContent).not.toContain("Active Tenant: acme-agency");
  });

  it("should display skeleton placeholders when active workspace is null", () => {
    mockWorkspaceStore.activeWorkspace.mockReturnValue(null);
    fixture = TestBed.createComponent(DashboardOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("should restrict action buttons and sensitive metrics for CLIENT role", () => {
    mockWorkspaceStore.activeWorkspace.mockReturnValue({
      id: "ws-1",
      name: "Acme Agency",
      tenantId: "acme-agency",
      ownerId: "user-1",
      role: "CLIENT",
      createdAt: "2026-01-01T00:00:00Z",
    });
    fixture = TestBed.createComponent(DashboardOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.canTrackTime()).toBe(false);
    expect(component.canCreateProject()).toBe(false);
    expect(component.canCreateTask()).toBe(false);
    expect(component.canViewClients()).toBe(false);
    expect(component.canCreateInvoice()).toBe(false);
    expect(component.canViewFinancials()).toBe(false);

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain("Track Time");
    expect(text).not.toContain("New Project");
    expect(text).not.toContain("Manage clients");
    expect(text).not.toContain("View timesheet");
    expect(text).toContain("View invoices");
  });

  it("should calculate budget progress and handle edge cases gracefully", () => {
    // Project with budget
    const progress = component.getBudgetProgress("p-1");
    expect(progress.budget).toBe(10000);
    expect(progress.spent).toBe(450); // (120 + 60) mins = 3 hrs * $150
    expect(progress.percentage).toBe(5);
    expect(progress.isOverBudget).toBe(false);
    expect(progress.isNearBudget).toBe(false);

    // Non-existent project
    const invalidProgress = component.getBudgetProgress("non-existent");
    expect(invalidProgress.budget).toBeNull();
    expect(invalidProgress.spent).toBe(0);
    expect(invalidProgress.percentage).toBe(0);
  });

  it("should handle budget progress thresholds (near budget and over budget)", () => {
    // Mock a project that is near budget and one over budget
    component.projects.set([
      {
        id: "p-near",
        name: "Near Budget Project",
        clientId: "c-1",
        status: "IN_PROGRESS",
        budget: 500,
        billingRate: 100,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: "p-over",
        name: "Over Budget Project",
        clientId: "c-1",
        status: "IN_PROGRESS",
        budget: 100,
        billingRate: 100,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: "p-zero",
        name: "Zero Budget Project",
        clientId: "c-1",
        status: "PLANNING",
        budget: 0,
        billingRate: 100,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);

    component.tasks.set([
      {
        id: "t-near",
        title: "Near task",
        projectId: "p-near",
        status: "IN_PROGRESS",
        priority: "HIGH",
        assigneeIds: [],
        totalLoggedMinutes: 270, // 4.5 hrs * $100 = $450 (90% of $500)
        isOverBudget: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: "t-over",
        title: "Over task",
        projectId: "p-over",
        status: "IN_PROGRESS",
        priority: "URGENT",
        assigneeIds: [],
        totalLoggedMinutes: 120, // 2 hrs * $100 = $200 (200% of $100)
        isOverBudget: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);

    const near = component.getBudgetProgress("p-near");
    expect(near.isNearBudget).toBe(true);
    expect(near.isOverBudget).toBe(false);
    expect(near.cappedPercentage).toBe(90);

    const over = component.getBudgetProgress("p-over");
    expect(over.isOverBudget).toBe(true);
    expect(over.isNearBudget).toBe(false);
    expect(over.cappedPercentage).toBe(100);

    const zero = component.getBudgetProgress("p-zero");
    expect(zero.percentage).toBe(0);
  });

  it("should return correct status classes and labels for all project statuses", () => {
    expect(component.getStatusClass("PLANNING")).toContain("amber");
    expect(component.getStatusClass("IN_PROGRESS")).toContain("brand-green");
    expect(component.getStatusClass("ON_HOLD")).toContain("orange");
    expect(component.getStatusClass("DELIVERED")).toContain("deep-green");
    expect(component.getStatusClass("OTHER" as unknown as "PLANNING")).toContain("soft-stone");

    expect(component.getStatusLabel("PLANNING")).toBe("Planning");
    expect(component.getStatusLabel("IN_PROGRESS")).toBe("In Progress");
    expect(component.getStatusLabel("ON_HOLD")).toBe("On Hold");
    expect(component.getStatusLabel("DELIVERED")).toBe("Delivered");
    expect(component.getStatusLabel("UNKNOWN" as unknown as "PLANNING")).toBe("UNKNOWN");
  });

  it("should return correct task dot classes and priority classes", () => {
    expect(component.getTaskStatusDotClass("TODO")).toContain("muted");
    expect(component.getTaskStatusDotClass("IN_PROGRESS")).toContain("brand-green");
    expect(component.getTaskStatusDotClass("REVIEW")).toContain("amber");
    expect(component.getTaskStatusDotClass("DONE")).toContain("deep-green");
    expect(component.getTaskStatusDotClass("UNKNOWN" as unknown as "TODO")).toContain("muted");

    expect(component.getTaskPriorityClass("URGENT")).toContain("error");
    expect(component.getTaskPriorityClass("HIGH")).toContain("orange");
    expect(component.getTaskPriorityClass("MEDIUM")).toContain("blue");
    expect(component.getTaskPriorityClass("LOW")).toContain("soft-stone");
    expect(component.getTaskPriorityClass("UNKNOWN" as unknown as "LOW")).toContain("soft-stone");
  });

  it("should evaluate isTaskOverdue correctly", () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const futureDate = new Date(Date.now() + 86400000).toISOString();

    const overdueTask = {
      id: "t-od",
      title: "Overdue task",
      projectId: "p-1",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      assigneeIds: [],
      totalLoggedMinutes: 0,
      isOverBudget: false,
      dueDate: pastDate,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    const doneOverdueTask = { ...overdueTask, status: "DONE" as const };
    const onTimeTask = { ...overdueTask, dueDate: futureDate };
    const noDueDateTask = { ...overdueTask, dueDate: undefined };

    expect(component.isTaskOverdue(overdueTask)).toBe(true);
    expect(component.isTaskOverdue(doneOverdueTask)).toBe(false);
    expect(component.isTaskOverdue(onTimeTask)).toBe(false);
    expect(component.isTaskOverdue(noDueDateTask)).toBe(false);
  });

  it("should format zero and billable time stats properly", () => {
    component.timeEntries.set([]);
    expect(component.timeStats().totalHoursFormatted).toBe("0h");
    expect(component.timeStats().billableHoursFormatted).toBe("0h");
    expect(component.timeStats().billablePercentage).toBe(0);

    // Minutes under 1 hour
    component.timeEntries.set([
      {
        id: "te-short",
        taskId: "t-1",
        userId: "u-1",
        durationMinutes: 45,
        isBillable: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);
    expect(component.timeStats().totalHoursFormatted).toBe("45m");
    expect(component.timeStats().billableHoursFormatted).toBe("45m");
  });

  it("should calculate invoice stats with overdue and draft statuses", () => {
    component.invoices.set([
      {
        id: "inv-od",
        clientId: "c-1",
        totalAmount: 2000,
        status: "OVERDUE",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: "inv-dr",
        clientId: "c-1",
        totalAmount: 1000,
        status: "DRAFT",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);

    expect(component.invoiceStats().totalOverdue).toBe(2000);
    expect(component.invoiceStats().overdueCount).toBe(1);
    expect(component.invoiceStats().totalPending).toBe(1000);
    expect(component.invoiceStats().pendingCount).toBe(1);
  });

  it("should handle member role permissions", () => {
    mockWorkspaceStore.activeWorkspace.mockReturnValue({
      id: "ws-1",
      name: "Acme Agency",
      tenantId: "acme-agency",
      ownerId: "user-1",
      role: "MEMBER",
      createdAt: "2026-01-01T00:00:00Z",
    });

    fixture = TestBed.createComponent(DashboardOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.canTrackTime()).toBe(true);
    expect(component.canCreateTask()).toBe(true);
    expect(component.canViewClients()).toBe(false);
    expect(component.canCreateProject()).toBe(false);
    expect(component.canCreateInvoice()).toBe(false);
    expect(component.canViewFinancials()).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Member Workspace View:");
    expect(compiled.textContent).toContain("Assigned Work");
  });

  it("should render client company dashboard isolation banner for CLIENT role", () => {
    mockWorkspaceStore.activeWorkspace.mockReturnValue({
      id: "ws-1",
      name: "Acme Agency",
      tenantId: "acme-agency",
      ownerId: "user-1",
      role: "CLIENT",
      createdAt: "2026-01-01T00:00:00Z",
    });

    fixture = TestBed.createComponent(DashboardOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Client Portal Dashboard:");
    expect(compiled.textContent).toContain("Company View");
  });

  it("should return fallback client and project names for unmapped IDs", () => {
    expect(component.getClientName("unknown-id")).toBe("Client");
    expect(component.getProjectName("unknown-id")).toBe("Project");
  });
});
