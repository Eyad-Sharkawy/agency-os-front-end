import { provideHttpClient } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { AccountApiService } from "../../../../core/api/services/account/account-api.service";
import { AuthStore } from "../../../../core/auth/stores/auth.store";
import { ENVIRONMENT } from "../../../../core/tokens/enviroment/environment.token";
import { environment } from "../../../../../environments/environment";
import { ProfilePersonalTab } from "./profile-personal-tab";

describe("ProfilePersonalTab Component", () => {
  let component: ProfilePersonalTab;
  let fixture: ComponentFixture<ProfilePersonalTab>;
  let mockAccountApi: {
    getProfile: ReturnType<typeof vi.fn>;
    updateProfile: ReturnType<typeof vi.fn>;
  };
  let mockAuthStore: {
    user: ReturnType<typeof vi.fn>;
    initials: ReturnType<typeof vi.fn>;
    updateUser: ReturnType<typeof vi.fn>;
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
      updateProfile: vi.fn().mockReturnValue(
        of({
          username: "eyad",
          email: "eyad@example.com",
          firstName: "Eyad",
          lastName: "Sharkawy",
        }),
      ),
    };

    mockAuthStore = {
      user: vi.fn().mockReturnValue({
        username: "eyad",
        email: "eyad@example.com",
        firstName: "Eyad",
        lastName: "Sharkawy",
      }),
      initials: vi.fn().mockReturnValue("ES"),
      updateUser: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProfilePersonalTab],
      providers: [
        provideHttpClient(),
        { provide: ENVIRONMENT, useValue: environment },
        { provide: AccountApiService, useValue: mockAccountApi },
        { provide: AuthStore, useValue: mockAuthStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePersonalTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create and populate form with profile data", () => {
    expect(component).toBeTruthy();
    expect(component.form.get("username")?.value).toBe("eyad");
    expect(component.form.get("email")?.value).toBe("eyad@example.com");
    expect(component.form.get("firstName")?.value).toBe("Eyad");
    expect(component.form.get("lastName")?.value).toBe("Sharkawy");
  });

  it("should submit form and update user on success", () => {
    component.form.patchValue({
      firstName: "Eyad New",
      lastName: "Sharkawy New",
    });

    component.onSubmit();

    expect(mockAccountApi.updateProfile).toHaveBeenCalledWith({
      username: "eyad",
      email: "eyad@example.com",
      firstName: "Eyad New",
      lastName: "Sharkawy New",
    });
    expect(mockAuthStore.updateUser).toHaveBeenCalled();
    expect(component.successMessage()).toBe("Profile updated successfully");
  });

  it("should detect read-only attributes from realm metadata and omit them on submit", () => {
    mockAccountApi.getProfile.mockReturnValue(
      of({
        username: "eyad",
        email: "eyad@example.com",
        firstName: "Eyad",
        lastName: "Sharkawy",
        userProfileMetadata: {
          attributes: [
            { name: "username", readOnly: true },
            { name: "email", readOnly: true },
          ],
        },
      }),
    );

    component.loadProfile();
    expect(component.isUsernameReadOnly()).toBe(true);
    expect(component.isEmailReadOnly()).toBe(true);

    component.onSubmit();

    expect(mockAccountApi.updateProfile).toHaveBeenCalledWith({
      firstName: "Eyad",
      lastName: "Sharkawy",
    });
  });

  it("should display error message when update fails", () => {
    mockAccountApi.updateProfile.mockReturnValue(
      throwError(() => ({ error: { errorMessage: "Email already in use" } })),
    );

    component.onSubmit();

    expect(component.errorMessage()).toBe("Email already in use");
    expect(component.isSaving()).toBe(false);
  });
});
