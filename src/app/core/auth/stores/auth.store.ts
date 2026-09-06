import { computed, inject } from "@angular/core";
import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";
import Keycloak from "keycloak-js";
import { ENVIRONMENT } from "../../tokens/enviroment/environment.token";
import { Theme } from "../../services/theme";
import { WINDOW } from "../../tokens/window/window.token";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  roles: string[];
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  roles: [],
  token: null,
  isLoading: true,
  error: null,
};

interface ParsedJwtToken {
  exp?: number;
  sub?: string;
  preferred_username?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: {
    roles?: string[];
  };
  [key: string]: unknown;
}

function parseJwt(token: string): ParsedJwtToken | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replaceAll("-", "+").replaceAll("_", "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + (c.codePointAt(0) ?? 0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload) as ParsedJwtToken;
  } catch {
    return null;
  }
}

export const AuthStore = signalStore(
  { providedIn: "root" },
  withState(initialState),
  withComputed(store => ({
    username: computed(() => store.user()?.username ?? ""),
    userEmail: computed(() => store.user()?.email ?? ""),
    firstName: computed(() => store.user()?.firstName ?? ""),
    lastName: computed(() => store.user()?.lastName ?? ""),
    initials: computed(() => {
      const user = store.user();
      if (!user) return "";
      const first = user.firstName?.[0] ?? "";
      const last = user.lastName?.[0] ?? "";
      return (first + last).toUpperCase() || user.username?.slice(0, 2).toUpperCase() || "";
    }),
    hasRole: computed(() => (role: string) => store.roles().includes(role)),
  })),
  withMethods(
    (store, env = inject(ENVIRONMENT), themeService = inject(Theme), win = inject(WINDOW)) => {
      const keycloak = new Keycloak({
        url: env.keycloak.url,
        realm: env.keycloak.realm,
        clientId: env.keycloak.clientId,
      });

      return {
        async init(): Promise<boolean> {
          try {
            patchState(store, { isLoading: true, error: null });

            // 1. Check for stored demo session token
            if (typeof sessionStorage !== "undefined") {
              const savedDemoToken = sessionStorage.getItem("agency_os_demo_token");
              if (savedDemoToken) {
                const payload = parseJwt(savedDemoToken);
                const nowSeconds = Math.floor(Date.now() / 1000);
                if (payload?.exp && payload.exp > nowSeconds + 60) {
                  patchState(store, {
                    isAuthenticated: true,
                    token: savedDemoToken,
                    roles: payload.realm_access?.roles ?? [],
                    user: {
                      id: payload.sub ?? "",
                      username: payload.preferred_username ?? "",
                      email: payload.email ?? "",
                      firstName: payload.given_name ?? "",
                      lastName: payload.family_name ?? "",
                    },
                    isLoading: false,
                    error: null,
                  });
                  return true;
                } else {
                  sessionStorage.removeItem("agency_os_demo_token");
                }
              }
            }

            // 2. Fall back to standard Keycloak SSO check
            const origin = win.location?.origin || "";
            const authenticated = await keycloak.init({
              onLoad: "check-sso",
              silentCheckSsoRedirectUri: `${origin}/silent-check-sso.html`,
              checkLoginIframe: false,
              pkceMethod: "S256",
            });

            if (authenticated) {
              const profile = await keycloak.loadUserProfile();
              patchState(store, {
                isAuthenticated: true,
                token: keycloak.token ?? null,
                roles: keycloak.realmAccess?.roles ?? [],
                user: {
                  id: profile.id ?? "",
                  username: profile.username ?? "",
                  email: profile.email ?? "",
                  firstName: profile.firstName ?? "",
                  lastName: profile.lastName ?? "",
                },
                isLoading: false,
              });
              return true;
            } else {
              patchState(store, {
                isAuthenticated: false,
                user: null,
                roles: [],
                token: null,
                isLoading: false,
              });
              return false;
            }
          } catch (err: unknown) {
            patchState(store, {
              isAuthenticated: false,
              isLoading: false,
              error: err instanceof Error ? err.message : "Authentication initialization failed",
            });
            return false;
          }
        },

        async login(redirectUri?: string): Promise<void> {
          const origin = win.location?.origin || "";
          const loginUrl = await keycloak.createLoginUrl({
            redirectUri: redirectUri || `${origin}/workspaces`,
          });

          const url = new URL(loginUrl);
          url.searchParams.set("theme", themeService.theme());
          win.location?.assign(url.toString());
        },

        async loginDemo(username: string, password = "DemoPass123!"): Promise<boolean> {
          patchState(store, { isLoading: true, error: null });

          // Copy password to clipboard as a helpful fallback
          try {
            if (typeof navigator !== "undefined" && navigator.clipboard) {
              await navigator.clipboard.writeText(password);
            }
          } catch {
            // Ignore clipboard errors if not permitted
          }

          try {
            const tokenUrl = `${env.keycloak.url}/realms/${env.keycloak.realm}/protocol/openid-connect/token`;
            const body = new URLSearchParams();
            body.set("client_id", env.keycloak.clientId);
            body.set("grant_type", "password");
            body.set("username", username);
            body.set("password", password);
            body.set("scope", "openid profile email");

            const response = await fetch(tokenUrl, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: body.toString(),
            });

            if (response.ok) {
              const data = await response.json();
              const accessToken = data.access_token;
              const payload = parseJwt(accessToken);

              if (payload) {
                if (typeof sessionStorage !== "undefined") {
                  sessionStorage.setItem("agency_os_demo_token", accessToken);
                }
                patchState(store, {
                  isAuthenticated: true,
                  token: accessToken,
                  roles: payload.realm_access?.roles ?? [],
                  user: {
                    id: payload.sub ?? "",
                    username: payload.preferred_username ?? username,
                    email: payload.email ?? "",
                    firstName: payload.given_name ?? "",
                    lastName: payload.family_name ?? "",
                  },
                  isLoading: false,
                  error: null,
                });
                return true;
              }
            }

            // Fallback to Keycloak standard login page with pre-filled login_hint
            const origin = win.location?.origin || "";
            const loginUrl = await keycloak.createLoginUrl({
              redirectUri: `${origin}/workspaces`,
              loginHint: username,
            });
            const url = new URL(loginUrl);
            url.searchParams.set("theme", themeService.theme());
            win.location?.assign(url.toString());
            return false;
          } catch {
            const origin = win.location?.origin || "";
            const loginUrl = await keycloak.createLoginUrl({
              redirectUri: `${origin}/workspaces`,
              loginHint: username,
            });
            const url = new URL(loginUrl);
            url.searchParams.set("theme", themeService.theme());
            win.location?.assign(url.toString());
            return false;
          }
        },

        async register(redirectUri?: string): Promise<void> {
          const origin = win.location?.origin || "";
          const registerUrl = await keycloak.createRegisterUrl({
            redirectUri: redirectUri || `${origin}/workspaces`,
          });

          const url = new URL(registerUrl);
          url.searchParams.set("theme", themeService.theme());
          win.location?.assign(url.toString());
        },

        logout(redirectUri?: string): Promise<void> {
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.removeItem("agency_os_demo_token");
          }
          patchState(store, initialState);
          const origin = win.location?.origin || "";
          return keycloak.logout({
            redirectUri: redirectUri || origin,
          });
        },

        async accountManagement(redirectUri?: string): Promise<void> {
          const origin = win.location?.origin || "";
          try {
            const accountUrl = await keycloak.createAccountUrl({
              redirectUri: redirectUri || `${origin}/workspaces`,
            });
            if (accountUrl) {
              const url = new URL(accountUrl);
              url.searchParams.set("theme", themeService.theme());
              win.location?.assign(url.toString());
              return;
            }
          } catch {
            // fallback if createAccountUrl fails
          }
          const fallbackUrl = `${env.keycloak.url}/realms/${env.keycloak.realm}/account`;
          win.location?.assign(fallbackUrl);
        },

        updateUser(updated: Partial<UserProfile>): void {
          const current = store.user();
          if (current) {
            patchState(store, {
              user: {
                ...current,
                ...updated,
              },
            });
          }
        },

        async getValidToken(): Promise<string | null> {
          const currentToken = store.token();
          if (!currentToken) {
            return null;
          }

          if (keycloak.token) {
            try {
              if (keycloak.isTokenExpired(30)) {
                await keycloak.updateToken(30);
                patchState(store, { token: keycloak.token ?? null });
              }
              return store.token();
            } catch {
              patchState(store, {
                isAuthenticated: false,
                user: null,
                roles: [],
                token: null,
              });
              return null;
            }
          }

          // Direct token expiration check
          const payload = parseJwt(currentToken);
          const nowSeconds = Math.floor(Date.now() / 1000);
          if (payload?.exp && payload.exp < nowSeconds + 30) {
            if (typeof sessionStorage !== "undefined") {
              sessionStorage.removeItem("agency_os_demo_token");
            }
            patchState(store, {
              isAuthenticated: false,
              user: null,
              roles: [],
              token: null,
            });
            return null;
          }

          return currentToken;
        },
      };
    },
  ),
);
