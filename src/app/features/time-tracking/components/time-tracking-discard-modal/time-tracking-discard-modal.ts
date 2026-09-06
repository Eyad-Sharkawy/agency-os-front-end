import { Component, computed, inject } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucideAlertTriangle, lucideTrash2, lucideX } from "@ng-icons/lucide";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { TimeTrackingManagement } from "../../services/time-tracking-management";

@Component({
  selector: "aos-time-tracking-discard-modal",
  standalone: true,
  imports: [Button, Icons],
  providers: [
    provideIcons({
      lucideAlertTriangle,
      lucideTrash2,
      lucideX,
    }),
  ],
  templateUrl: "./time-tracking-discard-modal.html",
})
export class TimeTrackingDiscardModal {
  readonly tm = inject(TimeTrackingManagement);

  readonly isOpen = computed(() => this.tm.isDiscardModalOpen());
  readonly activeTask = computed(() => this.tm.activeTask());
  readonly elapsedFormatted = computed(() => this.tm.activeTimerFormatted());

  onClose(): void {
    this.tm.closeDiscardModal();
  }

  onDiscard(): void {
    this.tm.confirmDiscardTimer();
  }
}
