import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientResponse } from "../../../../core/api/models/client.models";
import { ClientManagement } from "../../services/client-management";
import { ClientDeleteModal } from "./client-delete-modal";

describe("ClientDeleteModal", () => {
  let component: ClientDeleteModal;
  let fixture: ComponentFixture<ClientDeleteModal>;
  let isDeleteModalOpenSignal: WritableSignal<boolean>;
  let selectedClientSignal: WritableSignal<ClientResponse | null>;
  let cmMock: {
    isDeleteModalOpen: WritableSignal<boolean>;
    selectedClient: WritableSignal<ClientResponse | null>;
    closeModals: ReturnType<typeof vi.fn>;
    deleteClient: ReturnType<typeof vi.fn>;
  };

  const mockClient: ClientResponse = {
    id: "c-123",
    name: "Acme Corp",
    email: "contact@acme.com",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  beforeEach(async () => {
    isDeleteModalOpenSignal = signal(true);
    selectedClientSignal = signal<ClientResponse | null>(mockClient);

    cmMock = {
      isDeleteModalOpen: isDeleteModalOpenSignal,
      selectedClient: selectedClientSignal,
      closeModals: vi.fn(),
      deleteClient: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [ClientDeleteModal],
      providers: [{ provide: ClientManagement, useValue: cmMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientDeleteModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component and bind client info", () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(true);
    expect(component.client()).toEqual(mockClient);
  });

  it("should close modal via onClose if not deleting", () => {
    component.onClose();
    expect(cmMock.closeModals).toHaveBeenCalled();
  });

  it("should not close modal via onClose if deleting", () => {
    component.isDeleting.set(true);
    component.onClose();
    expect(cmMock.closeModals).not.toHaveBeenCalled();
  });

  it("should perform deletion and close modal on success", () => {
    component.onDelete();

    expect(cmMock.deleteClient).toHaveBeenCalledWith("c-123");
    expect(component.isDeleting()).toBe(false);
    expect(cmMock.closeModals).toHaveBeenCalled();
  });

  it("should handle error when delete fails with detail", () => {
    cmMock.deleteClient.mockReturnValue(
      throwError(() => ({ error: { detail: "Cannot delete client with active projects" } })),
    );

    component.onDelete();

    expect(component.isDeleting()).toBe(false);
    expect(component.errorMessage()).toBe("Cannot delete client with active projects");
  });

  it("should handle generic Error instance on failure", () => {
    cmMock.deleteClient.mockReturnValue(throwError(() => new Error("Network error")));

    component.onDelete();

    expect(component.isDeleting()).toBe(false);
    expect(component.errorMessage()).toBe("Network error");
  });

  it("should do nothing in onDelete if client is null", () => {
    selectedClientSignal.set(null);
    component.onDelete();
    expect(cmMock.deleteClient).not.toHaveBeenCalled();
  });
});
