import { TestBed } from "@angular/core/testing";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { signal } from "@angular/core";
import { ClientService } from "./client.service";
import { ENVIRONMENT } from "../../tokens/environment.token";
import { ClientRequest, ClientResponse } from "../models/client.models";

describe("ClientService", () => {
  let service: ClientService;
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
        ClientService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT, useValue: mockEnv },
      ],
    });

    service = TestBed.inject(ClientService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("should create httpResource for listing clients", async () => {
    const mockResponses: ClientResponse[] = [
      {
        id: "c-1",
        name: "Wayne Enterprises",
        email: "billing@wayne.com",
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    let resource: ReturnType<typeof service.getClientsResource>;
    TestBed.runInInjectionContext(() => {
      resource = service.getClientsResource({ defaultValue: [] });
      TestBed.flushEffects();
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/clients");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponses);

    await Promise.resolve();
    TestBed.flushEffects();

    expect(resource!.value()).toEqual(mockResponses);
  });

  it("should create httpResource for single client reacting to clientId signal", async () => {
    const mockResponse: ClientResponse = {
      id: "c-1",
      name: "Wayne Enterprises",
      email: "billing@wayne.com",
      status: "ACTIVE",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    let resource: ReturnType<typeof service.getClientResource>;
    TestBed.runInInjectionContext(() => {
      const clientId = signal<string | undefined>("c-1");
      resource = service.getClientResource(clientId);
      TestBed.flushEffects();
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/clients/c-1");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponse);

    await Promise.resolve();
    TestBed.flushEffects();

    expect(resource!.value()).toEqual(mockResponse);
  });

  it("should list clients via GET", () => {
    const mockResponses: ClientResponse[] = [
      {
        id: "c-1",
        name: "Wayne Enterprises",
        email: "billing@wayne.com",
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    service.getClients().subscribe(res => {
      expect(res).toEqual(mockResponses);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/clients");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponses);
  });

  it("should get client by ID via GET", () => {
    const mockResponse: ClientResponse = {
      id: "c-1",
      name: "Wayne Enterprises",
      email: "billing@wayne.com",
      status: "ACTIVE",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    service.getClientById("c-1").subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/clients/c-1");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponse);
  });

  it("should create client via POST", () => {
    const payload: ClientRequest = {
      name: "Wayne Enterprises",
      email: "billing@wayne.com",
      status: "ACTIVE",
    };
    const mockResponse: ClientResponse = {
      id: "c-1",
      name: "Wayne Enterprises",
      email: "billing@wayne.com",
      status: "ACTIVE",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    service.createClient(payload).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/clients");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it("should update client via PUT", () => {
    const payload: ClientRequest = {
      name: "Wayne Corp",
      email: "info@wayne.com",
      status: "ACTIVE",
    };
    const mockResponse: ClientResponse = {
      id: "c-1",
      name: "Wayne Corp",
      email: "info@wayne.com",
      status: "ACTIVE",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    };

    service.updateClient("c-1", payload).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/clients/c-1");
    expect(req.request.method).toBe("PUT");
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it("should delete client via DELETE", () => {
    service.deleteClient("c-1").subscribe();

    const req = httpTesting.expectOne("https://api.example.com/api/v1/clients/c-1");
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });
});
