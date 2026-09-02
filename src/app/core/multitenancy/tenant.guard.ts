import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from "@angular/router";
import { WorkspaceStore } from "./workspace.store";

/**
 * Route guard that ensures an active tenant workspace is selected and matches
 * the :workspaceId route parameter. If :workspaceId is provided, looks up and activates
 * that workspace, or loads workspaces if not yet cached. Redirects to /workspaces on failure.
 */
export const tenantGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
): Promise<boolean | UrlTree> => {
  const workspaceStore = inject(WorkspaceStore);
  const router = inject(Router);

  const workspaceId =
    route.paramMap.get("workspaceId") || route.parent?.paramMap.get("workspaceId");

  if (workspaceId) {
    let workspaces = workspaceStore.workspaces();
    if (workspaces.length === 0) {
      workspaces = await workspaceStore.loadWorkspaces();
    }

    const matched = workspaces.find(ws => ws.id === workspaceId || ws.tenantId === workspaceId);

    if (matched) {
      if (workspaceStore.activeWorkspace()?.id !== matched.id) {
        workspaceStore.setActiveWorkspace(matched);
      }
      return true;
    }

    return router.createUrlTree(["/workspaces"]);
  }

  // Fallback for legacy routes without :workspaceId in paramMap
  if (workspaceStore.hasActiveWorkspace()) {
    return true;
  }

  const workspaces = await workspaceStore.loadWorkspaces();
  if (workspaces.length > 0 && workspaceStore.hasActiveWorkspace()) {
    return true;
  }

  return router.createUrlTree(["/workspaces"]);
};
