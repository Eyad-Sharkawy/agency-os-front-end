import { CurrencyPipe, DatePipe } from "@angular/common";
import { Component, computed, inject, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import {
  lucideArrowUpRight,
  lucideBuilding2,
  lucideCalendar,
  lucideCheckSquare,
  lucideClock,
  lucideDollarSign,
  lucideFolderKanban,
  lucideMoreVertical,
  lucidePencil,
  lucideTrash2,
} from "@ng-icons/lucide";
import { ProjectResponse, ProjectStatus } from "../../../../core/api/models/project.models";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { ProjectManagement } from "../../services/project-management";

@Component({
  selector: "aos-project-card",
  standalone: true,
  imports: [DatePipe, CurrencyPipe, RouterLink, Icons, Button],
  providers: [
    provideIcons({
      lucideFolderKanban,
      lucideBuilding2,
      lucideCalendar,
      lucideDollarSign,
      lucideClock,
      lucideCheckSquare,
      lucidePencil,
      lucideTrash2,
      lucideMoreVertical,
      lucideArrowUpRight,
    }),
  ],
  templateUrl: "./project-card.html",
})
export class ProjectCard {
  readonly pm = inject(ProjectManagement);
  readonly project = input.required<ProjectResponse>();

  readonly clientName = computed(() => {
    return this.pm.getClientName(this.project().clientId);
  });

  getStatusClass(status: ProjectStatus): string {
    switch (status) {
      case "PLANNING":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "IN_PROGRESS":
        return "bg-brand-green/10 text-brand-green border-brand-green/20";
      case "ON_HOLD":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
      case "DELIVERED":
        return "bg-deep-green/10 text-deep-green dark:text-emerald-300 border-deep-green/20";
      default:
        return "bg-soft-stone text-muted border-hairline";
    }
  }

  getStatusDotClass(status: ProjectStatus): string {
    switch (status) {
      case "PLANNING":
        return "bg-amber-500";
      case "IN_PROGRESS":
        return "bg-brand-green";
      case "ON_HOLD":
        return "bg-orange-500";
      case "DELIVERED":
        return "bg-deep-green";
      default:
        return "bg-muted";
    }
  }

  getStatusLabel(status: ProjectStatus): string {
    switch (status) {
      case "PLANNING":
        return "Planning";
      case "IN_PROGRESS":
        return "In Progress";
      case "ON_HOLD":
        return "On Hold";
      case "DELIVERED":
        return "Delivered";
      default:
        return status;
    }
  }

  onEdit(): void {
    this.pm.openEditModal(this.project());
  }

  onDelete(): void {
    this.pm.openDeleteModal(this.project());
  }
}
