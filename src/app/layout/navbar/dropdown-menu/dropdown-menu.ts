import { Component, ElementRef, inject, model } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import {
  lucideBuilding2,
  lucideChevronRight,
  lucideExternalLink,
  lucideMoon,
  lucideSettings,
  lucideSun,
  lucideUser,
} from "@ng-icons/lucide";
import { simpleGithub } from "@ng-icons/simple-icons";
import { AuthStore } from "../../../core/auth/stores/auth.store";
import { ProfileModalService } from "../../../features/profile/services/profile-modal.service";
import { Theme } from "../../../core/services/theme";
import { Button } from "../../../shared/components/button/button";
import { Icons } from "../../../shared/components/icons/icons";

@Component({
  selector: "aos-dropdown-menu",
  imports: [Button, Icons, RouterLink, RouterLinkActive],
  providers: [
    provideIcons({
      simpleGithub,
      lucideSun,
      lucideMoon,
      lucideUser,
      lucideSettings,
      lucideChevronRight,
      lucideExternalLink,
      lucideBuilding2,
    }),
  ],
  templateUrl: "./dropdown-menu.html",
  host: {
    class: "contents",
    "(document:click)": "onDocumentClick($event)",
    "(keydown.escape)": "onEscape();",
  },
})
export class DropdownMenu {
  private readonly elementRef = inject(ElementRef);
  private readonly profileModalService = inject(ProfileModalService);
  readonly themeService = inject(Theme);
  readonly authStore = inject(AuthStore);

  readonly isOpen = model<boolean>(false);

  toggle(): void {
    this.isOpen.update(open => !open);
  }

  close(): void {
    this.isOpen.set(false);
  }

  onSignIn(): void {
    this.close();
    this.authStore.login();
  }

  onSignUp(): void {
    this.close();
    this.authStore.register();
  }

  onManageAccount(): void {
    this.close();
    this.profileModalService.open("personal");
  }

  onSignOut(): void {
    this.close();
    this.authStore.logout();
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  onEscape(): void {
    if (this.isOpen()) {
      this.close();
    }
  }
}
