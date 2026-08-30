import { Component, inject, OnInit, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideCheck,
  lucideCheckCircle2,
  lucideLoader2,
  lucideLock,
  lucideSave,
} from "@ng-icons/lucide";
import { AccountApiService } from "../../../../core/api/services/account/account-api.service";
import { AuthStore } from "../../../../core/auth/stores/auth.store";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";

@Component({
  selector: "aos-profile-personal-tab",
  standalone: true,
  imports: [ReactiveFormsModule, Icons, Button],
  providers: [
    provideIcons({
      lucideSave,
      lucideLoader2,
      lucideCheckCircle2,
      lucideAlertCircle,
      lucideCheck,
      lucideLock,
    }),
  ],
  templateUrl: "./profile-personal-tab.html",
})
export class ProfilePersonalTab implements OnInit {
  private readonly accountApi = inject(AccountApiService);
  readonly authStore = inject(AuthStore);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isUsernameReadOnly = signal(false);
  readonly isEmailReadOnly = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly form = new FormGroup({
    username: new FormControl("", [Validators.required, Validators.minLength(2)]),
    email: new FormControl("", [Validators.required, Validators.email]),
    firstName: new FormControl("", [Validators.required]),
    lastName: new FormControl("", [Validators.required]),
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    const current = this.authStore.user();
    if (current) {
      this.form.patchValue({
        username: current.username || "",
        email: current.email || "",
        firstName: current.firstName || "",
        lastName: current.lastName || "",
      });
    }

    this.isLoading.set(true);
    this.accountApi.getProfile().subscribe({
      next: profile => {
        this.isLoading.set(false);
        this.form.patchValue({
          username: profile.username || "",
          email: profile.email || "",
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
        });

        // Check if realm policy marks attributes as readOnly
        const attrs = profile.userProfileMetadata?.attributes;
        if (attrs && Array.isArray(attrs)) {
          const userAttr = attrs.find(a => a.name === "username");
          if (userAttr?.readOnly) {
            this.isUsernameReadOnly.set(true);
          }
          const emailAttr = attrs.find(a => a.name === "email");
          if (emailAttr?.readOnly) {
            this.isEmailReadOnly.set(true);
          }
        }
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSaving()) return;

    this.isSaving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const values = this.form.getRawValue();
    const updatePayload: Record<string, string | undefined> = {
      firstName: values.firstName || undefined,
      lastName: values.lastName || undefined,
    };

    if (!this.isUsernameReadOnly()) {
      updatePayload["username"] = values.username || undefined;
    }
    if (!this.isEmailReadOnly()) {
      updatePayload["email"] = values.email || undefined;
    }

    this.accountApi.updateProfile(updatePayload).subscribe({
      next: updated => {
        this.isSaving.set(false);
        this.authStore.updateUser({
          username: updated.username || values.username || "",
          email: updated.email || values.email || "",
          firstName: updated.firstName || values.firstName || "",
          lastName: updated.lastName || values.lastName || "",
        });
        this.successMessage.set("Profile updated successfully");
      },
      error: err => {
        this.isSaving.set(false);
        this.errorMessage.set(
          err?.error?.errorMessage ||
            err?.error?.error ||
            err?.message ||
            "Failed to update profile. Some fields may be restricted by realm policy.",
        );
      },
    });
  }
}
