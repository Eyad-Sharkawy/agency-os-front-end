import { computed, effect, inject, Injectable, OnDestroy, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin, catchError, of, finalize } from "rxjs";
import {
  ActiveTimerResponse,
  TimeEntryRequest,
  TimeEntryResponse,
} from "../../../core/api/models/time-entry.models";
import { TaskResponse } from "../../../core/api/models/task.models";
import { ProjectResponse } from "../../../core/api/models/project.models";
import { WorkspaceMemberResponse } from "../../../core/api/models/workspace.models";
import { TimeEntryApi } from "../../../core/api/services/time-entry/time-entry-api";
import { TaskApi } from "../../../core/api/services/task/task-api";
import { ProjectApi } from "../../../core/api/services/project/project-api";
import { WorkspaceApi } from "../../../core/api/services/workspace/workspace-api";
import { WorkspaceStore } from "../../../core/multitenancy/workspace.store";

export type BillableFilter = "ALL" | "BILLABLE" | "NON_BILLABLE";
export type TimeTrackingAction = "manual" | "timer" | "delete" | "discard";

@Injectable({
  providedIn: "root",
})
export class TimeTrackingManagement implements OnDestroy {
  private readonly timeEntryApi = inject(TimeEntryApi);
  private readonly taskApi = inject(TaskApi);
  private readonly projectApi = inject(ProjectApi);
  private readonly workspaceApi = inject(WorkspaceApi);
  readonly workspaceStore = inject(WorkspaceStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParams = toSignal(this.route.queryParams);

  // State Signals
  readonly timeEntries = signal<TimeEntryResponse[]>([]);
  readonly activeTimer = signal<ActiveTimerResponse | null>(null);
  readonly activeTimerSeconds = signal<number>(0);
  readonly tasks = signal<TaskResponse[]>([]);
  readonly projects = signal<ProjectResponse[]>([]);
  readonly members = signal<WorkspaceMemberResponse[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Filter State
  readonly projectFilter = signal<string>("ALL");
  readonly billableFilter = signal<BillableFilter>("ALL");
  readonly memberFilter = signal<string>("ALL");
  readonly searchQuery = signal<string>("");

  // Modal State
  readonly isManualModalOpen = signal<boolean>(false);
  readonly modalMode = signal<"timer" | "manual">("manual");
  readonly preselectedTaskId = signal<string | null>(null);
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly selectedEntryForDelete = signal<TimeEntryResponse | null>(null);
  readonly isDiscardModalOpen = signal<boolean>(false);

  // Interval and state reference for live timer
  private timerIntervalId: ReturnType<typeof setInterval> | null = null;
  private accumulatedSeconds = 0;
  private lastResumeTimestamp: number | null = null;
  readonly isPaused = signal<boolean>(false);
  private readonly STOPWATCH_KEY = "agency_os_stopwatch_state";

  constructor() {
    effect(() => {
      const active = this.activeTimer();
      if (active) {
        this.startTicker(active);
      } else {
        this.stopTicker();
      }
    });

    effect(() => {
      const tenantId = this.workspaceStore.activeTenantId();
      if (tenantId) {
        this.loadInitialData();
      }
    });

    effect(() => {
      this.syncUrlActionState(this.queryParams());
    });
  }

  ngOnDestroy(): void {
    this.stopTicker();
  }

  pauseTimer(): void {
    const active = this.activeTimer();
    if (!active || this.isPaused()) return;

    if (this.lastResumeTimestamp !== null) {
      const elapsed = Math.max(0, Math.floor((Date.now() - this.lastResumeTimestamp) / 1000));
      this.accumulatedSeconds += elapsed;
      this.lastResumeTimestamp = null;
    }

    this.isPaused.set(true);
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
    this.activeTimerSeconds.set(this.accumulatedSeconds);
    this.saveStoredState(active.taskId);

    this.timeEntryApi.pauseTimer().subscribe({
      next: updated => {
        this.activeTimer.set(updated);
      },
      error: () => {
        // UI already paused optimistically
      },
    });
  }

  resumeTimer(): void {
    const active = this.activeTimer();
    if (!active || !this.isPaused()) return;

    this.isPaused.set(false);
    this.lastResumeTimestamp = Date.now();
    this.saveStoredState(active.taskId);

    this.startTickerInterval();

    this.timeEntryApi.resumeTimer().subscribe({
      next: updated => {
        this.activeTimer.set(updated);
      },
      error: () => {
        // UI already resumed optimistically
      },
    });
  }

  private startTickerInterval(): void {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
    }
    this.updateElapsedSeconds();
    this.timerIntervalId = setInterval(() => this.updateElapsedSeconds(), 1000);
  }

  private updateElapsedSeconds(): void {
    const elapsedSinceResume =
      this.lastResumeTimestamp !== null
        ? Math.max(0, Math.floor((Date.now() - this.lastResumeTimestamp) / 1000))
        : 0;
    this.activeTimerSeconds.set(this.accumulatedSeconds + elapsedSinceResume);
  }

  private startTicker(timer: ActiveTimerResponse): void {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }

    if (timer.isPaused !== undefined) {
      this.initTimerFromBackend(timer);
    } else {
      this.initTimerFallback(timer);
    }

    if (!this.isPaused()) {
      this.startTickerInterval();
    }
  }

  private initTimerFromBackend(timer: ActiveTimerResponse): void {
    this.accumulatedSeconds = timer.accumulatedSeconds || 0;
    if (timer.isPaused) {
      this.isPaused.set(true);
      this.lastResumeTimestamp = null;
      this.activeTimerSeconds.set(this.accumulatedSeconds);
      this.saveStoredState(timer.taskId);
    } else {
      this.isPaused.set(false);
      const resumeIso = timer.lastResumeTimestamp || timer.startTime;
      const resumeMs = new Date(resumeIso).getTime();
      this.lastResumeTimestamp = Number.isNaN(resumeMs) ? Date.now() : resumeMs;
      this.saveStoredState(timer.taskId);
    }
  }

  private initTimerFallback(timer: ActiveTimerResponse): void {
    const stored = this.loadStoredState(timer.taskId);
    if (stored) {
      this.accumulatedSeconds = stored.accumulatedSeconds || 0;
      if (stored.isPaused) {
        this.isPaused.set(true);
        this.lastResumeTimestamp = null;
        this.activeTimerSeconds.set(this.accumulatedSeconds);
        return;
      }
      this.isPaused.set(false);
      this.lastResumeTimestamp = stored.lastResumeTimestamp ?? Date.now();
    } else {
      const startMs = new Date(timer.startTime).getTime();
      this.accumulatedSeconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      this.lastResumeTimestamp = Date.now();
      this.isPaused.set(false);
      this.saveStoredState(timer.taskId);
    }
  }

  private stopTicker(): void {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
    this.isPaused.set(false);
    this.accumulatedSeconds = 0;
    this.lastResumeTimestamp = null;
    this.activeTimerSeconds.set(0);
    this.clearStoredState();
  }

  private loadStoredState(taskId: string): {
    taskId: string;
    isPaused: boolean;
    accumulatedSeconds: number;
    lastResumeTimestamp: number | null;
  } | null {
    try {
      const raw = localStorage.getItem(this.STOPWATCH_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.taskId === taskId) {
        return parsed;
      }
    } catch {
      // Ignore
    }
    return null;
  }

  private saveStoredState(taskId: string): void {
    try {
      const state = {
        taskId,
        isPaused: this.isPaused(),
        accumulatedSeconds: this.accumulatedSeconds,
        lastResumeTimestamp: this.lastResumeTimestamp,
      };
      localStorage.setItem(this.STOPWATCH_KEY, JSON.stringify(state));
    } catch {
      // Ignore
    }
  }

  private clearStoredState(): void {
    try {
      localStorage.removeItem(this.STOPWATCH_KEY);
    } catch {
      // Ignore
    }
  }

  // Computed Properties
  readonly activeTimerFormatted = computed(() => {
    const totalSec = this.activeTimerSeconds();
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  });

  readonly activeTask = computed(() => {
    const timer = this.activeTimer();
    if (!timer) return null;
    return this.tasks().find(t => t.id === timer.taskId) ?? null;
  });

  readonly activeProject = computed(() => {
    const task = this.activeTask();
    if (!task) return null;
    return this.projects().find(p => p.id === task.projectId) ?? null;
  });

  readonly taskMap = computed(() => {
    const map = new Map<string, TaskResponse>();
    for (const task of this.tasks()) {
      map.set(task.id, task);
    }
    return map;
  });

  readonly projectMap = computed(() => {
    const map = new Map<string, ProjectResponse>();
    for (const project of this.projects()) {
      map.set(project.id, project);
    }
    return map;
  });

  readonly memberMap = computed(() => {
    const map = new Map<string, WorkspaceMemberResponse>();
    for (const m of this.members()) {
      if (m.keycloakId) {
        map.set(m.keycloakId, m);
      }
      map.set(m.userId, m);
      map.set(m.username, m);
    }
    return map;
  });

  getMember(userId: string): WorkspaceMemberResponse | null {
    return this.memberMap().get(userId) ?? null;
  }

  getMemberDisplayName(userId: string): string {
    const member = this.getMember(userId);
    if (!member) return "Team Member";
    if (member.firstName && member.lastName) {
      return `${member.firstName} ${member.lastName}`;
    }
    return member.username || member.email || "Team Member";
  }

  getMemberInitials(userId: string): string {
    const member = this.getMember(userId);
    if (!member) return userId ? userId.substring(0, 2).toUpperCase() : "TM";
    if (member.firstName && member.lastName) {
      return `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
    }
    return (member.username?.substring(0, 2) || "TM").toUpperCase();
  }

  readonly filteredEntries = computed(() => {
    let entries = this.timeEntries();
    const projectF = this.projectFilter();
    const billableF = this.billableFilter();
    const memberF = this.memberFilter();
    const query = this.searchQuery().trim().toLowerCase();
    const taskMap = this.taskMap();
    const projectMap = this.projectMap();

    if (projectF !== "ALL") {
      entries = entries.filter(e => {
        const t = taskMap.get(e.taskId);
        return t?.projectId === projectF;
      });
    }

    if (billableF === "BILLABLE") {
      entries = entries.filter(e => e.isBillable);
    } else if (billableF === "NON_BILLABLE") {
      entries = entries.filter(e => !e.isBillable);
    }

    if (memberF !== "ALL") {
      const targetMember = this.getMember(memberF);
      entries = entries.filter(e => {
        if (e.userId === memberF) return true;
        const entryMember = this.getMember(e.userId);
        if (targetMember && entryMember) {
          return (
            entryMember.userId === targetMember.userId ||
            (!!entryMember.keycloakId &&
              !!targetMember.keycloakId &&
              entryMember.keycloakId === targetMember.keycloakId)
          );
        }
        if (entryMember) {
          return (
            entryMember.userId === memberF ||
            entryMember.keycloakId === memberF ||
            entryMember.username === memberF
          );
        }
        if (targetMember) {
          return (
            targetMember.userId === e.userId ||
            targetMember.keycloakId === e.userId ||
            targetMember.username === e.userId
          );
        }
        return false;
      });
    }

    if (query) {
      const cleanQuery = query.startsWith("@") ? query.substring(1) : query;
      entries = entries.filter(e => {
        const task = taskMap.get(e.taskId);
        const taskMatches =
          (task?.title.toLowerCase().includes(query) ||
            (cleanQuery ? task?.title.toLowerCase().includes(cleanQuery) : false)) ??
          false;
        const project = task ? projectMap.get(task.projectId) : null;
        const projectMatches =
          (project?.name.toLowerCase().includes(query) ||
            (cleanQuery ? project?.name.toLowerCase().includes(cleanQuery) : false)) ??
          false;

        const member = this.getMember(e.userId);
        const memberFullName = member ? `${member.firstName} ${member.lastName}`.toLowerCase() : "";
        const memberUsername = member?.username ? member.username.toLowerCase() : "";
        const memberUsernameWithAt = member?.username ? `@${member.username.toLowerCase()}` : "";
        const memberEmail = member?.email ? member.email.toLowerCase() : "";
        const memberDisplayName = this.getMemberDisplayName(e.userId).toLowerCase();
        const rawUserId = e.userId ? e.userId.toLowerCase() : "";

        const memberMatches =
          memberFullName.includes(query) ||
          (cleanQuery ? memberFullName.includes(cleanQuery) : false) ||
          memberUsername.includes(query) ||
          memberUsername.includes(cleanQuery) ||
          memberUsernameWithAt.includes(query) ||
          memberEmail.includes(query) ||
          (cleanQuery ? memberEmail.includes(cleanQuery) : false) ||
          memberDisplayName.includes(query) ||
          (cleanQuery ? memberDisplayName.includes(cleanQuery) : false) ||
          rawUserId.includes(query);

        return taskMatches || projectMatches || memberMatches;
      });
    }

    return [...entries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  });

  readonly totalMinutesLogged = computed(() => {
    return this.filteredEntries().reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
  });

  readonly totalBillableMinutes = computed(() => {
    return this.filteredEntries()
      .filter(e => e.isBillable)
      .reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
  });

  readonly billablePercentage = computed(() => {
    const total = this.totalMinutesLogged();
    if (total === 0) return 0;
    return Math.round((this.totalBillableMinutes() / total) * 100);
  });

  readonly totalHoursFormatted = computed(() => {
    const minutes = this.totalMinutesLogged();
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  });

  readonly billableHoursFormatted = computed(() => {
    const minutes = this.totalBillableMinutes();
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  });

  // Action methods
  loadInitialData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const tenantId = this.workspaceStore.activeTenantId();
    const members$ = tenantId
      ? this.workspaceApi.getMembers(tenantId).pipe(catchError(() => of([])))
      : of([]);

    forkJoin({
      entries: this.timeEntryApi.getTimeEntries().pipe(catchError(() => of([]))),
      active: this.timeEntryApi.getActiveTimer().pipe(catchError(() => of(null))),
      tasks: this.taskApi.getTasks().pipe(catchError(() => of([]))),
      projects: this.projectApi.getProjects().pipe(catchError(() => of([]))),
      members: members$,
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ entries, active, tasks, projects, members }) => {
          this.timeEntries.set(entries);
          this.activeTimer.set(active);
          this.tasks.set(tasks);
          this.projects.set(projects);
          this.members.set(members);
        },
        error: () => {
          this.errorMessage.set("Failed to load time tracking records.");
        },
      });
  }

  startTimer(taskId: string): void {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.clearStoredState();

    this.timeEntryApi
      .startTimer(taskId)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: timer => {
          this.activeTimer.set(timer);
          this.closeManualModal();
        },
        error: (err: unknown) => {
          const apiErr = err as { error?: { detail?: string }; message?: string };
          const detail = apiErr?.error?.detail || apiErr?.message || "Could not start timer.";
          this.errorMessage.set(detail);
        },
      });
  }

  stopTimer(isBillable = true): void {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const totalSec = this.activeTimerSeconds();
    const durationMinutes = Math.max(1, Math.round(totalSec / 60));

    this.timeEntryApi
      .stopTimer(isBillable, durationMinutes)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: loggedEntry => {
          this.activeTimer.set(null);
          this.stopTicker();
          this.timeEntries.update(list => [loggedEntry, ...list]);
        },
        error: (err: unknown) => {
          const apiErr = err as { error?: { detail?: string }; message?: string };
          const detail = apiErr?.error?.detail || apiErr?.message || "Failed to stop active timer.";
          this.errorMessage.set(detail);
        },
      });
  }

  discardTimer(): void {
    this.stopTimer(false);
  }

  logManualEntry(req: TimeEntryRequest): void {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.timeEntryApi
      .logTime(req)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: savedEntry => {
          this.timeEntries.update(list => [savedEntry, ...list]);
          this.closeManualModal();
        },
        error: (err: unknown) => {
          const apiErr = err as { error?: { detail?: string }; message?: string };
          const detail = apiErr?.error?.detail || apiErr?.message || "Failed to save time entry.";
          this.errorMessage.set(detail);
        },
      });
  }

  deleteEntry(id: string): void {
    this.timeEntryApi.deleteTimeEntry(id).subscribe({
      next: () => {
        this.timeEntries.update(list => list.filter(e => e.id !== id));
        this.closeDeleteModal();
      },
      error: () => {
        this.errorMessage.set("Failed to delete time entry.");
      },
    });
  }

  private syncUrlActionState(params: Record<string, unknown> | undefined): void {
    const action = params?.["action"] as TimeTrackingAction | undefined;
    const taskId = params?.["taskId"] as string | undefined;
    const entryId = params?.["entryId"] as string | undefined;

    if (!action) {
      if (this.isManualModalOpen() || this.isDeleteModalOpen() || this.isDiscardModalOpen()) {
        this.isManualModalOpen.set(false);
        this.isDeleteModalOpen.set(false);
        this.isDiscardModalOpen.set(false);
        this.selectedEntryForDelete.set(null);
        this.preselectedTaskId.set(null);
      }
      return;
    }

    if (action === "manual" || action === "timer") {
      this.modalMode.set(action);
      this.preselectedTaskId.set(taskId || null);
      this.isManualModalOpen.set(true);
      this.isDeleteModalOpen.set(false);
      this.isDiscardModalOpen.set(false);
      return;
    }

    if (action === "discard") {
      this.isDiscardModalOpen.set(true);
      this.isManualModalOpen.set(false);
      this.isDeleteModalOpen.set(false);
      return;
    }

    if (action === "delete" && entryId) {
      const entry = this.timeEntries().find(e => e.id === entryId);
      if (entry) {
        this.selectedEntryForDelete.set(entry);
        this.isDeleteModalOpen.set(true);
        this.isManualModalOpen.set(false);
        this.isDiscardModalOpen.set(false);
      }
    }
  }

  openDeleteModal(entry: TimeEntryResponse): void {
    this.selectedEntryForDelete.set(entry);
    this.isDeleteModalOpen.set(true);
    this.router.navigate([], {
      queryParams: { action: "delete", entryId: entry.id, taskId: null },
      queryParamsHandling: "merge",
    });
  }

  closeDeleteModal(): void {
    this.closeModals();
  }

  openDiscardModal(): void {
    this.isDiscardModalOpen.set(true);
    this.router.navigate([], {
      queryParams: { action: "discard", entryId: null, taskId: null },
      queryParamsHandling: "merge",
    });
  }

  closeDiscardModal(): void {
    this.closeModals();
  }

  confirmDiscardTimer(): void {
    this.discardTimer();
    this.closeModals();
  }

  openManualModal(mode: "timer" | "manual" = "manual", taskId?: string): void {
    this.errorMessage.set(null);
    this.modalMode.set(mode);
    this.preselectedTaskId.set(taskId || null);
    this.isManualModalOpen.set(true);
    this.router.navigate([], {
      queryParams: { action: mode, taskId: taskId || null, entryId: null },
      queryParamsHandling: "merge",
    });
  }

  openStartTimerModal(taskId?: string): void {
    this.openManualModal("timer", taskId);
  }

  setModalMode(mode: "timer" | "manual"): void {
    this.modalMode.set(mode);
    this.router.navigate([], {
      queryParams: { action: mode },
      queryParamsHandling: "merge",
    });
  }

  closeManualModal(): void {
    this.closeModals();
  }

  closeModals(): void {
    this.isManualModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.isDiscardModalOpen.set(false);
    this.selectedEntryForDelete.set(null);
    this.preselectedTaskId.set(null);
    this.router.navigate([], {
      queryParams: { action: null, entryId: null, taskId: null },
      queryParamsHandling: "merge",
    });
  }
}
