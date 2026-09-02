import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { from, switchMap } from "rxjs";
import { AuthStore } from "../stores/auth.store";
import { ENVIRONMENT } from "../../tokens/enviroment/environment.token";
import { WorkspaceStore } from "../../multitenancy/workspace.store";

const TENANT_PATH_REGEX = /\/w\/([^/]+)/;

function isGlobalEndpoint(url: string, apiUrl: string): boolean {
  return url === `${apiUrl}/workspaces` || url.startsWith(`${apiUrl}/workspaces/invitations`);
}

function resolveTenantId(
  workspaceStore: InstanceType<typeof WorkspaceStore> | null,
): string | null {
  const storeTenantId = workspaceStore?.activeTenantId?.();
  if (storeTenantId) {
    return storeTenantId;
  }

  try {
    const cachedTenant = localStorage.getItem("agency_os_active_tenant_id");
    if (cachedTenant) {
      return cachedTenant;
    }
  } catch {
    // Ignore in environments without localStorage
  }

  if (typeof window !== "undefined" && window.location?.pathname) {
    const match = TENANT_PATH_REGEX.exec(window.location.pathname);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

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

      if (isApiRequest && !isGlobalEndpoint(req.url, env.apiUrl) && !headers.has("X-Tenant-ID")) {
        const tenantId = resolveTenantId(workspaceStore);
        if (tenantId) {
          headers = headers.set("X-Tenant-ID", tenantId);
        }
      }

      const clonedReq = req.clone({ headers });
      return next(clonedReq);
    }),
  );
};
