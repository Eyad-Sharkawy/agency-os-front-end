import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { WorkspaceStore } from "../../core/multitenancy/workspace.store";
import { DashboardOverview } from "./dashboard-overview";

describe("DashboardOverview Component", () => {
  let component: DashboardOverview;
  let fixture: ComponentFixture<DashboardOverview>;
  let mockWorkspaceStore: {
    activeWorkspace: ReturnType<typeof vi.fn>;
    isLoading: ReturnType<typeof vi.fn>;
  };

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
      isLoading: vi.fn().mockReturnValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardOverview],
      providers: [provideRouter([]), { provide: WorkspaceStore, useValue: mockWorkspaceStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create and display active workspace details when loaded", () => {
    expect(component).toBeTruthy();
    expect(component.isLoading()).toBe(false);
    expect(component.activeWorkspace()?.name).toBe("Acme Agency");
    expect(component.activeWorkspace()?.tenantId).toBe("acme-agency");

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Acme Agency");
    expect(compiled.textContent).toContain("Active Tenant: acme-agency");
    expect(compiled.querySelectorAll(".animate-pulse")).toHaveLength(0);
  });

  it("should render quick links to clients, projects, time tracking and invoices", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Manage clients");
    expect(compiled.textContent).toContain("View projects");
    expect(compiled.textContent).toContain("View timesheet");
    expect(compiled.textContent).toContain("Manage invoices");
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

  it("should restrict action buttons and metrics for CLIENT role", () => {
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
    expect(component.canViewClients()).toBe(false);
    expect(component.canCreateInvoice()).toBe(false);

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain("Track Time");
    expect(text).not.toContain("New Project");
    expect(text).not.toContain("Manage clients");
    expect(text).not.toContain("View timesheet");
    expect(text).toContain("View invoices");
  });

  it("should allow tracking and viewing clients for MEMBER role, but restrict creation", () => {
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
    expect(component.canCreateProject()).toBe(false);
    expect(component.canViewClients()).toBe(true);
    expect(component.canCreateInvoice()).toBe(false);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain("Track Time");
    expect(text).not.toContain("New Project");
    expect(text).toContain("Manage clients");
    expect(text).toContain("View timesheet");
    expect(text).toContain("View invoices");
  });
});
