import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { signal } from "@angular/core";
import { describe, expect, it, beforeEach } from "vitest";
import { UnauthorizedComponent } from "./unauthorized";
import { WorkspaceStore } from "../../core/multitenancy/workspace.store";
import { WorkspaceResponse } from "../../core/api/models/workspace.models";

describe("UnauthorizedComponent", () => {
  let component: UnauthorizedComponent;
  let fixture: ComponentFixture<UnauthorizedComponent>;
  let workspaceStoreMock: {
    activeWorkspace: ReturnType<typeof signal<WorkspaceResponse | null>>;
    activeRole: ReturnType<typeof signal<string | null>>;
  };

  const sampleWorkspace: WorkspaceResponse = {
    id: "ws-1",
    name: "Design Studio",
    tenantId: "tenant-ds",
    contactEmail: "contact@studio.com",
    role: "CLIENT",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  beforeEach(async () => {
    workspaceStoreMock = {
      activeWorkspace: signal<WorkspaceResponse | null>(sampleWorkspace),
      activeRole: signal<string | null>("CLIENT"),
    };

    await TestBed.configureTestingModule({
      imports: [UnauthorizedComponent],
      providers: [provideRouter([]), { provide: WorkspaceStore, useValue: workspaceStoreMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(UnauthorizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display active workspace name and role", () => {
    expect(component.workspaceName()).toBe("Design Studio");
    expect(component.activeRole()).toBe("CLIENT");
    expect(component.overviewRoute()).toBe("/w/tenant-ds");
  });

  it("should provide fallbacks when no active workspace exists", () => {
    workspaceStoreMock.activeWorkspace.set(null);
    workspaceStoreMock.activeRole.set(null);

    expect(component.workspaceName()).toBe("this workspace");
    expect(component.activeRole()).toBe("Guest");
    expect(component.overviewRoute()).toBe("/workspaces");
  });
});
