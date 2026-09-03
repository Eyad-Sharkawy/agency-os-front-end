import { Component, computed, effect, inject, signal } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucideAlertTriangle, lucideLoader2, lucideTrash2, lucideX } from "@ng-icons/lucide";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { TaskManagement } from "../../services/task-management";

@Component({
  selector: "aos-task-delete-modal",
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
  templateUrl: "./task-delete-modal.html",
})
export class TaskDeleteModal {
  readonly tm = inject(TaskManagement);

  readonly isOpen = computed(() => this.tm.isDeleteModalOpen());
  readonly task = computed(() => this.tm.selectedTask());

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
      this.tm.closeModals();
    }
  }

  onDelete(): void {
    const t = this.task();
    if (!t || this.isDeleting()) return;

    this.isDeleting.set(true);
    this.errorMessage.set(null);

    this.tm.deleteTask(t.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.tm.closeModals();
      },
      error: (err: unknown) => {
        this.isDeleting.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to delete task.");
        this.errorMessage.set(detail);
      },
    });
  }
}
