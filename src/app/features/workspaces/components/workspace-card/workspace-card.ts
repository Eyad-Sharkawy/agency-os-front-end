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
      (keydown.space)="selected.emit(workspace())"
      [class.ring-2]="isActive()"
      [class.ring-primary]="isActive()"
      class="group border-outline-variant/60 bg-surface-container-lowest hover:border-primary/50 hover:shadow-primary/5 focus:ring-primary/40 relative flex cursor-pointer flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg focus:ring-2 focus:outline-none"
    >
      <!-- Active Workspace Indicator Ribbon -->
      @if (isActive()) {
        <div
          class="bg-primary text-on-primary absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-xs"
        >
          <aos-icons name="lucideCheck" class="size-3" />
          Active
        </div>
      }

      <div>
        <!-- Workspace Avatar & Role Header -->
        <div class="flex items-start justify-between gap-3">
          <div
            class="bg-primary/10 text-primary border-primary/20 flex size-12 shrink-0 items-center justify-center rounded-xl border text-sm font-extrabold tracking-wider shadow-inner"
          >
            {{ initials() }}
          </div>

          <div class="flex items-center gap-1.5">
            <div class="flex flex-col items-end gap-1">
              @if (workspace().role) {
                <span
                  [class]="roleBadgeClass()"
                  class="rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                >
                  {{ workspace().role }}
                </span>
              }
              <span class="text-on-surface-variant font-mono text-[10px]">
                {{ workspace().tenantId }}
              </span>
            </div>

            <!-- Edit / Manage Workspace Button (for Owners & Admins) -->
            @if (canManage()) {
              <aos-button
                variant="ghost"
                class="border-outline-variant/60 hover:border-primary/30 size-7.5 rounded-lg border"
                ariaLabel="Edit & Manage Workspace"
                (click)="onManageClick($event)"
                (keydown.enter)="onManageClick($event)"
              >
                <aos-icons name="lucideSettings" class="size-3.5" />
              </aos-button>
            }
          </div>
        </div>

        <!-- Workspace Info -->
        <div class="mt-4">
          <h3
            class="text-on-surface group-hover:text-primary text-base font-bold transition-colors"
          >
            {{ workspace().name }}
          </h3>
          @if (workspace().contactEmail) {
            <p class="text-on-surface-variant mt-1 flex items-center gap-1.5 text-xs">
              <aos-icons name="lucideMail" class="size-3.5 shrink-0" />
              <span class="truncate">{{ workspace().contactEmail }}</span>
            </p>
          }
        </div>
      </div>

      <!-- Footer / Action Area -->
      <div class="border-outline-variant/40 mt-5 flex items-center justify-between border-t pt-4">
        <div class="flex items-center gap-1.5 text-[11px] font-medium">
          @if (workspace().isActive) {
            <span class="size-2 rounded-full bg-emerald-500"></span>
            <span class="text-success font-semibold">Online</span>
          } @else {
            <span class="size-2 rounded-full bg-zinc-400"></span>
            <span class="text-on-surface-variant">Archived</span>
          }
        </div>

        <div
          class="group-hover:text-primary text-on-surface-variant inline-flex items-center gap-1 text-xs font-bold transition-colors"
        >
          <span>{{ isActive() ? "Continue" : "Launch" }}</span>
          <aos-icons
            name="lucideArrowRight"
            class="size-3.5 transition-transform group-hover:translate-x-0.5"
          />
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
        return "bg-primary/15 text-primary border-primary/25";
      case "ADMIN":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25";
      case "MEMBER":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25";
      case "CLIENT":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25";
      default:
        return "bg-surface-container-high text-on-surface-variant border-outline-variant";
    }
  });

  onManageClick(event: Event): void {
    event.stopPropagation();
    this.manage.emit(this.workspace());
  }
}
