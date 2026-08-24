import { TestBed } from "@angular/core/testing";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { signal } from "@angular/core";
import { ProjectApi } from "./project-api";
import { ENVIRONMENT } from "../../../tokens/enviroment/environment.token";
import { ProjectRequest, ProjectResponse } from "../../models/project.models";

describe("ProjectApi", () => {
  let service: ProjectApi;
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
        ProjectApi,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT, useValue: mockEnv },
      ],
    });

    service = TestBed.inject(ProjectApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("should create httpResource for listing projects", async () => {
    const mockResponses: ProjectResponse[] = [
      {
        id: "p-1",
        name: "E-Commerce Redesign",
        budget: 25000,
        billingRate: 150,
        status: "IN_PROGRESS",
        clientId: "c-1",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    let resource: ReturnType<typeof service.getProjectsResource>;
    TestBed.runInInjectionContext(() => {
      resource = service.getProjectsResource({ defaultValue: [] });
      TestBed.flushEffects();
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/projects");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponses);

    await Promise.resolve();
    TestBed.flushEffects();

    expect(resource!.value()).toEqual(mockResponses);
  });

  it("should create httpResource for single project reacting to id signal", async () => {
    const mockResponse: ProjectResponse = {
      id: "p-1",
      name: "E-Commerce Redesign",
      budget: 25000,
      billingRate: 150,
      status: "IN_PROGRESS",
      clientId: "c-1",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    let resource: ReturnType<typeof service.getProjectResource>;
    TestBed.runInInjectionContext(() => {
      const projectId = signal<string | undefined>("p-1");
      resource = service.getProjectResource(projectId);
      TestBed.flushEffects();
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/projects/p-1");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponse);

    await Promise.resolve();
    TestBed.flushEffects();

    expect(resource!.value()).toEqual(mockResponse);
  });

  it("should list projects via GET", () => {
    const mockResponses: ProjectResponse[] = [
      {
        id: "p-1",
        name: "E-Commerce Redesign",
        description: "Full redesign",
        budget: 25000,
        billingRate: 150,
        status: "IN_PROGRESS",
        clientId: "c-1",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    service.getProjects().subscribe(res => {
      expect(res).toEqual(mockResponses);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/projects");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponses);
  });

  it("should get project by ID via GET", () => {
    const mockResponse: ProjectResponse = {
      id: "p-1",
      name: "E-Commerce Redesign",
      description: "Full redesign",
      budget: 25000,
      billingRate: 150,
      status: "IN_PROGRESS",
      clientId: "c-1",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    service.getProjectById("p-1").subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/projects/p-1");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponse);
  });

  it("should get projects by client ID via GET", () => {
    const mockResponses: ProjectResponse[] = [
      {
        id: "p-1",
        name: "E-Commerce Redesign",
        budget: 25000,
        billingRate: 150,
        status: "IN_PROGRESS",
        clientId: "c-1",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    service.getProjectsByClient("c-1").subscribe(res => {
      expect(res).toEqual(mockResponses);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/projects/client/c-1");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponses);
  });

  it("should create project via POST", () => {
    const payload: ProjectRequest = {
      name: "E-Commerce Redesign",
      description: "Full redesign",
      budget: 25000,
      billingRate: 150,
      status: "IN_PROGRESS",
      clientId: "c-1",
    };
    const mockResponse: ProjectResponse = {
      id: "p-1",
      name: "E-Commerce Redesign",
      description: "Full redesign",
      budget: 25000,
      billingRate: 150,
      status: "IN_PROGRESS",
      clientId: "c-1",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    service.createProject(payload).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/projects");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it("should update project via PUT", () => {
    const payload: ProjectRequest = {
      name: "E-Commerce Redesign v2",
      budget: 30000,
      billingRate: 160,
      status: "IN_PROGRESS",
      clientId: "c-1",
    };
    const mockResponse: ProjectResponse = {
      id: "p-1",
      name: "E-Commerce Redesign v2",
      budget: 30000,
      billingRate: 160,
      status: "IN_PROGRESS",
      clientId: "c-1",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    };

    service.updateProject("p-1", payload).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/projects/p-1");
    expect(req.request.method).toBe("PUT");
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it("should delete project via DELETE", () => {
    service.deleteProject("p-1").subscribe();

    const req = httpTesting.expectOne("https://api.example.com/api/v1/projects/p-1");
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });
});
