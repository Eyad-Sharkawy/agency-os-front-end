import { Component, computed, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { filter, map, startWith } from "rxjs";
import { provideIcons } from "@ng-icons/core";
import { lucideMenu, lucideSlidersHorizontal } from "@ng-icons/lucide";
import { WorkspaceStore } from "../../core/multitenancy/workspace.store";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";
import { Sidebar } from "../sidebar/sidebar";

@Component({
  selector: "aos-dashboard-shell",
  standalone: true,
  imports: [RouterOutlet, Sidebar, Icons, Button],
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

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects || e.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly currentSectionTitle = computed(() => {
    const url = this.currentUrl() || this.router.url || "";
    if (url.includes("/clients")) return "Clients";
    if (url.includes("/projects")) return "Projects";
    if (url.includes("/tasks")) return "Tasks";
    if (url.includes("/time-tracking")) return "Time Tracking";
    if (url.includes("/invoices")) return "Invoices";
    return "Overview";
  });

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen.update(v => !v);
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen.set(false);
  }
}
