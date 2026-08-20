import { Component, signal } from "@angular/core";
import { LogoComponent } from "../../shared/components/logo/logo";
import { Icons } from "../../shared/components/icons/icons";
import { Button } from "../../shared/components/button/button";
import { provideIcons } from "@ng-icons/core";
import { lucideMenu, lucideX } from "@ng-icons/lucide";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { DropdownMenu } from "./dropdown-menu/dropdown-menu";
import { simpleGithub } from "@ng-icons/simple-icons";

@Component({
  selector: "aos-navbar",
  imports: [LogoComponent, Icons, Button, RouterLink, DropdownMenu, RouterLinkActive],
  providers: [provideIcons({ lucideMenu, lucideX, simpleGithub })],
  templateUrl: "./navbar.html",
  styleUrl: "./navbar.css",
})
export class Navbar {
  isMenuOpen = signal(false);

  toggleMenu(): void {
    this.isMenuOpen.update(open => !open);
  }
}
