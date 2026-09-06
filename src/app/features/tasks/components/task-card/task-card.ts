import { DatePipe } from "@angular/common";
import { Component, computed, inject, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertTriangle,
  lucideArrowLeft,
  lucideArrowRight,
  lucideCalendar,
  lucideCheckCircle2,
  lucideClock,
  lucideFolderKanban,
  lucideGripVertical,
  lucidePause,
  lucidePencil,
  lucidePlay,
  lucideSquare,
  lucideTrash2,
  lucideUser,
} from "@ng-icons/lucide";
import { TaskPriority, TaskResponse, TaskStatus } from "../../../../core/api/models/task.models";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { TaskManagement } from "../../services/task-management";

import { WorkspaceStore } from "../../../../core/multitenancy/workspace.store";
import { TimeTrackingManagement } from "../../../time-tracking/services/time-tracking-management";

@Component({
  selector: "aos-task-card",
  standalone: true,
  imports: [DatePipe, RouterLink, Icons, Button],
  providers: [
    provideIcons({
      lucideFolderKanban,
      lucideCalendar,
      lucideClock,
      lucidePencil,
      lucideTrash2,
      lucideAlertTriangle,
      lucideGripVertical,
      lucideArrowLeft,
      lucideArrowRight,
      lucideCheckCircle2,
      lucideUser,
      lucidePlay,
      lucidePause,
      lucideSquare,
    }),
  ],
  templateUrl: "./task-card.html",
})
export class TaskCard {
  readonly tm = inject(TaskManagement);
  readonly ttm = inject(TimeTrackingManagement);
  private readonly workspaceStore = inject(WorkspaceStore);

  readonly task = input.required<TaskResponse>();

  readonly canTrackTime = computed(() => {
    return this.workspaceStore.activeWorkspace()?.role !== "CLIENT";
  });

  readonly isTrackingThisTask = computed(() => {
    return this.ttm.activeTimer()?.taskId === this.task().id;
  });

  readonly isTimerPaused = computed(() => {
    return this.ttm.isPaused();
  });

  readonly activeTimerFormatted = computed(() => {
    return this.ttm.activeTimerFormatted();
  });

  readonly isTimerSubmitting = computed(() => {
    return this.ttm.isSubmitting();
  });

  readonly projectName = computed(() => {
    return this.tm.getProjectName(this.task().projectId);
  });

  readonly isOverdue = computed(() => {
    const due = this.task().dueDate;
    if (!due || this.task().status === "DONE") return false;
    return new Date(due).getTime() < Date.now();
  });

  readonly loggedHours = computed(() => {
    return Math.round((this.task().totalLoggedMinutes / 60) * 10) / 10;
  });

  readonly estimatedHours = computed(() => {
    const mins = this.task().estimatedMinutes;
    return mins ? Math.round((mins / 60) * 10) / 10 : null;
  });

  readonly timeProgress = computed<number | null>(() => {
    const est = this.task().estimatedMinutes;
    if (!est || est <= 0) return null;
    const logged = this.task().totalLoggedMinutes || 0;
    return Math.round((logged / est) * 100);
  });

  readonly isOverBudget = computed<boolean>(() => {
    const progress = this.timeProgress();
    return (progress !== null && progress > 100) || this.task().isOverBudget;
  });

  readonly isNearBudget = computed<boolean>(() => {
    const progress = this.timeProgress();
    return progress !== null && progress >= 80 && progress <= 100;
  });

  readonly progressPercentageCapped = computed<number>(() => {
    const progress = this.timeProgress();
    if (progress === null) return 0;
    return Math.min(100, Math.max(0, progress));
  });

  onStartTracking(event: Event): void {
    event.stopPropagation();
    this.ttm.startTimer(this.task().id);
  }

  onPauseTracking(event: Event): void {
    event.stopPropagation();
    this.ttm.pauseTimer();
  }

  onResumeTracking(event: Event): void {
    event.stopPropagation();
    this.ttm.resumeTimer();
  }

  onStopAndSaveTracking(event: Event): void {
    event.stopPropagation();
    this.ttm.stopTimer(true);
  }

  onDiscardTracking(event: Event): void {
    event.stopPropagation();
    this.ttm.openDiscardModal();
  }

  onLogTime(event: Event): void {
    this.onStartTracking(event);
  }

  readonly previousStatus = computed<TaskStatus | null>(() => {
    switch (this.task().status) {
      case "IN_PROGRESS":
        return "TODO";
      case "REVIEW":
        return "IN_PROGRESS";
      case "DONE":
        return "REVIEW";
      default:
        return null;
    }
  });

  readonly nextStatus = computed<TaskStatus | null>(() => {
    switch (this.task().status) {
      case "TODO":
        return "IN_PROGRESS";
      case "IN_PROGRESS":
        return "REVIEW";
      case "REVIEW":
        return "DONE";
      default:
        return null;
    }
  });

  getPriorityClass(priority: TaskPriority): string {
    switch (priority) {
      case "URGENT":
        return "bg-error/10 text-error border-error/20";
      case "HIGH":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
      case "MEDIUM":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "LOW":
        return "bg-soft-stone text-muted border-hairline";
      default:
        return "bg-soft-stone text-muted border-hairline";
    }
  }

  getPriorityDotClass(priority: TaskPriority): string {
    switch (priority) {
      case "URGENT":
        return "bg-error";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-blue-500";
      case "LOW":
        return "bg-muted";
      default:
        return "bg-muted";
    }
  }

  onMoveStatus(targetStatus: TaskStatus): void {
    if (!this.tm.canUpdateStatus()) return;
    this.tm.updateTaskStatus(this.task().id, targetStatus).subscribe({
      error: () => {
        // error handled via tm.errorMessage and rollback
      },
    });
  }

  onEdit(): void {
    this.tm.openEditModal(this.task());
  }

  onDelete(): void {
    this.tm.openDeleteModal(this.task());
  }
}
