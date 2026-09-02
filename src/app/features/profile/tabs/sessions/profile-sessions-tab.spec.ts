import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { UserSession } from "../../../../core/api/models/account.models";
import { AccountApiService } from "../../../../core/api/services/account/account-api.service";
import { ENVIRONMENT } from "../../../../core/tokens/enviroment/environment.token";
import { environment } from "../../../../../environments/environment";
import { ProfileSessionsTab } from "./profile-sessions-tab";

describe("ProfileSessionsTab Component", () => {
  let component: ProfileSessionsTab;
  let fixture: ComponentFixture<ProfileSessionsTab>;
  let mockAccountApi: {
    getSessions: ReturnType<typeof vi.fn>;
    terminateSession: ReturnType<typeof vi.fn>;
  };

  const mockSessions: UserSession[] = [
    {
      id: "sess-1",
      ipAddress: "192.168.1.1",
      started: 1700000000000,
      lastAccess: 1700001000000,
      browser: "Chrome / macOS",
      current: true,
    },
    {
      id: "sess-2",
      ipAddress: "192.168.1.2",
      started: 1700000000000,
      lastAccess: 1700001000000,
      browser: "Firefox / Windows",
      current: false,
    },
  ];

  beforeEach(async () => {
    mockAccountApi = {
      getSessions: vi.fn().mockReturnValue(of(mockSessions)),
      terminateSession: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [ProfileSessionsTab],
      providers: [
        { provide: ENVIRONMENT, useValue: environment },
        { provide: AccountApiService, useValue: mockAccountApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSessionsTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 30000);

  it("should load sessions on init and allow refresh", () => {
    expect(component).toBeTruthy();
    expect(component.sessions()).toEqual(mockSessions);

    component.loadSessions();
    expect(mockAccountApi.getSessions).toHaveBeenCalledTimes(2);
  });

  it("should format timestamps correctly", () => {
    const formatted = component.formatDate(1700000000000);
    expect(formatted).toBeTruthy();
    expect(component.formatDate(undefined)).toBe("Unknown");
  });

  it("should terminate remote session", () => {
    component.onTerminate(mockSessions[1]);

    expect(mockAccountApi.terminateSession).toHaveBeenCalledWith("sess-2");
    expect(component.terminatingId()).toBeNull();
    expect(component.successMessage()).toContain("terminated successfully");
  });

  it("should handle error when termination fails", () => {
    mockAccountApi.terminateSession.mockReturnValue(
      throwError(() => ({ error: { errorMessage: "Failed to terminate" } })),
    );

    component.onTerminate(mockSessions[1]);

    expect(component.errorMessage()).toBe("Failed to terminate");
  });
});
