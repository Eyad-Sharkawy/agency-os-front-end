import { Component, computed, effect, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideBuilding2,
  lucideCheck,
  lucideLoader2,
  lucideMail,
  lucideShield,
  lucideX,
} from "@ng-icons/lucide";
import { ClientRequest, ClientStatus } from "../../../../core/api/models/client.models";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { Select, SelectOption } from "../../../../shared/components/select/select";
import { ClientManagement } from "../../services/client-management";

@Component({
  selector: "aos-client-modal",
  standalone: true,
  imports: [FormsModule, Button, Icons, Select],
  providers: [
    provideIcons({
      lucideX,
      lucideBuilding2,
      lucideMail,
      lucideShield,
      lucideCheck,
      lucideLoader2,
      lucideAlertCircle,
    }),
  ],
  templateUrl: "./client-modal.html",
})
export class ClientModal {
  readonly cm = inject(ClientManagement);

  readonly isOpen = computed(() => this.cm.isCreateModalOpen() || this.cm.isEditModalOpen());
  readonly isEditMode = computed(() => this.cm.isEditModalOpen());
  readonly clientToEdit = computed(() => this.cm.selectedClient());

  // Form Fields (Signals)
  readonly name = signal("");
  readonly email = signal("");
  readonly status = signal<ClientStatus>("ACTIVE");

  // Submission State
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly statusOptions: SelectOption<ClientStatus>[] = [
    {
      label: "Active (Operational)",
      value: "ACTIVE",
      description: "Can be assigned to new projects & tasks",
    },
    {
      label: "Inactive (Paused)",
      value: "INACTIVE",
      description: "Temporarily suspended from new project activities",
    },
  ];

  constructor() {
    effect(() => {
      const isOpen = this.isOpen();
      const isEdit = this.isEditMode();
      const client = this.clientToEdit();

      if (!isOpen) {
        this.errorMessage.set(null);
        this.isSubmitting.set(false);
        return;
      }

      if (isEdit) {
        if (client) {
          this.name.set(client.name);
          this.email.set(client.email);
          this.status.set(client.status);
        }
        this.errorMessage.set(null);
        this.isSubmitting.set(false);
      } else {
        this.name.set("");
        this.email.set("");
        this.status.set("ACTIVE");
        this.errorMessage.set(null);
        this.isSubmitting.set(false);
      }
    });
  }

  readonly isNameValid = computed(() => this.name().trim().length >= 2);
  readonly isEmailValid = computed(() => {
    const val = this.email().trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  });
  readonly isFormValid = computed(() => this.isNameValid() && this.isEmailValid());

  onClose(): void {
    if (!this.isSubmitting()) {
      this.cm.closeModals();
    }
  }

  onStatusChange(newStatus: ClientStatus): void {
    this.status.set(newStatus);
  }

  onSubmit(): void {
    if (!this.isFormValid() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload: ClientRequest = {
      name: this.name().trim(),
      email: this.email().trim().toLowerCase(),
      status: this.status(),
    };

    if (this.isEditMode()) {
      const client = this.clientToEdit();
      if (!client) return;

      this.cm.updateClient(client.id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.cm.closeModals();
        },
        error: (err: unknown) => {
          this.isSubmitting.set(false);
          const detail =
            (err as { error?: { detail?: string } })?.error?.detail ||
            (err instanceof Error ? err.message : "Failed to update client.");
          this.errorMessage.set(detail);
        },
      });
    } else {
      this.cm.createClient(payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.cm.closeModals();
        },
        error: (err: unknown) => {
          this.isSubmitting.set(false);
          const detail =
            (err as { error?: { detail?: string } })?.error?.detail ||
            (err instanceof Error ? err.message : "Failed to create client.");
          this.errorMessage.set(detail);
        },
      });
    }
  }
}
