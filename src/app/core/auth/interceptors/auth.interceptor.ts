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

  const isApiRequest = req.url.startsWith(env.apiUrl);
  const isKeycloakRequest = Boolean(env.keycloak.url && req.url.startsWith(env.keycloak.url));

  if (!isApiRequest && !isKeycloakRequest) {
    return next(req);
  }

  return from(authStore.getValidToken()).pipe(
    switchMap(token => {
      let headers = req.headers;

      if (token) {
        headers = headers.set("Authorization", `Bearer ${token}`);
      }

      if (isApiRequest) {
        const isGlobalWorkspaceEndpoint =
          req.url === `${env.apiUrl}/workspaces` ||
          req.url.startsWith(`${env.apiUrl}/workspaces/invitations`);

        if (!isGlobalWorkspaceEndpoint && !headers.has("X-Tenant-ID")) {
          let tenantId = workspaceStore?.activeTenantId?.() ?? null;

          if (!tenantId) {
            try {
              tenantId = localStorage.getItem("agency_os_active_tenant_id");
            } catch {
              // Ignore in environments without localStorage
            }
          }

          if (!tenantId && typeof window !== "undefined" && window.location?.pathname) {
            const match = window.location.pathname.match(/\/w\/([^/]+)/);
            if (match && match[1]) {
              tenantId = match[1];
            }
          }

          if (tenantId) {
            headers = headers.set("X-Tenant-ID", tenantId);
          }
        }
      }

      const clonedReq = req.clone({ headers });
      return next(clonedReq);
    }),
  );
};
