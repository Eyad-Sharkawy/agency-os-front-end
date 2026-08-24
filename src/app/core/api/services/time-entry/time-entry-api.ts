import { Service, inject, ResourceRef, Signal } from "@angular/core";
import { HttpClient, httpResource, HttpResourceOptions } from "@angular/common/http";
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

  logTime(req: TimeEntryRequest): Observable<TimeEntryResponse> {
    return this.http.post<TimeEntryResponse>(this.baseUrl, req);
  }

  startTimer(taskId: string): Observable<ActiveTimerResponse> {
    return this.http.post<ActiveTimerResponse>(`${this.baseUrl}/start/${taskId}`, {});
  }

  stopTimer(): Observable<TimeEntryResponse> {
    return this.http.post<TimeEntryResponse>(`${this.baseUrl}/stop`, {});
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
