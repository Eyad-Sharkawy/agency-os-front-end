import { Component, computed, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import {
  lucideArrowUpRight,
  lucideBriefcase,
  lucideClock,
  lucideFolderKanban,
  lucidePlus,
  lucideReceipt,
  lucideUsers,
} from "@ng-icons/lucide";
import { WorkspaceStore } from "../../core/multitenancy/workspace.store";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";

@Component({
  selector: "aos-dashboard-overview",
  standalone: true,
  imports: [RouterLink, Button, Icons],
  providers: [
    provideIcons({
      lucideUsers,
      lucideFolderKanban,
      lucideClock,
      lucideReceipt,
      lucideArrowUpRight,
      lucidePlus,
      lucideBriefcase,
    }),
  ],
  template: `
    <div class="space-y-8">
      @if (isLoading()) {
        <!-- Workspace Welcome Hero Banner Skeleton -->
        <div
          class="bg-canvas border-hairline relative animate-pulse overflow-hidden rounded-md border p-6 md:p-8"
        >
          <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div class="space-y-3">
              <div class="bg-soft-stone h-4 w-36 rounded-full"></div>
              <div class="bg-soft-stone h-8 w-64 rounded-xs"></div>
              <div class="bg-soft-stone h-4 w-80 max-w-full rounded-xs"></div>
            </div>

            <div class="flex items-center gap-2.5">
              <div class="bg-soft-stone rounded-pill h-9 w-28"></div>
              <div class="bg-soft-stone rounded-pill h-9 w-28"></div>
            </div>
          </div>
        </div>

        <!-- Quick Metrics Grid Skeleton -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (i of [1, 2, 3, 4]; track i) {
            <div
              class="border-hairline bg-canvas flex animate-pulse flex-col justify-between space-y-6 rounded-sm border p-5"
            >
              <div class="flex items-center justify-between">
                <div class="bg-soft-stone h-3.5 w-16 rounded-xs"></div>
                <div class="bg-soft-stone size-8 rounded-sm"></div>
              </div>
              <div class="space-y-2">
                <div class="bg-soft-stone h-7 w-24 rounded-xs"></div>
                <div class="bg-soft-stone h-3 w-28 rounded-xs"></div>
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- Workspace Welcome Hero Banner -->
        <div
          class="bg-canvas border-hairline relative overflow-hidden rounded-md border p-6 md:p-8"
        >
          <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div class="flex items-center gap-2">
                <span class="bg-brand-green size-2 rounded-full"></span>
                <span class="text-muted font-mono text-xs tracking-wider uppercase">
                  Active Tenant: {{ activeWorkspace()?.tenantId }}
                </span>
              </div>
              <h1 class="text-ink font-display mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                {{ activeWorkspace()?.name }}
              </h1>
              <p class="text-body-muted mt-1 text-sm">
                Operational command center for projects, client billing, team time tracking, and
                tasks.
              </p>
            </div>

            <div class="flex items-center gap-2.5">
              <a routerLink="time-tracking">
                <aos-button variant="outlined" size="sm">
                  <aos-icons name="lucideClock" class="size-4" />
                  <span class="ml-1.5 font-mono text-xs">Track Time</span>
                </aos-button>
              </a>
              <a routerLink="projects">
                <aos-button variant="primary" size="sm">
                  <aos-icons name="lucidePlus" class="size-4" />
                  <span class="ml-1.5 font-mono text-xs">New Project</span>
                </aos-button>
              </a>
            </div>
          </div>
        </div>

        <!-- Quick Metrics Grid -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Metric 1: Clients -->
          <div
            class="border-hairline bg-canvas hover:border-ink/40 flex flex-col justify-between rounded-sm border p-5 transition-colors"
          >
            <div class="flex items-center justify-between">
              <span class="text-muted font-mono text-xs uppercase">Clients</span>
              <div
                class="bg-soft-stone text-ink flex size-8 items-center justify-center rounded-sm"
              >
                <aos-icons name="lucideUsers" class="size-4" />
              </div>
            </div>
            <div class="mt-4">
              <div class="text-ink font-display text-2xl font-semibold">Active</div>
              <a
                routerLink="clients"
                class="text-brand-green hover:text-brand-green-dark dark:hover:text-brand-green-light mt-2 inline-flex items-center gap-1 font-mono text-xs transition-colors"
              >
                <span>Manage clients</span>
                <aos-icons name="lucideArrowUpRight" class="size-3" />
              </a>
            </div>
          </div>

          <!-- Metric 2: Projects -->
          <div
            class="border-hairline bg-canvas hover:border-ink/40 flex flex-col justify-between rounded-sm border p-5 transition-colors"
          >
            <div class="flex items-center justify-between">
              <span class="text-muted font-mono text-xs uppercase">Projects</span>
              <div
                class="bg-soft-stone text-ink flex size-8 items-center justify-center rounded-sm"
              >
                <aos-icons name="lucideFolderKanban" class="size-4" />
              </div>
            </div>
            <div class="mt-4">
              <div class="text-ink font-display text-2xl font-semibold">In Progress</div>
              <a
                routerLink="projects"
                class="text-brand-green hover:text-brand-green-dark dark:hover:text-brand-green-light mt-2 inline-flex items-center gap-1 font-mono text-xs transition-colors"
              >
                <span>View projects</span>
                <aos-icons name="lucideArrowUpRight" class="size-3" />
              </a>
            </div>
          </div>

          <!-- Metric 3: Time Tracked -->
          <div
            class="border-hairline bg-canvas hover:border-ink/40 flex flex-col justify-between rounded-sm border p-5 transition-colors"
          >
            <div class="flex items-center justify-between">
              <span class="text-muted font-mono text-xs uppercase">Time Tracked</span>
              <div
                class="bg-soft-stone text-ink flex size-8 items-center justify-center rounded-sm"
              >
                <aos-icons name="lucideClock" class="size-4" />
              </div>
            </div>
            <div class="mt-4">
              <div class="text-ink font-display text-2xl font-semibold">This Week</div>
              <a
                routerLink="time-tracking"
                class="text-brand-green hover:text-brand-green-dark dark:hover:text-brand-green-light mt-2 inline-flex items-center gap-1 font-mono text-xs transition-colors"
              >
                <span>View timesheet</span>
                <aos-icons name="lucideArrowUpRight" class="size-3" />
              </a>
            </div>
          </div>

          <!-- Metric 4: Invoices -->
          <div
            class="border-hairline bg-canvas hover:border-ink/40 flex flex-col justify-between rounded-sm border p-5 transition-colors"
          >
            <div class="flex items-center justify-between">
              <span class="text-muted font-mono text-xs uppercase">Invoices</span>
              <div
                class="bg-soft-stone text-ink flex size-8 items-center justify-center rounded-sm"
              >
                <aos-icons name="lucideReceipt" class="size-4" />
              </div>
            </div>
            <div class="mt-4">
              <div class="text-ink font-display text-2xl font-semibold">Billing</div>
              <a
                routerLink="invoices"
                class="text-brand-green hover:text-brand-green-dark dark:hover:text-brand-green-light mt-2 inline-flex items-center gap-1 font-mono text-xs transition-colors"
              >
                <span>Manage invoices</span>
                <aos-icons name="lucideArrowUpRight" class="size-3" />
              </a>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardOverview {
  private readonly workspaceStore = inject(WorkspaceStore);
  readonly activeWorkspace = computed(() => this.workspaceStore.activeWorkspace());
  readonly isLoading = computed(() => this.workspaceStore.isLoading() || !this.activeWorkspace());
}
