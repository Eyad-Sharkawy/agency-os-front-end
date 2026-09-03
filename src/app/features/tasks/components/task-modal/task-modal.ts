import { Component, computed, effect, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideCalendar,
  lucideCheck,
  lucideClock,
  lucideFolderKanban,
  lucideLoader2,
  lucideUsers,
  lucideX,
} from "@ng-icons/lucide";
import { TaskPriority, TaskRequest, TaskStatus } from "../../../../core/api/models/task.models";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { Select, SelectOption } from "../../../../shared/components/select/select";
import { TaskManagement } from "../../services/task-management";

@Component({
  selector: "aos-task-modal",
  standalone: true,
  imports: [FormsModule, Button, Icons, Select],
  providers: [
    provideIcons({
      lucideX,
      lucideFolderKanban,
      lucideCalendar,
      lucideClock,
      lucideUsers,
      lucideCheck,
      lucideLoader2,
      lucideAlertCircle,
    }),
  ],
  templateUrl: "./task-modal.html",
})
export class TaskModal {
  readonly tm = inject(TaskManagement);

  readonly isOpen = computed(() => this.tm.isCreateModalOpen() || this.tm.isEditModalOpen());
  readonly isEditMode = computed(() => this.tm.isEditModalOpen());
  readonly taskToEdit = computed(() => this.tm.selectedTask());

  // Form Fields
  readonly title = signal("");
  readonly description = signal("");
  readonly projectId = signal("");
  readonly status = signal<TaskStatus>("TODO");
  readonly priority = signal<TaskPriority>("MEDIUM");
  readonly estimatedHours = signal<number | null>(null);
  readonly startDate = signal("");
  readonly dueDate = signal("");
  readonly assigneesText = signal("");

  // Submission State
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly statusOptions: SelectOption<TaskStatus>[] = [
    {
      label: "To Do",
      value: "TODO",
      description: "Backlog item ready to be picked up",
    },
    {
      label: "In Progress",
      value: "IN_PROGRESS",
      description: "Currently being worked on by assignee",
    },
    {
      label: "Review",
      value: "REVIEW",
      description: "Code review, testing, or client approval",
    },
    {
      label: "Done",
      value: "DONE",
      description: "Finished and verified deliverables",
    },
  ];

  readonly priorityOptions: SelectOption<TaskPriority>[] = [
    {
      label: "Low",
      value: "LOW",
      description: "Minor enhancement or low-impact task",
    },
    {
      label: "Medium",
      value: "MEDIUM",
      description: "Standard priority sprint item",
    },
    {
      label: "High",
      value: "HIGH",
      description: "Important feature or impending deadline",
    },
    {
      label: "Urgent",
      value: "URGENT",
      description: "Blocker, production defect, or critical deliverable",
    },
  ];

  readonly projectOptions = computed<SelectOption<string>[]>(() => {
    return this.tm.projects().map(project => ({
      label: project.name,
      value: project.id,
      description: project.status,
    }));
  });

  readonly isTitleValid = computed(() => this.title().trim().length >= 2);
  readonly isProjectValid = computed(() => !!this.projectId());
  readonly isEstimationValid = computed(
    () => this.estimatedHours() === null || this.estimatedHours()! >= 0,
  );

  readonly isFormValid = computed(
    () => this.isTitleValid() && this.isProjectValid() && this.isEstimationValid(),
  );

  constructor() {
    effect(() => {
      const task = this.taskToEdit();
      if (this.isEditMode() && task) {
        this.title.set(task.title);
        this.description.set(task.description || "");
        this.projectId.set(task.projectId);
        this.status.set(task.status);
        this.priority.set(task.priority);
        this.estimatedHours.set(
          task.estimatedMinutes ? Math.round((task.estimatedMinutes / 60) * 10) / 10 : null,
        );
        this.startDate.set(this.formatDateForInput(task.startDate));
        this.dueDate.set(this.formatDateForInput(task.dueDate));
        this.assigneesText.set(task.assigneeIds ? task.assigneeIds.join(", ") : "");
        this.errorMessage.set(null);
      } else if (!this.isOpen()) {
        this.resetForm();
      } else if (this.isOpen() && !this.isEditMode()) {
        const activeFilter = this.tm.projectFilter();
        const validFilterProject = this.tm.projects().find(p => p.id === activeFilter);
        const defaultProjId = validFilterProject
          ? validFilterProject.id
          : this.tm.projects()[0]?.id || "";
        this.projectId.set(defaultProjId);
        this.status.set(this.tm.defaultStatusForCreate());
      }
    });
  }

  private resetForm(): void {
    this.title.set("");
    this.description.set("");
    this.projectId.set("");
    this.status.set("TODO");
    this.priority.set("MEDIUM");
    this.estimatedHours.set(null);
    this.startDate.set("");
    this.dueDate.set("");
    this.assigneesText.set("");
    this.errorMessage.set(null);
    this.isSubmitting.set(false);
  }

  private formatDateForInput(dateStr?: string): string {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  }

  private parseAssignees(inputStr: string): string[] {
    if (!inputStr.trim()) return [];
    return inputStr
      .split(",")
      .map(id => id.trim())
      .filter(id => id.length > 0);
  }

  onClose(): void {
    if (!this.isSubmitting()) {
      this.errorMessage.set(null);
      this.tm.closeModals();
    }
  }

  onSubmit(): void {
    if (!this.isFormValid() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload: TaskRequest = {
      title: this.title().trim(),
      description: this.description().trim() || undefined,
      projectId: this.projectId(),
      status: this.status(),
      priority: this.priority(),
      estimatedMinutes:
        this.estimatedHours() !== null ? Math.round(Number(this.estimatedHours()) * 60) : undefined,
      startDate: this.startDate() ? new Date(this.startDate()).toISOString() : undefined,
      dueDate: this.dueDate() ? new Date(this.dueDate()).toISOString() : undefined,
      assigneeIds: this.parseAssignees(this.assigneesText()),
    };

    const action$ = this.isEditMode()
      ? this.tm.updateTask(this.taskToEdit()!.id, payload)
      : this.tm.createTask(payload);

    action$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.tm.closeModals();
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to save task.");
        this.errorMessage.set(detail);
      },
    });
  }
}
