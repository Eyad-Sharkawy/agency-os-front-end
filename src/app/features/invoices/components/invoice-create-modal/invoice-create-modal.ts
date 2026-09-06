import { Component, computed, effect, inject, OnDestroy, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideBuilding2,
  lucideCheck,
  lucideFileText,
  lucideInfo,
  lucideLoader2,
  lucideReceipt,
  lucideX,
} from "@ng-icons/lucide";
import { InvoiceRequest, InvoiceStatus } from "../../../../core/api/models/invoice.models";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { Select, SelectOption } from "../../../../shared/components/select/select";
import { InvoiceManagement } from "../../services/invoice-management";

@Component({
  selector: "aos-invoice-create-modal",
  standalone: true,
  imports: [FormsModule, Button, Icons, Select],
  providers: [
    provideIcons({
      lucideX,
      lucideReceipt,
      lucideBuilding2,
      lucideFileText,
      lucideCheck,
      lucideLoader2,
      lucideAlertCircle,
      lucideInfo,
    }),
  ],
  templateUrl: "./invoice-create-modal.html",
})
export class InvoiceCreateModal implements OnDestroy {
  readonly im = inject(InvoiceManagement);

  readonly isOpen = computed(() => this.im.isCreateModalOpen());

  // Form Fields
  readonly clientId = signal("");
  readonly status = signal<InvoiceStatus>("DRAFT");

  // Error & Status
  readonly isSubmitting = computed(() => this.im.isSubmitting());
  readonly mutationError = computed(() => this.im.mutationError());

  readonly statusOptions: SelectOption<InvoiceStatus>[] = [
    {
      label: "Draft",
      value: "DRAFT",
      description: "Keep invoice in draft status for review before sending",
    },
    {
      label: "Sent",
      value: "SENT",
      description: "Mark immediately as sent and issued to the client",
    },
  ];

  readonly clientOptions = computed<SelectOption<string>[]>(() => {
    return this.im.clients().map(client => ({
      label: client.name,
      value: client.id,
      description: client.email,
    }));
  });

  readonly isClientValid = computed(() => !!this.clientId());

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        if (!this.clientId() && this.im.clients().length > 0) {
          this.clientId.set(this.im.clients()[0].id);
        }
      } else {
        this.clientId.set("");
        this.status.set("DRAFT");
      }
    });
  }

  onClientChange(id: unknown): void {
    if (typeof id === "string") {
      this.clientId.set(id);
    }
  }

  onStatusChange(val: unknown): void {
    if (val === "DRAFT" || val === "SENT") {
      this.status.set(val);
    }
  }

  onClose(): void {
    if (!this.isSubmitting()) {
      this.im.closeModals();
    }
  }

  onSubmit(): void {
    if (!this.isClientValid() || this.isSubmitting()) return;

    const payload: InvoiceRequest = {
      clientId: this.clientId(),
      status: this.status(),
    };

    this.im.createInvoice(payload).subscribe();
  }

  ngOnDestroy(): void {
    this.clientId.set("");
    this.status.set("DRAFT");
  }
}
