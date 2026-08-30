import { Component, inject, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideCheckCircle2,
  lucideEye,
  lucideEyeOff,
  lucideKey,
  lucideLoader2,
  lucideLock,
  lucideShieldCheck,
} from "@ng-icons/lucide";
import { AccountApiService } from "../../../../core/api/services/account/account-api.service";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";

@Component({
  selector: "aos-profile-security-tab",
  standalone: true,
  imports: [ReactiveFormsModule, Icons, Button],
  providers: [
    provideIcons({
      lucideLock,
      lucideKey,
      lucideShieldCheck,
      lucideLoader2,
      lucideCheckCircle2,
      lucideAlertCircle,
      lucideEye,
      lucideEyeOff,
    }),
  ],
  templateUrl: "./profile-security-tab.html",
})
export class ProfileSecurityTab {
  private readonly accountApi = inject(AccountApiService);

  readonly isSaving = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly passwordForm = new FormGroup({
    currentPassword: new FormControl("", [Validators.required]),
    newPassword: new FormControl("", [Validators.required, Validators.minLength(8)]),
    confirmation: new FormControl("", [Validators.required]),
  });

  get passwordsMatch(): boolean {
    const newPwd = this.passwordForm.get("newPassword")?.value;
    const confirmPwd = this.passwordForm.get("confirmation")?.value;
    return Boolean(newPwd && confirmPwd && newPwd === confirmPwd);
  }

  onSubmit(): void {
    if (this.passwordForm.invalid || !this.passwordsMatch || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const values = this.passwordForm.getRawValue();

    this.accountApi
      .changePassword({
        currentPassword: values.currentPassword || "",
        newPassword: values.newPassword || "",
        confirmation: values.confirmation || "",
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.passwordForm.reset();
          this.successMessage.set("Your password has been changed successfully.");
        },
        error: err => {
          this.isSaving.set(false);
          this.errorMessage.set(
            err?.error?.errorMessage ||
              err?.error?.error ||
              err?.message ||
              "Failed to update password. Please check your current password.",
          );
        },
      });
  }
}
