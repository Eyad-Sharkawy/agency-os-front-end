import { Component, computed, effect, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideBuilding2,
  lucideCheck,
  lucideDollarSign,
  lucideFolderKanban,
  lucideLoader2,
  lucideX,
} from "@ng-icons/lucide";
import { ProjectRequest, ProjectStatus } from "../../../../core/api/models/project.models";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { Select, SelectOption } from "../../../../shared/components/select/select";
import { ProjectManagement } from "../../services/project-management";

@Component({
  selector: "aos-project-modal",
  standalone: true,
  imports: [FormsModule, Button, Icons, Select],
  providers: [
    provideIcons({
      lucideX,
      lucideFolderKanban,
      lucideBuilding2,
      lucideDollarSign,
      lucideCheck,
      lucideLoader2,
      lucideAlertCircle,
    }),
  ],
  templateUrl: "./project-modal.html",
})
export class ProjectModal {
  readonly pm = inject(ProjectManagement);

  readonly isOpen = computed(() => this.pm.isCreateModalOpen() || this.pm.isEditModalOpen());
  readonly isEditMode = computed(() => this.pm.isEditModalOpen());
  readonly projectToEdit = computed(() => this.pm.selectedProject());

  // Form Fields
  readonly name = signal("");
  readonly description = signal("");
  readonly clientId = signal("");
  readonly status = signal<ProjectStatus>("PLANNING");
  readonly budget = signal<number | null>(0);
  readonly billingRate = signal<number | null>(100);

  // Submission State
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly statusOptions: SelectOption<ProjectStatus>[] = [
    {
      label: "Planning",
      value: "PLANNING",
      description: "Initial scoping, architecture & requirements",
    },
    {
      label: "In Progress",
      value: "IN_PROGRESS",
      description: "Active sprint execution & development",
    },
    {
      label: "On Hold",
      value: "ON_HOLD",
      description: "Paused pending client feedback or approvals",
    },
    {
      label: "Delivered",
      value: "DELIVERED",
      description: "Completed, deployed, and handed off",
    },
  ];

  readonly clientOptions = computed<SelectOption<string>[]>(() => {
    return this.pm.clients().map(client => ({
      label: client.name,
      value: client.id,
      description: client.email,
    }));
  });

  readonly isNameValid = computed(() => this.name().trim().length >= 2);
  readonly isClientValid = computed(() => !!this.clientId());
  readonly isRateValid = computed(() => this.billingRate() !== null && this.billingRate()! >= 0);
  readonly isBudgetValid = computed(() => this.budget() === null || this.budget()! >= 0);

  readonly isFormValid = computed(
    () => this.isNameValid() && this.isClientValid() && this.isRateValid() && this.isBudgetValid(),
  );

  constructor() {
    effect(() => {
      const project = this.projectToEdit();
      if (this.isEditMode() && project) {
        this.name.set(project.name);
        this.description.set(project.description || "");
        this.clientId.set(project.clientId);
        this.status.set(project.status);
        this.budget.set(project.budget ?? 0);
        this.billingRate.set(project.billingRate ?? 0);
        this.errorMessage.set(null);
      } else if (!this.isOpen()) {
        this.name.set("");
        this.description.set("");
        this.clientId.set(this.pm.clients()[0]?.id || "");
        this.status.set("PLANNING");
        this.budget.set(0);
        this.billingRate.set(100);
        this.errorMessage.set(null);
        this.isSubmitting.set(false);
      } else if (this.isOpen() && !this.clientId() && this.pm.clients().length > 0) {
        this.clientId.set(this.pm.clients()[0].id);
      }
    });
  }

  onClose(): void {
    if (!this.isSubmitting()) {
      this.errorMessage.set(null);
      this.pm.closeModals();
    }
  }

  onSubmit(): void {
    if (!this.isFormValid() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload: ProjectRequest = {
      name: this.name().trim(),
      description: this.description().trim() || undefined,
      clientId: this.clientId(),
      status: this.status(),
      budget: Number(this.budget() ?? 0),
      billingRate: Number(this.billingRate() ?? 0),
    };

    const action$ = this.isEditMode()
      ? this.pm.updateProject(this.projectToEdit()!.id, payload)
      : this.pm.createProject(payload);

    action$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.pm.closeModals();
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to save project.");
        this.errorMessage.set(detail);
      },
    });
  }
}
