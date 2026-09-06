import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvoiceResponse } from "../../../../core/api/models/invoice.models";
import { InvoiceManagement } from "../../services/invoice-management";
import { InvoiceDeleteModal } from "./invoice-delete-modal";

describe("InvoiceDeleteModal", () => {
  let component: InvoiceDeleteModal;
  let fixture: ComponentFixture<InvoiceDeleteModal>;
  let isDeleteModalOpenSignal: WritableSignal<boolean>;
  let selectedInvoiceSignal: WritableSignal<InvoiceResponse | null>;
  let isSubmittingSignal: WritableSignal<boolean>;
  let mutationErrorSignal: WritableSignal<string | null>;
  let deleteInvoiceMock: ReturnType<typeof vi.fn>;
  let closeModalsMock: ReturnType<typeof vi.fn>;

  const mockInvoice: InvoiceResponse = {
    id: "inv-1111-aaaa",
    clientId: "client-1",
    totalAmount: 1500,
    status: "DRAFT",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  };

  beforeEach(async () => {
    isDeleteModalOpenSignal = signal(true);
    selectedInvoiceSignal = signal(mockInvoice);
    isSubmittingSignal = signal(false);
    mutationErrorSignal = signal(null);
    deleteInvoiceMock = vi.fn();
    closeModalsMock = vi.fn();

    const invoiceManagementMock = {
      isDeleteModalOpen: isDeleteModalOpenSignal,
      selectedInvoice: selectedInvoiceSignal,
      isSubmitting: isSubmittingSignal,
      mutationError: mutationErrorSignal,
      clientMap: signal(new Map([["client-1", { id: "client-1", name: "Acme Corp" }]])),
      deleteInvoice: deleteInvoiceMock,
      closeModals: closeModalsMock,
    };

    await TestBed.configureTestingModule({
      imports: [InvoiceDeleteModal],
      providers: [{ provide: InvoiceManagement, useValue: invoiceManagementMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceDeleteModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component and resolve client name", () => {
    expect(component).toBeTruthy();
    expect(component.clientName()).toBe("Acme Corp");
  });

  it("should trigger deleteInvoice on onDelete", () => {
    component.onDelete();
    expect(deleteInvoiceMock).toHaveBeenCalledWith("inv-1111-aaaa");
  });

  it("should trigger closeModals on onClose", () => {
    component.onClose();
    expect(closeModalsMock).toHaveBeenCalled();
  });
});
