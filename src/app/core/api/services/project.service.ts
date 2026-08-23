import { Service, inject, ResourceRef, Signal } from "@angular/core";
import { HttpClient, httpResource, HttpResourceOptions } from "@angular/common/http";
import { Observable } from "rxjs";
import { ENVIRONMENT } from "../../tokens/environment.token";
import { ProjectRequest, ProjectResponse } from "../models/project.models";

@Service()
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);
  readonly baseUrl = `${this.env.apiUrl}/projects`;

  /**
   * Signal-based reactive HTTP resource for listing all projects.
   */
  getProjectsResource(
    options?: HttpResourceOptions<ProjectResponse[], unknown>,
  ): ResourceRef<ProjectResponse[] | undefined> {
    return httpResource<ProjectResponse[]>(() => this.baseUrl, options);
  }

  /**
   * Signal-based reactive HTTP resource for a single project by ID.
   */
  getProjectResource(
    id: Signal<string | undefined> | (() => string | undefined),
    options?: HttpResourceOptions<ProjectResponse, unknown>,
  ): ResourceRef<ProjectResponse | undefined> {
    return httpResource<ProjectResponse>(() => {
      const projectId = typeof id === "function" ? id() : id;
      return projectId ? `${this.baseUrl}/${projectId}` : undefined;
    }, options);
  }

  /**
   * Signal-based reactive HTTP resource for projects of a given client.
   */
  getProjectsByClientResource(
    clientId: Signal<string | undefined> | (() => string | undefined),
    options?: HttpResourceOptions<ProjectResponse[], unknown>,
  ): ResourceRef<ProjectResponse[] | undefined> {
    return httpResource<ProjectResponse[]>(() => {
      const id = typeof clientId === "function" ? clientId() : clientId;
      return id ? `${this.baseUrl}/client/${id}` : undefined;
    }, options);
  }

  getProjects(): Observable<ProjectResponse[]> {
    return this.http.get<ProjectResponse[]>(this.baseUrl);
  }

  getProjectById(id: string): Observable<ProjectResponse> {
    return this.http.get<ProjectResponse>(`${this.baseUrl}/${id}`);
  }

  getProjectsByClient(clientId: string): Observable<ProjectResponse[]> {
    return this.http.get<ProjectResponse[]>(`${this.baseUrl}/client/${clientId}`);
  }

  createProject(req: ProjectRequest): Observable<ProjectResponse> {
    return this.http.post<ProjectResponse>(this.baseUrl, req);
  }

  updateProject(id: string, req: ProjectRequest): Observable<ProjectResponse> {
    return this.http.put<ProjectResponse>(`${this.baseUrl}/${id}`, req);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
