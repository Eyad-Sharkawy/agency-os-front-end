import { TestBed } from "@angular/core/testing";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { signal } from "@angular/core";
import { InvoiceApi } from "./invoice-api";
import { ENVIRONMENT } from "../../../tokens/enviroment/environment.token";
import { InvoiceRequest, InvoiceResponse } from "../../models/invoice.models";

describe("InvoiceApi", () => {
  let service: InvoiceApi;
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
        InvoiceApi,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT, useValue: mockEnv },
      ],
    });

    service = TestBed.inject(InvoiceApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("should create httpResource for listing invoices", async () => {
    const mockResponses: InvoiceResponse[] = [
      {
        id: "inv-1",
        clientId: "c-1",
        totalAmount: 3750.0,
        status: "DRAFT",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    let resource: ReturnType<typeof service.getInvoicesResource>;
    TestBed.runInInjectionContext(() => {
      resource = service.getInvoicesResource({ defaultValue: [] });
      TestBed.flushEffects();
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/invoices");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponses);

    await Promise.resolve();
    TestBed.flushEffects();

    expect(resource!.value()).toEqual(mockResponses);
  });

  it("should create httpResource for streaming invoice PDF", async () => {
    let resource: ReturnType<typeof service.getInvoicePdfResource>;
    TestBed.runInInjectionContext(() => {
      const id = signal<string | undefined>("inv-1");
      resource = service.getInvoicePdfResource(id);
      TestBed.flushEffects();
    });

    const mockBlob = new Blob(["%PDF-1.4..."], { type: "application/pdf" });
    const req = httpTesting.expectOne("https://api.example.com/api/v1/invoices/inv-1/pdf");
    expect(req.request.method).toBe("GET");
    req.flush(mockBlob);

    await Promise.resolve();
    TestBed.flushEffects();

    expect(resource!.value()).toBeDefined();
  });

  it("should list invoices via GET", () => {
    const mockResponses: InvoiceResponse[] = [
      {
        id: "inv-1",
        clientId: "c-1",
        totalAmount: 3750.0,
        status: "DRAFT",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    service.getInvoices().subscribe(res => {
      expect(res).toEqual(mockResponses);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/invoices");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponses);
  });

  it("should create invoice via POST", () => {
    const payload: InvoiceRequest = { clientId: "c-1" };
    const mockResponse: InvoiceResponse = {
      id: "inv-1",
      clientId: "c-1",
      totalAmount: 3750.0,
      status: "DRAFT",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    service.createInvoice(payload).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/invoices");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it("should stream invoice PDF via GET", () => {
    const mockBlob = new Blob(["%PDF-1.4..."], { type: "application/pdf" });

    service.downloadInvoicePdf("inv-1").subscribe(res => {
      expect(res).toBeInstanceOf(Blob);
      expect(res.size).toBe(mockBlob.size);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/invoices/inv-1/pdf");
    expect(req.request.method).toBe("GET");
    expect(req.request.responseType).toBe("blob");
    req.flush(mockBlob);
  });
});
