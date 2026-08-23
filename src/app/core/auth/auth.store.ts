import { AuthState } from "./auth.models";
import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";
import { computed, inject } from "@angular/core";
import { ENVIRONMENT } from "../tokens/environment.token";
import Keycloak from "keycloak-js";
import { Theme } from "../services/theme";

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
      const first = store.user()?.firstName?.trim()?.charAt(0) ?? "";
      const last = store.user()?.lastName?.trim()?.charAt(0) ?? "";
      return `${first}${last}`.toUpperCase();
    }),
    hasRole: computed(() => (role: string) => store.roles().includes(role)),
  })),
  withMethods((store, env = inject(ENVIRONMENT), themeService = inject(Theme)) => {
    const keycloak = new Keycloak({
      url: env.keycloak.url,
      realm: env.keycloak.realm,
      clientId: env.keycloak.clientId,
    });

    return {
      async init(): Promise<boolean> {
        patchState(store, { isLoading: true, error: null });

        try {
          const authenticated = await keycloak.init({
            onLoad: "check-sso",
            silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
            silentCheckSsoFallback: false,
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
                id: profile.id,
                username: profile.username,
                email: profile.email,
                firstName: profile.firstName,
                lastName: profile.lastName,
              },
              isLoading: false,
            });
          } else {
            patchState(store, { isAuthenticated: false, isLoading: false });
          }

          return authenticated;
        } catch (err: unknown) {
          console.error("Failed to init Keycloak", err);
          patchState(store, {
            isAuthenticated: false,
            isLoading: false,
            error: err instanceof Error ? err.message : "Authentication initialization failed",
          });
          return false;
        }
      },

      async login(redirectUri?: string): Promise<void> {
        const loginUrl = await keycloak.createLoginUrl({
          redirectUri: redirectUri || window.location.origin,
        });

        const url = new URL(loginUrl);
        url.searchParams.set("theme", themeService.theme());
        window.location.assign(url.toString());
      },

      async register(redirectUri?: string): Promise<void> {
        const registerUrl = await keycloak.createRegisterUrl({
          redirectUri: redirectUri || window.location.origin,
        });

        const url = new URL(registerUrl);
        url.searchParams.set("theme", themeService.theme());
        window.location.assign(url.toString());
      },

      logout(redirectUri?: string): Promise<void> {
        patchState(store, initialState);
        return keycloak.logout({
          redirectUri: redirectUri || window.location.origin,
        });
      },

      async getValidToken(): Promise<string | null> {
        try {
          if (keycloak.isTokenExpired(30)) {
            await keycloak.updateToken(30);
            patchState(store, { token: keycloak.token ?? null });
          }
          return keycloak.token ?? null;
        } catch {
          patchState(store, { isAuthenticated: false, token: null });
          return null;
        }
      },
    };
  }),
);
