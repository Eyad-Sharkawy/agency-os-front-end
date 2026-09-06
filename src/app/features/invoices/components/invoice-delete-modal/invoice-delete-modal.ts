import { Component, computed, inject } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucideAlertTriangle, lucideLoader2, lucideTrash2, lucideX } from "@ng-icons/lucide";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { InvoiceManagement } from "../../services/invoice-management";

@Component({
  selector: "aos-invoice-delete-modal",
  standalone: true,
  imports: [Button, Icons],
  providers: [
    provideIcons({
      lucideAlertTriangle,
      lucideTrash2,
      lucideX,
      lucideLoader2,
    }),
  ],
  templateUrl: "./invoice-delete-modal.html",
})
export class InvoiceDeleteModal {
  readonly im = inject(InvoiceManagement);

  readonly isOpen = computed(() => this.im.isDeleteModalOpen());
  readonly invoice = computed(() => this.im.selectedInvoice());

  readonly isDeleting = computed(() => this.im.isSubmitting());
  readonly mutationError = computed(() => this.im.mutationError());

  readonly clientName = computed(() => {
    const inv = this.invoice();
    if (!inv) return "";
    return this.im.clientMap().get(inv.clientId)?.name || "Client";
  });

  onClose(): void {
    if (!this.isDeleting()) {
      this.im.closeModals();
    }
  }

  onDelete(): void {
    const inv = this.invoice();
    if (!inv || this.isDeleting()) return;

    this.im.deleteInvoice(inv.id);
  }
}
