import { CurrencyPipe, DatePipe } from "@angular/common";
import { Component, computed, effect, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideAlertTriangle,
  lucideArrowUpRight,
  lucideBriefcase,
  lucideCalendar,
  lucideCheckCircle2,
  lucideCheckSquare,
  lucideClock,
  lucideDollarSign,
  lucideFolderKanban,
  lucideListTodo,
  lucideLoader2,
  lucidePause,
  lucidePlay,
  lucidePlus,
  lucideReceipt,
  lucideSquare,
  lucideTrendingUp,
  lucideUsers,
} from "@ng-icons/lucide";
import { catchError, forkJoin, of } from "rxjs";
import { ClientResponse } from "../../core/api/models/client.models";
import { InvoiceResponse } from "../../core/api/models/invoice.models";
import { ProjectResponse, ProjectStatus } from "../../core/api/models/project.models";
import { TaskPriority, TaskResponse, TaskStatus } from "../../core/api/models/task.models";
import { TimeEntryResponse } from "../../core/api/models/time-entry.models";
import { ClientApi } from "../../core/api/services/client/client-api";
import { InvoiceApi } from "../../core/api/services/invoice/invoice-api";
import { ProjectApi } from "../../core/api/services/project/project-api";
import { TaskApi } from "../../core/api/services/task/task-api";
import { TimeEntryApi } from "../../core/api/services/time-entry/time-entry-api";
import { WorkspaceStore } from "../../core/multitenancy/workspace.store";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";
import { TimeTrackingManagement } from "../time-tracking/services/time-tracking-management";

@Component({
  selector: "aos-dashboard-overview",
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, Button, Icons],
  providers: [
    provideIcons({
      lucideUsers,
      lucideFolderKanban,
      lucideClock,
      lucideReceipt,
      lucideArrowUpRight,
      lucidePlus,
      lucideBriefcase,
      lucideCheckSquare,
      lucideListTodo,
      lucideAlertCircle,
      lucideAlertTriangle,
      lucideCheckCircle2,
      lucidePlay,
      lucidePause,
      lucideSquare,
      lucideDollarSign,
      lucideTrendingUp,
      lucideLoader2,
      lucideCalendar,
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

            <div class="flex flex-wrap items-center gap-2.5">
              @if (canTrackTime()) {
                <a routerLink="time-tracking">
                  <aos-button variant="outlined" size="sm">
                    <aos-icons name="lucideClock" class="size-4" />
                    <span class="ml-1.5 font-mono text-xs">Track Time</span>
                  </aos-button>
                </a>
              }
              @if (canCreateTask()) {
                <a routerLink="tasks" [queryParams]="{ action: 'create' }">
                  <aos-button variant="outlined" size="sm">
                    <aos-icons name="lucideCheckSquare" class="size-4" />
                    <span class="ml-1.5 font-mono text-xs">New Task</span>
                  </aos-button>
                </a>
              }
              @if (canCreateProject()) {
                <a routerLink="projects" [queryParams]="{ action: 'create' }">
                  <aos-button variant="primary" size="sm">
                    <aos-icons name="lucidePlus" class="size-4" />
                    <span class="ml-1.5 font-mono text-xs">New Project</span>
                  </aos-button>
                </a>
              }
            </div>
          </div>
        </div>

        <!-- Active Stopwatch Banner (Live Widget) -->
        @if (activeTimer(); as timer) {
          <div
            class="relative overflow-hidden rounded-md border p-4 shadow-xs transition-colors sm:p-5"
            [class.border-brand-green/30]="!ttm.isPaused()"
            [class.bg-brand-green/5]="!ttm.isPaused()"
            [class.border-amber-500/30]="ttm.isPaused()"
            [class.bg-amber-500/5]="ttm.isPaused()"
          >
            <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  @if (!ttm.isPaused()) {
                    <span class="bg-brand-green relative flex size-2.5">
                      <span
                        class="bg-brand-green absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                      ></span>
                      <span
                        class="bg-brand-green relative inline-flex size-2.5 rounded-full"
                      ></span>
                    </span>
                    <span
                      class="text-brand-green font-mono text-xs font-semibold tracking-wider uppercase"
                    >
                      Stopwatch Active
                    </span>
                  } @else {
                    <span class="relative flex size-2.5 bg-amber-500">
                      <span class="relative inline-flex size-2.5 rounded-full bg-amber-500"></span>
                    </span>
                    <span
                      class="font-mono text-xs font-semibold tracking-wider text-amber-500 uppercase"
                    >
                      Stopwatch Paused
                    </span>
                  }
                </div>

                <h2 class="text-ink font-display text-base font-bold sm:text-lg">
                  {{ activeTimerTask()?.title || "Active Task" }}
                </h2>
                <p class="text-body-muted text-xs">
                  Project: {{ getProjectName(activeTimerTask()?.projectId || "") }}
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-4 sm:gap-6">
                <div
                  class="font-mono text-3xl font-bold tracking-wider transition-colors"
                  [class.text-ink]="!ttm.isPaused()"
                  [class.text-amber-600]="ttm.isPaused()"
                  [class.dark:text-amber-400]="ttm.isPaused()"
                >
                  {{ ttm.activeTimerFormatted() }}
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  @if (ttm.isPaused()) {
                    <aos-button
                      variant="primary"
                      size="sm"
                      (click)="ttm.resumeTimer()"
                      (keydown.enter)="ttm.resumeTimer()"
                    >
                      <aos-icons name="lucidePlay" class="size-3.5" />
                      <span class="ml-1.5 font-mono text-xs">Resume</span>
                    </aos-button>
                  } @else {
                    <aos-button
                      variant="outlined"
                      size="sm"
                      (click)="ttm.pauseTimer()"
                      (keydown.enter)="ttm.pauseTimer()"
                    >
                      <aos-icons name="lucidePause" class="size-3.5" />
                      <span class="ml-1.5 font-mono text-xs">Pause</span>
                    </aos-button>
                  }

                  <aos-button
                    variant="primary"
                    size="sm"
                    (click)="ttm.stopTimer(true)"
                    (keydown.enter)="ttm.stopTimer(true)"
                  >
                    <aos-icons name="lucideSquare" class="size-3.5" />
                    <span class="ml-1.5 font-mono text-xs">Stop & Save</span>
                  </aos-button>

                  <a routerLink="time-tracking">
                    <aos-button variant="outlined" size="sm">
                      <span class="font-mono text-xs">Timesheet</span>
                      <aos-icons name="lucideArrowUpRight" class="ml-1 size-3" />
                    </aos-button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Quick Metrics Grid -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Metric 1: Clients -->
          @if (canViewClients()) {
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
                <div class="text-ink font-display text-2xl font-semibold">
                  {{ clientStats().active }} Active
                </div>
                <div class="text-body-muted mt-1 font-mono text-xs">
                  {{ clientStats().total }} total ({{ clientStats().inactive }} inactive)
                </div>
                <a
                  routerLink="clients"
                  class="text-brand-green hover:text-brand-green-dark dark:hover:text-brand-green-light mt-3 inline-flex items-center gap-1 font-mono text-xs transition-colors"
                >
                  <span>Manage clients</span>
                  <aos-icons name="lucideArrowUpRight" class="size-3" />
                </a>
              </div>
            </div>
          }

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
              <div class="text-ink font-display text-2xl font-semibold">
                {{ projectStats().inProgress }} Active
              </div>
              <div class="text-body-muted mt-1 font-mono text-xs">
                {{ projectStats().total }} total · {{ projectStats().delivered }} delivered
              </div>
              <a
                routerLink="projects"
                class="text-brand-green hover:text-brand-green-dark dark:hover:text-brand-green-light mt-3 inline-flex items-center gap-1 font-mono text-xs transition-colors"
              >
                <span>View projects</span>
                <aos-icons name="lucideArrowUpRight" class="size-3" />
              </a>
            </div>
          </div>

          <!-- Metric 3: Tasks -->
          <div
            class="border-hairline bg-canvas hover:border-ink/40 flex flex-col justify-between rounded-sm border p-5 transition-colors"
          >
            <div class="flex items-center justify-between">
              <span class="text-muted font-mono text-xs uppercase">Tasks Backlog</span>
              <div
                class="bg-soft-stone text-ink flex size-8 items-center justify-center rounded-sm"
              >
                <aos-icons name="lucideCheckSquare" class="size-4" />
              </div>
            </div>
            <div class="mt-4">
              <div class="text-ink font-display text-2xl font-semibold">
                {{ taskStats().open }} Open
              </div>
              <div class="text-body-muted mt-1 font-mono text-xs">
                {{ taskStats().inProgress }} in progress · {{ taskStats().done }} done
              </div>
              <a
                routerLink="tasks"
                class="text-brand-green hover:text-brand-green-dark dark:hover:text-brand-green-light mt-3 inline-flex items-center gap-1 font-mono text-xs transition-colors"
              >
                <span>View tasks</span>
                <aos-icons name="lucideArrowUpRight" class="size-3" />
              </a>
            </div>
          </div>

          <!-- Metric 4: Time Tracked -->
          @if (canTrackTime()) {
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
                <div class="text-ink font-display text-2xl font-semibold">
                  {{ timeStats().totalHoursFormatted }}
                </div>
                <div class="text-body-muted mt-1 font-mono text-xs">
                  {{ timeStats().billableHoursFormatted }} billable ({{
                    timeStats().billablePercentage
                  }}%)
                </div>
                <a
                  routerLink="time-tracking"
                  class="text-brand-green hover:text-brand-green-dark dark:hover:text-brand-green-light mt-3 inline-flex items-center gap-1 font-mono text-xs transition-colors"
                >
                  <span>View timesheet</span>
                  <aos-icons name="lucideArrowUpRight" class="size-3" />
                </a>
              </div>
            </div>
          }

          <!-- Metric 5: Invoices (shown for CLIENT role when time/clients hidden, or in 4-grid) -->
          @if (!canTrackTime() || !canViewClients()) {
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
                <div class="text-ink font-display text-2xl font-semibold">
                  {{ invoiceStats().totalInvoiced | currency: "USD" : "symbol" : "1.0-0" }}
                </div>
                <div class="text-body-muted mt-1 font-mono text-xs">
                  {{ invoiceStats().paidCount }} paid · {{ invoiceStats().pendingCount }} pending
                </div>
                <a
                  routerLink="invoices"
                  class="text-brand-green hover:text-brand-green-dark dark:hover:text-brand-green-light mt-3 inline-flex items-center gap-1 font-mono text-xs transition-colors"
                >
                  <span>View invoices</span>
                  <aos-icons name="lucideArrowUpRight" class="size-3" />
                </a>
              </div>
            </div>
          }
        </div>

        <!-- Financial Overview Ribbon (OWNER / ADMIN) -->
        @if (canViewFinancials()) {
          <div class="border-hairline bg-canvas rounded-md border p-6">
            <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 class="text-ink font-display text-lg font-semibold">Financial Summary</h2>
                <p class="text-body-muted text-xs">
                  Total revenue collected, outstanding billings, and overdue balances.
                </p>
              </div>
              <a
                routerLink="invoices"
                class="text-brand-green hover:text-brand-green-dark inline-flex items-center gap-1 font-mono text-xs font-medium"
              >
                <span>Manage invoices</span>
                <aos-icons name="lucideArrowUpRight" class="size-3.5" />
              </a>
            </div>

            <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <!-- Billed Total -->
              <div class="border-hairline bg-soft-stone rounded-sm border p-4">
                <span class="text-muted font-mono text-xs uppercase">Total Billed</span>
                <div class="text-ink font-display mt-1 text-xl font-bold">
                  {{ invoiceStats().totalInvoiced | currency: "USD" : "symbol" : "1.0-0" }}
                </div>
                <span class="text-body-muted text-[11px]"
                  >{{ invoiceStats().totalCount }} invoices</span
                >
              </div>

              <!-- Paid Total -->
              <div
                class="rounded-sm border border-emerald-500/20 bg-emerald-500/5 p-4 dark:border-emerald-500/20"
              >
                <span class="font-mono text-xs text-emerald-700 uppercase dark:text-emerald-400">
                  Paid Revenue
                </span>
                <div
                  class="font-display mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300"
                >
                  {{ invoiceStats().totalPaid | currency: "USD" : "symbol" : "1.0-0" }}
                </div>
                <span class="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                  {{ invoiceStats().paidCount }} paid invoices
                </span>
              </div>

              <!-- Outstanding Total -->
              <div
                class="rounded-sm border border-amber-500/20 bg-amber-500/5 p-4 dark:border-amber-500/20"
              >
                <span class="font-mono text-xs text-amber-700 uppercase dark:text-amber-400">
                  Pending Billing
                </span>
                <div class="font-display mt-1 text-xl font-bold text-amber-700 dark:text-amber-300">
                  {{ invoiceStats().totalPending | currency: "USD" : "symbol" : "1.0-0" }}
                </div>
                <span class="text-[11px] text-amber-600/80 dark:text-amber-400/80">
                  {{ invoiceStats().pendingCount }} sent/draft
                </span>
              </div>

              <!-- Overdue Total -->
              <div
                class="rounded-sm border border-rose-500/20 bg-rose-500/5 p-4 dark:border-rose-500/20"
              >
                <span class="font-mono text-xs text-rose-700 uppercase dark:text-rose-400">
                  Overdue
                </span>
                <div class="font-display mt-1 text-xl font-bold text-rose-700 dark:text-rose-300">
                  {{ invoiceStats().totalOverdue | currency: "USD" : "symbol" : "1.0-0" }}
                </div>
                <span class="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                  {{ invoiceStats().overdueCount }} overdue
                </span>
              </div>
            </div>
          </div>
        }

        <!-- Dual Column Command Center: Recent Projects & Priority Tasks -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- Recent Projects Panel -->
          <div
            class="border-hairline bg-canvas flex flex-col justify-between rounded-md border p-6"
          >
            <div>
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-ink font-display text-lg font-semibold">Recent Projects</h2>
                  <p class="text-body-muted text-xs">Active projects and budget burn rates.</p>
                </div>
                <a
                  routerLink="projects"
                  class="text-brand-green hover:text-brand-green-dark inline-flex items-center gap-1 font-mono text-xs"
                >
                  <span>All projects</span>
                  <aos-icons name="lucideArrowUpRight" class="size-3" />
                </a>
              </div>

              <div class="mt-5 space-y-3.5">
                @if (recentProjects().length === 0) {
                  <div class="py-8 text-center">
                    <p class="text-muted text-sm">No projects found in this workspace.</p>
                    @if (canCreateProject()) {
                      <a
                        routerLink="projects"
                        [queryParams]="{ action: 'create' }"
                        class="mt-3 inline-block"
                      >
                        <aos-button variant="outlined" size="xs">Create Project</aos-button>
                      </a>
                    }
                  </div>
                } @else {
                  @for (project of recentProjects(); track project.id) {
                    <div
                      class="border-hairline bg-soft-stone/40 hover:bg-soft-stone/80 rounded-sm border p-3.5 transition-colors"
                    >
                      <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-2">
                            <h3 class="text-ink truncate text-sm font-semibold">
                              {{ project.name }}
                            </h3>
                            <span
                              class="rounded-pill border px-2 py-0.5 font-mono text-[10px] font-medium"
                              [class]="getStatusClass(project.status)"
                            >
                              {{ getStatusLabel(project.status) }}
                            </span>
                          </div>
                          <p class="text-muted truncate text-xs">
                            {{ getClientName(project.clientId) }}
                          </p>
                        </div>

                        @if (project.budget; as budget) {
                          <div class="text-right">
                            <div class="text-ink font-mono text-xs font-medium">
                              {{
                                getProjectSpent(project.id) | currency: "USD" : "symbol" : "1.0-0"
                              }}
                              / {{ budget | currency: "USD" : "symbol" : "1.0-0" }}
                            </div>
                            <div class="text-muted text-[10px]">
                              {{ getBudgetProgress(project.id).percentage }}% spent
                            </div>
                          </div>
                        }
                      </div>

                      @if (project.budget) {
                        <div class="bg-soft-stone mt-2.5 h-1.5 w-full overflow-hidden rounded-full">
                          <div
                            class="h-full rounded-full transition-all duration-300"
                            [class]="
                              getBudgetProgress(project.id).isOverBudget
                                ? 'bg-rose-500'
                                : getBudgetProgress(project.id).isNearBudget
                                  ? 'bg-amber-500'
                                  : 'bg-brand-green'
                            "
                            [style.width.%]="getBudgetProgress(project.id).cappedPercentage"
                          ></div>
                        </div>
                      }
                    </div>
                  }
                }
              </div>
            </div>

            @if (canCreateProject()) {
              <div class="border-hairline mt-4 border-t pt-4">
                <a routerLink="projects" [queryParams]="{ action: 'create' }" class="w-full">
                  <aos-button variant="outlined" size="sm" [fullWidth]="true">
                    <aos-icons name="lucidePlus" class="size-4" />
                    <span class="ml-1.5 font-mono text-xs">Add New Project</span>
                  </aos-button>
                </a>
              </div>
            }
          </div>

          <!-- Priority Tasks Panel -->
          <div
            class="border-hairline bg-canvas flex flex-col justify-between rounded-md border p-6"
          >
            <div>
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-ink font-display text-lg font-semibold">Priority Tasks</h2>
                  <p class="text-body-muted text-xs">
                    Urgent items, in-progress tasks, and reviews.
                  </p>
                </div>
                <a
                  routerLink="tasks"
                  class="text-brand-green hover:text-brand-green-dark inline-flex items-center gap-1 font-mono text-xs"
                >
                  <span>All tasks</span>
                  <aos-icons name="lucideArrowUpRight" class="size-3" />
                </a>
              </div>

              <div class="mt-5 space-y-3">
                @if (priorityTasks().length === 0) {
                  <div class="py-8 text-center">
                    <p class="text-muted text-sm">No pending tasks in this workspace.</p>
                    @if (canCreateTask()) {
                      <a
                        routerLink="tasks"
                        [queryParams]="{ action: 'create' }"
                        class="mt-3 inline-block"
                      >
                        <aos-button variant="outlined" size="xs">Create Task</aos-button>
                      </a>
                    }
                  </div>
                } @else {
                  @for (task of priorityTasks(); track task.id) {
                    <div
                      class="border-hairline bg-soft-stone/40 hover:bg-soft-stone/80 flex items-center justify-between gap-3 rounded-sm border p-3 transition-colors"
                    >
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                          <span
                            class="size-2 shrink-0 rounded-full"
                            [class]="getTaskStatusDotClass(task.status)"
                          ></span>
                          <span class="text-ink truncate text-sm font-medium">
                            {{ task.title }}
                          </span>
                        </div>
                        <div class="mt-1 flex items-center gap-2">
                          <span class="text-muted text-xs">
                            {{ getProjectName(task.projectId) }}
                          </span>
                          @if (task.dueDate) {
                            <span class="text-muted text-xs">·</span>
                            <span
                              class="font-mono text-[11px]"
                              [class]="
                                isTaskOverdue(task) ? 'font-semibold text-rose-600' : 'text-muted'
                              "
                            >
                              {{ isTaskOverdue(task) ? "Overdue: " : "Due "
                              }}{{ task.dueDate | date: "shortDate" }}
                            </span>
                          }
                        </div>
                      </div>

                      <div class="flex items-center gap-2">
                        <span
                          class="rounded-pill border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase"
                          [class]="getTaskPriorityClass(task.priority)"
                        >
                          {{ task.priority }}
                        </span>
                        <a
                          routerLink="tasks"
                          [queryParams]="{ action: 'edit', taskId: task.id }"
                          class="text-muted hover:text-ink transition-colors"
                        >
                          <aos-icons name="lucideArrowUpRight" class="size-4" />
                        </a>
                      </div>
                    </div>
                  }
                }
              </div>
            </div>

            @if (canCreateTask()) {
              <div class="border-hairline mt-4 border-t pt-4">
                <a routerLink="tasks" [queryParams]="{ action: 'create' }" class="w-full">
                  <aos-button variant="outlined" size="sm" [fullWidth]="true">
                    <aos-icons name="lucidePlus" class="size-4" />
                    <span class="ml-1.5 font-mono text-xs">Create New Task</span>
                  </aos-button>
                </a>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardOverview {
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly clientApi = inject(ClientApi);
  private readonly projectApi = inject(ProjectApi);
  private readonly taskApi = inject(TaskApi);
  private readonly timeEntryApi = inject(TimeEntryApi);
  private readonly invoiceApi = inject(InvoiceApi);
  readonly ttm = inject(TimeTrackingManagement);

  // State Signals
  readonly clients = signal<ClientResponse[]>([]);
  readonly projects = signal<ProjectResponse[]>([]);
  readonly tasks = signal<TaskResponse[]>([]);
  readonly timeEntries = signal<TimeEntryResponse[]>([]);
  readonly invoices = signal<InvoiceResponse[]>([]);
  readonly isDataLoading = signal<boolean>(false);

  readonly activeWorkspace = computed(() => this.workspaceStore.activeWorkspace());
  readonly isLoading = computed(
    () => this.workspaceStore.isLoading() || !this.activeWorkspace() || this.isDataLoading(),
  );

  readonly userRole = computed(() => this.activeWorkspace()?.role);

  readonly canTrackTime = computed(() => this.userRole() !== "CLIENT");
  readonly canCreateProject = computed(() => {
    const role = this.userRole();
    return role === "OWNER" || role === "ADMIN";
  });
  readonly canCreateTask = computed(() => {
    const role = this.userRole();
    return role === "OWNER" || role === "ADMIN" || role === "MEMBER";
  });
  readonly canViewClients = computed(() => this.userRole() !== "CLIENT");
  readonly canCreateInvoice = computed(() => {
    const role = this.userRole();
    return role === "OWNER" || role === "ADMIN";
  });
  readonly canViewFinancials = computed(() => {
    const role = this.userRole();
    return role === "OWNER" || role === "ADMIN";
  });

  // Active Timer Integration
  readonly activeTimer = computed(() => this.ttm.activeTimer());
  readonly activeTimerTask = computed(() => {
    const timer = this.activeTimer();
    if (!timer) return null;
    return this.tasks().find(t => t.id === timer.taskId) ?? null;
  });

  // Client Lookup Map
  readonly clientMap = computed<Map<string, ClientResponse>>(() => {
    const map = new Map<string, ClientResponse>();
    for (const c of this.clients()) {
      map.set(c.id, c);
    }
    return map;
  });

  // Project Lookup Map
  readonly projectMap = computed<Map<string, ProjectResponse>>(() => {
    const map = new Map<string, ProjectResponse>();
    for (const p of this.projects()) {
      map.set(p.id, p);
    }
    return map;
  });

  // Computed Aggregated Metrics
  readonly clientStats = computed(() => {
    const all = this.clients();
    return {
      total: all.length,
      active: all.filter(c => c.status === "ACTIVE").length,
      inactive: all.filter(c => c.status === "INACTIVE").length,
    };
  });

  readonly projectStats = computed(() => {
    const all = this.projects();
    return {
      total: all.length,
      inProgress: all.filter(p => p.status === "IN_PROGRESS").length,
      planning: all.filter(p => p.status === "PLANNING").length,
      onHold: all.filter(p => p.status === "ON_HOLD").length,
      delivered: all.filter(p => p.status === "DELIVERED").length,
      totalBudget: all.reduce((sum, p) => sum + (p.budget ?? 0), 0),
    };
  });

  readonly taskStats = computed(() => {
    const all = this.tasks();
    return {
      total: all.length,
      open: all.filter(t => t.status !== "DONE").length,
      todo: all.filter(t => t.status === "TODO").length,
      inProgress: all.filter(t => t.status === "IN_PROGRESS").length,
      review: all.filter(t => t.status === "REVIEW").length,
      done: all.filter(t => t.status === "DONE").length,
      overdue: all.filter(
        t => t.dueDate && t.status !== "DONE" && new Date(t.dueDate).getTime() < Date.now(),
      ).length,
    };
  });

  readonly timeStats = computed(() => {
    const all = this.timeEntries();
    const totalMinutes = all.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
    const billableMinutes = all
      .filter(e => e.isBillable)
      .reduce((sum, e) => sum + (e.durationMinutes || 0), 0);

    const totalHoursFormatted = this.formatDuration(totalMinutes);
    const billableHoursFormatted = this.formatDuration(billableMinutes);

    const billablePercentage =
      totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0;

    return {
      totalMinutes,
      billableMinutes,
      totalHoursFormatted,
      billableHoursFormatted,
      billablePercentage,
    };
  });

  formatDuration(minutes: number): string {
    if (minutes <= 0) {
      return "0h";
    }
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remMin}m`;
    }
    return `${remMin}m`;
  }

  readonly invoiceStats = computed(() => {
    const all = this.invoices();
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    for (const inv of all) {
      const amt = Number(inv.totalAmount) || 0;
      totalInvoiced += amt;
      if (inv.status === "PAID") {
        totalPaid += amt;
        paidCount++;
      } else if (inv.status === "SENT" || inv.status === "DRAFT") {
        totalPending += amt;
        pendingCount++;
      } else if (inv.status === "OVERDUE") {
        totalOverdue += amt;
        overdueCount++;
      }
    }

    return {
      totalCount: all.length,
      totalInvoiced,
      totalPaid,
      totalPending,
      totalOverdue,
      paidCount,
      pendingCount,
      overdueCount,
    };
  });

  // Recent Projects (Top 4)
  readonly recentProjects = computed(() => {
    return [...this.projects()]
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      )
      .slice(0, 4);
  });

  // Priority Tasks (Top 4 sorted by urgency & status)
  readonly priorityTasks = computed(() => {
    const priorityWeight: Record<TaskPriority, number> = {
      URGENT: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    return [...this.tasks()]
      .filter(t => t.status !== "DONE")
      .sort((a, b) => {
        const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (pDiff !== 0) return pDiff;
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      })
      .slice(0, 4);
  });

  constructor() {
    let lastTenantId: string | null = null;
    effect(() => {
      const tenantId = this.workspaceStore.activeTenantId();
      if (tenantId && tenantId !== lastTenantId) {
        lastTenantId = tenantId;
        this.loadDashboardData();
      }
    });
  }

  loadDashboardData(): void {
    this.isDataLoading.set(true);

    const isClient = this.userRole() === "CLIENT";

    forkJoin({
      clients: isClient ? of([]) : this.clientApi.getClients().pipe(catchError(() => of([]))),
      projects: this.projectApi.getProjects().pipe(catchError(() => of([]))),
      tasks: this.taskApi.getTasks().pipe(catchError(() => of([]))),
      timeEntries: isClient
        ? of([])
        : this.timeEntryApi.getTimeEntries().pipe(catchError(() => of([]))),
      invoices: this.invoiceApi.getInvoices().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ clients, projects, tasks, timeEntries, invoices }) => {
        this.clients.set(clients || []);
        this.projects.set(projects || []);
        this.tasks.set(tasks || []);
        this.timeEntries.set(timeEntries || []);
        this.invoices.set(invoices || []);
        this.isDataLoading.set(false);
      },
      error: () => {
        this.isDataLoading.set(false);
      },
    });
  }

  getClientName(clientId: string): string {
    return this.clientMap().get(clientId)?.name ?? "Client";
  }

  getProjectName(projectId: string): string {
    return this.projectMap().get(projectId)?.name ?? "Project";
  }

  getProjectSpent(projectId: string): number {
    const project = this.projects().find(p => p.id === projectId);
    if (!project) return 0;
    const projectTasks = this.tasks().filter(t => t.projectId === projectId);
    const totalMinutes = projectTasks.reduce((acc, t) => acc + (t.totalLoggedMinutes || 0), 0);
    return Math.round((totalMinutes / 60) * (project.billingRate || 0));
  }

  getBudgetProgress(projectId: string): {
    spent: number;
    budget: number | null;
    percentage: number;
    cappedPercentage: number;
    isOverBudget: boolean;
    isNearBudget: boolean;
  } {
    const project = this.projects().find(p => p.id === projectId);
    const spent = this.getProjectSpent(projectId);
    const budget = project?.budget ?? null;
    if (!budget || budget <= 0) {
      return {
        spent,
        budget,
        percentage: 0,
        cappedPercentage: 0,
        isOverBudget: false,
        isNearBudget: false,
      };
    }
    const percentage = Math.round((spent / budget) * 100);
    const cappedPercentage = Math.min(100, Math.max(0, percentage));
    const isOverBudget = spent > budget;
    const isNearBudget = percentage >= 80 && !isOverBudget;
    return { spent, budget, percentage, cappedPercentage, isOverBudget, isNearBudget };
  }

  isTaskOverdue(task: TaskResponse): boolean {
    if (!task.dueDate || task.status === "DONE") return false;
    return new Date(task.dueDate).getTime() < Date.now();
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

  getTaskStatusDotClass(status: TaskStatus): string {
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

  getTaskPriorityClass(priority: TaskPriority): string {
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
}
