import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideArrowLeft,
  lucideArrowRight,
  lucideBuilding2,
  lucideCheck,
  lucideCheckCircle2,
  lucideLayers,
  lucideLoader2,
  lucideLock,
  lucideMail,
  lucideShieldCheck,
  lucideSparkles,
} from "@ng-icons/lucide";
import { WorkspaceApi } from "../../../../core/api/services/workspace/workspace-api";
import { WorkspaceStore } from "../../../../core/multitenancy/workspace.store";
import { AuthStore } from "../../../../core/auth/stores/auth.store";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { LogoComponent } from "../../../../shared/components/logo/logo";

@Component({
  selector: "aos-create-workspace",
  standalone: true,
  imports: [FormsModule, RouterLink, Button, Icons, LogoComponent],
  providers: [
    provideIcons({
      lucideBuilding2,
      lucideMail,
      lucideShieldCheck,
      lucideSparkles,
      lucideArrowLeft,
      lucideArrowRight,
      lucideCheck,
      lucideCheckCircle2,
      lucideLoader2,
      lucideAlertCircle,
      lucideLayers,
      lucideLock,
    }),
  ],
  templateUrl: "./create-workspace.html",
  styleUrl: "./create-workspace.css",
})
export class CreateWorkspace {
  private readonly workspaceService = inject(WorkspaceApi);
  private readonly workspaceStore = inject(WorkspaceStore);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  // Form State (Workspace name only, email is tied to the authenticated user)
  readonly workspaceName = signal("");

  // Submission State
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Live Computed Previews
  readonly slugPreview = computed(() => {
    const raw = this.workspaceName().trim().toLowerCase();
    if (!raw) return "tenant_your_workspace";
    const sanitized = raw
      .replace(/[^a-z0-9\s-_]/g, "")
      .replace(/[\s-_]+/g, "_")
      .slice(0, 24);
    return `tenant_${sanitized}`;
  });

  readonly initialsPreview = computed(() => {
    const name = this.workspaceName().trim();
    if (!name) return "WS";
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  readonly isFormValid = computed(() => {
    return this.workspaceName().trim().length >= 2;
  });

  onSubmit(): void {
    if (!this.isFormValid() || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload = {
      name: this.workspaceName().trim(),
      contactEmail: this.authStore.userEmail() || "",
    };

    this.workspaceService.createWorkspace(payload).subscribe({
      next: createdWorkspace => {
        this.isSubmitting.set(false);
        this.workspaceStore.setActiveWorkspace(createdWorkspace);
        this.router.navigate(["/"]);
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to create workspace. Please try again.");
        this.errorMessage.set(detail);
      },
    });
  }
}
