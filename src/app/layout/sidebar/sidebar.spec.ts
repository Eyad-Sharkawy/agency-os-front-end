import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceResponse } from "../../core/api/models";
import { AuthStore } from "../../core/auth/stores/auth.store";
import { WorkspaceStore } from "../../core/multitenancy/workspace.store";
import { ProfileModalService } from "../../features/profile/services/profile-modal.service";
import { Sidebar } from "./sidebar";

describe("Sidebar Component", () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;

  const mockWorkspaces: WorkspaceResponse[] = [
    {
      id: "ws-1",
      tenantId: "acme-corp",
      name: "Acme Corp",
      contactEmail: "admin@acme.com",
      role: "OWNER",
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "ws-2",
      tenantId: "beta-llc",
      name: "Beta LLC",
      contactEmail: "admin@beta.com",
      role: "MEMBER",
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];

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
      activeWorkspace: vi.fn().mockReturnValue(mockWorkspaces[0]),
      workspaces: vi.fn().mockReturnValue(mockWorkspaces),
      setActiveWorkspace: vi.fn(),
    };

    mockAuthStore = {
      user: vi.fn().mockReturnValue({
        username: "eyad",
        email: "eyad@example.com",
        firstName: "Eyad",
        lastName: "Sharkawy",
      }),
      initials: vi.fn().mockReturnValue("ES"),
      logout: vi.fn(),
      accountManagement: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        provideRouter([{ path: "w/:workspaceId", component: class Dummy {} }]),
        { provide: WorkspaceStore, useValue: mockWorkspaceStore },
        { provide: AuthStore, useValue: mockAuthStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create sidebar component", () => {
    expect(component).toBeTruthy();
  });

  it("should render all 6 core navigation items", () => {
    expect(component.navItems().length).toBe(6);
    expect(component.navItems().map(i => i.label)).toEqual([
      "Overview",
      "Clients",
      "Projects",
      "Tasks",
      "Time Tracking",
      "Invoices",
    ]);
    expect(component.navItems()[0].route).toBe("/w/acme-corp");
  });

  it("should compute active workspace initials correctly", () => {
    expect(component.activeInitials()).toBe("AC");
  });

  it("should toggle workspace menu", () => {
    expect(component.isWorkspaceMenuOpen()).toBe(false);
    component.toggleWorkspaceMenu();
    expect(component.isWorkspaceMenuOpen()).toBe(true);
  });

  it("should switch workspace and update store", () => {
    component.selectWorkspace(mockWorkspaces[1]);
    expect(mockWorkspaceStore.setActiveWorkspace).toHaveBeenCalledWith(mockWorkspaces[1]);
    expect(component.isWorkspaceMenuOpen()).toBe(false);
  });

  it("should trigger logout on sign out action", () => {
    component.onSignOut();
    expect(mockAuthStore.logout).toHaveBeenCalled();
  });

  it("should trigger profileModalService.open on manage account action", () => {
    const profileModalService = TestBed.inject(ProfileModalService);
    const openSpy = vi.spyOn(profileModalService, "open");
    component.onManageAccount();
    expect(openSpy).toHaveBeenCalledWith("personal");
  });

  it("should compute canManageActiveWorkspace for OWNER role", () => {
    expect(component.canManageActiveWorkspace()).toBe(true);
  });

  it("should provide themeService and allow toggling theme from sidebar button", () => {
    expect(component.themeService).toBeTruthy();
    const toggleSpy = vi.spyOn(component.themeService, "toggleTheme");
    const themeBtn = fixture.nativeElement.querySelector(
      'button[aria-label*="Switch to"]',
    ) as HTMLButtonElement;
    expect(themeBtn).toBeTruthy();
    themeBtn.click();
    expect(toggleSpy).toHaveBeenCalled();
  });
});
