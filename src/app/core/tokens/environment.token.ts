import { InjectionToken } from "@angular/core";

export interface AppEnvironment {
  production: boolean;
  apiUrl: string;
  wsUrl: string;
  keycloak: {
    url: string;
    realm: string;
    clientId: string;
  };
}

export const ENVIRONMENT = new InjectionToken<AppEnvironment>("AppEnvironment");
