import { Component, computed, inject, OnDestroy } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { provideIcons } from "@ng-icons/core";
import {
  lucideDownload,
  lucideExternalLink,
  lucideFileText,
  lucideLoader2,
  lucideX,
} from "@ng-icons/lucide";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { InvoiceManagement } from "../../services/invoice-management";

@Component({
  selector: "aos-invoice-pdf-modal",
  standalone: true,
  imports: [Button, Icons],
  providers: [
    provideIcons({
      lucideX,
      lucideDownload,
      lucideFileText,
      lucideLoader2,
      lucideExternalLink,
    }),
  ],
  templateUrl: "./invoice-pdf-modal.html",
})
export class InvoicePdfModal implements OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);
  readonly im = inject(InvoiceManagement);

  readonly isOpen = computed(() => this.im.isPdfModalOpen());
  readonly invoice = computed(() => this.im.selectedInvoice());
  readonly isDownloading = computed(() => this.im.isDownloadingPdf());

  /**
   * Generates a safe resource URL for the PDF preview iframe.
   * Safe to bypass sanitization because the URL is strictly generated in-memory
   * from an authenticated API binary Blob via URL.createObjectURL (blob: URI scheme).
   */
  readonly safePdfUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.im.pdfBlobUrl();
    if (!url?.startsWith("blob:")) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  onClose(): void {
    this.im.closeModals();
  }

  onDownload(): void {
    const inv = this.invoice();
    if (inv) {
      this.im.downloadPdf(inv);
    }
  }

  ngOnDestroy(): void {
    this.im.cleanupPdfBlob?.();
  }
}
