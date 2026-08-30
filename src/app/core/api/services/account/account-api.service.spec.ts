import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { ENVIRONMENT } from "../../../tokens/enviroment/environment.token";
import { AccountApiService } from "./account-api.service";
import {
  KeycloakUserProfile,
  LinkedAccount,
  PasswordChangeRequest,
  UserSession,
} from "../../models/account.models";

describe("AccountApiService", () => {
  let service: AccountApiService;
  let httpTesting: HttpTestingController;

  const mockEnv = {
    production: false,
    apiUrl: "https://api.example.com",
    wsUrl: "wss://api.example.com/ws",
    keycloak: {
      url: "https://auth.example.com",
      realm: "agency-os-realm",
      clientId: "agency-os-frontend",
    },
  };

  const baseUrl = "https://auth.example.com/realms/agency-os-realm/account";

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AccountApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT, useValue: mockEnv },
      ],
    });

    service = TestBed.inject(AccountApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("should get user profile", () => {
    const mockProfile: KeycloakUserProfile = {
      id: "u-123",
      username: "eyad",
      email: "eyad@example.com",
      firstName: "Eyad",
      lastName: "Sharkawy",
    };

    service.getProfile().subscribe(profile => {
      expect(profile).toEqual(mockProfile);
    });

    const req = httpTesting.expectOne(baseUrl);
    expect(req.request.method).toBe("GET");
    req.flush(mockProfile);
  });

  it("should update user profile", () => {
    const updateData: Partial<KeycloakUserProfile> = {
      firstName: "Eyad",
      lastName: "Sharkawy Updated",
    };

    const mockResponse: KeycloakUserProfile = {
      username: "eyad",
      email: "eyad@example.com",
      firstName: "Eyad",
      lastName: "Sharkawy Updated",
    };

    service.updateProfile(updateData).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne(baseUrl);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(updateData);
    req.flush(mockResponse);
  });

  it("should get linked accounts", () => {
    const mockLinked: LinkedAccount[] = [
      {
        providerName: "Google",
        providerAlias: "google",
        displayName: "Google",
        linked: true,
        social: true,
        connectedAs: "eyad@gmail.com",
      },
      {
        providerName: "GitHub",
        providerAlias: "github",
        displayName: "GitHub",
        linked: false,
        social: true,
      },
    ];

    service.getLinkedAccounts().subscribe(accounts => {
      expect(accounts).toEqual(mockLinked);
    });

    const req = httpTesting.expectOne(`${baseUrl}/linked-accounts`);
    expect(req.request.method).toBe("GET");
    req.flush(mockLinked);
  });

  it("should unlink account", () => {
    service.unlinkAccount("google").subscribe(res => {
      expect(res).toBeNull();
    });

    const req = httpTesting.expectOne(`${baseUrl}/linked-accounts/google`);
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });

  it("should generate correct link account URL", () => {
    const linkUrl = service.getLinkAccountUrl("github", "https://example.com/workspaces");
    expect(linkUrl).toContain(
      "/realms/agency-os-realm/broker/github/link?client_id=agency-os-frontend&redirect_uri=",
    );
    expect(linkUrl).toContain(encodeURIComponent("https://example.com/workspaces"));
  });

  it("should change password", () => {
    const changeReq: PasswordChangeRequest = {
      currentPassword: "OldPassword123!",
      newPassword: "NewPassword123!",
      confirmation: "NewPassword123!",
    };

    service.changePassword(changeReq).subscribe();

    const req = httpTesting.expectOne(`${baseUrl}/credentials/password`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(changeReq);
    req.flush(null);
  });

  it("should get sessions", () => {
    const mockSessions: UserSession[] = [
      {
        id: "sess-1",
        ipAddress: "127.0.0.1",
        started: 1700000000,
        lastAccess: 1700001000,
        browser: "Chrome / Windows",
        current: true,
      },
    ];

    service.getSessions().subscribe(sessions => {
      expect(sessions).toEqual(mockSessions);
    });

    const req = httpTesting.expectOne(`${baseUrl}/sessions`);
    expect(req.request.method).toBe("GET");
    req.flush(mockSessions);
  });

  it("should terminate a session", () => {
    service.terminateSession("sess-2").subscribe();

    const req = httpTesting.expectOne(`${baseUrl}/sessions/sess-2`);
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });
});
