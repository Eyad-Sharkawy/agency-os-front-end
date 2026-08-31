import { Component, computed, effect, inject, signal } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucideAlertTriangle, lucideLoader2, lucideTrash2, lucideX } from "@ng-icons/lucide";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { ClientManagement } from "../../services/client-management";

@Component({
  selector: "aos-client-delete-modal",
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
  templateUrl: "./client-delete-modal.html",
})
export class ClientDeleteModal {
  readonly cm = inject(ClientManagement);

  readonly isOpen = computed(() => this.cm.isDeleteModalOpen());
  readonly client = computed(() => this.cm.selectedClient());

  readonly isDeleting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        this.errorMessage.set(null);
        this.isDeleting.set(false);
      }
    });
  }

  onClose(): void {
    if (!this.isDeleting()) {
      this.errorMessage.set(null);
      this.cm.closeModals();
    }
  }

  onDelete(): void {
    const c = this.client();
    if (!c || this.isDeleting()) return;

    this.isDeleting.set(true);
    this.errorMessage.set(null);

    this.cm.deleteClient(c.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.cm.closeModals();
      },
      error: (err: unknown) => {
        this.isDeleting.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to delete client company.");
        this.errorMessage.set(detail);
      },
    });
  }
}
