import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { from, switchMap } from "rxjs";
import { AuthStore } from "../stores/auth.store";
import { ENVIRONMENT } from "../../tokens/enviroment/environment.token";
import { WorkspaceStore } from "../../multitenancy/workspace.store";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const workspaceStore = inject(WorkspaceStore, { optional: true });
  const env = inject(ENVIRONMENT);

  if (!req.url.startsWith(env.apiUrl)) {
    return next(req);
  }

  return from(authStore.getValidToken()).pipe(
    switchMap(token => {
      let headers = req.headers;

      if (token) {
        headers = headers.set("Authorization", `Bearer ${token}`);
      }

      const tenantId = workspaceStore?.activeTenantId?.() ?? null;
      const isGlobalWorkspaceEndpoint =
        req.url === `${env.apiUrl}/workspaces` ||
        req.url.startsWith(`${env.apiUrl}/workspaces/invitations`);

      if (tenantId && !isGlobalWorkspaceEndpoint && !headers.has("X-Tenant-ID")) {
        headers = headers.set("X-Tenant-ID", tenantId);
      }

      const clonedReq = req.clone({ headers });
      return next(clonedReq);
    }),
  );
};
