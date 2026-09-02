import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientResponse } from "../../../../core/api/models/client.models";
import { ProjectResponse } from "../../../../core/api/models/project.models";
import { ProjectManagement } from "../../services/project-management";
import { ProjectModal } from "./project-modal";

describe("ProjectModal", () => {
  let component: ProjectModal;
  let fixture: ComponentFixture<ProjectModal>;
  let isCreateModalOpenSignal: WritableSignal<boolean>;
  let isEditModalOpenSignal: WritableSignal<boolean>;
  let selectedProjectSignal: WritableSignal<ProjectResponse | null>;
  let clientsSignal: WritableSignal<ClientResponse[]>;

  let pmMock: {
    isCreateModalOpen: WritableSignal<boolean>;
    isEditModalOpen: WritableSignal<boolean>;
    selectedProject: WritableSignal<ProjectResponse | null>;
    clients: WritableSignal<ClientResponse[]>;
    createProject: ReturnType<typeof vi.fn>;
    updateProject: ReturnType<typeof vi.fn>;
    closeModals: ReturnType<typeof vi.fn>;
  };

  const mockClients: ClientResponse[] = [
    {
      id: "client-1",
      name: "Acme Corp",
      email: "contact@acme.com",
      status: "ACTIVE",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];

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
    isCreateModalOpenSignal = signal(false);
    isEditModalOpenSignal = signal(false);
    selectedProjectSignal = signal<ProjectResponse | null>(null);
    clientsSignal = signal<ClientResponse[]>(mockClients);

    pmMock = {
      isCreateModalOpen: isCreateModalOpenSignal,
      isEditModalOpen: isEditModalOpenSignal,
      selectedProject: selectedProjectSignal,
      clients: clientsSignal,
      createProject: vi.fn().mockReturnValue(of(mockProject)),
      updateProject: vi.fn().mockReturnValue(of(mockProject)),
      closeModals: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectModal],
      providers: [{ provide: ProjectManagement, useValue: pmMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should not render when closed", () => {
    expect(component.isOpen()).toBe(false);
    const dialog = fixture.nativeElement.querySelector("dialog");
    expect(dialog).toBeNull();
  });

  it("should initialize with default empty values in create mode", () => {
    isCreateModalOpenSignal.set(true);
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    expect(component.isEditMode()).toBe(false);
    expect(component.name()).toBe("");
    expect(component.clientId()).toBe("client-1");
    expect(component.status()).toBe("PLANNING");
  });

  it("should populate fields when in edit mode", () => {
    selectedProjectSignal.set(mockProject);
    isEditModalOpenSignal.set(true);
    fixture.detectChanges();

    expect(component.isEditMode()).toBe(true);
    expect(component.name()).toBe("Alpha Redesign");
    expect(component.description()).toBe("Design revamp");
    expect(component.budget()).toBe(15000);
    expect(component.billingRate()).toBe(150);
    expect(component.status()).toBe("IN_PROGRESS");
    expect(component.clientId()).toBe("client-1");
  });

  it("should validate form properly", () => {
    isCreateModalOpenSignal.set(true);
    fixture.detectChanges();

    component.name.set("A");
    expect(component.isNameValid()).toBe(false);

    component.name.set("Valid Project Name");
    expect(component.isNameValid()).toBe(true);

    component.clientId.set("");
    expect(component.isClientValid()).toBe(false);

    component.clientId.set("client-1");
    expect(component.isClientValid()).toBe(true);

    component.billingRate.set(-10);
    expect(component.isRateValid()).toBe(false);

    component.billingRate.set(120);
    expect(component.isRateValid()).toBe(true);

    expect(component.isFormValid()).toBe(true);
  });

  it("should submit create project and close modal", () => {
    isCreateModalOpenSignal.set(true);
    fixture.detectChanges();

    component.name.set("New Mobile App");
    component.description.set("iOS & Android");
    component.clientId.set("client-1");
    component.budget.set(20000);
    component.billingRate.set(160);
    component.status.set("PLANNING");

    component.onSubmit();

    expect(pmMock.createProject).toHaveBeenCalledWith({
      name: "New Mobile App",
      description: "iOS & Android",
      clientId: "client-1",
      status: "PLANNING",
      budget: 20000,
      billingRate: 160,
    });
    expect(pmMock.closeModals).toHaveBeenCalled();
  });

  it("should submit update project when in edit mode", () => {
    selectedProjectSignal.set(mockProject);
    isEditModalOpenSignal.set(true);
    fixture.detectChanges();

    component.name.set("Alpha Redesign Updated");
    component.onSubmit();

    expect(pmMock.updateProject).toHaveBeenCalledWith(
      "proj-1",
      expect.objectContaining({
        name: "Alpha Redesign Updated",
      }),
    );
    expect(pmMock.closeModals).toHaveBeenCalled();
  });

  it("should handle submission error", () => {
    pmMock.createProject.mockReturnValue(
      throwError(() => ({ error: { detail: "Name already exists." } })),
    );

    isCreateModalOpenSignal.set(true);
    fixture.detectChanges();

    component.name.set("Duplicate Name");
    component.clientId.set("client-1");
    component.billingRate.set(100);

    component.onSubmit();

    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBe("Name already exists.");
  });

  it("should close modal on onClose", () => {
    isCreateModalOpenSignal.set(true);
    fixture.detectChanges();

    component.onClose();
    expect(pmMock.closeModals).toHaveBeenCalled();
  });
});
