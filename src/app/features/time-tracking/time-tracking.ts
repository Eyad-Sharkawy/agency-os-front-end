import { Component, computed, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideCheckCircle2,
  lucideClock,
  lucideDollarSign,
  lucideFilter,
  lucidePause,
  lucidePlay,
  lucidePlus,
  lucideRefreshCw,
  lucideSearch,
  lucideShieldCheck,
  lucideSquare,
  lucideTrash2,
  lucideUser,
  lucideXCircle,
} from "@ng-icons/lucide";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";
import { Select, SelectOption } from "../../shared/components/select/select";
import { TimeEntryModal } from "./components/time-entry-modal/time-entry-modal";
import { TimeEntryDeleteModal } from "./components/time-entry-delete-modal/time-entry-delete-modal";
import { TimeTrackingDiscardModal } from "./components/time-tracking-discard-modal/time-tracking-discard-modal";
import { BillableFilter, TimeTrackingManagement } from "./services/time-tracking-management";
import { TimeEntryResponse } from "../../core/api/models/time-entry.models";

import { WorkspaceStore } from "../../core/multitenancy/workspace.store";

@Component({
  selector: "aos-time-tracking",
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    Button,
    Icons,
    Select,
    TimeEntryModal,
    TimeEntryDeleteModal,
    TimeTrackingDiscardModal,
  ],
  providers: [
    provideIcons({
      lucideClock,
      lucidePause,
      lucidePlay,
      lucideSquare,
      lucidePlus,
      lucideTrash2,
      lucideSearch,
      lucideFilter,
      lucideCheckCircle2,
      lucideAlertCircle,
      lucideDollarSign,
      lucideXCircle,
      lucideRefreshCw,
      lucideShieldCheck,
      lucideUser,
    }),
  ],
  templateUrl: "./time-tracking.html",
})
export class TimeTrackingComponent {
  readonly tm = inject(TimeTrackingManagement);
  readonly workspaceStore = inject(WorkspaceStore);

  readonly isMember = computed(() => {
    const role = this.workspaceStore.activeWorkspace()?.role;
    return role === "MEMBER";
  });

  readonly isOwnerOrAdmin = computed(() => {
    const role = this.workspaceStore.activeWorkspace()?.role;
    return role === "OWNER" || role === "ADMIN";
  });

  readonly canTrackTime = computed(() => {
    const role = this.workspaceStore.activeWorkspace()?.role;
    return role !== "CLIENT";
  });

  readonly projectFilterOptions = computed<SelectOption<string>[]>(() => {
    return [
      { label: "All Projects", value: "ALL" },
      ...this.tm.projects().map(p => ({ label: p.name, value: p.id })),
    ];
  });

  readonly memberFilterOptions = computed<SelectOption<string>[]>(() => {
    return [
      { label: "All Team Members", value: "ALL" },
      ...this.tm.members().map(m => ({
        label: `${m.firstName} ${m.lastName} (@${m.username})`,
        value: m.userId,
      })),
    ];
  });

  readonly billableFilterOptions: SelectOption<BillableFilter>[] = [
    { label: "All Types", value: "ALL" },
    { label: "Billable Only", value: "BILLABLE" },
    { label: "Non-Billable", value: "NON_BILLABLE" },
  ];

  formatDuration(minutes: number): string {
    if (!minutes || minutes <= 0) return "0m";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  getTaskTitle(taskId: string): string {
    return this.tm.taskMap().get(taskId)?.title || "Unknown Task";
  }

  getProjectName(taskId: string): string {
    const task = this.tm.taskMap().get(taskId);
    if (!task) return "—";
    return this.tm.projectMap().get(task.projectId)?.name || "—";
  }

  onStartActiveTimer(): void {
    this.tm.openStartTimerModal();
  }

  onTogglePause(): void {
    if (this.tm.isPaused()) {
      this.tm.resumeTimer();
    } else {
      this.tm.pauseTimer();
    }
  }

  onStopActiveTimer(isBillable = true): void {
    this.tm.stopTimer(isBillable);
  }

  onDiscardActiveTimer(): void {
    this.tm.openDiscardModal();
  }

  onDeleteEntry(entry: TimeEntryResponse): void {
    this.tm.openDeleteModal(entry);
  }
}
