import { Service, inject, ResourceRef } from "@angular/core";
import { HttpClient, httpResource, HttpResourceOptions } from "@angular/common/http";
import { Observable } from "rxjs";
import { ENVIRONMENT } from "../../../tokens/enviroment/environment.token";
import {
  WorkspaceInvitationRequest,
  WorkspaceInvitationResponse,
} from "../../models/invitation.models";

@Service()
export class InvitationApi {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);
  readonly baseUrl = `${this.env.apiUrl}/workspaces`;

  /**
   * Signal-based reactive HTTP resource for pending invitations.
   */
  getPendingInvitationsResource(
    options?: HttpResourceOptions<WorkspaceInvitationResponse[], unknown>,
  ): ResourceRef<WorkspaceInvitationResponse[] | undefined> {
    return httpResource<WorkspaceInvitationResponse[]>(
      () => `${this.baseUrl}/invitations`,
      options,
    );
  }

  getPendingInvitations(): Observable<WorkspaceInvitationResponse[]> {
    return this.http.get<WorkspaceInvitationResponse[]>(`${this.baseUrl}/invitations`);
  }

  inviteUser(
    tenantId: string,
    req: WorkspaceInvitationRequest,
  ): Observable<WorkspaceInvitationResponse> {
    return this.http.post<WorkspaceInvitationResponse>(
      `${this.baseUrl}/${tenantId}/invitations`,
      req,
    );
  }

  acceptInvitation(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/invitations/${id}/accept`, {});
  }

  declineInvitation(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/invitations/${id}/decline`, {});
  }
}
