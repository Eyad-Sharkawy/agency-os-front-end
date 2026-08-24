import { ApplicationConfig, provideAppInitializer, inject } from "@angular/core";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";

import { routes } from "./app.routes";
import { environment } from "../environments/environment";
import { AuthStore } from "./core/auth/stores/auth.store";
import { authInterceptor } from "./core/auth/interceptors/auth.interceptor";
import { ENVIRONMENT } from "./core/tokens/enviroment/environment.token";

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ENVIRONMENT, useValue: environment },
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: "enabled",
        scrollPositionRestoration: "enabled",
      }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => {
      const authStore = inject(AuthStore);
      return authStore.init();
    }),
  ],
};
