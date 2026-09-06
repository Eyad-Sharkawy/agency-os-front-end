import { signal, WritableSignal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientResponse } from "../../../core/api/models/client.models";
import { InvoiceRequest, InvoiceResponse } from "../../../core/api/models/invoice.models";
import { ClientApi } from "../../../core/api/services/client/client-api";
import { InvoiceApi } from "../../../core/api/services/invoice/invoice-api";
import { WorkspaceStore } from "../../../core/multitenancy/workspace.store";
import { InvoiceManagement } from "./invoice-management";

describe("InvoiceManagement", () => {
  let service: InvoiceManagement;
  let router: Router;
  let invoiceApiMock: {
    getInvoices: ReturnType<typeof vi.fn>;
    getInvoiceById: ReturnType<typeof vi.fn>;
    createInvoice: ReturnType<typeof vi.fn>;
    updateInvoice: ReturnType<typeof vi.fn>;
    deleteInvoice: ReturnType<typeof vi.fn>;
    downloadInvoicePdf: ReturnType<typeof vi.fn>;
  };
  let clientApiMock: {
    getClients: ReturnType<typeof vi.fn>;
  };
  let activeWorkspaceSignal: WritableSignal<{ role: string; tenantId: string } | null>;
  let activeTenantIdSignal: WritableSignal<string | null>;
  let workspaceStoreMock: {
    activeWorkspace: WritableSignal<{ role: string; tenantId: string } | null>;
    activeTenantId: WritableSignal<string | null>;
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
    {
      id: "client-2",
      name: "Globex Ltd",
      email: "info@globex.com",
      status: "ACTIVE",
      createdAt: "2026-01-02T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    },
  ];

  const mockInvoices: InvoiceResponse[] = [
    {
      id: "inv-1111-aaaa",
      clientId: "client-1",
      totalAmount: 1500,
      status: "DRAFT",
      createdAt: "2026-02-01T10:00:00Z",
      updatedAt: "2026-02-01T10:00:00Z",
    },
    {
      id: "inv-2222-bbbb",
      clientId: "client-2",
      totalAmount: 3200,
      status: "SENT",
      createdAt: "2026-02-05T10:00:00Z",
      updatedAt: "2026-02-05T10:00:00Z",
    },
    {
      id: "inv-3333-cccc",
      clientId: "client-1",
      totalAmount: 4800,
      status: "PAID",
      createdAt: "2026-01-15T10:00:00Z",
      updatedAt: "2026-01-20T10:00:00Z",
    },
    {
      id: "inv-4444-dddd",
      clientId: "client-2",
      totalAmount: 850,
      status: "OVERDUE",
      createdAt: "2026-01-01T10:00:00Z",
      updatedAt: "2026-01-01T10:00:00Z",
    },
  ];

  beforeEach(() => {
    activeWorkspaceSignal = signal<{ role: string; tenantId: string } | null>({
      role: "OWNER",
      tenantId: "tenant-1",
    });
    activeTenantIdSignal = signal<string | null>("tenant-1");

    invoiceApiMock = {
      getInvoices: vi.fn().mockReturnValue(of(mockInvoices)),
      getInvoiceById: vi
        .fn()
        .mockImplementation((id: string) =>
          of(mockInvoices.find(i => i.id === id) || mockInvoices[0]),
        ),
      createInvoice: vi.fn(),
      updateInvoice: vi.fn(),
      deleteInvoice: vi.fn(),
      downloadInvoicePdf: vi
        .fn()
        .mockReturnValue(of(new Blob(["%PDF"], { type: "application/pdf" }))),
    };

    clientApiMock = {
      getClients: vi.fn().mockReturnValue(of(mockClients)),
    };

    workspaceStoreMock = {
      activeWorkspace: activeWorkspaceSignal,
      activeTenantId: activeTenantIdSignal,
    };

    TestBed.configureTestingModule({
      providers: [
        InvoiceManagement,
        provideRouter([]),
        { provide: InvoiceApi, useValue: invoiceApiMock },
        { provide: ClientApi, useValue: clientApiMock },
        { provide: WorkspaceStore, useValue: workspaceStoreMock },
      ],
    });

    service = TestBed.inject(InvoiceManagement);
    router = TestBed.inject(Router);
    vi.spyOn(router, "navigate").mockResolvedValue(true);
  });

  describe("Role Permissions", () => {
    it("should allow OWNER full permissions", () => {
      activeWorkspaceSignal.set({ role: "OWNER", tenantId: "tenant-1" });
      expect(service.canCreate()).toBe(true);
      expect(service.canEdit()).toBe(true);
      expect(service.canDelete()).toBe(true);
      expect(service.isReadOnly()).toBe(false);
    });

    it("should restrict ADMIN to view-only (no create/edit/delete)", () => {
      activeWorkspaceSignal.set({ role: "ADMIN", tenantId: "tenant-1" });
      expect(service.canCreate()).toBe(false);
      expect(service.canEdit()).toBe(false);
      expect(service.canDelete()).toBe(false);
      expect(service.isReadOnly()).toBe(false);
    });

    it("should treat CLIENT as readOnly", () => {
      activeWorkspaceSignal.set({ role: "CLIENT", tenantId: "tenant-1" });
      expect(service.canCreate()).toBe(false);
      expect(service.canEdit()).toBe(false);
      expect(service.canDelete()).toBe(false);
      expect(service.isReadOnly()).toBe(true);
    });
  });

  describe("loadInvoices", () => {
    it("should fetch invoices and clients and update signals", () => {
      service.loadInvoices();

      expect(service.isLoading()).toBe(false);
      expect(service.invoices()).toEqual(mockInvoices);
      expect(service.clients()).toEqual(mockClients);
      expect(service.errorMessage()).toBeNull();
    });

    it("should calculate correct financial stats including VOID", () => {
      const invoicesWithVoid: InvoiceResponse[] = [
        ...mockInvoices,
        {
          id: "inv-5555-eeee",
          clientId: "client-1",
          totalAmount: 500,
          status: "VOID",
          createdAt: "2026-01-01T10:00:00Z",
          updatedAt: "2026-01-01T10:00:00Z",
        },
      ];
      invoiceApiMock.getInvoices.mockReturnValue(of(invoicesWithVoid));
      service.loadInvoices();
      const stats = service.stats();

      expect(stats.totalCount).toBe(5);
      expect(stats.voidCount).toBe(1);
    });

    it("should handle client role in loadInvoices", () => {
      activeWorkspaceSignal.set({ role: "CLIENT", tenantId: "tenant-1" });
      service.loadInvoices();
      expect(service.clients()).toEqual([]);
      expect(clientApiMock.getClients).not.toHaveBeenCalled();
    });

    it("should handle getClients failure gracefully in loadInvoices", () => {
      clientApiMock.getClients.mockReturnValue(throwError(() => new Error("Client load fail")));
      service.loadInvoices();
      expect(service.clients()).toEqual([]);
      expect(service.invoices()).toEqual(mockInvoices);
    });

    it("should handle loading error gracefully", () => {
      invoiceApiMock.getInvoices.mockReturnValue(
        throwError(() => ({ error: { detail: "Database offline" } })),
      );

      service.loadInvoices();

      expect(service.isLoading()).toBe(false);
      expect(service.errorMessage()).toBe("Database offline");
    });
  });

  describe("Filtering & Search", () => {
    beforeEach(() => {
      service.loadInvoices();
    });

    it("should filter by status", () => {
      service.setStatusFilter("PAID");
      const filtered = service.filteredInvoices();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("inv-3333-cccc");
    });

    it("should filter by client", () => {
      service.setClientFilter("client-2");
      const filtered = service.filteredInvoices();
      expect(filtered).toHaveLength(2);
      expect(filtered.every(i => i.clientId === "client-2")).toBe(true);
    });

    it("should search by client name", () => {
      service.setSearchQuery("globex");
      const filtered = service.filteredInvoices();
      expect(filtered).toHaveLength(2);
      expect(filtered.every(i => i.clientId === "client-2")).toBe(true);
    });

    it("should search by invoice ID", () => {
      service.setSearchQuery("1111");
      const filtered = service.filteredInvoices();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("inv-1111-aaaa");
    });

    it("should clear filters", () => {
      service.setSearchQuery("test");
      service.setStatusFilter("DRAFT");
      service.setClientFilter("client-1");

      service.clearFilters();

      expect(service.searchQuery()).toBe("");
      expect(service.statusFilter()).toBe("ALL");
      expect(service.clientFilter()).toBe("ALL");
    });
  });

  describe("createInvoice", () => {
    it("should post new invoice and prepend to invoices signal", () => {
      const payload: InvoiceRequest = { clientId: "client-1", status: "DRAFT" };
      const newInv: InvoiceResponse = {
        id: "inv-new",
        clientId: "client-1",
        totalAmount: 2000,
        status: "DRAFT",
        createdAt: "2026-03-01T00:00:00Z",
        updatedAt: "2026-03-01T00:00:00Z",
      };
      invoiceApiMock.createInvoice.mockReturnValue(of(newInv));

      service.createInvoice(payload).subscribe(res => {
        expect(res).toEqual(newInv);
      });

      expect(invoiceApiMock.createInvoice).toHaveBeenCalledWith(payload);
      expect(service.invoices()[0]).toEqual(newInv);
      expect(service.isSubmitting()).toBe(false);
    });

    it("should set mutationError when createInvoice fails", () => {
      const payload: InvoiceRequest = { clientId: "client-1", status: "DRAFT" };
      invoiceApiMock.createInvoice.mockReturnValue(
        throwError(() => ({
          error: { detail: "No uninvoiced billable time entries found for client" },
        })),
      );

      service.createInvoice(payload).subscribe({
        error: (err: unknown) => {
          expect(err).toBeDefined();
        },
      });

      expect(service.mutationError()).toBe("No uninvoiced billable time entries found for client");
      expect(service.isSubmitting()).toBe(false);
    });
  });

  describe("updateStatus", () => {
    it("should update status in signal when successful", () => {
      service.loadInvoices();
      const target = mockInvoices[0];
      const updatedInv: InvoiceResponse = { ...target, status: "PAID" };
      invoiceApiMock.updateInvoice.mockReturnValue(of(updatedInv));

      service.updateStatus(target, "PAID");

      expect(invoiceApiMock.updateInvoice).toHaveBeenCalledWith(target.id, {
        clientId: target.clientId,
        status: "PAID",
      });
      const found = service.invoices().find(i => i.id === target.id);
      expect(found?.status).toBe("PAID");
    });

    it("should handle updateStatus error gracefully", () => {
      service.loadInvoices();
      const target = mockInvoices[0];
      invoiceApiMock.updateInvoice.mockReturnValue(
        throwError(() => ({ error: { detail: "Failed to update status" } })),
      );

      service.updateStatus(target, "SENT");

      expect(service.actionLoading()).toBe(false);
      expect(service.errorMessage()).toBe("Failed to update status");
    });

    it("should do nothing if canEdit is false", () => {
      activeWorkspaceSignal.set({ role: "ADMIN", tenantId: "tenant-1" });
      service.updateStatus(mockInvoices[0], "PAID");
      expect(invoiceApiMock.updateInvoice).not.toHaveBeenCalled();
    });
  });

  describe("deleteInvoice", () => {
    it("should delete invoice and remove from invoices signal", () => {
      service.loadInvoices();
      invoiceApiMock.deleteInvoice.mockReturnValue(of(void 0));

      service.deleteInvoice("inv-1111-aaaa");

      expect(invoiceApiMock.deleteInvoice).toHaveBeenCalledWith("inv-1111-aaaa");
      expect(service.invoices().some(i => i.id === "inv-1111-aaaa")).toBe(false);
    });

    it("should handle deleteInvoice error gracefully", () => {
      invoiceApiMock.deleteInvoice.mockReturnValue(
        throwError(() => ({ error: { detail: "Failed to delete" } })),
      );

      service.deleteInvoice("inv-1111-aaaa");

      expect(service.isSubmitting()).toBe(false);
      expect(service.mutationError()).toBe("Failed to delete");
    });

    it("should do nothing if canDelete is false", () => {
      activeWorkspaceSignal.set({ role: "ADMIN", tenantId: "tenant-1" });
      service.deleteInvoice("inv-1111-aaaa");
      expect(invoiceApiMock.deleteInvoice).not.toHaveBeenCalled();
    });
  });

  describe("downloadPdf & fetchPdfBlob", () => {
    it("should call invoiceApi.downloadInvoicePdf and trigger download", () => {
      const createObjectURLSpy = vi.fn().mockReturnValue("blob:http://localhost/mock-blob");
      const revokeObjectURLSpy = vi.fn();
      window.URL.createObjectURL = createObjectURLSpy;
      window.URL.revokeObjectURL = revokeObjectURLSpy;

      service.downloadPdf(mockInvoices[0]);

      expect(invoiceApiMock.downloadInvoicePdf).toHaveBeenCalledWith(mockInvoices[0].id);
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });

    it("should handle downloadPdf error", () => {
      invoiceApiMock.downloadInvoicePdf.mockReturnValue(
        throwError(() => ({ error: { detail: "Failed PDF export" } })),
      );

      service.downloadPdf(mockInvoices[0]);

      expect(service.isDownloadingPdf()).toBe(false);
      expect(service.errorMessage()).toBe("Failed PDF export");
    });

    it("should fetchPdfBlob and set pdfBlobUrl", () => {
      const createObjectURLSpy = vi.fn().mockReturnValue("blob:http://localhost/mock-blob-2");
      window.URL.createObjectURL = createObjectURLSpy;

      service.fetchPdfBlob("inv-1111-aaaa");

      expect(invoiceApiMock.downloadInvoicePdf).toHaveBeenCalledWith("inv-1111-aaaa");
      expect(service.pdfBlobUrl()).toBe("blob:http://localhost/mock-blob-2");
    });

    it("should handle fetchPdfBlob error", () => {
      invoiceApiMock.downloadInvoicePdf.mockReturnValue(
        throwError(() => ({ error: { detail: "PDF fetch error" } })),
      );

      service.fetchPdfBlob("inv-1111-aaaa");

      expect(service.errorMessage()).toBe("PDF fetch error");
    });

    it("should revoke and reset pdfBlobUrl in cleanupPdfBlob", () => {
      const revokeObjectURLSpy = vi.fn();
      window.URL.revokeObjectURL = revokeObjectURLSpy;
      service.pdfBlobUrl.set("blob:http://localhost/old-blob");

      service.cleanupPdfBlob();

      expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:http://localhost/old-blob");
      expect(service.pdfBlobUrl()).toBeNull();
    });
  });

  describe("Modal navigation helpers", () => {
    it("should navigate with queryParams when openCreateModal is called", () => {
      service.openCreateModal();
      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: expect.anything(),
        queryParams: { action: "create" },
        queryParamsHandling: "merge",
      });
    });

    it("should not navigate on openCreateModal if canCreate is false", () => {
      activeWorkspaceSignal.set({ role: "ADMIN", tenantId: "tenant-1" });
      service.openCreateModal();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it("should navigate with queryParams when openDeleteModal is called", () => {
      service.openDeleteModal(mockInvoices[0]);
      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: expect.anything(),
        queryParams: { action: "delete", invoiceId: mockInvoices[0].id },
        queryParamsHandling: "merge",
      });
    });

    it("should not navigate on openDeleteModal if canDelete is false", () => {
      activeWorkspaceSignal.set({ role: "ADMIN", tenantId: "tenant-1" });
      service.openDeleteModal(mockInvoices[0]);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it("should navigate with queryParams when openPdfModal is called", () => {
      service.openPdfModal(mockInvoices[0]);
      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: expect.anything(),
        queryParams: { action: "view-pdf", invoiceId: mockInvoices[0].id },
        queryParamsHandling: "merge",
      });
    });

    it("should clear action and invoiceId on closeModals", () => {
      service.closeModals();
      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: expect.anything(),
        queryParams: { action: null, invoiceId: null },
        queryParamsHandling: "merge",
      });
    });
  });

  describe("syncUrlActionState", () => {
    const callSync = (params?: Record<string, unknown>) =>
      (
        service as unknown as { syncUrlActionState: (p?: Record<string, unknown>) => void }
      ).syncUrlActionState(params);

    it("should open create modal when action is create and user can create", () => {
      callSync({ action: "create" });
      expect(service.isCreateModalOpen()).toBe(true);
      expect(service.selectedInvoice()).toBeNull();
    });

    it("should close modals if action is create but user cannot create", () => {
      activeWorkspaceSignal.set({ role: "ADMIN", tenantId: "tenant-1" });
      callSync({ action: "create" });
      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: expect.anything(),
        queryParams: { action: null, invoiceId: null },
        queryParamsHandling: "merge",
      });
    });

    it("should close modals if action is delete but user cannot delete", () => {
      activeWorkspaceSignal.set({ role: "ADMIN", tenantId: "tenant-1" });
      callSync({ action: "delete", invoiceId: mockInvoices[0].id });
      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: expect.anything(),
        queryParams: { action: null, invoiceId: null },
        queryParamsHandling: "merge",
      });
    });

    it("should open delete modal when invoice is in loaded invoices", () => {
      service.loadInvoices();
      callSync({ action: "delete", invoiceId: mockInvoices[0].id });
      expect(service.isDeleteModalOpen()).toBe(true);
      expect(service.selectedInvoice()?.id).toBe(mockInvoices[0].id);
    });

    it("should open pdf modal and fetch blob when invoice is in loaded invoices", () => {
      service.loadInvoices();
      callSync({ action: "view-pdf", invoiceId: mockInvoices[0].id });
      expect(service.isPdfModalOpen()).toBe(true);
      expect(service.selectedInvoice()?.id).toBe(mockInvoices[0].id);
      expect(invoiceApiMock.downloadInvoicePdf).toHaveBeenCalledWith(mockInvoices[0].id);
    });

    it("should fetch invoice by ID if not currently in invoices signal", () => {
      const singleInv = { ...mockInvoices[0], id: "inv-remote" };
      invoiceApiMock.getInvoiceById.mockReturnValue(of(singleInv));

      callSync({ action: "view-pdf", invoiceId: "inv-remote" });

      expect(invoiceApiMock.getInvoiceById).toHaveBeenCalledWith("inv-remote");
      expect(service.selectedInvoice()?.id).toBe("inv-remote");
      expect(service.isPdfModalOpen()).toBe(true);
    });

    it("should close modals if getInvoiceById fails", () => {
      invoiceApiMock.getInvoiceById.mockReturnValue(throwError(() => new Error("Not found")));

      callSync({ action: "view-pdf", invoiceId: "inv-not-found" });

      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: expect.anything(),
        queryParams: { action: null, invoiceId: null },
        queryParamsHandling: "merge",
      });
    });

    it("should reset modal signals when action is missing and modal was open", () => {
      service.isCreateModalOpen.set(true);
      callSync({});
      expect(service.isCreateModalOpen()).toBe(false);
      expect(service.selectedInvoice()).toBeNull();
    });
  });
});
