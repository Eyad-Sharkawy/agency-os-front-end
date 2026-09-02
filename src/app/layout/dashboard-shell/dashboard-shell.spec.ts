import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter, Router } from "@angular/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthStore } from "../../core/auth/stores/auth.store";
import { WorkspaceStore } from "../../core/multitenancy/workspace.store";
import { ENVIRONMENT } from "../../core/tokens/enviroment/environment.token";
import { environment } from "../../../environments/environment";
import { DashboardShell } from "./dashboard-shell";

@Component({ standalone: true, template: "" })
class DummyViewComponent {}

describe("DashboardShell Component", () => {
  let fixture: ComponentFixture<DashboardShell>;
  let component: DashboardShell;

  const mockWorkspace = {
    id: "ws-1",
    tenantId: "acme-corp",
    name: "Acme Corp",
    role: "OWNER",
    isActive: true,
  };

  let mockWorkspaceStore: {
    activeWorkspace: ReturnType<typeof vi.fn>;
    workspaces: ReturnType<typeof vi.fn>;
    setActiveWorkspace: ReturnType<typeof vi.fn>;
  };

  let mockAuthStore: {
    user: ReturnType<typeof vi.fn>;
    initials: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    accountManagement: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockWorkspaceStore = {
      activeWorkspace: vi.fn().mockReturnValue(mockWorkspace),
      workspaces: vi.fn().mockReturnValue([mockWorkspace]),
      setActiveWorkspace: vi.fn(),
    };

    mockAuthStore = {
      user: vi.fn().mockReturnValue({
        username: "testuser",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      }),
      initials: vi.fn().mockReturnValue("TU"),
      logout: vi.fn(),
      accountManagement: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardShell],
      providers: [
        provideRouter([
          { path: "clients", component: DummyViewComponent },
          { path: "projects", component: DummyViewComponent },
          { path: "tasks", component: DummyViewComponent },
          { path: "time-tracking", component: DummyViewComponent },
          { path: "invoices", component: DummyViewComponent },
          { path: "**", component: DummyViewComponent },
        ]),
        provideHttpClient(),
        { provide: ENVIRONMENT, useValue: environment },
        { provide: WorkspaceStore, useValue: mockWorkspaceStore },
        { provide: AuthStore, useValue: mockAuthStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardShell);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create dashboard shell and expose activeWorkspace", () => {
    expect(component).toBeTruthy();
    expect(component.activeWorkspace()).toEqual(mockWorkspace);
  });

  it("should render sidebar and router outlet", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("aos-sidebar")).toBeTruthy();
    expect(compiled.querySelector("router-outlet")).toBeTruthy();
  });

  it("should toggle mobile sidebar visibility and close on backdrop click", () => {
    expect(component.isMobileSidebarOpen()).toBe(false);
    component.toggleMobileSidebar();
    fixture.detectChanges();
    expect(component.isMobileSidebarOpen()).toBe(true);

    const backdropBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Close mobile sidebar backdrop"]',
    ) as HTMLButtonElement;
    expect(backdropBtn).toBeTruthy();
    backdropBtn.click();
    fixture.detectChanges();
    expect(component.isMobileSidebarOpen()).toBe(false);
  });

  it("should compute currentSectionTitle based on active route", () => {
    expect(component.currentSectionTitle()).toBe("Overview");
  });

  it("should close mobile sidebar when closeMobileSidebar is called", () => {
    component.isMobileSidebarOpen.set(true);
    component.closeMobileSidebar();
    expect(component.isMobileSidebarOpen()).toBe(false);
  });

  it("should map various route patterns to their corresponding section title", async () => {
    const router = TestBed.inject(Router);

    await router.navigateByUrl("/clients");
    fixture.detectChanges();
    expect(component.currentSectionTitle()).toBe("Clients");

    await router.navigateByUrl("/projects");
    fixture.detectChanges();
    expect(component.currentSectionTitle()).toBe("Projects");

    await router.navigateByUrl("/tasks");
    fixture.detectChanges();
    expect(component.currentSectionTitle()).toBe("Tasks");

    await router.navigateByUrl("/time-tracking");
    fixture.detectChanges();
    expect(component.currentSectionTitle()).toBe("Time Tracking");

    await router.navigateByUrl("/invoices");
    fixture.detectChanges();
    expect(component.currentSectionTitle()).toBe("Invoices");
  });
});
