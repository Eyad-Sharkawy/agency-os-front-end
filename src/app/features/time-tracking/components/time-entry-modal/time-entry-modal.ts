import { Component, computed, effect, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideCheck,
  lucideClock,
  lucideFolderKanban,
  lucideLoader2,
  lucidePlay,
  lucideX,
} from "@ng-icons/lucide";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { Select, SelectOption } from "../../../../shared/components/select/select";
import { TimeTrackingManagement } from "../../services/time-tracking-management";

@Component({
  selector: "aos-time-entry-modal",
  standalone: true,
  imports: [FormsModule, Button, Icons, Select],
  providers: [
    provideIcons({
      lucideX,
      lucideClock,
      lucidePlay,
      lucideFolderKanban,
      lucideCheck,
      lucideLoader2,
      lucideAlertCircle,
    }),
  ],
  templateUrl: "./time-entry-modal.html",
})
export class TimeEntryModal {
  readonly tm = inject(TimeTrackingManagement);

  readonly isOpen = computed(() => this.tm.isManualModalOpen());

  // Active Mode: 'timer' or 'manual'
  readonly activeTab = computed(() => this.tm.modalMode());

  // Form Fields
  readonly selectedProjectId = signal<string>("");
  readonly selectedTaskId = signal<string>("");
  readonly hours = signal<number>(1);
  readonly minutes = signal<number>(0);
  readonly isBillable = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.resetForm();
      }
    });
  }

  setTab(tab: "timer" | "manual"): void {
    this.tm.setModalMode(tab);
  }

  readonly selectedTask = computed(() => {
    return this.tm.tasks().find(t => t.id === this.selectedTaskId()) || null;
  });

  readonly selectedProject = computed(() => {
    return this.tm.projects().find(p => p.id === this.selectedProjectId()) || null;
  });

  readonly projectOptions = computed<SelectOption<string>[]>(() => {
    return this.tm.projects().map(p => ({
      label: p.name,
      value: p.id,
      description: `Rate: $${p.billingRate}/hr`,
    }));
  });

  readonly taskOptions = computed<SelectOption<string>[]>(() => {
    const projId = this.selectedProjectId();
    const tasks = projId ? this.tm.tasks().filter(t => t.projectId === projId) : this.tm.tasks();
    return tasks.map(t => ({
      label: t.title,
      value: t.id,
      description: `Priority: ${t.priority} • Status: ${t.status}`,
    }));
  });

  onProjectChange(projectId: string): void {
    this.selectedProjectId.set(projectId);
    const currentTask = this.tm.tasks().find(t => t.id === this.selectedTaskId());
    if (currentTask && currentTask.projectId !== projectId) {
      this.selectedTaskId.set("");
    }
  }

  onTaskChange(taskId: string): void {
    this.selectedTaskId.set(taskId);
    const task = this.tm.tasks().find(t => t.id === taskId);
    if (task && (!this.selectedProjectId() || this.selectedProjectId() !== task.projectId)) {
      this.selectedProjectId.set(task.projectId);
    }
  }

  resetForm(): void {
    const preselected = this.tm.preselectedTaskId();
    const task = preselected ? this.tm.tasks().find(t => t.id === preselected) : null;
    if (task) {
      this.selectedProjectId.set(task.projectId);
      this.selectedTaskId.set(task.id);
    } else {
      const firstProj = this.tm.projects()[0];
      this.selectedProjectId.set(firstProj ? firstProj.id : "");
      const matchingTasks = firstProj
        ? this.tm.tasks().filter(t => t.projectId === firstProj.id)
        : this.tm.tasks();
      this.selectedTaskId.set(matchingTasks[0]?.id || "");
    }
    this.hours.set(1);
    this.minutes.set(0);
    this.isBillable.set(true);
    this.errorMessage.set(null);
  }

  onSubmit(): void {
    const taskId = this.selectedTaskId();
    if (!taskId) {
      this.errorMessage.set("Please select a task to proceed.");
      return;
    }

    if (this.activeTab() === "timer") {
      this.tm.startTimer(taskId);
      return;
    }

    const totalMinutes = (this.hours() || 0) * 60 + (this.minutes() || 0);
    if (totalMinutes <= 0) {
      this.errorMessage.set("Duration must be greater than 0 minutes.");
      return;
    }

    this.tm.logManualEntry({
      taskId,
      durationMinutes: totalMinutes,
      isBillable: this.isBillable(),
    });
  }

  onClose(): void {
    this.tm.closeManualModal();
  }
}
