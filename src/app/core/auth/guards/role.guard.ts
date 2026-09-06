import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from "@angular/router";
import { WorkspaceStore } from "../../multitenancy/workspace.store";
import { WorkspaceRole } from "../../api/models/workspace.models";

/**
 * Route guard that verifies the current user has one of the allowed roles
 * specified in route data (`data: { roles: WorkspaceRole[] }`).
 * If the user's active role is not permitted, redirects to the Unauthorized view.
 */
export const roleGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
): Promise<boolean | UrlTree> => {
  const workspaceStore = inject(WorkspaceStore);
  const router = inject(Router);

  const allowedRoles = (route.data?.["roles"] as WorkspaceRole[]) || [];
  if (allowedRoles.length === 0) {
    return true;
  }

  // Ensure workspace state is loaded
  if (!workspaceStore.hasActiveWorkspace()) {
    const workspaces = await workspaceStore.loadWorkspaces();
    if (workspaces.length === 0) {
      return router.createUrlTree(["/workspaces"]);
    }
  }

  const activeRole = workspaceStore.activeRole();
  if (activeRole && allowedRoles.includes(activeRole)) {
    return true;
  }

  const workspaceId =
    route.paramMap.get("workspaceId") ||
    route.parent?.paramMap.get("workspaceId") ||
    workspaceStore.activeWorkspace()?.tenantId ||
    workspaceStore.activeWorkspace()?.id;

  if (workspaceId) {
    return router.createUrlTree(["/w", workspaceId, "unauthorized"]);
  }

  return router.createUrlTree(["/unauthorized"]);
};
