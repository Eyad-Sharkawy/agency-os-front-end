import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectResponse } from "../../../../core/api/models/project.models";
import { ProjectManagement } from "../../services/project-management";
import { ProjectCard } from "./project-card";

describe("ProjectCard", () => {
  let component: ProjectCard;
  let fixture: ComponentFixture<ProjectCard>;
  let pmMock: {
    openEditModal: ReturnType<typeof vi.fn>;
    openDeleteModal: ReturnType<typeof vi.fn>;
    canEdit: ReturnType<typeof vi.fn>;
    canDelete: ReturnType<typeof vi.fn>;
    getClientName: ReturnType<typeof vi.fn>;
  };

  const mockProject: ProjectResponse = {
    id: "proj-123",
    name: "Enterprise Architecture",
    description: "Cloud migration and modernization",
    budget: 50000,
    billingRate: 200,
    status: "IN_PROGRESS",
    clientId: "client-1",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  beforeEach(async () => {
    pmMock = {
      openEditModal: vi.fn(),
      openDeleteModal: vi.fn(),
      canEdit: vi.fn().mockReturnValue(true),
      canDelete: vi.fn().mockReturnValue(true),
      getClientName: vi.fn().mockReturnValue("Acme Corp"),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectCard],
      providers: [provideRouter([]), { provide: ProjectManagement, useValue: pmMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("project", mockProject);
    fixture.detectChanges();
  });

  it("should create component and display project info", () => {
    expect(component).toBeTruthy();
    expect(component.project()).toEqual(mockProject);
    expect(component.clientName()).toBe("Acme Corp");

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Enterprise Architecture");
    expect(compiled.textContent).toContain("Cloud migration and modernization");
    expect(compiled.textContent).toContain("Acme Corp");
    expect(compiled.textContent).toContain("In Progress");
  });

  it("should return correct status classes and labels", () => {
    expect(component.getStatusLabel("PLANNING")).toBe("Planning");
    expect(component.getStatusLabel("IN_PROGRESS")).toBe("In Progress");
    expect(component.getStatusLabel("ON_HOLD")).toBe("On Hold");
    expect(component.getStatusLabel("DELIVERED")).toBe("Delivered");

    expect(component.getStatusClass("IN_PROGRESS")).toContain("bg-brand-green/10");
    expect(component.getStatusDotClass("IN_PROGRESS")).toBe("bg-brand-green");
  });

  it("should trigger edit modal on edit click", () => {
    component.onEdit();
    expect(pmMock.openEditModal).toHaveBeenCalledWith(mockProject);
  });

  it("should trigger delete modal on delete click", () => {
    component.onDelete();
    expect(pmMock.openDeleteModal).toHaveBeenCalledWith(mockProject);
  });
});
