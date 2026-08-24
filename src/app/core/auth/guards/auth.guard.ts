import { inject } from "@angular/core";
import { CanActivateFn } from "@angular/router";
import { AuthStore } from "../stores/auth.store";
import { WINDOW } from "../../tokens/window/window.token";

export const authGuard: CanActivateFn = async (route, state) => {
  const authStore = inject(AuthStore);
  const win = inject(WINDOW);

  if (authStore.isAuthenticated()) {
    return true;
  }

  await authStore.login(win.location?.origin ? `${win.location.origin}${state.url}` : state.url);
  return false;
};
