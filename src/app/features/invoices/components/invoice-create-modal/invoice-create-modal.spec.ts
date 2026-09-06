import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientResponse } from "../../../../core/api/models/client.models";
import { InvoiceManagement } from "../../services/invoice-management";
import { InvoiceCreateModal } from "./invoice-create-modal";

describe("InvoiceCreateModal", () => {
  let component: InvoiceCreateModal;
  let fixture: ComponentFixture<InvoiceCreateModal>;
  let isCreateModalOpenSignal: WritableSignal<boolean>;
  let clientsSignal: WritableSignal<ClientResponse[]>;
  let isSubmittingSignal: WritableSignal<boolean>;
  let mutationErrorSignal: WritableSignal<string | null>;
  let createInvoiceMock: ReturnType<typeof vi.fn>;
  let closeModalsMock: ReturnType<typeof vi.fn>;

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

  beforeEach(async () => {
    isCreateModalOpenSignal = signal(true);
    clientsSignal = signal(mockClients);
    isSubmittingSignal = signal(false);
    mutationErrorSignal = signal(null);
    createInvoiceMock = vi.fn().mockReturnValue(of({}));
    closeModalsMock = vi.fn();

    const invoiceManagementMock = {
      isCreateModalOpen: isCreateModalOpenSignal,
      clients: clientsSignal,
      isSubmitting: isSubmittingSignal,
      mutationError: mutationErrorSignal,
      createInvoice: createInvoiceMock,
      closeModals: closeModalsMock,
    };

    await TestBed.configureTestingModule({
      imports: [InvoiceCreateModal],
      providers: [{ provide: InvoiceManagement, useValue: invoiceManagementMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceCreateModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component and initialize client to first client", () => {
    expect(component).toBeTruthy();
    expect(component.clientId()).toBe("client-1");
    expect(component.status()).toBe("DRAFT");
    expect(component.isClientValid()).toBe(true);
  });

  it("should trigger createInvoice on submit", () => {
    component.onSubmit();
    expect(createInvoiceMock).toHaveBeenCalledWith({
      clientId: "client-1",
      status: "DRAFT",
    });
  });

  it("should update status when onStatusChange is called", () => {
    component.onStatusChange("SENT");
    expect(component.status()).toBe("SENT");
  });

  it("should close modal when onClose is called", () => {
    component.onClose();
    expect(closeModalsMock).toHaveBeenCalled();
  });
});
