import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  output,
  signal,
} from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import {
  lucideArrowRight,
  lucideBuilding2,
  lucideCheck,
  lucideCheckSquare,
  lucideChevronDown,
  lucideClock,
  lucideExternalLink,
  lucideFolderKanban,
  lucideLayoutDashboard,
  lucideLogOut,
  lucideMoon,
  lucidePlus,
  lucideReceipt,
  lucideSettings,
  lucideSun,
  lucideUser,
  lucideUsers,
  lucideX,
} from "@ng-icons/lucide";
import { WorkspaceResponse } from "../../core/api/models";
import { AuthStore } from "../../core/auth/stores/auth.store";
import { WorkspaceStore } from "../../core/multitenancy/workspace.store";
import { ProfileModalService } from "../../features/profile/services/profile-modal.service";
import { Theme } from "../../core/services/theme";
import { Icons } from "../../shared/components/icons/icons";
import { LogoComponent } from "../../shared/components/logo/logo";

export interface NavItem {
  label: string;
  route: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: "aos-sidebar",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Icons, LogoComponent],
  providers: [
    provideIcons({
      lucideLayoutDashboard,
      lucideUsers,
      lucideFolderKanban,
      lucideCheckSquare,
      lucideClock,
      lucideReceipt,
      lucideBuilding2,
      lucideSettings,
      lucideLogOut,
      lucideChevronDown,
      lucideCheck,
      lucidePlus,
      lucideArrowRight,
      lucideX,
      lucideSun,
      lucideMoon,
      lucideUser,
      lucideExternalLink,
    }),
  ],
  templateUrl: "./sidebar.html",
  host: {
    class: "flex flex-col h-full",
  },
})
export class Sidebar {
  private readonly elementRef = inject(ElementRef);
  private readonly router = inject(Router);
  private readonly profileModalService = inject(ProfileModalService);
  readonly workspaceStore = inject(WorkspaceStore);
  readonly authStore = inject(AuthStore);
  readonly themeService = inject(Theme);

  readonly closeMobile = output<void>();

  readonly isWorkspaceMenuOpen = signal(false);

  readonly activeWorkspace = computed(() => this.workspaceStore.activeWorkspace());
  readonly workspaces = computed(() => this.workspaceStore.workspaces());
  readonly currentUser = computed(() => this.authStore.user());

  readonly canManageActiveWorkspace = computed(() => {
    const role = this.activeWorkspace()?.role;
    return role === "OWNER" || role === "ADMIN";
  });

  readonly userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return "";
    const first = user.firstName?.[0] ?? "";
    const last = user.lastName?.[0] ?? "";
    return (first + last).toUpperCase() || user.username?.slice(0, 2).toUpperCase() || "U";
  });

  readonly activeInitials = computed(() => {
    const name = this.activeWorkspace()?.name;
    if (!name) return "OS";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  readonly navItems = computed<NavItem[]>(() => {
    const tenantId = this.activeWorkspace()?.tenantId || "";
    const base = tenantId ? `/w/${tenantId}` : "/workspaces";
    return [
      { label: "Overview", route: base, icon: "lucideLayoutDashboard", exact: true },
      { label: "Clients", route: `${base}/clients`, icon: "lucideUsers" },
      { label: "Projects", route: `${base}/projects`, icon: "lucideFolderKanban" },
      { label: "Tasks", route: `${base}/tasks`, icon: "lucideCheckSquare" },
      { label: "Time Tracking", route: `${base}/time-tracking`, icon: "lucideClock" },
      { label: "Invoices", route: `${base}/invoices`, icon: "lucideReceipt" },
    ];
  });

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isWorkspaceMenuOpen.set(false);
    }
  }

  toggleWorkspaceMenu(): void {
    this.isWorkspaceMenuOpen.update(open => !open);
  }

  selectWorkspace(ws: WorkspaceResponse): void {
    this.workspaceStore.setActiveWorkspace(ws);
    this.isWorkspaceMenuOpen.set(false);
    void this.router.navigate(["/w", ws.tenantId]);
    this.closeMobile.emit();
  }

  onManageAccount(): void {
    this.profileModalService.open("personal");
    this.closeMobile.emit();
  }

  onSignOut(): void {
    this.authStore.logout();
  }
}
