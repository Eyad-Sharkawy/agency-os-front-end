import { Component, computed, inject, signal } from "@angular/core";
import { Router, RouterOutlet } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import { lucideMenu, lucideSlidersHorizontal } from "@ng-icons/lucide";
import { WorkspaceStore } from "../../core/multitenancy/workspace.store";
import { ProfileModal } from "../../features/profile/profile-modal";
import { Icons } from "../../shared/components/icons/icons";
import { Sidebar } from "../sidebar/sidebar";

@Component({
  selector: "aos-dashboard-shell",
  standalone: true,
  imports: [RouterOutlet, Sidebar, Icons, ProfileModal],
  providers: [provideIcons({ lucideMenu, lucideSlidersHorizontal })],
  templateUrl: "./dashboard-shell.html",
  host: {
    class: "flex flex-col flex-1 min-h-0 bg-canvas text-ink",
  },
})
export class DashboardShell {
  private readonly router = inject(Router);
  readonly workspaceStore = inject(WorkspaceStore);

  readonly isMobileSidebarOpen = signal(false);

  readonly activeWorkspace = computed(() => this.workspaceStore.activeWorkspace());

  readonly currentSectionTitle = computed(() => {
    const url = this.router.url;
    if (url.includes("/clients")) return "Clients";
    if (url.includes("/projects")) return "Projects";
    if (url.includes("/tasks")) return "Tasks";
    if (url.includes("/time-tracking")) return "Time Tracking";
    if (url.includes("/invoices")) return "Invoices";
    return "Dashboard";
  });

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen.update(v => !v);
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen.set(false);
  }
}
