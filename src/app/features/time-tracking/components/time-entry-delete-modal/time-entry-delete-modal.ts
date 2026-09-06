import { Component, computed, effect, inject, signal } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucideAlertTriangle, lucideLoader2, lucideTrash2, lucideX } from "@ng-icons/lucide";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { TimeTrackingManagement } from "../../services/time-tracking-management";

@Component({
  selector: "aos-time-entry-delete-modal",
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
  templateUrl: "./time-entry-delete-modal.html",
})
export class TimeEntryDeleteModal {
  readonly tm = inject(TimeTrackingManagement);

  readonly isOpen = computed(() => this.tm.isDeleteModalOpen());
  readonly entry = computed(() => this.tm.selectedEntryForDelete());

  readonly isDeleting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly taskTitle = computed(() => {
    const e = this.entry();
    if (!e) return "Unknown Task";
    return this.tm.taskMap().get(e.taskId)?.title || "Unknown Task";
  });

  readonly formattedDuration = computed(() => {
    const e = this.entry();
    if (!e) return "0m";
    const hours = Math.floor(e.durationMinutes / 60);
    const minutes = e.durationMinutes % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  });

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
      this.tm.closeDeleteModal();
    }
  }

  onDelete(): void {
    const e = this.entry();
    if (!e || this.isDeleting()) return;

    this.isDeleting.set(true);
    this.errorMessage.set(null);

    this.tm.deleteEntry(e.id);
    this.isDeleting.set(false);
    this.tm.closeDeleteModal();
  }
}
