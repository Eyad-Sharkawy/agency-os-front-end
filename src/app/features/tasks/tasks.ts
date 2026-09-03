import { DatePipe } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDropList,
  CdkDropListGroup,
} from "@angular/cdk/drag-drop";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideAlertTriangle,
  lucideArrowUpRight,
  lucideCheckCircle2,
  lucideCheckSquare,
  lucideChevronDown,
  lucideClock,
  lucideFilter,
  lucideFolderKanban,
  lucideGrid,
  lucideLayoutList,
  lucideLoader2,
  lucidePencil,
  lucidePlus,
  lucideRefreshCw,
  lucideSearch,
  lucideTrash2,
  lucideX,
} from "@ng-icons/lucide";
import { TaskPriority, TaskResponse, TaskStatus } from "../../core/api/models/task.models";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";
import { Select, SelectOption } from "../../shared/components/select/select";
import { TaskCard } from "./components/task-card/task-card";
import { TaskDeleteModal } from "./components/task-delete-modal/task-delete-modal";
import { TaskModal } from "./components/task-modal/task-modal";
import {
  TaskFilterPriority,
  TaskFilterStatus,
  TaskManagement,
  TaskViewMode,
} from "./services/task-management";

@Component({
  selector: "aos-tasks",
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    Button,
    Icons,
    Select,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    TaskCard,
    TaskModal,
    TaskDeleteModal,
  ],
  providers: [
    provideIcons({
      lucideCheckSquare,
      lucidePlus,
      lucideSearch,
      lucideGrid,
      lucideLayoutList,
      lucideRefreshCw,
      lucideX,
      lucideFolderKanban,
      lucideFilter,
      lucideClock,
      lucideAlertTriangle,
      lucideArrowUpRight,
      lucideLoader2,
      lucideCheckCircle2,
      lucideAlertCircle,
      lucidePencil,
      lucideTrash2,
      lucideChevronDown,
    }),
  ],
  templateUrl: "./tasks.html",
})
export class TasksComponent implements OnInit {
  readonly tm = inject(TaskManagement);

  readonly projectFilterOptions = computed<SelectOption<string>[]>(() => {
    const list: SelectOption<string>[] = [{ label: "All Projects", value: "ALL" }];
    for (const p of this.tm.projects()) {
      list.push({ label: p.name, value: p.id });
    }
    return list;
  });

  readonly priorityFilterOptions: SelectOption<TaskFilterPriority>[] = [
    { label: "All Priorities", value: "ALL" },
    { label: "Low", value: "LOW" },
    { label: "Medium", value: "MEDIUM" },
    { label: "High", value: "HIGH" },
    { label: "Urgent", value: "URGENT" },
  ];

  readonly statusFilterOptions: SelectOption<TaskFilterStatus>[] = [
    { label: "All Statuses", value: "ALL" },
    { label: "To Do", value: "TODO" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Review", value: "REVIEW" },
    { label: "Done", value: "DONE" },
  ];

  readonly connectedDropLists = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
  readonly isDragging = signal(false);
  readonly draggingTask = signal<TaskResponse | null>(null);

  ngOnInit(): void {
    this.tm.loadTasks();
  }

  onSearch(query: string): void {
    this.tm.setSearchQuery(query);
  }

  onProjectFilter(projectId: string): void {
    this.tm.setProjectFilter(projectId);
  }

  onPriorityFilter(priority: TaskFilterPriority): void {
    this.tm.setPriorityFilter(priority);
  }

  onStatusFilter(status: TaskFilterStatus): void {
    this.tm.setStatusFilter(status);
  }

  onViewMode(mode: TaskViewMode): void {
    this.tm.setViewMode(mode);
  }

  onDragStarted(task: TaskResponse): void {
    if (!this.tm.canUpdateStatus()) {
      return;
    }
    this.isDragging.set(true);
    this.draggingTask.set(task);
  }

  onDragEnded(): void {
    this.isDragging.set(false);
    this.draggingTask.set(null);
  }

  onDrop(event: CdkDragDrop<TaskResponse[]>, explicitStatus?: TaskStatus): void {
    this.isDragging.set(false);
    this.draggingTask.set(null);

    if (!this.tm.canUpdateStatus()) {
      return;
    }

    const task = event.item.data as TaskResponse;
    const targetStatus = explicitStatus ?? (event.container.id as TaskStatus);

    const isSameColumn =
      event.previousContainer === event.container ||
      Boolean(event.previousContainer?.id && event.previousContainer.id === event.container.id);

    if (isSameColumn) {
      if (event.previousIndex !== event.currentIndex) {
        this.tm.reorderColumnTasks(targetStatus, event.previousIndex, event.currentIndex);
      }
    } else {
      this.tm.updateTaskStatus(task.id, targetStatus, event.currentIndex).subscribe({
        error: (err: unknown) => {
          const detail =
            (err as { error?: { detail?: string } })?.error?.detail ||
            (err instanceof Error ? err.message : "Failed to update task status.");
          this.tm.errorMessage.set(detail);
        },
      });
    }
  }

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

  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case "TODO":
        return "bg-soft-stone text-ink border-hairline";
      case "IN_PROGRESS":
        return "bg-brand-green/10 text-brand-green border-brand-green/20";
      case "REVIEW":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "DONE":
        return "bg-deep-green/10 text-deep-green dark:text-emerald-300 border-deep-green/20";
      default:
        return "bg-soft-stone text-muted border-hairline";
    }
  }

  getStatusDotClass(status: TaskStatus): string {
    switch (status) {
      case "TODO":
        return "bg-muted";
      case "IN_PROGRESS":
        return "bg-brand-green";
      case "REVIEW":
        return "bg-amber-500";
      case "DONE":
        return "bg-deep-green";
      default:
        return "bg-muted";
    }
  }

  getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case "TODO":
        return "To Do";
      case "IN_PROGRESS":
        return "In Progress";
      case "REVIEW":
        return "Review";
      case "DONE":
        return "Done";
      default:
        return status;
    }
  }

  isOverdue(task: TaskResponse): boolean {
    if (!task.dueDate || task.status === "DONE") return false;
    return new Date(task.dueDate).getTime() < Date.now();
  }

  getLoggedHours(task: TaskResponse): number {
    return Math.round((task.totalLoggedMinutes / 60) * 10) / 10;
  }

  getEstimatedHours(task: TaskResponse): number | null {
    return task.estimatedMinutes ? Math.round((task.estimatedMinutes / 60) * 10) / 10 : null;
  }
}
