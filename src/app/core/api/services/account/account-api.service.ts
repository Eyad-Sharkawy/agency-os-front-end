import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ENVIRONMENT } from "../../../tokens/enviroment/environment.token";
import {
  KeycloakUserProfile,
  LinkedAccount,
  PasswordChangeRequest,
  UserSession,
} from "../../models/account.models";

@Injectable({
  providedIn: "root",
})
export class AccountApiService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);

  private get baseUrl(): string {
    return `${this.env.keycloak.url}/realms/${this.env.keycloak.realm}/account`;
  }

  private get jsonHeaders(): { headers: Record<string, string> } {
    return { headers: { Accept: "application/json" } };
  }

  getProfile(): Observable<KeycloakUserProfile> {
    return this.http.get<KeycloakUserProfile>(this.baseUrl, this.jsonHeaders);
  }

  updateProfile(profile: Partial<KeycloakUserProfile>): Observable<KeycloakUserProfile> {
    return this.http.post<KeycloakUserProfile>(this.baseUrl, profile, this.jsonHeaders);
  }

  getLinkedAccounts(): Observable<LinkedAccount[]> {
    return this.http.get<LinkedAccount[]>(`${this.baseUrl}/linked-accounts`, this.jsonHeaders);
  }

  unlinkAccount(providerAlias: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/linked-accounts/${providerAlias}`,
      this.jsonHeaders,
    );
  }

  getLinkAccountUrl(providerAlias: string, redirectUri?: string): string {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirect = redirectUri || `${origin}/workspaces`;
    return `${this.env.keycloak.url}/realms/${this.env.keycloak.realm}/broker/${providerAlias}/link?client_id=${this.env.keycloak.clientId}&redirect_uri=${encodeURIComponent(redirect)}`;
  }

  changePassword(request: PasswordChangeRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/credentials/password`, request, this.jsonHeaders);
  }

  getSessions(): Observable<UserSession[]> {
    return this.http.get<UserSession[]>(`${this.baseUrl}/sessions`, this.jsonHeaders);
  }

  terminateSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/sessions/${sessionId}`, this.jsonHeaders);
  }
}
