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
          if (!store.token()) {
            return null;
          }

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
        },
      };
    },
  ),
);
