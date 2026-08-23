import { Service, inject, ResourceRef, Signal } from "@angular/core";
import { HttpClient, httpResource, HttpResourceOptions } from "@angular/common/http";
import { Observable } from "rxjs";
import { ENVIRONMENT } from "../../tokens/environment.token";
import {
  WorkspaceRequest,
  WorkspaceResponse,
  WorkspaceMemberResponse,
  WorkspaceMemberUpdateRequest,
  WorkspaceOwnershipTransferRequest,
} from "../models/workspace.models";

@Service()
export class WorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);
  readonly baseUrl = `${this.env.apiUrl}/workspaces`;

  /**
   * Signal-based reactive HTTP resource for listing workspaces.
   */
  getWorkspacesResource(
    options?: HttpResourceOptions<WorkspaceResponse[], unknown>,
  ): ResourceRef<WorkspaceResponse[] | undefined> {
    return httpResource<WorkspaceResponse[]>(() => this.baseUrl, options);
  }

  /**
   * Signal-based reactive HTTP resource for workspace members.
   */
  getMembersResource(
    tenantId: Signal<string | undefined> | (() => string | undefined),
    options?: HttpResourceOptions<WorkspaceMemberResponse[], unknown>,
  ): ResourceRef<WorkspaceMemberResponse[] | undefined> {
    return httpResource<WorkspaceMemberResponse[]>(() => {
      const id = typeof tenantId === "function" ? tenantId() : tenantId;
      return id ? `${this.baseUrl}/${id}/members` : undefined;
    }, options);
  }

  getWorkspaces(): Observable<WorkspaceResponse[]> {
    return this.http.get<WorkspaceResponse[]>(this.baseUrl);
  }

  createWorkspace(req: WorkspaceRequest): Observable<WorkspaceResponse> {
    return this.http.post<WorkspaceResponse>(this.baseUrl, req);
  }

  updateWorkspace(tenantId: string, req: WorkspaceRequest): Observable<WorkspaceResponse> {
    return this.http.put<WorkspaceResponse>(`${this.baseUrl}/${tenantId}`, req);
  }

  deleteWorkspace(tenantId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${tenantId}`);
  }

  getMembers(tenantId: string): Observable<WorkspaceMemberResponse[]> {
    return this.http.get<WorkspaceMemberResponse[]>(`${this.baseUrl}/${tenantId}/members`);
  }

  updateMemberRole(
    tenantId: string,
    userId: string,
    req: WorkspaceMemberUpdateRequest,
  ): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${tenantId}/members/${userId}`, req);
  }

  removeMember(tenantId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${tenantId}/members/${userId}`);
  }

  transferOwnership(tenantId: string, req: WorkspaceOwnershipTransferRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${tenantId}/transfer-ownership`, req);
  }
}
