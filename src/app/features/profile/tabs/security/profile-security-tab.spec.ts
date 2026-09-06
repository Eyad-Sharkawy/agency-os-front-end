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

  it("should render template elements for error, success, toggles, and saving state", () => {
    component.successMessage.set("Password changed successfully.");
    component.errorMessage.set("Something went wrong.");
    component.showCurrentPassword.set(true);
    component.showNewPassword.set(true);
    component.showConfirmPassword.set(true);
    component.isSaving.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Password changed successfully.");
    expect(compiled.textContent).toContain("Something went wrong.");
    expect(compiled.textContent).toContain("Updating Password...");

    // Password mismatch message
    component.isSaving.set(false);
    component.passwordForm.patchValue({
      newPassword: "Password123!",
      confirmation: "Different123!",
    });
    component.passwordForm.get("confirmation")?.markAsTouched();
    fixture.detectChanges();
    expect(compiled.textContent).toContain("Passwords do not match.");
  });

  it("should not submit if form is invalid or already saving", () => {
    mockAccountApi.changePassword.mockClear();
    component.onSubmit();
    expect(mockAccountApi.changePassword).not.toHaveBeenCalled();

    component.passwordForm.patchValue({
      currentPassword: "OldPassword123!",
      newPassword: "NewPassword123!",
      confirmation: "NewPassword123!",
    });
    component.isSaving.set(true);
    component.onSubmit();
    expect(mockAccountApi.changePassword).not.toHaveBeenCalled();
  });

  it("should handle alternative error structures in changePassword", () => {
    mockAccountApi.changePassword.mockReturnValue(
      throwError(() => ({ error: { error: "Direct error format" } })),
    );
    component.isSaving.set(false);
    component.passwordForm.patchValue({
      currentPassword: "OldPassword123!",
      newPassword: "NewPassword123!",
      confirmation: "NewPassword123!",
    });
    component.onSubmit();
    expect(component.errorMessage()).toBe("Direct error format");

    mockAccountApi.changePassword.mockReturnValue(throwError(() => new Error("Message format")));
    component.onSubmit();
    expect(component.errorMessage()).toBe("Message format");

    mockAccountApi.changePassword.mockReturnValue(throwError(() => ({})));
    component.onSubmit();
    expect(component.errorMessage()).toContain("Failed to update password");
  });
});
