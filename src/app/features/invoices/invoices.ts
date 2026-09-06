import { CurrencyPipe, DatePipe } from "@angular/common";
import { Component, computed, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideArrowUpRight,
  lucideBuilding2,
  lucideCheck,
  lucideCheckCircle2,
  lucideChevronDown,
  lucideClock,
  lucideDollarSign,
  lucideDownload,
  lucideEye,
  lucideFilter,
  lucideGrid,
  lucideLayoutList,
  lucideLoader2,
  lucidePlus,
  lucideReceipt,
  lucideRefreshCw,
  lucideSearch,
  lucideSend,
  lucideTrash2,
  lucideX,
} from "@ng-icons/lucide";
import {
  INVOICE_STATUS_META,
  InvoiceResponse,
  InvoiceStatus,
} from "../../core/api/models/invoice.models";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";
import { Select, SelectOption } from "../../shared/components/select/select";
import { InvoiceCreateModal } from "./components/invoice-create-modal/invoice-create-modal";
import { InvoiceDeleteModal } from "./components/invoice-delete-modal/invoice-delete-modal";
import { InvoicePdfModal } from "./components/invoice-pdf-modal/invoice-pdf-modal";
import {
  InvoiceFilterStatus,
  InvoiceManagement,
  InvoiceViewMode,
} from "./services/invoice-management";

@Component({
  selector: "aos-invoices",
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    Button,
    Icons,
    Select,
    InvoiceCreateModal,
    InvoiceDeleteModal,
    InvoicePdfModal,
  ],
  providers: [
    provideIcons({
      lucideReceipt,
      lucidePlus,
      lucideSearch,
      lucideGrid,
      lucideLayoutList,
      lucideRefreshCw,
      lucideX,
      lucideBuilding2,
      lucideCheckCircle2,
      lucideAlertCircle,
      lucideLoader2,
      lucideDownload,
      lucideEye,
      lucideTrash2,
      lucideFilter,
      lucideClock,
      lucideCheck,
      lucideDollarSign,
      lucideChevronDown,
      lucideSend,
      lucideArrowUpRight,
    }),
  ],
  templateUrl: "./invoices.html",
})
export class InvoicesComponent implements OnInit {
  readonly im = inject(InvoiceManagement);
  readonly statusMeta = INVOICE_STATUS_META;

  readonly activeStatusFilter = computed(() => this.im.statusFilter());
  readonly activeViewMode = computed(() => this.im.viewMode());

  readonly statusFilterOptions: { label: string; value: InvoiceFilterStatus }[] = [
    { label: "All Statuses", value: "ALL" },
    { label: "Draft", value: "DRAFT" },
    { label: "Sent", value: "SENT" },
    { label: "Paid", value: "PAID" },
    { label: "Overdue", value: "OVERDUE" },
    { label: "Void", value: "VOID" },
  ];

  readonly statusUpdateOptions: SelectOption<InvoiceStatus>[] = [
    { label: "Draft", value: "DRAFT" },
    { label: "Sent", value: "SENT" },
    { label: "Paid", value: "PAID" },
    { label: "Overdue", value: "OVERDUE" },
    { label: "Void", value: "VOID" },
  ];

  readonly clientFilterOptions = computed<SelectOption<string>[]>(() => {
    const list = this.im.clients().map(c => ({
      label: c.name,
      value: c.id,
    }));
    return [{ label: "All Clients", value: "ALL" }, ...list];
  });

  ngOnInit(): void {
    this.im.loadInvoices();
  }

  getClientName(clientId: string): string {
    return this.im.clientMap().get(clientId)?.name || "Client";
  }

  getClientEmail(clientId: string): string | null {
    return this.im.clientMap().get(clientId)?.email || null;
  }

  onSearch(query: string): void {
    this.im.setSearchQuery(query);
  }

  onStatusFilter(status: InvoiceFilterStatus): void {
    this.im.setStatusFilter(status);
  }

  onClientFilter(clientId: unknown): void {
    if (typeof clientId === "string") {
      this.im.setClientFilter(clientId);
    }
  }

  onViewMode(mode: InvoiceViewMode): void {
    this.im.setViewMode(mode);
  }

  onStatusChange(invoice: InvoiceResponse, newStatus: unknown): void {
    if (newStatus && typeof newStatus === "string") {
      this.im.updateStatus(invoice, newStatus as InvoiceStatus);
    }
  }

  onDownloadPdf(invoice: InvoiceResponse): void {
    this.im.downloadPdf(invoice);
  }

  onPreviewPdf(invoice: InvoiceResponse): void {
    this.im.openPdfModal(invoice);
  }

  onDelete(invoice: InvoiceResponse): void {
    this.im.openDeleteModal(invoice);
  }
}
