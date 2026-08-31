import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientResponse } from "../../../../core/api/models/client.models";
import { ClientManagement } from "../../services/client-management";
import { ClientModal } from "./client-modal";

describe("ClientModal", () => {
  let component: ClientModal;
  let fixture: ComponentFixture<ClientModal>;
  let isCreateModalOpenSignal: WritableSignal<boolean>;
  let isEditModalOpenSignal: WritableSignal<boolean>;
  let selectedClientSignal: WritableSignal<ClientResponse | null>;
  let cmMock: {
    isCreateModalOpen: WritableSignal<boolean>;
    isEditModalOpen: WritableSignal<boolean>;
    selectedClient: WritableSignal<ClientResponse | null>;
    closeModals: ReturnType<typeof vi.fn>;
    createClient: ReturnType<typeof vi.fn>;
    updateClient: ReturnType<typeof vi.fn>;
  };

  const mockClient: ClientResponse = {
    id: "c-1",
    name: "Acme Corp",
    email: "contact@acme.com",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  beforeEach(async () => {
    isCreateModalOpenSignal = signal(true);
    isEditModalOpenSignal = signal(false);
    selectedClientSignal = signal<ClientResponse | null>(null);

    cmMock = {
      isCreateModalOpen: isCreateModalOpenSignal,
      isEditModalOpen: isEditModalOpenSignal,
      selectedClient: selectedClientSignal,
      closeModals: vi.fn(),
      createClient: vi.fn().mockReturnValue(of(mockClient)),
      updateClient: vi.fn().mockReturnValue(of(mockClient)),
    };

    await TestBed.configureTestingModule({
      imports: [ClientModal],
      providers: [{ provide: ClientManagement, useValue: cmMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(true);
    expect(component.isEditMode()).toBe(false);
  });

  it("should validate form inputs correctly", () => {
    component.name.set("");
    component.email.set("");
    expect(component.isFormValid()).toBe(false);

    component.name.set("A");
    component.email.set("invalid-email");
    expect(component.isFormValid()).toBe(false);

    component.name.set("Acme Corp");
    component.email.set("billing@acme.com");
    expect(component.isFormValid()).toBe(true);
  });

  it("should submit create client when in create mode", () => {
    component.name.set("New Client");
    component.email.set("new@client.com");
    component.status.set("ACTIVE");

    component.onSubmit();

    expect(cmMock.createClient).toHaveBeenCalledWith({
      name: "New Client",
      email: "new@client.com",
      status: "ACTIVE",
    });
    expect(cmMock.closeModals).toHaveBeenCalled();
  });

  it("should handle error when creation fails", () => {
    cmMock.createClient.mockReturnValue(
      throwError(() => ({ error: { detail: "Email already exists" } })),
    );

    component.name.set("New Client");
    component.email.set("new@client.com");

    component.onSubmit();

    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBe("Email already exists");
  });

  it("should close modal when onClose is called", () => {
    component.onClose();
    expect(cmMock.closeModals).toHaveBeenCalled();
  });

  it("should update status on status change", () => {
    component.onStatusChange("INACTIVE");
    expect(component.status()).toBe("INACTIVE");
  });

  it("should submit update client when in edit mode", () => {
    isCreateModalOpenSignal.set(false);
    isEditModalOpenSignal.set(true);
    selectedClientSignal.set(mockClient);
    fixture.detectChanges();

    component.name.set("Updated Acme");
    component.email.set("updated@acme.com");
    component.status.set("INACTIVE");

    component.onSubmit();

    expect(cmMock.updateClient).toHaveBeenCalledWith("c-1", {
      name: "Updated Acme",
      email: "updated@acme.com",
      status: "INACTIVE",
    });
    expect(cmMock.closeModals).toHaveBeenCalled();
  });

  it("should handle error when update fails", () => {
    isCreateModalOpenSignal.set(false);
    isEditModalOpenSignal.set(true);
    selectedClientSignal.set(mockClient);
    cmMock.updateClient.mockReturnValue(
      throwError(() => ({ error: { detail: "Update conflict" } })),
    );
    fixture.detectChanges();

    component.name.set("Updated Acme");
    component.email.set("updated@acme.com");

    component.onSubmit();

    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBe("Update conflict");
  });

  it("should handle generic Error in update failure", () => {
    isCreateModalOpenSignal.set(false);
    isEditModalOpenSignal.set(true);
    selectedClientSignal.set(mockClient);
    cmMock.updateClient.mockReturnValue(throwError(() => new Error("Network timeout")));
    fixture.detectChanges();

    component.name.set("Updated Acme");
    component.email.set("updated@acme.com");

    component.onSubmit();

    expect(component.errorMessage()).toBe("Network timeout");
  });
});
