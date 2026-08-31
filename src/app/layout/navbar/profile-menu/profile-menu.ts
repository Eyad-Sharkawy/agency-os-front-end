import { Component, ElementRef, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import {
  lucideBuilding2,
  lucideChevronRight,
  lucideLogOut,
  lucideSettings,
  lucideUser,
} from "@ng-icons/lucide";
import { AuthStore } from "../../../core/auth/stores/auth.store";
import { ProfileModalService } from "../../../features/profile/services/profile-modal.service";
import { Button } from "../../../shared/components/button/button";
import { Icons } from "../../../shared/components/icons/icons";

@Component({
  selector: "aos-profile-menu",
  imports: [Icons, RouterLink, Button],
  providers: [
    provideIcons({
      lucideLogOut,
      lucideBuilding2,
      lucideUser,
      lucideSettings,
      lucideChevronRight,
    }),
  ],
  templateUrl: "./profile-menu.html",
  host: {
    class: "relative inline-block",
    "(document:click)": "onDocumentClick($event)",
    "(keydown.escape)": "onEscape()",
  },
})
export class ProfileMenu {
  private readonly elementRef = inject(ElementRef);
  private readonly profileModalService = inject(ProfileModalService);
  readonly authStore = inject(AuthStore);

  readonly isOpen = signal(false);

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen.update(open => !open);
  }

  close(): void {
    this.isOpen.set(false);
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

  onManageAccount(): void {
    this.close();
    this.profileModalService.open("personal");
  }

  onSignOut(): void {
    this.close();
    this.authStore.logout();
  }
}
