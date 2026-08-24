import { AppEnvironment } from "../app/core/tokens/enviroment/environment.token";

export const environment: AppEnvironment = {
  production: true,
  apiUrl: "https://agency-os.duckdns.org/api/v1",
  wsUrl: "https://agency-os.duckdns.org/ws-timer",
  keycloak: {
    url: "https://key-cloak.duckdns.org",
    realm: "agency-os-realm",
    clientId: "agency-os-frontend",
  },
};
