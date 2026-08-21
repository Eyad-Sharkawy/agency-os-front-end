import { Component, inject, signal } from "@angular/core";
import { LogoComponent } from "../../shared/components/logo/logo";
import { Icons } from "../../shared/components/icons/icons";
import { Button } from "../../shared/components/button/button";
import { provideIcons } from "@ng-icons/core";
import { lucideMenu, lucideMoon, lucideSun, lucideX } from "@ng-icons/lucide";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { DropdownMenu } from "./dropdown-menu/dropdown-menu";
import { simpleGithub } from "@ng-icons/simple-icons";
import { ThemeService } from "../../core/services/theme.service";

@Component({
  selector: "aos-navbar",
  imports: [LogoComponent, Icons, Button, RouterLink, DropdownMenu, RouterLinkActive],
  providers: [provideIcons({ lucideMenu, lucideX, simpleGithub, lucideSun, lucideMoon })],
  templateUrl: "./navbar.html",
  styleUrl: "./navbar.css",
  host: {
    class: "sticky top-0 z-50 block w-full",
  },
})
export class Navbar {
  readonly themeService = inject(ThemeService);
  isMenuOpen = signal(false);

  toggleMenu(): void {
    this.isMenuOpen.update(open => !open);
  }
}
