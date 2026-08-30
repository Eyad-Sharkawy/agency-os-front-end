import { Component, inject, OnInit, signal } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideCheckCircle2,
  lucideGlobe,
  lucideLaptop,
  lucideLoader2,
  lucideMonitor,
  lucideRefreshCw,
  lucideSmartphone,
  lucideTrash2,
} from "@ng-icons/lucide";
import { UserSession } from "../../../../core/api/models/account.models";
import { AccountApiService } from "../../../../core/api/services/account/account-api.service";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";

@Component({
  selector: "aos-profile-sessions-tab",
  standalone: true,
  imports: [Icons, Button],
  providers: [
    provideIcons({
      lucideMonitor,
      lucideSmartphone,
      lucideLaptop,
      lucideGlobe,
      lucideTrash2,
      lucideLoader2,
      lucideCheckCircle2,
      lucideAlertCircle,
      lucideRefreshCw,
    }),
  ],
  templateUrl: "./profile-sessions-tab.html",
})
export class ProfileSessionsTab implements OnInit {
  private readonly accountApi = inject(AccountApiService);

  readonly sessions = signal<UserSession[]>([]);
  readonly isLoading = signal(false);
  readonly terminatingId = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.accountApi.getSessions().subscribe({
      next: data => {
        this.isLoading.set(false);
        this.sessions.set(data || []);
      },
      error: () => {
        this.isLoading.set(false);
        // Fallback placeholder current session
        this.sessions.set([
          {
            id: "current-session",
            ipAddress: "Current IP",
            started: Date.now() - 3600000,
            lastAccess: Date.now(),
            browser: "Active Web Browser",
            current: true,
          },
        ]);
      },
    });
  }

  formatDate(timestamp?: number): string {
    if (!timestamp) return "Unknown";
    // Timestamps from Keycloak can be either in seconds or ms
    const timeMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    return new Date(timeMs).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  onTerminate(session: UserSession): void {
    if (this.terminatingId()) return;

    this.terminatingId.set(session.id);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.accountApi.terminateSession(session.id).subscribe({
      next: () => {
        this.terminatingId.set(null);
        this.successMessage.set("Session terminated successfully.");
        this.loadSessions();
      },
      error: err => {
        this.terminatingId.set(null);
        this.errorMessage.set(
          err?.error?.errorMessage || err?.message || "Failed to terminate session.",
        );
      },
    });
  }
}
