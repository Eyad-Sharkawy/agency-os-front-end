import { inject } from "@angular/core";
import { CanActivateFn, Router, UrlTree } from "@angular/router";
import { AuthStore } from "../stores/auth.store";

/**
 * Route guard that redirects authenticated users to the /workspaces directory
 * while allowing unauthenticated guest users to access public pages (e.g. LandingPage).
 */
export const redirectIfAuthenticatedGuard: CanActivateFn = (): boolean | UrlTree => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return router.createUrlTree(["/workspaces"]);
  }

  return true;
};
