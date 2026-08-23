import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { from, switchMap } from "rxjs";
import { AuthStore } from "./auth.store";
import { ENVIRONMENT } from "../tokens/environment.token";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const env = inject(ENVIRONMENT);

  if (!req.url.startsWith(env.apiUrl)) {
    return next(req);
  }

  return from(authStore.getValidToken()).pipe(
    switchMap(token => {
      if (token) {
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      return next(req);
    }),
  );
};
