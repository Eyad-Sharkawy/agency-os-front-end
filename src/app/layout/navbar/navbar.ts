import { Component, inject, signal } from "@angular/core";
import { LogoComponent } from "../../shared/components/logo/logo";
import { Icons } from "../../shared/components/icons/icons";
import { Button } from "../../shared/components/button/button";
import { provideIcons } from "@ng-icons/core";
import { lucideMenu, lucideX } from "@ng-icons/lucide";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { DropdownMenu } from "./dropdown-menu/dropdown-menu";
import { ProfileMenu } from "./profile-menu/profile-menu";
import { ThemeToggle } from "./theme-toggle/theme-toggle";
import { simpleGithub } from "@ng-icons/simple-icons";
import { AuthStore } from "../../core/auth/stores/auth.store";

@Component({
  selector: "aos-navbar",
  imports: [
    LogoComponent,
    Icons,
    Button,
    RouterLink,
    DropdownMenu,
    ProfileMenu,
    RouterLinkActive,
    ThemeToggle,
  ],
  providers: [provideIcons({ lucideMenu, lucideX, simpleGithub })],
  templateUrl: "./navbar.html",
  host: {
    class: "sticky top-0 z-50 block w-full",
  },
})
export class Navbar {
  readonly authStore = inject(AuthStore);
  isMenuOpen = signal(false);
  showAnnouncement = signal(true);

  dismissAnnouncement(): void {
    this.showAnnouncement.set(false);
  }

  toggleMenu(): void {
    this.isMenuOpen.update(open => !open);
  }

  onSignIn(): void {
    this.authStore.login();
  }

  onSignUp(): void {
    this.authStore.register();
  }

  onSignOut(): void {
    this.authStore.logout();
  }
}
