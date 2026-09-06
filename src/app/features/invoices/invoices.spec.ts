import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientResponse } from "../../core/api/models/client.models";
import { InvoiceResponse } from "../../core/api/models/invoice.models";
import { WorkspaceStore } from "../../core/multitenancy/workspace.store";
import { InvoicesComponent } from "./invoices";
import {
  InvoiceFilterStatus,
  InvoiceManagement,
  InvoiceViewMode,
} from "./services/invoice-management";

describe("InvoicesComponent", () => {
  let component: InvoicesComponent;
  let fixture: ComponentFixture<InvoicesComponent>;

  let invoicesSignal: WritableSignal<InvoiceResponse[]>;
  let clientsSignal: WritableSignal<ClientResponse[]>;
  let isLoadingSignal: WritableSignal<boolean>;
  let errorMessageSignal: WritableSignal<string | null>;
  let searchQuerySignal: WritableSignal<string>;
  let statusFilterSignal: WritableSignal<InvoiceFilterStatus>;
  let clientFilterSignal: WritableSignal<string>;
  let viewModeSignal: WritableSignal<InvoiceViewMode>;
  let canCreateSignal: WritableSignal<boolean>;
  let canEditSignal: WritableSignal<boolean>;
  let canDeleteSignal: WritableSignal<boolean>;
  let isReadOnlySignal: WritableSignal<boolean>;
  let activeWorkspaceSignal: ReturnType<typeof signal<{ role: string } | null>>;

  let loadInvoicesMock: ReturnType<typeof vi.fn>;
  let openCreateModalMock: ReturnType<typeof vi.fn>;
  let openDeleteModalMock: ReturnType<typeof vi.fn>;
  let openPdfModalMock: ReturnType<typeof vi.fn>;
  let downloadPdfMock: ReturnType<typeof vi.fn>;
  let updateStatusMock: ReturnType<typeof vi.fn>;
  let setSearchQueryMock: ReturnType<typeof vi.fn>;
  let setStatusFilterMock: ReturnType<typeof vi.fn>;
  let setClientFilterMock: ReturnType<typeof vi.fn>;
  let setViewModeMock: ReturnType<typeof vi.fn>;
  let clearFiltersMock: ReturnType<typeof vi.fn>;

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

  const mockInvoices: InvoiceResponse[] = [
    {
      id: "inv-1111-aaaa",
      clientId: "client-1",
      totalAmount: 1500,
      status: "DRAFT",
      createdAt: "2026-02-01T10:00:00Z",
      updatedAt: "2026-02-01T10:00:00Z",
    },
  ];

  beforeEach(async () => {
    invoicesSignal = signal(mockInvoices);
    clientsSignal = signal(mockClients);
    isLoadingSignal = signal(false);
    errorMessageSignal = signal(null);
    searchQuerySignal = signal("");
    statusFilterSignal = signal("ALL");
    clientFilterSignal = signal("ALL");
    viewModeSignal = signal("table");
    canCreateSignal = signal(true);
    canEditSignal = signal(true);
    canDeleteSignal = signal(true);
    isReadOnlySignal = signal(false);
    activeWorkspaceSignal = signal<{ role: string } | null>({ role: "OWNER" });

    loadInvoicesMock = vi.fn();
    openCreateModalMock = vi.fn();
    openDeleteModalMock = vi.fn();
    openPdfModalMock = vi.fn();
    downloadPdfMock = vi.fn();
    updateStatusMock = vi.fn();
    setSearchQueryMock = vi.fn();
    setStatusFilterMock = vi.fn();
    setClientFilterMock = vi.fn();
    setViewModeMock = vi.fn();
    clearFiltersMock = vi.fn();

    const invoiceManagementMock = {
      invoices: invoicesSignal,
      clients: clientsSignal,
      filteredInvoices: invoicesSignal,
      isLoading: isLoadingSignal,
      errorMessage: errorMessageSignal,
      searchQuery: searchQuerySignal,
      statusFilter: statusFilterSignal,
      clientFilter: clientFilterSignal,
      viewMode: viewModeSignal,
      canCreate: canCreateSignal,
      canEdit: canEditSignal,
      canDelete: canDeleteSignal,
      isReadOnly: isReadOnlySignal,
      isCreateModalOpen: signal(false),
      isDeleteModalOpen: signal(false),
      isPdfModalOpen: signal(false),
      selectedInvoice: signal(null),
      pdfBlobUrl: signal(null),
      isDownloadingPdf: signal(false),
      isSubmitting: signal(false),
      mutationError: signal(null),
      stats: signal({
        totalCount: 1,
        totalInvoiced: 1500,
        totalPaid: 0,
        totalOutstanding: 1500,
        totalOverdue: 0,
        draftCount: 1,
        sentCount: 0,
        paidCount: 0,
        overdueCount: 0,
        voidCount: 0,
      }),
      clientMap: signal(new Map([["client-1", mockClients[0]]])),
      loadInvoices: loadInvoicesMock,
      openCreateModal: openCreateModalMock,
      openDeleteModal: openDeleteModalMock,
      openPdfModal: openPdfModalMock,
      downloadPdf: downloadPdfMock,
      updateStatus: updateStatusMock,
      setSearchQuery: setSearchQueryMock,
      setStatusFilter: setStatusFilterMock,
      setClientFilter: setClientFilterMock,
      setViewMode: setViewModeMock,
      clearFilters: clearFiltersMock,
      closeModals: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [InvoicesComponent],
      providers: [
        provideRouter([]),
        { provide: InvoiceManagement, useValue: invoiceManagementMock },
        { provide: WorkspaceStore, useValue: { activeWorkspace: activeWorkspaceSignal } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component and call loadInvoices on init", () => {
    expect(component).toBeTruthy();
    expect(loadInvoicesMock).toHaveBeenCalled();
  });

  it("should render KPI summary ribbon and invoice item in table", () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("Invoices");
    expect(el.textContent).toContain("Generate Invoice");
    expect(el.textContent).toContain("Acme Corp");
    expect(el.textContent).toContain("#inv-1111");
    expect(el.textContent).toContain("$1,500.00");
  });

  it("should call openCreateModal when create button clicked", () => {
    component.im.openCreateModal();
    expect(openCreateModalMock).toHaveBeenCalled();
  });

  it("should hide generate button when canCreate is false", () => {
    canCreateSignal.set(false);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain("Generate Invoice");
  });

  it("should trigger pdf preview on onPreviewPdf", () => {
    component.onPreviewPdf(mockInvoices[0]);
    expect(openPdfModalMock).toHaveBeenCalledWith(mockInvoices[0]);
  });

  it("should trigger pdf download on onDownloadPdf", () => {
    component.onDownloadPdf(mockInvoices[0]);
    expect(downloadPdfMock).toHaveBeenCalledWith(mockInvoices[0]);
  });

  it("should trigger delete modal on onDelete", () => {
    component.onDelete(mockInvoices[0]);
    expect(openDeleteModalMock).toHaveBeenCalledWith(mockInvoices[0]);
  });

  it("should trigger updateStatus when onStatusChange is called", () => {
    component.onStatusChange(mockInvoices[0], "PAID");
    expect(updateStatusMock).toHaveBeenCalledWith(mockInvoices[0], "PAID");
  });

  it("should not trigger updateStatus if newStatus is invalid", () => {
    component.onStatusChange(mockInvoices[0], null);
    expect(updateStatusMock).not.toHaveBeenCalled();
  });

  it("should get client name and email correctly", () => {
    expect(component.getClientName("client-1")).toBe("Acme Corp");
    expect(component.getClientEmail("client-1")).toBe("contact@acme.com");

    expect(component.getClientName("unknown")).toBe("Client");
    expect(component.getClientEmail("unknown")).toBeNull();
  });

  it("should handle onSearch and update management service", () => {
    component.onSearch("search query");
    expect(setSearchQueryMock).toHaveBeenCalledWith("search query");
  });

  it("should handle onStatusFilter and update management service", () => {
    component.onStatusFilter("PAID");
    expect(setStatusFilterMock).toHaveBeenCalledWith("PAID");
  });

  it("should handle onClientFilter and update management service", () => {
    component.onClientFilter("client-1");
    expect(setClientFilterMock).toHaveBeenCalledWith("client-1");

    // Invalid non-string
    component.onClientFilter(123);
    expect(setClientFilterMock).toHaveBeenCalledTimes(1);
  });

  it("should handle onViewMode and update management service", () => {
    component.onViewMode("grid");
    expect(setViewModeMock).toHaveBeenCalledWith("grid");
  });

  it("should render error message when errorMessage signal is set", () => {
    errorMessageSignal.set("Network error occurred");
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("Network error occurred");
  });

  it("should render loading state when isLoading signal is true", () => {
    isLoadingSignal.set(true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("should render empty state when filteredInvoices is empty", () => {
    invoicesSignal.set([]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("No Invoices Yet");
  });

  it("should render card grid when viewMode is grid", () => {
    viewModeSignal.set("grid");
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("Acme Corp");
  });

  it("should render client portal banner when role is CLIENT", () => {
    activeWorkspaceSignal.set({ role: "CLIENT" });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Client Portal View:");
    expect(compiled.textContent).toContain("Client Invoices");
  });
});
