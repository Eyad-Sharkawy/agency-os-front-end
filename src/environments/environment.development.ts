import { AppEnvironment } from "../app/core/tokens/environment.token";

export const environment: AppEnvironment = {
  production: false,
  apiUrl: "http://localhost:8080/api/v1",
  wsUrl: "http://localhost:8080/ws-timer",
  keycloak: {
    url: "https://key-cloak.duckdns.org",
    realm: "agency-os-realm",
    clientId: "agency-os-frontend",
  },
};
