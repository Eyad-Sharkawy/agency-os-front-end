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
  };

  beforeEach(async () => {
    mockWorkspaceStore = {
      activeWorkspace: vi.fn().mockReturnValue({
        id: "ws-1",
        name: "Acme Agency",
        tenantId: "acme-agency",
        ownerId: "user-1",
        createdAt: "2026-01-01T00:00:00Z",
      }),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardOverview],
      providers: [provideRouter([]), { provide: WorkspaceStore, useValue: mockWorkspaceStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create and display active workspace details", () => {
    expect(component).toBeTruthy();
    expect(component.activeWorkspace()?.name).toBe("Acme Agency");
    expect(component.activeWorkspace()?.tenantId).toBe("acme-agency");

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Acme Agency");
    expect(compiled.textContent).toContain("Active Tenant: acme-agency");
  });

  it("should render quick links to clients, projects, time tracking and invoices", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Manage clients");
    expect(compiled.textContent).toContain("View projects");
    expect(compiled.textContent).toContain("View timesheet");
    expect(compiled.textContent).toContain("Manage invoices");
  });
});
