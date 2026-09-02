import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectResponse } from "../../../../core/api/models/project.models";
import { ProjectManagement } from "../../services/project-management";
import { ProjectDeleteModal } from "./project-delete-modal";

describe("ProjectDeleteModal", () => {
  let component: ProjectDeleteModal;
  let fixture: ComponentFixture<ProjectDeleteModal>;
  let isDeleteModalOpenSignal: WritableSignal<boolean>;
  let selectedProjectSignal: WritableSignal<ProjectResponse | null>;

  let pmMock: {
    isDeleteModalOpen: WritableSignal<boolean>;
    selectedProject: WritableSignal<ProjectResponse | null>;
    deleteProject: ReturnType<typeof vi.fn>;
    closeModals: ReturnType<typeof vi.fn>;
  };

  const mockProject: ProjectResponse = {
    id: "proj-1",
    name: "Alpha Redesign",
    description: "Design revamp",
    budget: 15000,
    billingRate: 150,
    status: "IN_PROGRESS",
    clientId: "client-1",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  beforeEach(async () => {
    isDeleteModalOpenSignal = signal(false);
    selectedProjectSignal = signal<ProjectResponse | null>(null);

    pmMock = {
      isDeleteModalOpen: isDeleteModalOpenSignal,
      selectedProject: selectedProjectSignal,
      deleteProject: vi.fn().mockReturnValue(of(undefined)),
      closeModals: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectDeleteModal],
      providers: [{ provide: ProjectManagement, useValue: pmMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDeleteModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should not render dialog when closed", () => {
    expect(component.isOpen()).toBe(false);
    const dialog = fixture.nativeElement.querySelector("dialog");
    expect(dialog).toBeNull();
  });

  it("should render project details when open", () => {
    selectedProjectSignal.set(mockProject);
    isDeleteModalOpenSignal.set(true);
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Delete Project");
    expect(compiled.textContent).toContain("Alpha Redesign");
  });

  it("should delete project on confirm and close modal", () => {
    selectedProjectSignal.set(mockProject);
    isDeleteModalOpenSignal.set(true);
    fixture.detectChanges();

    component.onDelete();

    expect(pmMock.deleteProject).toHaveBeenCalledWith("proj-1");
    expect(pmMock.closeModals).toHaveBeenCalled();
  });

  it("should display error message on delete failure", () => {
    pmMock.deleteProject.mockReturnValue(
      throwError(() => ({ error: { detail: "Project has assigned tasks." } })),
    );

    selectedProjectSignal.set(mockProject);
    isDeleteModalOpenSignal.set(true);
    fixture.detectChanges();

    component.onDelete();

    expect(component.isDeleting()).toBe(false);
    expect(component.errorMessage()).toBe("Project has assigned tasks.");
  });

  it("should close modal on onClose", () => {
    isDeleteModalOpenSignal.set(true);
    fixture.detectChanges();

    component.onClose();
    expect(pmMock.closeModals).toHaveBeenCalled();
  });
});
