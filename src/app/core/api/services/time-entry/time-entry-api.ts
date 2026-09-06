import { Service, inject, ResourceRef, Signal } from "@angular/core";
import { HttpClient, HttpParams, httpResource, HttpResourceOptions } from "@angular/common/http";
import { Observable } from "rxjs";
import { ENVIRONMENT } from "../../../tokens/enviroment/environment.token";
import {
  ActiveTimerResponse,
  TimeEntryRequest,
  TimeEntryResponse,
} from "../../models/time-entry.models";

@Service()
export class TimeEntryApi {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);
  readonly baseUrl = `${this.env.apiUrl}/time-entries`;

  /**
   * Signal-based reactive HTTP resource for currently active stopwatch timer.
   */
  getActiveTimerResource(
    options?: HttpResourceOptions<ActiveTimerResponse | null, unknown>,
  ): ResourceRef<ActiveTimerResponse | null | undefined> {
    return httpResource<ActiveTimerResponse | null>(() => `${this.baseUrl}/active`, options);
  }

  /**
   * Signal-based reactive HTTP resource for time entries logged against a task.
   */
  getTimeEntriesByTaskResource(
    taskId: Signal<string | undefined> | (() => string | undefined),
    options?: HttpResourceOptions<TimeEntryResponse[], unknown>,
  ): ResourceRef<TimeEntryResponse[] | undefined> {
    return httpResource<TimeEntryResponse[]>(() => {
      const id = typeof taskId === "function" ? taskId() : taskId;
      return id ? `${this.baseUrl}/task/${id}` : undefined;
    }, options);
  }

  getTimeEntries(params?: { taskId?: string; userId?: string }): Observable<TimeEntryResponse[]> {
    let httpParams = new HttpParams();
    if (params?.taskId) {
      httpParams = httpParams.set("taskId", params.taskId);
    }
    if (params?.userId) {
      httpParams = httpParams.set("userId", params.userId);
    }
    return this.http.get<TimeEntryResponse[]>(this.baseUrl, { params: httpParams });
  }

  logTime(req: TimeEntryRequest): Observable<TimeEntryResponse> {
    return this.http.post<TimeEntryResponse>(this.baseUrl, req);
  }

  startTimer(taskId: string): Observable<ActiveTimerResponse> {
    return this.http.post<ActiveTimerResponse>(`${this.baseUrl}/start/${taskId}`, {});
  }

  pauseTimer(): Observable<ActiveTimerResponse> {
    return this.http.post<ActiveTimerResponse>(`${this.baseUrl}/pause`, {});
  }

  resumeTimer(): Observable<ActiveTimerResponse> {
    return this.http.post<ActiveTimerResponse>(`${this.baseUrl}/resume`, {});
  }

  stopTimer(isBillable = true, durationMinutes?: number): Observable<TimeEntryResponse> {
    let params = new HttpParams().set("isBillable", isBillable.toString());
    if (durationMinutes !== undefined && durationMinutes > 0) {
      params = params.set("durationMinutes", durationMinutes.toString());
    }
    return this.http.post<TimeEntryResponse>(`${this.baseUrl}/stop`, {}, { params });
  }

  getActiveTimer(): Observable<ActiveTimerResponse | null> {
    return this.http.get<ActiveTimerResponse | null>(`${this.baseUrl}/active`);
  }

  getTimeEntriesByTask(taskId: string): Observable<TimeEntryResponse[]> {
    return this.http.get<TimeEntryResponse[]>(`${this.baseUrl}/task/${taskId}`);
  }

  deleteTimeEntry(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
