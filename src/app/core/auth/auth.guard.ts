import { inject } from "@angular/core";
import { CanActivateFn } from "@angular/router";
import { AuthStore } from "./auth.store";

export const authGuard: CanActivateFn = async (route, state) => {
  const authStore = inject(AuthStore);

  if (authStore.isAuthenticated()) {
    return true;
  }

  await authStore.login(window.location.origin + state.url);
  return false;
};
