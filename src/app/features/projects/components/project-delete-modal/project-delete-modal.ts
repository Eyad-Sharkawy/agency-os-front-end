import { Component, computed, effect, inject, signal } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucideAlertTriangle, lucideLoader2, lucideTrash2, lucideX } from "@ng-icons/lucide";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { ProjectManagement } from "../../services/project-management";

@Component({
  selector: "aos-project-delete-modal",
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
  templateUrl: "./project-delete-modal.html",
})
export class ProjectDeleteModal {
  readonly pm = inject(ProjectManagement);

  readonly isOpen = computed(() => this.pm.isDeleteModalOpen());
  readonly project = computed(() => this.pm.selectedProject());

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
      this.pm.closeModals();
    }
  }

  onDelete(): void {
    const p = this.project();
    if (!p || this.isDeleting()) return;

    this.isDeleting.set(true);
    this.errorMessage.set(null);

    this.pm.deleteProject(p.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.pm.closeModals();
      },
      error: (err: unknown) => {
        this.isDeleting.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to delete project.");
        this.errorMessage.set(detail);
      },
    });
  }
}
