import { computed, inject } from "@angular/core";
import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";
import { firstValueFrom } from "rxjs";
import { WorkspaceResponse } from "../api/models/workspace.models";
import { WorkspaceApi } from "../api/services/workspace/workspace-api";
import { LOCAL_STORAGE } from "../tokens/local-storage/local-storage.token";

export interface WorkspaceState {
  workspaces: WorkspaceResponse[];
  activeWorkspace: WorkspaceResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: WorkspaceState = {
  workspaces: [],
  activeWorkspace: null,
  isLoading: false,
  error: null,
};

const ACTIVE_TENANT_STORAGE_KEY = "agency_os_active_tenant_id";

export const WorkspaceStore = signalStore(
  { providedIn: "root" },
  withState(initialState),
  withComputed(store => ({
    activeTenantId: computed(() => {
      const active = store.activeWorkspace()?.tenantId;
      if (active) return active;
      try {
        return localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY) ?? null;
      } catch {
        return null;
      }
    }),
    activeRole: computed(() => store.activeWorkspace()?.role ?? null),
    hasActiveWorkspace: computed(() => store.activeWorkspace() !== null),
    workspaceCount: computed(() => store.workspaces().length),
  })),
  withMethods(
    (store, workspaceService = inject(WorkspaceApi), storage = inject(LOCAL_STORAGE)) => ({
      async loadWorkspaces(): Promise<WorkspaceResponse[]> {
        patchState(store, { isLoading: true, error: null });
        try {
          const workspaces = await firstValueFrom(workspaceService.getWorkspaces());
          const savedTenantId = storage.getItem(ACTIVE_TENANT_STORAGE_KEY);
          let active = workspaces.find(w => w.tenantId === savedTenantId) ?? null;

          if (!active && workspaces.length > 0) {
            active = workspaces[0];
            storage.setItem(ACTIVE_TENANT_STORAGE_KEY, active.tenantId);
          }

          patchState(store, {
            workspaces,
            activeWorkspace: active,
            isLoading: false,
          });

          return workspaces;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to load workspaces";
          patchState(store, {
            isLoading: false,
            error: message,
          });
          return [];
        }
      },

      setActiveWorkspace(workspace: WorkspaceResponse | null): void {
        if (workspace) {
          storage.setItem(ACTIVE_TENANT_STORAGE_KEY, workspace.tenantId);
        } else {
          storage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
        }
        patchState(store, { activeWorkspace: workspace });
      },

      setActiveTenantId(tenantId: string): void {
        const target = store.workspaces().find(w => w.tenantId === tenantId) ?? null;
        this.setActiveWorkspace(target);
      },

      clear(): void {
        storage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
        patchState(store, initialState);
      },
    }),
  ),
);
