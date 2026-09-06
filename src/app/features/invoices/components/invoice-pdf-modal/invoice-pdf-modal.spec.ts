import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvoiceResponse } from "../../../../core/api/models/invoice.models";
import { InvoiceManagement } from "../../services/invoice-management";
import { InvoicePdfModal } from "./invoice-pdf-modal";

describe("InvoicePdfModal", () => {
  let component: InvoicePdfModal;
  let fixture: ComponentFixture<InvoicePdfModal>;
  let isPdfModalOpenSignal: WritableSignal<boolean>;
  let selectedInvoiceSignal: WritableSignal<InvoiceResponse | null>;
  let pdfBlobUrlSignal: WritableSignal<string | null>;
  let isDownloadingPdfSignal: WritableSignal<boolean>;
  let downloadPdfMock: ReturnType<typeof vi.fn>;
  let closeModalsMock: ReturnType<typeof vi.fn>;
  let cleanupPdfBlobMock: ReturnType<typeof vi.fn>;

  const mockInvoice: InvoiceResponse = {
    id: "inv-1111-aaaa",
    clientId: "client-1",
    totalAmount: 1500,
    status: "DRAFT",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  };

  beforeEach(async () => {
    isPdfModalOpenSignal = signal(true);
    selectedInvoiceSignal = signal(mockInvoice);
    pdfBlobUrlSignal = signal("blob:http://localhost/mock-blob");
    isDownloadingPdfSignal = signal(false);
    downloadPdfMock = vi.fn();
    closeModalsMock = vi.fn();
    cleanupPdfBlobMock = vi.fn();

    const invoiceManagementMock = {
      isPdfModalOpen: isPdfModalOpenSignal,
      selectedInvoice: selectedInvoiceSignal,
      pdfBlobUrl: pdfBlobUrlSignal,
      isDownloadingPdf: isDownloadingPdfSignal,
      downloadPdf: downloadPdfMock,
      closeModals: closeModalsMock,
      cleanupPdfBlob: cleanupPdfBlobMock,
    };

    await TestBed.configureTestingModule({
      imports: [InvoicePdfModal],
      providers: [{ provide: InvoiceManagement, useValue: invoiceManagementMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicePdfModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component and sanitize URL", () => {
    expect(component).toBeTruthy();
    expect(component.safePdfUrl()).toBeDefined();
  });

  it("should return null for safePdfUrl if url is not a blob: scheme", () => {
    pdfBlobUrlSignal.set("javascript:alert(1)");
    expect(component.safePdfUrl()).toBeNull();

    pdfBlobUrlSignal.set(null);
    expect(component.safePdfUrl()).toBeNull();
  });

  it("should trigger downloadPdf on onDownload", () => {
    component.onDownload();
    expect(downloadPdfMock).toHaveBeenCalledWith(mockInvoice);
  });

  it("should trigger closeModals on onClose", () => {
    component.onClose();
    expect(closeModalsMock).toHaveBeenCalled();
  });

  it("should cleanup PDF blob on destruction", () => {
    fixture.destroy();
    expect(cleanupPdfBlobMock).toHaveBeenCalled();
  });
});
