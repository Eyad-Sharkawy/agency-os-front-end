import { Component, computed, input, output } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucideArrowRight, lucideCheck, lucideMail, lucideSettings } from "@ng-icons/lucide";
import { WorkspaceResponse, WorkspaceRole } from "../../../../core/api/models/workspace.models";
import { Icons } from "../../../../shared/components/icons/icons";
import { Button } from "../../../../shared/components/button/button";

@Component({
  selector: "aos-workspace-card",
  standalone: true,
  imports: [Icons, Button],
  providers: [
    provideIcons({
      lucideCheck,
      lucideSettings,
      lucideMail,
      lucideArrowRight,
    }),
  ],
  template: `
    <div
      role="button"
      tabindex="0"
      (click)="selected.emit(workspace())"
      (keydown.enter)="selected.emit(workspace())"
      (keydown.space)="$event.preventDefault(); selected.emit(workspace())"
      [class.border-ink]="isActive()"
      [class.ring-1]="isActive()"
      [class.ring-ink]="isActive()"
      class="group border-hairline bg-canvas hover:bg-soft-stone/30 relative flex w-full cursor-pointer flex-col justify-between rounded-sm border p-6 text-left transition-all duration-150 focus:outline-none"
    >
      <!-- Active Workspace Ribbon -->
      @if (isActive()) {
        <div
          class="bg-primary text-on-primary absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full px-3 py-0.5 font-mono text-[10px] font-semibold"
        >
          <aos-icons name="lucideCheck" class="size-3" />
          ACTIVE
        </div>
      }

      <div class="w-full">
        <!-- Header -->
        <div class="flex items-start justify-between gap-3">
          <div
            class="bg-primary text-on-primary flex size-12 shrink-0 items-center justify-center rounded-sm font-mono text-sm font-bold tracking-wider"
          >
            {{ initials() }}
          </div>

          <div class="flex items-center gap-1.5">
            <div class="flex flex-col items-end gap-1">
              @if (workspace().role) {
                <span
                  [class]="roleBadgeClass()"
                  class="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-wider uppercase"
                >
                  {{ workspace().role }}
                </span>
              }
              <span class="text-muted font-mono text-[10px]">
                {{ workspace().tenantId }}
              </span>
            </div>

            <!-- Edit / Manage Button -->
            @if (canManage()) {
              <aos-button
                variant="ghost"
                class="border-hairline hover:border-ink size-7 rounded-full border p-1"
                ariaLabel="Edit & Manage Workspace"
                (click)="onManageClick($event)"
                (keydown.enter)="onManageClick($event)"
              >
                <aos-icons name="lucideSettings" class="size-3.5" />
              </aos-button>
            }
          </div>
        </div>

        <!-- Workspace Name -->
        <div class="mt-5">
          <h3
            class="text-ink font-sans text-base font-semibold underline-offset-4 transition-colors group-hover:underline"
          >
            {{ workspace().name }}
          </h3>
          @if (workspace().contactEmail) {
            <p class="text-body-muted mt-1 flex items-center gap-1.5 font-mono text-xs">
              <aos-icons name="lucideMail" class="text-muted size-3.5 shrink-0" />
              <span class="truncate">{{ workspace().contactEmail }}</span>
            </p>
          }
        </div>
      </div>

      <!-- Footer -->
      <div class="border-hairline mt-6 flex w-full items-center justify-between border-t pt-4">
        <div class="flex items-center gap-1.5 font-mono text-[11px]">
          @if (workspace().isActive) {
            <span class="bg-brand-green size-2 rounded-full"></span>
            <span class="text-brand-green font-medium">Online</span>
          } @else {
            <span class="bg-muted size-2 rounded-full"></span>
            <span class="text-muted">Archived</span>
          }
        </div>

        <div
          class="text-ink inline-flex items-center gap-1 font-mono text-xs font-medium transition-transform group-hover:translate-x-0.5"
        >
          <span>{{ isActive() ? "Enter" : "Launch" }} &rarr;</span>
        </div>
      </div>
    </div>
  `,
})
export class WorkspaceCard {
  readonly workspace = input.required<WorkspaceResponse>();
  readonly isActive = input<boolean>(false);

  readonly selected = output<WorkspaceResponse>();
  readonly manage = output<WorkspaceResponse>();

  readonly canManage = computed(() => {
    const role = this.workspace().role;
    return role === "OWNER" || role === "ADMIN";
  });

  readonly initials = computed(() => {
    const name = this.workspace().name;
    if (!name) return "OS";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  readonly roleBadgeClass = computed(() => {
    const role: WorkspaceRole | undefined = this.workspace().role;
    switch (role) {
      case "OWNER":
        return "bg-brand-green/10 text-brand-green border border-brand-green/30";
      case "ADMIN":
        return "bg-primary/10 text-primary border border-primary/20 dark:bg-white/10 dark:text-white dark:border-white/20";
      case "MEMBER":
        return "bg-soft-stone text-ink border border-hairline";
      case "CLIENT":
        return "bg-soft-stone text-slate border border-hairline";
      default:
        return "bg-soft-stone text-muted border border-hairline";
    }
  });

  onManageClick(event: Event): void {
    event.stopPropagation();
    this.manage.emit(this.workspace());
  }
}
