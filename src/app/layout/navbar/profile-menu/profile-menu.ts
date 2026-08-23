import { Component, ElementRef, inject, signal } from "@angular/core";
import { AuthStore } from "../../../core/auth/auth.store";
import { Icons } from "../../../shared/components/icons/icons";
import { provideIcons } from "@ng-icons/core";
import { lucideLogOut } from "@ng-icons/lucide";

@Component({
  selector: "aos-profile-menu",
  imports: [Icons],
  providers: [provideIcons({ lucideLogOut })],
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
