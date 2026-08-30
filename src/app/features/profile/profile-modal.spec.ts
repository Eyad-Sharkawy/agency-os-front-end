import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter } from "@angular/router";
import { AccountApiService } from "../../core/api/services/account/account-api.service";
import { AuthStore } from "../../core/auth/stores/auth.store";
import { ENVIRONMENT } from "../../core/tokens/enviroment/environment.token";
import { environment } from "../../../environments/environment";
import { ProfileModal } from "./profile-modal";
import { ProfileModalService } from "./services/profile-modal.service";
import { of } from "rxjs";

describe("ProfileModal Component", () => {
  let component: ProfileModal;
  let fixture: ComponentFixture<ProfileModal>;
  let modalService: ProfileModalService;
  let mockAccountApi: {
    getProfile: ReturnType<typeof vi.fn>;
    getLinkedAccounts: ReturnType<typeof vi.fn>;
    getSessions: ReturnType<typeof vi.fn>;
  };
  let mockAuthStore: {
    user: ReturnType<typeof vi.fn>;
    username: ReturnType<typeof vi.fn>;
    userEmail: ReturnType<typeof vi.fn>;
    initials: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockAccountApi = {
      getProfile: vi.fn().mockReturnValue(
        of({
          username: "eyad",
          email: "eyad@example.com",
          firstName: "Eyad",
          lastName: "Sharkawy",
        }),
      ),
      getLinkedAccounts: vi.fn().mockReturnValue(of([])),
      getSessions: vi.fn().mockReturnValue(of([])),
    };

    mockAuthStore = {
      user: vi.fn().mockReturnValue({
        username: "eyad",
        email: "eyad@example.com",
        firstName: "Eyad",
        lastName: "Sharkawy",
      }),
      username: vi.fn().mockReturnValue("eyad"),
      userEmail: vi.fn().mockReturnValue("eyad@example.com"),
      initials: vi.fn().mockReturnValue("ES"),
    };

    await TestBed.configureTestingModule({
      imports: [ProfileModal],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        ProfileModalService,
        { provide: ENVIRONMENT, useValue: environment },
        { provide: AccountApiService, useValue: mockAccountApi },
        { provide: AuthStore, useValue: mockAuthStore },
      ],
    }).compileComponents();

    modalService = TestBed.inject(ProfileModalService);
    fixture = TestBed.createComponent(ProfileModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should switch tabs and close modal", () => {
    modalService.open("personal");
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    expect(component.activeTab()).toBe("personal");

    component.setTab("security");
    expect(component.activeTab()).toBe("security");

    component.onClose();
    expect(component.isOpen()).toBe(false);
  });
});
