import { TestBed } from "@angular/core/testing";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { InvitationService } from "./invitation.service";
import { ENVIRONMENT } from "../../tokens/environment.token";
import {
  WorkspaceInvitationRequest,
  WorkspaceInvitationResponse,
} from "../models/invitation.models";

describe("InvitationService", () => {
  let service: InvitationService;
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
        InvitationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT, useValue: mockEnv },
      ],
    });

    service = TestBed.inject(InvitationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("should create httpResource for pending invitations", async () => {
    const mockResponses: WorkspaceInvitationResponse[] = [
      {
        id: "inv-1",
        workspaceId: "w-1",
        workspaceName: "Acme Agency",
        username: "johndoe",
        invitedByUsername: "admin",
        role: "MEMBER",
        status: "PENDING",
        createdAt: "2026-01-01T00:00:00Z",
      },
    ];

    let resource: ReturnType<typeof service.getPendingInvitationsResource>;
    TestBed.runInInjectionContext(() => {
      resource = service.getPendingInvitationsResource({ defaultValue: [] });
      TestBed.flushEffects();
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/workspaces/invitations");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponses);

    await Promise.resolve();
    TestBed.flushEffects();

    expect(resource!.value()).toEqual(mockResponses);
  });

  it("should get pending invitations for user via GET", () => {
    const mockResponses: WorkspaceInvitationResponse[] = [
      {
        id: "inv-1",
        workspaceId: "w-1",
        workspaceName: "Acme Agency",
        username: "johndoe",
        invitedByUsername: "admin",
        role: "MEMBER",
        status: "PENDING",
        createdAt: "2026-01-01T00:00:00Z",
      },
    ];

    service.getPendingInvitations().subscribe(res => {
      expect(res).toEqual(mockResponses);
    });

    const req = httpTesting.expectOne("https://api.example.com/api/v1/workspaces/invitations");
    expect(req.request.method).toBe("GET");
    req.flush(mockResponses);
  });

  it("should invite user to workspace via POST", () => {
    const payload: WorkspaceInvitationRequest = {
      username: "alexjones",
      role: "MEMBER",
    };
    const mockResponse: WorkspaceInvitationResponse = {
      id: "inv-2",
      workspaceId: "w-1",
      workspaceName: "Acme Agency",
      username: "alexjones",
      invitedByUsername: "admin",
      role: "MEMBER",
      status: "PENDING",
      createdAt: "2026-01-01T00:00:00Z",
    };

    service.inviteUser("tenant_acme", payload).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne(
      "https://api.example.com/api/v1/workspaces/tenant_acme/invitations",
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it("should accept invitation via POST", () => {
    service.acceptInvitation("inv-1").subscribe();

    const req = httpTesting.expectOne(
      "https://api.example.com/api/v1/workspaces/invitations/inv-1/accept",
    );
    expect(req.request.method).toBe("POST");
    req.flush(null);
  });

  it("should decline invitation via POST", () => {
    service.declineInvitation("inv-1").subscribe();

    const req = httpTesting.expectOne(
      "https://api.example.com/api/v1/workspaces/invitations/inv-1/decline",
    );
    expect(req.request.method).toBe("POST");
    req.flush(null);
  });
});
