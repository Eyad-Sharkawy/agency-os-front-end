import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { AccountApiService } from "../../../../core/api/services/account/account-api.service";
import { ENVIRONMENT } from "../../../../core/tokens/enviroment/environment.token";
import { environment } from "../../../../../environments/environment";
import { ProfileSecurityTab } from "./profile-security-tab";

describe("ProfileSecurityTab Component", () => {
  let component: ProfileSecurityTab;
  let fixture: ComponentFixture<ProfileSecurityTab>;
  let mockAccountApi: {
    changePassword: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockAccountApi = {
      changePassword: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [ProfileSecurityTab],
      providers: [
        { provide: ENVIRONMENT, useValue: environment },
        { provide: AccountApiService, useValue: mockAccountApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSecurityTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
    expect(component.passwordForm.valid).toBe(false);
  });

  it("should toggle password visibility flags", () => {
    expect(component.showCurrentPassword()).toBe(false);
    component.showCurrentPassword.set(true);
    expect(component.showCurrentPassword()).toBe(true);

    expect(component.showNewPassword()).toBe(false);
    component.showNewPassword.set(true);
    expect(component.showNewPassword()).toBe(true);

    expect(component.showConfirmPassword()).toBe(false);
    component.showConfirmPassword.set(true);
    expect(component.showConfirmPassword()).toBe(true);
  });

  it("should validate passwords match", () => {
    component.passwordForm.patchValue({
      currentPassword: "OldPassword123!",
      newPassword: "NewPassword123!",
      confirmation: "Mismatch123!",
    });
    expect(component.passwordsMatch).toBe(false);

    component.passwordForm.patchValue({
      confirmation: "NewPassword123!",
    });
    expect(component.passwordsMatch).toBe(true);
  });

  it("should submit password change on valid match", () => {
    component.passwordForm.patchValue({
      currentPassword: "OldPassword123!",
      newPassword: "NewPassword123!",
      confirmation: "NewPassword123!",
    });

    component.onSubmit();

    expect(mockAccountApi.changePassword).toHaveBeenCalledWith({
      currentPassword: "OldPassword123!",
      newPassword: "NewPassword123!",
      confirmation: "NewPassword123!",
    });
    expect(component.successMessage()).toContain("changed successfully");
  });

  it("should handle error when password change fails", () => {
    mockAccountApi.changePassword.mockReturnValue(
      throwError(() => ({ error: { errorMessage: "Invalid current password" } })),
    );

    component.passwordForm.patchValue({
      currentPassword: "WrongPassword!",
      newPassword: "NewPassword123!",
      confirmation: "NewPassword123!",
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe("Invalid current password");
  });
});
