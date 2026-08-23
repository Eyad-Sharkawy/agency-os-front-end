import { Component, ElementRef, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthStore } from "../../../core/auth/auth.store";
import { Icons } from "../../../shared/components/icons/icons";
import { provideIcons } from "@ng-icons/core";
import { lucideBuilding2, lucideLogOut } from "@ng-icons/lucide";

@Component({
  selector: "aos-profile-menu",
  imports: [Icons, RouterLink],
  providers: [provideIcons({ lucideLogOut, lucideBuilding2 })],
  templateUrl: "./profile-menu.html",
  styleUrl: "./profile-menu.css",
  host: {
    class: "relative inline-block",
    "(document:click)": "onDocumentClick($event)",
    "(keydown.escape)": "onEscape()",
  },
})
export class ProfileMenu {
  private readonly elementRef = inject(ElementRef);
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

  onSignOut(): void {
    this.close();
    this.authStore.logout();
  }
}
