import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { catchError, forkJoin, Observable, of, tap } from "rxjs";
import { ClientResponse } from "../../../core/api/models/client.models";
import {
  InvoiceRequest,
  InvoiceResponse,
  InvoiceStatus,
} from "../../../core/api/models/invoice.models";
import { ClientApi } from "../../../core/api/services/client/client-api";
import { InvoiceApi } from "../../../core/api/services/invoice/invoice-api";
import { WorkspaceStore } from "../../../core/multitenancy/workspace.store";

export type InvoiceFilterStatus = "ALL" | InvoiceStatus;
export type InvoiceViewMode = "table" | "grid";
export type InvoiceAction = "create" | "delete" | "view-pdf";

@Injectable({
  providedIn: "root",
})
export class InvoiceManagement {
  private readonly invoiceApi = inject(InvoiceApi);
  private readonly clientApi = inject(ClientApi);
  readonly workspaceStore = inject(WorkspaceStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParams = toSignal(this.route.queryParams);

  // State Signals
  readonly invoices = signal<InvoiceResponse[]>([]);
  readonly clients = signal<ClientResponse[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Filter & View State
  readonly searchQuery = signal<string>("");
  readonly statusFilter = signal<InvoiceFilterStatus>("ALL");
  readonly clientFilter = signal<string>("ALL");
  readonly viewMode = signal<InvoiceViewMode>("table");

  // Modal State
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly isPdfModalOpen = signal<boolean>(false);
  readonly selectedInvoice = signal<InvoiceResponse | null>(null);

  // PDF Preview State
  readonly pdfBlobUrl = signal<string | null>(null);
  readonly isDownloadingPdf = signal<boolean>(false);

  // Mutation State
  readonly isSubmitting = signal<boolean>(false);
  readonly mutationError = signal<string | null>(null);

  // User Permissions
  readonly userRole = computed(() => this.workspaceStore.activeWorkspace()?.role);
  readonly canCreate = computed(() => {
    return this.userRole() === "OWNER";
  });
  readonly canEdit = computed(() => {
    return this.userRole() === "OWNER";
  });
  readonly canDelete = computed(() => {
    return this.userRole() === "OWNER";
  });
  readonly isReadOnly = computed(() => this.userRole() === "CLIENT");

  // Client Map for fast lookup
  readonly clientMap = computed<Map<string, ClientResponse>>(() => {
    const map = new Map<string, ClientResponse>();
    for (const c of this.clients()) {
      map.set(c.id, c);
    }
    return map;
  });

  // Derived Filtered Invoices
  readonly filteredInvoices = computed<InvoiceResponse[]>(() => {
    const list = this.invoices();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const client = this.clientFilter();
    const clientLookup = this.clientMap();

    return list.filter(invoice => {
      const clientName = clientLookup.get(invoice.clientId)?.name?.toLowerCase() ?? "";
      const matchesSearch =
        !query || invoice.id.toLowerCase().includes(query) || clientName.includes(query);

      const matchesStatus = status === "ALL" || invoice.status === status;
      const matchesClient = client === "ALL" || invoice.clientId === client;

      return matchesSearch && matchesStatus && matchesClient;
    });
  });

  // Financial Stats Ribbon
  readonly stats = computed(() => {
    const all = this.invoices();
    const totalCount = all.length;
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;

    let draftCount = 0;
    let sentCount = 0;
    let paidCount = 0;
    let overdueCount = 0;
    let voidCount = 0;

    for (const inv of all) {
      const amt = Number(inv.totalAmount) || 0;
      totalInvoiced += amt;

      switch (inv.status) {
        case "PAID":
          totalPaid += amt;
          paidCount++;
          break;
        case "SENT":
          totalOutstanding += amt;
          sentCount++;
          break;
        case "DRAFT":
          totalOutstanding += amt;
          draftCount++;
          break;
        case "OVERDUE":
          totalOverdue += amt;
          overdueCount++;
          break;
        case "VOID":
          voidCount++;
          break;
      }
    }

    return {
      totalCount,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      totalOverdue,
      draftCount,
      sentCount,
      paidCount,
      overdueCount,
      voidCount,
    };
  });

  constructor() {
    let lastTenantId: string | null = null;
    effect(() => {
      const tenantId = this.workspaceStore.activeTenantId();
      if (tenantId && tenantId !== lastTenantId) {
        lastTenantId = tenantId;
        this.loadInvoices();
      }
    });

    effect(() => {
      this.syncUrlActionState(this.queryParams());
    });
  }

  private syncUrlActionState(params: Record<string, unknown> | undefined): void {
    const action = params?.["action"] as InvoiceAction | undefined;
    const invoiceId = params?.["invoiceId"] as string | undefined;

    if (!action) {
      this.handleNoAction();
      return;
    }

    if (action === "create") {
      this.handleCreateAction();
      return;
    }

    if (invoiceId && (action === "delete" || action === "view-pdf")) {
      this.handleInvoiceAction(action, invoiceId);
    }
  }

  private handleNoAction(): void {
    if (this.isCreateModalOpen() || this.isDeleteModalOpen() || this.isPdfModalOpen()) {
      this.resetModalSignals();
    }
  }

  private handleCreateAction(): void {
    if (!this.canCreate()) {
      this.closeModals();
      return;
    }
    this.selectedInvoice.set(null);
    this.isCreateModalOpen.set(true);
    this.isDeleteModalOpen.set(false);
    this.isPdfModalOpen.set(false);
  }

  private handleInvoiceAction(action: InvoiceAction, invoiceId: string): void {
    if (action === "delete" && !this.canDelete()) {
      this.closeModals();
      return;
    }

    if (this.selectedInvoice()?.id === invoiceId) {
      this.updateActiveModalState(action, invoiceId);
      return;
    }

    const invoice = this.invoices().find(i => i.id === invoiceId);
    if (invoice) {
      this.applyModalAction(action, invoice);
      return;
    }

    this.fetchAndApplyModalAction(action, invoiceId);
  }

  private updateActiveModalState(action: InvoiceAction, invoiceId: string): void {
    this.isCreateModalOpen.set(false);
    this.isDeleteModalOpen.set(action === "delete");
    this.isPdfModalOpen.set(action === "view-pdf");
    if (action === "view-pdf" && !this.pdfBlobUrl()) {
      this.fetchPdfBlob(invoiceId);
    }
  }

  private fetchAndApplyModalAction(action: InvoiceAction, invoiceId: string): void {
    this.invoiceApi.getInvoiceById(invoiceId).subscribe({
      next: fetchedInvoice => {
        if (fetchedInvoice) {
          this.applyModalAction(action, fetchedInvoice);
        }
      },
      error: () => {
        this.closeModals();
      },
    });
  }

  private applyModalAction(action: InvoiceAction, invoice: InvoiceResponse): void {
    this.selectedInvoice.set(invoice);
    this.isCreateModalOpen.set(false);
    this.isDeleteModalOpen.set(action === "delete");
    this.isPdfModalOpen.set(action === "view-pdf");

    if (action === "view-pdf") {
      this.fetchPdfBlob(invoice.id);
    }
  }

  private resetModalSignals(): void {
    this.isCreateModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.isPdfModalOpen.set(false);
    this.selectedInvoice.set(null);
    this.cleanupPdfBlob();
  }

  // --- API & State Operations ---

  loadInvoices(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const isClient = this.userRole() === "CLIENT";

    forkJoin({
      invoices: this.invoiceApi.getInvoices(),
      clients: isClient ? of([]) : this.clientApi.getClients().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ invoices, clients }) => {
        this.invoices.set(invoices || []);
        this.clients.set(clients || []);
        this.isLoading.set(false);

        const params = this.queryParams();
        const action = params?.["action"] as InvoiceAction | undefined;
        const invoiceId = params?.["invoiceId"] as string | undefined;
        if (invoiceId && action && action !== "create") {
          const inv = (invoices || []).find(i => i.id === invoiceId);
          if (inv) {
            this.applyModalAction(action, inv);
          }
        }
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to load invoices.");
        this.errorMessage.set(detail);
      },
    });
  }

  createInvoice(req: InvoiceRequest): Observable<InvoiceResponse> {
    this.isSubmitting.set(true);
    this.mutationError.set(null);

    return this.invoiceApi.createInvoice(req).pipe(
      tap({
        next: created => {
          this.invoices.update(list => [created, ...list]);
          this.isSubmitting.set(false);
          this.closeModals();
        },
        error: (err: unknown) => {
          this.isSubmitting.set(false);
          const detail =
            (err as { error?: { detail?: string; message?: string } })?.error?.detail ||
            (err as { error?: { message?: string } })?.error?.message ||
            (err instanceof Error ? err.message : "Failed to create invoice.");
          this.mutationError.set(detail);
        },
      }),
    );
  }

  updateStatus(invoice: InvoiceResponse, newStatus: InvoiceStatus): void {
    if (!this.canEdit()) return;

    this.actionLoading.set(true);
    const req: InvoiceRequest = {
      clientId: invoice.clientId,
      status: newStatus,
    };

    this.invoiceApi.updateInvoice(invoice.id, req).subscribe({
      next: updated => {
        this.invoices.update(list => list.map(i => (i.id === updated.id ? updated : i)));
        if (this.selectedInvoice()?.id === updated.id) {
          this.selectedInvoice.set(updated);
        }
        this.actionLoading.set(false);
      },
      error: (err: unknown) => {
        this.actionLoading.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to update invoice status.");
        this.errorMessage.set(detail);
      },
    });
  }

  deleteInvoice(id: string): void {
    if (!this.canDelete()) return;

    this.isSubmitting.set(true);
    this.mutationError.set(null);

    this.invoiceApi.deleteInvoice(id).subscribe({
      next: () => {
        this.invoices.update(list => list.filter(i => i.id !== id));
        this.isSubmitting.set(false);
        this.closeModals();
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to delete invoice.");
        this.mutationError.set(detail);
      },
    });
  }

  downloadPdf(invoice: InvoiceResponse): void {
    this.isDownloadingPdf.set(true);
    this.invoiceApi.downloadInvoicePdf(invoice.id).subscribe({
      next: blob => {
        this.isDownloadingPdf.set(false);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice-${invoice.id.slice(0, 8)}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: unknown) => {
        this.isDownloadingPdf.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to download PDF.");
        this.errorMessage.set(detail);
      },
    });
  }

  fetchPdfBlob(invoiceId: string): void {
    this.cleanupPdfBlob();
    this.invoiceApi.downloadInvoicePdf(invoiceId).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        this.pdfBlobUrl.set(url);
      },
      error: (err: unknown) => {
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to load PDF preview.");
        this.errorMessage.set(detail);
      },
    });
  }

  cleanupPdfBlob(): void {
    const url = this.pdfBlobUrl();
    if (url) {
      window.URL.revokeObjectURL(url);
      this.pdfBlobUrl.set(null);
    }
  }

  readonly actionLoading = signal<boolean>(false);

  // --- Modal & Navigation Actions ---

  openCreateModal(): void {
    if (!this.canCreate()) return;
    this.mutationError.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: "create" },
      queryParamsHandling: "merge",
    });
  }

  openDeleteModal(invoice: InvoiceResponse): void {
    if (!this.canDelete()) return;
    this.mutationError.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: "delete", invoiceId: invoice.id },
      queryParamsHandling: "merge",
    });
  }

  openPdfModal(invoice: InvoiceResponse): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: "view-pdf", invoiceId: invoice.id },
      queryParamsHandling: "merge",
    });
  }

  closeModals(): void {
    this.mutationError.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: null, invoiceId: null },
      queryParamsHandling: "merge",
    });
  }

  // --- Filter & View Modifiers ---

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  setStatusFilter(status: InvoiceFilterStatus): void {
    this.statusFilter.set(status);
  }

  setClientFilter(clientId: string): void {
    this.clientFilter.set(clientId);
  }

  setViewMode(mode: InvoiceViewMode): void {
    this.viewMode.set(mode);
  }

  clearFilters(): void {
    this.searchQuery.set("");
    this.statusFilter.set("ALL");
    this.clientFilter.set("ALL");
  }
}
