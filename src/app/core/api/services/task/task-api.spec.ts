import { TestBed } from "@angular/core/testing";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { signal } from "@angular/core";
import { TaskApi } from "./task-api";
import { ENVIRONMENT } from "../../../tokens/enviroment/environment.token";
import { TaskRequest, TaskResponse, TaskStatusUpdateRequest } from "../../models/task.models";

describe("TaskApi", () => {
  let service: TaskApi;
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
        TaskApi,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT, useValue: mockEnv },
      ],
    });

    service = TestBed.inject(TaskApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("should create httpResource for listing tasks", async () => {
    const mockResponses: TaskResponse[] = [
      {
        id: "t-1",
        title: "Design Checkout Flow",
        estimatedMinutes: 480,
        priority: "HIGH",
        status: "TODO",
        projectId: "p-1",
        assigneeIds: ["u-1"],
        totalLoggedMinutes: 0,
        isOverBudget: false,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    let resource: ReturnType<typeof service.getTasksResource>;
    TestBed.runInInjectionContext(() => {
      resource = service.getTasksResource({ defaultValue: [] });
      TestBed.flushEffects();
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/tasks");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponses);

    await Promise.resolve();
    TestBed.flushEffects();

    expect(resource!.value()).toEqual(mockResponses);
  });

  it("should create httpResource for single task reacting to id signal", async () => {
    const mockResponse: TaskResponse = {
      id: "t-1",
      title: "Design Checkout Flow",
      estimatedMinutes: 480,
      priority: "HIGH",
      status: "TODO",
      projectId: "p-1",
      assigneeIds: ["u-1"],
      totalLoggedMinutes: 0,
      isOverBudget: false,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    let resource: ReturnType<typeof service.getTaskResource>;
    TestBed.runInInjectionContext(() => {
      const taskId = signal<string | undefined>("t-1");
      resource = service.getTaskResource(taskId);
      TestBed.flushEffects();
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/tasks/t-1");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponse);

    await Promise.resolve();
    TestBed.flushEffects();

    expect(resource!.value()).toEqual(mockResponse);
  });

  it("should create httpResource for tasks by project", async () => {
    let resource: ReturnType<typeof service.getTasksByProjectResource>;
    TestBed.runInInjectionContext(() => {
      const projectId = signal<string | undefined>("p-1");
      resource = service.getTasksByProjectResource(projectId);
      TestBed.flushEffects();
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/tasks/project/p-1");
    expect(req.request.method).toBe("GET");
    req.flush([]);

    await Promise.resolve();
    TestBed.flushEffects();

    expect(resource!.value()).toEqual([]);
  });

  it("should create httpResource for tasks by assignee", async () => {
    let resource: ReturnType<typeof service.getTasksByAssigneeResource>;
    TestBed.runInInjectionContext(() => {
      const assigneeId = signal<string | undefined>("u-1");
      resource = service.getTasksByAssigneeResource(assigneeId);
      TestBed.flushEffects();
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/tasks/assignee/u-1");
    expect(req.request.method).toBe("GET");
    req.flush([]);

    await Promise.resolve();
    TestBed.flushEffects();

    expect(resource!.value()).toEqual([]);
  });

  it("should list tasks via GET", () => {
    const mockResponses: TaskResponse[] = [
      {
        id: "t-1",
        title: "Design Checkout Flow",
        estimatedMinutes: 480,
        priority: "HIGH",
        status: "TODO",
        projectId: "p-1",
        assigneeIds: ["u-1"],
        totalLoggedMinutes: 0,
        isOverBudget: false,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    service.getTasks().subscribe(res => {
      expect(res).toEqual(mockResponses);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/tasks");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponses);
  });

  it("should get task by ID via GET", () => {
    const mockResponse: TaskResponse = {
      id: "t-1",
      title: "Design Checkout Flow",
      estimatedMinutes: 480,
      priority: "HIGH",
      status: "TODO",
      projectId: "p-1",
      assigneeIds: ["u-1"],
      totalLoggedMinutes: 0,
      isOverBudget: false,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    service.getTaskById("t-1").subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/tasks/t-1");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponse);
  });

  it("should get tasks by project via GET", () => {
    const mockResponses: TaskResponse[] = [];

    service.getTasksByProject("p-1").subscribe(res => {
      expect(res).toEqual(mockResponses);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/tasks/project/p-1");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponses);
  });

  it("should get tasks by assignee via GET", () => {
    const mockResponses: TaskResponse[] = [];

    service.getTasksByAssignee("u-1").subscribe(res => {
      expect(res).toEqual(mockResponses);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/tasks/assignee/u-1");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponses);
  });

  it("should create task via POST", () => {
    const payload: TaskRequest = {
      title: "Design Checkout Flow",
      estimatedMinutes: 480,
      priority: "HIGH",
      status: "TODO",
      projectId: "p-1",
    };
    const mockResponse: TaskResponse = {
      id: "t-1",
      title: "Design Checkout Flow",
      estimatedMinutes: 480,
      priority: "HIGH",
      status: "TODO",
      projectId: "p-1",
      assigneeIds: [],
      totalLoggedMinutes: 0,
      isOverBudget: false,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    service.createTask(payload).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/tasks");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it("should update task via PUT", () => {
    const payload: TaskRequest = {
      title: "Design Checkout Flow Updated",
      estimatedMinutes: 500,
      priority: "URGENT",
      status: "IN_PROGRESS",
      projectId: "p-1",
    };
    const mockResponse: TaskResponse = {
      id: "t-1",
      title: "Design Checkout Flow Updated",
      estimatedMinutes: 500,
      priority: "URGENT",
      status: "IN_PROGRESS",
      projectId: "p-1",
      assigneeIds: [],
      totalLoggedMinutes: 0,
      isOverBudget: false,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    };

    service.updateTask("t-1", payload).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/tasks/t-1");
    expect(req.request.method).toBe("PUT");
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it("should update task status via PATCH", () => {
    const payload: TaskStatusUpdateRequest = { status: "IN_PROGRESS" };
    const mockResponse: TaskResponse = {
      id: "t-1",
      title: "Design Checkout Flow",
      priority: "HIGH",
      status: "IN_PROGRESS",
      projectId: "p-1",
      assigneeIds: [],
      totalLoggedMinutes: 0,
      isOverBudget: false,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    };

    service.updateTaskStatus("t-1", payload).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/tasks/t-1/status");
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it("should delete task via DELETE", () => {
    service.deleteTask("t-1").subscribe();

    const req = httpTesting.expectOne("https://api.example.com/api/v1/tasks/t-1");
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });
});
