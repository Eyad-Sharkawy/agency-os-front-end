import { CurrencyPipe, DatePipe } from "@angular/common";
import { Component, computed, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideArrowUpRight,
  lucideBuilding2,
  lucideCheckCircle2,
  lucideClock,
  lucideDollarSign,
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
import { ProjectStatus } from "../../core/api/models/project.models";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";
import { Select, SelectOption } from "../../shared/components/select/select";
import { ProjectCard } from "./components/project-card/project-card";
import { ProjectDeleteModal } from "./components/project-delete-modal/project-delete-modal";
import { ProjectModal } from "./components/project-modal/project-modal";
import {
  ProjectFilterStatus,
  ProjectManagement,
  ProjectViewMode,
} from "./services/project-management";

@Component({
  selector: "aos-projects",
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    FormsModule,
    RouterLink,
    Button,
    Icons,
    Select,
    ProjectCard,
    ProjectModal,
    ProjectDeleteModal,
  ],
  providers: [
    provideIcons({
      lucideFolderKanban,
      lucidePlus,
      lucideSearch,
      lucideGrid,
      lucideLayoutList,
      lucideRefreshCw,
      lucideX,
      lucideBuilding2,
      lucideCheckCircle2,
      lucideAlertCircle,
      lucideLoader2,
      lucidePencil,
      lucideTrash2,
      lucideArrowUpRight,
      lucideFilter,
      lucideDollarSign,
      lucideClock,
    }),
  ],
  templateUrl: "./projects.html",
})
export class ProjectsComponent implements OnInit {
  readonly pm = inject(ProjectManagement);

  readonly clientFilterOptions = computed<SelectOption<string>[]>(() => {
    const list: SelectOption<string>[] = [{ label: "All Clients", value: "ALL" }];
    for (const c of this.pm.clients()) {
      list.push({ label: c.name, value: c.id });
    }
    return list;
  });

  ngOnInit(): void {
    this.pm.loadProjects();
  }

  onSearch(query: string): void {
    this.pm.setSearchQuery(query);
  }

  onStatusFilter(status: ProjectFilterStatus): void {
    this.pm.setStatusFilter(status);
  }

  onClientFilter(clientId: string): void {
    this.pm.setClientFilter(clientId);
  }

  onViewMode(mode: ProjectViewMode): void {
    this.pm.setViewMode(mode);
  }

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
}
