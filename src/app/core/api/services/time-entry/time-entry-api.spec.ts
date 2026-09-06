import { TestBed } from "@angular/core/testing";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TimeEntryApi } from "./time-entry-api";
import { ENVIRONMENT } from "../../../tokens/enviroment/environment.token";
import {
  ActiveTimerResponse,
  TimeEntryRequest,
  TimeEntryResponse,
} from "../../models/time-entry.models";

describe("TimeEntryApi", () => {
  let service: TimeEntryApi;
  let httpTesting: HttpTestingController;

  const mockEnv = {
    production: false,
    apiUrl: "https://api.example.com/api/v1",
    wsUrl: "wss://api.example.com/ws",
    keycloak: { url: "", realm: "", clientId: "" },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TimeEntryApi,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT, useValue: mockEnv },
      ],
    });

    service = TestBed.inject(TimeEntryApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("should create httpResource for active timer", async () => {
    const mockResponse: ActiveTimerResponse = {
      userId: "u-1",
      taskId: "t-1",
      startTime: "2026-01-01T00:00:00Z",
    };

    let resource: ReturnType<typeof service.getActiveTimerResource>;
    TestBed.runInInjectionContext(() => {
      resource = service.getActiveTimerResource();
      TestBed.flushEffects();
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/time-entries/active");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponse);

    await Promise.resolve();
    TestBed.flushEffects();

    expect(resource!.value()).toEqual(mockResponse);
  });

  it("should log time via POST", () => {
    const payload: TimeEntryRequest = {
      taskId: "t-1",
      durationMinutes: 120,
      isBillable: true,
    };
    const mockResponse: TimeEntryResponse = {
      id: "te-1",
      taskId: "t-1",
      userId: "u-1",
      durationMinutes: 120,
      isBillable: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    service.logTime(payload).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/time-entries");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it("should start timer via POST", () => {
    const mockResponse: ActiveTimerResponse = {
      userId: "u-1",
      taskId: "t-1",
      startTime: "2026-01-01T00:00:00Z",
    };

    service.startTimer("t-1").subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/time-entries/start/t-1");
    expect(req.request.method).toBe("POST");
    req.flush(mockResponse);
  });

  it("should stop timer via POST with isBillable query param", () => {
    const mockResponse: TimeEntryResponse = {
      id: "te-1",
      taskId: "t-1",
      userId: "u-1",
      durationMinutes: 60,
      isBillable: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    service.stopTimer(false).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne(
      "https://api.example.com/api/v1/time-entries/stop?isBillable=false",
    );
    expect(req.request.method).toBe("POST");
    req.flush(mockResponse);
  });

  it("should get time entries via GET with and without filters", () => {
    const mockResponses: TimeEntryResponse[] = [];

    // Without params
    service.getTimeEntries().subscribe(res => {
      expect(res).toEqual(mockResponses);
    });
    const req1 = httpTesting.expectOne("https://api.example.com/api/v1/time-entries");
    expect(req1.request.method).toBe("GET");
    req1.flush(mockResponses);

    // With params
    service.getTimeEntries({ taskId: "t-1", userId: "u-1" }).subscribe(res => {
      expect(res).toEqual(mockResponses);
    });
    const req2 = httpTesting.expectOne(
      "https://api.example.com/api/v1/time-entries?taskId=t-1&userId=u-1",
    );
    expect(req2.request.method).toBe("GET");
    req2.flush(mockResponses);
  });

  it("should get active timer via GET", () => {
    const mockResponse: ActiveTimerResponse = {
      userId: "u-1",
      taskId: "t-1",
      startTime: "2026-01-01T00:00:00Z",
    };

    service.getActiveTimer().subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/time-entries/active");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponse);
  });

  it("should get time entries by task via GET", () => {
    const mockResponses: TimeEntryResponse[] = [];

    service.getTimeEntriesByTask("t-1").subscribe(res => {
      expect(res).toEqual(mockResponses);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/time-entries/task/t-1");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponses);
  });

  it("should delete time entry via DELETE", () => {
    service.deleteTimeEntry("te-1").subscribe();

    const req = httpTesting.expectOne("https://api.example.com/api/v1/time-entries/te-1");
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });
});
