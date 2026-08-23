import { Service, inject, ResourceRef, Signal } from "@angular/core";
import { HttpClient, httpResource, HttpResourceOptions } from "@angular/common/http";
import { Observable } from "rxjs";
import { ENVIRONMENT } from "../../tokens/environment.token";
import { TaskRequest, TaskResponse, TaskStatusUpdateRequest } from "../models/task.models";

@Service()
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);
  readonly baseUrl = `${this.env.apiUrl}/tasks`;

  /**
   * Signal-based reactive HTTP resource for listing tasks.
   */
  getTasksResource(
    options?: HttpResourceOptions<TaskResponse[], unknown>,
  ): ResourceRef<TaskResponse[] | undefined> {
    return httpResource<TaskResponse[]>(() => this.baseUrl, options);
  }

  /**
   * Signal-based reactive HTTP resource for a single task by ID.
   */
  getTaskResource(
    id: Signal<string | undefined> | (() => string | undefined),
    options?: HttpResourceOptions<TaskResponse, unknown>,
  ): ResourceRef<TaskResponse | undefined> {
    return httpResource<TaskResponse>(() => {
      const taskId = typeof id === "function" ? id() : id;
      return taskId ? `${this.baseUrl}/${taskId}` : undefined;
    }, options);
  }

  /**
   * Signal-based reactive HTTP resource for tasks in a project.
   */
  getTasksByProjectResource(
    projectId: Signal<string | undefined> | (() => string | undefined),
    options?: HttpResourceOptions<TaskResponse[], unknown>,
  ): ResourceRef<TaskResponse[] | undefined> {
    return httpResource<TaskResponse[]>(() => {
      const id = typeof projectId === "function" ? projectId() : projectId;
      return id ? `${this.baseUrl}/project/${id}` : undefined;
    }, options);
  }

  /**
   * Signal-based reactive HTTP resource for tasks assigned to a user.
   */
  getTasksByAssigneeResource(
    assigneeId: Signal<string | undefined> | (() => string | undefined),
    options?: HttpResourceOptions<TaskResponse[], unknown>,
  ): ResourceRef<TaskResponse[] | undefined> {
    return httpResource<TaskResponse[]>(() => {
      const id = typeof assigneeId === "function" ? assigneeId() : assigneeId;
      return id ? `${this.baseUrl}/assignee/${id}` : undefined;
    }, options);
  }

  getTasks(): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(this.baseUrl);
  }

  getTaskById(id: string): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`${this.baseUrl}/${id}`);
  }

  getTasksByProject(projectId: string): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(`${this.baseUrl}/project/${projectId}`);
  }

  getTasksByAssignee(assigneeId: string): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(`${this.baseUrl}/assignee/${assigneeId}`);
  }

  createTask(req: TaskRequest): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(this.baseUrl, req);
  }

  updateTask(id: string, req: TaskRequest): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(`${this.baseUrl}/${id}`, req);
  }

  updateTaskStatus(id: string, req: TaskStatusUpdateRequest): Observable<TaskResponse> {
    return this.http.patch<TaskResponse>(`${this.baseUrl}/${id}/status`, req);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
